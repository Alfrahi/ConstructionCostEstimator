"use client";

import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSupabase } from "@/hooks/useOfflineSupabase";
import { useSettingsOptions } from "@/hooks/useSettingsOptions";
import { useAuth } from "@/components/AuthProvider";
import { calculateCategoryTotal } from "@/logic/shared";
import {
  MaterialItem,
  LaborItem,
  EquipmentItem,
  AdditionalCostItem,
  Risk,
} from "@/types/project-items";

export function useProjectData(projectId?: string) {
  const { user, role: userRole, loading: authLoading } = useAuth();
  const { useQuery } = useOfflineSupabase();

  const { options: sizeUnits, isLoading: loadingSizeUnits } =
    useSettingsOptions("project_size_unit");
  const { options: projectTypes, isLoading: loadingProjectTypes } =
    useSettingsOptions("project_type");

  const queryOptions = {
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  };

  const {
    data: project,
    isLoading: loadingProject,
    error: projectError,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    ...queryOptions,
  });

  const isOwner = !!project && project.user_id === user?.id;

  const { data: projectShare, isLoading: loadingProjectShare } = useQuery<{
    role: string;
  } | null>({
    queryKey: ["project_share_role", projectId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("project_shares")
        .select("role")
        .eq("project_id", projectId)
        .eq("shared_with_user_id", user.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!projectId && !!user?.id && !isOwner,
    staleTime: 1000 * 60 * 2,
  });

  const canEdit = useMemo(() => {
    if (authLoading) return false;
    if (userRole === "super_admin") return true;
    if (isOwner) return true;
    if (projectShare?.role === "editor") return true;
    return false;
  }, [authLoading, userRole, isOwner, projectShare?.role]);

  const accessLevel = useMemo(() => {
    if (authLoading) return "loading";
    if (userRole === "super_admin") return "super_admin";
    if (isOwner) return "owner";
    if (projectShare?.role === "editor") return "editor";
    if (projectShare?.role === "viewer") return "viewer";
    return "none";
  }, [authLoading, userRole, isOwner, projectShare?.role]);

  const groupsQuery = useQuery({
    queryKey: ["project_groups", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_groups")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    ...queryOptions,
  });

  const materialsQuery = useQuery({
    queryKey: ["materials", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return data ?? [];
    },
    ...queryOptions,
  });

  const laborQuery = useQuery({
    queryKey: ["labor_items", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labor_items")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return data ?? [];
    },
    ...queryOptions,
  });

  const equipmentQuery = useQuery({
    queryKey: ["equipment_items", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_items")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return data ?? [];
    },
    ...queryOptions,
  });

  const additionalQuery = useQuery({
    queryKey: ["additional_costs", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("additional_costs")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return data ?? [];
    },
    ...queryOptions,
  });

  const risksQuery = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return data ?? [];
    },
    ...queryOptions,
  });

  const commentsQuery = useQuery({
    queryKey: ["comments", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles:user_id(email, first_name, last_name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    ...queryOptions,
  });

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const materials = useMemo(
    () => materialsQuery.data ?? [],
    [materialsQuery.data],
  ) as MaterialItem[];
  const labor = useMemo(
    () => laborQuery.data ?? [],
    [laborQuery.data],
  ) as LaborItem[];
  const equipment = useMemo(
    () => equipmentQuery.data ?? [],
    [equipmentQuery.data],
  ) as EquipmentItem[];
  const additional = useMemo(
    () => additionalQuery.data ?? [],
    [additionalQuery.data],
  ) as AdditionalCostItem[];
  const risks = useMemo(
    () => risksQuery.data ?? [],
    [risksQuery.data],
  ) as Risk[];
  const comments = useMemo(
    () => commentsQuery.data ?? [],
    [commentsQuery.data],
  );

  const totals = useMemo(() => {
    const materialsTotal = calculateCategoryTotal.materials(materials);
    const laborTotal = calculateCategoryTotal.labor(labor);
    const equipmentTotal = calculateCategoryTotal.equipment(equipment);
    const additionalTotal = calculateCategoryTotal.additional(additional);

    return {
      materialsTotal,
      laborTotal,
      equipmentTotal,
      additionalTotal,
    };
  }, [materials, labor, equipment, additional]);

  const isLoading =
    authLoading ||
    loadingProject ||
    loadingSizeUnits ||
    loadingProjectTypes ||
    groupsQuery.isLoading ||
    materialsQuery.isLoading ||
    laborQuery.isLoading ||
    equipmentQuery.isLoading ||
    additionalQuery.isLoading ||
    risksQuery.isLoading ||
    commentsQuery.isLoading ||
    loadingProjectShare;

  return {
    project,
    user,
    isOwner,
    accessLevel,
    canEdit,
    sizeUnits,
    projectTypes,
    groups,
    materials,
    labor,
    equipment,
    additional,
    risks,
    comments,
    totals,
    isLoading,
    error: projectError,
  };
}
