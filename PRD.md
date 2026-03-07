# Product Requirements Document (PRD): AI Procurement Planner

**Status:** Version 1.0 (MVP Complete)  
**Author:** AI Pair Programming Team  

---

## 1. Product Vision
The **AI Procurement Planner** is a high-performance tool designed to transform high-level "Missions" into granular, actionable project plans. It leverages multiple LLMs (Large Language Models) and a secure database to provide professional-grade procurement and development roadmaps in seconds.

## 2. Target Audience
- Procurement Managers
- Project Leads
- Startup Founders
- AI Integration Experts

---

## 3. Features & Functional Requirements

### 3.1 Mission-to-Project Conversion
- **Requirement:** Core engine must accept any natural language mission.
- **Implementation:** The system successfully processes diverse inputs like "Digitize hospital operations," "Build a smart city," or "Home automation."
- **Output:** Generates 3-5 high-level projects per mission, including descriptions and required technologies.

### 3.2 Granular Task Decomposition
- **Requirement:** Each project must be breakable into actionable subtasks.
- **Implementation:** The `/generate-subtasks` endpoint decomposes any project into 5 development-ready tasks.
- **Interaction:** Users can click on a project card in the UI to instantly reveal its specific subtasks.

### 3.3 Multi-Model Resiliency
- **Requirement:** The system must not fail if a single AI provider is down or a key is invalid.
- **Implementation:** `Fallback Intelligence` logic implemented.
  - Priority 1: **Groq** (using `openai/gpt-oss-120b`)
  - Priority 2: **OpenAI** (GPT-series)
  - Priority 3: **Google Gemini** (1.5-flash)

### 3.4 Data Persistence
- **Requirement:** All missions, projects, and tasks must be saved for future retrieval.
- **Implementation:** Full **Supabase (PostgreSQL)** integration with established schema for:
  - `missions`
  - `projects`
  - `subtasks`

---

## 4. User Experience & Design

### 4.1 "Obsidian" Premium UI
- **Aesthetic:** Luxury dark mode (Obsidian style) using high-contrast black and white.
- **Effects:** Glassmorphism (blur/transparency) on inputs and cards.
- **Interaction:** 
  - Smooth fade-in-up animations.
  - Glowing hover states.
  - "Catchy" reveal animations for subtasks.

---

## 5. Technical Stack
- **Frontend:** Vite, Vanilla JavaScript, CSS3.
- **Backend:** FastAPI (Python 3.11), Uvicorn.
- **Database:** Supabase (Auth/RLS configured).
- **Security:** `.env` secret management and Git Push Protection.

---

## 6. Current Progress & Milestones
- [x] Backend API Architecture
- [x] Multi-LLM Provider Integration
- [x] Supabase Database Schema
- [x] Robust JSON Parsing (Handling AI inconsistencies)
- [x] Premium Frontend Dashboard
- [x] GitHub Repository Initialization & Security Scan

---

## 7. Next Steps (Roadmap)
- [ ] User Authentication (Supabase Auth).
- [ ] Export functionality (PDF/Excel) for plans.
- [ ] Cost estimation for each procurement project.
- [ ] Real-time collaboration features.
