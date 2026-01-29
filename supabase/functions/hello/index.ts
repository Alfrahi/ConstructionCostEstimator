declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

import { withAuth, AuthenticatedUser, corsHeaders } from "../_shared/auth.ts";

async function helloHandler(
  user: AuthenticatedUser,
  req: Request,
): Promise<Response> {
  const { name } = await req.json();

  console.log(
    `User ${user.email} (${user.id}) with role ${user.role} called hello function.`,
  );

  return new Response(
    JSON.stringify({
      message: `Hello, ${name}! Authenticated as ${user.email}.`,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

export default withAuth(helloHandler);
