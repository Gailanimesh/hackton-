import { create } from 'zustand';
import type { Project } from '@/types/project';
import type { Invitation } from '@/types/vendor';
import type { WarRoomData } from '@/types/task';
import type { User } from '@supabase/supabase-js';

interface AppState {
  // Auth
  user: User | null;
  role: 'manager' | 'vendor' | null;
  setUser: (user: User | null) => void;
  setRole: (role: 'manager' | 'vendor' | null) => void;

  // Manager
  projects: Project[];
  missionText: string;
  setProjects: (projects: Project[]) => void;
  setMissionText: (text: string) => void;

  // Vendor
  invitations: Invitation[];
  setInvitations: (invitations: Invitation[]) => void;

  // War Room
  warRoomData: WarRoomData | null;
  setWarRoomData: (data: WarRoomData | null) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  role: null,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),

  // Manager
  projects: [],
  missionText: '',
  setProjects: (projects) => set({ projects }),
  setMissionText: (text) => set({ missionText: text }),

  // Vendor
  invitations: [],
  setInvitations: (invitations) => set({ invitations }),

  // War Room
  warRoomData: null,
  setWarRoomData: (data) => set({ warRoomData: data }),

  // UI
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
