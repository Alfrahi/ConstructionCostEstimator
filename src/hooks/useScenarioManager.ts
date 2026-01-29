import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/AuthProvider";
import {
  Scenario,
  ScenarioRule,
  ScenarioRuleFormValues,
} from "@/types/scenario-analysis";
import { handleError } from "@/utils/toast";

export function useScenarioManager() {
  const { t } = useTranslation(["scenario_analysis", "common"]);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const scenarioQueryKey = ["risk_scenarios", user?.id];

  const { data: scenarios = [], isLoading: isLoadingScenarios } = useQuery<
    Scenario[]
  >({
    queryKey: scenarioQueryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("risk_scenarios")
        .select("*")
        .or(`user_id.eq.${user?.id},is_public.eq.true`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const addScenarioMutation = useMutation({
    mutationFn: async (
      newScenario: Omit<
        Scenario,
        "id" | "user_id" | "created_at" | "updated_at"
      >,
    ) => {
      const { error } = await supabase.from("risk_scenarios").insert({
        ...newScenario,
        user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("successCreated"));
      queryClient.invalidateQueries({ queryKey: scenarioQueryKey });
    },
    onError: (error: any) => handleError(error),
  });

  const updateScenarioMutation = useMutation({
    mutationFn: async (updatedScenario: Partial<Scenario> & { id: string }) => {
      const { error } = await supabase
        .from("risk_scenarios")
        .update(updatedScenario)
        .eq("id", updatedScenario.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("successUpdated"));
      queryClient.invalidateQueries({ queryKey: scenarioQueryKey });
    },
    onError: (error: any) => handleError(error),
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      const { error } = await supabase
        .from("risk_scenarios")
        .delete()
        .eq("id", scenarioId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("successDeleted"));
      queryClient.invalidateQueries({ queryKey: scenarioQueryKey });
    },
    onError: (error: any) => handleError(error),
  });

  const formatRulesForDb = (
    rules: ScenarioRuleFormValues[],
  ): ScenarioRule[] => {
    return rules.map((rule) => {
      const newRule: ScenarioRule = {
        item_type: rule.item_type,
        field: rule.field,
        adjustment_type: rule.adjustment_type,
        value: rule.value,
        ...(rule.filter_name_contains && {
          filter_name_contains: rule.filter_name_contains,
        }),
        ...(rule.filter_category_is && {
          filter_category_is: rule.filter_category_is,
        }),
        ...(rule.filter_worker_type_contains && {
          filter_worker_type_contains: rule.filter_worker_type_contains,
        }),
      };
      return newRule;
    });
  };

  const formatRulesForForm = (
    rules: ScenarioRule[],
  ): ScenarioRuleFormValues[] => {
    return rules.map((rule) => ({
      ...rule,
      filter_name_contains: rule.filter_name_contains || "",
      filter_category_is: rule.filter_category_is || "",
      filter_worker_type_contains: rule.filter_worker_type_contains || "",
    }));
  };

  return {
    scenarios,
    isLoadingScenarios,
    addScenario: addScenarioMutation.mutateAsync,
    updateScenario: updateScenarioMutation.mutateAsync,
    deleteScenario: deleteScenarioMutation.mutateAsync,
    isAddingScenario: addScenarioMutation.isPending,
    isUpdatingScenario: updateScenarioMutation.isPending,
    isDeletingScenario: deleteScenarioMutation.isPending,
    formatRulesForDb,
    formatRulesForForm,
  };
}
