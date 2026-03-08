'use client';

import { useState } from 'react';
import { useToast } from './ToastNotification';
import { inviteVendor } from '@/lib/api';
import type { VendorMatch } from '@/types/project';

interface Props {
  match: VendorMatch;
  projectId: string;
}

export default function VendorMatchCard({ match, projectId }: Props) {
  const { showToast } = useToast();
  const [invited, setInvited] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    setLoading(true);
    try {
      await inviteVendor(projectId, match.vendor_id, match.match_score, match.fit_analysis);
      setInvited(true);
      showToast('Invitation delivered to vendor\'s workspace.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send invite', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="match-card fade-in">
      <div className="match-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0 }}>{match.business_name}</h3>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.3rem' }}>Domain: {match.domain}</div>
        </div>
        <div className="match-score">{match.match_score}% MATCH</div>
      </div>

      <div className="tech-badges">
        {match.skills.map((skill) => (
          <span key={skill} className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>{skill}</span>
        ))}
      </div>

      <div className="match-reason">
        <strong>Why they matched:</strong> {match.match_reason}
      </div>

      <div className="match-footer">
        <button
          className="invite-btn"
          onClick={handleInvite}
          disabled={loading || invited}
          style={invited ? { background: 'rgba(0, 242, 254, 0.2)', color: '#00f2fe' } : {}}
        >
          {invited ? 'INVITATION SENT ✓' : loading ? 'SENDING...' : 'INVITE TO PROJECT'}
        </button>
      </div>
    </div>
  );
}
