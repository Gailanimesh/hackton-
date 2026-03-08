// Types for Projects and related entities

export type Project = {
  id: string;
  project_name: string;
  description: string;
  required_technologies: string;
  status: string;
  budget?: number;
  deadline?: string;
  work_mode?: string;
  service_tier?: string;
  rfp_rules?: string;
};

export type Mission = {
  id: string;
  mission_text: string;
  user_id: string;
  created_at: string;
};

export type ProjectConfiguration = {
  project_id: string;
  budget: number;
  deadline: string;
  work_mode: 'remote' | 'onsite' | 'hybrid';
  service_tier: 'speed' | 'quality';
  rfp_rules?: string;
};
