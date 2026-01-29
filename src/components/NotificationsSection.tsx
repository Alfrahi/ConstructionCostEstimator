import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";

export default function NotificationsSection() {
  const { t } = useTranslation(["settings", "common"]);
  const { user } = useAuth();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [sharedProjects, setSharedProjects] = useState(true);
  const [systemMessages, setSystemMessages] = useState(true);

  useEffect(() => {
    if (user?.user_metadata) {
      setEmailNotifications(user.user_metadata.emailNotifications !== false);
      setProjectUpdates(user.user_metadata.projectUpdates !== false);
      setSharedProjects(user.user_metadata.sharedProjects !== false);
      setSystemMessages(user.user_metadata.systemMessages !== false);
    }
  }, [user]);

  const saveNotificationSettings = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          emailNotifications,
          projectUpdates,
          sharedProjects,
          systemMessages,
        },
      });

      if (error) {
        toast.error(
          t("settings:notifications.error_save", { message: error.message }),
        );
      } else {
        toast.success(t("settings:notifications.success_saved"));
      }
    } catch (error: any) {
      toast.error(
        t("settings:notifications.error_save", { message: error.message }),
      );
    }
  };

  return (
    <div className="space-y-6 max-w-md text-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotifications" className="text-sm font-medium">
              {t("settings:notifications.emailNotifications")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("settings:notifications.emailNotificationsDescription")}
            </p>
          </div>
          <Switch
            id="emailNotifications"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="projectUpdates" className="text-sm font-medium">
              {t("settings:notifications.projectUpdates")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("settings:notifications.projectUpdatesDescription")}
            </p>
          </div>
          <Switch
            id="projectUpdates"
            checked={projectUpdates}
            onCheckedChange={setProjectUpdates}
            disabled={!emailNotifications}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sharedProjects" className="text-sm font-medium">
              {t("settings:notifications.sharedProjects")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("settings:notifications.sharedProjectsDescription")}
            </p>
          </div>
          <Switch
            id="sharedProjects"
            checked={sharedProjects}
            onCheckedChange={setSharedProjects}
            disabled={!emailNotifications}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="systemMessages" className="text-sm font-medium">
              {t("settings:notifications.systemMessages")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("settings:notifications.systemMessagesDescription")}
            </p>
          </div>
          <Switch
            id="systemMessages"
            checked={systemMessages}
            onCheckedChange={setSystemMessages}
            disabled={!emailNotifications}
          />
        </div>
      </div>

      <Button onClick={saveNotificationSettings} className="text-sm">
        {t("settings:notifications.saveButton")}
      </Button>
    </div>
  );
}
