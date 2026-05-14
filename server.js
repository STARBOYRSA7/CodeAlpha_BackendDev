'use strict';
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. EXPLICITLY DEFINE THE HUB (HOME) FIRST
// This forces Render to show your main page with the 3 cards.
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

// 2. TASK 1: URL SHORTENER
// We use path.resolve to ensure there is no path confusion
const task1Dir = path.resolve(__dirname, 'task1-urlshortener');
app.use('/task1', express.static(task1Dir));
app.get('/task1', (req, res) => {
    res.sendFile(path.join(task1Dir, 'index.html'));
});

// 3. TASK 2: EVENT REGISTRATION
const task2Dir = path.resolve(__dirname, 'task2-events');
app.use('/task2', express.static(task2Dir));
app.get('/task2', (req, res) => {
    res.sendFile(path.join(task2Dir, 'index.html'));
});

// 4. TASK 3: RESTAURANT MANAGER
const task3Dir = path.resolve(__dirname, 'task3-restaurant');
app.use('/task3', express.static(task3Dir));
app.get('/task3', (req, res) => {
    res.sendFile(path.join(task3Dir, 'index.html'));
});

// 5. CATCH-ALL REDIRECT
// If someone types a wrong URL, send them back to the Hub
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next(); // Don't redirect API calls
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Main Hub running on port ${PORT}`);
});