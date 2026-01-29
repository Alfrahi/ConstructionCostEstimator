import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSupabase } from "./useOfflineSupabase";

export interface CostDatabaseItem {
  id: string;
  database_id: string;
  csi_division: string;
  csi_code: string;
  description: string;
  unit: string;
  unit_price: number;
}

export function useCostDatabaseItems(
  databaseId?: string,
  page = 0,
  pageSize = 50,
) {
  const queryClient = useQueryClient();
  const baseQueryKey = ["cost-database-items", databaseId];
  const queryKey = [...baseQueryKey, page, pageSize];
  const { useMutation: useOfflineMutation, useQuery: useOfflineQuery } =
    useOfflineSupabase();

  const itemsQuery = useOfflineQuery({
    queryKey,
    queryFn: async () => {
      if (!databaseId) return { data: [], count: 0 };
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("cost_database_items")
        .select("*", { count: "exact" })
        .eq("database_id", databaseId)
        .order("csi_code")
        .range(from, to);
      if (error) throw error;
      return { data: data as CostDatabaseItem[], count: count || 0 };
    },
    enabled: !!databaseId,
    staleTime: 1000 * 60 * 5,
  });

  const optimisticSingleUpdater = (
    old: { data: CostDatabaseItem[]; count: number } | undefined,
    variables: any,
    operation: string,
  ) => {
    const oldData = old?.data ?? [];
    const oldCount = old?.count ?? 0;
    if (operation === "INSERT") {
      return {
        data: [
          ...oldData,
          {
            ...variables,
            id: variables.id || crypto.randomUUID(),
            database_id: databaseId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        count: oldCount + 1,
      };
    }
    if (operation === "UPDATE") {
      return {
        data: oldData.map((item) =>
          item.id === variables.id
            ? {
                ...item,
                ...variables,
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
        count: oldCount,
      };
    }
    if (operation === "DELETE") {
      return {
        data: oldData.filter((item) => item.id !== variables.id),
        count: oldCount - 1,
      };
    }
    return { data: oldData, count: oldCount };
  };

  const createItem = useOfflineMutation<
    Omit<CostDatabaseItem, "id"> & { id?: string },
    { data: CostDatabaseItem[]; count: number }
  >({
    queryKey,
    table: "cost_database_items",
    operation: "INSERT",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: baseQueryKey }),
  });

  const updateItem = useOfflineMutation<
    Partial<CostDatabaseItem> & { id: string },
    { data: CostDatabaseItem[]; count: number }
  >({
    queryKey,
    table: "cost_database_items",
    operation: "UPDATE",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: baseQueryKey }),
  });

  const deleteItem = useOfflineMutation<
    { id: string },
    { data: CostDatabaseItem[]; count: number }
  >({
    queryKey,
    table: "cost_database_items",
    operation: "DELETE",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: baseQueryKey }),
  });

  const optimisticBulkUpdater = (
    old: { data: CostDatabaseItem[]; count: number } | undefined,
    variables: any,
    operation: string,
  ) => {
    const oldData = old?.data ?? [];
    const oldCount = old?.count ?? 0;
    if (operation === "BULK_DELETE") {
      const idsToDelete = variables as string[];
      const newData = oldData.filter((item) => !idsToDelete.includes(item.id));
      return {
        data: newData,
        count: oldCount - idsToDelete.length,
      };
    }
    return { data: oldData, count: oldCount };
  };

  const deleteItems = useOfflineMutation<
    string[],
    { data: CostDatabaseItem[]; count: number }
  >({
    queryKey,
    table: "cost_database_items",
    operation: "BULK_DELETE",
    optimisticUpdater: optimisticBulkUpdater,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: baseQueryKey }),
  });

  const importItems = useMutation({
    mutationFn: async ({
      items,
      strategy,
    }: {
      items: Omit<CostDatabaseItem, "id" | "database_id">[];
      strategy: "skip" | "overwrite";
    }) => {
      if (!databaseId) throw new Error("No database selected");
      const payload = items.map((i) => ({ ...i, database_id: databaseId }));
      if (strategy === "overwrite") {
        const { error } = await supabase
          .from("cost_database_items")
          .upsert(payload, { onConflict: "database_id,csi_code" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cost_database_items")
          .upsert(payload, {
            onConflict: "database_id,csi_code",
            ignoreDuplicates: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: baseQueryKey }),
  });

  return {
    itemsQuery,
    createItem,
    updateItem,
    deleteItem,
    deleteItems,
    importItems,
  };
}
