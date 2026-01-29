import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { FinancialSettings } from "@/logic/financials";
import { handleError } from "@/utils/toast";

export function useUpdateProjectFinancialSettings() {
  const { t } = useTranslation(["common"]);
  const queryClient = useQueryClient();

  const updateFinancialSettingsMutation = useMutation({
    mutationFn: async ({
      projectId,
      newSettings,
    }: {
      projectId: string;
      newSettings: FinancialSettings;
    }) => {
      const { error } = await supabase
        .from("projects")
        .update({ financial_settings: newSettings })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(t("common:success"));
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
    onError: (err: any) => {
      handleError(err);
    },
  });

  return updateFinancialSettingsMutation;
}
