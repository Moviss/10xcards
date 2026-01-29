import type { APIRoute } from "astro";

import { loginSchema } from "../../../lib/schemas/auth.schema";
import { AuthServiceError, createAuthService } from "../../../lib/services/auth.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = loginSchema.safeParse(body);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return new Response(JSON.stringify({ error: firstError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const authService = createAuthService(locals.supabase);
    const result = await authService.login(validationResult.data.email, validationResult.data.password);

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

    console.error("Unexpected error in POST /api/auth/login:", error);
    return new Response(JSON.stringify({ error: "Login failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
