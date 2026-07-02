/* -------------------------
   SESSION MANAGEMENT
-------------------------- */
function getSession() {
    try {
        const s = JSON.parse(sessionStorage.getItem('cc_session'));
        return s && s.id ? s : null;
    } catch { return null; }
}
function setSession(data) {
    sessionStorage.setItem('cc_session', JSON.stringify({
        id: data.id, name: data.name, email: data.email, role: data.role,
        ngo_id: data.ngo_id ?? null, ngo_verified: data.ngo_verified ?? null
    }));
}
function clearSession() { sessionStorage.removeItem('cc_session'); }
function isSignedIn() { return getSession() !== null; }
function getRole() { const s = getSession(); return s ? s.role : null; }
function getUserName() { const s = getSession(); return s ? s.name : null; }

/* -------------------------
   TOAST NOTIFICATIONS
-------------------------- */
function showToast(message) {
    let toast = document.getElementById('toastMsg');
    if (!toast) { toast = document.createElement('div'); toast.id = 'toastMsg'; document.body.appendChild(toast); }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

/* -------------------------
   NAVBAR + HAMBURGER
-------------------------- */
function updateNavButtons() {
    const navBtns = document.querySelector('.nav-buttons');
    if (!navBtns) return;
    const session = getSession();
    const roleLabels = { donor:'💚 Donor', volunteer:'🙋 Volunteer', ngo:'🌍 NGO', admin:'🏢 Admin' };

    if (session) {
        const dashMap = { donor:'donor_dashboard.html', volunteer:'volunteer_dashboard.html', ngo:'ngodashboard.html' };
        const dashBtn  = dashMap[session.role] ? `<button class="btn-getstarted" onclick="window.location.href='${dashMap[session.role]}'">My Dashboard</button>` : '';
        const adminBtn = session.role === 'admin' ? `<button class="btn-getstarted" onclick="window.location.href='admin.html'">Admin panel</button>` : '';
        navBtns.innerHTML = `
            <span class="nav-user-label">${session.role==='admin' ? roleLabels.admin : `${roleLabels[session.role]||''} · ${session.name?.split(' ')[0]||''}`}</span>
            ${adminBtn}${dashBtn}
            <button class="btn-signout" onclick="handleSignOut()">Sign out</button>`;
    } else {
        navBtns.innerHTML = `
            <button class="btn-signin" onclick="openSignInModal()">Sign in</button>
            <button class="btn-getstarted" onclick="openSignUpModal()">Get started →</button>`;
    }
}

function handleSignOut() {
    clearSession();
    showToast('👋 You have been signed out.');
    setTimeout(() => { updateNavButtons(); window.location.href = 'index.html'; }, 300);
}

/* -------------------------
   MOBILE HAMBURGER (injected automatically)
-------------------------- */
function initMobileNav() {
    const header = document.querySelector('header');
    const nav    = document.querySelector('header nav');
    if (!header || !nav) return;
    if (document.getElementById('hamburger-btn')) return; // already injected

    // Create hamburger button
    const btn = document.createElement('button');
    btn.id = 'hamburger-btn';
    btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    btn.setAttribute('aria-label', 'Toggle menu');
    btn.onclick = toggleMobileNav;
    header.insertBefore(btn, nav);

    // Close nav when a link is clicked
    nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            nav.classList.remove('mobile-open');
            btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!header.contains(e.target)) {
            nav.classList.remove('mobile-open');
            btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }
    });
}

function toggleMobileNav() {
    const nav = document.querySelector('header nav');
    const btn = document.getElementById('hamburger-btn');
    if (!nav || !btn) return;
    const isOpen = nav.classList.toggle('mobile-open');
    btn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
}

/* -------------------------
   MODALS
-------------------------- */
function openSignInModal()  { document.getElementById('signin-modal')?.classList.add('show');    document.body.style.overflow='hidden'; }
function closeSignInModal() { document.getElementById('signin-modal')?.classList.remove('show'); document.body.style.overflow=''; }
function openSignUpModal()  { document.getElementById('signup-modal')?.classList.add('show');    document.body.style.overflow='hidden'; }
function closeSignUpModal() { document.getElementById('signup-modal')?.classList.remove('show'); document.body.style.overflow=''; }
function switchToSignIn()   { closeSignUpModal(); openSignInModal(); }
function switchFromSignInToSignUp(e) { if(e) e.preventDefault(); closeSignInModal(); openSignUpModal(); }

/* -------------------------
   PASSWORD TOGGLE
-------------------------- */
function toggleSigninPassword() {
    const input = document.getElementById('signin-password');
    const icon  = document.getElementById('signin-toggle-icon');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    icon?.classList.toggle('fa-eye'); icon?.classList.toggle('fa-eye-slash');
}
function toggleSignupPassword() {
    const input = document.getElementById('signup-password');
    const icon  = document.getElementById('signup-toggle-icon');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    icon?.classList.toggle('fa-eye'); icon?.classList.toggle('fa-eye-slash');
}

