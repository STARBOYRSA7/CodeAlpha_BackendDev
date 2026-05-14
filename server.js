'use strict';
const express = require('express');
const cors = require('cors');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════
// ── SERVE HUB PAGE ────────────────────────────────────
// ═══════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ═══════════════════════════════════════════════════════
// ── TASK 1: URL SHORTENER ────────────────────────────
// ═══════════════════════════════════════════════════════
const task1Path = path.join(__dirname, 'task1-urlshortener');

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

function getBaseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
}

const task1Adapter = new FileSync(path.join(task1Path, 'db/db.json'));
const task1Db = low(task1Adapter);
task1Db.defaults({ urls: [], clicks: [] }).write();

app.post('/api/shorten', (req, res) => {
  const { url, customCode } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Please provide a valid URL.' });
  }

  const existing = task1Db.get('urls').find({ originalUrl: url }).value();
  if (existing && !customCode) {
    return res.json({
      ...existing,
      shortUrl: `${getBaseUrl(req)}/api/redirect/${existing.code}`
    });
  }

  const code = customCode
    ? customCode.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20)
    : nanoid(7);

  if (!code) return res.status(400).json({ error: 'Invalid custom code.' });

  const clash = task1Db.get('urls').find({ code }).value();
  if (clash) return res.status(409).json({ error: 'That custom code is already taken.' });

  const entry = {
    id: nanoid(),
    code,
    originalUrl: url,
    clicks: 0,
    createdAt: new Date().toISOString()
  };

  task1Db.get('urls').push(entry).write();

  res.status(201).json({
    ...entry,
    shortUrl: `${getBaseUrl(req)}/api/redirect/${code}`
  });
});

app.get('/api/urls', (req, res) => {
  const urls = task1Db.get('urls').orderBy('createdAt', 'desc').value();
  const base = getBaseUrl(req);
  const result = urls.map(u => ({ ...u, shortUrl: `${base}/api/redirect/${u.code}` }));
  res.json(result);
});

app.get('/api/urls/:code/stats', (req, res) => {
  const entry = task1Db.get('urls').find({ code: req.params.code }).value();
  if (!entry) return res.status(404).json({ error: 'Short URL not found.' });
  const clickLog = task1Db.get('clicks').filter({ code: req.params.code }).value();
  res.json({ ...entry, shortUrl: `${getBaseUrl(req)}/api/redirect/${entry.code}`, clickLog });
});

app.delete('/api/urls/:code', (req, res) => {
  const entry = task1Db.get('urls').find({ code: req.params.code }).value();
  if (!entry) return res.status(404).json({ error: 'Not found.' });
  task1Db.get('urls').remove({ code: req.params.code }).write();
  task1Db.get('clicks').remove({ code: req.params.code }).write();
  res.json({ message: 'Deleted.' });
});

app.get('/api/redirect/:code', (req, res) => {
  const { code } = req.params;
  const entry = task1Db.get('urls').find({ code }).value();
  if (!entry) return res.status(404).json({ error: 'Short URL not found.' });

  task1Db.get('urls').find({ code }).assign({ clicks: (entry.clicks || 0) + 1 }).write();
  task1Db.get('clicks').push({ code, timestamp: new Date().toISOString(), referer: req.get('Referer') || 'direct' }).write();

  res.redirect(301, entry.originalUrl);
});

// Serve Task 1 frontend
app.use('/task1', express.static(task1Path));

// ═══════════════════════════════════════════════════════
// ── TASK 2: EVENT REGISTRATION ───────────────────────
// ═══════════════════════════════════════════════════════
const task2Path = path.join(__dirname, 'task2-events');
const JWT_SECRET = process.env.JWT_SECRET || 'codealpha_secret_2025';

const task2Adapter = new FileSync(path.join(task2Path, 'db/db.json'));
const task2Db = low(task2Adapter);
task2Db.defaults({ users: [], events: [], registrations: [] }).write();

function task2Auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided.' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

