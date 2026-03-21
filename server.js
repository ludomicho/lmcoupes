'use strict';

require('dotenv').config();

const express        = require('express');
const session        = require('express-session');
const FileStore      = require('session-file-store')(session);
const cors           = require('cors');
const path           = require('path');
const { DateTime }   = require('luxon');

const { getDb }               = require('./db');
const { createCalendarEvent, deleteCalendarEvent, getFreeBusySlots, testConnection, getAuthClient } = require('./google-calendar');
const { sendConfirmationEmail } = require('./email');
const { google }              = require('googleapis');

const app  = express();
const PORT = process.env.PORT || 3000;
const TIMEZONE = process.env.TIMEZONE || 'America/Toronto';

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new FileStore({ path: path.join(process.env.DATA_DIR || __dirname, 'sessions'), ttl: 28800, retries: 0, logFn: () => {} }),
    secret: process.env.SESSION_SECRET || 'lm-coupes-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

// ============================================================
// HELPERS
// ============================================================

/** "09:30" → 570 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/** 570 → "09:30" */
function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generate time slots every 30 minutes from startTime to (endTime - slotDuration).
 * E.g. start=09:00, end=19:00, duration=30 → ["09:00", "09:30", ..., "18:30"]
 */
function generateSlots(startTime, endTime, slotDuration) {
  const start  = timeToMinutes(startTime);
  const end    = timeToMinutes(endTime);
  const slots  = [];
  for (let t = start; t + slotDuration <= end; t += 30) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

/**
 * Check if a given slot (dateStr + timeStr + durationMin) overlaps with any GCal busy period.
 * busyPeriods: [{ start: ISO string, end: ISO string }, ...]
 */
function isSlotBusyInGCal(dateStr, timeStr, durationMin, busyPeriods) {
  const [hour, minute] = timeStr.split(':').map(Number);
  const slotStart = DateTime.fromISO(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`, { zone: TIMEZONE });
  const slotEnd   = slotStart.plus({ minutes: durationMin });

  return busyPeriods.some(period => {
    const busyStart = DateTime.fromISO(period.start, { zone: TIMEZONE });
    const busyEnd   = DateTime.fromISO(period.end,   { zone: TIMEZONE });
    // Overlap if slot starts before busy ends AND slot ends after busy starts
    return slotStart < busyEnd && slotEnd > busyStart;
  });
}

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
function requireAuth(req, res, next) {
  if (req.session && req.session.adminAuthenticated) {
    return next();
  }
  return res.status(401).json({ error: 'Non autorisé. Veuillez vous connecter.' });
}

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * GET /api/available-days
 * Returns the list of day-of-week indices that are closed (e.g. [0] for Sunday-only).
 */
app.get('/api/available-days', (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare('SELECT day_of_week FROM availability WHERE is_available = 0').all();
    const closedDays = rows.map(r => r.day_of_week);
    res.json({ closedDays });
  } catch (err) {
    console.error('[/api/available-days]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/slots?date=YYYY-MM-DD&duration=30
 * Returns available time slots for a given date and service duration.
 */
app.get('/api/slots', async (req, res) => {
  const { date, duration } = req.query;

  if (!date || !duration) {
    return res.status(400).json({ error: 'Paramètres manquants: date et duration sont requis.' });
  }

  const durationMin = parseInt(duration, 10);
  if (isNaN(durationMin) || durationMin < 1) {
    return res.status(400).json({ error: 'Duration invalide.' });
  }

  try {
    const db = getDb();

    // 1. Check blocked dates
    const blocked = db.prepare('SELECT reason FROM blocked_dates WHERE date = ?').get(date);
    if (blocked) {
      return res.json({
        available: false,
        slots: [],
        reason: blocked.reason || 'Journée bloquée.',
      });
    }

    // 2. Check availability by day_of_week
    const dayOfWeek = new Date(date + 'T12:00:00').getDay(); // use noon to avoid DST edge cases
    const avail = db.prepare('SELECT * FROM availability WHERE day_of_week = ?').get(dayOfWeek);

    if (!avail || !avail.is_available) {
      return res.json({
        available: false,
        slots: [],
        reason: 'Fermé ce jour.',
      });
    }

    // 3. Generate all possible slots
    let slots = generateSlots(avail.start_time, avail.end_time, durationMin);

    // 4. Remove slots already booked in DB
    // A slot is booked if there's a booking that starts at that time on that date
    // Also block slots that would overlap existing bookings
    const existingBookings = db.prepare(
      'SELECT time, duration FROM bookings WHERE date = ?'
    ).all(date);

    slots = slots.filter(slotTime => {
      const slotStart = timeToMinutes(slotTime);
      const slotEnd   = slotStart + durationMin;

      return !existingBookings.some(booking => {
        const bStart = timeToMinutes(booking.time);
        const bEnd   = bStart + booking.duration;
        // Overlap check
        return slotStart < bEnd && slotEnd > bStart;
      });
    });

    // 5. Optionally remove slots overlapping GCal freebusy periods
    try {
      const busyPeriods = await getFreeBusySlots(date);
      if (busyPeriods.length > 0) {
        slots = slots.filter(slotTime => !isSlotBusyInGCal(date, slotTime, durationMin, busyPeriods));
      }
    } catch (gcalErr) {
      // GCal not configured or unavailable — continue without it
      console.log('[/api/slots] GCal freebusy skipped:', gcalErr.message);
    }

    return res.json({ available: true, slots });
  } catch (err) {
    console.error('[/api/slots]', err);
    res.status(500).json({ error: 'Erreur serveur lors du chargement des créneaux.' });
  }
});

/**
 * POST /api/book
 * Create a new booking.
 */
app.post('/api/book', async (req, res) => {
  const { service, price, duration, date, time, firstName, lastName, email, phone, note } = req.body;

  console.log('[/api/book] received:', { service, price, priceType: typeof price, duration, date, time, firstName, lastName, email, phone });

  // Validation
  if (!service || price == null || !duration || !date || !time || !firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'Prix invalide.' });
  }

  const durationMin = parseInt(duration, 10);
  if (isNaN(durationMin)) {
    return res.status(400).json({ error: 'Durée invalide.' });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  // Date format check
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Format de date invalide.' });
  }

  // Time format check
  if (!/^\d{1,2}:\d{2}$/.test(time)) {
    return res.status(400).json({ error: 'Format d\'heure invalide.' });
  }

  try {
    const db = getDb();

    // Race-condition check: re-verify the slot is still free
    const blocked = db.prepare('SELECT id FROM blocked_dates WHERE date = ?').get(date);
    if (blocked) {
      return res.status(409).json({ error: 'Ce jour est bloqué. Veuillez choisir une autre date.' });
    }

    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    const avail = db.prepare('SELECT * FROM availability WHERE day_of_week = ?').get(dayOfWeek);
    if (!avail || !avail.is_available) {
      return res.status(409).json({ error: 'Le salon est fermé ce jour.' });
    }

    // Check for overlap with existing bookings
    const existingBookings = db.prepare('SELECT time, duration FROM bookings WHERE date = ?').all(date);
    const newStart = timeToMinutes(time);
    const newEnd   = newStart + durationMin;

    const hasOverlap = existingBookings.some(b => {
      const bStart = timeToMinutes(b.time);
      const bEnd   = bStart + b.duration;
      return newStart < bEnd && newEnd > bStart;
    });

    if (hasOverlap) {
      return res.status(409).json({ error: 'Ce créneau vient d\'être réservé. Veuillez en choisir un autre.' });
    }

    // Insert booking
    const insert = db.prepare(`
      INSERT INTO bookings (service, price, duration, date, time, first_name, last_name, email, phone, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result   = insert.run(service, parsedPrice, durationMin, date, time, firstName, lastName, email, phone, note || '');
    const bookingId = result.lastInsertRowid;

    // Best-effort: create Google Calendar event
    let googleEventId = null;
    try {
      googleEventId = await createCalendarEvent({
        service, date, time, duration: durationMin,
        firstName, lastName, email, phone, note: note || '',
      });
      db.prepare('UPDATE bookings SET google_event_id = ? WHERE id = ?').run(googleEventId, bookingId);
    } catch (gcalErr) {
      console.log('[/api/book] GCal event creation skipped:', gcalErr.message);
    }

    // Best-effort: send confirmation email
    try {
      await sendConfirmationEmail({
        firstName, lastName, email, service, date, time,
        duration: durationMin, price: parseFloat(price), note: note || '',
      });
    } catch (emailErr) {
      console.log('[/api/book] Email sending skipped:', emailErr.message);
    }

    return res.json({ success: true, bookingId });
  } catch (err) {
    console.error('[/api/book]', err);
    res.status(500).json({ error: 'Erreur serveur lors de la réservation.' });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

/** POST /api/admin/login */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré sur le serveur.' });
  }

  if (password === adminPassword) {
    req.session.adminAuthenticated = true;
    return res.json({ success: true });
  }

  return res.status(401).json({ error: 'Mot de passe incorrect.' });
});

/** POST /api/admin/logout */
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

/** GET /api/admin/check */
app.get('/api/admin/check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.adminAuthenticated) });
});

