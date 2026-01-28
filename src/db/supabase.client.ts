import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

export type { SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}
