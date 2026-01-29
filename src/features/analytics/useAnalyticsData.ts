import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSupabase } from "@/hooks/useOfflineSupabase";
import { safeAdd } from "@/utils/math";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { ProjectCostData, AnalyticsData } from "./types";
import { handleError } from "@/utils/toast";

export function useAnalyticsData() {
  const { user } = useAuth();
  const { useQuery } = useOfflineSupabase();
  const {
    convert,
    getMissingRates,
    isLoading: loadingRates,
  } = useCurrencyConverter();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");

  const {
    data: projectsData = [],
    isLoading: loadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["analytics_projects_data", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        const { data, error } = await supabase.rpc(
          "get_user_projects_analytics",
        );

        if (error) {
          handleError(error);
          throw error;
        }

        return (data || []) as ProjectCostData[];
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (projectsError) {
      handleError(projectsError);
    }
  }, [projectsError]);

  const availableCurrencies = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return Array.from(new Set(projectsData.map((p) => p.currency))).sort();
  }, [projectsData]);

  useEffect(() => {
    if (
      availableCurrencies.length > 0 &&
      !availableCurrencies.includes(selectedCurrency)
    ) {
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, selectedCurrency]);

  const filteredData = useMemo<AnalyticsData | null>(() => {
    if (!projectsData || loadingRates) return null;

    try {
      let projects: ProjectCostData[] = [];
      let displayCurrency = "USD";
      const missingRatesSet = new Set<string>();

      if (selectedProjectId !== "all") {
        const project = projectsData.find((p) => p.id === selectedProjectId);
        if (project) {
          projects = [project];
          displayCurrency = project.currency;
        }
      } else {
        displayCurrency = selectedCurrency;
        projects = projectsData.map((p) => {
          const missing = getMissingRates(p.currency, displayCurrency);
          missing.forEach((r) => missingRatesSet.add(r));

          return {
            ...p,
            materials_cost: convert(
              p.materials_cost,
              p.currency,
              displayCurrency,
            ),
            labor_cost: convert(p.labor_cost, p.currency, displayCurrency),
            equipment_cost: convert(
              p.equipment_cost,
              p.currency,
              displayCurrency,
            ),
            additional_cost: convert(
              p.additional_cost,
              p.currency,
              displayCurrency,
            ),
            total_cost: convert(p.total_cost, p.currency, displayCurrency),
          };
        });
      }

      if (projects.length === 0) return null;

      const totals = {
        materials: projects.reduce(
          (sum, p) => safeAdd(sum, p.materials_cost),
          0,
        ),
        labor: projects.reduce((sum, p) => safeAdd(sum, p.labor_cost), 0),
        equipment: projects.reduce(
          (sum, p) => safeAdd(sum, p.equipment_cost),
          0,
        ),
        additional: projects.reduce(
          (sum, p) => safeAdd(sum, p.additional_cost),
          0,
        ),
      };

      return {
        projects,
        totals,
        grandTotal: safeAdd(
          totals.materials,
          totals.labor,
          totals.equipment,
          totals.additional,
        ),
        displayCurrency,
        missingRates: Array.from(missingRatesSet),
      };
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [
    projectsData,
    selectedProjectId,
    selectedCurrency,
    loadingRates,
    convert,
    getMissingRates,
  ]);

  return {
    projectsData,
    filteredData,
    loading: loadingProjects || loadingRates,
    error: projectsError,
    availableCurrencies,
    selectedProjectId,
    setSelectedProjectId,
    selectedCurrency,
    setSelectedCurrency,
  };
}
