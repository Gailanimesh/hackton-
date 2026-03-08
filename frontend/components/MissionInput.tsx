'use client';

import { useRef } from 'react';
import { useToast } from './ToastNotification';

interface Props {
  missionText: string;
  onMissionChange: (text: string) => void;
  onGenerate: () => Promise<void>;
  loading: boolean;
}

export default function MissionInput({ missionText, onMissionChange, onGenerate, loading }: Props) {
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleClick = async () => {
    if (!missionText.trim()) {
      showToast('Please enter a mission first.', 'error');
      return;
    }
    await onGenerate();
  };

  return (
    <div className="hero-section">
      <div className="input-group">
        <textarea
          ref={textareaRef}
          id="mission-input"
          value={missionText}
          onChange={(e) => onMissionChange(e.target.value)}
          placeholder="What mission are we planning today? (e.g., Build a space station, Digitize a hospital)"
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0.5rem', width: '100%' }}>
          {loading && <div className="loader" style={{ display: 'block', marginRight: '1rem' }} />}
          <button
            id="generate-btn"
            className="generate-btn"
            onClick={handleClick}
            disabled={loading}
          >
            {loading ? 'AI IS THINKING...' : 'GENERATE PLAN'}
          </button>
        </div>
      </div>
    </div>
  );
}
