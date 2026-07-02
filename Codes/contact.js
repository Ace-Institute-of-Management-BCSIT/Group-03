document.addEventListener('DOMContentLoaded', () => {
    if (isSignedIn()) {
        updateNavButtons();
    }
});
// ─────────────────────────────
// TOPIC SELECTION
// ─────────────────────────────
function selectTopic(btn) {
    document.querySelectorAll('.topic-btn')
        .forEach(b => b.classList.remove('active'));

    btn.classList.add('active');

    const text = btn.textContent
        .trim()
        .replace(/^[\p{Emoji}\s]+/u, '')
        .trim();

    const input = document.getElementById('selected-topic');
    if (input) input.value = text || btn.textContent.trim();
}


// ─────────────────────────────
// CHARACTER COUNT
// ─────────────────────────────
function updateCharCount(textarea) {
    const counter = document.getElementById('charCount');
    if (counter) counter.textContent = textarea.value.length;
}


// ─────────────────────────────
// FAQ TOGGLE
// ─────────────────────────────
function toggleFAQ(questionEl) {
    const item = questionEl.parentElement;
    const wasOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item')
        .forEach(i => i.classList.remove('open'));

    if (!wasOpen) item.classList.add('open');
}


// ─────────────────────────────
// CONTACT FORM SUBMIT (BACKEND READY)
// ─────────────────────────────
function handleContact(event) {
    event.preventDefault();

    const fname   = document.getElementById('contact-fname')?.value.trim() || '';
    const lname   = document.getElementById('contact-lname')?.value.trim() || '';
    const email   = document.getElementById('contact-email')?.value.trim() || '';
    const message = document.getElementById('contact-message')?.value.trim() || '';
    const topic   = document.getElementById('selected-topic')?.value || 'General inquiry';

    if (!fname || !lname || !email || !message) {
        showToast('⚠️ Please fill in all required fields.');
        return;
    }

    const session = typeof getSession === 'function' ? getSession() : null;

    // Send to backend (recommended for production)
    fetch('api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: session?.id || null,
            topic,
            first_name: fname,
            last_name: lname,
            email,
            phone: document.getElementById('contact-phone')?.value || '',
            role: document.getElementById('contact-role')?.value || '',
            message,
            newsletter: document.getElementById('contact-newsletter')?.checked || false
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast(`✅ Thanks ${fname}! We’ll reply within 24 hours.`);
            event.target.reset();

            const counter = document.getElementById('charCount');
            if (counter) counter.textContent = '0';

            // reset topic to default
            const firstTopic = document.querySelector('.topic-btn');
            if (firstTopic) firstTopic.click();

        } else {
            showToast(data.message || '❌ Failed to send message');
        }
    })
    .catch(() => {
        showToast('❌ Server error. Make sure XAMPP is running.');
    });
}


// ─────────────────────────────
// PREFILL FORM FROM SESSION
// ─────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    const session = typeof getSession === 'function' ? getSession() : null;

    if (!session) return;

    const nameParts = (session.name || '').split(' ');

    const fnameEl = document.getElementById('contact-fname');
    const lnameEl = document.getElementById('contact-lname');
    const emailEl = document.getElementById('contact-email');

    if (fnameEl && !fnameEl.value) fnameEl.value = nameParts[0] || '';
    if (lnameEl && !lnameEl.value) lnameEl.value = nameParts.slice(1).join(' ') || '';
    if (emailEl && !emailEl.value) emailEl.value = session.email || '';

    const roleEl = document.getElementById('contact-role');
    if (roleEl && session.role) {
        const roleMap = {
            donor: 'Donor',
            volunteer: 'Volunteer',
            ngo: 'NGO Representative',
            admin: 'Other'
        };
        roleEl.value = roleMap[session.role] || '';
    }
});