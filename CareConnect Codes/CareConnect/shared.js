
/* -------------------------
   SESSION MANAGEMENT
-------------------------- */

function getSession() {
    try {
        const s = JSON.parse(sessionStorage.getItem('cc_session'));
        return s && s.id ? s : null;
    } catch {
        return null;
    }
}

function setSession(data) {
    sessionStorage.setItem('cc_session', JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        ngo_id: data.ngo_id ?? null,
        ngo_verified: data.ngo_verified ?? null
    }));
}

function clearSession() {
    sessionStorage.removeItem('cc_session');
}

function isSignedIn() {
    return getSession() !== null;
}

function getRole() {
    const s = getSession();
    return s ? s.role : null;
}

function getUserName() {
    const s = getSession();
    return s ? s.name : null;
}

/* -------------------------
   TOAST NOTIFICATIONS
-------------------------- */

function showToast(message) {
    let toast = document.getElementById('toastMsg');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastMsg';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
    }, 2600);
}

/* -------------------------
   NAVBAR BUTTONS
-------------------------- */

function updateNavButtons() {
    const navBtns = document.querySelector('.nav-buttons');
    if (!navBtns) return;

    const session = getSession();

    if (session) {
        const roleLabels = {
            donor: '💚 Donor',
            volunteer: '🙋 Volunteer',
            ngo: '🌍 NGO',
            admin: '🏢 Admin'
        };

        const adminLink = session.role === 'admin'
            ? `<button class="btn-getstarted" onclick="window.location.href='admin.html'">Admin panel</button>`
            : '';

        navBtns.innerHTML = `
            <span class="nav-user-label">
                ${session.role === 'admin'
                    ? roleLabels.admin
                    : `${roleLabels[session.role] || ''} · ${session.name?.split(' ')[0] || ''}`}
            </span>
            ${adminLink}
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

    setTimeout(() => {
        updateNavButtons();
        window.location.href = 'index.html';
    }, 300);
}

/* -------------------------
   MODALS
-------------------------- */

function openSignInModal() {
    document.getElementById('signin-modal')?.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeSignInModal() {
    document.getElementById('signin-modal')?.classList.remove('show');
    document.body.style.overflow = '';
}

function openSignUpModal() {
    document.getElementById('signup-modal')?.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeSignUpModal() {
    document.getElementById('signup-modal')?.classList.remove('show');
    document.body.style.overflow = '';
}

/* -------------------------
   PASSWORD TOGGLE
-------------------------- */

function toggleSigninPassword() {
    const input = document.getElementById('signin-password');
    const icon = document.getElementById('signin-toggle-icon');
    if (!input) return;

    input.type = input.type === 'password' ? 'text' : 'password';
    icon?.classList.toggle('fa-eye');
    icon?.classList.toggle('fa-eye-slash');
}

function toggleSignupPassword() {
    const input = document.getElementById('signup-password');
    const icon = document.getElementById('signup-toggle-icon');
    if (!input) return;

    input.type = input.type === 'password' ? 'text' : 'password';
    icon?.classList.toggle('fa-eye');
    icon?.classList.toggle('fa-eye-slash');
}

/* -------------------------
   SIGN IN
-------------------------- */

async function handleSignIn(event) {
    event.preventDefault();

    const email = document.getElementById('signin-email')?.value.trim();
    const password = document.getElementById('signin-password')?.value;
    const role = document.getElementById('signin-role')?.value;

    if (!email || !password || !role) {
        showToast('⚠️ Please fill all fields');
        return;
    }

    showToast('⏳ Signing in...');

    try {
        const res = await fetch('api/signin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        const data = await res.json().catch(() => null);

        if (!data || !data.success) {
            showToast('⚠️ Invalid login');
            return;
        }

        setSession(data.user);
        updateNavButtons();
        closeSignInModal();

        showToast('✅ Login successful!');

        setTimeout(() => {
            const r = data.user.role;

            if (r === 'donor') window.location.href = 'donate.html';
            else if (r === 'volunteer') window.location.href = 'volunteer.html';
            else if (r === 'ngo') window.location.href = 'ngo.html';
            else if (r === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'index.html';

        }, 600);

    } catch (err) {
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

    document.querySelectorAll('.role-option')
        .forEach(o => o.classList.remove('selected'));

    const map = {
        donor: 'role-donor',
        volunteer: 'role-volunteer',
        ngo: 'role-ngo',
        admin: 'role-admin'
    };

    document.getElementById(map[role])?.classList.add('selected');

    const org = document.getElementById('org-name-group');
    if (org) org.style.display = role === 'ngo' ? 'block' : 'none';
}

async function handleSignUp(event) {
    event.preventDefault();

    const name = document.getElementById('signup-name')?.value.trim();
    const email = document.getElementById('signup-email')?.value.trim();
    const password = document.getElementById('signup-password')?.value;
    const confirm = document.getElementById('signup-confirm-password')?.value;
    const terms = document.getElementById('terms-checkbox')?.checked;
    const org_name = document.getElementById('org-name')?.value.trim();

    if (!name || !email || !password || !confirm) {
        showToast('⚠️ Fill all fields');
        return;
    }

    if (!selectedUserRole) {
        showToast('⚠️ Select role');
        return;
    }

    if (password.length < 8) {
        showToast('⚠️ Password must be at least 8 characters');
        return;
    }

    if (password !== confirm) {
        showToast('⚠️ Password mismatch');
        return;
    }

    if (!terms) {
        showToast('⚠️ Accept terms');
        return;
    }

    try {
        const res = await fetch('api/signup.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: name,
                email,
                password,
                role: selectedUserRole,
                org_name: org_name || null
            })
        });

        const data = await res.json().catch(() => null);

        if (!data || !data.success) {
            showToast('⚠️ Signup failed');
            return;
        }

        setSession({
            id: data.user_id || null,
            name,
            email,
            role: selectedUserRole
        });

        updateNavButtons();
        closeSignUpModal();

        showToast('🎉 Account created!');

        setTimeout(() => {
            if (selectedUserRole === 'donor') window.location.href = 'donate.html';
            else if (selectedUserRole === 'volunteer') window.location.href = 'volunteer.html';
            else if (selectedUserRole === 'ngo') window.location.href = 'ngo.html';
            else window.location.href = 'index.html';
        }, 800);

    } catch (err) {
        console.error(err);
        showToast('⚠️ Server error');
    }
}

/* -------------------------
   INIT
-------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    updateNavButtons();
});

/* -------------------------
   PASSWORD STRENGTH
-------------------------- */

function checkPasswordStrength(input) {
    const hint = document.getElementById('password-strength-hint');
    if (!hint) return;

    const val = input.value;

    if (val.length < 8) {
        hint.textContent = 'Weak password';
        hint.style.color = 'red';
    } else {
        hint.textContent = 'Good password';
        hint.style.color = 'green';
    }
}