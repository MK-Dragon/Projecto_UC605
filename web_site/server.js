const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken'); 
const app = express();
const PORT = process.env.PORT || 3000;

// Hardcoded for testing. Use an environment variable in production!
const SECRET_KEY = 'YOUR_SUPER_SECRET_KEY_12345'; 

// Middleware for parsing JSON bodies
app.use(express.json());

// --- JWT Authentication Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden (Invalid token)
        req.user = user; 
        next(); 
    });
}

// 1. Serve ALL static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// 2. Define REST API routes 
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // !!! Hardcoded User Check for Testing !!!
    // The successful user for testing is: testuser / password123
    if (username === 'testuser' && password === 'password123') {
        const userPayload = { id: 1, username: username };
        const token = jwt.sign(userPayload, SECRET_KEY, { expiresIn: '1h' }); 
        return res.json({ message: 'Login successful', token: token });
    } else {
        return res.status(401).json({ message: 'Credenciais inválidas' });
    }
});

app.get('/api/data', authenticateToken, (req, res) => {
    // This runs only if the token is valid
    res.json({ 
        message: `Bem-vindo(a), ${req.user.username}!`, 
        data: 'Dados Confidenciais do Armazém' 
    });
});


// 3. HTML page routing (Adjusted paths to 'public/pages')
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});