'use client';

import { useState, useCallback } from 'react';
import { generateProjects, getLatestMission } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

/**
 * useProjects — handles mission input and project generation.
 */
export function useProjects(userId: string) {
  const { projects, missionText, setProjects, setMissionText } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load previous mission + projects on mount
  const fetchLatestMission = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getLatestMission(userId);
      if (res.mission) setMissionText(res.mission.mission_text);
      if (res.projects?.length) setProjects(res.projects);
    } catch {
      // No previous mission is expected — silently skip
    }
  }, [userId, setMissionText, setProjects]);

  // Generate new plan from current mission text
  const generate = useCallback(async () => {
    if (!missionText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateProjects(userId, missionText);
      setProjects(res.projects);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId, missionText, setProjects]);

  return { projects, missionText, setMissionText, loading, error, generate, fetchLatestMission };
}
