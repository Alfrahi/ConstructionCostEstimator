import { QueryKey } from "@tanstack/react-query";
import { PostgrestError } from "@supabase/supabase-js";

export type CrudOperation =
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "BULK_DELETE"
  | "BULK_UPDATE"
  | "UPSERT"
  | "RPC";

export interface SupabaseQueryConfig<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export interface SupabaseMutationConfig<TVariables = any, TData = any> {
  queryKey: QueryKey;
  table: string;
  operation: CrudOperation;
  optimisticUpdater?: (
    old: TData | undefined,
    variables: TVariables,
    operation: CrudOperation,
  ) => TData | undefined;
  onSuccess?: (data: any, variables: TVariables, context: any) => void;
  onError?: (
    error: Error | PostgrestError,
    variables: TVariables,
    context: any,
  ) => void;
  disableOfflineQueue?: boolean;
  onConflict?: string;
}
