import { supabase } from './supabase.js';

// auth.js - Real Supabase Authentication
const roleToggle = document.getElementById('role-toggle');
const roleBtns = document.querySelectorAll('.role-btn');
const authForm = document.getElementById('auth-form');
const toggleAuthLink = document.getElementById('toggle-auth');
const authHeader = document.querySelector('.auth-header h2');
const authSubtitle = document.getElementById('auth-subtitle');
const footerText = document.getElementById('footer-text');
const submitBtn = document.getElementById('submit-btn');

let isLogin = true;
let currentRole = 'manager';

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
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 4s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// --- UI Logic ---

// Toggle between Manager and Vendor
roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentRole = btn.dataset.role;
        roleToggle.dataset.role = currentRole;
        
        // Update active button state
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Toggle between Login and Signup UI
toggleAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    
    if (isLogin) {
        authHeader.textContent = "Welcome Back";
        authSubtitle.textContent = "Secure access to your workspace";
        submitBtn.textContent = "Continue";
        footerText.textContent = "Don't have an account?";
        toggleAuthLink.textContent = "Sign up";
    } else {
        authHeader.textContent = "Create Account";
        authSubtitle.textContent = "Join the AI Marketplace";
        submitBtn.textContent = "Create Account";
        footerText.textContent = "Already have an account?";
        toggleAuthLink.textContent = "Login";
    }
});

// --- Auth Submission ---
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    submitBtn.textContent = "Processing...";
    submitBtn.disabled = true;

    try {
        let result;
        if (isLogin) {
            result = await supabase.auth.signInWithPassword({
                email,
                password,
            });
        } else {
            result = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: currentRole,
                        full_name: email.split('@')[0],
                    }
                }
            });
        }

        const { data, error } = result;
        if (error) throw error;

        if (data.user) {
            const registeredRole = data.user.user_metadata?.role;
            
            // If logging in, ensure selected role matches registered role
            if (isLogin && registeredRole && registeredRole !== currentRole) {
                await supabase.auth.signOut(); // Log them back out immediately
                throw new Error(`Access Denied: This account is registered as a ${registeredRole.toUpperCase()}. Please switch the toggle to ${registeredRole.toUpperCase()} to continue.`);
            }

            // Save to LocalStorage for fast UI rendering
            localStorage.setItem('user_role', registeredRole || currentRole);
            localStorage.setItem('user_email', data.user.email);
            localStorage.setItem('is_logged_in', 'true');
            
            // Redirect to Dashboard
            window.location.href = 'index.html';
        } else if (!isLogin) {
            showToast("Signup successful! Please check your email to confirm.", "success");
            submitBtn.textContent = "Create Account";
            submitBtn.disabled = false;
        }

    } catch (err) {
        showToast(err.message, "error");
        submitBtn.textContent = isLogin ? "Continue" : "Create Account";
        submitBtn.disabled = false;
    }
});

// Initial Session Check
async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        window.location.href = 'index.html';
    }
}
checkSession();

// --- Interactive Polish: Cursor Glow & Magnetic Effects ---
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', (e) => {
    if (cursorGlow) {
        cursorGlow.style.left = `${e.clientX}px`;
        cursorGlow.style.top = `${e.clientY}px`;
    }

    // Magnetic Elements
    const magnetics = document.querySelectorAll('.auth-btn, .role-btn, .auth-card');
    magnetics.forEach(el => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        const distance = Math.sqrt(distanceX**2 + distanceY**2);

        if (distance < 120) {
            const pullX = distanceX * 0.02;
            const pullY = distanceY * 0.02;
            el.style.transform = `translate(${pullX}px, ${pullY}px)`;
        } else {
            el.style.transform = `translate(0, 0)`;
        }
    });
});
