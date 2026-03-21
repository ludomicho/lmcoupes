/* ============================================================
   LM COUPES — JavaScript
   Booking System + UI Interactions
   ============================================================ */

'use strict';

// ============================================================
// LANGUAGE / TRANSLATIONS
// ============================================================
let currentLang = 'fr';

const i18n = {
  fr: {
    'nav.services': 'Services',
    'nav.about': 'À propos',
    'nav.gallery': 'Galerie',
    'nav.book': 'Réserver',
    'hero.eyebrow': '✦ Barbershop de Luxe ✦',
    'hero.line1': "L'ART",
    'hero.line2': 'DU STYLE',
    'hero.line3': 'PARFAIT',
    'hero.sub': "Chaque coupe est une œuvre d'art. Chaque rasage, une expérience.",
    'hero.cta': 'Prendre Rendez-Vous',
    'hero.ghost': 'Nos Services',
    'services.tag': '02 — Services',
    'services.title': 'Ce Que Nous <span class="accent">Offrons</span>',
    's1.name': 'Coupe',
    's1.desc': 'Coupe précise aux ciseaux ou à la tondeuse, adaptée à votre morphologie et votre style.',
    's1.book': 'Réserver →',
    's2.name': 'Coupe + Barbe',
    's2.desc': 'Le combo parfait : coupe soignée + barbe sculptée au rasoir traditionnel. Look complet garanti.',
    's2.badge': 'Populaire',
    's2.book': 'Réserver →',
    'about.tag': '01 — À propos',
    'about.title': 'L\'Artisan <span class="accent">Derrière</span> Chaque Coupe',
    'about.lead': "Depuis plus de 14 ans, je perfectionne l'art du barbier avec passion et précision.",
    'about.body': "Formé aux meilleures écoles de coiffure, j'ai développé une approche unique qui mêle techniques traditionnelles et tendances modernes. Chaque client qui entre dans mon salon repart avec une coupe sur-mesure qui révèle sa personnalité.",
    'about.stat1': "Ans d'expérience",
    'about.stat2': 'Clients satisfaits',
    'about.stat3': 'Passion',
    'about.cta': 'Prendre Rendez-Vous',
    'gallery.tag': '03 — Galerie',
    'gallery.title': 'Notre <span class="accent">Travail</span>',
    'g1.label': 'Coupe',
    'g2.label': 'Barbe Sculptée',
    'g3.label': 'Coupe + Barbe',
    'g4.label': 'Style Complet',
    'g5.label': 'Finition Rasoir',
    'test.tag': '04 — Témoignages',
    'test.title': 'Ce Qu\'ils <span class="accent">Disent</span>',
    'test1.quote': '"La meilleure coupe que j\'ai eue de ma vie. Technique impeccable, ambiance de luxe."',
    'test2.quote': '"Le combo coupe + barbe vaut chaque dollar. LM a transformé mon style complètement."',
    'test3.quote': '"Réservation facile, accueil chaleureux, résultat parfait. Je reviens chaque mois."',
    'test4.quote': '"Le rasage traditionnel à la lame droite est une expérience unique. Incroyable."',
    'book.tag': '05 — Réservation',
    'book.title': 'Prenez Votre <span class="accent">Rendez-Vous</span>',
    'book.sub': "Simple, rapide, sans tracas. Choisissez votre service, votre créneau et c'est réservé.",
    'step1.label': 'Service',
    'step2.label': 'Date',
    'step3.label': 'Heure',
    'step4.label': 'Infos',
    'step1.title': 'Choisissez votre service',
    'step2.title': 'Choisissez une date',
    'step3.title': 'Choisissez un horaire',
    'step4.title': 'Vos informations',
    'bs1.name': 'Coupe',
    'bs1.meta': '30 min · 30$',
    'bs2.name': 'Coupe + Barbe',
    'bs2.meta': '60 min · 35$',
    'time.am': 'Matin',
    'time.pm': 'Après-midi',
    'cal.sun': 'Dim', 'cal.mon': 'Lun', 'cal.tue': 'Mar',
    'cal.wed': 'Mer', 'cal.thu': 'Jeu', 'cal.fri': 'Ven', 'cal.sat': 'Sam',
    'form.firstname': 'Prénom *',
    'form.lastname': 'Nom *',
    'form.email': 'Email *',
    'form.phone': 'Téléphone *',
    'form.note': 'Note (optionnel)',
    'form.fn.ph': 'Jean',
    'form.ln.ph': 'Dupont',
    'form.email.ph': 'jean@exemple.com',
    'form.note.ph': 'Précisions sur votre coupe, allergies, préférences...',
    'btn.back': '← Retour',
    'btn.next': 'Continuer →',
    'btn.confirm': 'Confirmer la Réservation ✓',
    'confirm.title': 'Réservation Confirmée!',
    'confirm.msg1': 'Vous recevrez un rappel automatique 24h avant votre rendez-vous.',
    'confirm.msg2': "📅 Ajoutez l'événement à votre calendrier pour ne pas oublier.",
    'confirm.reset': 'Faire une autre réservation',
    'footer.tagline': "L'art du barbier. La précision de l'artisan.",
    'footer.nav': 'Navigation',
    'footer.contact': 'Contact',
    'footer.hours': 'Lun–Sam: 9h–19h',
    'footer.dm': 'Si je ne suis pas disponible,<br>DM-moi sur Instagram!',
    'footer.bottom': '© 2026 LM Coupes — Tous droits réservés',
    'footer.made': 'Fait avec ✂ et passion',
    'fcta': 'Réserver',
    'ticker': '<span>✂ COUPE 30$</span><span>✦ COUPE + BARBE 35$</span><span>✂ 4815 RUE SAINT-URBAIN</span><span>✦ MONTRÉAL</span><span>✂ @LM.COUPES</span><span>✦ +1 514-758-9422</span><span>✂ COUPE 30$</span><span>✦ COUPE + BARBE 35$</span><span>✂ 4815 RUE SAINT-URBAIN</span><span>✦ MONTRÉAL</span><span>✂ @LM.COUPES</span><span>✦ +1 514-758-9422</span>',
    'months': ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
    'locale': 'fr-CA',
    'summary.title': 'Récapitulatif de votre réservation',
    'cd.client': 'Client', 'cd.service': 'Service', 'cd.date': 'Date',
    'cd.time': 'Heure', 'cd.duration': 'Durée', 'cd.total': 'Total',
    'cd.address': 'Adresse', 'cd.email': 'Email', 'cd.note': 'Note',
    'gcal.btn': '📅 Ajouter à Google Calendar',
    'ics.btn': '⬇ Télécharger .ics (rappel 24h)',
    'service.names': { 'Coupe': 'Coupe', 'Coupe + Barbe': 'Coupe + Barbe' },
  },
  en: {
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.gallery': 'Gallery',
    'nav.book': 'Book',
    'hero.eyebrow': '✦ Luxury Barbershop ✦',
    'hero.line1': 'THE ART',
    'hero.line2': 'OF PERFECT',
    'hero.line3': 'STYLE',
    'hero.sub': 'Every cut is a work of art. Every shave, an experience.',
    'hero.cta': 'Book an Appointment',
    'hero.ghost': 'Our Services',
    'services.tag': '02 — Services',
    'services.title': 'What We <span class="accent">Offer</span>',
    's1.name': 'Haircut',
    's1.desc': 'Precision cut with scissors or clippers, tailored to your face shape and personal style.',
    's1.book': 'Book →',
    's2.name': 'Haircut + Beard',
    's2.desc': 'The perfect combo: sharp haircut + sculpted beard with traditional straight razor. Complete look guaranteed.',
    's2.badge': 'Popular',
    's2.book': 'Book →',
    'about.tag': '01 — About',
    'about.title': 'The Craftsman <span class="accent">Behind</span> Every Cut',
    'about.lead': 'For over 14 years, I have been perfecting the art of barbering with passion and precision.',
    'about.body': 'Trained at top barbering schools, I developed a unique approach blending traditional techniques with modern trends. Every client who walks into my shop leaves with a custom cut that reveals their personality.',
    'about.stat1': 'Years of experience',
    'about.stat2': 'Happy clients',
    'about.stat3': 'Passion',
    'about.cta': 'Book an Appointment',
    'gallery.tag': '03 — Gallery',
    'gallery.title': 'Our <span class="accent">Work</span>',
    'g1.label': 'Haircut',
    'g2.label': 'Sculpted Beard',
    'g3.label': 'Haircut + Beard',
    'g4.label': 'Full Style',
    'g5.label': 'Razor Finish',
    'test.tag': '04 — Testimonials',
    'test.title': 'What They <span class="accent">Say</span>',
    'test1.quote': '"Best haircut I\'ve had in my life. Flawless technique, luxury atmosphere."',
    'test2.quote': '"The haircut + beard combo is worth every dollar. LM completely transformed my style."',
    'test3.quote': '"Easy booking, warm welcome, perfect result. I come back every month."',
    'test4.quote': '"The traditional straight razor shave is a one-of-a-kind experience. Incredible."',
    'book.tag': '05 — Booking',
    'book.title': 'Book Your <span class="accent">Appointment</span>',
    'book.sub': "Simple, fast, hassle-free. Pick your service, your time slot, and you're booked.",
    'step1.label': 'Service',
    'step2.label': 'Date',
    'step3.label': 'Time',
    'step4.label': 'Info',
    'step1.title': 'Choose your service',
    'step2.title': 'Choose a date',
    'step3.title': 'Choose a time',
    'step4.title': 'Your information',
    'bs1.name': 'Haircut',
    'bs1.meta': '30 min · $30',
    'bs2.name': 'Haircut + Beard',
    'bs2.meta': '60 min · $35',
    'time.am': 'Morning',
    'time.pm': 'Afternoon',
    'cal.sun': 'Sun', 'cal.mon': 'Mon', 'cal.tue': 'Tue',
    'cal.wed': 'Wed', 'cal.thu': 'Thu', 'cal.fri': 'Fri', 'cal.sat': 'Sat',
    'form.firstname': 'First Name *',
    'form.lastname': 'Last Name *',
    'form.email': 'Email *',
    'form.phone': 'Phone *',
    'form.note': 'Note (optional)',
    'form.fn.ph': 'John',
    'form.ln.ph': 'Smith',
    'form.email.ph': 'john@example.com',
    'form.note.ph': 'Details about your cut, allergies, preferences...',
    'btn.back': '← Back',
    'btn.next': 'Continue →',
    'btn.confirm': 'Confirm Booking ✓',
    'confirm.title': 'Booking Confirmed!',
    'confirm.msg1': 'You will receive an automatic reminder 24h before your appointment.',
    'confirm.msg2': "📅 Add the event to your calendar so you don't forget.",
    'confirm.reset': 'Book another appointment',
    'footer.tagline': 'The art of barbering. The precision of a craftsman.',
    'footer.nav': 'Navigation',
    'footer.contact': 'Contact',
    'footer.hours': 'Mon–Sat: 9am–7pm',
    'footer.dm': "If I'm not available,<br>DM me on Instagram!",
    'footer.bottom': '© 2026 LM Coupes — All rights reserved',
    'footer.made': 'Made with ✂ and passion',
    'fcta': 'Book',
    'ticker': '<span>✂ HAIRCUT $30</span><span>✦ HAIRCUT + BEARD $35</span><span>✂ 4815 ST-URBAIN ST</span><span>✦ MONTREAL</span><span>✂ @LM.COUPES</span><span>✦ +1 514-758-9422</span><span>✂ HAIRCUT $30</span><span>✦ HAIRCUT + BEARD $35</span><span>✂ 4815 ST-URBAIN ST</span><span>✦ MONTREAL</span><span>✂ @LM.COUPES</span><span>✦ +1 514-758-9422</span>',
    'months': ['January','February','March','April','May','June','July','August','September','October','November','December'],
    'locale': 'en-CA',
    'summary.title': 'Booking summary',
    'cd.client': 'Client', 'cd.service': 'Service', 'cd.date': 'Date',
    'cd.time': 'Time', 'cd.duration': 'Duration', 'cd.total': 'Total',
    'cd.address': 'Address', 'cd.email': 'Email', 'cd.note': 'Note',
    'gcal.btn': '📅 Add to Google Calendar',
    'ics.btn': '⬇ Download .ics (24h reminder)',
    'service.names': { 'Coupe': 'Haircut', 'Coupe + Barbe': 'Haircut + Beard' },
  }
};

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.fr[key]) || key;
}

