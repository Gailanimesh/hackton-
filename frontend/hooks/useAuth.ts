'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logout } from '@/lib/auth';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@supabase/supabase-js';

/**
 * useAuth — provides current user, role, logout, and loading state.
 * Subscribes to Supabase auth changes in real-time.
 */
export function useAuth() {
  const { user, role, setUser, setRole } = useAppStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role ?? 'manager');
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u: User | null = session?.user ?? null;
        setUser(u);
        setRole(u?.user_metadata?.role ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setRole]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setRole(null);
    router.push('/auth');
  };

  return { user, role, loading, logout: handleLogout };
}
