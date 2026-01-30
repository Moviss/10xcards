import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { AuthLoginResponseDTO, AuthRegisterResponseDTO, MessageResponseDTO } from "../../types";

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export class AuthService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async register(email: string, password: string): Promise<AuthRegisterResponseDTO> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        throw new AuthServiceError("User already registered", 409);
      }
      console.error("Supabase signUp error:", error.message);
      throw new AuthServiceError("Registration failed", 500);
    }

    if (!data.user) {
      throw new AuthServiceError("Registration failed", 500);
    }

    // If email confirmation is enabled, session may be null
    if (!data.session) {
      throw new AuthServiceError("Email confirmation required. Please check your inbox.", 202);
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
        created_at: data.user.created_at,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at ?? 0,
      },
    };
  }

  async login(email: string, password: string): Promise<AuthLoginResponseDTO> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new AuthServiceError("Invalid login credentials", 401);
      }
      throw new AuthServiceError("Login failed", 500);
    }

    if (!data.user || !data.session) {
      throw new AuthServiceError("Login failed", 500);
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at ?? 0,
      },
    };
  }

  async logout(): Promise<MessageResponseDTO> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new AuthServiceError("Logout failed", 500);
    }

    return {
      message: "Successfully logged out",
    };
  }
}

export async function deleteUserAccount(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string
): Promise<MessageResponseDTO> {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    if (error.message.includes("not found")) {
      throw new AuthServiceError("User not found", 404);
    }
    throw new AuthServiceError("Failed to delete account", 500);
  }

  return {
    message: "Account successfully deleted",
  };
}

export function createAuthService(supabase: SupabaseClient<Database>): AuthService {
  return new AuthService(supabase);
}
