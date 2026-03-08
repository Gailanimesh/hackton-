'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WarRoomEntry {
  project_id: string;
  project_name: string;
  invitation_status: 'pending' | 'accepted' | 'interested';
  interested_count?: number;
}

interface Props {
  userId: string;
}

import { runMapperSelection } from '@/lib/api';
import { useToast } from './ToastNotification';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function ActiveWarRooms({ userId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [entries, setEntries] = useState<WarRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mappingId, setMappingId] = useState<string | null>(null);

  const fetchRooms = () => {
    if (!userId) return;
    fetch(`${API_BASE}/manager-war-rooms?user_id=${userId}`)
      .then((r) => r.json())
      .then((res) => setEntries(res.data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRooms();
  }, [userId]);

  const handleRunMapper = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setMappingId(projectId);
    showToast('AI Mapper evaluating vendors based on RFP rules...', 'success');
    try {
      const res = await runMapperSelection(projectId);
      showToast(`🏆 Winner selected: ${res.reasoning}`, 'success');
      // Refresh list to update status to accepted
      setTimeout(fetchRooms, 1500);
    } catch (err: any) {
      showToast(err instanceof Error ? err.message : 'Mapper failed', 'error');
    } finally {
      setMappingId(null);
    }
  };

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
                background: entry.invitation_status === 'interested' ? 'rgba(255,165,0,0.2)' : `${accentColor}20`,
                border: `1px solid ${entry.invitation_status === 'interested' ? 'orange' : accentColor}50`,
                color: entry.invitation_status === 'interested' ? 'orange' : accentColor,
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '0.25rem 0.75rem',
                borderRadius: '30px',
                marginBottom: '0.75rem',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: entry.invitation_status === 'interested' ? 'orange' : accentColor, display: 'inline-block' }} />
                {isAccepted ? 'Vendor Accepted' : (entry.invitation_status === 'interested' ? 'Proposals Pending' : 'Invite Sent')}
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                {entry.project_name}
              </div>

              {entry.invitation_status === 'interested' ? (
                <button
                  onClick={(e) => handleRunMapper(e, entry.project_id)}
                  disabled={mappingId === entry.project_id}
                  style={{
                    width: '100%', marginTop: 'auto', background: 'orange', color: '#000',
                    border: 'none', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '0.8rem',
                    opacity: mappingId === entry.project_id ? 0.7 : 1
                  }}
                >
                  {mappingId === entry.project_id ? 'EVALUATING...' : `RUN AI MAPPER (${entry.interested_count} Proposals)`}
                </button>
              ) : (
                <div style={{ fontSize: '0.78rem', color: `${accentColor}cc`, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Open War Room →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