if (!task2Db.get('events').value().length) {
  const now = Date.now();
  task2Db.get('events').push(
    { id: 'e1', title: 'Tech Summit 2025', description: 'Annual technology conference featuring keynotes, workshops, and networking.', date: new Date(now + 86400000 * 7).toISOString().slice(0,10), time: '09:00', location: 'Durban ICC, Durban', capacity: 200, category: 'Conference', organizer: 'CodeAlpha', createdAt: new Date().toISOString() },
    { id: 'e2', title: 'Full Stack Workshop', description: 'Hands-on workshop covering React, Node.js and deployment best practices.', date: new Date(now + 86400000 * 14).toISOString().slice(0,10), time: '10:00', location: 'Innovation Hub, Cape Town', capacity: 40, category: 'Workshop', organizer: 'CodeAlpha', createdAt: new Date().toISOString() },
    { id: 'e3', title: 'Startup Pitch Night', description: 'Watch the top 10 SA startups pitch to a panel of investors. Networking to follow.', date: new Date(now + 86400000 * 21).toISOString().slice(0,10), time: '18:00', location: 'Workshop17, Johannesburg', capacity: 80, category: 'Networking', organizer: 'CodeAlpha', createdAt: new Date().toISOString() },
    { id: 'e4', title: 'AI & Machine Learning Bootcamp', description: 'Three-day intensive on Python, scikit-learn, TensorFlow and real-world ML projects.', date: new Date(now + 86400000 * 30).toISOString().slice(0,10), time: '08:30', location: 'Online (Zoom)', capacity: 100, category: 'Bootcamp', organizer: 'CodeAlpha', createdAt: new Date().toISOString() }
  ).write();
}

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required.' });
  if (task2Db.get('users').find({ email }).value()) return res.status(409).json({ error: 'Email already registered.' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: 'u' + Date.now(), name, email, passwordHash: hash, role: 'user', createdAt: new Date().toISOString() };
  task2Db.get('users').push(user).write();
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = task2Db.get('users').find({ email }).value();
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/events', (req, res) => {
  const { category, search } = req.query;
  let events = task2Db.get('events').orderBy('date', 'asc').value();
  if (category) events = events.filter(e => e.category === category);
  if (search) events = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()));
  const result = events.map(e => ({
    ...e,
    registered: task2Db.get('registrations').filter({ eventId: e.id }).value().length,
    spotsLeft: e.capacity - task2Db.get('registrations').filter({ eventId: e.id }).value().length
  }));
  res.json(result);
});

app.get('/api/events/:id', (req, res) => {
  const event = task2Db.get('events').find({ id: req.params.id }).value();
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  const registered = task2Db.get('registrations').filter({ eventId: event.id }).value().length;
  res.json({ ...event, registered, spotsLeft: event.capacity - registered });
});

app.post('/api/events', task2Auth, (req, res) => {
  const { title, description, date, time, location, capacity, category } = req.body;
  if (!title || !date || !location || !capacity) return res.status(400).json({ error: 'title, date, location and capacity are required.' });
  const event = { id: 'e' + Date.now(), title, description: description || '', date, time: time || '09:00', location, capacity: parseInt(capacity), category: category || 'General', organizer: req.user.name, createdAt: new Date().toISOString() };
  task2Db.get('events').push(event).write();
  res.status(201).json(event);
});

app.delete('/api/events/:id', task2Auth, (req, res) => {
  const event = task2Db.get('events').find({ id: req.params.id }).value();
  if (!event) return res.status(404).json({ error: 'Not found.' });
  task2Db.get('events').remove({ id: req.params.id }).write();
  task2Db.get('registrations').remove({ eventId: req.params.id }).write();
  res.json({ message: 'Event deleted.' });
});

app.post('/api/registrations', task2Auth, (req, res) => {
  const { eventId } = req.body;
  const event = task2Db.get('events').find({ id: eventId }).value();
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  const alreadyRegistered = task2Db.get('registrations').find({ eventId, userId: req.user.id }).value();
  if (alreadyRegistered) return res.status(409).json({ error: 'You are already registered for this event.' });
  const count = task2Db.get('registrations').filter({ eventId }).value().length;
  if (count >= event.capacity) return res.status(400).json({ error: 'This event is fully booked.' });
  const reg = { id: 'r' + Date.now(), userId: req.user.id, userName: req.user.name, userEmail: req.user.email, eventId, eventTitle: event.title, status: 'confirmed', registeredAt: new Date().toISOString() };
  task2Db.get('registrations').push(reg).write();
  res.status(201).json(reg);
});

app.get('/api/registrations/my', task2Auth, (req, res) => {
  const regs = task2Db.get('registrations').filter({ userId: req.user.id }).value();
  const result = regs.map(r => {
    const event = task2Db.get('events').find({ id: r.eventId }).value();
    return { ...r, event };
  });
  res.json(result);
});

app.delete('/api/registrations/:id', task2Auth, (req, res) => {
  const reg = task2Db.get('registrations').find({ id: req.params.id, userId: req.user.id }).value();
  if (!reg) return res.status(404).json({ error: 'Registration not found.' });
  task2Db.get('registrations').remove({ id: req.params.id }).write();
  res.json({ message: 'Registration cancelled.' });
});

app.get('/api/admin/registrations', task2Auth, (req, res) => {
  const regs = task2Db.get('registrations').value();
  res.json(regs);
});

app.use('/task2', express.static(path.join(task2Path, 'public')));

// ═══════════════════════════════════════════════════════
// ── TASK 3: RESTAURANT MANAGEMENT ────────────────────
// ═══════════════════════════════════════════════════════
const task3Path = path.join(__dirname, 'task3-restaurant');

const task3Adapter = new FileSync(path.join(task3Path, 'db/db.json'));
const task3Db = low(task3Adapter);
task3Db.defaults({ menu: [], orders: [], tables: [], reservations: [], inventory: [] }).write();

