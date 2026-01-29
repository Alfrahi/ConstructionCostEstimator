import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useOfflineSupabase } from "./useOfflineSupabase";
import { CrudOperation } from "@/lib/supabase-utils";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
  company_name: string | null;
  company_website: string | null;
  onboarding_complete: boolean;
  project_count: number;
  plan: string;
  subscription_expires_at: string | null;
  max_active_projects: number | null;
  updated_at: string;
}

export function useProfile() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { useMutation: useOfflineMutation } = useOfflineSupabase();

  const queryKey = ["profile", user?.id];

  const profileQuery = useQuery<Profile | null>({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const optimisticUpdater = (
    old: Profile | null | undefined,
    variables: Partial<Profile> & { id: string },
    operation: CrudOperation,
  ): Profile | null | undefined => {
    if (operation === "UPDATE") {
      return {
        ...old,
        ...variables,
        updated_at: new Date().toISOString(),
      } as Profile;
    }
    return old;
  };

  const updateProfileMutation = useOfflineMutation<
    Partial<Profile> & { id: string },
    Profile | null
  >({
    queryKey,
    table: "profiles",
    operation: "UPDATE",
    optimisticUpdater: optimisticUpdater,
    disableOfflineQueue: true,
    onSuccess: () => {
      toast.success(t("success"));
      queryClient.invalidateQueries({ queryKey: ["supabase.auth.session"] });
    },
    onError: (error: any) => {
      toast.error(t("error") + ": " + error.message);
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: updateProfileMutation,
  };
}