function getServiceName(id) {
  return (i18n[currentLang]['service.names'] && i18n[currentLang]['service.names'][id]) || id;
}

function applyTranslations(lang) {
  const dict = i18n[lang];
  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  // HTML content (headings with accent spans, footer DM note)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });
  // Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });
  // Ticker
  const ticker = document.querySelector('.ticker');
  if (ticker && dict['ticker']) ticker.innerHTML = dict['ticker'];
  // Lang button label
  const langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.textContent = lang === 'fr' ? 'EN' : 'FR';
  // HTML lang attribute
  document.documentElement.lang = lang;
}

function switchLang() {
  currentLang = currentLang === 'fr' ? 'en' : 'fr';
  applyTranslations(currentLang);
  if (state.calYear !== null) renderCalendar();
  // Re-init testimonials with updated text
  initTestimonials();
}

// ============================================================
// STATE
// ============================================================
const state = {
  selectedService: null,
  selectedPrice: null,
  selectedDuration: null,
  selectedDate: null,
  selectedTime: null,
  calYear: null,
  calMonth: null,
  closedDays: [0],
};

// ============================================================
// READ ADMIN SETTINGS FROM LOCALSTORAGE
// ============================================================
function loadAdminAvailability() {
  try {
    const stored = localStorage.getItem('lm_availability');
    if (!stored) return;
    const avail = JSON.parse(stored);
    state.closedDays = avail.filter(a => !a.is_available).map(a => a.day_of_week);
    // Store full availability for time slot generation
    state.availability = avail;
  } catch (_) {}
}

function getBlockedDatesFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('lm_blocked_dates') || '[]').map(b => b.date);
  } catch (_) { return []; }
}

function getBookingsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('lm_bookings') || '[]');
  } catch (_) { return []; }
}

function saveBookingToStorage(booking) {
  try {
    const bookings = getBookingsFromStorage();
    bookings.push(booking);
    localStorage.setItem('lm_bookings', JSON.stringify(bookings));
  } catch (_) {}
}

// ============================================================
// DATE HELPER
// ============================================================
/** Returns YYYY-MM-DD from a Date object using local year/month/day (not UTC). */
function getLocalDateString(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================================================
// NAVBAR SCROLL
// ============================================================
const navbar = document.getElementById('navbar');
const floatingCta = document.getElementById('floatingCta');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (scrollY > 60) {
    navbar.classList.add('scrolled');
    floatingCta.classList.add('visible');
  } else {
    navbar.classList.remove('scrolled');
    floatingCta.classList.remove('visible');
  }
});

// ============================================================
// HAMBURGER MOBILE MENU
// ============================================================
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  const isOpen = mobileMenu.classList.contains('open');
  hamburger.querySelectorAll('span')[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
  hamburger.querySelectorAll('span')[1].style.opacity = isOpen ? '0' : '';
  hamburger.querySelectorAll('span')[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.querySelectorAll('span').forEach(s => {
    s.style.transform = '';
    s.style.opacity = '';
  });
}

// ============================================================
// SCROLL REVEAL ANIMATIONS
// ============================================================
function initReveal() {
  const els = document.querySelectorAll(
    '.service-card, .about-visual, .about-text, .gallery-item, .testimonial-card, .booking-widget, .footer-top > *'
  );
  els.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => observer.observe(el));
}

