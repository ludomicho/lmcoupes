'use strict';

/* ============================================================
   LM COUPES — Admin Panel JavaScript
   Data: localStorage + Google Calendar API (browser-side)
   ============================================================ */

const ADMIN_PASSWORD = 'Sturbain1234';
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIMEZONE = 'America/Toronto';
const CALENDAR_ID = 'primary';
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let tokenClient = null;
let gapiInited = false;
let gisInited = false;

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================
function getBookings() {
  return JSON.parse(localStorage.getItem('lm_bookings') || '[]');
}
function saveBookingsData(bookings) {
  localStorage.setItem('lm_bookings', JSON.stringify(bookings));
}
function getAvailabilityData() {
  const stored = localStorage.getItem('lm_availability');
  if (stored) return JSON.parse(stored);
  return [0,1,2,3,4,5,6].map(d => ({
    day_of_week: d,
    is_available: d !== 0 ? 1 : 0,
    start_time: '09:00',
    end_time: '19:00',
  }));
}
function saveAvailabilityToStorage(availability) {
  localStorage.setItem('lm_availability', JSON.stringify(availability));
}
function getBlockedDates() {
  return JSON.parse(localStorage.getItem('lm_blocked_dates') || '[]');
}
function saveBlockedDatesData(dates) {
  localStorage.setItem('lm_blocked_dates', JSON.stringify(dates));
}
function getGoogleClientId() {
  return localStorage.getItem('lm_gcal_client_id') || '';
}
function saveGoogleClientId(id) {
  localStorage.setItem('lm_gcal_client_id', id);
}

// ============================================================
// INIT
// ============================================================
function init() {
  if (sessionStorage.getItem('lm_admin_auth') === 'true') {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').removeAttribute('hidden');
  document.getElementById('adminApp').setAttribute('hidden', '');
}

function showDashboard() {
  document.getElementById('loginScreen').setAttribute('hidden', '');
  document.getElementById('adminApp').removeAttribute('hidden');
  switchTab('bookings');
  updateGcalUI();
  maybeInitGapi();
}

// ============================================================
// LOGIN / LOGOUT
// ============================================================
function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('loginError');
  errorEl.hidden = true;

  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('lm_admin_auth', 'true');
    showDashboard();
  } else {
    errorEl.textContent = 'Mot de passe incorrect.';
    errorEl.hidden = false;
  }
}

function handleLogout() {
  sessionStorage.removeItem('lm_admin_auth');
  try {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2
        && typeof gapi !== 'undefined' && gapi.client) {
      const token = gapi.client.getToken();
      if (token) google.accounts.oauth2.revoke(token.access_token);
    }
  } catch(_){}
  showLogin();
  document.getElementById('adminPassword').value = '';
}

// ============================================================
// MOBILE SIDEBAR TOGGLE
// ============================================================
function toggleMobileSidebar() {
  document.querySelector('.sidebar').classList.toggle('sidebar-open');
  document.querySelector('.sidebar-overlay').classList.toggle('visible');
}
function closeMobileSidebar() {
  document.querySelector('.sidebar').classList.remove('sidebar-open');
  document.querySelector('.sidebar-overlay').classList.remove('visible');
}

// ============================================================
// TAB NAVIGATION
// ============================================================
function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
  closeMobileSidebar();

  if (tabName === 'bookings') {
    const df = document.getElementById('dateFilter');
    loadBookings(df && df.value ? df.value : undefined);
  }
  if (tabName === 'availability') loadAvailability();
  if (tabName === 'blocked') loadBlockedDatesUI();
  if (tabName === 'settings') updateGcalUI();
}

