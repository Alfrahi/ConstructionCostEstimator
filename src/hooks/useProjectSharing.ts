import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { handleError } from "@/utils/toast";

export interface ProjectShare {
  share_id: string;
  shared_with_user_id: string;
  role: "viewer" | "editor";
  email: string;
}

export interface ExternalShareLink {
  id: string;
  access_token: string;
  expires_at: string;
  created_by_user_id: string;
}

export function useProjectSharing(projectId: string) {
  const { t } = useTranslation(["project_detail", "common", "roles"]);
  const queryClient = useQueryClient();

  const internalShareQueryKey = ["project_shares", projectId];
  const externalShareQueryKey = ["external_share_links", projectId];

  const { data: internalShares = [], isLoading: isLoadingInternalShares } =
    useQuery<ProjectShare[]>({
      queryKey: internalShareQueryKey,
      queryFn: async () => {
        const { data, error } = await supabase.rpc(
          "get_project_shares_for_owner",
          {
            p_project_id: projectId,
          },
        );
        if (error) throw error;
        return data || [];
      },
      enabled: !!projectId,
    });

  const { data: externalLinks = [], isLoading: isLoadingExternalLinks } =
    useQuery<ExternalShareLink[]>({
      queryKey: externalShareQueryKey,
      queryFn: async () => {
        const { data, error } = await supabase
          .from("shared_project_links")
          .select("id, access_token, expires_at, created_by_user_id")
          .eq("project_id", projectId);
        if (error) throw error;
        return data || [];
      },
      enabled: !!projectId,
    });

  const addInternalShareMutation = useMutation({
    mutationFn: async (variables: {
      email: string;
      role: "viewer" | "editor";
    }) => {
      const { error } = await supabase.rpc("add_project_share", {
        p_project_id: projectId,
        p_shared_with_email: variables.email,
        p_role: variables.role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("project_detail:share.successAdded"));
      queryClient.invalidateQueries({ queryKey: internalShareQueryKey });
      queryClient.invalidateQueries({ queryKey: ["sharedProjects"] });
    },
    onError: (error: any) => {
      handleError(error);
    },
  });

  const updateInternalShareMutation = useMutation({
    mutationFn: async (variables: {
      shareId: string;
      newRole: "viewer" | "editor";
    }) => {
      const { error } = await supabase.rpc("update_project_share_role", {
        p_share_id: variables.shareId,
        p_new_role: variables.newRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("project_detail:share.successUpdated"));
      queryClient.invalidateQueries({ queryKey: internalShareQueryKey });
      queryClient.invalidateQueries({ queryKey: ["sharedProjects"] });
    },
    onError: (error: any) => {
      handleError(error);
    },
  });

  const deleteInternalShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase.rpc("delete_project_share", {
        p_share_id: shareId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("project_detail:share.successDeleted"));
      queryClient.invalidateQueries({ queryKey: internalShareQueryKey });
      queryClient.invalidateQueries({ queryKey: ["sharedProjects"] });
    },
    onError: (error: any) => {
      handleError(error);
    },
  });

  const generateExternalLinkMutation = useMutation({
    mutationFn: async (variables: { expiresAt: string; password?: string }) => {
      const { data, error } = await supabase.functions.invoke(
        "generate-share-link",
        {
          body: {
            project_id: projectId,
            expires_at: variables.expiresAt,
            password: variables.password,
          },
        },
      );
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.access_token;
    },
    onSuccess: () => {
      toast.success(t("project_detail:share.external.successGenerated"));
      queryClient.invalidateQueries({ queryKey: externalShareQueryKey });
    },
    onError: (error: any) => {
      handleError(error);
    },
  });

  const deleteExternalLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("shared_project_links")
        .delete()
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("project_detail:share.external.successDeleted"));
      queryClient.invalidateQueries({ queryKey: externalShareQueryKey });
    },
    onError: (error: any) => {
      handleError(error);
    },
  });

  return {
    internalShares,
    externalLinks,

    isLoadingInternalShares,
    isLoadingExternalLinks,
    isAddingInternalShare: addInternalShareMutation.isPending,
    isUpdatingInternalShare: updateInternalShareMutation.isPending,
    isDeletingInternalShare: deleteInternalShareMutation.isPending,
    isGeneratingExternalLink: generateExternalLinkMutation.isPending,
    isDeletingExternalLink: deleteExternalLinkMutation.isPending,

    addInternalShare: addInternalShareMutation.mutateAsync,
    updateInternalShare: updateInternalShareMutation.mutateAsync,
    deleteInternalShare: deleteInternalShareMutation.mutateAsync,
    generateExternalLink: generateExternalLinkMutation.mutateAsync,
    deleteExternalLink: deleteExternalLinkMutation.mutateAsync,
  };
}
