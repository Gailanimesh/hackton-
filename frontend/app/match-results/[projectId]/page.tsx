'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { matchVendors } from '@/lib/api';
import MatchResultsPage from '@/components/MatchResultsPage';
import type { VendorMatch } from '@/types/vendor';

interface Props {
  params: { projectId: string; projectName: string };
  searchParams: { name?: string };
}

export default function MatchResultsRoute({ params, searchParams }: Props) {
  const { projectId } = params;
  const projectName = searchParams.name ?? 'Your Project';
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<VendorMatch[] | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      try {
        const res = await matchVendors(projectId);
        const valid = res.matches.filter((m) => m.match_score >= 35);
        setMatches(valid);
      } catch {
        setMatches([]);
      } finally {
        setFetching(false);
      }
    };
    run();
  }, [projectId, user]);

  if (loading || fetching || !matches) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem' }}>
        <div className="loader" style={{ display: 'block', margin: '0 auto 1.5rem' }} />
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>AI is scanning vendors...</p>
      </div>
    );
  }

  return (
    <div id="app" className="container" style={{ maxWidth: '100%', padding: 0 }}>
      <MatchResultsPage matches={matches} projectId={projectId} projectName={projectName} />
    </div>
  );
}
