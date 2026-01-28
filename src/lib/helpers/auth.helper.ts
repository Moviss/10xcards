import type { User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { SupabaseClient } from "../../db/supabase.client";

export interface AuthResult {
  user: User;
  token: string;
  supabaseWithAuth: SupabaseClient;
}

export interface AuthError {
  response: Response;
}

function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return "response" in result;
}

export async function authenticateRequest(request: Request, supabase: SupabaseClient): Promise<AuthResult | AuthError> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const token = authHeader.substring(7);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;
  const supabaseWithAuth = createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  return { user, token, supabaseWithAuth };
}

export { isAuthError };
