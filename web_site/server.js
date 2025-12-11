// server.js

const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken'); 
const app = express();

const axios = require('axios');
const https = require('https');
const { console } = require('inspector');
const cors = require('cors');

const httpsAgent = new https.Agent({  
  rejectUnauthorized: false 
});

const PORT = process.env.PORT || 3000;
//const AUTH_SERVICE_URL = "http://localhost:4545" // Imposter
const AUTH_SERVICE_URL = "https://localhost:7181" // RestAPI

//const { getDataFromAPI } = require('./helper_funtions.js');


// Hardcoded for testing. Use an environment variable in production!
const SECRET_KEY = 'YOUR_SUPER_SECRET_KEY_12345'; 


// Helper funtions
async function getDataFromAPI(url, token, username) {
    console.log("get func -> URL: " + url + " - User: " + username)
    const config = {
        headers: {
            'authorization': `Bearer ${token}`,
            'username': username,
            'Content-Type': 'application/json'
        }
    };

    try {
        // Axios handles the 'GET' method by default if you use .get()
        //const response = await axios.get(url, config); // for Tokens in headers
        //const response = await axios.get(url, config); // unsave version

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
            //body: JSON.stringify({ username, password })
        });

        // Axios stores the parsed JSON in the .data property
        return response.data;
        
    } catch (error) {
        // Axios errors provide more context (status code, server response, etc.)
        if (error.response) {
            // The request was made and the server responded with a status code
            console.error(`API Error: ${error.response.status} - ${error.response.data}`);
        } else {
            // Something happened in setting up the request
            console.error('Request setup failed:', error.message);
        }
        throw error; // Re-throwing allows the caller to handle the failure
    }
}






// --- JWT Authentication Middleware ---
function authenticateToken(req, res, next) {
    /*const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden (Invalid token)
        req.user = user; 
        next(); 
    });*/
    /*const authHeader = req.headers['authorization'];
    
    // Just check if the Bearer token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
    }*/

    // Pass the request along without verifying locally
    next();
}

app.use(cors({
    origin: '*', // For testing; use your actual domain in production
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'authorization', 'username']
}));

// Middleware for parsing JSON bodies
app.use(express.json());

// 1. Serve ALL static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// Login API Calls
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log("Node: " + username + " - " + password);

        // Forwarding the request to the upstream RestAPI
        const response = await axios.post( AUTH_SERVICE_URL + "/api/login", {
            username,
            password
        }, { httpsAgent });

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

    } catch (error) {
        console.error("Upstream Error:", error.message);
        res.status(error.response?.status || 500).json({
            message: "Authentication failed",
            error: error.message
        });
    }
});



/*app.get('/api/data', authenticateToken, (req, res) => {
    // This runs only if the token is valid
    res.json({ 
        message: `Bem-vindo(a), ${req.user.username}!`, 
        data: 'Dados Confidenciais do Armazém' 
    });
});

app.get('/api/getproducts', authenticateToken, async (req, res) => {
    // This runs only if the token is valid

    /*data = getDataFromAPI("/api/getproducts", token, username)

    res.json({ 
        message: `Bem-vindo(a), ${req.user.username}!`, 
        data: 'Dados Confidenciais do Armazém' 
    });*/

    /*console.log("Node: api/getproducts:")

    // req.user is populated by authenticateToken middleware
    const token = req.headers['authorization'].split(' ')[1];
    const username = req.headers['username'];
    //const username = req.user.username;

    console.log("Node: " + username + " - " + token);

    const data = await getDataFromAPI(AUTH_SERVICE_URL + "/api/getproducts", token, username);
    res.json(data);

    console.log("Node: Forwarding request to .NET RestAPI...");

    try {
        // Get headers sent from the JS frontend
        const token = req.headers['authorization'].split(' ')[1];
        const username = req.headers['username']; // Get custom header

        // Forward everything to your .NET backend
        const data = await getDataFromAPI(
            AUTH_SERVICE_URL + "/api/getproducts", 
            token, 
            username
        );

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Upstream server error" });
    }
});

app.get('/api/getstores', authenticateToken, (req, res) => {
    // This runs only if the token is valid

    data = getDataFromAPI(AUTH_SERVICE_URL + "/api/getproducts", token, username)

    res.json({ 
        message: `Bem-vindo(a), ${req.user.username}!`, 
        data: 'Dados Confidenciais do Armazém' 
    });
});*/



// UnSave Endpoints Becase I hate wasting days debuging ghosts! -.-'

// Get Data

app.get('/api/getproducts', async (req, res) => {
    console.log("Node [getproducts]: Fetching products from .NET (No Token)...");

    try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/api/usgetproducts`, {
            // This is required because you are using https and localhost
            httpsAgent: httpsAgent, 
            headers: { 
                'Content-Type': 'application/json' 
            }
        });

        // Send the data back to your browser
        res.status(200).json(response.data);

    } catch (error) {
        // Detailed logging in your terminal
        if (error.response) {
            console.error(".NET Server returned error:", error.response.status);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error("Connection Error:", error.message);
            res.status(500).json({ error: "Could not connect to .NET API" });
        }
    }
});

app.get('/api/getstores', async (req, res) => {
    console.log("Node: Fetching products from .NET (No Token)...");

    try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/api/usgetstores`, {
            // This is required because you are using https and localhost
            httpsAgent: httpsAgent, 
            headers: { 
                'Content-Type': 'application/json' 
            }
        });

        // Send the data back to your browser
        res.status(200).json(response.data);

    } catch (error) {
        // Detailed logging in your terminal
        if (error.response) {
            console.error(".NET Server returned error:", error.response.status);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error("Connection Error:", error.message);
            res.status(500).json({ error: "Could not connect to .NET API" });
        }
    }
});

