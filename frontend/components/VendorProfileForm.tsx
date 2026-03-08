'use client';

import { useState, useRef } from 'react';
import { useToast } from './ToastNotification';
import { uploadVendorDocument, updateVendorProfile } from '@/lib/api';
import type { VendorProfilePayload } from '@/types/vendor';

interface Props {
  userId: string;
  onSaved: () => void;
  isEditing?: boolean;
  initialData?: Partial<VendorProfilePayload>;
}

export default function VendorProfileForm({ userId, onSaved, isEditing = false, initialData }: Props) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'magic' | 'manual'>('magic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState(initialData?.business_name || '');
  const [services, setServices] = useState(initialData?.services || '');
  const [domain, setDomain] = useState(initialData?.domain || '');
  const [workMode, setWorkMode] = useState(initialData?.preferred_work_mode || 'remote');
  const [tier, setTier] = useState(initialData?.service_tier || 'speed');
  const [minBudget, setMinBudget] = useState<number>(initialData?.min_budget || 200);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadVendorDocument(file, userId);
      const d = result.extracted_data;
      if (d.business_name) setName(d.business_name);
      if (d.services) setServices(d.services);
      if (d.domain) setDomain(d.domain);
      if (d.preferred_work_mode) setWorkMode(d.preferred_work_mode);
      if (d.service_tier) setTier(d.service_tier);
      setActiveTab('manual');
      showToast('✨ AI Analysis Complete! Review and save.', 'success');
    } catch {
      showToast('AI analysis failed. Please try manual entry.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (minBudget < 200) {
      showToast('Minimum project size must be at least $200.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateVendorProfile({ user_id: userId, business_name: name, services, domain, preferred_work_mode: workMode, service_tier: tier, min_budget: minBudget });
      showToast('✅ Profile saved! Redirecting to Inbox...', 'success');
      setTimeout(onSaved, 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vendor-workspace fade-in">
      <div className="workspace-header">
        <h3>{isEditing ? 'Edit Vendor Profile' : 'Vendor Workspace'}</h3>
        <p className="subtitle">
          {isEditing ? 'Update your capabilities and execution preferences.' : 'Set up your business profile to receive project invitations.'}
        </p>
      </div>

      {/* Path Selection */}
      <div className="choice-container">
        <div className={`choice-card ${activeTab === 'magic' ? 'active' : ''}`} onClick={() => setActiveTab('magic')}>
          <div className="choice-icon">✨</div>
          <h4>Magic Auto-fill</h4>
          <p>Upload a CV or Catalog and let AI build your profile.</p>
        </div>
        <div className={`choice-card ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>
          <div className="choice-icon">✍️</div>
          <h4>Manual Entry</h4>
          <p>Tell us about your services and capabilities yourself.</p>
        </div>
      </div>

      {/* Magic Upload */}
      {activeTab === 'magic' && (
        <div
          className="drop-zone-glow scale-up"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
          }}
        >
          {uploading ? (
            <>
              <div className="loader" style={{ display: 'block', marginBottom: '1rem' }} />
              <p>AI is analyzing your document...</p>
            </>
          ) : (
            <>
              <p>Drag &amp; Drop your Capability Document</p>
              <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>(PDF, TXT, or JSON)</span>
              <input type="file" ref={fileInputRef} hidden accept=".pdf,.txt,.json" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
              <button className="auth-btn" style={{ marginTop: '1.5rem', width: 'auto', padding: '0.8rem 2rem' }} onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </button>
            </>
          )}
        </div>
      )}

      {/* Manual Form */}
      {activeTab === 'manual' && (
        <form className="auth-form scale-up" onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
          <div className="form-group">
            <label>Business / Provider Name</label>
            <input type="text" placeholder="e.g. Acme Logistics" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Core Services (Comma separated)</label>
            <input type="text" placeholder="e.g. Last-mile delivery, Cold storage" value={services} onChange={(e) => setServices(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Domain / Industry</label>
            <input type="text" placeholder="e.g. Supply Chain, IT Services" value={domain} onChange={(e) => setDomain(e.target.value)} />
          </div>

          <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1rem', color: '#00f2fe' }}>Execution Preferences</h4>
          <div className="config-grid" style={{ marginBottom: '1.5rem', gap: '0.75rem' }}>
            <div className="config-field">
              <label>Preferred Work Mode</label>
              <select value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                <option value="remote">Remote (Default)</option>
                <option value="onsite">On-Site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className="config-field">
              <label>Service Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="speed">Speed (Fast Delivery)</option>
                <option value="quality">Quality (Enterprise Grade)</option>
              </select>
            </div>
            <div className="config-field" style={{ gridColumn: 'span 2' }}>
              <label>Minimum Project Size (USD)</label>
              <input type="number" placeholder="e.g. 1000" min="200" value={minBudget} onChange={(e) => setMinBudget(Number(e.target.value))} />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={saving}>
            {saving ? 'SAVING...' : isEditing ? 'Save Updates' : 'Save Profile'}
          </button>
          {isEditing && (
            <button type="button" className="auth-btn" onClick={() => window.location.reload()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', marginTop: '0.5rem', color: '#fff' }}>
              Cancel
            </button>
          )}
        </form>
      )}
    </div>
  );
}