// ============================================================
// BOOKINGS (localStorage + Google Calendar sync)
// ============================================================
function loadBookings(date) {
  const list = document.getElementById('bookingsList');
  let bookings = getBookings();

  bookings.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    return cmp !== 0 ? cmp : a.time.localeCompare(b.time);
  });

  updateStats(bookings);

  if (date) {
    bookings = bookings.filter(b => b.date === date);
  }

  if (bookings.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📋</span>
        <p>${date ? 'Aucune réservation ce jour.' : 'Aucune réservation enregistrée.'}</p>
      </div>`;
    return;
  }

  list.innerHTML = bookings.map(renderBookingCard).join('');
}

function renderBookingCard(booking) {
  const initials = ((booking.first_name || '?')[0] + (booking.last_name || '?')[0]).toUpperCase();
  const isCombo = (booking.service || '').toLowerCase().includes('barbe');
  const badgeClass = isCombo ? 'badge-combo' : 'badge-coupe';

  const [year, month, day] = booking.date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dateStr = dateObj.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const noteHtml = booking.note
    ? `<div class="booking-note">📝 ${escapeHtml(booking.note)}</div>` : '';

  const gcalIcon = booking.google_event_id
    ? '<span title="Google Calendar" style="color:#27ae60">📅</span>' : '';

  return `
    <div class="booking-card">
      <div class="booking-avatar">${initials}</div>
      <div class="booking-info">
        <div class="booking-client">${escapeHtml(booking.first_name)} ${escapeHtml(booking.last_name)} ${gcalIcon}</div>
        <div class="booking-meta">
          <span class="badge ${badgeClass}">${escapeHtml(booking.service)}</span>
          <span class="booking-datetime">📅 ${dateStr} · ⏰ ${booking.time} · ${booking.duration} min</span>
        </div>
        <div class="booking-contact">
          📧 ${escapeHtml(booking.email)} · 📞 ${escapeHtml(booking.phone)}
          · <span style="color:var(--gold)">${booking.price}$</span>
        </div>
        ${noteHtml}
      </div>
      <div class="booking-actions">
        <button class="btn-cancel-booking" onclick="cancelBooking(${booking.id})">Annuler</button>
      </div>
    </div>`;
}

async function cancelBooking(id) {
  if (!confirm('Annuler cette réservation? Cette action est irréversible.')) return;

  const bookings = getBookings();
  const booking = bookings.find(b => b.id === id);

  // Delete from Google Calendar if synced
  if (booking && booking.google_event_id && isGcalReady()) {
    try {
      await gapi.client.calendar.events.delete({
        calendarId: CALENDAR_ID,
        eventId: booking.google_event_id,
      });
    } catch (_) { /* event may already be deleted */ }
  }

  const updated = bookings.filter(b => b.id !== id);
  saveBookingsData(updated);

  const dateFilter = document.getElementById('dateFilter').value;
  loadBookings(dateFilter || undefined);
}

function updateStats(bookings) {
  const now = new Date();
  const todayStr = toLocalDateString(now);
  const dayOfWeek = now.getDay();
  const diffToMon = (dayOfWeek + 6) % 7;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMon);

  let todayCount = 0, weekCount = 0;
  (bookings || []).forEach(b => {
    if (b.date === todayStr) todayCount++;
    const [y, m, d] = b.date.split('-').map(Number);
    const bDate = new Date(y, m - 1, d);
    if (bDate >= weekStart && bDate <= now) weekCount++;
  });

  document.getElementById('statToday').textContent = todayCount;
  document.getElementById('statWeek').textContent = weekCount;
  document.getElementById('statTotal').textContent = (bookings || []).length;
}

// ============================================================
// AVAILABILITY (localStorage)
// ============================================================
function loadAvailability() {
  const grid = document.getElementById('availabilityGrid');
  if (!grid) return;
  const availability = getAvailabilityData();
  renderAvailabilityGrid(availability);
}

function renderAvailabilityGrid(availability) {
  const grid = document.getElementById('availabilityGrid');
  if (!grid) return;
  const sorted = [...availability].sort((a, b) => a.day_of_week - b.day_of_week);

  grid.innerHTML = sorted.map(row => {
    const dayName = DAY_NAMES[row.day_of_week];
    const isOpen = !!row.is_available;
    return `
      <div class="availability-row ${isOpen ? '' : 'is-closed'}" id="avail-row-${row.day_of_week}">
        <div class="avail-day">${dayName}</div>
        <div class="toggle-wrap">
          <input type="checkbox" class="toggle-input" id="toggle-${row.day_of_week}"
            data-day="${row.day_of_week}" ${isOpen ? 'checked' : ''}
            onchange="onAvailToggle(${row.day_of_week})" />
          <label class="toggle-track" for="toggle-${row.day_of_week}"></label>
        </div>
        <div class="avail-status ${isOpen ? 'open' : ''}" id="avail-status-${row.day_of_week}">
          ${isOpen ? 'Ouvert' : 'Fermé'}
        </div>
        <div class="avail-times">
          <input type="time" class="avail-time-input" id="start-${row.day_of_week}"
            value="${row.start_time}" ${isOpen ? '' : 'disabled'} />
          <span class="avail-separator">→</span>
          <input type="time" class="avail-time-input" id="end-${row.day_of_week}"
            value="${row.end_time}" ${isOpen ? '' : 'disabled'} />
        </div>
      </div>`;
  }).join('');
}

function onAvailToggle(dayOfWeek) {
  const checkbox = document.getElementById(`toggle-${dayOfWeek}`);
  const row = document.getElementById(`avail-row-${dayOfWeek}`);
  const statusEl = document.getElementById(`avail-status-${dayOfWeek}`);
  const startInput = document.getElementById(`start-${dayOfWeek}`);
  const endInput = document.getElementById(`end-${dayOfWeek}`);
  const isOpen = checkbox.checked;
  row.classList.toggle('is-closed', !isOpen);
  statusEl.textContent = isOpen ? 'Ouvert' : 'Fermé';
  statusEl.className = `avail-status ${isOpen ? 'open' : ''}`;
  startInput.disabled = !isOpen;
  endInput.disabled = !isOpen;
}

function saveAvailability() {
  const btn = document.getElementById('saveAvailabilityBtn');
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = '...';

  const availability = [];
  for (let d = 0; d < 7; d++) {
    const checkbox = document.getElementById(`toggle-${d}`);
    const start = document.getElementById(`start-${d}`);
    const end = document.getElementById(`end-${d}`);
    if (!checkbox) continue;
    availability.push({
      day_of_week: d,
      is_available: checkbox.checked ? 1 : 0,
      start_time: start ? start.value : '09:00',
      end_time: end ? end.value : '19:00',
    });
  }

  saveAvailabilityToStorage(availability);

  btn.textContent = '✓ Enregistré';
  btn.style.background = '#27ae60';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    btn.disabled = false;
  }, 2000);
}

// ============================================================
// BLOCKED DATES (localStorage + Google Calendar sync)
// ============================================================
function loadBlockedDatesUI() {
  const list = document.getElementById('blockedList');
  if (!list) return;
  const blocked = getBlockedDates();

  if (blocked.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🗓</span>
        <p>Aucune date bloquée.</p>
      </div>`;
    return;
  }

  list.innerHTML = blocked.map(item => {
    const [year, month, day] = item.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dateStr = dateObj.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `
      <div class="blocked-item">
        <div>
          <div class="blocked-date">🚫 ${dateStr}</div>
          ${item.reason ? `<div class="blocked-reason">${escapeHtml(item.reason)}</div>` : ''}
        </div>
        <button class="btn-remove-blocked" onclick="removeBlockedDate('${item.date}')">Supprimer</button>
      </div>`;
  }).join('');
}