// ============================================================
// BOOKING SYSTEM
// ============================================================

// Open from service cards on main page
function openBooking(serviceName, price, duration) {
  // Scroll to booking section
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  // Pre-select service after scroll
  setTimeout(() => {
    selectService(serviceName, price, duration);
    goToStep(1);
  }, 600);
}

// Select service in step 1
function selectService(name, price, duration) {
  state.selectedService = name;
  state.selectedPrice = price;
  state.selectedDuration = duration;

  // Update UI
  document.querySelectorAll('.booking-service-item').forEach(item => {
    item.classList.toggle('selected', item.dataset.id === name);
  });

  document.getElementById('nextStep1').disabled = false;
}

// ============================================================
// STEP NAVIGATION
// ============================================================
function goToStep(stepNum) {
  // Hide all steps
  document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step').forEach(s => {
    s.classList.remove('active');
    s.classList.remove('completed');
  });

  // Mark completed steps
  for (let i = 1; i < stepNum; i++) {
    const s = document.getElementById(`step-${i}`);
    if (s) {
      s.classList.add('completed');
      const circle = s.querySelector('.step-circle');
      if (circle) circle.textContent = '✓';
    }
  }

  // Activate current step
  const currentStepBtn = document.getElementById(`step-${stepNum}`);
  if (currentStepBtn) currentStepBtn.classList.add('active');
  const currentStepPanel = document.getElementById(`booking-step-${stepNum}`);
  if (currentStepPanel) currentStepPanel.classList.add('active');

  // Init calendar when going to step 2
  if (stepNum === 2) {
    initCalendar();
  }

  // Init time slots when going to step 3
  if (stepNum === 3) {
    renderTimeSlots();
  }

  // Build summary when going to step 4
  if (stepNum === 4) {
    renderSummary();
  }
}

// ============================================================
// CALENDAR
// ============================================================
function initCalendar() {
  const now = new Date();
  state.calYear = state.calYear || now.getFullYear();
  state.calMonth = state.calMonth !== null ? state.calMonth : now.getMonth();
  renderCalendar();
}

