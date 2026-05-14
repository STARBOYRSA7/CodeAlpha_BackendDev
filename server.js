'use strict';
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════
// ── 1. HUB (HOME PAGE) ────────────────────────────────
// ═══════════════════════════════════════════════════════
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ═══════════════════════════════════════════════════════
// ── 2. TASK 1: URL SHORTENER ──────────────────────────
// ═══════════════════════════════════════════════════════
const task1Dir = path.join(__dirname, 'task1-urlshortener');
app.use('/task1', express.static(path.join(task1Dir, 'public')));

app.get('/task1', (req, res) => {
    res.sendFile(path.join(task1Dir, 'public/index.html'));
});

// Task 1 API Logic
let urls = {}; // Temporary storage (Reset on server restart)
app.post('/api/shorten', (req, res) => {
    const { url } = req.body;
    const id = Math.random().toString(36).substring(2, 8);
    urls[id] = url;
    res.json({ shortUrl: `${req.protocol}://${req.get('host')}/api/redirect/${id}` });
});

app.get('/api/redirect/:id', (req, res) => {
    const originalUrl = urls[req.params.id];
    if (originalUrl) res.redirect(originalUrl);
    else res.status(404).send('URL not found');
});

// ═══════════════════════════════════════════════════════
// ── 3. TASK 2: EVENT REGISTRATION ─────────────────────
// ═══════════════════════════════════════════════════════
const task2Dir = path.join(__dirname, 'task2-events');
app.use('/task2', express.static(path.join(task2Dir, 'public')));

app.get('/task2', (req, res) => {
    res.sendFile(path.join(task2Dir, 'public/index.html'));
});

// Task 2 API Logic
app.get('/api/events', (req, res) => {
    res.json([{ id: 1, name: 'Tech Conference 2026', date: '2026-06-15' }]);
});

// ═══════════════════════════════════════════════════════
// ── 4. TASK 3: RESTAURANT MANAGER ─────────────────────
// ═══════════════════════════════════════════════════════
const task3Dir = path.join(__dirname, 'task3-restaurant');
app.use('/task3', express.static(path.join(task3Dir, 'public')));

app.get('/task3', (req, res) => {
    res.sendFile(path.join(task3Dir, 'public/index.html'));
});

// Task 3 API Logic
app.get('/api/menu', (req, res) => {
    res.json([{ id: 1, item: 'Grilled Salmon', price: 25.99 }]);
});

// ═══════════════════════════════════════════════════════
// ── START SERVER ──────────────────────────────────────
// ═══════════════════════════════════════════════════════
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});