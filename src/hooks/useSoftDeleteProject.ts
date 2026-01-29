import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useSoftDeleteProject() {
  const { t } = useTranslation(["project_detail", "common"]);
  const queryClient = useQueryClient();

  const softDeleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.rpc("soft_delete_project", {
        p_project_id: projectId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("project_detail:successDeleted"));
      queryClient.invalidateQueries({ queryKey: ["myProjects"] });
      queryClient.invalidateQueries({ queryKey: ["sharedProjects"] });
      queryClient.invalidateQueries({ queryKey: ["analytics_projects_data"] });
    },
    onError: (error: any) => {
      toast.error(t("project_detail:errorDelete") + ": " + error.message);
    },
  });

  return softDeleteMutation;
}
