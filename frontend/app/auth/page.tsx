'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login, signup, type UserRole } from '@/lib/auth';
import { useToast } from '@/components/ToastNotification';

export default function AuthPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('manager');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password, role);
        router.push('/dashboard');
      } else {
        await signup(email, password, role);
        showToast('Account created! Please check your email to confirm.', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = (newRole: UserRole) => setRole(newRole);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '160px',
              height: '160px',
              background: 'radial-gradient(circle, rgba(0, 242, 254, 0.25) 0%, transparent 70%)',
              filter: 'blur(15px)',
              zIndex: 0
            }} />
            <Image src="/hero_logo.png" alt="VENDEX Logo Icon" width={140} height={140} style={{ objectFit: 'contain', zIndex: 1, position: 'relative' }} priority />
          </div>
          
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            VENDEX
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            color: 'var(--text-secondary)', 
            marginBottom: '2.5rem', 
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}>
            AI Procurement Automation
          </p>

          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: '#fff' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
            {isLogin ? 'Secure access to your workspace' : 'Join the AI Marketplace'}
          </p>
        </div>

        {/* Role Toggle */}
        <div className="role-toggle" data-role={role}>
          <div className="role-slider" />
          <button
            className={`role-btn ${role === 'manager' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('manager')}
            type="button"
          >
            Manager
          </button>
          <button
            className={`role-btn ${role === 'vendor' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('vendor')}
            type="button"
          >
            Vendor
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Continue' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Link */}
        <div className="auth-footer">
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          <a className="auth-link" onClick={() => setIsLogin(!isLogin)} role="button">
            {isLogin ? 'Sign up' : 'Login'}
          </a>
        </div>
      </div>
    </div>
  );
}