async function addBlockedDate() {
  const dateInput = document.getElementById('blockedDateInput');
  const reasonInput = document.getElementById('blockedReasonInput');
  const errorEl = document.getElementById('blockedError');
  const btn = document.getElementById('addBlockedBtn');
  errorEl.hidden = true;

  const date = dateInput.value.trim();
  const reason = reasonInput.value.trim();
  if (!date) {
    errorEl.textContent = 'Veuillez sélectionner une date.';
    errorEl.hidden = false;
    return;
  }

  btn.disabled = true;
  btn.textContent = '...';

  const blocked = getBlockedDates();
  if (blocked.find(b => b.date === date)) {
    errorEl.textContent = 'Cette date est déjà bloquée.';
    errorEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Bloquer ce jour';
    return;
  }

  const entry = { date, reason, google_event_id: null };

  // Sync to Google Calendar
  if (isGcalReady()) {
    try {
      const res = await gapi.client.calendar.events.insert({
        calendarId: CALENDAR_ID,
        resource: {
          summary: `🚫 LM Coupes — FERMÉ${reason ? ' — ' + reason : ''}`,
          start: { date },
          end: { date },
          colorId: '11',
          description: `Jour bloqué dans LM Coupes Admin.\n${reason ? 'Raison: ' + reason : ''}`,
        },
      });
      entry.google_event_id = res.result.id;
    } catch (err) {
      console.warn('GCal sync failed for blocked date:', err);
    }
  }

  blocked.push(entry);
  blocked.sort((a, b) => a.date.localeCompare(b.date));
  saveBlockedDatesData(blocked);

  dateInput.value = '';
  reasonInput.value = '';
  btn.disabled = false;
  btn.textContent = 'Bloquer ce jour';
  loadBlockedDatesUI();
}