/** GET /api/admin/bookings[?date=YYYY-MM-DD] */
app.get('/api/admin/bookings', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { date } = req.query;

    let rows;
    if (date) {
      rows = db.prepare(
        'SELECT * FROM bookings WHERE date = ? ORDER BY time ASC'
      ).all(date);
    } else {
      rows = db.prepare(
        'SELECT * FROM bookings ORDER BY date DESC, time ASC LIMIT 200'
      ).all();
    }

    res.json({ bookings: rows });
  } catch (err) {
    console.error('[/api/admin/bookings]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/** DELETE /api/admin/bookings/:id */
app.delete('/api/admin/bookings/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalide.' });

  try {
    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable.' });

    // Delete GCal event (best-effort)
    if (booking.google_event_id) {
      try {
        await deleteCalendarEvent(booking.google_event_id);
      } catch (gcalErr) {
        console.log('[DELETE booking] GCal delete skipped:', gcalErr.message);
      }
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/bookings/:id]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/** GET /api/admin/availability */
app.get('/api/admin/availability', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const availability = db.prepare('SELECT * FROM availability ORDER BY day_of_week ASC').all();
    const blockedDates = db.prepare('SELECT * FROM blocked_dates ORDER BY date ASC').all();
    res.json({ availability, blockedDates });
  } catch (err) {
    console.error('[/api/admin/availability]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/** PUT /api/admin/availability */
app.put('/api/admin/availability', requireAuth, (req, res) => {
  const { availability } = req.body;
  if (!Array.isArray(availability)) {
    return res.status(400).json({ error: 'Format invalide.' });
  }

  try {
    const db = getDb();
    const update = db.prepare(
      'UPDATE availability SET is_available = ?, start_time = ?, end_time = ? WHERE day_of_week = ?'
    );

    const updateAll = db.transaction(() => {
      for (const row of availability) {
        const { day_of_week, is_available, start_time, end_time } = row;
        if (day_of_week === undefined) continue;
        update.run(
          is_available ? 1 : 0,
          start_time || '09:00',
          end_time   || '19:00',
          day_of_week
        );
      }
    });

    updateAll();
    res.json({ success: true });
  } catch (err) {
    console.error('[PUT /api/admin/availability]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/** POST /api/admin/blocked-dates */
app.post('/api/admin/blocked-dates', requireAuth, (req, res) => {
  const { date, reason } = req.body;
  if (!date) return res.status(400).json({ error: 'Date requise.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Format de date invalide (YYYY-MM-DD).' });
  }

  try {
    const db = getDb();
    db.prepare(
      'INSERT OR REPLACE INTO blocked_dates (date, reason) VALUES (?, ?)'
    ).run(date, reason || '');
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/admin/blocked-dates]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/** DELETE /api/admin/blocked-dates/:date */
app.delete('/api/admin/blocked-dates/:date', requireAuth, (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Format de date invalide.' });
  }

  try {
    const db = getDb();
    db.prepare('DELETE FROM blocked_dates WHERE date = ?').run(date);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/blocked-dates/:date]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/** GET /api/admin/test-gcal */
app.get('/api/admin/test-gcal', requireAuth, async (req, res) => {
  try {
    const result = await testConnection();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ============================================================
// GOOGLE OAUTH SETUP ROUTES
// ============================================================

/** GET /setup-gcal — redirect to Google OAuth consent screen */
app.get('/setup-gcal', (req, res) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).send(
      '<h2>Erreur</h2><p>GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET doivent être définis dans .env</p>'
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback'
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });

  res.redirect(url);
});

/** GET /oauth/callback — exchange code for refresh token */
app.get('/oauth/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send(`<h2>Erreur OAuth</h2><p>${error}</p>`);
  }
  if (!code) {
    return res.status(400).send('<h2>Erreur</h2><p>Code OAuth manquant.</p>');
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).send('<h2>Erreur</h2><p>Credentials Google manquants.</p>');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback'
    );

    const { tokens } = await oauth2Client.getToken(code);

    const refreshToken = tokens.refresh_token;

    res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Google Calendar — Token obtenu</title>
        <style>
          body { font-family: monospace; background: #111; color: #eee; padding: 40px; }
          h2 { color: #c0392b; }
          .token-box {
            background: #1e1e1e;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 20px;
            word-break: break-all;
            color: #c8a96e;
            font-size: 14px;
            margin: 16px 0;
          }
          code { color: #c8a96e; }
          .step { margin: 12px 0; }
        </style>
      </head>
      <body>
        <h2>✅ Autorisation réussie!</h2>
        <p>Voici votre <strong>refresh token</strong> Google Calendar :</p>
        <div class="token-box">${refreshToken || '(aucun refresh token — réessayez avec prompt=consent)'}</div>
        <div class="step">
          <strong>Étape suivante :</strong><br>
          Ajoutez cette ligne à votre fichier <code>.env</code> :
        </div>
        <div class="token-box">GOOGLE_REFRESH_TOKEN=${refreshToken || 'VOTRE_TOKEN_ICI'}</div>
        <p>Redémarrez ensuite le serveur avec <code>npm start</code>.</p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[/oauth/callback]', err);
    res.status(500).send(`<h2>Erreur</h2><p>${err.message}</p>`);
  }
});

// ============================================================
// STATIC FILES + PAGE ROUTES
// ============================================================

// Serve only the safe public assets (CSS, JS, images, fonts)
// — never exposes .env, server.js, db.js, etc.
const PUBLIC_FILES = ['styles.css', 'script.js', 'admin.css', 'admin.js'];
PUBLIC_FILES.forEach(file => {
  app.get(`/${file}`, (req, res) => {
    res.sendFile(path.join(__dirname, file));
  });
});

// Serve image/font directories if they exist
app.use('/images',  express.static(path.join(__dirname, 'images')));
app.use('/fonts',   express.static(path.join(__dirname, 'fonts')));
app.use('/assets',  express.static(path.join(__dirname, 'assets')));

// Public homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  console.log(`\n✂  LM Coupes server running on http://localhost:${PORT}`);
  console.log(`   Admin panel : http://localhost:${PORT}/admin`);
  console.log(`   GCal setup  : http://localhost:${PORT}/setup-gcal\n`);
});
