import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WORLD_CURRENCIES } from "@/utils/world-currencies";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/AuthProvider";
import { handleError } from "@/utils/toast";

export interface Option {
  id: string;
  value: string;
  category: string;
  translations?: Record<string, string>;
  rate?: number;
  numeric_value?: number;
}

export function useDropdownOptions(category: string) {
  const { t } = useTranslation(["common", "admin"]);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isCurrency = category === "currency";
  const isRiskProbability = category === "risk_probability";

  const queryKey = ["dropdown_settings", category];

  const {
    data: fetchedOptions = [],
    isLoading,
    error,
  } = useQuery<Option[]>({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("dropdown_settings")
        .select("id, category, value, translations, numeric_value");

      query = query.eq("category", category);

      const { data, error } = await query.order("value", { ascending: true });

      if (error) throw error;

      if (isCurrency && data) {
        const { data: ratesData, error: ratesError } = await supabase
          .from("currency_rates")
          .select("currency_code, rate_to_usd");
        if (ratesError) {
          handleError(ratesError);
        } else if (ratesData) {
          const ratesMap = new Map(
            ratesData.map((r) => [r.currency_code, r.rate_to_usd]),
          );
          return data.map((option) => ({
            ...option,
            rate: ratesMap.get(option.value) || undefined,
          }));
        }
      }
      return data || [];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (payload: {
      category: string;
      value: string;
      translation: string;
      rate?: number;
      numericValue?: number;
    }) => {
      const { category, value, translation, rate, numericValue } = payload;
      const { error } = await supabase.rpc("add_settings_option", {
        p_category: category,
        p_value: value,
        p_translations: { en: value, ar: translation },
        p_numeric_value: numericValue,
      });
      if (error) throw error;

      if (isCurrency && rate !== undefined) {
        const { error: rateError } = await supabase
          .from("currency_rates")
          .upsert(
            { currency_code: value, rate_to_usd: rate },
            { onConflict: "currency_code" },
          );
        if (rateError) throw rateError;
      }
    },
    onSuccess: () => {
      toast.success(t("admin:dropdowns.success_add"));
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => handleError(err),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      category: string;
      oldValue: string;
      newValue: string;
      newTranslation: string;
      rate?: number;
      numericValue?: number;
    }) => {
      const {
        category,
        oldValue,
        newValue,
        newTranslation,
        rate,
        numericValue,
      } = payload;
      const { error } = await supabase.rpc("update_settings_option", {
        p_category: category,
        p_old_value: oldValue,
        p_new_value: newValue,
        p_translations: { en: newValue, ar: newTranslation },
        p_numeric_value: numericValue,
      });
      if (error) throw error;

      if (isCurrency && rate !== undefined) {
        const { error: rateError } = await supabase
          .from("currency_rates")
          .upsert(
            { currency_code: newValue, rate_to_usd: rate },
            { onConflict: "currency_code" },
          );
        if (rateError) throw rateError;
      }
    },
    onSuccess: () => {
      toast.success(t("admin:dropdowns.success_update"));
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => handleError(err),
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      category: string;
      value: string;
    }) => {
      const { category, value } = payload;
      const { error } = await supabase.rpc("delete_settings_option", {
        p_category: category,
        p_value: value,
      });
      if (error) throw error;

      if (isCurrency) {
        const { error: rateError } = await supabase
          .from("currency_rates")
          .delete()
          .eq("currency_code", value);
        if (rateError) handleError(rateError);
      }
    },
    onSuccess: () => {
      toast.success(t("admin:dropdowns.success_delete"));
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => handleError(err),
  });

  const getDisplayValue = (option: Option) => {
    if (isCurrency) {
      const found = WORLD_CURRENCIES.find((c) => c.code === option.value);
      return found ? `${found.code} - ${found.name}` : option.value;
    }
    return option.value;
  };

  return {
    options: fetchedOptions,
    isLoading,
    error,
    isCurrency,
    isRiskProbability,
    addOption: addMutation.mutateAsync,
    updateOption: updateMutation.mutateAsync,
    deleteOption: deleteMutation.mutateAsync,
    isAddingOption: addMutation.isPending,
    isUpdatingOption: updateMutation.isPending,
    isDeletingOption: deleteMutation.isPending,
    getDisplayValue,
  };
}
