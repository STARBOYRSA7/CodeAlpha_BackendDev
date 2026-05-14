const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Serve everything in the root folder (including index.html)
app.use(express.static(__dirname));

// 2. Explicitly serve the tasks
app.use('/task1', express.static(path.join(__dirname, 'task1-urlshortener')));
app.use('/task2', express.static(path.join(__dirname, 'task2-events')));
app.use('/task3', express.static(path.join(__dirname, 'task3-restaurant')));

// 3. Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});