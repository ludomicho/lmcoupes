# LM Coupes - Squire Booking System

A modern barbershop booking application with Google Calendar integration, built for LM Coupes barbershop with two barbers: **Ludo** and **Tristan**.

## Features

✨ **Barber Selection** - Choose between Ludo or Tristan  
📅 **Real-time Availability** - Integrated with Google Calendar  
💇 **Multiple Services** - Haircut, Beard Trim, or both  
📧 **Automatic Confirmations** - Email confirmations sent to clients  
🎨 **Modern UI** - Red-to-blue gradient Squire-style design  
📱 **Responsive** - Works on desktop and mobile  

## Setup & Configuration

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Google Calendar API

#### a. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials (Desktop application)
5. Download credentials and save the client ID & secret

#### b. Set Environment Variables
Copy `.env.example` to `.env` and fill in:
```bash
cp .env.example .env
```

Then edit `.env`:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

#### c. Authorize the App
1. Start the server: `npm start`
2. Visit: `http://localhost:3000/setup-gcal`
3. Follow the OAuth prompt to authorize
4. The refresh token will be stored in `.env`

### 3. Configure Barber Calendar IDs

Each barber needs their own Google Calendar. Update the `.env` file:
```
LUDO_CALENDAR_ID=ludo@gmail.com
TRISTAN_CALENDAR_ID=tristan@gmail.com
```

## Running the App

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Server will run on `http://localhost:3000`

## Usage

### Book an Appointment
1. Visit `http://localhost:3000/squire.html`
2. Select a barber (Ludo or Tristan)
3. Choose a service (Haircut, Beard, or both)
4. Pick a date and available time slot
5. Enter your contact information
6. Confirm booking

The appointment will:
- Be saved to the database
- Be added to the barber's Google Calendar
- Send a confirmation email to the client

## API Endpoints

### Get Available Time Slots
```
GET /api/slots?date=2026-09-05&duration=30&service=Haircut&barber=ludo
```

### Create a Booking
```
POST /api/book
{
  "barber": "ludo",
  "service": "Haircut",
  "price": 30,
  "duration": 30,
  "date": "2026-09-05",
  "time": "14:00",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1 (555) 000-0000",
  "note": "Optional special requests"
}
```

## Services & Pricing

| Service | Price | Duration |
|---------|-------|----------|
| Haircut | $30 | 30 min |
| Beard Trim | $20 | 20 min |
| Haircut + Beard | $45 | 50 min |

## Database Schema

### Bookings Table
- `id` - Unique booking ID
- `barber_id` - Ludo or Tristan
- `service` - Service name
- `price` - Cost
- `duration` - Minutes
- `date` - YYYY-MM-DD
- `time` - HH:MM
- `first_name`, `last_name`, `email`, `phone` - Client info
- `note` - Special requests
- `google_event_id` - Link to Google Calendar event

### Barbers Table
- `id` - Barber ID (ludo, tristan)
- `name` - Display name
- `email` - Email address
- `calendar_id` - Google Calendar email

## Customization

### Change Barbers
Edit `squire.html`:
```javascript
const BARBERS = [
  { id: 'ludo', name: 'Ludo', avatar: 'L', calendarId: 'ludo@example.com' },
  { id: 'tristan', name: 'Tristan', avatar: 'T', calendarId: 'tristan@example.com' }
];
```

### Change Services
Edit `squire.html`:
```javascript
const SERVICES = [
  { id: 'haircut', name: 'Haircut', price: 30, duration: 30 },
  { id: 'beard', name: 'Beard Trim', price: 20, duration: 20 },
  { id: 'both', name: 'Haircut + Beard', price: 45, duration: 50 }
];
```

### Change Hours of Operation
Edit `server.js` or update the `availability` table in the database.

## Git Branching

This Squire booking system is on the `squire` branch:
```bash
git checkout squire
```

To switch back to main:
```bash
git checkout main
```

## Troubleshooting

### "Google Calendar not configured"
- Make sure `.env` has `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN`
- Run `/setup-gcal` to re-authorize

### No available time slots
- Check barber's Google Calendar for conflicts
- Verify availability settings in database
- Check if date is blocked

### Email not sending
- Verify `SMTP_*` settings in `.env`
- For Gmail, use an app-specific password
- Check SMTP credentials are correct

## Support

For issues or questions, contact the development team.

---

**Made for LM Coupes Barbershop** 💈
