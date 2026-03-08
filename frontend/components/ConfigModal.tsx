'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastNotification';
import { configureProject, matchVendors } from '@/lib/api';
import type { VendorMatch } from '@/types/vendor';
import MatchResultsPage from './MatchResultsPage';

interface Props {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

const MIN_SCORE = 30;

export default function ConfigModal({ projectId, projectName, onClose }: Props) {
  const { showToast } = useToast();
  const router = useRouter();
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [mode, setMode] = useState<'remote' | 'onsite' | 'hybrid'>('remote');
  const [tier, setTier] = useState<'speed' | 'quality'>('speed');
  const [rfp, setRfp] = useState('');
  const [matching, setMatching] = useState(false);
  // Store results in state — no redirect, no re-fetch
  const [matches, setMatches] = useState<VendorMatch[] | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleMatch = async () => {
    const budgetNum = parseFloat(budget);
    if (!budgetNum || !deadline) { showToast('Please fill in budget and deadline.', 'error'); return; }
    if (budgetNum < 200) { showToast('Budget must be at least $200.', 'error'); return; }
    if (deadline < today) { showToast('Deadline must be in the future.', 'error'); return; }

    setMatching(true);
    try {
      await configureProject({ project_id: projectId, budget: budgetNum, deadline, work_mode: mode, service_tier: tier, rfp_rules: rfp });
      const res = await matchVendors(projectId);
      // Filter once, store — no re-fetching on another page
      setMatches(res.matches.filter(m => m.match_score >= MIN_SCORE));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Matching failed', 'error');
    } finally {
      setMatching(false);
    }
  };

  // When matches are ready, render as a full-screen overlay (no new route)
  if (matches !== null) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: '#050505',
        overflowY: 'auto',
      }}>
        {/* Slim top bar with close */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', justifyContent: 'flex-end',
          padding: '1rem 2rem',
          background: 'rgba(5,5,5,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
          >
            ✕ Close
          </button>
        </div>

        {/* Full-page match results — data already fetched, no re-call */}
        <MatchResultsPage
          matches={matches}
          projectId={projectId}
          projectName={projectName}
          onEnterWarRoom={() => { onClose(); router.push(`/war-room/${projectId}`); }}
          onBack={() => setMatches(null)}
        />
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="config-drawer scale-up">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Configure Execution</h3>
            <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Setting parameters for: {projectName}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        {/* Config Fields */}
        <div className="config-grid">
          <div className="config-field">
            <label>Budget (USD)</label>
            <input type="number" placeholder="e.g. 5000" min="200" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="config-field">
            <label>Deadline</label>
            <input type="date" min={today} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="config-field">
            <label>Work Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              <option value="remote">Remote</option>
              <option value="onsite">On-Site</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="config-field">
            <label>Priority Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as typeof tier)}>
              <option value="speed">Speed (Fast Delivery)</option>
              <option value="quality">Quality (Enterprise Grade)</option>
            </select>
          </div>
          <div className="config-field" style={{ gridColumn: 'span 2' }}>
            <label>RFP Rules (Optional)</label>
            <input type="text" placeholder="e.g. Must have ISO 27001, 5+ years experience" value={rfp} onChange={(e) => setRfp(e.target.value)} />
          </div>
        </div>

        <button className="match-btn" onClick={handleMatch} disabled={matching}>
          {matching ? '🔍 AI IS SCANNING VENDORS...' : 'FIND MATCHING VENDORS 🚀'}
        </button>
      </div>
    </div>
  );
}
