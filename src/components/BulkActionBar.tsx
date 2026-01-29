import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface Props {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}

export function BulkActionBar({ count, onClear, children }: Props) {
  const { t } = useTranslation("common");

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-xl rounded-lg px-4 py-3 flex items-center gap-4 min-w-[320px] max-w-[90vw]"
        >
          <div className="flex items-center gap-3 border-r border-border pr-4 mr-2">
            <span className="font-semibold text-sm whitespace-nowrap">
              {count} {t("selected", "selected")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-6 w-6 text-text-secondary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
