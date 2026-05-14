'use strict';
const express = require('express');
const cors = require('cors');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'codealpha_secret_2025';

// ── Database ──────────────────────────────────────────
const adapter = new FileSync(path.join(__dirname, 'db/db.json'));
const db = low(adapter);
db.defaults({ users: [], events: [], registrations: [] }).write();

// Seed demo events if empty
if (!db.get('events').value().length) {
  const now = Date.now();
  db.get('events').push(
    { id: 'e1', title: 'Tech Summit 2025', description: 'Annual technology conference featuring keynotes, workshops, and networking.', date: new Date(now + 86400000 * 7).toISOString().slice(0,10), time: '09:00', location: 'Durban ICC, Durban', capacity: 200, category: 'Conference', organizer: 'CodeAlpha', createdAt: new Date().toISOString() },
    { id: 'e2', title: 'Full Stack Workshop', description: 'Hands-on workshop covering React, Node.js and deployment best practices.', date: new Date(now + 86400000 * 14).toISOString().slice(0,10), time: '10:00', location: 'Innovation Hub, Cape Town', capacity: 40, category: 'Workshop', organizer: 'CodeAlpha', createdAt: new Date().toISOString() },
    { id: 'e3', title: 'Startup Pitch Night', description: 'Watch the top 10 SA startups pitch to a panel of investors. Networking to follow.', date: new Date(now + 86400000 * 21).toISOString().slice(0,10), time: '18:00', location: 'Workshop17, Johannesburg', capacity: 80, category: 'Networking', organizer: 'CodeAlpha', createdAt: new Date().toISOString() },
    { id: 'e4', title: 'AI & Machine Learning Bootcamp', description: 'Three-day intensive on Python, scikit-learn, TensorFlow and real-world ML projects.', date: new Date(now + 86400000 * 30).toISOString().slice(0,10), time: '08:30', location: 'Online (Zoom)', capacity: 100, category: 'Bootcamp', organizer: 'CodeAlpha', createdAt: new Date().toISOString() }
  ).write();
}

// ── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided.' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ── AUTH ROUTES ───────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required.' });
  if (db.get('users').find({ email }).value()) return res.status(409).json({ error: 'Email already registered.' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: 'u' + Date.now(), name, email, passwordHash: hash, role: 'user', createdAt: new Date().toISOString() };
  db.get('users').push(user).write();
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.get('users').find({ email }).value();
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// ── EVENT ROUTES ──────────────────────────────────────
// GET /api/events — list all events
app.get('/api/events', (req, res) => {
  const { category, search } = req.query;
  let events = db.get('events').orderBy('date', 'asc').value();
  if (category) events = events.filter(e => e.category === category);
  if (search) events = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()));
  // Attach registration count
  const result = events.map(e => ({
    ...e,
    registered: db.get('registrations').filter({ eventId: e.id }).value().length,
    spotsLeft: e.capacity - db.get('registrations').filter({ eventId: e.id }).value().length
  }));
  res.json(result);
});

// GET /api/events/:id
app.get('/api/events/:id', (req, res) => {
  const event = db.get('events').find({ id: req.params.id }).value();
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  const registered = db.get('registrations').filter({ eventId: event.id }).value().length;
  res.json({ ...event, registered, spotsLeft: event.capacity - registered });
});

// POST /api/events — create event (admin or any user for demo)
app.post('/api/events', auth, (req, res) => {
  const { title, description, date, time, location, capacity, category } = req.body;
  if (!title || !date || !location || !capacity) return res.status(400).json({ error: 'title, date, location and capacity are required.' });
  const event = { id: 'e' + Date.now(), title, description: description || '', date, time: time || '09:00', location, capacity: parseInt(capacity), category: category || 'General', organizer: req.user.name, createdAt: new Date().toISOString() };
  db.get('events').push(event).write();
  res.status(201).json(event);
});

// DELETE /api/events/:id
app.delete('/api/events/:id', auth, (req, res) => {
  const event = db.get('events').find({ id: req.params.id }).value();
  if (!event) return res.status(404).json({ error: 'Not found.' });
  db.get('events').remove({ id: req.params.id }).write();
  db.get('registrations').remove({ eventId: req.params.id }).write();
  res.json({ message: 'Event deleted.' });
});

// ── REGISTRATION ROUTES ───────────────────────────────
// POST /api/registrations
app.post('/api/registrations', auth, (req, res) => {
  const { eventId } = req.body;
  const event = db.get('events').find({ id: eventId }).value();
  if (!event) return res.status(404).json({ error: 'Event not found.' });

  const alreadyRegistered = db.get('registrations').find({ eventId, userId: req.user.id }).value();
  if (alreadyRegistered) return res.status(409).json({ error: 'You are already registered for this event.' });

  const count = db.get('registrations').filter({ eventId }).value().length;
  if (count >= event.capacity) return res.status(400).json({ error: 'This event is fully booked.' });

  const reg = { id: 'r' + Date.now(), userId: req.user.id, userName: req.user.name, userEmail: req.user.email, eventId, eventTitle: event.title, status: 'confirmed', registeredAt: new Date().toISOString() };
  db.get('registrations').push(reg).write();
  res.status(201).json(reg);
});

// GET /api/registrations/my — user's registrations
app.get('/api/registrations/my', auth, (req, res) => {
  const regs = db.get('registrations').filter({ userId: req.user.id }).value();
  const result = regs.map(r => {
    const event = db.get('events').find({ id: r.eventId }).value();
    return { ...r, event };
  });
  res.json(result);
});

// DELETE /api/registrations/:id — cancel
app.delete('/api/registrations/:id', auth, (req, res) => {
  const reg = db.get('registrations').find({ id: req.params.id, userId: req.user.id }).value();
  if (!reg) return res.status(404).json({ error: 'Registration not found.' });
  db.get('registrations').remove({ id: req.params.id }).write();
  res.json({ message: 'Registration cancelled.' });
});

// GET /api/admin/registrations — all registrations (organizer view)
app.get('/api/admin/registrations', auth, (req, res) => {
  const regs = db.get('registrations').value();
  res.json(regs);
});

app.listen(PORT, () => console.log(`EventReg running on http://localhost:${PORT}`));
