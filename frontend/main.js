import { supabase } from './supabase.js';

const API_BASE = "http://localhost:8000";

const missionInput = document.getElementById("mission-input");
const generateBtn = document.getElementById("generate-btn");
const projectsContainer = document.getElementById("projects-container");
const btnLoader = document.getElementById("btn-loader");
const heroSection = document.querySelector(".hero-section");
const logoutBtn = document.getElementById("logout-btn");

let currentUser = null;

// --- Toast System ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✨' : '⚠️';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// --- Skeleton System ---
function renderSkeletons() {
    projectsContainer.innerHTML = Array(3).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text" style="width: 80%"></div>
            <div class="skeleton-badges">
                <div class="skeleton-badge"></div>
                <div class="skeleton-badge"></div>
            </div>
        </div>
    `).join('');
}

// --- Authentication Shield ---
async function validateSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        localStorage.clear();
        window.location.href = 'auth.html';
        return;
    }

    currentUser = session.user;
    const userRole = currentUser.user_metadata?.role || 'manager';
    const userEmail = currentUser.email;

    renderDashboardForRole(userRole, userEmail);
    
    // Attach listener for logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            localStorage.clear();
            window.location.href = 'auth.html';
        });
    }
}

function renderDashboardForRole(role, email) {
    if (role === 'vendor') {
        // Wrap the async check in an IIFE to not block the main synchronous function signature 
        // if it's called somewhere else synchronously.
        (async () => {
            try {
                const response = await fetch(`${API_BASE}/vendor-profile?vendor_id=${currentUser.id}`);
                const resData = await response.json();
                if (response.ok && resData.data) {
                    renderVendorInbox(email);
                    return;
                }
            } catch (err) {
                console.error("Error checking vendor profile:", err);
            }
            
            // Otherwise render the form
            heroSection.innerHTML = `
          <div class="vendor-workspace fade-in">
            <div class="workspace-header">
                <h3>Vendor Workspace</h3>
                <p class="subtitle">Welcome back, ${email}</p>
            </div>
            
            <div class="choice-container">
                <div class="choice-card active" id="magic-path">
                    <div class="choice-icon">✨</div>
                    <h4>Magic Auto-fill</h4>
                    <p>Upload a CV or Catalog and let AI build your profile.</p>
                </div>
                <div class="choice-card" id="manual-path">
                    <div class="choice-icon">✍️</div>
                    <h4>Manual Entry</h4>
                    <p>Tell us about your services and capabilities yourself.</p>
                </div>
            </div>

            <div id="vendor-action-area">
                <div id="drop-zone" class="drop-zone-glow scale-up">
                    <p>Drag & Drop your Capability Document</p>
                    <span style="font-size: 0.8rem; opacity: 0.5;">(PDF, TXT, or JSON)</span>
                    <input type="file" id="file-input" hidden accept=".pdf,.txt,.json">
                    <button class="auth-btn" style="margin-top: 1.5rem; width: auto; padding: 0.8rem 2rem;" onclick="document.getElementById('file-input').click()">Browse Files</button>
                </div>

                <form id="vendor-form" class="auth-form scale-up" style="display: none; max-width: 600px; margin: 0 auto; text-align: left;">
                    <div class="form-group">
                        <label>Business / Provider Name</label>
                        <input type="text" id="vendor-name" placeholder="e.g. Acme Logistics" required>
                    </div>
                    <div class="form-group">
                        <label>Core Services (Comma separated)</label>
                        <input type="text" id="vendor-services" placeholder="e.g. Last-mile delivery, Cold storage">
                    </div>
                    <div class="form-group">
                        <label>Domain / Industry</label>
                        <input type="text" id="vendor-domain" placeholder="e.g. Supply Chain, IT Services">
                    </div>
                    
                    <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem; font-size: 1rem; color: #00f2fe;">Execution Preferences</h4>
                    <div class="config-grid" style="margin-bottom: 1.5rem; gap: 0.75rem;">
                        <div class="config-field">
                            <label>Preferred Work Mode</label>
                            <select id="vendor-mode">
                                <option value="remote">Remote (Default)</option>
                                <option value="onsite">On-Site</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div class="config-field">
                            <label>Service Tier</label>
                            <select id="vendor-tier">
                                <option value="speed">Speed (Fast Delivery)</option>
                                <option value="quality">Quality (Enterprise Grade / ISO Certified)</option>
                            </select>
                        </div>
                        <div class="config-field" style="grid-column: span 2;">
                            <label>Minimum Project Size (USD)</label>
                            <input type="number" id="vendor-min-budget" placeholder="e.g. 1000" value="0">
                        </div>
                    </div>
                    
                    <button type="submit" class="auth-btn">Save Profile</button>
                </form>
            </div>
          </div>
        `;
        setupVendorListeners();
        })();
    }
}

function setupVendorListeners() {
    const magicPath = document.getElementById('magic-path');
    const manualPath = document.getElementById('manual-path');
    const dropZone = document.getElementById('drop-zone');
    const vendorForm = document.getElementById('vendor-form');

    magicPath.addEventListener('click', () => {
        magicPath.classList.add('active');
        manualPath.classList.remove('active');
        dropZone.style.display = 'flex';
        vendorForm.style.display = 'none';
    });

    manualPath.addEventListener('click', () => {
        manualPath.classList.add('active');
        magicPath.classList.remove('active');
        dropZone.style.display = 'none';
        vendorForm.style.display = 'flex';
    });

    // Drag & Drop logic
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "#fff";
        dropZone.style.boxShadow = "0 0 30px var(--accent-glow)";
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = "var(--glass-border)";
        dropZone.style.boxShadow = "none";
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileUpload(files[0]);
    });

    document.getElementById('file-input').addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
    });

    vendorForm.addEventListener('submit', handleManualSubmit);
}

async function handleFileUpload(file) {
    const dropZone = document.getElementById('drop-zone');
    const originalContent = dropZone.innerHTML;
    
    dropZone.innerHTML = `
        <div class="loader" style="display: block; margin: 0 auto 1rem;"></div>
        <p>AI is analyzing ${file.name}...</p>
    `;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', currentUser.id);

    try {
        const response = await fetch(`${API_BASE}/upload-document`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Analysis failed");

        const result = await response.json();
        
        // Switch to Manual Form and Auto-Fill
        const magicPath = document.getElementById('magic-path');
        const manualPath = document.getElementById('manual-path');
        const vendorForm = document.getElementById('vendor-form');

        magicPath.classList.remove('active');
        manualPath.classList.add('active');
        dropZone.style.display = 'none';
        vendorForm.style.display = 'flex';

        // Fill Form
        document.getElementById('vendor-name').value = result.extracted_data.business_name;
        document.getElementById('vendor-services').value = result.extracted_data.services;
        document.getElementById('vendor-domain').value = result.extracted_data.domain;
        
        if (result.extracted_data.preferred_work_mode) {
             document.getElementById('vendor-mode').value = result.extracted_data.preferred_work_mode;
        }
        if (result.extracted_data.service_tier) {
             document.getElementById('vendor-tier').value = result.extracted_data.service_tier;
        }

        showToast("✨ AI Analysis Complete! Review and save.", "success");
        dropZone.innerHTML = originalContent;

    } catch (err) {
        showToast(err.message, "error");
        dropZone.innerHTML = originalContent;
        setupVendorListeners(); 
    }
}

async function handleManualSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    
    btn.disabled = true;
    btn.innerText = "SAVING...";

    const payload = {
        user_id: currentUser.id,
        business_name: document.getElementById('vendor-name').value,
        services: document.getElementById('vendor-services').value,
        domain: document.getElementById('vendor-domain').value,
        preferred_work_mode: document.getElementById('vendor-mode').value,
        service_tier: document.getElementById('vendor-tier').value,
        min_budget: parseFloat(document.getElementById('vendor-min-budget').value) || 0
    };

    try {
        const response = await fetch(`${API_BASE}/update-vendor-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Save failed");

        showToast("✅ Profile saved successfully! Redirecting to Inbox...", "success");
        setTimeout(() => renderDashboardForRole('vendor', currentUser.email), 1500);
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

validateSession();

// --- Interactive Polish: Cursor Glow & Magnetic Effects ---
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', (e) => {
    if (cursorGlow) {
        cursorGlow.style.left = `${e.clientX}px`;
        cursorGlow.style.top = `${e.clientY}px`;
    }

    // Magnetic Buttons & Cards
    const magnetics = document.querySelectorAll('.auth-btn, .choice-card, .project-card, .role-btn');
    magnetics.forEach(el => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        const distance = Math.sqrt(distanceX**2 + distanceY**2);

        if (distance < 150) {
            const pullX = distanceX * 0.03;
            const pullY = distanceY * 0.03;
            el.style.transform = `translate(${pullX}px, ${pullY}px)`;
        } else {
            el.style.transform = `translate(0, 0)`;
        }
    });
});

