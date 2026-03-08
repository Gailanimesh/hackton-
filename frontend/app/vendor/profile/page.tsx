'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import VendorProfileForm from '@/components/VendorProfileForm';
import { getVendorProfile } from '@/lib/api';

export default function VendorProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If vendor already has a profile, redirect to inbox
  useEffect(() => {
    if (!loading && user) {
      getVendorProfile(user.id).then(({ data }) => {
        if (data) router.replace('/vendor/inbox');
      }).catch(() => {});
    }
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) return (
    <div style={{ textAlign: 'center', padding: '10rem' }}>
      <div className="loader" style={{ display: 'block', margin: '0 auto' }} />
    </div>
  );

  return (
    <div id="app" className="container">
      <header>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Image src="/logo.png" alt="VENDEX Logo" width={300} height={150} style={{ objectFit: 'contain' }} priority />
        </div>
        <p className="subtitle">Set up your vendor profile to start receiving project invitations.</p>
      </header>
      <VendorProfileForm
        userId={user.id}
        onSaved={() => router.push('/vendor/inbox')}
      />
    </div>
  );
}
