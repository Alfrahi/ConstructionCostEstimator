import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { handleError } from "@/utils/toast";

export function useUserPasswordUpdate() {
  const { t } = useTranslation(["settings", "common"]);

  const updatePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("settings:profile.success_password_update"));
    },
    onError: (error: any) => {
      handleError(error);
    },
  });

  return updatePasswordMutation;
}