// --- Main App Logic ---

if (generateBtn) {
    generateBtn.addEventListener("click", handleGenerate);
}

async function handleGenerate() {
  const missionText = missionInput.value.trim();
  if (!missionText) return;

  // UI State: Loading
  generateBtn.disabled = true;
  generateBtn.innerText = "AI IS THINKING...";
  btnLoader.style.display = "block";
  renderSkeletons();

  try {
    const response = await fetch(`${API_BASE}/generate-projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: currentUser?.id || "00000000-0000-0000-0000-000000000000",
        mission_text: missionText,
      }),
    });

    if (!response.ok) throw new Error("Backend connection failed");

    const data = await response.json();
    renderProjects(data.projects);
  } catch (err) {
    showToast("Server error: Check if backend is running.", "error");
    projectsContainer.innerHTML = "";
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
      <div class="card-body" onclick="handleProjectClick('${proj.id}', this)">
        <h3>${proj.project_name}</h3>
        <p>${proj.description || "No description provided."}</p>
        <div class="tech-badges">${techList}</div>
        <div id="subtasks-${proj.id}" class="subtasks-list"></div>
      </div>
      <div class="card-footer">
        <span style="font-size: 0.75rem; opacity: 0.5;">Status: ${proj.status || 'Planning'}</span>
        <button class="configure-btn" onclick="openConfigModal('${proj.id}', '${proj.project_name.replace(/'/g, "\\'")}')">CONFIGURE & MATCH ✨</button>
      </div>
    `;

    projectsContainer.appendChild(card);
  });
}

