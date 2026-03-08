// Types for Tasks and War Room

export type Task = {
  id: string;
  task_name: string;
  is_completed: boolean;
  project_id: string;
};

export type WarRoomData = {
  project: {
    id: string;
    project_name: string;
    description?: string;
    budget?: number;
    deadline?: string;
    work_mode?: string;
    service_tier?: string;
    rfp_rules?: string;
  };
  tasks: Task[];
  vendor?: {
    business_name: string;
    vendor_domain: string;
    skills: string[];
    match_score: number;
  };
};

export type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  sender_role: 'manager' | 'vendor';
  content: string;
  created_at: string;
};
