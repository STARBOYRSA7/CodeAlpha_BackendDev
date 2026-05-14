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

const task1Adapter = new FileSync(path.join(task1Path, 'db/db.json'));
const task1Db = low(task1Adapter);
task1Db.defaults({ urls: [], clicks: [] }).write();

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

function getBaseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
}

// API Routes
app.post('/api/shorten', (req, res) => {
  const { url, customCode } = req.body;
  if (!url || !isValidUrl(url)) return res.status(400).json({ error: 'Valid URL required.' });
  const code = customCode ? customCode.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20) : nanoid(7);
  if (task1Db.get('urls').find({ code }).value()) return res.status(409).json({ error: 'Code taken.' });
  const entry = { id: nanoid(), code, originalUrl: url, clicks: 0, createdAt: new Date().toISOString() };
  task1Db.get('urls').push(entry).write();
  res.status(201).json({ ...entry, shortUrl: `${getBaseUrl(req)}/api/redirect/${code}` });
});

app.get('/api/redirect/:code', (req, res) => {
  const entry = task1Db.get('urls').find({ code: req.params.code }).value();
  if (!entry) return res.status(404).send('Not Found');
  task1Db.get('urls').find({ code: req.params.code }).assign({ clicks: (entry.clicks || 0) + 1 }).write();
  res.redirect(301, entry.originalUrl);
});

// Frontend Routing
app.get('/task1', (req, res) => res.sendFile(path.join(task1Path, 'index.html')));
app.use('/task1', express.static(task1Path));

// ═══════════════════════════════════════════════════════
// ── TASK 2: EVENT REGISTRATION ───────────────────────
// ═══════════════════════════════════════════════════════
const task2Path = path.join(__dirname, 'task2-events');
const JWT_SECRET = process.env.JWT_SECRET || 'codealpha_secret_2025';

const task2Adapter = new FileSync(path.join(task2Path, 'db/db.json'));
const task2Db = low(task2Adapter);
task2Db.defaults({ users: [], events: [], registrations: [] }).write();

// API Routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = { id: 'u' + Date.now(), name, email, passwordHash: hash, role: 'user' };
  task2Db.get('users').push(user).write();
  res.status(201).json({ user: { id: user.id, name, email } });
});

app.get('/api/events', (req, res) => {
  res.json(task2Db.get('events').value());
});

// Frontend Routing
app.get('/task2', (req, res) => res.sendFile(path.join(task2Path, 'index.html')));
app.use('/task2', express.static(task2Path));

// ═══════════════════════════════════════════════════════
// ── TASK 3: RESTAURANT MANAGEMENT ────────────────────
// ═══════════════════════════════════════════════════════
const task3Path = path.join(__dirname, 'task3-restaurant');

const task3Adapter = new FileSync(path.join(task3Path, 'db/db.json'));
const task3Db = low(task3Adapter);
task3Db.defaults({ menu: [], orders: [], tables: [], reservations: [] }).write();

// API Routes
app.get('/api/menu', (req, res) => res.json(task3Db.get('menu').value()));

// Frontend Routing
app.get('/task3', (req, res) => res.sendFile(path.join(task3Path, 'index.html')));
app.use('/task3', express.static(task3Path));

// ═══════════════════════════════════════════════════════
// ── START SERVER ──────────────────────────────────────
// ═══════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});'use strict';
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

const task1Adapter = new FileSync(path.join(task1Path, 'db/db.json'));
const task1Db = low(task1Adapter);
task1Db.defaults({ urls: [], clicks: [] }).write();

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

function getBaseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
}

// API Routes
app.post('/api/shorten', (req, res) => {
  const { url, customCode } = req.body;
  if (!url || !isValidUrl(url)) return res.status(400).json({ error: 'Valid URL required.' });
  const code = customCode ? customCode.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20) : nanoid(7);
  if (task1Db.get('urls').find({ code }).value()) return res.status(409).json({ error: 'Code taken.' });
  const entry = { id: nanoid(), code, originalUrl: url, clicks: 0, createdAt: new Date().toISOString() };
  task1Db.get('urls').push(entry).write();
  res.status(201).json({ ...entry, shortUrl: `${getBaseUrl(req)}/api/redirect/${code}` });
});

app.get('/api/redirect/:code', (req, res) => {
  const entry = task1Db.get('urls').find({ code: req.params.code }).value();
  if (!entry) return res.status(404).send('Not Found');
  task1Db.get('urls').find({ code: req.params.code }).assign({ clicks: (entry.clicks || 0) + 1 }).write();
  res.redirect(301, entry.originalUrl);
});

// Frontend Routing
app.get('/task1', (req, res) => res.sendFile(path.join(task1Path, 'index.html')));
app.use('/task1', express.static(task1Path));

// ═══════════════════════════════════════════════════════
// ── TASK 2: EVENT REGISTRATION ───────────────────────
// ═══════════════════════════════════════════════════════
const task2Path = path.join(__dirname, 'task2-events');
const JWT_SECRET = process.env.JWT_SECRET || 'codealpha_secret_2025';

const task2Adapter = new FileSync(path.join(task2Path, 'db/db.json'));
const task2Db = low(task2Adapter);
task2Db.defaults({ users: [], events: [], registrations: [] }).write();

// API Routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = { id: 'u' + Date.now(), name, email, passwordHash: hash, role: 'user' };
  task2Db.get('users').push(user).write();
  res.status(201).json({ user: { id: user.id, name, email } });
});

app.get('/api/events', (req, res) => {
  res.json(task2Db.get('events').value());
});

// Frontend Routing
app.get('/task2', (req, res) => res.sendFile(path.join(task2Path, 'index.html')));
app.use('/task2', express.static(task2Path));

// ═══════════════════════════════════════════════════════
// ── TASK 3: RESTAURANT MANAGEMENT ────────────────────
// ═══════════════════════════════════════════════════════
const task3Path = path.join(__dirname, 'task3-restaurant');

const task3Adapter = new FileSync(path.join(task3Path, 'db/db.json'));
const task3Db = low(task3Adapter);
task3Db.defaults({ menu: [], orders: [], tables: [], reservations: [] }).write();

// API Routes
app.get('/api/menu', (req, res) => res.json(task3Db.get('menu').value()));

// Frontend Routing
app.get('/task3', (req, res) => res.sendFile(path.join(task3Path, 'index.html')));
app.use('/task3', express.static(task3Path));

// ═══════════════════════════════════════════════════════
// ── START SERVER ──────────────────────────────────────
// ═══════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});