import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are configured. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Non-null for backward compatibility with existing call sites. When env vars
 * are missing, a placeholder client is created (calls fail harmlessly at the
 * network layer). New code should branch on `isSupabaseConfigured` first and
 * fall back to mock/sim data — see hooks/useRealtimeTelemetry.ts.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — ' +
    'live features disabled. Copy frontend/.env.example to frontend/.env.local.'
  );
}
