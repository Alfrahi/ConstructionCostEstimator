import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { cn, getIconMarginClass } from "@/lib/utils";

interface CurrencyConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalCurrency: string | null;
  pendingNewCurrency: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isConverting: boolean;
}

export function CurrencyConversionDialog({
  open,
  onOpenChange,
  originalCurrency,
  pendingNewCurrency,
  onConfirm,
  onCancel,
  isConverting,
}: CurrencyConversionDialogProps) {
  const { t } = useTranslation(["common"]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("currencyConversionWarningTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("currencyConversionWarningDescription", {
              oldCurrency: originalCurrency,
              newCurrency: pendingNewCurrency,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isConverting}>
            {t("common:cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isConverting}>
            {isConverting ? (
              <>
                <Loader2
                  className={cn(
                    "w-4 h-4",
                    getIconMarginClass(),
                    "animate-spin",
                  )}
                />
                {t("common:converting")}
              </>
            ) : (
              t("common:continue")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
