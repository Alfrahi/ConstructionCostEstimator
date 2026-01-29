import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSupabase } from "@/hooks/useOfflineSupabase";
import { useAuth } from "@/components/AuthProvider";

const ITEMS_PER_PAGE = 10;

interface MyProjectData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

interface MyProjectsResponse {
  data: MyProjectData[];
  count: number;
}

export function useMyProjects(globalSearchTerm: string) {
  const { user } = useAuth();
  const { useQuery } = useOfflineSupabase();

  const [currentPage, setCurrentPage] = useState(0);

  const queryKey = ["myProjects", currentPage, globalSearchTerm, user?.id];

  const {
    data: projects = { data: [], count: 0 },
    isLoading,
    error,
  } = useQuery<MyProjectsResponse>({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return { data: [], count: 0 };

      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("projects")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (globalSearchTerm) {
        query = query.or(
          `name.ilike.%${globalSearchTerm}%,description.ilike.%${globalSearchTerm}%`,
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
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
    myProjects: projects.data,
    isLoadingMyProjects: isLoading,
    myProjectsError: error,
    myProjectsCurrentPage: currentPage,
    setMyProjectsCurrentPage: setCurrentPage,
    totalMyProjectsPages: totalPages,
    totalMyProjectsCount: totalCount,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}