window.openConfigModal = function(projectId, projectName) {
    const overlay = document.getElementById('modal-overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="config-drawer scale-up">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="margin: 0; font-size: 1.5rem;">Configure Execution</h3>
                    <p style="opacity: 0.6; font-size: 0.9rem; margin-top: 0.5rem;">Setting parameters for: ${projectName}</p>
                </div>
                <button onclick="document.getElementById('modal-overlay').style.display='none'" style="background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>

            <div class="config-grid">
                <div class="config-field">
                    <label>Budget (USD)</label>
                    <input type="number" id="config-budget" placeholder="e.g. 5000">
                </div>
                <div class="config-field">
                    <label>Deadline</label>
                    <input type="date" id="config-deadline">
                </div>
                <div class="config-field">
                    <label>Work Mode</label>
                    <select id="config-mode">
                        <option value="remote">Remote</option>
                        <option value="onsite">On-Site</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div>
                <div class="config-field">
                    <label>Priority Tier</label>
                    <select id="config-tier">
                        <option value="speed">Speed (Fast Delivery)</option>
                        <option value="quality">Quality (Enterprise Grade)</option>
                    </select>
                </div>
            </div>

            <button class="match-btn" onclick="submitConfiguration('${projectId}', '${projectName.replace(/'/g, "\\'")}')">FIND MATCHING VENDORS 🚀</button>
        </div>
    `;
};

window.submitConfiguration = async function(projectId, projectName) {
    const budget = document.getElementById('config-budget').value;
    const deadline = document.getElementById('config-deadline').value;
    const mode = document.getElementById('config-mode').value;
    const tier = document.getElementById('config-tier').value;

    if (!budget || !deadline) {
        showToast("Please fill in budget and deadline.", "error");
        return;
    }

    const btn = document.querySelector('.match-btn');
    btn.innerText = "MATCHING AI IS SCANNING...";
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/configure-project`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: projectId,
                budget: parseFloat(budget),
                deadline,
                work_mode: mode,
                service_tier: tier
            })
        });

        if (!response.ok) throw new Error("Matching service failed");

        showToast("✨ Configuration Saved! Finding best vendors...", "success");
        setTimeout(() => {
            document.getElementById('modal-overlay').style.display = 'none';
            loadMatchingHub(projectId, projectName);
        }, 1500);

    } catch (err) {
        showToast(err.message, "error");
        btn.innerText = "FIND MATCHING VENDORS 🚀";
        btn.disabled = false;
    }
};

