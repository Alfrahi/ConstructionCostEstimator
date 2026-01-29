import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Heading } from "@/components/ui/heading";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { PaginationControls } from "@/components/PaginationControls";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Folder, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn, getIconMarginClass } from "@/lib/utils";
import { useMyProjects } from "@/hooks/useMyProjects";
import { useSharedProjects } from "@/hooks/useSharedProjects";

export default function Dashboard() {
  const { t } = useTranslation(["dashboard", "common"]);
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");

  const {
    myProjects,
    isLoadingMyProjects,
    myProjectsError,
    myProjectsCurrentPage,
    setMyProjectsCurrentPage,
    totalMyProjectsPages,
    totalMyProjectsCount,
    itemsPerPage,
  } = useMyProjects(searchTerm);

  const {
    sharedProjects,
    isLoadingSharedProjects,
    sharedProjectsError,
    sharedProjectsCurrentPage,
    setSharedProjectsCurrentPage,
    totalSharedProjectsPages,
    totalSharedProjectsCount,
  } = useSharedProjects(searchTerm);

  const prefetchProjectData = (projectId: string) => {
    queryClient.prefetchQuery({
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
      staleTime: 1000 * 60 * 2,
    });
    queryClient.prefetchQuery({
      queryKey: ["materials", projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("materials")
          .select("*")
          .eq("project_id", projectId);
        if (error) throw error;
        return data ?? [];
      },
      staleTime: 1000 * 60 * 2,
    });
    queryClient.prefetchQuery({
      queryKey: ["labor_items", projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("labor_items")
          .select("*")
          .eq("project_id", projectId);
        if (error) throw error;
        return data ?? [];
      },
      staleTime: 1000 * 60 * 2,
    });
    queryClient.prefetchQuery({
      queryKey: ["equipment_items", projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("equipment_items")
          .select("*")
          .eq("project_id", projectId);
        if (error) throw error;
        return data ?? [];
      },
      staleTime: 1000 * 60 * 2,
    });
    queryClient.prefetchQuery({
      queryKey: ["additional_costs", projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("additional_costs")
          .select("*")
          .eq("project_id", projectId);
        if (error) throw error;
        return data ?? [];
      },
      staleTime: 1000 * 60 * 2,
    });
    queryClient.prefetchQuery({
      queryKey: ["risks", projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("risks")
          .select("*")
          .eq("project_id", projectId);
        if (error) throw error;
        return data ?? [];
      },
      staleTime: 1000 * 60 * 2,
    });
    queryClient.prefetchQuery({
      queryKey: ["project_groups", projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("project_groups")
          .select("*")
          .eq("project_id", projectId);
        if (error) throw error;
        return data ?? [];
      },
      staleTime: 1000 * 60 * 2,
    });
    queryClient.prefetchQuery({
      queryKey: ["comments", projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("comments")
          .select("*, profiles:user_id(email, first_name, last_name)")
          .eq("project_id", projectId);
        if (error) throw error;
        return data ?? [];
      },
      staleTime: 1000 * 60 * 2,
    });
  };

  useEffect(() => {
    if (myProjectsError) {
      toast.error(
        t("common:errorLoadingProjects", { message: myProjectsError.message }),
      );
    }
    if (sharedProjectsError) {
      toast.error(
        t("common:errorLoadingProjects", {
          message: sharedProjectsError.message,
        }),
      );
    }
  }, [myProjectsError, sharedProjectsError, t]);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <Heading level={1}>{t("dashboard:title")}</Heading>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex-1">
          <Input
            placeholder={t("dashboard:searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md text-sm"
          />
        </div>
        <Button asChild className="text-sm">
          <Link to="/projects/new">
            <Plus className={cn("w-4 h-4", getIconMarginClass())} />
            {t("dashboard:createNew")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Folder className="w-5 h-5" />
              {t("dashboard:myProjects")}
            </h2>
            <span className="text-sm text-muted-foreground">
              {totalMyProjectsCount} {t("dashboard:projects")}
            </span>
          </div>

          {isLoadingMyProjects ? (
            <div className="space-y-3">
              {[...Array(itemsPerPage)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : myProjects?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("dashboard:noProjects")}
            </div>
          ) : (
            <div className="space-y-3">
              {myProjects?.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Link
                    to={`/projects/${project.id}`}
                    className="block p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                    onMouseEnter={() => prefetchProjectData(project.id)}
                  >
                    <div className="font-medium text-sm">{project.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
          {totalMyProjectsPages > 1 && (
            <PaginationControls
              currentPage={myProjectsCurrentPage}
              totalPages={totalMyProjectsPages}
              onPageChange={setMyProjectsCurrentPage}
            />
          )}
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t("dashboard:sharedWithMe")}
            </h2>
            <span className="text-sm text-muted-foreground">
              {totalSharedProjectsCount} {t("dashboard:projects")}
            </span>
          </div>

          {isLoadingSharedProjects ? (
            <div className="space-y-3">
              {[...Array(itemsPerPage)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sharedProjects?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("dashboard:noSharedProjects")}
            </div>
          ) : (
            <div className="space-y-3">
              {sharedProjects?.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Link
                    to={`/projects/${project.id}`}
                    className="block p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                    onMouseEnter={() => prefetchProjectData(project.id)}
                  >
                    <div className="font-medium text-sm">{project.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("dashboard:sharedBy", { email: project.owner_email })}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
          {totalSharedProjectsPages > 1 && (
            <PaginationControls
              currentPage={sharedProjectsCurrentPage}
              totalPages={totalSharedProjectsPages}
              onPageChange={setSharedProjectsCurrentPage}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
