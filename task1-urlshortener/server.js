'use strict';
const express = require('express');
const cors = require('cors');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database ──────────────────────────────────────────
const adapter = new FileSync(path.join(__dirname, 'db/db.json'));
const db = low(adapter);
db.defaults({ urls: [], clicks: [] }).write();

// ── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ───────────────────────────────────────────
function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

function getBaseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
}

// ── API Routes ────────────────────────────────────────

// POST /api/shorten  — create short URL
app.post('/api/shorten', (req, res) => {
  const { url, customCode } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Please provide a valid URL.' });
  }

  // Check if URL already shortened
  const existing = db.get('urls').find({ originalUrl: url }).value();
  if (existing && !customCode) {
    return res.json({
      ...existing,
      shortUrl: `${getBaseUrl(req)}/${existing.code}`
    });
  }

  const code = customCode
    ? customCode.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20)
    : nanoid(7);

  if (!code) return res.status(400).json({ error: 'Invalid custom code.' });

  const clash = db.get('urls').find({ code }).value();
  if (clash) return res.status(409).json({ error: 'That custom code is already taken.' });

  const entry = {
    id: nanoid(),
    code,
    originalUrl: url,
    clicks: 0,
    createdAt: new Date().toISOString()
  };

  db.get('urls').push(entry).write();

  res.status(201).json({
    ...entry,
    shortUrl: `${getBaseUrl(req)}/${code}`
  });
});

// GET /api/urls  — list all shortened URLs
app.get('/api/urls', (req, res) => {
  const urls = db.get('urls').orderBy('createdAt', 'desc').value();
  const base = getBaseUrl(req);
  const result = urls.map(u => ({ ...u, shortUrl: `${base}/${u.code}` }));
  res.json(result);
});

// GET /api/urls/:code/stats  — stats for one URL
app.get('/api/urls/:code/stats', (req, res) => {
  const entry = db.get('urls').find({ code: req.params.code }).value();
  if (!entry) return res.status(404).json({ error: 'Short URL not found.' });
  const clickLog = db.get('clicks').filter({ code: req.params.code }).value();
  res.json({ ...entry, shortUrl: `${getBaseUrl(req)}/${entry.code}`, clickLog });
});

// DELETE /api/urls/:code
app.delete('/api/urls/:code', (req, res) => {
  const entry = db.get('urls').find({ code: req.params.code }).value();
  if (!entry) return res.status(404).json({ error: 'Not found.' });
  db.get('urls').remove({ code: req.params.code }).write();
  db.get('clicks').remove({ code: req.params.code }).write();
  res.json({ message: 'Deleted.' });
});

// GET /:code  — redirect
app.get('/:code', (req, res) => {
  const { code } = req.params;
  if (code === 'index.html' || code === 'favicon.ico') return res.sendFile(path.join(__dirname, 'public/index.html'));

  const entry = db.get('urls').find({ code }).value();
  if (!entry) return res.status(404).sendFile(path.join(__dirname, 'public/index.html'));

  // Log click
  db.get('urls').find({ code }).assign({ clicks: (entry.clicks || 0) + 1 }).write();
  db.get('clicks').push({ code, timestamp: new Date().toISOString(), referer: req.get('Referer') || 'direct' }).write();

  res.redirect(301, entry.originalUrl);
});

app.listen(PORT, () => console.log(`URLShort running on http://localhost:${PORT}`));