function changeMonth(dir) {
  state.calMonth += dir;
  if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
  if (state.calMonth < 0)  { state.calMonth = 11; state.calYear--; }
  // Clear selected date if month changes
  state.selectedDate = null;
  document.getElementById('nextStep2').disabled = true;
  renderCalendar();
}

function renderCalendar() {
  const { calYear, calMonth } = state;
  const monthNames = i18n[currentLang]['months'];

  document.getElementById('calMonthYear').textContent = `${monthNames[calMonth]} ${calYear}`;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // Empty cells for alignment
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  const blockedDates = getBlockedDatesFromStorage();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calYear, calMonth, d);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    const isPast = date < today;
    const isClosedDay = (state.closedDays || [0]).includes(dayOfWeek);
    const dateStr = getLocalDateString(date);
    const isBlocked = blockedDates.includes(dateStr);
    const isToday = date.getTime() === today.getTime();

    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.textContent = d;

    if (isPast || isClosedDay || isBlocked) {
      cell.classList.add('disabled');
      if (isBlocked) cell.title = currentLang === 'en' ? 'Blocked' : 'Bloqué';
    } else {
      if (isToday) cell.classList.add('today');

      // Check if this is the selected date
      if (state.selectedDate) {
        const sel = new Date(state.selectedDate);
        if (sel.getFullYear() === calYear && sel.getMonth() === calMonth && sel.getDate() === d) {
          cell.classList.add('selected');
        }
      }

      cell.addEventListener('click', () => selectDate(calYear, calMonth, d));
    }

    grid.appendChild(cell);
  }
}

function selectDate(year, month, day) {
  state.selectedDate = new Date(year, month, day);
  // Clear time selection when date changes
  state.selectedTime = null;
  document.getElementById('nextStep3').disabled = true;

  // Re-render calendar to show selection
  renderCalendar();

  document.getElementById('nextStep2').disabled = false;
}

// ============================================================
// TIME SLOTS  (static client-side — no backend needed)
// ============================================================
function renderTimeSlots() {
  const dateStr = getLocalDateString(state.selectedDate);
  if (!dateStr) return;
  const amContainer = document.getElementById('timeSlotsAM');
  const pmContainer = document.getElementById('timeSlotsPM');
  amContainer.innerHTML = '';
  pmContainer.innerHTML = '';

  // Read availability hours for this day of week
  const dayOfWeek = state.selectedDate.getDay();
  let startHour = 9, startMin = 0, endHour = 19, endMin = 0;

  if (state.availability) {
    const dayAvail = state.availability.find(a => a.day_of_week === dayOfWeek);
    if (dayAvail && dayAvail.start_time && dayAvail.end_time) {
      [startHour, startMin] = dayAvail.start_time.split(':').map(Number);
      [endHour, endMin] = dayAvail.end_time.split(':').map(Number);
    }
  }

  const endTotalMin = endHour * 60 + endMin;
  const duration = state.selectedDuration || 30;

  // Generate all possible slots
  const allSlots = [];
  for (let h = startHour; h <= 23; h++) {
    for (let m = (h === startHour ? startMin : 0); m < 60; m += 30) {
      const slotStart = h * 60 + m;
      if (slotStart + duration > endTotalMin) break;
      allSlots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }

  // Check existing bookings for this date and remove conflicting slots
  const existingBookings = getBookingsFromStorage().filter(b => b.date === dateStr);
  const available = allSlots.filter(slot => {
    const [sh, sm] = slot.split(':').map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = slotStart + duration;

    return !existingBookings.some(b => {
      const [bh, bm] = b.time.split(':').map(Number);
      const bStart = bh * 60 + bm;
      const bEnd = bStart + (b.duration || 30);
      return slotStart < bEnd && slotEnd > bStart;
    });
  });

  if (available.length === 0) {
    const msg = currentLang === 'en' ? 'No slots available this day.' : 'Aucun créneau disponible ce jour.';
    amContainer.innerHTML = `<p class="slots-unavailable">${msg}</p>`;
    return;
  }

  renderSlotGroup('timeSlotsAM', available.filter(s => parseInt(s) < 12));
  renderSlotGroup('timeSlotsPM', available.filter(s => parseInt(s) >= 12));
}

function renderSlotGroup(containerId, slots) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!slots || slots.length === 0) return;
  slots.forEach(time => {
    const isSelected = state.selectedTime === time;
    const btn = document.createElement('button');
    btn.className = 'time-slot' + (isSelected ? ' selected' : '');
    btn.textContent = time;
    btn.addEventListener('click', () => selectTime(time));
    container.appendChild(btn);
  });
}

