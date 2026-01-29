import type { APIRoute } from "astro";

import { authenticateRequest, isAuthError } from "../../../lib/helpers/auth.helper";
import { createStudyService, StudyServiceError } from "../../../lib/services/study.service";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const authResult = await authenticateRequest(request, locals.supabase);

  if (isAuthError(authResult)) {
    return authResult.response;
  }

  const { user, supabaseWithAuth } = authResult;

  try {
    const studyService = createStudyService(supabaseWithAuth);
    const result = await studyService.getStudySession(user.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof StudyServiceError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Unexpected error in GET /api/study/session:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
