document.addEventListener('DOMContentLoaded', () => {
    const gate = document.getElementById('admin-gate');
    const dash = document.getElementById('admin-dashboard');
    if (!isSignedIn() || getRole() !== 'admin') {
        gate.style.display = 'block'; dash.style.display = 'none'; return;
    }
    gate.style.display = 'none'; dash.style.display = 'block';
    loadPendingNgos();
});

function adminId() { const s = getSession(); return s ? s.id : 0; }

function showAdminTab(tab) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab)?.classList.add('active');
    document.getElementById('tab-btn-' + tab)?.classList.add('active');
    if (tab === 'pending')   loadPendingNgos();
    if (tab === 'ngos')      loadVerifiedNgos();
    if (tab === 'donations') loadDonations();
    if (tab === 'users')     loadUsers();
    if (tab === 'contacts')  loadContacts();
}

/* ── PENDING NGOs ── */
async function loadPendingNgos() {
    const list = document.getElementById('pending-ngos-list');
    try {
        const res  = await fetch(`api/admin_actions.php?action=pending_ngos&admin_id=${adminId()}`);
        const data = await res.json();
        if (!data.success) { list.innerHTML = `<p class="admin-empty">${data.message}</p>`; return; }
        document.getElementById('pending-count').textContent = data.ngos.length;
        if (!data.ngos.length) { list.innerHTML = '<p class="admin-empty">No pending applications.</p>'; return; }
        list.innerHTML = data.ngos.map(n => `
            <div class="admin-card">
                <div class="admin-card-title">${n.ngo_name}</div>
                <div class="admin-card-meta">
                    <b>Type:</b> ${n.ngo_type}<br>
                    <b>Focus:</b> ${n.focus_area} · <b>District:</b> ${n.district}<br>
                    <b>Reg. No:</b> ${n.reg_number}<br>
                    <b>Contact:</b> ${n.contact_person} · ${n.email}${n.phone?' · '+n.phone:''}<br>
                    ${n.description?`<span style="display:block;margin-top:6px;">${n.description}</span>`:''}
                </div>
                <div class="admin-card-actions">
                    <button class="admin-btn admin-btn-approve" onclick="approveNgo(${n.id})"><i class="fa-solid fa-check"></i> Approve</button>
                    <button class="admin-btn admin-btn-reject"  onclick="rejectNgo(${n.id})"><i class="fa-solid fa-xmark"></i> Reject</button>
                </div>
            </div>`).join('');
    } catch(err) { list.innerHTML = '<p class="admin-empty">Could not load pending NGOs.</p>'; }
}

