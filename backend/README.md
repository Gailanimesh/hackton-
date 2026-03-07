# AI Procurement Planner - Backend

FastAPI backend for the AI Procurement Planner.

## Setup

1. Create virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate   # Windows
   # or: source venv/bin/activate  # Mac/Linux
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and fill in:
   - `SUPABASE_URL` - from Supabase project settings
   - `SUPABASE_KEY` - use **service_role** key (not anon)
   - `OPENAI_API_KEY` or `GOOGLE_API_KEY` - for AI generation

4. Run the Supabase schema in your project's SQL Editor:
   - Open `supabase_schema.sql` and execute it

## Run

```bash
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Health check |
| POST | /generate-projects | Generate projects from mission |
| POST | /generate-subtasks | Generate subtasks for a project |
| GET | /projects?mission_id= | Get projects for a mission |
| GET | /tasks?project_id= | Get subtasks for a project |
