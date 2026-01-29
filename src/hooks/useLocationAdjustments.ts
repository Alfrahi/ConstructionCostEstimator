import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useOfflineSupabase } from "./useOfflineSupabase";
import { LocationAdjustment } from "@/types/cost-databases";

export function useLocationAdjustments(databaseId?: string) {
  const { t } = useTranslation("pages");
  const { user } = useAuth();
  const { useMutation: useOfflineMutation, useQuery: useOfflineQuery } =
    useOfflineSupabase();

  const queryKey = ["location-adjustments", databaseId, user?.id];

  const locationsQuery = useOfflineQuery<LocationAdjustment[]>({
    queryKey,
    queryFn: async () => {
      if (!databaseId || !user?.id) return [];
      const { data, error } = await supabase
        .from("location_adjustments")
        .select("*")
        .eq("database_id", databaseId)
        .eq("user_id", user.id);
      if (error) throw error;
      return data as LocationAdjustment[];
    },
    enabled: !!databaseId && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const optimisticSingleUpdater = (
    old: LocationAdjustment[] | undefined,
    variables: any,
    operation: string,
  ) => {
    const oldData = old ?? [];
    if (operation === "INSERT") {
      return [
        ...oldData,
        {
          ...variables,
          id: variables.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
    if (operation === "UPDATE") {
      return oldData.map((item) =>
        item.id === variables.id
          ? {
              ...item,
              ...variables,
              updated_at: new Date().toISOString(),
            }
          : item,
      );
    }
    if (operation === "DELETE") {
      return oldData.filter((item) => item.id !== variables.id);
    }
    return oldData;
  };

  const addLocation = useOfflineMutation<
    Omit<LocationAdjustment, "id" | "created_at" | "updated_at"> & {
      id?: string;
    },
    LocationAdjustment[]
  >({
    queryKey,
    table: "location_adjustments",
    operation: "INSERT",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => {
      toast.success(t("cost_databases.success_location_added"));
    },
    onError: (err: any) =>
      toast.error(t("cost_databases.error_add", { message: err.message })),
  });

  const updateLocation = useOfflineMutation<
    Partial<LocationAdjustment> & { id: string },
    LocationAdjustment[]
  >({
    queryKey,
    table: "location_adjustments",
    operation: "UPDATE",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => {
      toast.success(t("cost_databases.success_location_updated"));
    },
    onError: (err: any) =>
      toast.error(t("cost_databases.error_update", { message: err.message })),
  });

  const deleteLocation = useOfflineMutation<
    { id: string },
    LocationAdjustment[]
  >({
    queryKey,
    table: "location_adjustments",
    operation: "DELETE",
    optimisticUpdater: optimisticSingleUpdater,
    onSuccess: () => {
      toast.success(t("cost_databases.success_location_deleted"));
    },
    onError: (err: any) =>
      toast.error(t("cost_databases.error_delete", { message: err.message })),
  });

  return {
    locations: locationsQuery.data || [],
    isLoading: locationsQuery.isLoading,
    error: locationsQuery.error,
    addLocation,
    updateLocation,
    deleteLocation,
  };
}
