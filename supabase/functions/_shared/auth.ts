declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createSupabaseClient } from "./supabaseClient.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role?: string;
};

export async function authenticateRequest(
  req: Request,
): Promise<AuthenticatedUser> {
  if (req.method === "OPTIONS") {
    throw new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized: Missing Authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new Response(
      JSON.stringify({
        error: "Unauthorized: Invalid Authorization header format",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const supabase = createSupabaseClient(req);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      throw new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: role, error: roleError } =
      await supabase.rpc("get_user_role");

    if (roleError) {
      console.error("Error fetching user role:", roleError.message);
      throw new Response(
        JSON.stringify({ error: "Forbidden: Could not retrieve user role" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return {
      id: user.id,
      email: user.email!,
      role: role as string,
    };
  } catch (e: any) {
    console.error("Authentication failed:", e.message);
    if (e instanceof Response) {
      throw e;
    }
    throw new Response(
      JSON.stringify({ error: "Unauthorized: Authentication failed" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

export function withAuth(
  handler: (user: AuthenticatedUser, req: Request) => Promise<Response>,
) {
  return serve(async (req) => {
    try {
      const user = await authenticateRequest(req);
      return await handler(user, req);
    } catch (response) {
      if (response instanceof Response) {
        return response;
      }
      console.error("Unhandled error in withAuth:", response);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  });
}
