'use strict';

const { google } = require('googleapis');
const { DateTime } = require('luxon');

const TIMEZONE = process.env.TIMEZONE || 'America/Toronto';

/**
 * Build and return an authenticated OAuth2 client.
 * Throws a descriptive error if credentials are missing.
 */
function getAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error(
      'Google Calendar not configured: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in .env'
    );
  }
  if (!GOOGLE_REFRESH_TOKEN) {
    throw new Error(
      'Google Calendar not configured: GOOGLE_REFRESH_TOKEN is missing. Visit /setup-gcal to authorise the app.'
    );
  }

  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback'
  );

  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return auth;
}

/**
 * Create a Google Calendar event for a booking.
 * Returns the created event ID.
 */
async function createCalendarEvent({ service, date, time, duration, firstName, lastName, email, phone, note }) {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  // Parse date+time in the configured timezone
  const [hour, minute] = time.split(':').map(Number);
  const startDt = DateTime.fromISO(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`, {
    zone: TIMEZONE,
  });
  const endDt = startDt.plus({ minutes: duration });

  const descriptionParts = [
    `Service : ${service}`,
    `Client  : ${firstName} ${lastName}`,
    `Email   : ${email}`,
    `Tél     : ${phone}`,
    `Durée   : ${duration} min`,
    '',
    '📍 4815 rue Saint-Urbain, sous-sol, H2T 2W1, Montréal',
    '📞 +1 514-758-9422',
    '📸 @lm.coupes',
  ];
  if (note) descriptionParts.splice(5, 0, `Note    : ${note}`);

  const event = {
    summary: `✂ ${service} — ${firstName} ${lastName}`,
    location: '4815 rue Saint-Urbain, sous-sol, H2T 2W1, Montréal',
    description: descriptionParts.join('\n'),
    colorId: '11', // Tomato
    start: {
      dateTime: startDt.toISO(),
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: endDt.toISO(),
      timeZone: TIMEZONE,
    },
    attendees: [
      { email, displayName: `${firstName} ${lastName}` },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }, // 24 hours
        { method: 'popup', minutes: 60 },       // 1 hour
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId,
    resource: event,
    sendUpdates: 'all', // sends invite email to attendees
  });

  return response.data.id;
}

/**
 * Delete a Google Calendar event by its event ID.
 */
async function deleteCalendarEvent(eventId) {
  if (!eventId) return;

  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (err) {
    // Ignore 404 (event already deleted or not found)
    if (err.code !== 404 && err.status !== 404) throw err;
  }
}

/**
 * Query the FreeBusy API for a given date.
 * Returns an array of busy periods: [{ start: ISO string, end: ISO string }, ...]
 */
async function getFreeBusySlots(date) {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  // Build time range for the full day in the configured timezone
  const dayStart = DateTime.fromISO(`${date}T00:00:00`, { zone: TIMEZONE });
  const dayEnd   = dayStart.plus({ days: 1 });

  const response = await calendar.freebusy.query({
    resource: {
      timeMin: dayStart.toISO(),
      timeMax: dayEnd.toISO(),
      timeZone: TIMEZONE,
      items: [{ id: calendarId }],
    },
  });

  const busy = (response.data.calendars[calendarId] || {}).busy || [];
  return busy; // Array of { start, end } ISO strings
}

/**
 * Quick connectivity check — lists the first calendar to verify credentials work.
 * Returns { ok: true } or throws.
 */
async function testConnection() {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.calendarList.list({ maxResults: 1 });
  const items = res.data.items || [];
  return {
    ok: true,
    calendarCount: items.length,
    firstCalendar: items[0] ? items[0].summary : null,
  };
}

module.exports = {
  getAuthClient,
  createCalendarEvent,
  deleteCalendarEvent,
  getFreeBusySlots,
  testConnection,
};
