let currentCause   = 'Education for All Children';
let currentCauseId = 1;
let currentType    = 'cash';
let currentFreq    = 'One-time';
let currentAmount  = 1000;

/* -------------------------
   PAGE ACCESS CONTROL
-------------------------- */
function applyDonateView() {
    const gate    = document.getElementById('donate-gate');
    const content = document.getElementById('donate-panel-content');
    if (!gate || !content) return;

    if (!isSignedIn()) {
        gate.style.display = 'block';
        content.style.display = 'none';
    } else {
        gate.style.display = 'none';
        content.style.display = 'block';
    }
}

/* called automatically from shared.js */
function onSessionChange() {
    applyDonateView();
    renderRecentDonors();
}

/* -------------------------
   CAUSE SELECTION
-------------------------- */
function selectCause(card, name, causeId) {
    document.querySelectorAll('.cause-card')
        .forEach(c => c.classList.remove('selected'));

    card.classList.add('selected');
    currentCause   = name;
    currentCauseId = parseInt(causeId, 10) || parseInt(card.dataset.causeId, 10) || 1;

    document.getElementById('selectedCauseLabel').textContent = name;
    updateSummary();
}

/* -------------------------
   DYNAMIC CAMPAIGNS (posted by NGOs)
-------------------------- */
async function loadDynamicCauses() {
    const container = document.getElementById('dynamicCauseCards');
    if (!container) return;

    try {
        const res  = await fetch('api/campaigns_list.php');
        const data = await res.json();
        if (!data.success || !data.campaigns.length) return;

        container.innerHTML = data.campaigns.map(c => {
            const pct = c.goal_amount > 0 ? Math.min(100, Math.round((c.raised_amount / c.goal_amount) * 100)) : 0;
            return `
            <div class="cause-card" data-cause-id="${c.id}" onclick="selectCause(this, '${c.title.replace(/'/g, "\\'")}', ${c.id})">
                <div class="cause-card-inner">
                    <div class="cause-icon"><i class="fa-solid fa-hand-holding-heart"></i></div>
                    <div class="cause-body">
                        <div class="cause-top">
                            <span class="cause-title">${c.title}</span>
                            <span class="cause-raised">NPR ${Math.round(c.raised_amount).toLocaleString()} raised</span>
                        </div>
                        <p class="cause-desc">${c.ngo_name ? `By ${c.ngo_name} — ` : ''}${c.description || ''}</p>
                        <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
                        <div class="progress-meta"><span>${pct}% of goal</span><span>NPR ${Math.round(c.goal_amount).toLocaleString()} goal</span></div>
                    </div>
                </div>
            </div>`;
        }).join('');

        // If a ?cause=ID link brought the donor here, auto-select it
        selectCauseFromUrlIfPresent();

    } catch (err) {
        console.error('Could not load NGO campaigns', err);
    }
}

