import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function RoleBadge({ role }: { role?: string }) {
  const { t } = useTranslation("roles");
  if (!role) return null;

  let color = "bg-muted text-muted-foreground";
  if (role === "super_admin")
    color = "bg-primary text-primary-foreground font-bold";
  if (role === "admin") color = "bg-secondary text-secondary-foreground";
  if (role === "user") color = "bg-muted text-muted-foreground";

  const translatedRole = t(role, role.replace("_", " "));

  return (
    <span
      className={cn(
        "ms-2 px-2 py-0.5 rounded text-xs uppercase tracking-wide",
        color,
      )}
      title={translatedRole}
    >
      {translatedRole}
    </span>
  );
}
