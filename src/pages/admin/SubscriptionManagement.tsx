import SubscriptionManagement from "@/components/admin/SubscriptionManagement";
import { useTranslation } from "react-i18next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Heading } from "@/components/ui/heading";

export default function SubscriptionManagementPage() {
  const { t } = useTranslation(["admin", "common"]);
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <Heading level={1}>{t("admin:subscriptionManagement.title")}</Heading>
      <SubscriptionManagement />
    </div>
  );
}
