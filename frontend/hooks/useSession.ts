'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * useSession — redirects unauthenticated users to /auth.
 * Use in any protected page to guard access.
 */
export function useSession() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth');
      }
    });
  }, [router]);
}
