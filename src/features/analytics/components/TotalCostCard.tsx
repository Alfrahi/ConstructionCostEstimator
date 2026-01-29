import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useCurrencyFormatter } from "@/utils/formatCurrency";

export default function TotalCostCard({
  grandTotal,
  currency,
}: {
  grandTotal: number;
  currency: string;
}) {
  const { t } = useTranslation(["pages", "common"]);
  const { format } = useCurrencyFormatter();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {t("pages:analytics.totalCost")}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                <p>{t("pages:analytics.totalCostTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {format(grandTotal, currency, { notation: "compact" })}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("pages:analytics.acrossNProjects", { count: 1 })}
        </p>
      </CardContent>
    </Card>
  );
}
