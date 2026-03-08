'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WarRoomEntry {
  project_id: string;
  project_name: string;
  invitation_status: 'pending' | 'accepted';
}

interface Props {
  userId: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function ActiveWarRooms({ userId }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<WarRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/manager-war-rooms?user_id=${userId}`)
      .then((r) => r.json())
      .then((res) => setEntries(res.data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading || entries.length === 0) return null;

  return (
    <div style={{ marginBottom: '3rem' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.65rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
          🚀 Active War Rooms
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{entries.length} Active</span>
      </div>

      {/* Horizontal scroll card row */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {entries.map((entry) => {
          const isAccepted = entry.invitation_status === 'accepted';
          const accentColor = isAccepted ? '#0ba360' : '#f0a500';
          return (
            <div
              key={entry.project_id}
              onClick={() => router.push(`/war-room/${entry.project_id}`)}
              style={{
                flexShrink: 0,
                minWidth: '240px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${accentColor}40`,
                borderRadius: '18px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              className="war-room-quick-card"
            >
              {/* Top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

              {/* Status badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}50`,
                color: accentColor,
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '0.25rem 0.75rem',
                borderRadius: '30px',
                marginBottom: '0.75rem',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor, display: 'inline-block' }} />
                {isAccepted ? 'Vendor Accepted' : 'Invite Sent'}
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                {entry.project_name}
              </div>

              <div style={{ fontSize: '0.78rem', color: `${accentColor}cc`, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Open War Room →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
