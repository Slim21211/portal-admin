import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../api/supabaseClient';

export type AdminStatus = 'loading' | 'signed-out' | 'forbidden' | 'admin';

export function useAdminSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  // Внутри onAuthStateChange нельзя ждать запросы к supabase, поэтому проверка отдельно
  useEffect(() => {
    if (!userId) {
      setIsAdmin(null);
      return;
    }
    let cancelled = false;
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!cancelled) setIsAdmin(!error && data === true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  let status: AdminStatus;
  if (session === undefined) status = 'loading';
  else if (!session) status = 'signed-out';
  else if (isAdmin === null) status = 'loading';
  else status = isAdmin ? 'admin' : 'forbidden';

  return { status, email: session?.user.email ?? null };
}
