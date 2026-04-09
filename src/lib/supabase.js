import { createClient } from '@supabase/supabase-js'

// Frontend transport client for the linked Supabase Cloud project.
// Auth, RLS, RPCs, and Edge Functions are the real backend contract.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
