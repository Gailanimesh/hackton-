const API_BASE = "http://localhost:8000";

const missionInput = document.getElementById("mission-input");
const generateBtn = document.getElementById("generate-btn");
const projectsContainer = document.getElementById("projects-container");
const btnLoader = document.getElementById("btn-loader");

generateBtn.addEventListener("click", handleGenerate);

async function handleGenerate() {
  const missionText = missionInput.value.trim();
  if (!missionText) return;

  // UI State: Loading
  generateBtn.disabled = true;
  generateBtn.innerText = "PLANNING...";
  btnLoader.style.display = "block";
  projectsContainer.innerHTML = "";

  try {
    const response = await fetch(`${API_BASE}/generate-projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: "00000000-0000-0000-0000-000000000000",
        mission_text: missionText,
      }),
    });

    if (!response.ok) throw new Error("Backend connection failed");

    const data = await response.json();
    renderProjects(data.projects);
  } catch (err) {
    alert("Error: Make sure the backend server (FastAPI) is running!");
    console.error(err);
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerText = "GENERATE PLAN";
    btnLoader.style.display = "none";
  }
}

function renderProjects(projects) {
  projectsContainer.innerHTML = "";
  projects.forEach((proj, index) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.style.animationDelay = `${index * 0.1}s`;

    const techList = proj.required_technologies 
        ? proj.required_technologies.split(',').map(t => `<span class="badge">${t.trim()}</span>`).join('') 
        : "";

    card.innerHTML = `
      <h3>${proj.project_name}</h3>
      <p>${proj.description || "No description provided."}</p>
      <div class="tech-badges">${techList}</div>
      <div id="subtasks-${proj.id}" class="subtasks-list"></div>
    `;

    card.addEventListener("click", () => handleProjectClick(proj));
    projectsContainer.appendChild(card);
  });
}

async function handleProjectClick(proj) {
    const subtaskDiv = document.getElementById(`subtasks-${proj.id}`);
    
    // Toggle if already loaded
    if (subtaskDiv.innerHTML !== "") {
        subtaskDiv.innerHTML = "";
        return;
    }

    subtaskDiv.innerHTML = `
        <div id="subtasks-container">
            <div style="font-size: 0.8rem; opacity: 0.5; margin-bottom: 0.5rem;">LOADING SUBTASKS...</div>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE}/generate-subtasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                project_id: proj.id,
                project_name: proj.project_name,
            }),
        });

        if (!response.ok) throw new Error("Failed to load subtasks");

        const data = await response.json();
        renderSubtasks(proj.id, data.tasks);
    } catch (err) {
        subtaskDiv.innerHTML = `<div style="color: #ff4444; font-size: 0.8rem;">Error loading tasks.</div>`;
        console.error(err);
    }
}

function renderSubtasks(projectId, tasks) {
    const subtaskDiv = document.getElementById(`subtasks-${projectId}`);
    const listHtml = tasks.map(t => `
        <div class="subtask-item">
            <div class="subtask-dot"></div>
            <span>${t.task_name}</span>
        </div>
    `).join("");

    subtaskDiv.innerHTML = `
        <div id="subtasks-container">
            <div style="font-size: 1rem; margin-bottom: 0.75rem; color: #fff; font-weight: 600;">SUBTASKS</div>
            ${listHtml}
        </div>
    `;
}
