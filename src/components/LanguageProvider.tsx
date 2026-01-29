import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DirectionProvider } from "@radix-ui/react-direction";

const RTL_LANGUAGES = ["ar", "he", "fa"];

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation();
  const dir = RTL_LANGUAGES.includes(i18n.language) ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [dir, i18n.language]);

  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
}