function selectTime(time) {
  state.selectedTime = time;
  document.querySelectorAll('.time-slot').forEach(s => {
    s.classList.toggle('selected', s.textContent === time);
  });
  document.getElementById('nextStep3').disabled = false;
}

// ============================================================
// BOOKING SUMMARY
// ============================================================
function renderSummary() {
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const locale = i18n[currentLang]['locale'];
  const dateStr = state.selectedDate
    ? state.selectedDate.toLocaleDateString(locale, dateOptions)
    : '—';
  const priceFmt = currentLang === 'en'
    ? `$${state.selectedPrice}`
    : `${state.selectedPrice}$`;

  const summary = document.getElementById('bookingSummary');
  summary.innerHTML = `
    <strong>${t('summary.title')}</strong><br>
    🎯 <strong>${getServiceName(state.selectedService)}</strong> · ${state.selectedDuration} min · <strong style="color:var(--gold)">${priceFmt}</strong><br>
    📅 ${dateStr}<br>
    🕐 ${state.selectedTime}
  `;
}

// ============================================================
// FORM SUBMISSION  (Netlify Forms — static hosting)
// ============================================================
async function submitBooking(e) {
  e.preventDefault();
  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('email').value.trim();
  const phone     = document.getElementById('phone').value.trim();
  const note      = document.getElementById('note').value.trim();
  if (!firstName || !lastName || !email || !phone) return;

  const submitBtn = e.target.querySelector('[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '...';

  // Save booking to localStorage so admin panel can see it
  const bookingData = {
    id: Date.now(),
    service: state.selectedService,
    price: state.selectedPrice,
    duration: state.selectedDuration,
    date: getLocalDateString(state.selectedDate),
    time: state.selectedTime,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    note,
    google_event_id: null,
    created_at: new Date().toISOString(),
  };
  saveBookingToStorage(bookingData);

  // Also submit to Netlify Forms
  try {
    await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'form-name': 'booking',
        service:    state.selectedService,
        price:      String(state.selectedPrice),
        duration:   String(state.selectedDuration),
        date:       getLocalDateString(state.selectedDate),
        time:       state.selectedTime,
        firstName, lastName, email, phone, note,
      }).toString(),
    });
  } catch (_) {
    // Network errors are non-fatal on static hosting
  }

  showConfirmation({ firstName, lastName, email, phone, note });
}

// ============================================================
// CALENDAR EVENT HELPERS
// ============================================================

