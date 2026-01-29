import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/AuthProvider";

export interface DropdownOption {
  value: string;
  label: string;
  numeric_value?: number | null;
}

interface RawDropdownItem {
  value: string;
  translations: Record<string, string> | null;
  numeric_value: number | null;
}

export function useSettingsOptions(
  category: string,
  includeNumericValue = false,
) {
  const { i18n } = useTranslation();
  const { role } = useAuth();

  const queryKey = [
    "dropdown_settings",
    category,
    i18n.language,
    role,
    includeNumericValue,
  ];

  const { data, isLoading, error } = useQuery<DropdownOption[]>({
    queryKey,
    queryFn: async () => {
      const query = supabase
        .from("dropdown_settings")
        .select(`value, translations, numeric_value`)
        .eq("category", category);

      const { data, error } = await query.order("value");

      if (error) {
        console.error(
          `Error fetching dropdown options for category ${category}:`,
          error,
        );
        throw error;
      }

      return (data || []).map((item: RawDropdownItem) => ({
        value: item.value,
        label: item.translations?.[i18n.language] || item.value,
        numeric_value: item.numeric_value,
      }));
    },
    staleTime: 1000 * 60 * 60,
  });

  return {
    options: data || [],
    isLoading,
    error,
  };
}
