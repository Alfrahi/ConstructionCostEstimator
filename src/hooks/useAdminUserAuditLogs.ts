import { useOfflineSupabase } from "@/hooks/useOfflineSupabase";
import { supabase } from "@/integrations/supabase/client";

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  created_at: string;
  user_email: string | null;
  total_rows: number;
}

export function useAdminUserAuditLogs(userId?: string) {
  const { useQuery: useOfflineQuery } = useOfflineSupabase();

  const queryKey = ["admin_user_logs", userId];

  const {
    data: logs,
    isLoading,
    error,
  } = useOfflineQuery<AuditLog[]>({
    queryKey,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .rpc("get_admin_user_logs", {
          target_user_id: userId,
        })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  return {
    logs: logs ?? [],
    isLoading,
    error,
  };
}
