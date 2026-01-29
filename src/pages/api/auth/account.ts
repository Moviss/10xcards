import type { APIRoute } from "astro";

import { getSupabaseAdminClient } from "../../../db/supabase.admin";
import { authenticateRequest, isAuthError } from "../../../lib/helpers/auth.helper";
import { AuthServiceError, deleteUserAccount } from "../../../lib/services/auth.service";

export const prerender = false;

export const DELETE: APIRoute = async ({ request, locals }) => {
  const authResult = await authenticateRequest(request, locals.supabase);

  if (isAuthError(authResult)) {
    return authResult.response;
  }

  const { user } = authResult;

  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const result = await deleteUserAccount(supabaseAdmin, user.id);

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

    console.error("Unexpected error in DELETE /api/auth/account:", error);
    return new Response(JSON.stringify({ error: "Failed to delete account" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
