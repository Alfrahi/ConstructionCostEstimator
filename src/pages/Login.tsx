import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Login() {
  const { loading, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");

  const [signupEnabled, setSignupEnabled] = useState(false);
  const [checkingSettings, setCheckingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let mounted = true;

    const fetchAppSettings = async () => {
      if (!mounted) return;
      setCheckingSettings(true);
      setSettingsError(false);

      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 5000),
        );

        const { data, error } = (await Promise.race([
          supabase.rpc("get_signup_setting"),
          timeout,
        ])) as any;

        if (!mounted) return;

        if (error) throw error;

        if (data && typeof data.enabled === "boolean") {
          setSignupEnabled(data.enabled);
        } else {
          console.warn(
            "Signup setting not found or invalid, defaulting to disabled.",
          );
          setSignupEnabled(false);
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to fetch signup settings:", err);
        setSignupEnabled(false);
        setSettingsError(true);
      } finally {
        if (mounted) setCheckingSettings(false);
      }
    };

    fetchAppSettings();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || checkingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {signupEnabled ? t("signInRegister") : t("signIn")}
        </h1>

        {settingsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-base">{t("error")}</AlertTitle>
            <AlertDescription className="text-sm">
              {t("couldNotLoadSettings")}
            </AlertDescription>
          </Alert>
        )}

        <Auth
          supabaseClient={supabase}
          localization={{
            variables: {
              sign_in: {
                email_label: t("emailLabel"),
                password_label: t("passwordLabel"),
                email_input_placeholder: t("emailPlaceholder"),
                password_input_placeholder: t("passwordPlaceholder"),
                button_label: t("signInButton"),
                loading_button_label: t("signingIn"),
                link_text: t("alreadyHaveAccountLink"),
              },
              sign_up: {
                email_label: t("emailLabel"),
                password_label: t("passwordLabel"),
                email_input_placeholder: t("emailPlaceholder"),
                password_input_placeholder: t("passwordPlaceholder"),
                button_label: t("signUpButton"),
                loading_button_label: t("signingUp"),
                link_text: t("signUpLink"),
              },
              forgotten_password: {
                email_label: t("emailLabel"),
                email_input_placeholder: t("emailPlaceholder"),
                button_label: t("sendInstructionsButton"),
                link_text: t("forgotPasswordLink"),
              },
            },
          }}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#000000",
                  brandAccent: "#333333",
                },
              },
            },
          }}
          theme="light"
          showLinks={signupEnabled}
          view="sign_in"
        />
        {!signupEnabled && !settingsError && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {t("signupDisabled")}
          </p>
        )}
      </div>
    </div>
  );
}