async function removeBlockedDate(date) {
  if (!confirm(`Débloquer le ${date}?`)) return;

  const blocked = getBlockedDates();
  const entry = blocked.find(b => b.date === date);

  if (entry && entry.google_event_id && isGcalReady()) {
    try {
      await gapi.client.calendar.events.delete({
        calendarId: CALENDAR_ID,
        eventId: entry.google_event_id,
      });
    } catch (_) {}
  }

  saveBlockedDatesData(blocked.filter(b => b.date !== date));
  loadBlockedDatesUI();
}

// ============================================================
// GOOGLE CALENDAR API (Browser-side OAuth2)
// ============================================================
function isGcalReady() {
  return gapiInited && typeof gapi !== 'undefined' && gapi.client && gapi.client.getToken() !== null;
}

function gapiAvailable() {
  return typeof gapi !== 'undefined';
}

function gisAvailable() {
  return typeof google !== 'undefined' && google.accounts && google.accounts.oauth2;
}

// Called on dashboard load — silently pre-init gapi if client ID already saved
function maybeInitGapi() {
  const clientId = getGoogleClientId();
  if (!clientId) return;

  if (gapiAvailable() && !gapiInited) {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
      } catch (err) {
        console.error('GAPI init error:', err);
      }
    });
  }
}