function selectCauseFromUrlIfPresent() {
    const params = new URLSearchParams(window.location.search);
    const wantedId = params.get('cause');
    if (!wantedId) return;

    const card = document.querySelector(`.cause-card[data-cause-id="${wantedId}"]`);
    if (card) {
        const title = card.querySelector('.cause-title')?.textContent.trim();
        selectCause(card, title, wantedId);
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/* -------------------------
   DONATION TYPE
-------------------------- */
function setType(type) {
    currentType = type;

    document.getElementById('type-cash')?.classList.toggle('active', type === 'cash');
    document.getElementById('type-items')?.classList.toggle('active', type === 'items');

    document.getElementById('cash-section').style.display  = type === 'cash' ? 'block' : 'none';
    document.getElementById('items-section').style.display = type === 'items' ? 'block' : 'none';
}

/* -------------------------
   FREQUENCY
-------------------------- */
function setFreq(btn, freq) {
    document.querySelectorAll('.freq-btn')
        .forEach(b => b.classList.remove('active'));

    btn.classList.add('active');
    currentFreq = freq;

    updateSummary();
}

/* -------------------------
   AMOUNT
-------------------------- */
function setAmount(btn, value) {
    document.querySelectorAll('.amount-btn')
        .forEach(b => b.classList.remove('active'));

    btn.classList.add('active');

    currentAmount = value;
    document.getElementById('customAmount').value = value;

    updateSummary();
}

/* -------------------------
   SUMMARY BOX
-------------------------- */
function updateSummary() {
    const amount = parseFloat(document.getElementById('customAmount')?.value) || 0;
    currentAmount = amount;

    document.getElementById('summCause').textContent = currentCause;
    document.getElementById('summFreq').textContent  = currentFreq;
    document.getElementById('summAmt').textContent   = `NPR ${amount.toLocaleString()}`;
    document.getElementById('summTotal').textContent = `NPR ${amount.toLocaleString()}`;
}

/* -------------------------
   CASH DONATION (PHP)
-------------------------- */
async function handleDonate() {
    if (!isSignedIn()) {
        showToast('⚠️ Please sign in to donate');
        openSignInModal();
        return;
    }

    const amount = parseFloat(document.getElementById('customAmount')?.value || 0);

    if (!amount || amount <= 0) {
        showToast('⚠️ Enter a valid amount');
        return;
    }

    const session = getSession();
    showToast('⏳ Processing donation...');

    try {
        const res = await fetch('api/donate.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: session.id,
                cause_id: currentCauseId,
                amount,
                frequency: currentFreq
            })
        });

        const data = await res.json();

        if (data.success) {
            showToast(`🎉 Thank you! NPR ${amount.toLocaleString()} donated.`);
            renderRecentDonors();
        } else {
            showToast('⚠️ ' + data.message);
        }

    } catch (err) {
        console.error(err);
        showToast('⚠️ Server not reachable');
    }
}

/* -------------------------
   ITEM DONATION (PHP)
-------------------------- */
async function handleItemsDonate() {
    if (!isSignedIn()) {
        showToast('⚠️ Please sign in first');
        openSignInModal();
        return;
    }

    const desc     = document.getElementById('items-desc')?.value.trim();
    const location = document.getElementById('meetup-location')?.value.trim();
    const time     = document.getElementById('meetup-time')?.value;
    const phone    = document.getElementById('meetup-phone')?.value.trim();

    if (!desc || !location || !time || !phone) {
        showToast('⚠️ Please fill all fields');
        return;
    }

    const session = getSession();
    showToast('⏳ Scheduling meetup...');

    try {
        const res = await fetch('api/item-donation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: session.id,
                cause_id: currentCauseId,
                items_description: desc,
                meetup_location: location,
                meetup_time: time,
                phone
            })
        });

        const data = await res.json();

        if (data.success) {
            showToast('✅ Meetup request sent!');
            document.getElementById('items-desc').value = '';
            document.getElementById('meetup-location').value = '';
            document.getElementById('meetup-time').value = '';
            document.getElementById('meetup-phone').value = '';
        } else {
            showToast('⚠️ ' + data.message);
        }

    } catch (err) {
        console.error(err);
        showToast('⚠️ Server error');
    }
}

/* -------------------------
   RECENT DONORS (STATIC)
-------------------------- */
const STATIC_DONORS = [
    { name: 'Sunita Rana', amount: 2500, cause: 'Education', time: '2h ago' },
    { name: 'Ramesh Adhikari', amount: 5000, cause: 'Disaster Relief', time: '5h ago' },
    { name: 'Anonymous', amount: 1000, cause: 'Clean Water', time: '1d ago' }
];

function renderRecentDonors() {
    const list = document.querySelector('.donors-list');
    if (!list) return;

    list.innerHTML = STATIC_DONORS.map(d => `
        <div class="donor-row">
            <div class="donor-avatar">${d.name[0]}</div>
            <div>
                <div>${d.name}</div>
                <small>${d.cause}</small>
            </div>
            <div>
                <strong>NPR ${d.amount}</strong><br>
                <small>${d.time}</small>
            </div>
        </div>
    `).join('');
}

/* -------------------------
   INIT
-------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    applyDonateView();
    renderRecentDonors();
    setType('cash');
    updateSummary();
    loadDynamicCauses();
    selectCauseFromUrlIfPresent();
});