// Format: YYYYMMDDTHHMMSS  (local time, no UTC suffix for Google Calendar)
function formatCalDate(date, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function addMinutes(date, timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m + mins, 0);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function buildGoogleCalendarUrl(bookingData) {
  const start = formatCalDate(state.selectedDate, state.selectedTime);
  const end   = addMinutes(state.selectedDate, state.selectedTime, state.selectedDuration);

  const title = `Coupe chez LM Coupes — ${state.selectedService}`;
  const location = '4815 rue Saint-Urbain, sous-sol, H2T 2W1, Montréal';
  const details = [
    `Service: ${state.selectedService}`,
    `Client: ${bookingData.firstName} ${bookingData.lastName}`,
    `Prix: ${state.selectedPrice}$`,
    `Durée: ${state.selectedDuration} min`,
    '',
    "Don't miss out on your cut! If I'm NOT available, slide into my DMs on Instagram @lm.coupes and we'll make it happen!!",
    '',
    'Phone Number: +1 514-758-9422',
  ].join('\\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details,
    location,
    ctz: 'America/Toronto',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsContent(bookingData) {
  const start = formatCalDate(state.selectedDate, state.selectedTime);
  const end   = addMinutes(state.selectedDate, state.selectedTime, state.selectedDuration);
  const now   = formatCalDate(new Date(), `${new Date().getHours()}:${new Date().getMinutes()}`);
  const uid   = `lmcoupes-${Date.now()}@lmcoupes.com`;

  const description = [
    `Service: ${state.selectedService}`,
    `Client: ${bookingData.firstName} ${bookingData.lastName}`,
    `Prix: ${state.selectedPrice}$`,
    `Durée: ${state.selectedDuration} min`,
    '',
    "Don't miss out on your cut! If I'm NOT available\\, slide into my DMs on Instagram @lm.coupes and we'll make it happen!!",
    '',
    'Phone Number: +1 514-758-9422',
  ].join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LM Coupes//Booking System//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=America/Toronto:${start}`,
    `DTEND;TZID=America/Toronto:${end}`,
    `SUMMARY:Coupe chez LM Coupes — ${state.selectedService}`,
    `LOCATION:4815 rue Saint-Urbain\\, sous-sol\\, H2T 2W1\\, Montréal`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    // 24-hour reminder
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:⏰ Rappel: Votre rendez-vous chez LM Coupes demain! ${state.selectedService} à ${state.selectedTime}`,
    'END:VALARM',
    // 1-hour reminder
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:⏰ Dans 1 heure: Coupe chez LM Coupes — ${state.selectedService} à ${state.selectedTime}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadIcs(bookingData) {
  const ics = buildIcsContent(bookingData);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LM-Coupes-${state.selectedService.replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showConfirmation(data) {
  // Hide all steps, show confirmation
  document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step').forEach(s => s.classList.add('completed'));

  const confirmation = document.getElementById('booking-confirmation');
  confirmation.classList.add('active');

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const locale = i18n[currentLang]['locale'];
  const dateStr = state.selectedDate
    ? state.selectedDate.toLocaleDateString(locale, dateOptions)
    : '—';
  const priceFmt = currentLang === 'en'
    ? `$${state.selectedPrice}`
    : `${state.selectedPrice}$`;

  const details = document.getElementById('confirmationDetails');
  details.innerHTML = `
    <div class="cd-row">
      <span class="cd-label">${t('cd.client')}</span>
      <span class="cd-value">${data.firstName} ${data.lastName}</span>
    </div>
    <div class="cd-row">
      <span class="cd-label">${t('cd.service')}</span>
      <span class="cd-value">${getServiceName(state.selectedService)}</span>
    </div>
    <div class="cd-row">
      <span class="cd-label">${t('cd.date')}</span>
      <span class="cd-value">${dateStr}</span>
    </div>
    <div class="cd-row">
      <span class="cd-label">${t('cd.time')}</span>
      <span class="cd-value">${state.selectedTime}</span>
    </div>
    <div class="cd-row">
      <span class="cd-label">${t('cd.duration')}</span>
      <span class="cd-value">${state.selectedDuration} min</span>
    </div>
    <div class="cd-row">
      <span class="cd-label">${t('cd.total')}</span>
      <span class="cd-value" style="color:var(--gold);font-size:1.1rem;font-weight:700">${priceFmt}</span>
    </div>
    <div class="cd-row">
      <span class="cd-label">${t('cd.address')}</span>
      <span class="cd-value">4815 rue Saint-Urbain, sous-sol<br>H2T 2W1, Montréal</span>
    </div>
    <div class="cd-row">
      <span class="cd-label">${t('cd.email')}</span>
      <span class="cd-value">${data.email}</span>
    </div>
    ${data.note ? `
    <div class="cd-row">
      <span class="cd-label">${t('cd.note')}</span>
      <span class="cd-value">${data.note}</span>
    </div>` : ''}
  `;

  // Calendar action buttons
  const actions = document.getElementById('confirmationActions');
  const gcalUrl = buildGoogleCalendarUrl(data);
  actions.innerHTML = `
    <a href="${gcalUrl}" target="_blank" class="btn-calendar">
      ${t('gcal.btn')}
    </a>
    <button class="btn-ics" onclick="downloadIcs(window._lastBookingData)">
      ${t('ics.btn')}
    </button>
  `;

  // Store data for .ics download
  window._lastBookingData = data;
}

function resetBooking() {
  // Reset state
  state.selectedService = null;
  state.selectedPrice   = null;
  state.selectedDuration = null;
  state.selectedDate    = null;
  state.selectedTime    = null;

  // Reset form
  document.getElementById('firstName').value = '';
  document.getElementById('lastName').value  = '';
  document.getElementById('email').value     = '';
  document.getElementById('phone').value     = '';
  document.getElementById('note').value      = '';

  // Reset step circles
  for (let i = 1; i <= 4; i++) {
    const s = document.getElementById(`step-${i}`);
    if (s) {
      s.classList.remove('completed', 'active');
      const circle = s.querySelector('.step-circle');
      if (circle) circle.textContent = i;
    }
  }

  // Reset service selection
  document.querySelectorAll('.booking-service-item').forEach(i => i.classList.remove('selected'));
  document.getElementById('nextStep1').disabled = true;
  document.getElementById('nextStep2').disabled = true;
  document.getElementById('nextStep3').disabled = true;

  // Go back to step 1
  document.getElementById('booking-confirmation').classList.remove('active');
  goToStep(1);
}

// ============================================================
// TESTIMONIALS AUTO-DUPLICATE FOR INFINITE SCROLL
// ============================================================
function initTestimonials() {
  const track = document.getElementById('testimonialsTrack');
  if (!track) return;
  // Remove previously cloned cards before re-cloning
  track.querySelectorAll('.testimonial-card[data-clone]').forEach(c => c.remove());
  const cards = track.querySelectorAll('.testimonial-card');
  cards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('data-clone', 'true');
    track.appendChild(clone);
  });
}

// ============================================================
// SMOOTH ANCHOR SCROLL
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ============================================================
// ACTIVE NAV HIGHLIGHTING
// ============================================================
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.style.color = '#c0392b';
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
}

// ============================================================
// PARALLAX EFFECT ON HERO
// ============================================================
function initParallax() {
  const hero = document.querySelector('.hero');
  const scissors = document.querySelector('.hero-scissors');
  if (!hero || !scissors) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      scissors.style.transform = `translateY(calc(-50% + ${scrollY * 0.2}px)) rotate(${-10 + scrollY * 0.01}deg)`;
    }
  }, { passive: true });
}

// ============================================================
// SCISSORS CURSOR + HAIR EFFECT
// ============================================================
function initScissorsCursor() {
  const cur = document.getElementById('scissorsCursor');
  if (!cur) return;

  cur.innerHTML = `
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
      <g class="sc-a">
        <line x1="24" y1="24" x2="42" y2="6"  stroke="#1a1917" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="24" y1="24" x2="6"  y2="42" stroke="#3a3530" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="6" cy="42" r="5.5" fill="none" stroke="#1a1917" stroke-width="2"/>
      </g>
      <g class="sc-b">
        <line x1="24" y1="24" x2="42" y2="42" stroke="#1a1917" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="24" y1="24" x2="6"  y2="6"  stroke="#3a3530" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="6" cy="6" r="5.5" fill="none" stroke="#1a1917" stroke-width="2"/>
      </g>
      <circle cx="24" cy="24" r="3.5" fill="#c0392b"/>
    </svg>`;

  // Follow mouse — tip is at top-right (42,6), offset so tip is at pointer
  document.addEventListener('mousemove', e => {
    cur.style.left = (e.clientX - 38) + 'px';
    cur.style.top  = (e.clientY - 6)  + 'px';
  });

  // Click: cutting animation + spawn hair
  document.addEventListener('mousedown', e => {
    cur.classList.remove('sc-cutting'); // reset so re-trigger works
    void cur.offsetWidth;               // force reflow
    cur.classList.add('sc-cutting');
    spawnHair(e.clientX, e.clientY);
    setTimeout(() => cur.classList.remove('sc-cutting'), 240);
  });
}

function spawnHair(x, y) {
  const count = 4 + Math.floor(Math.random() * 3);
  const hairAnims = ['hairFall0','hairFall1','hairFall2'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const s = document.createElement('div');
      const angle  = -25 + Math.random() * 50;
      const len    = 10 + Math.random() * 14;
      const anim   = hairAnims[i % 3];
      const dur    = 550 + Math.random() * 250;
      s.style.cssText = `
        position:fixed;
        left:${x + (Math.random() - 0.5) * 14}px;
        top:${y}px;
        width:1.5px;height:${len}px;
        background:linear-gradient(180deg,#2d1a0e,#7a5c3b);
        border-radius:1px;pointer-events:none;z-index:99998;
        transform-origin:50% 0;
        transform:rotate(${angle}deg);
        animation:${anim} ${dur}ms ease-in forwards;
      `;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), dur + 60);
    }, i * 35);
  }
}

// ============================================================
// NUMBER COUNTER ANIMATION
// ============================================================
function animateCounters() {
  const stats = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        const num = parseInt(text.replace(/\D/g, ''));
        const suffix = text.replace(/[\d]/g, '');
        if (!num) return;

        let start = 0;
        const duration = 1500;
        const step = num / (duration / 16);

        const timer = setInterval(() => {
          start = Math.min(start + step, num);
          el.textContent = Math.floor(start) + suffix;
          if (start >= num) clearInterval(timer);
        }, 16);

        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(s => observer.observe(s));
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Load admin availability/blocked dates from localStorage
  loadAdminAvailability();

  applyTranslations(currentLang);
  initReveal();
  initTestimonials();
  initActiveNav();
  initParallax();

  animateCounters();
  goToStep(1);

  // Set calendar to current month
  const now = new Date();
  state.calYear = now.getFullYear();
  state.calMonth = now.getMonth();
});