// Main connect flow — called when button is clicked
function connectGcal() {
  const clientIdInput = document.getElementById('gcalClientId');
  const clientId = (clientIdInput ? clientIdInput.value.trim() : '') || getGoogleClientId();

  if (!clientId) {
    showGcalStatus('error', 'Entrez votre Google Client ID d\'abord.');
    return;
  }

  if (!clientId.includes('.apps.googleusercontent.com')) {
    showGcalStatus('error', 'Client ID invalide. Il doit finir par .apps.googleusercontent.com');
    return;
  }

  // Google OAuth requires http:// or https:// — won't work from file://
  if (location.protocol === 'file:') {
    showGcalStatus('error', 'Google Calendar ne fonctionne pas en ouvrant le fichier directement. Le site doit être hébergé (GitHub Pages, Netlify, ou localhost).');
    return;
  }

  saveGoogleClientId(clientId);

  // Check that both Google scripts are loaded
  if (!gapiAvailable()) {
    showGcalStatus('error', 'Google API en cours de chargement... Réessayez dans quelques secondes.');
    return;
  }
  if (!gisAvailable()) {
    showGcalStatus('error', 'Google Identity Services en cours de chargement... Réessayez dans quelques secondes.');
    return;
  }

  showGcalStatus('', '');
  const connectBtn = document.getElementById('connectGcalBtn');
  if (connectBtn) {
    connectBtn.disabled = true;
    connectBtn.textContent = '⏳ Connexion...';
  }

  // Safety timeout — if nothing happens in 15s, reset the button
  const safetyTimer = setTimeout(() => {
    showGcalStatus('error', 'Délai dépassé. Vérifiez votre Client ID et que les popups ne sont pas bloqués.');
    resetConnectBtn();
  }, 15000);

  // Step 1: init gapi client if not done
  if (!gapiInited) {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
        requestGcalAccess(clientId, safetyTimer);
      } catch (err) {
        clearTimeout(safetyTimer);
        showGcalStatus('error', 'Erreur initialisation Google API: ' + (err.message || JSON.stringify(err)));
        resetConnectBtn();
      }
    });
  } else {
    requestGcalAccess(clientId, safetyTimer);
  }
}

// Step 2: open Google OAuth popup
function requestGcalAccess(clientId, safetyTimer) {
  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        clearTimeout(safetyTimer);
        if (resp.error) {
          showGcalStatus('error', 'Erreur OAuth: ' + (resp.error_description || resp.error));
          resetConnectBtn();
          return;
        }
        // Success — we have a token
        showGcalStatus('success', '✅ Connecté à Google Calendar!');
        updateGcalUI();
        resetConnectBtn();
        syncAllToGcal();
      },
      error_callback: (err) => {
        clearTimeout(safetyTimer);
        // User closed popup or other error
        showGcalStatus('error', 'Connexion annulée ou erreur: ' + (err.message || err.type || 'popup fermé'));
        resetConnectBtn();
      },
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (err) {
    clearTimeout(safetyTimer);
    showGcalStatus('error', 'Erreur: ' + err.message);
    resetConnectBtn();
  }
}

function resetConnectBtn() {
  const btn = document.getElementById('connectGcalBtn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = '🔌 Connecter Google Calendar';
  }
}

function disconnectGcal() {
  try {
    if (gapiAvailable() && gapi.client) {
      const token = gapi.client.getToken();
      if (token && gisAvailable()) {
        google.accounts.oauth2.revoke(token.access_token);
      }
      gapi.client.setToken(null);
    }
  } catch(_) {}
  updateGcalUI();
  showGcalStatus('success', 'Déconnecté de Google Calendar.');
  setTimeout(() => showGcalStatus('', ''), 3000);
}

function updateGcalUI() {
  const connected = isGcalReady();
  const statusEl = document.getElementById('gcalConnectionStatus');
  const connectBtn = document.getElementById('connectGcalBtn');
  const disconnectBtn = document.getElementById('disconnectGcalBtn');
  const clientIdInput = document.getElementById('gcalClientId');

  if (statusEl) {
    statusEl.textContent = connected ? '🟢 Connecté' : '🔴 Non connecté';
    statusEl.className = 'gcal-conn-status ' + (connected ? 'connected' : '');
  }
  if (connectBtn) connectBtn.style.display = connected ? 'none' : '';
  if (disconnectBtn) disconnectBtn.style.display = connected ? '' : 'none';
  if (clientIdInput) {
    clientIdInput.value = getGoogleClientId();
    clientIdInput.disabled = connected;
  }
}

function showGcalStatus(type, msg) {
  const el = document.getElementById('gcalStatus');
  if (!el) return;
  if (!msg) { el.hidden = true; return; }
  el.hidden = false;
  el.className = 'gcal-status ' + type;
  el.textContent = msg;
}

