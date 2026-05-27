// =============================================
// CARECONNECT — SHARED PAGES JS
// =============================================

// ── Session helpers ────────────────────────
function getSession() {
    try { return JSON.parse(sessionStorage.getItem('cc_session') || 'null'); } catch { return null; }
}
function setSession(data) { sessionStorage.setItem('cc_session', JSON.stringify(data)); }
function clearSession()   { sessionStorage.removeItem('cc_session'); }
function isSignedIn()     { return !!getSession(); }
function getRole()        { const s = getSession(); return s ? s.role : null; }
function getUserName()    { const s = getSession(); return s ? s.name : null; }

// ── Toast ──────────────────────────────────
function showToast(message) {
    let toast = document.getElementById('toastMsg');
    if (!toast) { toast = document.createElement('div'); toast.id = 'toastMsg'; document.body.appendChild(toast); }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2600);
}

// ── Header nav buttons ──────────────────────
function updateNavButtons() {
    const navBtns = document.querySelector('.nav-buttons');
    if (!navBtns) return;
    const session = getSession();
    if (session) {
        const roleLabels = { donor: '💚 Donor', volunteer: '🙋 Volunteer', ngo: '🌍 NGO', admin: '🏢 Admin' };
        navBtns.innerHTML = `
            <span class="nav-user-label">${roleLabels[session.role] || ''} · ${session.name.split(' ')[0]}</span>
            <button class="btn-signout" onclick="handleSignOut()">Sign out</button>
        `;
    } else {
        navBtns.innerHTML = `
            <button class="btn-signin" onclick="openSignInModal()">Sign in</button>
            <button class="btn-getstarted" onclick="openSignUpModal()">Get started →</button>
        `;
    }
}

function handleSignOut() {
    clearSession();
    showToast('👋 You have been signed out.');
    setTimeout(() => { updateNavButtons(); if (typeof onSessionChange === 'function') onSessionChange(); }, 400);
}

// ── Sign In Modal ───────────────────────────
function openSignInModal() {
    const modal = document.getElementById('signin-modal');
    if (modal) { modal.classList.add('show'); document.body.style.overflow = 'hidden'; }
}
function closeSignInModal() {
    const modal = document.getElementById('signin-modal');
    if (modal) { modal.classList.remove('show'); document.body.style.overflow = ''; }
}
function toggleSigninPassword() {
    const input = document.getElementById('signin-password');
    const icon  = document.getElementById('signin-toggle-icon');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye'); icon.classList.toggle('fa-eye-slash');
}
function handleSignIn(event) {
    event.preventDefault();
    const email    = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const role     = document.getElementById('signin-role').value;
    if (!email || !password) { showToast('⚠️ Please fill in all fields'); return; }
    if (!role)               { showToast('⚠️ Please select your role');   return; }
    const users = JSON.parse(localStorage.getItem('careconnect_users') || '[]');
    const demo  = ['test@example.com','user@careconnect.com','demo@careconnect.com'];
    const found = demo.includes(email.toLowerCase()) ? { name: email.split('@')[0], email, role } : users.find(u => u.email === email);
    if (!found) { showToast('⚠️ No account found. Please sign up first.'); return; }
    const name = found.name || email.split('@')[0];
    setSession({ email, role, name });
    const roleNames = { donor:'Donor', volunteer:'Volunteer', ngo:'NGO', admin:'Admin' };
    showToast(`✅ Welcome back, ${name.split(' ')[0]}! Signed in as ${roleNames[role] || role}`);
    closeSignInModal();
    setTimeout(() => { updateNavButtons(); if (typeof onSessionChange === 'function') onSessionChange(); }, 300);
}

// ── Sign Up Modal ───────────────────────────
let selectedUserRole = '';
function openSignUpModal() {
    const modal = document.getElementById('signup-modal');
    if (modal) { modal.classList.add('show'); document.body.style.overflow = 'hidden'; resetSignUpForm(); }
}
function closeSignUpModal() {
    const modal = document.getElementById('signup-modal');
    if (modal) { modal.classList.remove('show'); document.body.style.overflow = ''; }
}
function resetSignUpForm() {
    ['signup-name','signup-email','signup-password','signup-confirm-password','org-name']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const tc = document.getElementById('terms-checkbox'); if (tc) tc.checked = false;
    const og = document.getElementById('org-name-group'); if (og) og.style.display = 'none';
    document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
    selectedUserRole = '';
    const sr = document.getElementById('selected-role'); if (sr) sr.value = '';
}
function selectRole(role) {
    selectedUserRole = role;
    const sr = document.getElementById('selected-role'); if (sr) sr.value = role;
    document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
    const map = { donor:'role-donor', volunteer:'role-volunteer', ngo:'role-ngo', admin:'role-admin' };
    const el = document.getElementById(map[role]); if (el) el.classList.add('selected');
    const og = document.getElementById('org-name-group'); if (og) og.style.display = role === 'ngo' ? 'block' : 'none';
}
function toggleSignupPassword() {
    const input = document.getElementById('signup-password');
    const icon  = document.getElementById('signup-toggle-icon');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye'); icon.classList.toggle('fa-eye-slash');
}
function handleSignUp(event) {
    event.preventDefault();
    const name    = document.getElementById('signup-name').value;
    const email   = document.getElementById('signup-email').value;
    const pass    = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm-password').value;
    const terms   = document.getElementById('terms-checkbox').checked;
    const org     = document.getElementById('org-name') ? document.getElementById('org-name').value : '';
    if (!name || !email || !pass || !confirm) { showToast('⚠️ Please fill in all fields'); return; }
    if (!selectedUserRole)                     { showToast('⚠️ Please select a role');       return; }
    if (pass.length < 8)                       { showToast('⚠️ Password must be at least 8 characters'); return; }
    if (pass !== confirm)                      { showToast('⚠️ Passwords do not match');     return; }
    if (!terms)                                { showToast('⚠️ Please agree to the Terms');  return; }
    if (selectedUserRole === 'ngo' && !org)    { showToast('⚠️ Please enter organization name'); return; }
    const users = JSON.parse(localStorage.getItem('careconnect_users') || '[]');
    if (users.some(u => u.email === email)) { showToast('⚠️ Email already registered.'); return; }
    users.push({ name, email, role: selectedUserRole, organization: org || null, createdAt: new Date().toISOString() });
    localStorage.setItem('careconnect_users', JSON.stringify(users));
    const roleNames = { donor:'Donor', volunteer:'Volunteer', ngo:'NGO', admin:'Admin' };
    showToast(`🎉 Welcome, ${name.split(' ')[0]}! Joined as ${roleNames[selectedUserRole]}.`);
    closeSignUpModal();
    setTimeout(() => {
        openSignInModal();
        const se = document.getElementById('signin-email'); const sr = document.getElementById('signin-role');
        if (se) se.value = email; if (sr) sr.value = selectedUserRole;
    }, 500);
}
function switchFromSignInToSignUp(event) {
    if (event) event.preventDefault();
    const emailVal = document.getElementById('signin-email') ? document.getElementById('signin-email').value : '';
    closeSignInModal();
    setTimeout(() => { openSignUpModal(); if (emailVal) { const se = document.getElementById('signup-email'); if (se) se.value = emailVal; } }, 200);
}
function switchToSignIn() { closeSignUpModal(); setTimeout(openSignInModal, 200); }

window.addEventListener('click', function(e) {
    const si = document.getElementById('signin-modal');
    const su = document.getElementById('signup-modal');
    if (e.target === si) closeSignInModal();
    if (e.target === su) closeSignUpModal();
});

document.addEventListener('DOMContentLoaded', function() { updateNavButtons(); });