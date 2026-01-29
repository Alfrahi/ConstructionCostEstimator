import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSupabase } from "./useOfflineSupabase";
import { useCallback } from "react";

interface UseLibrarySyncManagerProps {
  tableName: string;
  queryKey: string[];
  userId: string | undefined;
  page: number;
  pageSize: number;
  select: string;
  order: string;
  searchTerm?: string;
  searchColumn?: string;
}

export function useLibrarySyncManager({
  tableName,
  queryKey,
  userId,
  page,
  pageSize,
  select,
  order,
  searchTerm,
  searchColumn,
}: UseLibrarySyncManagerProps) {
  const queryClient = useQueryClient();
  const { useMutation: useOfflineMutation } = useOfflineSupabase();

  const itemsQuery = useQuery({
    queryKey: [...queryKey, page, pageSize, searchTerm],
    queryFn: async () => {
      if (!userId) return { data: [], count: 0 };
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from(tableName)
        .select(select, { count: "exact" })
        .eq("user_id", userId);

      if (searchTerm && searchColumn) {
        query = query.ilike(searchColumn, `%${searchTerm}%`);
      }

      const { data, error, count } = await query.order(order).range(from, to);
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const optimisticSingleUpdater = (
    old: any,
    variables: any,
    operation: string,
  ) => {
    const oldData = old?.data ?? [];
    const oldCount = old?.count ?? 0;
    if (operation === "INSERT" || operation === "UPSERT") {
      return {
        data: [
          ...oldData,
          {
            ...variables,
            id: variables.id || crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        count: oldCount + 1,
      };
    }
    if (operation === "UPDATE") {
      return {
        data: oldData.map((item: any) =>
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
        data: oldData.filter((item: any) => item.id !== variables.id),
        count: oldCount - 1,
      };
    }
    return { data: oldData, count: oldCount };
  };

  const getOnConflictColumns = useCallback((table: string): string => {
    switch (table) {
      case "library_materials":
        return "user_id,name,unit";
      case "library_labor":
        return "user_id,worker_type";
      case "library_equipment":
        return "user_id,name,type,rental_or_purchase,period_unit";
      default:
        console.warn(
          `[useLibrarySyncManager] No specific onConflict columns defined for table: ${table}. Defaulting to 'id'.`,
        );
        return "id";
    }
  }, []);

  const createItem = useOfflineMutation<any, any>({
    queryKey: queryKey,
    table: tableName,
    operation: "UPSERT",
    onConflict: getOnConflictColumns(tableName),
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey }),
  });

  const updateItem = useOfflineMutation<any, any>({
    queryKey: queryKey,
    table: tableName,
    operation: "UPDATE",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey }),
  });

  const deleteItem = useOfflineMutation<any, any>({
    queryKey: queryKey,
    table: tableName,
    operation: "DELETE",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey }),
  });

  const optimisticBulkUpdater = (
    old: any,
    variables: any,
    operation: string,
  ) => {
    const oldData = old?.data ?? [];
    const oldCount = old?.count ?? 0;
    if (operation === "BULK_DELETE") {
      const idsToDelete = variables as string[];
      const newData = oldData.filter(
        (item: any) => !idsToDelete.includes(item.id),
      );
      return {
        data: newData,
        count: oldCount - idsToDelete.length,
      };
    }
    return { data: oldData, count: oldCount };
  };

  const deleteItems = useOfflineMutation<string[], any>({
    queryKey: queryKey,
    table: tableName,
    operation: "BULK_DELETE",
    optimisticUpdater: optimisticBulkUpdater,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey }),
  });

  return {
    itemsQuery,
    createItem,
    updateItem,
    deleteItem,
    deleteItems,
  };
}
