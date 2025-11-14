const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Serve static files (HTML, CSS, JS) from the 'public' directory
// This must come BEFORE your API routes!
app.use(express.static(path.join(__dirname, 'public')));



// 2. Define your REST API routes (e.g., for JWT auth and data)
// These routes should typically start with a prefix like /api
app.get('/api/data', (req, res) => {
    // This is where you'd fetch data, check JWT, and send JSON
    res.json({ message: 'Data from your REST API' });
});



// 3. Simple HTML page routing (optional - useful for multi-page apps)
// If a user navigates to a specific page path, you send the corresponding HTML file.
app.get('/', (req, res) => {
    // check token, if logedin -> index ELSE -> Login page
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});