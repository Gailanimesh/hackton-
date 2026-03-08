'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastNotification';
import { respondInvitation } from '@/lib/api';
import type { Invitation } from '@/types/vendor';

interface Props {
  invitation: Invitation;
  onUpdate: () => void;
}

export default function VendorInvitationCard({ invitation: inv, onUpdate }: Props) {
  const { showToast } = useToast();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleRespond = async (action: 'accepted' | 'declined' | 'interested') => {
    setProcessing(true);
    try {
      await respondInvitation(inv.id, action);
      if (action === 'accepted') {
        showToast('Project Accepted! Entering War Room...', 'success');
        setTimeout(() => router.push(`/war-room/${inv.project_id}`), 1000);
      } else if (action === 'interested') {
        showToast('Interest submitted! Awaiting Manager AI Selection.', 'success');
        onUpdate();
      } else {
        showToast('Invitation declined.', 'success');
        onUpdate();
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Failed to respond';
      if (msg.includes('already been assigned')) {
        showToast('⚠️ Unfortunately, this project was already accepted by another vendor.', 'error');
        // Refresh the list to show this invitation gracefully moving to 'declined/unavailable' status
        setTimeout(onUpdate, 2000);
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setProcessing(false);
    }
  };

  const hasRfp = !!inv.project_details?.rfp_rules;
  const acceptAction = hasRfp ? 'interested' : 'accepted';
  const acceptText = hasRfp ? 'Submit Proposal / Interest' : 'Accept & Enter War Room';

  return (
    <div className="match-card fade-in" style={{ textAlign: 'left' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, color: '#00f2fe' }}>
            {inv.project_details?.project_name || 'Unknown Project'}
          </h3>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.3rem' }}>
            Match Score: <span style={{ color: '#00f2fe', fontWeight: 'bold' }}>{inv.match_score ?? 'N/A'}%</span>
            &nbsp;|&nbsp; Status: {inv.status.toUpperCase()}
          </div>
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'right' }}>
          Budget: ${inv.project_details?.budget ?? 'N/A'}<br />
          Deadline: {inv.project_details?.deadline ?? 'N/A'}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="match-reason" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0, 242, 254, 0.05)', borderLeft: '3px solid #00f2fe', borderRadius: '8px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Proposal Analysis</div>
        <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
          {inv.fit_analysis || 'Review the requirements below to verify alignment with your capabilities.'}
        </div>
      </div>

      {/* Requirements */}
      <div className="match-reason" style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
        <strong>Requirements:</strong> {inv.project_details?.required_technologies || 'None specified'}<br /><br />
        <strong>Mode:</strong> {inv.project_details?.work_mode || 'N/A'} &nbsp;|&nbsp; <strong>Tier:</strong> {inv.project_details?.service_tier || 'N/A'}
        {hasRfp && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,165,0,0.1)', borderLeft: '3px solid orange', borderRadius: '4px' }}>
            <strong style={{ color: 'orange' }}>RFP Rules:</strong> {inv.project_details?.rfp_rules}
          </div>
        )}
      </div>

      {/* Actions */}
      {inv.status === 'pending' ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button
            className="auth-btn"
            style={{ width: 'auto', background: 'transparent', border: '1px solid rgba(255,68,68,0.5)', color: '#ff4444' }}
            onClick={() => handleRespond('declined')}
            disabled={processing}
          >
            Decline
          </button>
          <button className="match-btn" style={{ width: 'auto', margin: 0 }} onClick={() => handleRespond(acceptAction)} disabled={processing}>
            {acceptText}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <button
            className="match-btn"
            style={{ 
              width: '100%', margin: 0, 
              background: inv.status === 'accepted' ? '#00f2fe' : (inv.status === 'interested' ? 'orange' : 'rgba(255,255,255,0.1)'), 
              color: (inv.status === 'accepted' || inv.status === 'interested') ? '#000' : '#fff' 
            }}
            disabled={inv.status === 'declined' || inv.status === 'interested'}
            onClick={() => inv.status === 'accepted' && router.push(`/war-room/${inv.project_id}`)}
          >
            {inv.status === 'accepted' ? 'ENTER WAR ROOM' : (inv.status === 'interested' ? 'PROPOSAL SUBMITTED' : 'DECLINED')}
          </button>
        </div>
      )}
    </div>
  );
}
