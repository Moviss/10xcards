import type { APIRoute } from "astro";

import { authenticateRequest, isAuthError } from "../../../../lib/helpers/auth.helper";
import { uuidSchema } from "../../../../lib/schemas/flashcard.schema";
import { createFlashcardService, FlashcardServiceError } from "../../../../lib/services/flashcard.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, params, locals }) => {
  const authResult = await authenticateRequest(request, locals.supabase);

  if (isAuthError(authResult)) {
    return authResult.response;
  }

  const { supabaseWithAuth } = authResult;

  const idValidation = uuidSchema.safeParse(params.id);
  if (!idValidation.success) {
    return new Response(JSON.stringify({ error: "Nieprawidłowy format identyfikatora" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const flashcardService = createFlashcardService(supabaseWithAuth);
    const result = await flashcardService.resetProgress(idValidation.data);

    if (!result) {
      return new Response(JSON.stringify({ error: "Flashcard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof FlashcardServiceError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Unexpected error in POST /api/flashcards/[id]/reset-progress:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
