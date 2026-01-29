import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleError } from "@/utils/toast";

const PAGE_SIZE = 10;

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  plan: string;
  subscription_expires_at: string | null;
  max_active_projects: number | null;
  created_at: string;
}

interface DeleteUserResponse {
  error?: string;
  message?: string;
}

export function useAdminUserManagement() {
  const { t } = useTranslation(["admin", "common", "roles"]);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showFallbackWarning, setShowFallbackWarning] = useState(false);

  useEffect(() => {
    setCurrentPage(0);
  }, [search]);

  const queryKey = ["admin_users"];

  const {
    data: allUsersData = [],
    isLoading,
    error,
  } = useQuery<UserProfile[]>({
    queryKey,
    queryFn: async (): Promise<UserProfile[]> => {
      try {
        try {
          const { data, error: rpcError } = (await supabase.rpc(
            "get_all_users_for_admin",
          )) as { data: UserProfile[] | null; error: any };

          if (rpcError) {
            handleError(rpcError);
            throw rpcError;
          }

          if (data && data.length > 0) {
            setShowFallbackWarning(false);
            return data;
          }
        } catch (error) {
          handleError(error);
        }

        try {
          const { data, error: rpcError } = (await supabase.rpc(
            "direct_get_all_users_for_admin",
          )) as { data: UserProfile[] | null; error: any };

          if (rpcError) {
            handleError(rpcError);
            throw rpcError;
          }

          if (data && data.length > 0) {
            setShowFallbackWarning(true);
            return data;
          }
        } catch (error) {
          handleError(error);
        }

        return [];
      } catch (err) {
        handleError(err);
      }
      return [];
    },
    placeholderData: (previousData) => previousData ?? [],
    staleTime: 1000 * 60,
  });

  const filteredAndPaginatedUsers = useMemo(() => {
    let filteredData = allUsersData || [];
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filteredData = filteredData.filter(
        (user: UserProfile) =>
          user.email.toLowerCase().includes(s) ||
          user.first_name?.toLowerCase().includes(s) ||
          user.last_name?.toLowerCase().includes(s),
      );
    }

    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    return filteredData.slice(from, to);
  }, [allUsersData, search, currentPage]);

  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error]);

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({
      user_id_to_update,
      new_role,
    }: {
      user_id_to_update: string;
      new_role: string;
    }) => {
      const { error } = await supabase.rpc("update_user_role", {
        user_id_to_update,
        new_role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void toast.success(t("admin:users.successRoleUpdate"));
      void queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      handleError(error);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = (await supabase.functions.invoke("delete-user", {
        body: { userIdToDelete: userId },
      })) as { data: DeleteUserResponse | null; error: any };

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      void toast.success(t("admin:users.successDeleted"));
      void queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      handleError(error);
    },
  });

  const handleDelete = (userId: string) => {
    setDeleteTarget(userId);
    setIsDeleteDialogOpen(true);
  };

  const totalPages = useMemo(
    () => Math.ceil(filteredAndPaginatedUsers.length / PAGE_SIZE) || 1,
    [filteredAndPaginatedUsers],
  );

  return {
    users: filteredAndPaginatedUsers,
    isLoading,
    error,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    editingUser,
    setEditingUser,
    deleteTarget,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    showFallbackWarning,
    updateUserRoleMutation,
    deleteUserMutation,
    handleDelete,
    totalPages,
    PAGE_SIZE,
  };
}
