// Manually declare Deno namespace for TypeScript compilation
declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token, password } = await req.json();

    if (!access_token || !password) {
      console.warn(
        "[verify-share-link-and-serve-data] Missing required fields: access_token, password",
      );
      return new Response(
        JSON.stringify({
          error: "Missing required fields: access_token, password",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const supabaseAnonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data: shareLink, error: linkError } = await supabaseAdmin
      .from("shared_project_links")
      .select(
        "*, projects(id, name, description, type, size, location, client_requirements, duration_days, created_at, updated_at, size_unit, duration_unit, currency)",
      )
      .eq("access_token", access_token)
      .single();

    if (linkError || !shareLink) {
      console.error(
        "[verify-share-link-and-serve-data] Error fetching share link:",
        linkError,
      );
      return new Response(
        JSON.stringify({ error: "Invalid access token or link not found." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (new Date(shareLink.expires_at) < new Date()) {
      console.warn(
        `[verify-share-link-and-serve-data] Expired share link accessed for project ${shareLink.project_id}.`,
      );
      return new Response(
        JSON.stringify({ error: "Share link has expired." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      shareLink.password_hash,
    );
    if (!isPasswordValid) {
      console.warn(
        `[verify-share-link-and-serve-data] Incorrect password for project ${shareLink.project_id}.`,
      );
      return new Response(JSON.stringify({ error: "Incorrect password." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const publicProjectData = shareLink.projects;
    console.log(
      `[verify-share-link-and-serve-data] Successfully verified share link for project ${shareLink.project_id}.`,
    );

    const { data: totals, error: totalsError } = await supabaseAdmin
      .rpc("get_project_totals", {
        p_project_id: shareLink.project_id,
      })
      .single();

    if (totalsError) {
      console.error(
        "[verify-share-link-and-serve-data] Error fetching project totals:",
        totalsError,
      );
      return new Response(
        JSON.stringify({ error: "Failed to fetch project totals." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: dropdownOptions, error: dropdownError } =
      await supabaseAnonClient
        .from("dropdown_settings")
        .select("value, translations, category");

    if (dropdownError) {
      console.error(
        "[verify-share-link-and-serve-data] Error fetching dropdown options:",
        dropdownError,
      );
      return new Response(
        JSON.stringify({ error: "Failed to fetch dropdown options." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: currencyRates, error: currencyRatesError } =
      await supabaseAnonClient
        .from("currency_rates")
        .select("currency_code, rate_to_usd");

    if (currencyRatesError) {
      console.error(
        "[verify-share-link-and-serve-data] Error fetching currency rates:",
        currencyRatesError,
      );
      return new Response(
        JSON.stringify({ error: "Failed to fetch currency rates." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        project: publicProjectData,
        totals,
        dropdownOptions,
        currencyRates,
        success: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("[verify-share-link-and-serve-data] Unhandled error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