app.get('/api/getinventory', async (req, res) => {
    console.log("Node: Fetching Inventory from .NET (No Token)...");

    try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/api/usgetstock`, {
            // This is required because you are using https and localhost
            httpsAgent: httpsAgent, 
            headers: { 
                'Content-Type': 'application/json' 
            }
        });

        // Send the data back to your browser
        res.status(200).json(response.data);

    } catch (error) {
        // Detailed logging in your terminal
        if (error.response) {
            console.error(".NET Server returned error:", error.response.status);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error("Connection Error:", error.message);
            res.status(500).json({ error: "Could not connect to .NET API" });
        }
    }
});

app.get('/api/getcategories', async (req, res) => {
    console.log("Node: Fetching Inventory from .NET (No Token)...");

    try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/api/usgetcategories`, {
            // This is required because you are using https and localhost
            httpsAgent: httpsAgent, 
            headers: { 
                'Content-Type': 'application/json' 
            }
        });

        // Send the data back to your browser
        res.status(200).json(response.data);

    } catch (error) {
        // Detailed logging in your terminal
        if (error.response) {
            console.error(".NET Server returned error:", error.response.status);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error("Connection Error:", error.message);
            res.status(500).json({ error: "Could not connect to .NET API" });
        }
    }
});


// Insert Data (work in progress)

app.post('/api/addproduct', async (req, res) => {
    try {
        const { proName, catId } = req.body;

        //console.log(`Node [addproduct]: ${proName} - ${catId}`);

        // Forwarding the request to the upstream RestAPI
        const response = await axios.post(
            AUTH_SERVICE_URL + "/api/usaddproduct", 
            { name: proName, idcategory: catId }, 
            { httpsAgent }
        );

        // Success: Forward the exact status code and data from the C# API
        // This handles 200 OK, 201 Created, etc.
        res.status(response.status).json(response.data);
        
    } catch (error) {
        // --- IMPROVED ERROR HANDLING ---
        
        // Log the error detail for the Node.js server
        //console.error("Upstream Error:", error.message);

        // Extract the status and data from the C# API's response error
        const status = error.response?.status || 500;
        
        // Default message for errors without a C# response (e.g., network failure)
        const data = error.response?.data || { 
            message: `Failed to connect to C# API: ${error.message}` 
        };

        // Forward the correct status and the error data to the frontend
        res.status(status).json(data);
    }
});

app.post('/api/addcategory', async (req, res) => {
    try {
        const { name: catName } = req.body;

        console.log(`Node [addcategory]: ${catName}`);

        // Forwarding the request to the upstream RestAPI
        const response = await axios.post(
            AUTH_SERVICE_URL + "/api/usaddcategory", 
            { name: catName }, 
            { httpsAgent }
        );

        // Success: Forward the exact status code and data from the C# API
        // This handles 200 OK, 201 Created, etc.
        res.status(response.status).json(response.data);
        
    } catch (error) {
        // --- IMPROVED ERROR HANDLING ---
        
        // Log the error detail for the Node.js server
        console.error("Upstream Error:", error.message);

        // Extract the status and data from the C# API's response error
        const status = error.response?.status || 500;
        
        // Default message for errors without a C# response (e.g., network failure)
        const data = error.response?.data || { 
            message: `Failed to connect to C# API: ${error.message}` 
        };

        // Forward the correct status and the error data to the frontend
        res.status(status).json(data);
    }
});

// Update Data (work in progress)
app.post('/api/updatestock', async (req, res) => {
    try {
        const { idstore, idproduct, quant } = req.body;

        console.log(`Node [updatestock]: ${idstore}, ${idproduct}, ${quant}`);

        // Forwarding the request to the upstream RestAPI
        const response = await axios.post(
            AUTH_SERVICE_URL + "/api/usupdatestock", 
            { idstore, idproduct, quant }, 
            { httpsAgent }
        );

        // Success: Forward the exact status code and data from the C# API
        // This handles 200 OK, 201 Created, etc.
        res.status(response.status).json(response.data);
        
    } catch (error) {
        // --- IMPROVED ERROR HANDLING ---
        
        // Log the error detail for the Node.js server
        console.error("Upstream Error:", error.message);

        // Extract the status and data from the C# API's response error
        const status = error.response?.status || 500;
        
        // Default message for errors without a C# response (e.g., network failure)
        const data = error.response?.data || { 
            message: `Failed to connect to C# API: ${error.message}` 
        };

        // Forward the correct status and the error data to the frontend
        res.status(status).json(data);
    }
});




// Page Routing!


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

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'products.html'));
});

app.get('/inventory', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'inventory.html'));
});

app.get('/add_product', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'add_product.html'));
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});