"""
AI Procurement Planner - FastAPI Backend
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from pydantic import BaseModel
from uuid import UUID
from database import get_supabase
from llm import call_llm, parse_json_response, parse_list
from fastapi import UploadFile, File, Form
from pypdf import PdfReader
import io

app = FastAPI(title="AI Procurement Planner API")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR: {str(exc)}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request models ---
class MissionRequest(BaseModel):
    user_id: str
    mission_text: str


class SubtaskRequest(BaseModel):
    project_id: str
    project_name: str


class VendorProfileRequest(BaseModel):
    user_id: str
    business_name: str
    services: str
    domain: str
    preferred_work_mode: str = "remote"
    service_tier: str = "speed"
    min_budget: float = 0


class ProjectConfigRequest(BaseModel):
    project_id: str
    budget: float
    deadline: str
    work_mode: str
    service_tier: str
    rfp_rules: str = ""


class InviteRequest(BaseModel):
    project_id: str
    vendor_id: str
    match_score: int
    fit_analysis: str


class RespondInviteRequest(BaseModel):
    invitation_id: str
    action: str  # 'accepted' or 'declined'

class TaskStatusRequest(BaseModel):
    task_id: str
    is_completed: bool


class MessageRequest(BaseModel):
    project_id: str
    sender_id: str
    sender_role: str
    content: str


# --- Prompts ---
PROJECT_PROMPT = """You are a procurement planning expert.
Convert the following mission into 3-5 procurement projects.

For each project provide:
- Project name
- Short description
- Required technologies

Return ONLY valid JSON in this exact format (no markdown):
{"projects":[{"name":"Project Name","description":"Short description","technologies":"Tech1, Tech2"}]}

Mission: """

SUBTASK_PROMPT = """Break the following project into 5 development subtasks.

Project: {project_name}

Return ONLY valid JSON in this exact format (no markdown):
{{"tasks":["Task 1","Task 2","Task 3","Task 4","Task 5"]}}

