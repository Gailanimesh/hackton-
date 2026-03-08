'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import VendorInvitationCard from '@/components/VendorInvitationCard';
import VendorProfileForm from '@/components/VendorProfileForm';
import { getVendorInvitations, getVendorProfile } from '@/lib/api';
import type { Invitation } from '@/types/vendor';

export default function VendorInboxPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    try {
      const res = await getVendorInvitations(user.id);
      setInvitations(res.data || []);
    } catch {
      setInvitations([]);
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Verify vendor profile exists, else redirect to profile creation
      getVendorProfile(user.id).then(({ data }) => {
        if (!data) router.replace('/vendor/profile');
        else fetchInvitations();
      }).catch(() => fetchInvitations());
    }
  }, [user, router, fetchInvitations]);

  if (authLoading || !user) return (
    <div style={{ textAlign: 'center', padding: '10rem' }}>
      <div className="loader" style={{ display: 'block', margin: '0 auto' }} />
    </div>
  );

  if (isEditing) {
    return (
      <div id="app" className="container">
        <header>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Image src="/logo.png" alt="VENDEX Logo" width={300} height={150} style={{ objectFit: 'contain' }} priority />
          </div>
        </header>
        <VendorProfileForm
          userId={user.id}
          isEditing
          onSaved={() => { setIsEditing(false); fetchInvitations(); }}
        />
      </div>
    );
  }

  return (
    <div id="app" className="container">
      {/* Header */}
      <header>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
          <button
            className="badge"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', padding: '0.5rem 1rem' }}
            onClick={() => setIsEditing(true)}
          >
            ✏️ EDIT PROFILE
          </button>
          <button
            className="badge"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem 1rem' }}
            onClick={logout}
          >
            LOGOUT
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Image src="/logo.png" alt="VENDEX Logo" width={300} height={150} style={{ objectFit: 'contain' }} priority />
        </div>
        <p className="subtitle">Welcome back, {user.email}. Here are your project invitations.</p>
      </header>

      {/* Invitations */}
      {fetching ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loader" style={{ display: 'block', margin: '0 auto' }} />
        </div>
      ) : invitations.length === 0 ? (
        <div style={{ textAlign: 'center', opacity: 0.6, padding: '2rem', background: 'var(--glass-bg)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          No new invitations yet. We will notify you when a Manager selects you!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {invitations.map((inv) => (
            <VendorInvitationCard key={inv.id} invitation={inv} onUpdate={fetchInvitations} />
          ))}
        </div>
      )}
    </div>
  );
}