if (!task3Db.get('menu').value().length) {
  task3Db.get('menu').push(
    { id: 'm1', name: 'Grilled Salmon', category: 'Main', price: 25.99, available: true },
    { id: 'm2', name: 'Pasta Carbonara', category: 'Main', price: 15.99, available: true },
    { id: 'm3', name: 'Caesar Salad', category: 'Starter', price: 8.99, available: true },
    { id: 'm4', name: 'Cheesecake', category: 'Dessert', price: 6.99, available: true }
  ).write();
}

if (!task3Db.get('tables').value().length) {
  task3Db.get('tables').push(
    { id: 't1', name: 'Table 1', capacity: 2, status: 'available' },
    { id: 't2', name: 'Table 2', capacity: 4, status: 'available' },
    { id: 't3', name: 'Table 3', capacity: 6, status: 'available' }
  ).write();
}

app.get('/api/menu', (req, res) => {
  const { category } = req.query;
  let menu = task3Db.get('menu').value();
  if (category) menu = menu.filter(m => m.category === category);
  res.json(menu);
});

app.post('/api/menu', (req, res) => {
  const { name, category, price } = req.body;
  if (!name || !category || price === undefined) return res.status(400).json({ error: 'Missing fields.' });
  const item = { id: 'm' + Date.now(), name, category, price, available: true };
  task3Db.get('menu').push(item).write();
  res.status(201).json(item);
});

app.patch('/api/menu/:id', (req, res) => {
  const item = task3Db.get('menu').find({ id: req.params.id }).value();
  if (!item) return res.status(404).json({ error: 'Not found.' });
  task3Db.get('menu').find({ id: req.params.id }).assign(req.body).write();
  res.json(task3Db.get('menu').find({ id: req.params.id }).value());
});

app.delete('/api/menu/:id', (req, res) => {
  task3Db.get('menu').remove({ id: req.params.id }).write();
  res.json({ message: 'Deleted.' });
});

app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  let orders = task3Db.get('orders').orderBy('createdAt', 'desc').value();
  if (status) orders = orders.filter(o => o.status === status);
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { items, tableId } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Items required.' });
  const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const order = { id: 'o' + Date.now(), items, tableId: tableId || null, total, status: 'pending', createdAt: new Date().toISOString() };
  task3Db.get('orders').push(order).write();
  res.status(201).json(order);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const order = task3Db.get('orders').find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: 'Not found.' });
  task3Db.get('orders').find({ id: req.params.id }).assign({ status: req.body.status }).write();
  res.json(task3Db.get('orders').find({ id: req.params.id }).value());
});

app.get('/api/tables', (req, res) => {
  res.json(task3Db.get('tables').value());
});

app.patch('/api/tables/:id', (req, res) => {
  const table = task3Db.get('tables').find({ id: req.params.id }).value();
  if (!table) return res.status(404).json({ error: 'Not found.' });
  task3Db.get('tables').find({ id: req.params.id }).assign(req.body).write();
  res.json(task3Db.get('tables').find({ id: req.params.id }).value());
});

app.get('/api/reservations', (req, res) => {
  res.json(task3Db.get('reservations').value());
});

app.post('/api/reservations', (req, res) => {
  const { name, email, date, time, guests } = req.body;
  if (!name || !date || !guests) return res.status(400).json({ error: 'Missing fields.' });
  const reservation = { id: 'rs' + Date.now(), name, email, date, time, guests, status: 'confirmed', createdAt: new Date().toISOString() };
  task3Db.get('reservations').push(reservation).write();
  res.status(201).json(reservation);
});

app.delete('/api/reservations/:id', (req, res) => {
  task3Db.get('reservations').remove({ id: req.params.id }).write();
  res.json({ message: 'Deleted.' });
});

app.get('/api/inventory', (req, res) => {
  res.json(task3Db.get('inventory').value());
});

app.patch('/api/inventory/:id', (req, res) => {
  const inv = task3Db.get('inventory').find({ id: req.params.id }).value();
  if (!inv) return res.status(404).json({ error: 'Not found.' });
  task3Db.get('inventory').find({ id: req.params.id }).assign(req.body).write();
  res.json(task3Db.get('inventory').find({ id: req.params.id }).value());
});

app.get('/api/reports/daily', (req, res) => {
  const orders = task3Db.get('orders').value();
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  res.json({ revenue, totalOrders: orders.length, date: new Date().toISOString().slice(0,10) });
});

app.use('/task3', express.static(path.join(task3Path, 'public')));

// ═══════════════════════════════════════════════════════
// ── START SERVER ──────────────────────────────────────
// ═══════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     CodeAlpha Backend Hub — Running              ║
║     http://localhost:${PORT}                         ║
║                                                   ║
║  🏠 Hub        → http://localhost:${PORT}/            ║
║  🔗 Task 1     → http://localhost:${PORT}/task1       ║
║  🎟️  Task 2     → http://localhost:${PORT}/task2       ║
║  🍽️  Task 3     → http://localhost:${PORT}/task3       ║
║                                                   ║
║  All APIs available at /api/*                    ║
╚═══════════════════════════════════════════════════╝
  `);
});
