document.addEventListener('DOMContentLoaded', () => {
    loadDynamicNgoDirectory();
});

function applyNGOView() {
    const role    = getRole();
    const session = getSession();

    const gate     = document.getElementById('ngo-form-gate');
    const form     = document.getElementById('ngo-register-form-wrap');
    const banner   = document.getElementById('ngo-info-banner');
    const pending  = document.getElementById('ngo-pending-banner');
    const dash     = document.getElementById('ngo-campaigns-wrap');

    // hide everything first, then show only what applies
    [gate, form, banner, pending, dash].forEach(el => { if (el) el.style.display = 'none'; });

    if (!isSignedIn()) {
        if (gate) gate.style.display = 'block';
        return;
    }

    if (role !== 'ngo') {
        // Donor / volunteer / admin — this page is for NGOs to manage themselves
        if (banner) banner.style.display = 'flex';
        return;
    }

    // Role is ngo — three possible states:
    if (!session.ngo_id) {
        // 1) Hasn't submitted an organization profile yet
        if (form) {
            form.style.display = 'block';

            const contactEl = document.getElementById('ngo-contact');
            const emailEl   = document.getElementById('ngo-email');
            if (contactEl && !contactEl.value) contactEl.value = session.name || '';
            if (emailEl && !emailEl.value)   emailEl.value   = session.email || '';
        }
    } else if (!session.ngo_verified) {
        // 2) Submitted, waiting on admin review
        if (pending) pending.style.display = 'block';
    } else {
        // 3) Verified — show the campaign management dashboard
        if (dash) dash.style.display = 'block';
        loadMyCampaigns();
    }
}

// Called by shared.js after sign-in/sign-out
function onSessionChange() { applyNGOView(); }

document.addEventListener('DOMContentLoaded', applyNGOView);


// ─────────────────────────────
// NGO REGISTRATION FORM SUBMISSION
// ─────────────────────────────
async function handleNGORegister(event) {
    event.preventDefault();

    if (!isSignedIn()) {
        showToast('⚠️ Please sign in first.');
        openSignInModal();
        return;
    }

    const session = getSession();

    const name     = document.getElementById('ngo-name')?.value?.trim() || '';
    const reg      = document.getElementById('ngo-reg')?.value?.trim() || '';
    const type     = document.getElementById('ngo-type')?.value || '';
    const focus    = document.getElementById('ngo-focus')?.value || '';
    const district = document.getElementById('ngo-district')?.value || '';
    const contact  = document.getElementById('ngo-contact')?.value?.trim() || '';
    const email    = document.getElementById('ngo-email')?.value?.trim() || '';
    const phone    = document.getElementById('ngo-phone')?.value?.trim() || '';
    const desc     = document.getElementById('ngo-desc-input')?.value?.trim() || '';

    if (!name || !reg || !type || !focus || !district || !contact || !email) {
        showToast('⚠️ Please fill in all required fields.');
        return;
    }

    showToast('⏳ Submitting NGO application...');

    try {
        const res = await fetch('api/ngo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: session.id,
                name, registration_no: reg, type, focus, district,
                contact, email, phone, description: desc
            })
        });

        const data = await res.json();

        if (data.success) {
            showToast(`✅ "${name}" submitted successfully! We will review it within 48 hours.`);
            event.target.reset();
            // We don't know the new ngo_id yet (no re-login happened), but we DO know
            // it's now pending, so flip the UI to the "pending" state right away.
            session.ngo_id = -1;          // placeholder, just so applyNGOView treats it as "submitted"
            session.ngo_verified = 0;
            setSession(session);
            applyNGOView();
        } else {
            showToast('⚠️ ' + (data.message || 'Submission failed'));
        }

    } catch (err) {
        console.error(err);
        showToast('❌ Server error. Please check backend.');
    }
}


// ─────────────────────────────
// POST A NEW CAMPAIGN (verified NGOs only)
// ─────────────────────────────
async function handleCampaignCreate(event) {
    event.preventDefault();

    const session = getSession();
    if (!session || !session.ngo_verified) {
        showToast('⚠️ Your organization must be verified before posting campaigns.');
        return;
    }

    const title             = document.getElementById('camp-title')?.value?.trim() || '';
    const description       = document.getElementById('camp-desc')?.value?.trim() || '';
    const category          = document.getElementById('camp-category')?.value || '';
    const district          = document.getElementById('camp-district')?.value || '';
    const goal_amount       = parseFloat(document.getElementById('camp-goal')?.value || 0);
    const accepts_cash      = document.getElementById('camp-cash')?.checked ? 1 : 0;
    const accepts_items     = document.getElementById('camp-items')?.checked ? 1 : 0;
    const volunteers_needed = parseInt(document.getElementById('camp-volunteers')?.value || 0, 10);

    if (!title || !description || !goal_amount) {
        showToast('⚠️ Please fill in title, description, and a goal amount.');
        return;
    }

    showToast('⏳ Publishing campaign...');

    try {
        const res = await fetch('api/campaign_create.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: session.id,
                title, description, category, district,
                goal_amount, accepts_cash, accepts_items, volunteers_needed
            })
        });
        const data = await res.json();

        if (data.success) {
            showToast('🎉 ' + data.message);
            event.target.reset();
            loadMyCampaigns();
        } else {
            showToast('⚠️ ' + data.message);
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Server error. Please check backend.');
    }
}

