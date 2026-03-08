'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getWarRoom, generateSubtasks } from '@/lib/api';
import { useToast } from './ToastNotification';
import ProgressBar from './ProgressBar';
import TaskChecklist from './TaskChecklist';
import WarRoomChat from './WarRoomChat';
import type { WarRoomData } from '@/types/task';

interface Props {
  projectId: string;
  userRole: 'manager' | 'vendor';
}

export default function WarRoom({ projectId, userRole }: Props) {
  const { showToast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<WarRoomData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWarRoom = useCallback(async () => {
    setLoading(true);
    try {
      let warRoomData = await getWarRoom(projectId);

      // Auto-generate tasks if none exist
      if (warRoomData.tasks.length === 0) {
        try {
          await generateSubtasks(projectId, warRoomData.project.project_name);
          warRoomData = await getWarRoom(projectId); // Refetch with new tasks
        } catch {
          // Non-fatal: show empty list
        }
      }

      setData(warRoomData);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load War Room', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    fetchWarRoom();
  }, [fetchWarRoom]);

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="loader" style={{ display: 'block', margin: '0 auto 1rem' }} />
        <div>{loading ? 'Initializing War Room...' : 'Loading...'}</div>
      </div>
    );
  }

  const { project, tasks, vendor } = data;
  const completedCount = tasks.filter((t) => t.is_completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const statusColor =
    progressPercent === 100 ? '#0ba360' : progressPercent > 50 ? '#f0a500' : '#00f2fe';
  const statusLabel =
    progressPercent === 100 ? 'COMPLETED' : progressPercent > 0 ? 'IN PROGRESS' : 'STARTING';

  const backButton = userRole === 'manager' ? (
    <button className="back-link-btn" style={{ margin: 0 }} onClick={() => router.push('/dashboard')}>
      ← Dashboard
    </button>
  ) : (
    <button className="back-link-btn" style={{ margin: 0 }} onClick={() => router.push('/vendor/inbox')}>
      ← Inbox
    </button>
  );

  return (
    <div className="war-room-container fade-in">
      {/* Header */}
      <div className="war-room-header">
        <div className="war-room-title-block">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div className="war-room-badge">🚀 WAR ROOM</div>
            <div className="war-room-badge" style={{ background: userRole === 'manager' ? 'rgba(0, 198, 255, 0.2)' : 'rgba(11, 163, 96, 0.2)', color: userRole === 'manager' ? '#00c6ff' : '#0ba360' }}>
              {userRole === 'manager' ? '👁️ MANAGER VIEW' : '⚡ VENDOR VIEW'}
            </div>
          </div>
          <h2 className="war-room-title">{project.project_name}</h2>
          <p className="war-room-subtitle">{project.description}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <div className="war-room-status-badge" style={{ borderColor: statusColor, color: statusColor }}>
            {statusLabel}
          </div>
          {backButton}
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        percent={progressPercent}
        completedCount={completedCount}
        totalCount={tasks.length}
        deadline={project.deadline}
      />

      {/* 2-Column Body */}
      <div className="war-room-body">
        {/* Left: Mission Intel */}
        <div className="war-room-intel-card">
          <div className="intel-section">
            <h4 className="intel-title">📋 Mission Brief</h4>
            <div className="intel-row"><span className="intel-label">Budget</span><span className="intel-value">${project.budget ?? 'N/A'}</span></div>
            <div className="intel-row"><span className="intel-label">Mode</span><span className="intel-value">{project.work_mode ?? 'N/A'}</span></div>
            <div className="intel-row"><span className="intel-label">Tier</span><span className="intel-value">{project.service_tier ?? 'N/A'}</span></div>
            {project.rfp_rules && (
              <div className="intel-rfp-rules">
                <span className="intel-label">⚠️ RFP Rules</span>
                <p className="intel-rfp-text">{project.rfp_rules}</p>
              </div>
            )}
          </div>

          {vendor ? (
            <div className="intel-section" style={{ marginTop: '1.5rem' }}>
              <h4 className="intel-title">🤝 Assigned Vendor</h4>
              <div className="vendor-intel-card">
                <div className="vendor-intel-name">{vendor.business_name}</div>
                <div className="vendor-intel-score">{vendor.match_score}% AI Match</div>
                <div className="vendor-intel-domain">{vendor.vendor_domain}</div>
                <div className="vendor-intel-skills">{vendor.skills.slice(0, 4).join(' · ')}</div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '1.5rem', opacity: 0.5, fontStyle: 'italic', fontSize: '0.9rem' }}>
              Awaiting Vendor Acceptance...
            </div>
          )}
        </div>

        {/* Right: Task Checklist */}
        <div className="war-room-checklist-card">
          <h4 className="intel-title" style={{ marginBottom: '1.5rem' }}>⚡ Execution Milestones</h4>
          <TaskChecklist tasks={tasks} projectId={projectId} onTaskToggled={fetchWarRoom} userRole={userRole} />

          {progressPercent === 100 && (
            <div className="war-room-complete-banner">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
              <h3 style={{ color: '#0ba360', margin: '0 0 0.5rem' }}>Project Successfully Delivered!</h3>
              <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>All milestones verified. Outstanding execution by the entire team.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Full Width: Chat Box */}
      <div style={{ marginTop: '1.5rem' }}>
        <WarRoomChat projectId={projectId} userRole={userRole} />
      </div>
    </div>
  );
}
