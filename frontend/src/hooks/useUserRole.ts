import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export type Role = 'defense' | 'commercial' | 'anonymous';
export type Mode = 'academic' | 'tactical';

/**
 * Role hook backed by Supabase Auth (no-op when Supabase isn't configured —
 * returns anonymous so the UI falls back to the current toggle behavior).
 */
export function useUserRole() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>('anonymous');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) resolveRole(data.session);
      else setRole('anonymous');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) resolveRole(newSession);
      else setRole('anonymous');
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveRole = async (s: Session) => {
    const metaRole = s.user.user_metadata?.role;
    if (metaRole === 'defense' || metaRole === 'commercial') {
      setRole(metaRole);
      return;
    }
    // Fallback: public.user_profiles table (setup in MANUAL_STEPS.md)
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', s.user.id)
        .single();
      if (data?.role === 'defense' || data?.role === 'commercial') {
        setRole(data.role);
        return;
      }
    } catch {
      // table missing or RLS blocked — fall through to default
    }
    setRole('commercial');
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, role, loading, signIn, signOut };
}

/** Can the user see the tactical UI? */
export function canAccessTactical(role: Role): boolean {
  return role === 'defense';
}
