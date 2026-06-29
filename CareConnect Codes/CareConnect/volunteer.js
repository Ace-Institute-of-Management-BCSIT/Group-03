function toggleSkill(btn) {
    btn.classList.toggle('selected');
}

let pendingOpportunity = '';
let pendingCauseId     = null;

function applyVolunteer(name, causeId) {
    if (!isSignedIn()) {
        showToast('⚠️ Please sign in to apply for volunteer opportunities.');
        openSignInModal();
        return;
    }

    pendingOpportunity = name;
    pendingCauseId     = causeId || null;

    const titleEl = document.getElementById('apply-modal-opp-name');
    if (titleEl) titleEl.textContent = name;

    document.getElementById('apply-modal')?.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeApplyModal() {
    document.getElementById('apply-modal')?.classList.remove('show');
    document.body.style.overflow = '';
}

async function submitVolunteerApplication(event) {
    event.preventDefault();

    const availability = document.getElementById('apply-availability')?.value || '';
    const message       = document.getElementById('apply-message')?.value.trim() || '';

    if (!availability) {
        showToast('⚠️ Please select your availability.');
        return;
    }

    const session = getSession();
    showToast('⏳ Submitting application...');

    try {
        const res = await fetch('api/apply_volunteer.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: session.id,
                opportunity: pendingOpportunity,
                cause_id: pendingCauseId,
                availability,
                message
            })
        });
        const data = await res.json();

        if (data.success) {
            showToast(`✅ Application submitted for "${pendingOpportunity}"! We'll contact you soon.`);
            event.target.reset();
            closeApplyModal();
        } else {
            showToast('⚠️ ' + data.message);
        }
    } catch (err) {
        console.error(err);
        showToast('⚠️ Could not connect to server. Make sure XAMPP is running.');
    }
}

/* -------------------------
   DYNAMIC OPPORTUNITIES (campaigns posted by NGOs that need volunteers)
-------------------------- */
async function loadDynamicOpportunities() {
    const container = document.getElementById('dynamicOppCards');
    if (!container) return;

    try {
        const res  = await fetch('api/campaigns_list.php');
        const data = await res.json();
        if (!data.success) return;

        const needVolunteers = data.campaigns.filter(c => c.volunteers_needed > 0);
        if (!needVolunteers.length) return;

        container.innerHTML = needVolunteers.map(c => `
            <div class="opp-card" data-cat="${(c.category || '').toLowerCase()}">
                <div class="opp-card-top">
                    <div class="opp-header">
                        <div class="opp-org">
                            <div class="org-logo">${(c.ngo_name || 'N')[0]}</div>
                            <div><div class="org-info-name">${c.ngo_name || 'NGO'}</div><div class="org-info-type">NGO · Verified</div></div>
                        </div>
                    </div>
                    <div class="opp-title">${c.title}</div>
                    <div class="opp-desc">${c.description || ''}</div>
                    <div class="opp-tags">${c.category ? `<span class="opp-tag">${c.category}</span>` : ''}${c.district ? `<span class="opp-tag">${c.district}</span>` : ''}</div>
                    <div class="opp-meta">
                        <div class="opp-meta-item"><i class="fa-solid fa-location-dot"></i> ${c.district || 'Nepal'}</div>
                        <div class="opp-meta-item"><i class="fa-solid fa-users"></i> ${c.volunteers_needed} volunteers needed</div>
                    </div>
                </div>
                <div class="opp-card-bottom">
                    <div class="opp-spots"><strong>${c.volunteers_needed}</strong> spots</div>
                    <button class="btn-apply" onclick="applyVolunteer('${c.title.replace(/'/g, "\\'")}', ${c.id})">Apply Now</button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Could not load NGO opportunities', err);
    }
}

/* -------------------------
   VOLUNTEER PROFILE REGISTRATION
-------------------------- */
async function handleVolunteerRegister(event) {
    event.preventDefault();
    if (!isSignedIn()) { showToast('⚠️ Please sign in first.'); openSignInModal(); return; }

    const session  = getSession();
    const name     = document.getElementById('vol-name')?.value?.trim()  || '';
    const phone    = document.getElementById('vol-phone')?.value?.trim() || '';
    const district = document.getElementById('vol-district')?.value      || '';
    const avail    = document.getElementById('vol-avail')?.value         || '';

    if (!name) { showToast('⚠️ Please enter your full name.'); return; }

    const skills = [];
    document.querySelectorAll('.skill-chip.selected').forEach(c => skills.push(c.textContent.trim()));

    showToast('⏳ Saving profile...');

    try {
        const res  = await fetch('api/volunteer_register.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                user_id:  session.id,
                phone, district,
                avail,
                skills:   skills.join(', ')
            })
        });
        const data = await res.json();

        if (data.success) {
            showToast(`🎉 ${name.split(' ')[0]}, ${data.message}`);
            event.target.reset();
            document.querySelectorAll('.skill-chip').forEach(c => c.classList.remove('selected'));
        } else {
            showToast('⚠️ ' + data.message);
        }
    } catch (err) {
        showToast('⚠️ Could not connect to server. Make sure XAMPP is running.');
        console.error(err);
    }
}

/* -------------------------
   PAGE VIEW (sign-in gating)
-------------------------- */
function applyVolunteerView() {
    const warning = document.getElementById('vol-signin-warning');
    const gate    = document.getElementById('vol-form-gate');
    const form    = document.getElementById('vol-register-form-wrap');

    if (!isSignedIn()) {
        if (warning) warning.style.display = 'flex';
        if (gate)    gate.style.display    = 'block';
        if (form)    form.style.display    = 'none';
    } else {
        if (warning) warning.style.display = 'none';
        if (gate)    gate.style.display    = 'none';
        if (form)    form.style.display    = 'block';

        const session = getSession();
        if (session) {
            const nameEl  = document.getElementById('vol-name');
            const emailEl = document.getElementById('vol-email');
            if (nameEl  && !nameEl.value)  nameEl.value  = session.name  || '';
            if (emailEl && !emailEl.value) emailEl.value = session.email || '';
        }
    }
}

function onSessionChange() { applyVolunteerView(); }

document.addEventListener('DOMContentLoaded', () => {
    applyVolunteerView();
    loadDynamicOpportunities();
});