import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { CostDatabase } from "@/types/cost-databases";
import { useOfflineSupabase } from "./useOfflineSupabase";

export function useCostDatabases() {
  const { user } = useAuth();
  const { useMutation: useOfflineMutation } = useOfflineSupabase();

  const queryKey = ["cost_databases"];

  const databasesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_databases")
        .select("*")
        .order("is_public", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as CostDatabase[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const optimisticSingleUpdater = (
    old: CostDatabase[] | undefined,
    variables: any,
    operation: string,
  ) => {
    const oldData = old ?? [];
    if (operation === "INSERT") {
      return [
        ...oldData,
        {
          ...variables,
          id: variables.id || crypto.randomUUID(),
          user_id: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
    if (operation === "UPDATE") {
      return oldData.map((db) =>
        db.id === variables.id
          ? {
              ...db,
              ...variables,
              updated_at: new Date().toISOString(),
            }
          : db,
      );
    }
    if (operation === "DELETE") {
      return oldData.filter((db) => db.id !== variables.id);
    }
    return oldData;
  };

  const createDatabase = useOfflineMutation<
    {
      name: string;
      description?: string;
      is_public?: boolean;
      currency?: string;
      user_id?: string;
    },
    CostDatabase[]
  >({
    queryKey,
    table: "cost_databases",
    operation: "INSERT",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => {},
  });

  const updateDatabase = useOfflineMutation<
    Partial<CostDatabase> & { id: string },
    CostDatabase[]
  >({
    queryKey,
    table: "cost_databases",
    operation: "UPDATE",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => {},
  });

  const deleteDatabase = useOfflineMutation<{ id: string }, CostDatabase[]>({
    queryKey,
    table: "cost_databases",
    operation: "DELETE",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => {},
  });

  return {
    databasesQuery,
    createDatabase,
    updateDatabase,
    deleteDatabase,
  };
}
