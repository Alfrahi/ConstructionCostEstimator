import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { AssemblyItem } from "@/types/assemblies";
import { handleError } from "@/utils/toast";
import { useOfflineSupabase } from "./useOfflineSupabase";

export function useAssemblyItems(assemblyId?: string) {
  const { user } = useAuth();
  const { useMutation: useOfflineMutation, useQuery: useOfflineQuery } =
    useOfflineSupabase();

  const queryKey = ["assembly_items", assemblyId, user?.id];

  const itemsQuery = useOfflineQuery<AssemblyItem[]>({
    queryKey,
    queryFn: async () => {
      if (!assemblyId || !user?.id) return [];
      const { data, error } = await supabase
        .from("cost_assembly_items")
        .select("*")
        .eq("assembly_id", assemblyId)
        .eq("user_id", user.id)
        .order("description");
      if (error) throw error;
      return data || [];
    },
    enabled: !!assemblyId && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const optimisticSingleUpdater = (
    old: AssemblyItem[] | undefined,
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
    if (operation === "UPDATE") {
      return oldData.map((item) =>
        item.id === variables.id
          ? {
              ...item,
              ...variables,
              updated_at: new Date().toISOString(),
            }
          : item,
      );
    }
    if (operation === "DELETE") {
      return oldData.filter((item) => item.id !== variables.id);
    }
    return oldData;
  };

  const createItem = useOfflineMutation<
    Omit<AssemblyItem, "id" | "created_at" | "updated_at">,
    AssemblyItem[]
  >({
    queryKey,
    table: "cost_assembly_items",
    operation: "INSERT",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => {},
    onError: (err) => handleError(err),
  });

  const updateItem = useOfflineMutation<
    Partial<AssemblyItem> & { id: string },
    AssemblyItem[]
  >({
    queryKey,
    table: "cost_assembly_items",
    operation: "UPDATE",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => {},
    onError: (err) => handleError(err),
  });

  const deleteItem = useOfflineMutation<{ id: string }, AssemblyItem[]>({
    queryKey,
    table: "cost_assembly_items",
    operation: "DELETE",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => {},
    onError: (err) => handleError(err),
  });

  return {
    itemsQuery,
    createItem,
    updateItem,
    deleteItem,
  };
}
