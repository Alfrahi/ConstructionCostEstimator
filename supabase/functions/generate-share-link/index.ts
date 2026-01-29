declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { withAuth, AuthenticatedUser, corsHeaders } from "../_shared/auth.ts";
import { createSupabaseClient } from "../_shared/supabaseClient.ts";

async function generateShareLinkHandler(
  user: AuthenticatedUser,
  req: Request,
): Promise<Response> {
  try {
    const { project_id, expires_at, password } = await req.json();

    if (!project_id || !expires_at || !password) {
      console.warn(
        "[generate-share-link] Missing required fields: project_id, expires_at, password",
      );
      return new Response(
        JSON.stringify({
          error: "Missing required fields: project_id, expires_at, password",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUserClient = createSupabaseClient(req);

    const { data: canEdit, error: permissionError } =
      await supabaseUserClient.rpc("can_edit_project", {
        p_project_id: project_id,
      });

    if (permissionError) {
      console.error(
        "[generate-share-link] Error checking project edit permission:",
        permissionError,
      );
      return new Response(
        JSON.stringify({ error: "Failed to verify project permissions." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!canEdit) {
      console.warn(
        `[generate-share-link] User ${user.id} (${user.email}) attempted to create share link for project ${project_id} without permission.`,
      );
      return new Response(
        JSON.stringify({
          error:
            "Forbidden: You do not have permission to create share links for this project.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const created_by_user_id = user.id;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const access_token = crypto.randomUUID();

    const { error: insertError } = await supabaseAdmin
      .from("shared_project_links")
      .insert({
        project_id,
        created_by_user_id,
        access_token,
        password_hash,
        expires_at,
      });

    if (insertError) {
      console.error(
        "[generate-share-link] Error inserting share link:",
        insertError,
      );
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      `[generate-share-link] User ${user.id} (${user.email}) successfully created share link for project ${project_id}.`,
    );
    return new Response(JSON.stringify({ success: true, access_token }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[generate-share-link] Unhandled error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export default withAuth(generateShareLinkHandler);
