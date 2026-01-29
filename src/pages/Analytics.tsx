import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "react-i18next";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

import { useAnalyticsData } from "@/features/analytics/useAnalyticsData";
import TotalCostCard from "@/features/analytics/components/TotalCostCard";
import CostDistributionChart from "@/features/analytics/components/CostDistributionChart";
import ProjectComparisonChart from "@/features/analytics/components/ProjectComparisonChart";

export default function Analytics() {
  const { t } = useTranslation(["pages", "common"]);
  const {
    filteredData,
    loading,
    error,
    availableCurrencies,
    selectedProjectId,
    setSelectedProjectId,
    selectedCurrency,
    setSelectedCurrency,
  } = useAnalyticsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-base">{t("common:error")}</AlertTitle>
        <AlertDescription className="text-sm">
          {t("pages:analytics.errorLoadingData")}: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold">{t("pages:analytics.title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">
            {t("pages:analytics.selectProject")}
          </Label>
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder={t("pages:analytics.allProjects")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">
                {t("pages:analytics.allProjects")}
              </SelectItem>
              {filteredData?.projects.map((project) => (
                <SelectItem
                  key={project.id}
                  value={project.id}
                  className="text-sm"
                >
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">
            {t("pages:analytics.selectCurrency")}
          </Label>
          <Select
            value={selectedCurrency}
            onValueChange={setSelectedCurrency}
            disabled={selectedProjectId !== "all"}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map((currency) => (
                <SelectItem key={currency} value={currency} className="text-sm">
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredData?.missingRates && filteredData.missingRates.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-base">{t("common:warning")}</AlertTitle>
          <AlertDescription className="text-sm">
            {t("pages:analytics.missingRatesWarning", {
              currencies: filteredData.missingRates.join(", "),
            })}
          </AlertDescription>
        </Alert>
      )}

      {filteredData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TotalCostCard
            grandTotal={filteredData.grandTotal}
            currency={filteredData.displayCurrency}
          />
          <CostDistributionChart
            totals={filteredData.totals}
            currency={filteredData.displayCurrency}
          />
          {selectedProjectId === "all" && (
            <ProjectComparisonChart
              projects={filteredData.projects}
              displayCurrency={filteredData.displayCurrency}
              className="lg:col-span-2"
            />
          )}
        </div>
      )}
    </div>
  );
}
