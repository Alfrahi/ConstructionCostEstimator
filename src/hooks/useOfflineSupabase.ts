import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { offlineManager } from "@/lib/offline";
import { PostgrestError } from "@supabase/supabase-js";
import { useAuth } from "@/components/AuthProvider";
import i18n from "@/i18n";
import {
  SupabaseQueryConfig,
  SupabaseMutationConfig,
} from "@/lib/supabase-utils";

export function useOfflineSupabase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const useQueryWrapper = <T>({
    queryKey,
    queryFn,
    enabled = true,
    staleTime,
    gcTime,
  }: SupabaseQueryConfig<T>) =>
    useQuery<T, Error | PostgrestError>({
      queryKey,
      queryFn,
      enabled: enabled && offlineManager.getIsOnline(),
      staleTime,
      gcTime,
    });

  const useMutationWrapper = <TVariables = any, TData = any>({
    queryKey,
    table,
    operation,
    optimisticUpdater,
    onSuccess,
    onError,
    disableOfflineQueue,
    onConflict,
  }: SupabaseMutationConfig<TVariables, TData>) =>
    useMutation<TData, Error | PostgrestError, TVariables>({
      mutationFn: async (payload: TVariables) => {
        if (offlineManager.getIsOnline()) {
          let request;
          const recordId = (payload as any).id;

          switch (operation) {
            case "INSERT":
              request = supabase.from(table).insert(payload).select();
              break;
            case "UPDATE":
              if (!recordId) throw new Error("Update requires ID");
              request = supabase
                .from(table)
                .update(payload)
                .eq("id", recordId)
                .select();
              break;
            case "DELETE":
              if (!recordId) throw new Error("Delete requires ID");
              request = supabase
                .from(table)
                .delete()
                .eq("id", recordId)
                .select();
              break;
            case "BULK_DELETE":
              request = supabase
                .from(table)
                .delete()
                .in("id", payload as unknown as string[]);
              break;
            case "BULK_UPDATE": {
              const { ids, data } = payload as any;
              request = supabase
                .from(table)
                .update(data)
                .in("id", ids)
                .select();
              break;
            }
            case "UPSERT":
              request = supabase
                .from(table)
                .upsert(payload, { onConflict })
                .select();
              break;
            case "RPC":
              request = supabase.rpc(table, payload);
              break;
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }

          const { data, error } = await request;
          if (error) throw error;

          if (
            operation === "INSERT" ||
            operation === "UPDATE" ||
            operation === "DELETE" ||
            operation === "UPSERT"
          ) {
            return data && data.length > 0 ? data[0] : null;
          }
          return data;
        } else {
          if (disableOfflineQueue) {
            throw new Error(i18n.t("common:offlineOperationNotAllowed"));
          }

          if (!user?.id) {
            throw new Error(i18n.t("common:mustBeLoggedIn"));
          }

          await offlineManager.addMutation({
            type: operation,
            table,
            payload: payload,
            queryKey: queryKey,
            userId: user.id,
            onConflict,
          });
          return payload;
        }
      },
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey });
        const previousData = queryClient.getQueryData<TData>(queryKey);

        if (optimisticUpdater) {
          queryClient.setQueryData<TData>(queryKey, (old) =>
            optimisticUpdater(old, variables, operation),
          );
        }

        return { previousData };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousData) {
          queryClient.setQueryData(queryKey, context.previousData);
        }
        onError?.(err, variables, context);
      },
      onSuccess: (data, variables, context) => {
        onSuccess?.(data, variables, context);
      },
    });

  return {
    useQuery: useQueryWrapper,
    useMutation: useMutationWrapper,
  };
}
