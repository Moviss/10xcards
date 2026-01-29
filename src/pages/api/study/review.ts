import type { APIRoute } from "astro";

import { authenticateRequest, isAuthError } from "../../../lib/helpers/auth.helper";
import { submitReviewSchema } from "../../../lib/schemas/study.schema";
import { createStudyService, StudyServiceError } from "../../../lib/services/study.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const authResult = await authenticateRequest(request, locals.supabase);

  if (isAuthError(authResult)) {
    return authResult.response;
  }

  const { user, supabaseWithAuth } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Nieprawidłowy format JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = submitReviewSchema.safeParse(body);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return new Response(JSON.stringify({ error: firstError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const studyService = createStudyService(supabaseWithAuth);
    const result = await studyService.submitReview(user.id, validationResult.data);

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

    console.error("Unexpected error in POST /api/study/review:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
