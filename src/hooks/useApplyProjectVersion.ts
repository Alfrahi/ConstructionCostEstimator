import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { handleError } from "@/utils/toast";

export function useApplyProjectVersion() {
  const { t } = useTranslation(["project_versions", "common"]);
  const queryClient = useQueryClient();

  const applyProjectVersionMutation = useMutation({
    mutationFn: async (payload: {
      projectId: string;
      snapshot: any;
      createRollback: boolean;
    }) => {
      const { projectId, snapshot, createRollback } = payload;
      const { error } = await supabase.rpc("apply_project_snapshot", {
        p_project_id: projectId,
        p_snapshot: snapshot,
        p_create_rollback: createRollback,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(t("success_restored"));
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      [
        "materials",
        "labor_items",
        "equipment_items",
        "additional_costs",
        "risks",
        "project_groups",
      ].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key, variables.projectId] }),
      );
      queryClient.invalidateQueries({
        queryKey: ["project_versions", variables.projectId],
      });
    },
    onError: (err: any) => {
      handleError(err);
    },
  });

  return {
    applyProjectVersion: applyProjectVersionMutation.mutateAsync,
    isApplyingVersion: applyProjectVersionMutation.isPending,
  };
}
