const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Serve the Hub (The file at the bottom of your sidebar)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Route to Task 1 Folder
// Note: It will look for 'index.html' inside task1-urlshortener/public or root
app.use('/task1', express.static(path.join(__dirname, 'task1-urlshortener/public')));
app.get('/task1', (req, res) => {
    res.sendFile(path.join(__dirname, 'task1-urlshortener/public/index.html'));
});

// 3. Route to Task 2 Folder
app.use('/task2', express.static(path.join(__dirname, 'task2-events/public')));
app.get('/task2', (req, res) => {
    res.sendFile(path.join(__dirname, 'task2-events/public/index.html'));
});

// 4. Route to Task 3 Folder
app.use('/task3', express.static(path.join(__dirname, 'task3-restaurant/public')));
app.get('/task3', (req, res) => {
    res.sendFile(path.join(__dirname, 'task3-restaurant/public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});