// Sync existing bookings that don't have a google_event_id
async function syncAllToGcal() {
  if (!isGcalReady()) return;
  const bookings = getBookings();
  let changed = false;

  for (const b of bookings) {
    if (b.google_event_id) continue;
    try {
      const eventId = await createGcalEvent(b);
      if (eventId) {
        b.google_event_id = eventId;
        changed = true;
      }
    } catch (err) {
      console.warn('Failed to sync booking to GCal:', err);
    }
  }

  if (changed) {
    saveBookingsData(bookings);
    const df = document.getElementById('dateFilter');
    loadBookings(df && df.value ? df.value : undefined);
  }

  // Sync blocked dates too
  const blocked = getBlockedDates();
  let blockedChanged = false;
  for (const bd of blocked) {
    if (bd.google_event_id) continue;
    try {
      const res = await gapi.client.calendar.events.insert({
        calendarId: CALENDAR_ID,
        resource: {
          summary: `🚫 LM Coupes — FERMÉ${bd.reason ? ' — ' + bd.reason : ''}`,
          start: { date: bd.date },
          end: { date: bd.date },
          colorId: '11',
        },
      });
      bd.google_event_id = res.result.id;
      blockedChanged = true;
    } catch (_) {}
  }
  if (blockedChanged) saveBlockedDatesData(blocked);
}

async function createGcalEvent(booking) {
  if (!isGcalReady()) return null;

  const [h, m] = booking.time.split(':').map(Number);
  const startDt = new Date(
    ...booking.date.split('-').map((v, i) => i === 1 ? Number(v) - 1 : Number(v)),
    h, m, 0
  );
  const endDt = new Date(startDt.getTime() + booking.duration * 60000);

  const pad = n => String(n).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

  const res = await gapi.client.calendar.events.insert({
    calendarId: CALENDAR_ID,
    resource: {
      summary: `✂ ${booking.service} — ${booking.first_name} ${booking.last_name}`,
      location: '4815 rue Saint-Urbain, sous-sol, H2T 2W1, Montréal',
      description: [
        `Service: ${booking.service}`,
        `Client: ${booking.first_name} ${booking.last_name}`,
        `Email: ${booking.email}`,
        `Tél: ${booking.phone}`,
        `Prix: ${booking.price}$`,
        `Durée: ${booking.duration} min`,
        booking.note ? `Note: ${booking.note}` : '',
      ].filter(Boolean).join('\n'),
      colorId: '11',
      start: { dateTime: toISO(startDt), timeZone: TIMEZONE },
      end: { dateTime: toISO(endDt), timeZone: TIMEZONE },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 1440 },
          { method: 'popup', minutes: 60 },
        ],
      },
    },
  });
  return res.result.id;
}

// ============================================================
// UTILITIES
// ============================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================================================
// EVENT LISTENERS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Mobile hamburger
  const hamburger = document.getElementById('adminHamburger');
  if (hamburger) hamburger.addEventListener('click', toggleMobileSidebar);
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Date filter
  const dateFilter = document.getElementById('dateFilter');
  if (dateFilter) {
    dateFilter.value = toLocalDateString(new Date());
    dateFilter.addEventListener('change', () => {
      loadBookings(dateFilter.value || undefined);
    });
  }

  const showAllBtn = document.getElementById('showAllBtn');
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      if (dateFilter) dateFilter.value = '';
      loadBookings();
    });
  }

  const saveBtn = document.getElementById('saveAvailabilityBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveAvailability);

  const addBlockedBtn = document.getElementById('addBlockedBtn');
  if (addBlockedBtn) addBlockedBtn.addEventListener('click', addBlockedDate);

  const connectBtn = document.getElementById('connectGcalBtn');
  if (connectBtn) connectBtn.addEventListener('click', connectGcal);

  const disconnectBtn = document.getElementById('disconnectGcalBtn');
  if (disconnectBtn) disconnectBtn.addEventListener('click', disconnectGcal);

  init();
});
