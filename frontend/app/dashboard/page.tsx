'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import MissionInput from '@/components/MissionInput';
import ProjectCard from '@/components/ProjectCard';
import ActiveWarRooms from '@/components/ActiveWarRooms';
import { useToast } from '@/components/ToastNotification';

export default function DashboardPage() {
  const { user, role, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const userId = user?.id ?? '';
  const { projects, missionText, setMissionText, loading, error, generate, fetchLatestMission } = useProjects(userId);

  // Auth guard + role redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
    if (!authLoading && user && role === 'vendor') {
      router.replace('/vendor/inbox');
    }
  }, [user, role, authLoading, router]);

  // Load previous session data
  useEffect(() => {
    if (userId) fetchLatestMission();
  }, [userId, fetchLatestMission]);

  // Show API errors as toasts
  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem' }}>
        <div className="loader" style={{ display: 'block', margin: '0 auto' }} />
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
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem 1rem' }}
            onClick={logout}
          >
            LOGOUT
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Image src="/logo.png" alt="VENDEX Logo" width={300} height={150} style={{ objectFit: 'contain' }} priority />
        </div>
        <p className="subtitle">AI Procurement Automation. Transform any complex mission into actionable projects &amp; tasks in seconds.</p>
      </header>

      {/* Mission Input */}
      <MissionInput
        missionText={missionText}
        onMissionChange={setMissionText}
        onGenerate={generate}
        loading={loading}
      />

      {/* Skeleton Loaders */}
      {loading && (
        <div className="projects-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-title" />
              <div className="skeleton-text" />
              <div className="skeleton-text" style={{ width: '80%' }} />
              <div className="skeleton-badges">
                <div className="skeleton-badge" />
                <div className="skeleton-badge" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active War Rooms widget — only shows when invitations exist */}
      {userId && <ActiveWarRooms userId={userId} />}

      {/* Projects Grid */}
      {!loading && projects.length > 0 && (
        <div id="projects-container" className="projects-grid">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      )}

      {/* Footer */}
      <footer id="main-footer">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div style={{ marginBottom: '1rem' }}>
              <Image src="/vendex_logo.png" alt="VENDEX Logo" width={80} height={80} style={{ objectFit: 'contain' }} />
            </div>
            <h3 style={{ background: 'linear-gradient(135deg, #00C6FF, #0072FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, margin: '0 0 0.75rem 0' }}>VENDEX</h3>
            <p>Transforming how organizations discover, evaluate, and onboard vendor partners using AI Procurement Automation.</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {['GitHub', 'LinkedIn', 'Twitter'].map(s => (
                <a key={s} href="#" style={{ padding: '0.4rem 0.9rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '30px', fontSize: '0.72rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.2s' }}>{s}</a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="footer-links">
            <h4>Product</h4>
            <ul>
              <li><a href="#">AI Vendor Matching</a></li>
              <li><a href="#">Mission Planner</a></li>
              <li><a href="#">War Room Collaboration</a></li>
              <li><a href="#">RFP Automation</a></li>
              <li><a href="#">Task Manager</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Our Mission</a></li>
              <li><a href="#">Careers — We&apos;re Hiring!</a></li>
              <li><a href="#">Press &amp; Media</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact & Stats */}
          <div className="footer-links">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:hello@vendex.ai">hello@vendex.ai</a></li>
              <li><a href="#">+1 (800) 4-VENDEX</a></li>
              <li><a href="#">San Francisco, CA</a></li>
            </ul>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Vendors Onboarded', value: '2,400+' },
                { label: 'Projects Matched', value: '12,000+' },
                { label: 'Avg. Match Score', value: '89%' },
              ].map(stat => (
                <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.35rem 0.6rem', background: 'rgba(0,242,254,0.06)', borderRadius: '8px', borderLeft: '2px solid rgba(0,242,254,0.4)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                  <span style={{ color: '#00f2fe', fontWeight: 700 }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 VENDEX Inc. All rights reserved.</span>
          <span>Built with ❤️ for the Hackathon · Powered by AI &amp; Supabase</span>
        </div>
      </footer>
    </div>
  );
}
