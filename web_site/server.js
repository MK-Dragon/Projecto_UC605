const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken'); 
const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL = "http://localhost:4545"

const { getDataFromAPI } = require('./helper_funtions.js');


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
// --- 1. LOGIN ROUTE (CONNECTS TO IMPOSTER) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    // 1. FORWARD CREDENTIALS TO MOUNTEBANK (The Mock Auth Service)
    try {
        const authResponse = await fetch(`${AUTH_SERVICE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        // 2. CHECK MOUNTEBANK'S RESPONSE
        if (authResponse.status === 200) {
            // Mountebank confirmed the credentials are valid!
            
            // 3. GENERATE a fresh, VALID JWT for the client using Express's SECRET_KEY
            const userPayload = { id: 1, username: username }; 
            const token = jwt.sign(userPayload, SECRET_KEY, { expiresIn: '1h' }); 
            
            return res.json({ 
                message: 'Login bem-sucedido', 
                token: token 
            });

        } else if (authResponse.status === 401) {
            // Mountebank returned 401 (Invalid credentials)
            const errorData = await authResponse.json();
            return res.status(401).json({ message: errorData.message || 'Credenciais inválidas' });
        } else {
            // Catch other unexpected status codes from Mountebank
            return res.status(500).json({ message: 'Erro inesperado do serviço de autenticação' });
        }

    } catch (error) {
        // This runs if Mountebank is not running or there is a network error
        console.error('Network Error calling Mountebank:', error);
        return res.status(503).json({ message: 'Serviço de autenticação indisponível (Mountebank down?).' });
    }
});

app.get('/api/data', authenticateToken, (req, res) => {
    // This runs only if the token is valid
    res.json({ 
        message: `Bem-vindo(a), ${req.user.username}!`, 
        data: 'Dados Confidenciais do Armazém' 
    });
});

app.get('/api/getproducts', authenticateToken, (req, res) => {
    // This runs only if the token is valid

    data = getDataFromAPI("/api/getproducts", token, username)

    res.json({ 
        message: `Bem-vindo(a), ${req.user.username}!`, 
        data: 'Dados Confidenciais do Armazém' 
    });
});

app.get('/api/getstores', authenticateToken, (req, res) => {
    // This runs only if the token is valid

    data = getDataFromAPI("/api/getproducts", token, username)

    res.json({ 
        message: `Bem-vindo(a), ${req.user.username}!`, 
        data: 'Dados Confidenciais do Armazém' 
    });
});



// 3. HTML page routing (Adjusted paths to 'public/pages')
app.get('/', (req, res) => {
    // If no token or expired -> Login Page
    if (false)
    {
        res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
    }
    // else -> index
    else
    {
        res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});




// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});