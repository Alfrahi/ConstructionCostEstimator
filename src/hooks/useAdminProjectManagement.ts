import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 10;

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  size: string | null;
  location: string | null;
  client_requirements: string | null;
  duration_days: number | null;
  deleted_at: string | null;
  user_id: string;
  owner_email: string;
}

export function useAdminProjectManagement() {
  const { t } = useTranslation(["admin", "common"]);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState("active");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(0);
  }, [search, activeTab]);

  const queryKey = ["admin_projects", currentPage, search, activeTab];

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery<Project[]>({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .rpc("get_all_projects_for_admin")
        .select(
          "id, name, description, created_at, updated_at, size, location, client_requirements, duration_days, deleted_at, user_id, owner_email",
        )
        .order("created_at", { ascending: false });

      if (search.trim()) {
        const s = search.trim();
        query = query.or(
          `name.ilike.%${s}%,description.ilike.%${s}%,location.ilike.%${s}%`,
        );
      }

      if (activeTab === "active") {
        query = query.is("deleted_at", null);
      } else {
        query = query.not("deleted_at", "is", null);
      }

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await query.range(from, to);
      if (error) throw error;
      return (data || []) as Project[];
    },
    placeholderData: (previousData) => previousData || [],
    staleTime: 1000 * 60,
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.rpc("permanent_delete_project", {
        p_project_id: projectId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void toast.success(t("admin:projects.successDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin_projects"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      void toast.error(
        t("admin:projects.errorDelete", { message: error.message }),
      );
    },
  });

  const handleDelete = (project: Project) => {
    setDeleteTarget(project);
    setIsDeleteDialogOpen(true);
  };

  const totalPages = useMemo(
    () => Math.ceil((projects?.length ?? 0) / PAGE_SIZE) ?? 1,
    [projects],
  );

  return {
    projects,
    isLoading,
    error,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    activeTab,
    setActiveTab,
    deleteTarget,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleDelete,
    deleteProjectMutation,
    totalPages,
    PAGE_SIZE,
  };
}
