import { defineMiddleware } from "astro:middleware";

import { getSupabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = getSupabaseClient();
  return next();
});
