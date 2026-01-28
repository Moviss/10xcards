import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import { generateFlashcardsSchema } from "../../lib/schemas/generation.schema";
import { createGenerationService, GenerationServiceError } from "../../lib/services/generation.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Verify authorization
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.substring(7);

  // Get user from Supabase session
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create authenticated Supabase client with user's token for RLS
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;
  const supabaseWithAuth = createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // 2. Parse and validate request body
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

  // 3. Call GenerationService
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

    console.error("Unexpected error in generations endpoint:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
