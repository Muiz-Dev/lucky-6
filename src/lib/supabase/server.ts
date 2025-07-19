// lib/supabase/server.ts
import { createClient as createServerClient } from "@supabase/supabase-js"

export function createClient() {
  // Create a Supabase client for server-side operations
  // This client uses the service role key for elevated privileges
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
