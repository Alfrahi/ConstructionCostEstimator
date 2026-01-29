import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface AppSetting {
  key: string;
  value: { enabled: boolean };
  updated_at: string;
}

export function useAppSettings() {
  const { t } = useTranslation(["admin", "common"]);
  const queryClient = useQueryClient();
  const queryKey = ["app_settings", "user_signup"];

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery<AppSetting | null>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "user_signup")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      return data || null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase.from("app_settings").upsert(
        {
          key: "user_signup",
          value: { enabled },
        },
        {
          onConflict: "key",
        },
      );

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("admin:appSettings.successSaved"));
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(t("admin:appSettings.errorSave", { message: err.message }));
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSetting: updateSettingMutation,
  };
}