Return tasks suitable for a software development team."""

VENDOR_EXTRACTION_PROMPT = """You are an expert procurement assistant.
Analyze the following text from a vendor's document (CV, Catalog, or Flyer).
Extract the following information in a structured JSON format:
1. Business Name (or Person Name if it's a CV)
2. Primary Domain (e.g., IT, Logistics, Supply, Construction)
3. List of Services/Capabilities (as a comma-separated string)
4. Preferred Work Mode (Guess 'remote', 'onsite', or 'hybrid' based on the services)
5. Service Tier (Guess 'speed' for agile/fast services, or 'quality' for enterprise/ISO-certified services)

Return ONLY valid JSON in this format:
{"business_name": "Name", "domain": "Industry", "services": "Service 1, Service 2", "preferred_work_mode": "remote", "service_tier": "speed"}

Document Text:
"""


# --- Routes ---
@app.get("/")
def root():
    return {"message": "AI Procurement Planner API", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/latest-mission")
def get_latest_mission(user_id: str):
    """Fetch the most recent mission and its projects for a user."""
    try:
        supabase = get_supabase()
        
        # 1. Get the latest mission
        mission_res = supabase.table("missions") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
            
        if not mission_res.data:
            return {"status": "success", "mission": None, "projects": []}
            
        mission = mission_res.data[0]
        
        # 2. Get projects for this mission
        proj_res = supabase.table("projects") \
            .select("*") \
            .eq("mission_id", mission["id"]) \
            .order("created_at", desc=True) \
            .execute()
            
        return {
            "status": "success", 
            "mission": mission,
            "projects": proj_res.data
        }
    except Exception as e:
        print(f"DEBUG: Error fetching latest mission: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-projects")
def generate_projects(req: MissionRequest):
    """Generate 3-5 procurement projects from a mission."""
    if not req.mission_text.strip():
        raise HTTPException(status_code=400, detail="mission_text is required")

    try:
        supabase = get_supabase()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 1. Call LLM
    try:
        print(f"DEBUG: Calling LLM for mission: {req.mission_text}")
        raw = call_llm(PROJECT_PROMPT + req.mission_text)
        data = parse_json_response(raw)
        projects = data.get("projects", [])
        
        if not projects:
            print("DEBUG: LLM returned no projects")
            raise HTTPException(status_code=500, detail="LLM returned no projects")
    except Exception as e:
        print(f"DEBUG: LLM Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    # 2. Save mission
    try:
        print(f"DEBUG: Saving mission to Supabase for user: {req.user_id}")
        mission_res = supabase.table("missions").insert({
            "user_id": req.user_id,
            "mission_text": req.mission_text.strip(),
        }).execute()
        
        if not mission_res.data:
            print(f"DEBUG: Supabase returned no data. Check if RLS is blocking the 'anon' key.")
            raise HTTPException(status_code=500, detail="Failed to save mission - no data returned")
            
        mission_id = mission_res.data[0]["id"]
    except Exception as e:
        print(f"DEBUG: Supabase Error during mission save: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")

    # 3. Save projects
    saved = []
    for p in projects:
        name = p.get("name", p.get("project_name", "Unnamed"))
        desc = p.get("description") or None
        tech = p.get("technologies") or None
        row = supabase.table("projects").insert({
            "mission_id": mission_id,
            "project_name": name,
            "description": desc,
            "required_technologies": tech,
        }).execute()
        if row.data:
            saved.append(row.data[0])

    return {"mission_id": mission_id, "projects": saved}


@app.post("/generate-subtasks")
def generate_subtasks(req: SubtaskRequest):
    """Generate 5 development subtasks for a project."""
    if not req.project_id or not req.project_name:
        raise HTTPException(status_code=400, detail="project_id and project_name required")

    try:
        supabase = get_supabase()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 1. Call LLM
    try:
        print(f"DEBUG: Calling LLM for subtasks of project: {req.project_name}")
        prompt = SUBTASK_PROMPT.format(project_name=req.project_name)
        raw = call_llm(prompt)
        data = parse_json_response(raw)
        tasks = parse_list(data, "tasks")

        if not tasks:
            print(f"DEBUG: No tasks found in data. Keys were: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            raise HTTPException(status_code=500, detail="LLM returned no tasks")
    except Exception as e:
        print(f"DEBUG: Subtask generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    # 2. Save subtasks
    saved = []
    print(f"DEBUG: Saving {len(tasks)} subtasks to Supabase...")
    for t in tasks:
        name = t if isinstance(t, str) else str(t)
        row = supabase.table("subtasks").insert({
            "project_id": req.project_id,
            "task_name": name,
        }).execute()
        if row.data:
            saved.append(row.data[0])

    return {"project_id": req.project_id, "tasks": saved}


@app.get("/projects")
def get_projects(mission_id: UUID):
    """Get projects for a mission."""
    try:
        supabase = get_supabase()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    res = supabase.table("projects").select("*").eq("mission_id", str(mission_id)).execute()
    return {"data": res.data}


@app.get("/tasks")
def get_tasks(project_id: UUID):
    """Get subtasks for a project."""
    try:
        supabase = get_supabase()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    res = supabase.table("subtasks").select("*").eq("project_id", str(project_id)).execute()
    return {"data": res.data}


# --- Vendor Routes ---

@app.post("/upload-document")
async def upload_document(user_id: str = Form(...), file: UploadFile = File(...)):
    """Extract vendor details from an uploaded PDF or Text file using AI."""
    content = await file.read()
    text = ""

    # 1. Extract Text
    if file.filename.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(content))
            for page in reader.pages:
                text += page.extract_text() + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")
    else:
        # Assume text/plain
        try:
            text = content.decode("utf-8")
        except:
            text = content.decode("latin-1")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the document.")

    # 2. Call LLM for extraction
    try:
        print(f"DEBUG: Calling AI to analyze document for user: {user_id}")
        # Limit text to avoid token limits
        prompt = VENDOR_EXTRACTION_PROMPT + text[:4000] 
        raw = call_llm(prompt)
        data = parse_json_response(raw)
        
        return {
            "status": "success",
            "extracted_data": {
                "business_name": data.get("business_name", ""),
                "domain": data.get("domain", ""),
                "services": data.get("services", ""),
                "preferred_work_mode": data.get("preferred_work_mode", "remote"),
                "service_tier": data.get("service_tier", "speed")
            }
        }
    except Exception as e:
        print(f"DEBUG: AI Extraction Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI failed to analyze document: {str(e)}")


@app.post("/update-vendor-profile")
async def update_vendor_profile(req: VendorProfileRequest):
    """Save or update a vendor's profile in the database."""
    try:
        supabase = get_supabase()
        
        # We use upsert to create or update the profile
        # First, ensure the base profile exists to satisfy the foreign key constraint
        try:
            supabase.table("profiles").upsert({
                "id": req.user_id,
                "full_name": req.business_name,
                "role": "vendor"
            }).execute()
        except Exception as e:
            print(f"DEBUG: Fallback profile creation failed: {str(e)}")

        # Supabase will handle the primary key (user_id) conflict
        res = supabase.table("vendor_details").upsert({
            "id": req.user_id,
            "business_name": req.business_name,
            "vendor_domain": req.domain,
            "skills": [s.strip() for s in req.services.split(",") if s.strip()],
            "preferred_work_mode": req.preferred_work_mode,
            "service_tier": req.service_tier,
            "min_budget": req.min_budget
        }).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to update database.")

        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        print(f"DEBUG: Database Error during profile update: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/configure-project")
async def configure_project(req: ProjectConfigRequest):
    """Save constraints and update project status to 'matching'."""
    try:
        supabase = get_supabase()
        
        # Update the project with its new constraints
        res = supabase.table("projects").update({
            "budget": req.budget,
            "deadline": req.deadline,
            "work_mode": req.work_mode,
            "service_tier": req.service_tier,
            "rfp_rules": req.rfp_rules,
            "status": "matching"
        }).eq("id", req.project_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to update project constraints.")

        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        print(f"DEBUG: Error configuring project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/match-vendors")
async def match_vendors(project_id: str):
    """
    Core AI Matching Engine:
    Finds the project details, fetches all vendor profiles, and uses 
    the LLM to score and rank them based on the project constraints.
    """
    try:
        supabase = get_supabase()
        
        # 1. Fetch Project Details
        proj_res = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found.")
        project = proj_res.data[0]
        
        # Ensure it has been configured
        if not project.get("budget") or not project.get("deadline"):
             raise HTTPException(status_code=400, detail="Project must be configured first.")

        # 2. Fetch All Vendors (In a real app, you would pre-filter by domain or vector search)
        vendor_res = supabase.table("vendor_details").select("id, business_name, vendor_domain, skills").execute()
        vendors = vendor_res.data
        
        if not vendors:
            return {"status": "success", "matches": []}

        from llm import MATCHING_PROMPT, call_llm, parse_json_response
        import asyncio
        
        # 3. Score each vendor using AI (Running concurrently for speed)
        async def score_vendor(vendor):
            # Fetch history for this specific vendor
            history_res = supabase.table("vendor_history").select("project_name, category, success_rate, feedback_summary").eq("vendor_id", vendor["id"]).execute()
            history_data = history_res.data
            
            history_text = "No history available."
            if history_data:
                history_text = "\n".join([f"- {h['project_name']} ({h['category']}): {h['success_rate']}% success. Feedback: {h.get('feedback_summary', 'None')}" for h in history_data])

            prompt = MATCHING_PROMPT.format(
                project_name=project["project_name"],
                required_technologies=project.get("required_technologies", "None specified"),
                description=project.get("description", "None specified"),
                budget=project.get("budget"),
                deadline=project.get("deadline"),
                work_mode=project.get("work_mode"),
                service_tier=project.get("service_tier"),
                rfp_rules=project.get("rfp_rules") or "None specified",
                business_name=vendor.get("business_name", "Unknown Vendor"),
                vendor_domain=vendor.get("vendor_domain", "Unknown Domain"),
                skills=", ".join(vendor.get("skills", [])),
                vendor_history=history_text
            )
            try:
                # In a real async app we'd use an async LLM client, but for MVP we wrap the sync call
                response = await asyncio.to_thread(call_llm, prompt)
                result = parse_json_response(response)
                
                return {
                    "vendor_id": vendor["id"],
                    "business_name": vendor.get("business_name", "Unknown Vendor"),
                    "domain": vendor.get("vendor_domain", "Unknown Domain"),
                    "skills": vendor.get("skills", []),
                    "match_score": result.get("score", 0),
                    "match_reason": result.get("match_reason", "No reason provided."),
                    "fit_analysis": result.get("fit_analysis", "You have been identified as a strong candidate based on your profile and skills.")
                }
            except Exception as e:
                print(f"DEBUG: Failed to score vendor {vendor['id']}: {e}")
                return None

        # Gather all AI scores
        tasks = [score_vendor(v) for v in vendors]
        scored_vendors = await asyncio.gather(*tasks)
        
        # Filter out errors and sort by match_score descending
        valid_matches = [v for v in scored_vendors if v is not None]
        valid_matches.sort(key=lambda x: x["match_score"], reverse=True)
        
        # Return top 3 matches
        top_matches = valid_matches[:3]

        return {"status": "success", "matches": top_matches}

    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Error in match engine: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/vendor-profile")
def get_vendor_profile(vendor_id: str):
    """Check if a vendor has completed onboarding by fetching their profile."""
    try:
        supabase = get_supabase()
        res = supabase.table("vendor_details").select("*").eq("id", vendor_id).execute()
        return {"status": "success", "data": res.data[0] if res.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/invite-vendor")
def invite_vendor(req: InviteRequest):
    """Link a vendor to a project by creating an invitation."""
    try:
        supabase = get_supabase()
        res = supabase.table("invitations").insert({
            "project_id": req.project_id,
            "vendor_id": req.vendor_id,
            "status": "pending",
            "match_score": req.match_score,
            "fit_analysis": req.fit_analysis
        }).execute()
        
        if not res.data:
            # Fallback for upsert if already invited but want to update score/analysis
            res = supabase.table("invitations").upsert({
                "project_id": req.project_id,
                "vendor_id": req.vendor_id,
                "status": "pending",
                "match_score": req.match_score,
                "fit_analysis": req.fit_analysis
            }).execute()

        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        print(f"DEBUG: Invitation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/vendor-invitations")
def get_vendor_invitations(vendor_id: str):
    """Vendor fetches their inbox (all invitations + attached project details)."""
    try:
        supabase = get_supabase()
        # Fetch invitations and join with the related project data
        # Note: Supabase makes this easy with embedded resource syntax if FKs are set,
        # but a simple two-step fetch is very reliable for hackathons.
        invites_res = supabase.table("invitations").select("*").eq("vendor_id", vendor_id).execute()
        invitations = invites_res.data
        
        if not invitations:
             return {"status": "success", "data": []}
             
        # Optional: Enrich with project details
        project_ids = [inv["project_id"] for inv in invitations]
        projects_res = supabase.table("projects").select("*").in_("id", project_ids).execute()
        projects = {p["id"]: p for p in projects_res.data}
        
        enriched = []
        for inv in invitations:
            proj = projects.get(inv["project_id"], {})
            inv["project_details"] = proj
            enriched.append(inv)
            
        return {"status": "success", "data": enriched}
    except Exception as e:
        print(f"DEBUG: Fetch invitations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/respond-invitation")
def respond_invitation(req: RespondInviteRequest):
    """Vendor accepts or declines an invitation."""
    try:
        supabase = get_supabase()
        
        # 1. Fetch the invitation first
        inv_res = supabase.table("invitations").select("*").eq("id", req.invitation_id).execute()
        if not inv_res.data:
            raise HTTPException(status_code=404, detail="Invitation not found.")
        invitation = inv_res.data[0]
        project_id = invitation["project_id"]

        if req.action == 'accepted':
            # 2. Check if another vendor already accepted this project
            existing_res = supabase.table("invitations").select("id").eq("project_id", project_id).eq("status", "accepted").execute()
            if existing_res.data and existing_res.data[0]["id"] != req.invitation_id:
                raise HTTPException(status_code=400, detail="This project has already been assigned to another vendor. You cannot accept this invitation.")

        # 3. Update the invitation status
        res = supabase.table("invitations").update({
            "status": req.action
        }).eq("id", req.invitation_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Could not update invitation.")
            
        updated_invitation = res.data[0]
        
        if req.action == 'accepted':
            # Mark the project as active
            supabase.table("projects").update({
                "status": "active"
            }).eq("id", project_id).execute()
            
            # Auto-decline any other pending invitations for this project
            supabase.table("invitations").update({
                "status": "declined"
            }).eq("project_id", project_id).eq("status", "pending").execute()
            
        return {"status": "success", "data": updated_invitation}
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Respond invite error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/project-war-room")
def get_project_war_room(project_id: str):
    """Fetch all data needed for the shared execution dashboard."""
    try:
        supabase = get_supabase()
        
        # 1. Get Project Details
        proj_res = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        project = proj_res.data[0]
        
        # 2. Get Subtasks
        tasks_res = supabase.table("subtasks").select("*").eq("project_id", project_id).order("created_at").execute()
        tasks = tasks_res.data
        
        # 3. Find the Accepted Vendor (if any)
        inv_res = supabase.table("invitations").select("vendor_id, match_score").eq("project_id", project_id).eq("status", "accepted").limit(1).execute()
        vendor_details = None
        
        if inv_res.data:
            v_id = inv_res.data[0]["vendor_id"]
            v_res = supabase.table("vendor_details").select("business_name, vendor_domain, skills").eq("id", v_id).execute()
            if v_res.data:
                vendor_details = v_res.data[0]
                vendor_details["match_score"] = inv_res.data[0]["match_score"]

        return {
            "status": "success",
            "project": project,
            "tasks": tasks,
            "vendor": vendor_details
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: War Room fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-task-status")
def update_task_status(req: TaskStatusRequest):
    """Toggle a subtask's completion status."""
    try:
        supabase = get_supabase()
        res = supabase.table("subtasks").update({
            "is_completed": req.is_completed
        }).eq("id", req.task_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Task not found")
            
        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/messages")
def get_messages(project_id: str):
    """Fetch chat history for a project."""
    try:
        supabase = get_supabase()
        res = supabase.table("project_messages").select("*").eq("project_id", project_id).order("created_at", desc=False).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        print(f"DEBUG: Fetch messages error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/messages")
def send_message(req: MessageRequest):
    """Send a new message to the project war room."""
    try:
        supabase = get_supabase()
        res = supabase.table("project_messages").insert({
            "project_id": req.project_id,
            "sender_id": req.sender_id,
            "sender_role": req.sender_role,
            "content": req.content
        }).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        print(f"DEBUG: Send message error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/messages")
def get_messages(project_id: str):
    """Fetch chat history for a project."""
    try:
        supabase = get_supabase()
        res = supabase.table("project_messages").select("*").eq("project_id", project_id).order("created_at", desc=False).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        print(f"DEBUG: Fetch messages error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/messages")
def send_message(req: MessageRequest):
    """Send a new message to the project war room."""
    try:
        supabase = get_supabase()
        res = supabase.table("project_messages").insert({
            "project_id": req.project_id,
            "sender_id": req.sender_id,
            "sender_role": req.sender_role,
            "content": req.content
        }).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        print(f"DEBUG: Send message error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/manager-war-rooms")
def get_manager_war_rooms(user_id: str):
    """Fetch all projects where the manager has sent invitations."""
    try:
        supabase = get_supabase()
        
        # 1. Get all missions for this manager
        mission_res = supabase.table("missions").select("id").eq("user_id", user_id).execute()
        missions = mission_res.data or []
        if not missions:
            return {"status": "success", "data": []}
            
        mission_ids = [m["id"] for m in missions]
        
        # 2. Get all projects under those missions
        proj_res = supabase.table("projects").select("id, project_name").in_("mission_id", mission_ids).execute()
        projects = proj_res.data or []
        if not projects:
            return {"status": "success", "data": []}

        project_ids = [p["id"] for p in projects]
        
        # 3. Get invitations sent out for these projects
        inv_res = supabase.table("invitations").select("project_id, status, vendor_id").in_("project_id", project_ids).execute()
        invitations = inv_res.data or []

        # Map project_id -> best invitation status
        inv_map = {}
        for inv in invitations:
            pid = inv["project_id"]
            current = inv_map.get(pid, "")
            # Prefer accepted > pending
            if inv["status"] == "accepted" or current == "":
                inv_map[pid] = inv["status"]

        # Only include projects that have at least one invitation sent
        active = [
            {
                "project_id": p["id"],
                "project_name": p["project_name"],
                "invitation_status": inv_map[p["id"]]
            }
            for p in projects if p["id"] in inv_map
        ]
        return {"status": "success", "data": active}
    except Exception as e:
        print(f"DEBUG: Manager war rooms error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
