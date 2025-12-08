const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken'); 
const app = express();

const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({  
  rejectUnauthorized: false 
});

const PORT = process.env.PORT || 3000;
//const AUTH_SERVICE_URL = "http://localhost:4545"
const AUTH_SERVICE_URL = "https://localhost:7181"

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
    try {
        const { username, password } = req.body;

        console.log("Node: " + username + " - " + password);

        // Forwarding the request to the upstream RestAPI
        const response = await axios.post( AUTH_SERVICE_URL + "/api/login", {
            username,
            password
        }, { httpsAgent });

        // If successful, pass the token back to the browser
        /*res.status(200).json({
            message: "Login successful!",
            token: response.data.token,
            username: response.data.username
        });*/
        //res.cookie('token', response.data.token, { httpOnly: true });
        //res.redirect('/');
        /*res.status(200).json({
            message: "Authentication OK"
        });*/

        if (response.status === 200)
        {
            res.status(response.status).json({
                message: "All Good:" + " " + response.data["token"],
                token: response.data["token"]
            });
        }
        else
        {
            res.status(response.status).json({
                message: "Wrong user / pass",
                token: "Null"
            });
        }

        
        //res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));

    } catch (error) {
        console.error("Upstream Error:", error.message);
        res.status(error.response?.status || 500).json({
            message: "Authentication failed",
            error: error.message
        });
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
    if (true)
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