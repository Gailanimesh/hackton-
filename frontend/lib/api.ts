import type { Project, ProjectConfiguration } from '@/types/project';
import type { VendorProfilePayload, Invitation, VendorMatch } from '@/types/vendor';
import type { Task, WarRoomData, Message } from '@/types/task';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

// Generic fetch helper with error handling
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── Manager: Generate AI projects from a mission ─────────────────────────────
export async function generateProjects(
  userId: string,
  missionText: string
): Promise<{ projects: Project[] }> {
  return apiFetch('/generate-projects', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, mission_text: missionText }),
  });
}

// ─── Manager: Fetch most recent mission and projects ──────────────────────────
export async function getLatestMission(
  userId: string
): Promise<{ mission: { mission_text: string } | null; projects: Project[] }> {
  return apiFetch(`/latest-mission?user_id=${userId}`);
}

// ─── Vendor: Upload document for AI auto-fill ────────────────────────────────
export async function uploadVendorDocument(
  file: File,
  userId: string
): Promise<{ extracted_data: Record<string, string> }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);

  const res = await fetch(`${API_BASE}/upload-document`, {
    method: 'POST',
    body: formData, // no Content-Type header — browser sets multipart boundary
  });
  if (!res.ok) throw new Error('AI analysis failed');
  return res.json();
}

// ─── Vendor: Get vendor profile ───────────────────────────────────────────────
export async function getVendorProfile(vendorId: string) {
  return apiFetch<{ data: import('@/types/vendor').Vendor | null }>(
    `/vendor-profile?vendor_id=${vendorId}`
  );
}

// ─── Vendor: Save/update vendor profile ──────────────────────────────────────
export async function updateVendorProfile(payload: VendorProfilePayload): Promise<void> {
  await apiFetch('/update-vendor-profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Manager: Save project configuration ─────────────────────────────────────
export async function configureProject(config: ProjectConfiguration): Promise<void> {
  await apiFetch('/configure-project', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

// ─── Manager: Get AI-matched vendors for a project ───────────────────────────
export async function matchVendors(
  projectId: string
): Promise<{ matches: VendorMatch[] }> {
  return apiFetch(`/match-vendors?project_id=${projectId}`);
}

// ─── Manager: Invite a vendor to a project ───────────────────────────────────
export async function inviteVendor(
  projectId: string,
  vendorId: string,
  matchScore: number,
  fitAnalysis: string
): Promise<void> {
  await apiFetch('/invite-vendor', {
    method: 'POST',
    body: JSON.stringify({
      project_id: projectId,
      vendor_id: vendorId,
      match_score: matchScore,
      fit_analysis: fitAnalysis,
    }),
  });
}

// ─── Vendor: Get invitations list ────────────────────────────────────────────
export async function getVendorInvitations(
  vendorId: string
): Promise<{ data: Invitation[] }> {
  return apiFetch(`/vendor-invitations?vendor_id=${vendorId}`);
}

// ─── Vendor: Accept or decline invitation ────────────────────────────────────
export async function respondInvitation(
  invitationId: string,
  action: 'accepted' | 'declined'
): Promise<void> {
  await apiFetch('/respond-invitation', {
    method: 'POST',
    body: JSON.stringify({ invitation_id: invitationId, action }),
  });
}

// ─── War Room: Get full war room data ────────────────────────────────────────
export async function getWarRoom(projectId: string): Promise<WarRoomData> {
  return apiFetch(`/project-war-room?project_id=${projectId}`);
}

// ─── War Room: Generate AI subtasks for a project ────────────────────────────
export async function generateSubtasks(
  projectId: string,
  projectName: string
): Promise<{ tasks: Task[] }> {
  return apiFetch('/generate-subtasks', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, project_name: projectName }),
  });
}

// ─── War Room: Toggle a task's completion status ─────────────────────────────
export async function updateTaskStatus(
  taskId: string,
  isCompleted: boolean
): Promise<void> {
  await apiFetch('/update-task-status', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId, is_completed: isCompleted }),
  });
}

// ─── War Room: Chat Messages ─────────────────────────────────────────────────
export async function getWarRoomMessages(projectId: string): Promise<{ data: Message[] }> {
  return apiFetch(`/messages?project_id=${projectId}`);
}

export async function sendMessage(
  projectId: string,
  senderId: string,
  senderRole: 'manager' | 'vendor',
  content: string
): Promise<{ data: Message }> {
  return apiFetch('/messages', {
    method: 'POST',
    body: JSON.stringify({
      project_id: projectId,
      sender_id: senderId,
      sender_role: senderRole,
      content,
    }),
  });
}
