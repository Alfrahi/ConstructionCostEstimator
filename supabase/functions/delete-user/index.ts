declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withAuth, AuthenticatedUser, corsHeaders } from "../_shared/auth.ts";

async function deleteUserHandler(
  user: AuthenticatedUser,
  req: Request,
): Promise<Response> {
  if (user.role !== "super_admin") {
    return new Response(
      JSON.stringify({
        error: "Forbidden: Only super_admins can delete users",
      }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { userIdToDelete } = await req.json();

    if (!userIdToDelete) {
      return new Response(
        JSON.stringify({ error: "Missing user ID to delete" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    if (user.id === userIdToDelete) {
      return new Response(
        JSON.stringify({
          error: "Super admins cannot delete their own account",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: targetProfile, error: targetProfileError } =
      await supabaseServiceRole
        .from("profiles")
        .select("role")
        .eq("id", userIdToDelete)
        .single();

    if (targetProfileError) {
      console.error("Error fetching target user profile:", targetProfileError);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve target user profile" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    if (targetProfile.role === "super_admin") {
      return new Response(
        JSON.stringify({ error: "Cannot delete another super admin account" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    const { error: authUserDeleteError } =
      await supabaseServiceRole.auth.admin.deleteUser(userIdToDelete);

    if (authUserDeleteError) {
      console.error(
        "Supabase auth admin delete user error:",
        authUserDeleteError,
      );
      return new Response(
        JSON.stringify({ error: authUserDeleteError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Edge Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}

export default withAuth(deleteUserHandler);
