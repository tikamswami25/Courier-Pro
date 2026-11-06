/* CourierPro - script.js
   Frontend only. Data lives in JS arrays and is saved in localStorage. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- Constants ----------
const ST = { pending: '📋 Pending', 'in-transit': '🔄 In Transit', 'out-for-delivery': '📍 Out for Delivery', delivered: '✅ Delivered', cancelled: '❌ Cancelled' };
const FLOW = ['pending', 'in-transit', 'out-for-delivery', 'delivered'];
const PAGES = [['dashboard', 'Dashboard', 'fa-chart-pie'], ['bookings', 'Bookings', 'fa-box'], ['track', 'Track Shipment', 'fa-location-dot'],
  ['personnel', 'Delivery Personnel', 'fa-motorcycle'], ['routes', 'Routes', 'fa-route'], ['billing', 'Billing & Invoices', 'fa-file-invoice'],
  ['customers', 'Customers', 'fa-users'], ['reports', 'Reports', 'fa-chart-line']];
const KEY = { personnel: 'name', routes: 'name', bookings: 'tracking' }; // value stored for dropdown references
const today = () => new Date().toISOString().slice(0, 10);

// Entity config: columns shown in table + form fields [key, label, type, options]
const E = {
  bookings: { label: 'Booking', cols: ['tracking', 'sender', 'receiver', 'weight', 'status', 'amount', 'date', 'personnel'],
    f: [['sender', 'Sender', 'text'], ['receiver', 'Receiver', 'text'], ['weight', 'Weight (kg)', 'number'], ['amount', 'Amount (₹)', 'number'],
      ['status', 'Status', 'select', ST], ['personnel', 'Delivery person', 'ref', 'personnel'], ['date', 'Date', 'date']] },
  personnel: { label: 'Delivery person', cols: ['name', 'contact', 'vehicle', 'route', 'status'],
    f: [['name', 'Name', 'text'], ['contact', 'Contact', 'text'], ['vehicle', 'Vehicle no.', 'text'], ['route', 'Assigned route', 'ref', 'routes'],
      ['status', 'Status', 'select', { Active: 'Active', 'On Leave': 'On Leave' }]] },
  routes: { label: 'Route', cols: ['name', 'stops', 'status'],
    f: [['name', 'Route name', 'text'], ['stops', 'Stops (comma separated)', 'text'],
      ['status', 'Status', 'select', { Planned: 'Planned', Active: 'Active', Completed: 'Completed' }]] },
  customers: { label: 'Customer', cols: ['name', 'email', 'phone', 'address', 'preferences'],
    f: [['name', 'Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text'], ['address', 'Address', 'text'], ['preferences', 'Preferences', 'text']] },
  invoices: { label: 'Invoice', cols: ['no', 'tracking', 'amount', 'status', 'date'],
    f: [['tracking', 'Booking', 'ref', 'bookings'], ['amount', 'Amount (₹)', 'number'],
      ['status', 'Status', 'select', { unpaid: 'Unpaid', paid: 'Paid' }], ['date', 'Date', 'date']] }
};

// ---------- Data (sample data + localStorage) ----------
const seed = () => ({
  customers: [
    { id: 1, name: 'John Smith', email: 'john@mail.com', phone: '+91 9811111111', address: 'Connaught Place, Delhi', preferences: 'Morning delivery' },
    { id: 2, name: 'Rajesh Kumar', email: 'rajesh@mail.com', phone: '+91 9822222222', address: 'C-Scheme, Jaipur', preferences: 'Call before delivery' },
    { id: 3, name: 'Sarah Johnson', email: 'sarah@mail.com', phone: '+91 9833333333', address: 'Koramangala, Bengaluru', preferences: 'Leave at reception' }],
  routes: [
    { id: 1, name: 'Route A', stops: 'Delhi, Gurugram, Noida', status: 'Active' },
    { id: 2, name: 'Route B', stops: 'Jaipur, Ajmer, Kota', status: 'Active' },
    { id: 3, name: 'Route C', stops: 'Bengaluru, Mysuru', status: 'Planned' }],
  personnel: [
    { id: 1, name: 'Rahul Sharma', contact: '+91 9876543210', vehicle: 'DL-01-AB-1234', route: 'Route A', status: 'Active' },
    { id: 2, name: 'Amit Verma', contact: '+91 9876500000', vehicle: 'RJ-14-CD-5678', route: 'Route B', status: 'Active' },
    { id: 3, name: 'Kiran Rao', contact: '+91 9876511111', vehicle: 'KA-01-EF-9012', route: 'Route C', status: 'On Leave' }],
  bookings: [
    { id: 1, tracking: 'CR-2026-001', sender: 'John Smith', receiver: 'Sarah Johnson', weight: 2.5, status: 'in-transit', amount: 250, date: '2026-06-25', personnel: 'Rahul Sharma' },
    { id: 2, tracking: 'CR-2026-002', sender: 'Amazon', receiver: 'Rajesh Kumar', weight: 1.2, status: 'delivered', amount: 150, date: '2026-06-24', personnel: 'Amit Verma' },
    { id: 3, tracking: 'CR-2026-003', sender: 'Flipkart', receiver: 'John Smith', weight: 4, status: 'pending', amount: 400, date: '2026-06-26', personnel: '' },
    { id: 4, tracking: 'CR-2026-004', sender: 'Sarah Johnson', receiver: 'Rajesh Kumar', weight: 0.8, status: 'out-for-delivery', amount: 120, date: '2026-06-26', personnel: 'Amit Verma' },
    { id: 5, tracking: 'CR-2026-005', sender: 'Myntra', receiver: 'Sarah Johnson', weight: 1.5, status: 'cancelled', amount: 180, date: '2026-06-23', personnel: '' }],
  invoices: [
    { id: 1, no: 'INV-001', tracking: 'CR-2026-001', amount: 250, status: 'unpaid', date: '2026-06-25' },
    { id: 2, no: 'INV-002', tracking: 'CR-2026-002', amount: 150, status: 'paid', date: '2026-06-24' }]
});
let db = JSON.parse(localStorage.getItem('cp_db') || 'null') || seed();
const save = () => localStorage.setItem('cp_db', JSON.stringify(db));

// ---------- Helpers ----------
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const badge = s => `<span class="badge ${s}">${ST[s] || s}</span>`;
const cell = (k, v) => k === 'status' ? badge(v) : k === 'amount' ? money(v) : (v ?? '');
const ENT = n => n === 'billing' ? 'invoices' : n;
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 3200); }
const notify = (b, s) => toast(`📩 SMS/Email sent to ${b.receiver}: ${ST[s]} (simulated)`);

// ---------- Navigation ----------
function build() {
  $('#nav').innerHTML = PAGES.map(p => `<li><a href="#${p[0]}" data-p="${p[0]}"><i class="fa-solid ${p[2]}"></i> ${p[1]}</a></li>`).join('');
  $('#pages').innerHTML = PAGES.map(p => `<section class="page" id="${p[0]}" hidden></section>`).join('');
}
function show() {
  const pg = PAGES.find(x => x[0] === location.hash.slice(1)) || PAGES[0];
  $$('.page').forEach(s => s.hidden = s.id !== pg[0]);
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.p === pg[0]));
  $('#title').textContent = pg[1];
  $('#sidebar').classList.remove('open');
  if (pg[0] === 'dashboard') dash(); else if (pg[0] === 'track') trackPage(); else if (pg[0] === 'reports') reports(); else listPage(pg[0]);
}

// ---------- Dashboard ----------
function dash() {
  const b = db.bookings, cnt = s => b.filter(x => x.status === s).length;
  const rev = b.filter(x => x.status !== 'cancelled').reduce((a, x) => a + x.amount, 0);
  const max = Math.max(1, ...Object.keys(ST).map(cnt));
  $('#dashboard').innerHTML = `<div class="stats">${[['📦', 'Total bookings', b.length], ['🔄', 'In transit', cnt('in-transit')], ['✅', 'Delivered', cnt('delivered')], ['💰', 'Revenue', money(rev)]]
    .map(([i, l, v]) => `<div class="card stat"><span>${i}</span><div><small>${l}</small><h3>${v}</h3></div></div>`).join('')}</div>
    <div class="grid2"><div class="card"><h3>Shipment volume by status</h3>${Object.keys(ST).map(s =>
      `<div class="barrow"><span>${ST[s]}</span><div class="bar-bg"><div class="fill" style="width:${cnt(s) / max * 100}%"></div></div><b>${cnt(s)}</b></div>`).join('')}</div>
    <div class="card"><h3>Recent bookings</h3><table>${b.slice(-5).reverse().map(x => `<tr><td>${x.tracking}</td><td>${x.receiver}</td><td>${badge(x.status)}</td></tr>`).join('')}</table></div></div>`;
}

// ---------- List pages (bookings, personnel, routes, billing, customers) ----------
function listPage(n) {
  const s = $('#' + n), e = ENT(n);
  if (!s.innerHTML) s.innerHTML = `<div class="toolbar"><input class="search" placeholder="🔍 Search...">
    ${e === 'bookings' ? `<select class="sf"><option value="">All statuses</option>${Object.entries(ST).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>` : ''}
    ${e === 'invoices' ? '<button class="btn alt" id="gen">⚡ Generate invoices</button>' : ''}
    <button class="btn" data-add="${e}">+ Add ${E[e].label.toLowerCase()}</button></div><div class="card tbl"><table></table></div>`;
  fillTable(n);
}
function fillTable(n) {
  const e = ENT(n), c = E[e], s = $('#' + n), q = $('.search', s).value.toLowerCase(), sf = $('.sf', s)?.value || '';
  const rows = db[e].filter(r => JSON.stringify(r).toLowerCase().includes(q) && (!sf || r.status === sf));
  $('table', s).innerHTML = `<tr>${c.cols.map(k => `<th>${k}</th>`).join('')}<th>Actions</th></tr>` +
    (rows.map(r => `<tr>${c.cols.map(k => `<td>${cell(k, r[k])}</td>`).join('')}<td class="act">
      ${e === 'invoices' ? `<button data-print="${r.id}" title="Print invoice">🖨</button>` : ''}
      ${e === 'bookings' ? `<button data-go="${r.tracking}" title="Track">📍</button>` : ''}
      <button data-edit="${e}:${r.id}" title="Edit">✏️</button><button data-del="${e}:${r.id}" title="Delete">🗑</button></td></tr>`).join('')
    || `<tr><td colspan="9" class="empty">No records yet. Use the Add button to create one.</td></tr>`);
}

// ---------- Add / Edit form ----------
function openForm(e, id) {
  const c = E[e], r = id ? db[e].find(x => x.id == id) : {}, f = $('#mForm');
  $('#mTitle').textContent = (id ? 'Edit ' : 'Add ') + c.label.toLowerCase();
  f.dataset.e = e; f.dataset.id = id || '';
  f.innerHTML = c.f.map(([k, l, t, o]) => {
    const v = r[k] ?? (t === 'date' ? today() : '');
    let inp;
    if (t === 'select') inp = `<select name="${k}">${Object.keys(o).map(x => `<option value="${x}" ${x == v ? 'selected' : ''}>${o[x]}</option>`).join('')}</select>`;
    else if (t === 'ref') inp = `<select name="${k}">${['', ...db[o].map(x => x[KEY[o]])].map(x => `<option value="${x}" ${x == v ? 'selected' : ''}>${x || '— none —'}</option>`).join('')}</select>`;
    else inp = `<input name="${k}" type="${t}" value="${v}" required ${t === 'number' ? 'min="0" step="any"' : ''}>`;
    return `<label>${l}${inp}</label>`;
  }).join('') + '<div class="row"><button type="button" class="btn alt" id="cancel">Cancel</button><button class="btn">Save</button></div>';
  $('#modal').hidden = false;
}
$('#mForm').onsubmit = ev => {
  ev.preventDefault();
  const f = ev.target, e = f.dataset.e, id = +f.dataset.id, d = Object.fromEntries(new FormData(f));
  E[e].f.forEach(([k, , t]) => { if (t === 'number') d[k] = +d[k]; });
  if (id) {
    const r = db[e].find(x => x.id === id);
    if (e === 'bookings' && r.status !== d.status) notify(r, d.status);
    Object.assign(r, d);
  } else {
    d.id = Math.max(0, ...db[e].map(x => x.id)) + 1;
    if (e === 'bookings') d.tracking = 'CR-2026-' + String(d.id).padStart(3, '0');
    if (e === 'invoices') d.no = 'INV-' + String(d.id).padStart(3, '0');
    db[e].push(d);
  }
  save(); $('#modal').hidden = true; show(); toast('Saved ✔');
};

// ---------- Tracking ----------
function trackPage(tn) {
  const s = $('#track');
  if (!s.innerHTML) s.innerHTML = '<div class="toolbar"><input id="tn" placeholder="Enter tracking number, e.g. CR-2026-001"><button class="btn" id="tbtn">Track</button></div><div id="tres"></div>';
  if (tn) { $('#tn').value = tn; doTrack(); }
}
function doTrack() {
  const b = db.bookings.find(x => x.tracking.toLowerCase() === $('#tn').value.trim().toLowerCase());
  if (!b) { $('#tres').innerHTML = '<div class="card empty">❌ No shipment found. Check the tracking number and try again.</div>'; return; }
  const i = FLOW.indexOf(b.status);
  $('#tres').innerHTML = `<div class="card"><h3>${b.tracking} ${badge(b.status)}</h3>
    <p>${b.sender} → ${b.receiver} · ${b.weight} kg · Courier: ${b.personnel || 'Not assigned yet'}</p>
    ${b.status === 'cancelled' ? '<p>This booking was cancelled.</p>' :
      `<div class="timeline">${FLOW.map((s, k) => `<div class="step ${k <= i ? 'done' : ''}"><i></i>${ST[s]}</div>`).join('')}</div>
      ${i < 3 ? `<button class="btn" data-adv="${b.id}">Simulate next update</button>` : ''}`}</div>`;
}

// ---------- Billing ----------
function printInv(id) {
  const i = db.invoices.find(x => x.id == id), b = db.bookings.find(x => x.tracking === i.tracking) || {};
  const w = open('', '_blank');
  w.document.write(`<body style="font-family:sans-serif;padding:30px"><h1 style="color:#E11D48">📬 CourierPro Invoice</h1><p><b>${i.no}</b> · ${i.date}</p>
    <p>Tracking: ${i.tracking}<br>From: ${b.sender || '-'}<br>To: ${b.receiver || '-'}<br>Weight: ${b.weight || '-'} kg</p>
    <h2>Total: ${money(i.amount)}</h2><p>Status: ${i.status.toUpperCase()}</p><script>print()<\/script></body>`);
  w.document.close();
}
function genInvoices() {
  let n = 0;
  db.bookings.filter(b => b.status !== 'cancelled' && !db.invoices.some(i => i.tracking === b.tracking)).forEach(b => {
    const id = Math.max(0, ...db.invoices.map(x => x.id)) + 1;
    db.invoices.push({ id, no: 'INV-' + String(id).padStart(3, '0'), tracking: b.tracking, amount: b.amount, status: b.status === 'delivered' ? 'paid' : 'unpaid', date: b.date }); n++;
  });
  save(); show(); toast(n ? `${n} invoice(s) generated` : 'All bookings already have invoices');
}

// ---------- Reports ----------
function reports() {
  const b = db.bookings, sum = a => money(a.reduce((t, x) => t + x.amount, 0));
  $('#reports').innerHTML = `<div class="toolbar"><button class="btn" id="csv">⬇ Export CSV</button><button class="btn alt" onclick="print()">🖨 Print / Save as PDF</button></div>
    <div class="grid2"><div class="card"><h3>Revenue by status</h3><table>${Object.keys(ST).map(s => `<tr><td>${ST[s]}</td><td>${b.filter(x => x.status === s).length} bookings</td><td>${sum(b.filter(x => x.status === s))}</td></tr>`).join('')}</table></div>
    <div class="card"><h3>Courier performance</h3><table>${db.personnel.map(p => `<tr><td>${p.name}</td><td>${b.filter(x => x.personnel === p.name && x.status === 'delivered').length} delivered</td><td>${b.filter(x => x.personnel === p.name).length} assigned</td></tr>`).join('')}</table></div></div>`;
}
function exportCSV() {
  const rows = [['Tracking', 'Sender', 'Receiver', 'Weight', 'Status', 'Amount', 'Date'], ...db.bookings.map(b => [b.tracking, b.sender, b.receiver, b.weight, b.status, b.amount, b.date])];
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }));
  a.download = 'bookings.csv'; a.click();
}

// ---------- Events ----------
document.addEventListener('click', ev => {
  const t = ev.target.closest('button'); if (!t) return;
  const d = t.dataset;
  if (d.add) openForm(d.add);
  else if (d.edit) openForm(...d.edit.split(':'));
  else if (d.del) { const [e, id] = d.del.split(':'); if (confirm('Delete this record?')) { db[e] = db[e].filter(x => x.id != id); save(); show(); } }
  else if (d.print) printInv(d.print);
  else if (d.go) { location.hash = 'track'; trackPage(d.go); }
  else if (d.adv) { const b = db.bookings.find(x => x.id == d.adv); b.status = FLOW[FLOW.indexOf(b.status) + 1]; save(); notify(b, b.status); doTrack(); }
  else if (t.id === 'cancel') $('#modal').hidden = true;
  else if (t.id === 'gen') genInvoices();
  else if (t.id === 'tbtn') doTrack();
  else if (t.id === 'csv') exportCSV();
  else if (t.id === 'menu') $('#sidebar').classList.toggle('open');
  else if (t.id === 'theme') { document.body.classList.toggle('dark'); localStorage.setItem('cp_dark', +document.body.classList.contains('dark')); }
  else if (t.id === 'logout') { localStorage.removeItem('cp_user'); location.hash = ''; location.reload(); }
});
document.addEventListener('input', ev => { if (ev.target.matches('.search,.sf')) fillTable(ev.target.closest('.page').id); });
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.id === 'tn') doTrack(); });
window.addEventListener('hashchange', () => !$('#app').hidden && show());

// ---------- Login / Register (simulated) ----------
let users = JSON.parse(localStorage.getItem('cp_users') || '[{"name":"Admin","email":"admin@courierpro.com","pass":"admin123"}]');
let mode = 'login';
$$('.tabs button').forEach(b => b.onclick = () => {
  mode = b.dataset.t;
  $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $('#aName').hidden = mode === 'login'; $('#aName').required = mode === 'register';
  $('#aBtn').textContent = mode === 'login' ? 'Login' : 'Create account';
});
$('#authForm').onsubmit = ev => {
  ev.preventDefault();
  const email = $('#aEmail').value.trim().toLowerCase(), pass = $('#aPass').value;
  if (mode === 'register') {
    if (users.some(u => u.email === email)) return toast('That email is already registered. Log in instead.');
    users.push({ name: $('#aName').value, email, pass }); localStorage.setItem('cp_users', JSON.stringify(users));
  }
  const u = users.find(x => x.email === email && x.pass === pass);
  if (!u) return toast('Wrong email or password.');
  localStorage.setItem('cp_user', u.name); startApp();
};
function startApp() {
  $('#auth').hidden = true; $('#app').hidden = false;
  $('#user').textContent = '👤 ' + localStorage.getItem('cp_user');
  show();
}

// ---------- Init ----------
if (+localStorage.getItem('cp_dark')) document.body.classList.add('dark');
build();
if (localStorage.getItem('cp_user')) startApp();
