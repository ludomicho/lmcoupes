'use strict';

require('dotenv').config();

const express        = require('express');
const session        = require('express-session');
const FileStore      = require('session-file-store')(session);
const cors           = require('cors');
const path           = require('path');
const crypto         = require('crypto');
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
 * GET /api/slots?date=YYYY-MM-DD&duration=30&service=Coupe+Barbe
 * Returns available time slots for a given date and service duration.
 * For "Coupe + Barbe" (doubleSlot=true): only returns slots where BOTH
 * the slot AND the immediately following 30-min slot are free.
 */
app.get('/api/slots', async (req, res) => {
  const { date, duration, service } = req.query;

  if (!date || !duration) {
    return res.status(400).json({ error: 'Paramètres manquants: date et duration sont requis.' });
  }

  const durationMin  = parseInt(duration, 10);
  const doubleSlot   = (service === 'Coupe + Barbe'); // needs two consecutive 30-min slots
  const slotDuration = doubleSlot ? 30 : durationMin; // always generate 30-min grid

  if (isNaN(durationMin) || durationMin < 1) {
    return res.status(400).json({ error: 'Duration invalide.' });
  }

  try {
    const db = getDb();

    // 1. Check blocked dates
    const blocked = db.prepare('SELECT reason FROM blocked_dates WHERE date = ?').get(date);
    if (blocked) {
      return res.json({ available: false, slots: [], reason: blocked.reason || 'Journée bloquée.' });
    }

    // 2. Check availability by day_of_week
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    const avail = db.prepare('SELECT * FROM availability WHERE day_of_week = ?').get(dayOfWeek);
    if (!avail || !avail.is_available) {
      return res.json({ available: false, slots: [], reason: 'Fermé ce jour.' });
    }

    // 3. Generate all 30-min slots for the day
    let allSlots = generateSlots(avail.start_time, avail.end_time, 30);

    // 4. Build a Set of busy slot times (from DB bookings)
    const existingBookings = db.prepare('SELECT time, duration FROM bookings WHERE date = ?').all(date);
    const isSlotBusyInDb = (slotTime) => {
      const slotStart = timeToMinutes(slotTime);
      const slotEnd   = slotStart + 30;
      return existingBookings.some(b => {
        const bStart = timeToMinutes(b.time);
        const bEnd   = bStart + b.duration;
        return slotStart < bEnd && slotEnd > bStart;
      });
    };

    // 5. Optionally fetch GCal busy periods
    let busyPeriods = [];
    try {
      busyPeriods = await getFreeBusySlots(date);
    } catch (gcalErr) {
      console.log('[/api/slots] GCal freebusy skipped:', gcalErr.message);
    }

    const isSlotFree = (slotTime) => {
      if (isSlotBusyInDb(slotTime)) return false;
      if (busyPeriods.length > 0 && isSlotBusyInGCal(date, slotTime, 30, busyPeriods)) return false;
      return true;
    };

    // 6. Filter slots based on service requirements
    let slots;
    if (doubleSlot) {
      // For Coupe + Barbe: only keep slots where THIS slot AND the next are both free
      slots = allSlots.filter((slotTime, i) => {
        const nextSlot = allSlots[i + 1];
        if (!nextSlot) return false; // no next slot exists (last slot of day)
        // Next slot must be exactly 30 min later (consecutive, no gap)
        const thisMin = timeToMinutes(slotTime);
        const nextMin = timeToMinutes(nextSlot);
        if (nextMin !== thisMin + 30) return false;
        return isSlotFree(slotTime) && isSlotFree(nextSlot);
      });
    } else {
      // Single slot: just check that the slot itself is free
      slots = allSlots.filter(slotTime => {
        const slotStart = timeToMinutes(slotTime);
        const slotEnd   = slotStart + durationMin;
        // For slots longer than 30 min, check all 30-min windows within
        for (let t = slotStart; t < slotEnd; t += 30) {
          if (!isSlotFree(minutesToTime(t))) return false;
        }
        return true;
      });
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

    // For Coupe + Barbe: duration is always 30 min per slot, book two consecutive slots
    const doubleSlot   = (service === 'Coupe + Barbe');
    const slotDuration = doubleSlot ? 30 : durationMin;

    // If double-slot: verify the next 30-min slot is also still free (race-condition check)
    if (doubleSlot) {
      const nextMins  = timeToMinutes(time) + 30;
      const nextTime  = minutesToTime(nextMins);
      const nextStart = nextMins;
      const nextEnd   = nextMins + 30;
      const nextOverlap = existingBookings.some(b => {
        const bStart = timeToMinutes(b.time);
        const bEnd   = bStart + b.duration;
        return nextStart < bEnd && nextEnd > bStart;
      });
      if (nextOverlap) {
        return res.status(409).json({ error: 'Le créneau suivant (nécessaire pour Coupe + Barbe) vient d\'être réservé. Veuillez choisir un autre horaire.' });
      }
    }

    const insert = db.prepare(`
      INSERT INTO bookings (service, price, duration, date, time, first_name, last_name, email, phone, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Insert first (or only) slot
    const result    = insert.run(service, parsedPrice, slotDuration, date, time, firstName, lastName, email, phone, note || '');
    const bookingId = result.lastInsertRowid;

    // Insert second slot for Coupe + Barbe
    let bookingId2 = null;
    if (doubleSlot) {
      const time2 = minutesToTime(timeToMinutes(time) + 30);
      const result2 = insert.run(service, parsedPrice, slotDuration, date, time2, firstName, lastName, email, phone, note || '');
      bookingId2 = result2.lastInsertRowid;
    }

    // Best-effort: create Google Calendar event(s)
    let googleEventId = null;
    try {
      googleEventId = await createCalendarEvent({
        service, date, time,
        duration: doubleSlot ? 60 : durationMin, // single 60-min event in GCal for Coupe + Barbe
        firstName, lastName, email, phone, note: note || '',
      });
      db.prepare('UPDATE bookings SET google_event_id = ? WHERE id = ?').run(googleEventId, bookingId);
      if (bookingId2) {
        db.prepare('UPDATE bookings SET google_event_id = ? WHERE id = ?').run(googleEventId, bookingId2);
      }
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
const PUBLIC_FILES = ['styles.css', 'script.js'];
PUBLIC_FILES.forEach(file => {
  app.get(`/${file}`, (req, res) => {
    res.sendFile(path.join(__dirname, file));
  });
});

// Serve image/font/video directories if they exist
app.use('/images',  express.static(path.join(__dirname, 'images')));
app.use('/fonts',   express.static(path.join(__dirname, 'fonts')));
app.use('/assets',  express.static(path.join(__dirname, 'assets')));
app.use('/videos',  express.static(path.join(__dirname, 'videos')));

// Public homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});



// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  console.log(`\n✂  LM Coupes server running on http://localhost:${PORT}`);
  console.log(`   GCal setup  : http://localhost:${PORT}/setup-gcal\n`);
});
