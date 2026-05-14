const express = require('express');
const path = require('path');
const app = express();

// This tells the server to use the dynamic port provided by Render
const PORT = process.env.PORT || 10000;

// Serve the index.html file when someone visits the site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hub is running on port ${PORT}`);
});