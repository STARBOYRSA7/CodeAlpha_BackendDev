'use strict';
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Temporary Storage for Task 1
let urls = {}; 

// ═══════════════════════════════════════════════════════
// ── 1. THE HUB (MAIN LANDING PAGE) ────────────────────
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
    res.sendFile(path.join(task1Dir, 'public', 'index.html'));
});

// Task 1 API & Redirect Logic
app.post('/api/shorten', (req, res) => {
    const { url } = req.body;
    const shortId = Math.random().toString(36).substring(2, 8);
    urls[shortId] = url;
    res.status(201).json({ shortUrl: `${req.protocol}://${req.get('host')}/api/redirect/${shortId}` });
});

app.get('/api/redirect/:id', (req, res) => {
    const originalUrl = urls[req.params.id];
    if (originalUrl) {
        res.redirect(originalUrl);
    } else {
        res.status(404).send('URL not found');
    }
});

// ═══════════════════════════════════════════════════════
// ── 3. TASK 2: EVENT REGISTRATION ─────────────────────
// ═══════════════════════════════════════════════════════
const task2Dir = path.join(__dirname, 'task2-events');
app.use('/task2', express.static(path.join(task2Dir, 'public')));

app.get('/task2', (req, res) => {
    res.sendFile(path.join(task2Dir, 'public', 'index.html'));
});

app.get('/api/events', (req, res) => {
    res.json([{ id: 1, name: "CodeAlpha Tech Meetup", date: "2026-06-10" }]);
});

// ═══════════════════════════════════════════════════════
// ── 4. TASK 3: RESTAURANT MANAGEMENT ──────────────────
// ═══════════════════════════════════════════════════════
const task3Dir = path.join(__dirname, 'task3-restaurant');
app.use('/task3', express.static(path.join(task3Dir, 'public')));

app.get('/task3', (req, res) => {
    res.sendFile(path.join(task3Dir, 'public', 'index.html'));
});

app.get('/api/menu', (req, res) => {
    res.json([{ id: 101, item: "Quarter Pounder", price: 5.99 }]);
});

// ═══════════════════════════════════════════════════════
// ── 5. ERROR HANDLING & START SERVER ──────────────────
// ═══════════════════════════════════════════════════════
app.get('*', (req, res) => {
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`🚀 Master Server Active on Port ${PORT}`);
});