async function loadMatchingHub(projectId, projectName) {
    // Hide default project list and input
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) heroSection.style.display = 'none';

    const headerH1 = document.querySelector('header h1');
    const headerP = document.querySelector('header p.subtitle');
    if (headerH1) headerH1.innerText = `War Room: ${projectName}`;
    if (headerP) headerP.innerText = "AI is evaluating all available vendors based on your constraints...";
    
    // Clear old container & show loader
    projectsContainer.innerHTML = Array(3).fill(0).map(() => `
        <div class="skeleton-card" style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between;">
                <div class="skeleton-title" style="width: 30%"></div>
                <div class="skeleton-title" style="width: 60px; height: 30px; border-radius: 20px;"></div>
            </div>
            <div class="skeleton-text" style="height: 60px; border-radius: 12px;"></div>
            <div class="skeleton-badges" style="justify-content: flex-end;">
                <div class="skeleton-badge" style="width: 100px;"></div>
            </div>
        </div>
    `).join('');

    try {
        const response = await fetch(`${API_BASE}/match-vendors?project_id=${projectId}`);
        if (!response.ok) {
            const errData = await response.json();
             throw new Error(errData.detail || "Failed to load matches");
        }

        const data = await response.json();
        renderMatchingHub(projectId, data.matches);

    } catch (err) {
        showToast(err.message, "error");
        document.querySelector('.hero-section p.subtitle').innerText = "Match failed. Please ensure the backend is running.";
    }
}

function renderMatchingHub(projectId, matches) {
    const headerP = document.querySelector('header p.subtitle');
    if (headerP) {
        headerP.innerText = matches.length > 0 
            ? "Top vendors matched specifically to your configured constraints." 
            : "No vendors available for matching.";
    }

    if (matches.length === 0) {
        projectsContainer.innerHTML = `<div class="subtask-item" style="justify-content:center; padding: 2rem;">No vendors found in the database. Add some vendors first!</div>`;
        return;
    }

    projectsContainer.innerHTML = matches.map((match, index) => `
        <div class="match-card fade-in" style="animation-delay: ${index * 0.1}s">
            <div class="match-header">
                <div>
                    <h3 style="margin: 0;">${match.business_name}</h3>
                    <div style="font-size: 0.8rem; opacity: 0.6; margin-top: 0.3rem;">Domain: ${match.domain}</div>
                </div>
                <div class="match-score">${match.match_score}% MATCH</div>
            </div>
            
            <div class="tech-badges">
                ${match.skills.map(s => `<span class="badge" style="background: rgba(255,255,255,0.05);">${s}</span>`).join('')}
            </div>
            
            <div class="match-reason">
                <strong>Why they matched:</strong> ${match.match_reason}
            </div>

            <div class="match-footer">
                <button class="invite-btn" onclick="inviteVendor('${projectId}', '${match.vendor_id}', this)">
                    INVITE TO PROJECT
                </button>
            </div>
        </div>
    `).join('') + `
        <button class="auth-btn" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); margin-top: 1rem;" onclick="window.location.reload()">
            ← BACK TO ALL PROJECTS
        </button>
    `;
}

