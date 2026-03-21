'use strict';

const nodemailer = require('nodemailer');

/**
 * Send a booking confirmation email to the client.
 * If GMAIL_USER or GMAIL_APP_PASSWORD are not set, logs and returns silently.
 */
async function sendConfirmationEmail({ firstName, lastName, email, service, date, time, duration, price, note }) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, EMAIL_FROM_NAME } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log('[Email] GMAIL_USER or GMAIL_APP_PASSWORD not configured — skipping confirmation email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  // Format date nicely
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dateFormatted = dateObj.toLocaleDateString('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fromName = EMAIL_FROM_NAME || 'LM Coupes';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmation de réservation — LM Coupes</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Raleway:wght@400;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: #0d0d0d;
      color: #e8e8e8;
      font-family: 'Raleway', Arial, sans-serif;
      font-size: 15px;
      line-height: 1.7;
    }

    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #161616;
    }

    /* Header */
    .email-header {
      background-color: #1a1a1a;
      border-bottom: 3px solid #c0392b;
      padding: 40px 48px 32px;
      text-align: center;
    }
    .brand-lm {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 48px;
      color: #c0392b;
      letter-spacing: 0.05em;
      line-height: 1;
      display: inline-block;
    }
    .brand-coupes {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      color: #e8e8e8;
      letter-spacing: 0.25em;
      display: inline-block;
      margin-left: 4px;
    }
    .header-tagline {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #c8a96e;
      margin-top: 10px;
    }

    /* Hero band */
    .email-hero {
      background: linear-gradient(135deg, #c0392b 0%, #922b21 100%);
      padding: 32px 48px;
      text-align: center;
    }
    .email-hero h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .email-hero p {
      color: rgba(255,255,255,0.85);
      font-size: 14px;
    }

    /* Body */
    .email-body {
      padding: 40px 48px;
    }

    .greeting {
      font-size: 16px;
      color: #e8e8e8;
      margin-bottom: 24px;
    }
    .greeting strong { color: #c8a96e; }

    /* Details card */
    .details-card {
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      overflow: hidden;
      margin: 24px 0;
    }
    .details-card-title {
      background: #252525;
      border-bottom: 1px solid #2a2a2a;
      padding: 14px 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #c8a96e;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 20px;
      border-bottom: 1px solid #232323;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #888;
      flex-shrink: 0;
      min-width: 100px;
    }
    .detail-value {
      font-size: 14px;
      color: #e8e8e8;
      font-weight: 600;
      text-align: right;
    }
    .detail-value.accent { color: #c8a96e; font-size: 16px; }

    /* Info box */
    .info-box {
      background: rgba(192, 57, 43, 0.08);
      border: 1px solid rgba(192, 57, 43, 0.25);
      border-radius: 6px;
      padding: 16px 20px;
      margin: 24px 0;
      font-size: 13px;
      color: #ccc;
    }
    .info-box strong { color: #e8e8e8; }

    /* Address block */
    .address-block {
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }
    .address-block .address-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #c0392b;
      margin-bottom: 8px;
    }
    .address-block p {
      font-size: 14px;
      color: #ccc;
      margin: 2px 0;
    }

    /* Note */
    .note-box {
      background: #1e1e1e;
      border-left: 3px solid #c8a96e;
      border-radius: 0 6px 6px 0;
      padding: 14px 18px;
      margin: 20px 0;
      font-size: 13px;
      color: #ccc;
    }
    .note-box strong { color: #c8a96e; display: block; margin-bottom: 4px; }

    /* Footer */
    .email-footer {
      background: #111;
      border-top: 1px solid #2a2a2a;
      padding: 32px 48px;
      text-align: center;
    }
    .email-footer p {
      font-size: 12px;
      color: #555;
      margin-bottom: 6px;
    }
    .email-footer a { color: #c0392b; text-decoration: none; }

    .divider {
      height: 1px;
      background: #2a2a2a;
      margin: 24px 0;
    }

    @media only screen and (max-width: 600px) {
      .email-header, .email-hero, .email-body, .email-footer {
        padding-left: 24px;
        padding-right: 24px;
      }
      .detail-row { flex-direction: column; gap: 2px; }
      .detail-value { text-align: left; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">

    <!-- Header -->
    <div class="email-header">
      <div>
        <span class="brand-lm">LM</span>
        <span class="brand-coupes">COUPES</span>
      </div>
      <p class="header-tagline">✦ Barbershop de Luxe ✦</p>
    </div>

    <!-- Hero -->
    <div class="email-hero">
      <h1>✓ Réservation Confirmée</h1>
      <p>Votre rendez-vous est bien enregistré. À très bientôt!</p>
    </div>

    <!-- Body -->
    <div class="email-body">

      <p class="greeting">
        Bonjour <strong>${firstName} ${lastName}</strong>,<br>
        merci pour votre confiance. Voici le récapitulatif de votre réservation chez LM Coupes.
      </p>

      <!-- Details -->
      <div class="details-card">
        <div class="details-card-title">Détails de la réservation</div>

        <div class="detail-row">
          <span class="detail-label">Service</span>
          <span class="detail-value">${service}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${dateFormatted}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Heure</span>
          <span class="detail-value">${time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Durée</span>
          <span class="detail-value">${duration} min</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total</span>
          <span class="detail-value accent">${price}$</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">${email}</span>
        </div>
      </div>

      ${note ? `
      <div class="note-box">
        <strong>Votre note :</strong>
        ${note}
      </div>
      ` : ''}

      <!-- Reminder -->
      <div class="info-box">
        <strong>⏰ Rappel automatique</strong><br>
        Vous recevrez un rappel 24h avant votre rendez-vous. Pensez à ajouter l'événement à votre calendrier!
      </div>

      <!-- Address -->
      <div class="address-block">
        <div class="address-label">📍 Adresse</div>
        <p><strong>LM Coupes</strong></p>
        <p>4815 rue Saint-Urbain, sous-sol</p>
        <p>H2T 2W1, Montréal</p>
        <p style="margin-top:10px; color:#888;">📞 +1 514-758-9422</p>
        <p style="color:#888;">📸 @lm.coupes</p>
      </div>

      <div class="divider"></div>

      <p style="font-size:13px; color:#888;">
        Pour annuler ou modifier votre rendez-vous, contactez-nous directement par téléphone ou Instagram.
        Si vous ne pouvez pas venir, prévenez-nous le plus tôt possible — nous nous ferons un plaisir de vous reprogrammer.
      </p>

    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p>© 2026 LM Coupes — Tous droits réservés</p>
      <p>4815 rue Saint-Urbain, sous-sol, H2T 2W1, Montréal</p>
      <p>
        <a href="https://instagram.com/lm.coupes">@lm.coupes</a>
        &nbsp;·&nbsp;
        <a href="tel:+15147589422">+1 514-758-9422</a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();

  const textBody = [
    'LM COUPES — Confirmation de réservation',
    '==========================================',
    '',
    `Bonjour ${firstName} ${lastName},`,
    '',
    'Votre rendez-vous est confirmé :',
    `  Service  : ${service}`,
    `  Date     : ${dateFormatted}`,
    `  Heure    : ${time}`,
    `  Durée    : ${duration} min`,
    `  Total    : ${price}$`,
    '',
    note ? `Note : ${note}\n` : '',
    'Adresse : 4815 rue Saint-Urbain, sous-sol, H2T 2W1, Montréal',
    'Tél     : +1 514-758-9422',
    'Instagram: @lm.coupes',
    '',
    '© 2026 LM Coupes',
  ].filter(l => l !== null).join('\n');

  const mailOptions = {
    from: `"${fromName}" <${GMAIL_USER}>`,
    to: `"${firstName} ${lastName}" <${email}>`,
    subject: `✂ Réservation confirmée — ${service} le ${dateFormatted} à ${time}`,
    text: textBody,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Confirmation sent to ${email} — messageId: ${info.messageId}`);
  } catch (err) {
    console.error('[Email] Failed to send confirmation email:', err.message);
    // Non-fatal — booking is already saved
  }
}

module.exports = { sendConfirmationEmail };
