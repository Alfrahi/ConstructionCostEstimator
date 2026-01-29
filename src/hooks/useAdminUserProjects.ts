import { useOfflineSupabase } from "@/hooks/useOfflineSupabase";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const PAGE_SIZE = 5;

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  size: string | null;
  location: string | null;
  deleted_at: string | null;
}

export function useAdminUserProjects(userId?: string, initialPage = 0) {
  const { useQuery: useOfflineQuery } = useOfflineSupabase();
  const [currentPage, setCurrentPage] = useState(initialPage);

  const queryKey = ["admin_user_projects", userId, currentPage];

  const {
    data: projects = [],
    isLoading,
    error,
  } = useOfflineQuery<Project[]>({
    queryKey,
    queryFn: async () => {
      if (!userId) return [];

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .rpc("get_admin_user_projects", {
          target_user_id: userId,
        })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: totalProjectsCount = 0 } = useOfflineQuery<number>({
    queryKey: ["admin_user_projects_count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const totalPages = Math.ceil(totalProjectsCount / PAGE_SIZE) || 1;

  return {
    projects,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
    totalPages,
    PAGE_SIZE,
  };
}
