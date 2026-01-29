import React, { Suspense, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useCurrencyFormatter } from "@/utils/formatCurrency";
import { AnalyticsTotals } from "../types";

const LazyChartContainer = React.lazy(
  () => import("@/components/ChartContainer"),
);

const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function CostDistributionChart({
  totals,
  currency,
}: {
  totals: AnalyticsTotals;
  currency: string;
}) {
  const { t } = useTranslation(["pages", "project_tabs"]);
  const { format } = useCurrencyFormatter();

  const chartData = useMemo(
    () => [
      {
        name: t("project_tabs:materials"),
        value: totals.materials,
        itemStyle: { color: CHART_COLORS[0] },
      },
      {
        name: t("project_tabs:labor"),
        value: totals.labor,
        itemStyle: { color: CHART_COLORS[1] },
      },
      {
        name: t("project_tabs:equipment"),
        value: totals.equipment,
        itemStyle: { color: CHART_COLORS[2] },
      },
      {
        name: t("project_tabs:additional"),
        value: totals.additional,
        itemStyle: { color: CHART_COLORS[3] },
      },
    ],
    [totals, t],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {t("pages:analytics.costDistribution")}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("pages:analytics.costDistributionTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="h-[320px] sm:h-[360px] lg:h-[400px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          }
        >
          <LazyChartContainer>
            <ReactECharts
              option={{
                tooltip: {
                  trigger: "item",
                  formatter: (params: any) => {
                    return `${params.name}: ${format(params.value, currency)} (${params.percent}%)`;
                  },
                },
                series: [
                  {
                    type: "pie",
                    radius: "60%",
                    data: chartData,
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: "rgba(0, 0, 0, 0.5)",
                      },
                    },
                  },
                ],
              }}
              style={{ height: "100%", width: "100%" }}
            />
          </LazyChartContainer>
        </Suspense>
      </CardContent>
    </Card>
  );
}