async function approveNgo(ngoId) {
    showToast('⏳ Approving...');
    const res  = await fetch('api/admin_actions.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'approve_ngo', admin_id:adminId(), ngo_id:ngoId }) });
    const data = await res.json();
    showToast(data.success ? '✅ NGO approved!' : '⚠️ '+data.message);
    loadPendingNgos();
}

async function rejectNgo(ngoId) {
    if (!confirm('Reject this NGO application?')) return;
    const res  = await fetch('api/admin_actions.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'reject_ngo', admin_id:adminId(), ngo_id:ngoId }) });
    const data = await res.json();
    showToast(data.success ? '✅ Rejected.' : '⚠️ '+data.message);
    loadPendingNgos();
}

/* ── VERIFIED NGOs ── */
async function loadVerifiedNgos() {
    const list = document.getElementById('verified-ngos-list');
    try {
        const res  = await fetch(`api/admin_actions.php?action=list_ngos&admin_id=${adminId()}`);
        const data = await res.json();
        if (!data.success) { list.innerHTML = `<p class="admin-empty">${data.message}</p>`; return; }
        if (!data.ngos.length) { list.innerHTML = '<p class="admin-empty">No verified NGOs yet.</p>'; return; }
        list.innerHTML = data.ngos.map(n => `
            <div class="admin-card">
                <div class="admin-card-title">${n.ngo_name} <span class="ngo-verified">✓ Verified</span></div>
                <div class="admin-card-meta">
                    <b>Focus:</b> ${n.focus_area} · <b>District:</b> ${n.district}<br>
                    <b>Email:</b> ${n.email}<br>
                    <b>Campaigns:</b> ${n.campaign_count}
                </div>
            </div>`).join('');
    } catch(err) { list.innerHTML = '<p class="admin-empty">Could not load NGOs.</p>'; }
}

/* ── DONATIONS ── */
async function loadDonations() {
    const cashBody = document.getElementById('cash-donations-body');
    const itemBody = document.getElementById('item-donations-body');
    try {
        const res  = await fetch(`api/admin_actions.php?action=list_donations&admin_id=${adminId()}`);
        const data = await res.json();
        if (!data.success) { cashBody.innerHTML = `<tr><td colspan="6" class="admin-empty">${data.message}</td></tr>`; return; }
        cashBody.innerHTML = data.cash_donations.length ? data.cash_donations.map(d => `
            <tr>
                <td>${d.donor}</td><td>${d.cause_title}</td>
                <td>NPR ${Math.round(d.amount).toLocaleString()}</td>
                <td><span class="pill">${d.frequency.replace('_',' ')}</span></td>
                <td><span class="pill">${d.payment_status}</span></td>
                <td>${new Date(d.created_at).toLocaleString()}</td>
            </tr>`).join('') : '<tr><td colspan="6" class="admin-empty">No cash donations yet.</td></tr>';
        itemBody.innerHTML = data.item_donations.length ? data.item_donations.map(d => `
            <tr>
                <td>${d.donor}</td><td>${d.cause_title}</td>
                <td>${d.items_description}</td>
                <td>${d.meetup_location}<br><small>${new Date(d.meetup_time).toLocaleString()}</small></td>
                <td>${d.phone}</td>
            </tr>`).join('') : '<tr><td colspan="5" class="admin-empty">No item donations yet.</td></tr>';
    } catch(err) { cashBody.innerHTML = '<tr><td colspan="6" class="admin-empty">Could not load donations.</td></tr>'; }
}

/* ── USERS ── */
async function loadUsers() {
    const body = document.getElementById('users-body');
    try {
        const res  = await fetch(`api/admin_actions.php?action=list_users&admin_id=${adminId()}`);
        const data = await res.json();
        if (!data.success) { body.innerHTML = `<tr><td colspan="5" class="admin-empty">${data.message}</td></tr>`; return; }
        body.innerHTML = data.users.map(u => `
            <tr>
                <td>${u.full_name}</td><td>${u.email}</td>
                <td><span class="pill">${u.role}</span></td>
                <td>${u.org_name||'—'}</td>
                <td>${u.role==='admin'?'':`<button class="admin-btn admin-btn-reject" style="padding:6px 14px;" onclick="deleteUser(${u.id})">Remove</button>`}</td>
            </tr>`).join('');
    } catch(err) { body.innerHTML = '<tr><td colspan="5" class="admin-empty">Could not load users.</td></tr>'; }
}

async function deleteUser(userId) {
    if (!confirm('Remove this user permanently?')) return;
    const res  = await fetch('api/admin_actions.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'delete_user', admin_id:adminId(), user_id:userId }) });
    const data = await res.json();
    showToast(data.success ? '✅ User removed.' : '⚠️ '+data.message);
    loadUsers();
}

/* ── CONTACT MESSAGES ── */
async function loadContacts() {
    const body = document.getElementById('contacts-body');
    try {
        const res  = await fetch(`api/admin_actions.php?action=list_contacts&admin_id=${adminId()}`);
        const data = await res.json();
        if (!data.success) { body.innerHTML = `<tr><td colspan="5" class="admin-empty">${data.message}</td></tr>`; return; }
        body.innerHTML = data.contacts.length ? data.contacts.map(c => `
            <tr>
                <td>${c.first_name} ${c.last_name}</td>
                <td>${c.email}${c.phone?'<br><small>'+c.phone+'</small>':''}</td>
                <td><span class="pill">${c.topic}</span></td>
                <td style="max-width:300px;word-break:break-word;">${c.message}</td>
                <td>${new Date(c.submitted_at).toLocaleString()}</td>
            </tr>`).join('') : '<tr><td colspan="5" class="admin-empty">No contact messages yet.</td></tr>';
    } catch(err) { body.innerHTML = '<tr><td colspan="5" class="admin-empty">Could not load messages.</td></tr>'; }
}
