import type { APIRoute } from "astro";

import { authenticateRequest, isAuthError } from "../../../lib/helpers/auth.helper";
import { AuthServiceError, createAuthService } from "../../../lib/services/auth.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const authResult = await authenticateRequest(request, locals.supabase);

  if (isAuthError(authResult)) {
    return authResult.response;
  }

  const { supabaseWithAuth } = authResult;

  try {
    const authService = createAuthService(supabaseWithAuth);
    const result = await authService.logout();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Unexpected error in POST /api/auth/logout:", error);
    return new Response(JSON.stringify({ error: "Logout failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
