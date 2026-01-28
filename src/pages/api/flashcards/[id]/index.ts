import type { APIRoute } from "astro";

import { authenticateRequest, isAuthError } from "../../../../lib/helpers/auth.helper";
import { updateFlashcardSchema, uuidSchema } from "../../../../lib/schemas/flashcard.schema";
import { createFlashcardService, FlashcardServiceError } from "../../../../lib/services/flashcard.service";

export const prerender = false;

export const GET: APIRoute = async ({ request, params, locals }) => {
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
    const flashcard = await flashcardService.getFlashcardById(idValidation.data);

    if (!flashcard) {
      return new Response(JSON.stringify({ error: "Flashcard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(flashcard), {
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

    console.error("Unexpected error in GET /api/flashcards/[id]:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request, params, locals }) => {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Nieprawidłowy format JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = updateFlashcardSchema.safeParse(body);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return new Response(JSON.stringify({ error: firstError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const flashcardService = createFlashcardService(supabaseWithAuth);
    const result = await flashcardService.updateFlashcard(idValidation.data, validationResult.data);

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

    console.error("Unexpected error in PUT /api/flashcards/[id]:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request, params, locals }) => {
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
    const deleted = await flashcardService.deleteFlashcard(idValidation.data);

    if (!deleted) {
      return new Response(JSON.stringify({ error: "Flashcard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Flashcard successfully deleted" }), {
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

    console.error("Unexpected error in DELETE /api/flashcards/[id]:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
