import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useRole } from "@/hooks/useRole";

const PAGE_SIZE = 10;

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  plan: string;
  subscription_expires_at: string | null;
  max_active_projects: number | null;
}

const PLANS = [
  { value: "free", labelKey: "admin:subscriptionManagement.planFree" },
  { value: "basic", labelKey: "admin:subscriptionManagement.planBasic" },
  { value: "pro", labelKey: "admin:subscriptionManagement.planPro" },
];

export function useAdminSubscriptionManagement() {
  const { t } = useTranslation(["admin", "common"]);
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useRole();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string>("");
  const [editingExpiry, setEditingExpiry] = useState<string>("");

  useEffect(() => {
    setCurrentPage(0);
  }, [search]);

  const queryKey = ["admin_users_for_subscription"];

  const { data: allUsersData = [], isLoading } = useQuery<User[]>({
    queryKey,
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .rpc("get_all_users_for_admin")
        .select(
          "id, email, first_name, last_name, role, plan, subscription_expires_at, max_active_projects",
        );

      if (error) throw error;

      return (data ?? []) as User[];
    },
    placeholderData: (previousData) => previousData || [],
  });

  const filteredUsers = useMemo(() => {
    let filtered = allUsersData;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(s) ||
          user.first_name?.toLowerCase().includes(s) ||
          user.last_name?.toLowerCase().includes(s),
      );
    }
    return filtered;
  }, [allUsersData, search]);

  const paginatedUsers = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({
      userId,
      plan,
      expiresAt,
    }: {
      userId: string;
      plan: string;
      expiresAt: string | null;
    }) => {
      const { error } = await supabase.rpc("update_user_subscription", {
        p_user_id: userId,
        p_plan: plan,
        p_expires_at: expiresAt,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("admin:subscriptionManagement.successUpdated"));
      queryClient.invalidateQueries({
        queryKey: ["admin_users_for_subscription"],
      });
      setEditingUserId(null);
    },
    onError: (error: Error) => {
      toast.error(
        t("admin:subscriptionManagement.errorUpdate", {
          message: error.message,
        }),
      );
    },
  });

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditingPlan(user.plan);
    setEditingExpiry(user.subscription_expires_at ?? "");
  };

  const handleSave = () => {
    if (!editingUserId) return;

    const expiresAt = editingExpiry
      ? new Date(editingExpiry).toISOString()
      : null;

    void updateSubscriptionMutation.mutate({
      userId: editingUserId,
      plan: editingPlan,
      expiresAt,
    });
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setEditingPlan("");
    setEditingExpiry("");
  };

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  return {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    editingUserId,
    editingPlan,
    setEditingPlan,
    editingExpiry,
    setEditingExpiry,
    paginatedUsers,
    isLoading,
    isSuperAdmin,
    handleEdit,
    handleSave,
    handleCancel,
    updateSubscriptionMutation,
    totalPages,
    PLANS,
  };
}
