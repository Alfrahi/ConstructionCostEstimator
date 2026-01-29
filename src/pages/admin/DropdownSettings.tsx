import { useTranslation } from "react-i18next";
import SettingsSection from "@/components/SettingsSection";
import { useRole } from "@/hooks/useRole";
import Breadcrumbs from "@/components/Breadcrumbs";

interface SettingsCategory {
  key: string;
  label: string;
  description: string;
}

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    key: "project_type",
    label: "admin:dropdowns.projectTypes",
    description: "admin:dropdowns.projectTypesDescription",
  },
  {
    key: "project_size_unit",
    label: "admin:dropdowns.projectSizeUnits",
    description: "admin:dropdowns.projectSizeUnitsDescription",
  },
  {
    key: "duration_unit",
    label: "admin:dropdowns.duration_unit",
    description: "admin:dropdowns.durationUnitDescription",
  },
  {
    key: "material_unit",
    label: "admin:dropdowns.materialUnits",
    description: "admin:dropdowns.materialUnitsDescription",
  },
  {
    key: "equipment_rental_purchase",
    label: "admin:dropdowns.equipmentRentalPurchase",
    description: "admin:dropdowns.equipmentRentalPurchaseDescription",
  },
  {
    key: "equipment_period_unit",
    label: "admin:dropdowns.equipmentPeriodUnits",
    description: "admin:dropdowns.equipmentPeriodUnitsDescription",
  },
  {
    key: "additional_cost_category",
    label: "admin:dropdowns.additionalCostCategories",
    description: "admin:dropdowns.additionalCostCategoriesDescription",
  },
  {
    key: "risk_probability",
    label: "admin:dropdowns.riskProbabilities",
    description: "admin:dropdowns.riskProbabilitiesDescription",
  },
  {
    key: "currency",
    label: "admin:dropdowns.currencies",
    description: "admin:dropdowns.currenciesDescription",
  },
];

export default function DropdownSettings() {
  const { t } = useTranslation(["admin", "common"]);
  const { isSuperAdmin, isAdmin } = useRole();

  return (
    <div className="space-y-6">
      <Breadcrumbs /> {/* Add Breadcrumbs here */}
      <h1 className="text-2xl font-bold">{t("admin:dropdowns.title")}</h1>
      <p className="text-muted-foreground">
        {t("admin:dropdowns.description")}
      </p>
      <div className="space-y-8">
        {SETTINGS_CATEGORIES.map((category) => (
          <SettingsSection
            key={category.key}
            category={category.key}
            label={t(category.label)}
            description={t(category.description)}
            isAdmin={isAdmin || isSuperAdmin}
          />
        ))}
      </div>
    </div>
  );
}
