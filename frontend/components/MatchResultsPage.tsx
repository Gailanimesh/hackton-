'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastNotification';
import { inviteVendor } from '@/lib/api';
import type { VendorMatch } from '@/types/vendor';

interface Props {
  matches: VendorMatch[];
  projectId: string;
  projectName: string;
  onEnterWarRoom?: () => void;
  onBack?: () => void;
}

function MatchCard({ match, projectId }: { match: VendorMatch; projectId: string }) {
  const { showToast } = useToast();
  const [invited, setInvited] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    setLoading(true);
    try {
      await inviteVendor(projectId, match.vendor_id, match.match_score, match.fit_analysis);
      setInvited(true);
      showToast('Invitation sent to vendor!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send invite', 'error');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    match.match_score >= 75 ? '#0ba360' : match.match_score >= 50 ? '#f0a500' : '#00f2fe';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '24px',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
      overflow: 'hidden',
      ['--score-color' as string]: scoreColor,
    }}
    className="match-card-page"
    >


      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{match.business_name}</h3>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>🌐 {match.domain}</p>
        </div>
        <div style={{
          background: `rgba(${scoreColor === '#0ba360' ? '11,163,96' : scoreColor === '#f0a500' ? '240,165,0' : '0,242,254'},0.15)`,
          border: `1px solid ${scoreColor}55`,
          color: scoreColor,
          padding: '0.5rem 1.1rem',
          borderRadius: '30px',
          fontWeight: 800,
          fontSize: '1rem',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {match.match_score}% MATCH
        </div>
      </div>

      {/* Skills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {match.skills.map((skill) => (
          <span key={skill} style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.3rem 0.8rem',
            borderRadius: '30px',
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.7)',
          }}>
            {skill}
          </span>
        ))}
      </div>

      {/* Match Reason */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: `3px solid ${scoreColor}88`,
        borderRadius: '12px',
        padding: '1rem',
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.6,
        fontStyle: 'italic',
        flex: 1,
      }}>
        <strong style={{ color: '#fff', fontStyle: 'normal' }}>Why they matched: </strong>
        {match.match_reason}
      </div>

      {/* Invite Button */}
      <button
        onClick={handleInvite}
        disabled={loading || invited}
        style={{
          width: '100%',
          padding: '0.9rem',
          borderRadius: '14px',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: invited || loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          background: invited
            ? 'rgba(11,163,96,0.2)'
            : 'linear-gradient(135deg, rgba(0,242,254,0.15) 0%, rgba(79,172,254,0.15) 100%)',
          border: `1px solid ${invited ? '#0ba36070' : 'rgba(0,242,254,0.3)'}`,
          color: invited ? '#0ba360' : '#00f2fe',
          letterSpacing: '0.05em',
        }}
      >
        {invited ? '✓ INVITATION SENT' : loading ? 'SENDING...' : 'INVITE TO PROJECT →'}
      </button>
    </div>
  );
}

export default function MatchResultsPage({ matches, projectId, projectName, onEnterWarRoom, onBack }: Props) {
  const router = useRouter();
  const goBack = onBack ?? (() => router.back());
  const goWarRoom = onEnterWarRoom ?? (() => router.push(`/war-room/${projectId}`));

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', padding: '4rem 2rem 3rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{
          display: 'inline-block',
          fontSize: '0.65rem',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '30px',
          padding: '0.4rem 1.25rem',
          marginBottom: '1.5rem',
          background: 'rgba(255,255,255,0.03)',
        }}>
          🎯 AI Procurement Intelligence
        </div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          margin: '0 0 0.75rem',
          background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          AI Match Results
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', margin: '0 auto 2rem', maxWidth: '500px' }}>
          Recommended vendors based on your project requirements for <strong style={{ color: '#fff' }}>{projectName}</strong>
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.5rem 1.25rem', borderRadius: '30px', background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.2)', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 600 }}>
            {matches.length} Qualified Vendor{matches.length !== 1 ? 's' : ''} Found
          </div>
          <div style={{ padding: '0.5rem 1.25rem', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
            Min. 35% Match Threshold Applied
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '3rem 2rem' }}>
        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(255,100,100,0.07)', borderRadius: '24px', border: '1px solid rgba(255,100,100,0.2)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
            <h3 style={{ color: '#ff6b6b', margin: '0 0 1rem', fontSize: '1.5rem' }}>No Vendors Available for Mapping</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '450px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              No vendors met the minimum 35% AI Match Threshold for these project constraints. Try adjusting your budget, timeline, or technical requirements.
            </p>
            <button
              onClick={goBack}
              style={{ padding: '0.9rem 2rem', borderRadius: '14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ← Adjust Constraints &amp; Retry
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '2rem',
          }}>
            {matches.map((m) => (
              <MatchCard key={m.vendor_id} match={m} projectId={projectId} />
            ))}
          </div>
        )}

        {/* Actions Footer */}
        {matches.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              onClick={goBack}
              style={{ padding: '0.9rem 1.75rem', borderRadius: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.3s' }}
            >
              ← Back to Configuration
            </button>
            <button
              onClick={goWarRoom}
              style={{ padding: '0.9rem 2rem', borderRadius: '14px', background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
            >
              ENTER WAR ROOM 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
