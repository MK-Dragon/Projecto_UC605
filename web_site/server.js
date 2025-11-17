// server.js

const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken'); // Import JWT library
const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Use a strong, random key in a secure environment variable!
const SECRET_KEY = 'YOUR_SUPER_SECRET_KEY_12345'; 

// Middleware for parsing JSON bodies from POST requests
app.use(express.json());

// --- JWT Authentication Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Expected format: "Bearer <TOKEN>"
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden (Invalid token)
        req.user = user; // The decoded payload (e.g., { id: 1 }) is attached to the request
        next(); // Proceed to the protected route
    });
}

// 1. Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// 2. Define your REST API routes 
// --- LOGIN ROUTE ---
app.post('/api/login', (req, res) => {
    // 1. Get credentials from the request body
    const { username, password } = req.body;

    // TODO: In a real app, you would check these credentials against a database
    // For this example, we'll use a hardcoded check:
    if (username === 'testuser' && password === 'password123') {
        // 2. Create the JWT payload (don't include sensitive data like password!)
        const userPayload = { id: 1, username: username };
        
        // 3. Generate the token
        const token = jwt.sign(userPayload, SECRET_KEY, { expiresIn: '1h' }); 
        
        // 4. Send the token back to the client
        return res.json({ message: 'Login successful', token: token });
    } else {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
});

// --- PROTECTED DATA ROUTE ---
app.get('/api/data', authenticateToken, (req, res) => {
    // This route will only execute if the token is valid!
    res.json({ 
        message: `Welcome ${req.user.username}!`, 
        data: 'This is the confidential data from your REST API.' 
    });
});

// 3. Simple HTML page routing (optional - useful for multi-page apps)
// NOTE: For a simple check like 'check token, if logged in -> index ELSE -> Login page',
// this logic is usually handled on the client-side (in your main.js script).
// The server just sends the page.
app.get('/', (req, res) => {
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