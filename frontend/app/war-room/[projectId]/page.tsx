'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import WarRoom from '@/components/WarRoom';

interface Props {
  params: { projectId: string };
}

export default function WarRoomPage({ params }: Props) {
  const { projectId } = params;
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  if (loading || !user) return (
    <div style={{ textAlign: 'center', padding: '10rem' }}>
      <div className="loader" style={{ display: 'block', margin: '0 auto' }} />
    </div>
  );

  return (
    <div id="app" className="container">
      <WarRoom projectId={projectId} userRole={role ?? 'vendor'} />
    </div>
  );
}
