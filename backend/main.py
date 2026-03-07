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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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


# --- Routes ---
@app.get("/")
def root():
    return {"message": "AI Procurement Planner API", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
