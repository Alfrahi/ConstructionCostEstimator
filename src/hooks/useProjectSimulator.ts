import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Scenario, SimulationResult } from "@/types/scenario-analysis";
import { handleError } from "@/utils/toast";

export function useProjectSimulator() {
  const { t } = useTranslation(["scenario_analysis", "common"]);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);

  const simulateMutation = useMutation({
    mutationFn: async ({
      projectId,
      scenario,
    }: {
      projectId: string;
      scenario: Scenario;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "simulate-project-scenario",
        {
          body: {
            project_id: projectId,
            scenario: scenario,
          },
        },
      );
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as SimulationResult;
    },
    onSuccess: (data) => {
      setSimulationResult(data);
      toast.success(t("simulationComplete"));
    },
    onError: (error: any) => handleError(error),
  });

  const runSimulation = useCallback(
    async (projectId: string, scenario: Scenario) => {
      setSimulationResult(null);
      const toastId = toast.loading(t("runningSimulation"));
      try {
        await simulateMutation.mutateAsync({ projectId, scenario });
      } finally {
        toast.dismiss(toastId);
      }
    },
    [simulateMutation, t],
  );

  return {
    simulationResult,
    isSimulating: simulateMutation.isPending,
    runSimulation,
    clearSimulationResult: () => setSimulationResult(null),
  };
}