/* -------------------------
   SIGN IN
-------------------------- */
async function handleSignIn(event) {
    event.preventDefault();
    const email    = document.getElementById('signin-email')?.value.trim();
    const password = document.getElementById('signin-password')?.value;
    const role     = document.getElementById('signin-role')?.value;

    if (!email || !password || !role) { showToast('⚠️ Please fill all fields'); return; }
    showToast('⏳ Signing in...');

    try {
        const res  = await fetch('api/signin.php', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ email, password, role })
        });
        const rawText = await res.text();
        let data = null;
        try { data = JSON.parse(rawText); } catch(_) {
            console.error('Signin PHP error:', rawText);
            showToast('⚠️ Server error — check XAMPP is running.');
            return;
        }

        if (!data || !data.success) {
            showToast('⚠️ ' + (data?.message || 'Login failed'));
            return;
        }

        setSession(data.user);
        updateNavButtons();
        closeSignInModal();
        showToast('✅ Welcome back, ' + data.user.name.split(' ')[0] + '!');

        setTimeout(() => {
            const r = data.user.role;
            if      (r === 'donor')     window.location.href = 'donor_dashboard.html';
            else if (r === 'volunteer') window.location.href = 'volunteer_dashboard.html';
            else if (r === 'ngo')       window.location.href = 'ngodashboard.html';
            else if (r === 'admin')     window.location.href = 'admin.html';
            else                        window.location.href = 'index.html';
        }, 700);

    } catch(err) {
        console.error(err);
        showToast('⚠️ Server error. Make sure XAMPP is running.');
    }
}

/* -------------------------
   SIGN UP
-------------------------- */
let selectedUserRole = '';

function selectRole(role) {
    selectedUserRole = role;
    document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
    const map = { donor:'role-donor', volunteer:'role-volunteer', ngo:'role-ngo', admin:'role-admin' };
    document.getElementById(map[role])?.classList.add('selected');
    const org = document.getElementById('org-name-group');
    if (org) org.style.display = role === 'ngo' ? 'block' : 'none';
}

async function handleSignUp(event) {
    event.preventDefault();
    const name     = document.getElementById('signup-name')?.value.trim();
    const email    = document.getElementById('signup-email')?.value.trim();
    const password = document.getElementById('signup-password')?.value;
    const confirm  = document.getElementById('signup-confirm-password')?.value;
    const terms    = document.getElementById('terms-checkbox')?.checked;
    const org_name = document.getElementById('org-name')?.value.trim();

    if (!name || !email || !password || !confirm) { showToast('⚠️ Please fill all fields'); return; }
    if (!selectedUserRole)    { showToast('⚠️ Please select a role'); return; }
    if (password.length < 8)  { showToast('⚠️ Password must be at least 8 characters'); return; }
    if (password !== confirm)  { showToast('⚠️ Passwords do not match'); return; }
    if (!terms)               { showToast('⚠️ Please accept the terms'); return; }

    showToast('⏳ Creating account...');

    try {
        const res = await fetch('api/signup.php', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ full_name:name, email, password, role:selectedUserRole, org_name:org_name||null })
        });

        const rawText = await res.text();
        let data = null;
        try { data = JSON.parse(rawText); } catch(_) {
            console.error('Signup PHP error:', rawText);
            showToast('⚠️ Server error — check F12 Console for details.');
            return;
        }

        if (!data.success) {
            showToast('⚠️ ' + data.message);
            if (data.canResend && data.email) {
                setTimeout(() => {
                    if (confirm('Resend verification email to ' + data.email + '?')) {
                        resendVerification(data.email);
                    }
                }, 500);
            }
            return;
        }

        closeSignUpModal();
        showToast('🎉 ' + data.message);

        if (data.needsVerification) {
            showVerificationNotice(email);
        } else {
            setTimeout(() => {
                if      (selectedUserRole === 'donor')     window.location.href = 'donor_dashboard.html';
                else if (selectedUserRole === 'volunteer') window.location.href = 'volunteer_dashboard.html';
                else if (selectedUserRole === 'ngo')       window.location.href = 'ngodashboard.html';
                else window.location.href = 'index.html';
            }, 900);
        }

    } catch(err) {
        console.error(err);
        showToast('⚠️ Could not reach server — make sure XAMPP is running.');
    }
}

/* -------------------------
   EMAIL VERIFICATION NOTICE
-------------------------- */
function showVerificationNotice(email) {
    let modal = document.getElementById('verify-notice-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'verify-notice-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-container" style="max-width:440px;text-align:center;padding:40px 30px;">
                <button class="modal-close" onclick="document.getElementById('verify-notice-modal').classList.remove('show');document.body.style.overflow='';">&times;</button>
                <div style="font-size:2.4rem;margin-bottom:10px;">📩</div>
                <h2 style="margin-bottom:10px;">Check your email</h2>
                <p style="color:var(--muted,#4A627A);line-height:1.6;margin-bottom:18px;">
                    We sent a verification link to <strong id="verify-notice-email"></strong>.<br>
                    Click it to activate your account, then sign in.
                </p>
                <button class="btn-submit" style="width:auto;padding:10px 24px;margin-bottom:10px;" onclick="resendVerification(document.getElementById('verify-notice-email').textContent)">Resend email</button>
                <br>
                <small style="color:var(--muted,#4A627A);">Link expires in 24 hours</small>
            </div>`;
        document.body.appendChild(modal);
    }
    document.getElementById('verify-notice-email').textContent = email;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

async function resendVerification(email) {
    showToast('⏳ Resending verification email...');
    try {
        const res  = await fetch('api/resend_verification.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        showToast((data.success ? '✅ ' : '⚠️ ') + data.message);
    } catch(err) {
        showToast('⚠️ Could not reach server.');
    }
}

/* -------------------------
   PASSWORD STRENGTH
-------------------------- */
function checkPasswordStrength(input) {
    const hint = document.getElementById('password-strength-hint');
    if (!hint) return;
    hint.textContent = input.value.length < 8 ? 'Weak password' : 'Good password';
    hint.style.color  = input.value.length < 8 ? 'red' : 'green';
}

/* -------------------------
   INIT
-------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    updateNavButtons();
    initMobileNav();
});