async function loadMyCampaigns() {
    const session = getSession();
    const list = document.getElementById('my-campaigns-list');
    if (!session || !list) return;

    list.innerHTML = '<p style="font-size:13px;color:var(--muted);">Loading your campaigns...</p>';

    try {
        const res  = await fetch(`api/campaigns_list.php?ngo_user_id=${session.id}`);
        const data = await res.json();

        if (!data.success || !data.campaigns.length) {
            list.innerHTML = '<p style="font-size:13px;color:var(--muted);">You haven\'t posted any campaigns yet — use the form above to create your first one.</p>';
            return;
        }

        list.innerHTML = data.campaigns.map(c => {
            const pct = c.goal_amount > 0 ? Math.min(100, Math.round((c.raised_amount / c.goal_amount) * 100)) : 0;
            return `
            <div class="campaign-list-item">
                <div class="campaign-list-top">
                    <strong>${c.title}</strong>
                    <span class="ngo-verified" style="${c.status !== 'active' ? 'background:#FFEBEE;color:#C62828;' : ''}">${c.status}</span>
                </div>
                <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
                <div class="progress-meta">
                    <span>NPR ${Math.round(c.raised_amount).toLocaleString()} of ${Math.round(c.goal_amount).toLocaleString()}</span>
                    <span>${c.volunteers_needed > 0 ? c.applicant_count + ' volunteer applicant(s)' : ''}</span>
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error(err);
        list.innerHTML = '<p style="font-size:13px;color:var(--muted);">Could not load campaigns.</p>';
    }
}


// ─────────────────────────────
// REAL VERIFIED NGOs ON THE DIRECTORY (in addition to the showcase cards above)
// ─────────────────────────────
async function loadDynamicNgoDirectory() {
    const grid = document.getElementById('ngoGrid');
    if (!grid) return;

    // Don't duplicate NGOs that already have a showcase card hardcoded above
    const existingNames = new Set(
        Array.from(document.querySelectorAll('.ngo-name')).map(el => el.textContent.trim())
    );

    try {
        const res  = await fetch('api/campaigns_list.php');
        const data = await res.json();
        if (!data.success || !data.campaigns.length) return;

        // group causes by the NGO that posted them
        const byNgo = {};
        data.campaigns.forEach(c => {
            if (!c.ngo_name || existingNames.has(c.ngo_name)) return;
            if (!byNgo[c.ngo_name]) byNgo[c.ngo_name] = [];
            byNgo[c.ngo_name].push(c);
        });

        const cards = Object.keys(byNgo).map(ngoName => {
            const causes      = byNgo[ngoName];
            const totalRaised = causes.reduce((s, c) => s + c.raised_amount, 0);
            const firstCauseId = causes[0].id;
            const district     = causes[0].ngo_district || causes[0].district || 'Nepal';
            const volunteers    = causes[0].ngo_volunteer_count || 0;
            const initial       = ngoName[0].toUpperCase();
            const tags = [...new Set(causes.map(c => c.category).filter(Boolean))];

            return `
            <div class="ngo-card">
                <div class="ngo-card-header">
                    <div class="ngo-logo" style="background:linear-gradient(135deg,#1565C0,#42A5F5);">${initial}</div>
                    <div class="ngo-card-info">
                        <div class="ngo-name">${ngoName}</div>
                        <div class="ngo-meta-row">
                            <span class="ngo-location"><i class="fa-solid fa-location-dot"></i> ${district}</span>
                            <span class="ngo-verified">✓ Verified</span>
                        </div>
                    </div>
                </div>
                <div class="ngo-desc">${causes[0].description || ''}</div>
                ${tags.length ? `<div class="ngo-focus">${tags.map(t => `<span class="ngo-focus-tag">${t}</span>`).join('')}</div>` : ''}
                <div class="ngo-stats-row">
                    <div class="ngo-stat"><div class="ngo-stat-val">${volunteers}</div><div class="ngo-stat-lbl">Volunteers</div></div>
                    <div class="ngo-stat"><div class="ngo-stat-val">NPR ${Math.round(totalRaised).toLocaleString()}</div><div class="ngo-stat-lbl">Raised</div></div>
                    <div class="ngo-stat"><div class="ngo-stat-val">${causes.length}</div><div class="ngo-stat-lbl">Campaigns</div></div>
                </div>
                <div class="ngo-card-actions">
                    <button class="btn-ngo-view btn-ngo-outline" onclick="window.location.href='ngo_profile.html?name=${encodeURIComponent(ngoName)}'">View Profile</button>
                </div>
            </div>`;
        }).join('');

        grid.insertAdjacentHTML('beforeend', cards);

    } catch (err) {
        console.error('Could not load NGO directory', err);
    }
}


function loadNGOProfile() {
    const session = getSession();
    if (!session) return;

    const el = document.getElementById('ngo-profile');
    if (!el) return;

    el.innerHTML = `
        <h2>${session.name}</h2>
        <p>${session.email}</p>
    `;
}