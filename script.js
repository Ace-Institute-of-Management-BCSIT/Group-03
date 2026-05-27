document.addEventListener("DOMContentLoaded", function () {

    let index = 0;
    const slides = document.querySelectorAll(".slide");

    if (slides.length === 0) return;

    let interval;

    function showSlide(i) {
        slides.forEach(slide => slide.classList.remove("active"));
        slides[i].classList.add("active");
    }

    function nextSlide() {
        index = (index + 1) % slides.length;
        showSlide(index);
    }

    function startSlider() {
        clearInterval(interval); // IMPORTANT FIX (prevents freezing)
        interval = setInterval(nextSlide, 3500);
    }

    function stopSlider() {
        clearInterval(interval);
    }

    // INIT
    showSlide(index);
    startSlider();

});

// SIGN IN MODAL FUNCTIONS
function openSignInModal() {
    const modal = document.getElementById('signin-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeSignInModal() {
    const modal = document.getElementById('signin-modal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function togglePassword() {
    const passwordInput = document.getElementById('signin-password');
    const toggleIcon = document.getElementById('toggle-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

function handleSignIn(event) {
    event.preventDefault();
    
    const email = document.querySelector('#signin-form input[type="email"]').value;
    const password = document.getElementById('signin-password').value;
    const role = document.querySelector('.form-select').value;
    
    if (!email || !password) {
        showToast('⚠️ Please fill in all fields');
        return;
    }
    
    if (!role) {
        showToast('⚠️ Please select your role');
        return;
    }
    
    // Simulate sign in success
    showToast(`✅ Welcome back! Signed in as ${role}`);
    closeSignInModal();
    
    // Optional: Redirect to dashboard based on role
    // if (role === 'donor') goToPage('donor');
    // if (role === 'volunteer') goToPage('volunteer');
}

function switchToSignUp() {
    closeSignInModal();
    showToast('Sign up form coming soon!');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('signin-modal');
    if (event.target === modal) {
        closeSignInModal();
    }
}

// Update the sign in button in header to open modal
document.addEventListener('DOMContentLoaded', function() {
    const signinBtn = document.querySelector('.btn-signin');
    if (signinBtn) {
        signinBtn.onclick = openSignInModal;
    }
});

// SIGN UP MODAL FUNCTIONS
let selectedUserRole = '';

function openSignUpModal() {
    const modal = document.getElementById('signup-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        resetSignUpForm();
    } else {
        showToast('Create account feature coming soon!');
    }
}

function closeSignUpModal() {
    const modal = document.getElementById('signup-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function resetSignUpForm() {
    // Reset form fields
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-confirm-password').value = '';
    document.getElementById('terms-checkbox').checked = false;
    document.getElementById('org-name-group').style.display = 'none';
    document.getElementById('org-name').value = '';
    
    // Reset role selection
    document.querySelectorAll('.role-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    selectedUserRole = '';
    document.getElementById('selected-role').value = '';
}

function selectRole(role) {
    selectedUserRole = role;
    document.getElementById('selected-role').value = role;
    
    // Update UI
    document.querySelectorAll('.role-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    const roleMap = {
        'donor': 'role-donor',
        'volunteer': 'role-volunteer',
        'ngo': 'role-ngo',
        'admin': 'role-admin'
    };
    
    document.getElementById(roleMap[role]).classList.add('selected');
    
    // Show organization name field only for NGO
    const orgGroup = document.getElementById('org-name-group');
    if (role === 'ngo') {
        orgGroup.style.display = 'block';
    } else {
        orgGroup.style.display = 'none';
    }
}

function toggleSignupPassword() {
    const passwordInput = document.getElementById('signup-password');
    const toggleIcon = document.getElementById('signup-toggle-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

function handleSignUp(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const termsChecked = document.getElementById('terms-checkbox').checked;
    const orgName = document.getElementById('org-name').value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showToast('⚠️ Please fill in all fields');
        return;
    }
    
    if (!selectedUserRole) {
        showToast('⚠️ Please select a role');
        return;
    }
    
    if (password.length < 8) {
        showToast('⚠️ Password must be at least 8 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('⚠️ Passwords do not match');
        return;
    }
    
    if (!termsChecked) {
        showToast('⚠️ Please agree to the Terms of Service');
        return;
    }
    
    if (selectedUserRole === 'ngo' && !orgName) {
        showToast('⚠️ Please enter your organization name');
        return;
    }
    
    // Success message
    const roleNames = {
        'donor': 'Donor',
        'volunteer': 'Volunteer',
        'ngo': 'NGO',
        'admin': 'Admin'
    };
    
    showToast(`🎉 Welcome, ${name.split(' ')[0]}! You've successfully joined as a ${roleNames[selectedUserRole]}.`);
    
    // Close modal
    closeSignUpModal();
    
    // Optional: Redirect to appropriate dashboard
    // if (selectedUserRole === 'donor') goToPage('donor');
    // if (selectedUserRole === 'volunteer') goToPage('volunteer');
    // if (selectedUserRole === 'ngo') goToPage('ngo');
}

function switchToSignIn() {
    closeSignUpModal();
    openSignInModal();
}

// Close modals when clicking outside
window.onclick = function(event) {
    const signinModal = document.getElementById('signin-modal');
    const signupModal = document.getElementById('signup-modal');
    
    if (event.target === signinModal) {
        closeSignInModal();
    }
    if (event.target === signupModal) {
        closeSignUpModal();
    }
}

// Add this to closeSignInModal function if not already present
function closeSignInModal() {
    const modal = document.getElementById('signin-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// SWITCH FROM SIGN IN TO SIGN UP
function switchFromSignInToSignUp(event) {
    if (event) event.preventDefault();
    
    // Get email from sign-in form to pre-fill sign-up form
    const signinEmail = document.getElementById('signin-email').value;
    
    // Close sign-in modal
    closeSignInModal();
    
    // Open sign-up modal after short delay
    setTimeout(() => {
        openSignUpModal();
        
        // Pre-fill email if it exists
        if (signinEmail && signinEmail !== '') {
            const signupEmail = document.getElementById('signup-email');
            if (signupEmail) {
                signupEmail.value = signinEmail;
            }
        }
    }, 200);
}

// SWITCH FROM SIGN UP TO SIGN IN
function switchFromSignUpToSignIn(event) {
    if (event) event.preventDefault();
    
    // Get email from sign-up form to pre-fill sign-in form
    const signupEmail = document.getElementById('signup-email').value;
    const signupPassword = document.getElementById('signup-password').value;
    
    // Close sign-up modal
    closeSignUpModal();
    
    // Open sign-in modal after short delay
    setTimeout(() => {
        openSignInModal();
        
        // Pre-fill email if it exists
        if (signupEmail && signupEmail !== '') {
            const signinEmail = document.getElementById('signin-email');
            if (signinEmail) {
                signinEmail.value = signupEmail;
            }
        }
        
        // Pre-fill password if it exists (optional, for convenience)
        if (signupPassword && signupPassword !== '') {
            const signinPassword = document.getElementById('signin-password');
            if (signinPassword) {
                signinPassword.value = signupPassword;
            }
        }
    }, 200);
}

// Enhanced Sign In Handler with "Create Account" suggestion
function handleSignIn(event) {
    event.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const role = document.getElementById('signin-role').value;
    
    if (!email || !password) {
        showToast('⚠️ Please fill in all fields');
        return;
    }
    
    if (!role) {
        showToast('⚠️ Please select your role');
        return;
    }
    
    // Check if account exists (simulated - in real app, check against database)
    // For demo, if email contains "test" or is empty, suggest creating account
    const accountExists = checkIfAccountExists(email);
    
    if (!accountExists) {
        // Show suggestion to create account
        showToastWithAction(
            'Account not found. Would you like to create one?', 
            () => switchFromSignInToSignUp()
        );
        return;
    }
    
    showToast(`✅ Welcome back! Signed in as ${role}`);
    closeSignInModal();
}

// Simulate account existence check
function checkIfAccountExists(email) {
    // This is a simulation - in real app, check against your database
    // For demo purposes, assume accounts exist for certain emails
    const demoAccounts = ['test@example.com', 'user@careconnect.com', 'demo@careconnect.com'];
    
    if (demoAccounts.includes(email.toLowerCase())) {
        return true;
    }
    
    // You can also check localStorage for registered users
    const registeredUsers = JSON.parse(localStorage.getItem('careconnect_users') || '[]');
    return registeredUsers.some(user => user.email === email);
}

// Enhanced Sign Up Handler with localStorage storage
function handleSignUp(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const termsChecked = document.getElementById('terms-checkbox').checked;
    const orgName = document.getElementById('org-name').value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showToast('⚠️ Please fill in all fields');
        return;
    }
    
    if (!selectedUserRole) {
        showToast('⚠️ Please select a role');
        return;
    }
    
    if (password.length < 8) {
        showToast('⚠️ Password must be at least 8 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('⚠️ Passwords do not match');
        return;
    }
    
    if (!termsChecked) {
        showToast('⚠️ Please agree to the Terms of Service');
        return;
    }
    
    if (selectedUserRole === 'ngo' && !orgName) {
        showToast('⚠️ Please enter your organization name');
        return;
    }
    
    // Save user to localStorage (simulated database)
    const newUser = {
        name: name,
        email: email,
        role: selectedUserRole,
        organization: selectedUserRole === 'ngo' ? orgName : null,
        createdAt: new Date().toISOString()
    };
    
    const existingUsers = JSON.parse(localStorage.getItem('careconnect_users') || '[]');
    // Check if email already exists
    if (existingUsers.some(user => user.email === email)) {
        showToast('⚠️ An account with this email already exists. Please sign in.');
        return;
    }
    
    existingUsers.push(newUser);
    localStorage.setItem('careconnect_users', JSON.stringify(existingUsers));
    
    // Success message with role
    const roleNames = {
        'donor': 'Donor',
        'volunteer': 'Volunteer',
        'ngo': 'NGO',
        'admin': 'Admin'
    };
    
    showToast(`🎉 Welcome, ${name.split(' ')[0]}! You've successfully joined as a ${roleNames[selectedUserRole]}.`);
    
    // Close modal
    closeSignUpModal();
    
    // Optional: Auto sign in after account creation
    setTimeout(() => {
        openSignInModal();
        document.getElementById('signin-email').value = email;
        document.getElementById('signin-role').value = selectedUserRole;
    }, 500);
}

// Enhanced Toast with Action Button
function showToastWithAction(message, onAction) {
    const toast = document.getElementById('toastMsg');
    if (!toast) return;
    
    toast.innerHTML = `${message} <button onclick="this.parentElement.style.opacity='0'; ${onAction.toString()}()" style="background:white; color:#1565C0; border:none; border-radius:20px; padding:4px 12px; margin-left:10px; cursor:pointer; font-weight:600;">Create Account</button>`;
    toast.style.opacity = '1';
    toast.style.pointerEvents = 'auto';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.pointerEvents = 'none';
        setTimeout(() => {
            toast.innerHTML = '';
        }, 300);
    }, 5000);
}

// Toggle password for sign-in
function toggleSigninPassword() {
    const passwordInput = document.getElementById('signin-password');
    const toggleIcon = document.getElementById('signin-toggle-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Make sure closeSignInModal is defined
function closeSignInModal() {
    const modal = document.getElementById('signin-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

document.addEventListener("DOMContentLoaded", function () {

    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", function () {
            navLinks.classList.toggle("active");
        });
    }

});
