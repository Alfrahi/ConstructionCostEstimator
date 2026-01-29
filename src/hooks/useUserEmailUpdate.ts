import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { handleError } from "@/utils/toast";

export function useUserEmailUpdate() {
  const { t } = useTranslation(["settings", "common"]);
  const queryClient = useQueryClient();

  const updateEmailMutation = useMutation({
    mutationFn: async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("settings:profile.info_email_update"));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["supabase.auth.session"] });
    },
    onError: (error: any) => {
      handleError(error);
    },
  });

  return updateEmailMutation;
}
