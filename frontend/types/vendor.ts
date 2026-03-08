// Types for Vendors and Invitations

export type Vendor = {
  id: string;
  user_id: string;
  business_name: string;
  skills: string[];
  vendor_domain: string;
  preferred_work_mode: 'remote' | 'onsite' | 'hybrid';
  service_tier: 'speed' | 'quality';
  min_budget: number;
  match_score?: number;
};

export type VendorMatch = {
  vendor_id: string;
  business_name: string;
  domain: string;
  skills: string[];
  match_score: number;
  match_reason: string;
  fit_analysis: string;
};

export type VendorProfilePayload = {
  user_id: string;
  business_name: string;
  services: string;
  domain: string;
  preferred_work_mode: string;
  service_tier: string;
  min_budget: number;
};

export type Invitation = {
  id: string;
  project_id: string;
  vendor_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'interested';
  match_score?: number;
  fit_analysis?: string;
  project_details?: {
    project_name: string;
    budget?: number;
    deadline?: string;
    required_technologies?: string;
    work_mode?: string;
    service_tier?: string;
    rfp_rules?: string;
  };
};
