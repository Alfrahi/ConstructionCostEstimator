import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSupabase } from "@/hooks/useOfflineSupabase";
import { useAuth } from "@/components/AuthProvider";

const ITEMS_PER_PAGE = 10;

interface SharedProjectData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
  owner_email?: string;
  shared_role?: string;
}

interface SharedProjectsResponse {
  data: SharedProjectData[];
  count: number;
}

export function useSharedProjects(globalSearchTerm: string) {
  const { user } = useAuth();
  const { useQuery } = useOfflineSupabase();

  const [currentPage, setCurrentPage] = useState(0);

  const queryKey = ["sharedProjects", currentPage, globalSearchTerm, user?.id];

  const {
    data: projects = { data: [], count: 0 },
    isLoading,
    error,
  } = useQuery<SharedProjectsResponse>({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return { data: [], count: 0 };

      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("project_shares")
        .select("*, projects!inner(*, profiles!inner(email))", {
          count: "exact",
        })
        .eq("shared_with_user_id", user.id)
        .is("projects.deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (globalSearchTerm) {
        query = query.or(
          `projects.name.ilike.%${globalSearchTerm}%,projects.description.ilike.%${globalSearchTerm}%`,
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const formattedData = (data || []).map((share: any) => ({
        id: share.projects.id,
        name: share.projects.name,
        description: share.projects.description,
        created_at: share.projects.created_at,
        user_id: share.projects.user_id,
        owner_email: share.projects.profiles.email,
        shared_role: share.role,
      }));

      return { data: formattedData, count: count || 0 };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  const totalCount = projects.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(0);
  }, [globalSearchTerm]);

  return {
    sharedProjects: projects.data,
    isLoadingSharedProjects: isLoading,
    sharedProjectsError: error,
    sharedProjectsCurrentPage: currentPage,
    setSharedProjectsCurrentPage: setCurrentPage,
    totalSharedProjectsPages: totalPages,
    totalSharedProjectsCount: totalCount,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}