window.inviteVendor = async function(projectId, vendorId, btnElement) {
    btnElement.disabled = true;
    btnElement.innerText = "SENDING INVITE...";
    
    try {
        const response = await fetch(`${API_BASE}/invite-vendor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: projectId,
                vendor_id: vendorId
            })
        });

        if (!response.ok) throw new Error("Failed to send invite");

        btnElement.style.background = "rgba(0, 242, 254, 0.2)";
        btnElement.style.color = "#00f2fe";
        btnElement.innerText = "INVITATION SENT ✓";
        showToast("Invitation delivered to vendor's workspace.", "success");
    } catch (err) {
        showToast(err.message, "error");
        btnElement.disabled = false;
        btnElement.innerText = "INVITE TO PROJECT";
    }
};

async function renderVendorInbox(email) {
    heroSection.innerHTML = `
        <div class="vendor-workspace fade-in">
            <div class="workspace-header">
                <h3>Vendor Inbox (War Room)</h3>
                <p class="subtitle">Welcome back, ${email}. Here are your project invitations.</p>
            </div>
            <div id="vendor-invitations-container" style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem;">
                <div class="loader" style="display: block; margin: 0 auto;"></div>
            </div>
        </div>
    `;

    // Show the global Edit Profile button
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        editBtn.style.display = 'block';
        editBtn.onclick = () => editVendorProfile();
    }

    try {
        const response = await fetch(`${API_BASE}/vendor-invitations?vendor_id=${currentUser.id}`);
        if (!response.ok) throw new Error("Failed to fetch invitations");
        const resData = await response.json();
        
        const container = document.getElementById("vendor-invitations-container");
        if (!resData.data || resData.data.length === 0) {
            container.innerHTML = `<div style="text-align: center; opacity: 0.6; padding: 2rem; background: var(--glass-bg); border-radius: 20px; border: 1px solid var(--glass-border);">No new invitations yet. We will notify you when a Manager selects you!</div>`;
            return;
        }

        container.innerHTML = resData.data.map((inv, index) => `
            <div class="match-card fade-in" style="text-align: left; animation-delay: ${index * 0.1}s">
                <div class="match-header">
                    <div>
                        <h3 style="margin: 0; color: #00f2fe;">${inv.project_details?.project_name || 'Unknown Project'}</h3>
                        <div style="font-size: 0.8rem; opacity: 0.6; margin-top: 0.3rem;">Status: ${inv.status.toUpperCase()}</div>
                    </div>
                    <div style="font-size: 0.9rem; font-weight: bold; text-align: right;">
                        Budget: $${inv.project_details?.budget || 'N/A'} <br/>
                        Deadline: ${inv.project_details?.deadline || 'N/A'}
                    </div>
                </div>
                <div class="match-reason" style="margin-top: 1rem;">
                    <strong>Requirements:</strong> ${inv.project_details?.required_technologies || 'None specified'}
                    <br/><br/>
                    <strong>Mode:</strong> ${inv.project_details?.work_mode || 'N/A'} &nbsp;|&nbsp; <strong>Tier:</strong> ${inv.project_details?.service_tier || 'N/A'}
                </div>
                
                ${inv.status === 'pending' ? `
                    <div class="match-footer" style="margin-top: 1rem; justify-content: flex-end; gap: 1rem; display: flex;">
                        <button class="auth-btn" style="width: auto; background: transparent; border: 1px solid rgba(255,68,68,0.5); color: #ff4444;" onclick="respondInvitation('${inv.id}', 'declined')">Decline</button>
                        <button class="match-btn" style="width: auto; margin: 0;" onclick="respondInvitation('${inv.id}', 'accepted')">Accept & Enter War Room</button>
                    </div>
                ` : `
                    <div class="match-footer" style="margin-top: 1rem;">
                        <button class="match-btn" style="width: 100%; margin: 0; background: ${inv.status === 'accepted' ? '#00f2fe' : 'rgba(255,255,255,0.1)'}; color: ${inv.status === 'accepted' ? '#000' : '#fff'};" ${inv.status === 'declined' ? 'disabled' : ''}>
                            ${inv.status === 'accepted' ? 'ENTER WAR ROOM' : 'DECLINED'}
                        </button>
                    </div>
                `}
            </div>
        `).join('');
    } catch (err) {
        document.getElementById("vendor-invitations-container").innerHTML = `<div style="color: #ff4444;">Error loading inbox: ${err.message}</div>`;
    }
}

window.editVendorProfile = async function() {
    // Hide the global Edit Profile button while editing
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) editBtn.style.display = 'none';

    // Force the UI back to the Setup Form state
    heroSection.innerHTML = `
        <div class="vendor-workspace fade-in">
            <div class="workspace-header">
                <h3>Edit Vendor Profile</h3>
                <p class="subtitle">Update your capabilities and execution preferences.</p>
            </div>
            
            <div class="choice-container">
                <div class="choice-card active" id="magic-path">
                    <div class="choice-icon">✨</div>
                    <h4>Magic Auto-fill</h4>
                    <p>Upload a fresh CV or Catalog.</p>
                </div>
                <div class="choice-card" id="manual-path">
                    <div class="choice-icon">✍️</div>
                    <h4>Manual Entry</h4>
                    <p>Update your services manually.</p>
                </div>
            </div>

            <div id="vendor-action-area">
                <div id="drop-zone" class="drop-zone-glow scale-up">
                    <p>Drag & Drop your Capability Document</p>
                    <span style="font-size: 0.8rem; opacity: 0.5;">(PDF, TXT, or JSON)</span>
                    <input type="file" id="file-input" hidden accept=".pdf,.txt,.json">
                    <button class="auth-btn" style="margin-top: 1.5rem; width: auto; padding: 0.8rem 2rem;" onclick="document.getElementById('file-input').click()">Browse Files</button>
                </div>

                <form id="vendor-form" class="auth-form scale-up" style="display: none; max-width: 600px; margin: 0 auto; text-align: left;">
                    <div class="form-group">
                        <label>Business / Provider Name</label>
                        <input type="text" id="vendor-name" placeholder="e.g. Acme Logistics" required>
                    </div>
                    <div class="form-group">
                        <label>Core Services (Comma separated)</label>
                        <input type="text" id="vendor-services" placeholder="e.g. Last-mile delivery, Cold storage">
                    </div>
                    <div class="form-group">
                        <label>Domain / Industry</label>
                        <input type="text" id="vendor-domain" placeholder="e.g. Supply Chain, IT Services">
                    </div>
                    
                    <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem; font-size: 1rem; color: #00f2fe;">Execution Preferences</h4>
                    <div class="config-grid" style="margin-bottom: 1.5rem; gap: 0.75rem;">
                        <div class="config-field">
                            <label>Preferred Work Mode</label>
                            <select id="vendor-mode">
                                <option value="remote">Remote (Default)</option>
                                <option value="onsite">On-Site</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div class="config-field">
                            <label>Service Tier</label>
                            <select id="vendor-tier">
                                <option value="speed">Speed (Fast Delivery)</option>
                                <option value="quality">Quality (Enterprise Grade / ISO Certified)</option>
                            </select>
                        </div>
                        <div class="config-field" style="grid-column: span 2;">
                            <label>Minimum Project Size (USD)</label>
                            <input type="number" id="vendor-min-budget" placeholder="e.g. 1000" value="0">
                        </div>
                    </div>
                    
                    <button type="submit" class="auth-btn">Save Updates</button>
                    <button type="button" class="auth-btn" style="background: transparent; color: #fff; border: 1px solid rgba(255, 255, 255, 0.4); margin-top: 0.5rem; transition: background 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'" onclick="window.location.reload()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    setupVendorListeners();

    // Fetch and pre-fill existing data
    try {
        const response = await fetch(`${API_BASE}/vendor-profile?vendor_id=${currentUser.id}`);
        const resData = await response.json();
        if (response.ok && resData.data) {
            const v = resData.data;
            document.getElementById('vendor-name').value = v.business_name || '';
            document.getElementById('vendor-services').value = (v.skills || []).join(', ');
            document.getElementById('vendor-domain').value = v.vendor_domain || '';
            if (v.preferred_work_mode) document.getElementById('vendor-mode').value = v.preferred_work_mode;
            if (v.service_tier) document.getElementById('vendor-tier').value = v.service_tier;
            if (v.min_budget) document.getElementById('vendor-min-budget').value = v.min_budget;
            
            // Auto-switch to the manual form to show the populated data
            setTimeout(() => {
                const manualBtn = document.getElementById('manual-path');
                if (manualBtn) manualBtn.click();
            }, 50);
        }
    } catch (e) {
        console.error("Failed to load existing profile:", e);
    }
}

window.respondInvitation = async function(invitationId, action) {
    try {
        const response = await fetch(`${API_BASE}/respond-invitation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invitation_id: invitationId,
                action: action
            })
        });
        if (!response.ok) throw new Error("Failed to respond");
        
        showToast(`Invitation ${action}!`, "success");
        // Reload inbox
        renderDashboardForRole('vendor', currentUser.email);
    } catch (err) {
        showToast(err.message, "error");
    }
};

async function handleProjectClick(projectId, el) {
    const subtaskDiv = document.getElementById(`subtasks-${projectId}`);
    
    // Toggle if already loaded
    if (subtaskDiv.innerHTML !== "" && !subtaskDiv.innerHTML.includes('LOADING')) {
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
                project_id: projectId,
                project_name: "Auto-detected by Backend", // Updated since we just need the ID in most robust setups
            }),
        });

        if (!response.ok) throw new Error("Failed to load subtasks");

        const data = await response.json();
        renderSubtasks(projectId, data.tasks);
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
