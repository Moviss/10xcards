import type { APIRoute } from "astro";

import { authenticateRequest, isAuthError } from "../../lib/helpers/auth.helper";
import { generateFlashcardsSchema, getGenerationLogsQuerySchema } from "../../lib/schemas/generation.schema";
import { createGenerationService, GenerationServiceError } from "../../lib/services/generation.service";

export const prerender = false;

export const GET: APIRoute = async ({ request, url, locals }) => {
  const authResult = await authenticateRequest(request, locals.supabase);

  if (isAuthError(authResult)) {
    return authResult.response;
  }

  const { supabaseWithAuth } = authResult;

  const queryParams = Object.fromEntries(url.searchParams.entries());
  const validationResult = getGenerationLogsQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return new Response(JSON.stringify({ error: firstError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { page, limit } = validationResult.data;

  try {
    const generationService = createGenerationService(supabaseWithAuth);
    const result = await generationService.getGenerationLogs(page, limit);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof GenerationServiceError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Unexpected error in GET /api/generations:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

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

  const validationResult = generateFlashcardsSchema.safeParse(body);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return new Response(JSON.stringify({ error: firstError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const generationService = createGenerationService(supabaseWithAuth);
    const result = await generationService.generateFlashcards(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof GenerationServiceError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Unexpected error in POST /api/generations:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
