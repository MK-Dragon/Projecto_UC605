// server.js

const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken'); 
const app = express();

const axios = require('axios');
const https = require('https');
const { console } = require('inspector');
const cors = require('cors');

const session = require('express-session');
app.use(session({
    secret: 'your_secret_key', // Keep your secret key here -> put into file and gitignore LATER! ^_^
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true, 
        // ------------------------------------
        // THIS IS THE CRITICAL CHANGE FOR HTTP
        // ------------------------------------
        secure: false, 
        // OR simply remove the 'secure' property if you're sure it defaults to false
        
        // You might also need to set the sameSite property for older configurations 
        // or if running across different ports (e.g., frontend:3000, backend:8080)
        // sameSite: 'lax' 
    } 
}));
//var USERS

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
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'], //add PUT (Test)
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
            // 1. Setup Session Data
            req.session.isLoggedIn = true;
            req.session.username = username;
            
            // 2. **CRITICAL:** Explicitly save the session and wait for the callback
            req.session.save((err) => {
                if (err) {
                    console.error("Error saving session:", err);
                    return res.status(500).json({ message: "Session save failed" });
                }

                // 3. Send the JSON response *ONLY AFTER* the session is saved
                // The Set-Cookie header will now be guaranteed to be in this response.
                res.status(response.status).json({
                    message: "All Good:" + " " + response.data["token"],
                    token: response.data["token"]
                });
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

app.post('/api/logout', async (req, res) => {
    // 1. ***CRITICAL: GET USERNAME BEFORE DESTROYING SESSION***
    // Check if the session exists and extract the username first.
    let usernameToLogout = null;
    if (req.session && req.session.username) {
        usernameToLogout = req.session.username;
    }

    let upstreamResponseStatus = 200;
    let upstreamResponseMessage = "User is now Logged Out :)";

    try {
        if (usernameToLogout) {
            // 2. FORWARD REQUEST TO UPSTREAM API FIRST
            // This is safe because we have the username, and we haven't destroyed the session yet.
            const response = await axios.post(AUTH_SERVICE_URL + "/api/logout", {
                username: usernameToLogout,
                password: "I'm a Golden GOD!"
            }, { httpsAgent });

            // Store the result of the upstream call
            upstreamResponseStatus = response.status;
            upstreamResponseMessage = "User is now Logged Out :)";

        }

    } catch (error) {
        console.error("Upstream Logout Error:", error.message);
        // Even if the upstream fails, we must continue to destroy the local session
        // to protect the user's security.
        upstreamResponseStatus = error.response?.status || 500;
        upstreamResponseMessage = "Logout failed on upstream service, but local session destroyed.";
    }

    // 3. DESTROY LOCAL SESSION (The asynchronous part)
    // We must wait for this to finish before sending the final response.

    // A utility function to promisify the destroy call is cleaner, but for simplicity:
    if (req.session) {
        req.session.destroy(err => {
            // 4. Send the FINAL response inside the callback
            if (err) {
                console.error("Local session destroy error:", err);
                return res.status(500).json({ message: "Logout failed due to server error." });
            }
            
            // Success: Send the response back to the client
            res.status(200).json({
                message: upstreamResponseMessage
            });
        });
    } else {
        // No session to destroy, just send the final response
        res.status(200).json({
            message: "Already logged out (No active local session)."
        });
    }
    
    // 5. ***CRITICAL: REMOVE THE REDIRECT***
    // The frontend JS handles the redirect to '/login' after receiving this JSON response.
    // res.redirect('/login'); // <-- DO NOT INCLUDE THIS
});

app.get('/api/get-user-data', (req, res) => {
    // Check if the user is authenticated via the session
    if (req.session.isLoggedIn) {
        
        // 1. Compile the session data you want to expose to the client
        const userData = {
            isLoggedIn: true,
            username: req.session.username, // Use the session property directly
            // You can add other session data here:
            // userId: req.session.userId, 
            // role: req.session.userRole,
        };
        
        // 2. Send the data in the JSON response body
        res.json(userData);

    } else {
        // Not authenticated: Send a 401 response
        res.status(401).json({ 
            isLoggedIn: false, 
            message: 'Authentication required to retrieve user data.' 
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

app.post('/api/addstore', async (req, res) => {
    try {
        const { name: storeName } = req.body;

        console.log(`Node [addstore]: ${storeName}`);

        // Forwarding the request to the upstream RestAPI
        const response = await axios.post(
            AUTH_SERVICE_URL + "/api/usaddstore", 
            { name: storeName }, 
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

app.put('/api/updatestock', async (req, res) => {
    try {
        const { idstore, idproduct, stock } = req.body;

        //console.log(`Node [updatestock]: ${idstore}, ${idproduct}, ${quant}`);

        // Forwarding the request to the upstream RestAPI
        const response = await axios.put(
            AUTH_SERVICE_URL + "/api/usupdatestocksum", 
            { idstore, idproduct, stock }, 
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

app.put('/api/updateproduct', async (req, res) => {
    try {
        const { id, name, idcategory } = req.body;

        console.log(`Node [updateproduct]: ${id}, ${name}, ${idcategory}`);

        // Forwarding the request to the upstream RestAPI
        const response = await axios.post(
            AUTH_SERVICE_URL + "/api/usupdateproduct", 
            { id, name, idcategory }, 
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

app.put('/api/updatecategory', async (req, res) => {
    try {
        const { id, name } = req.body;

        console.log(`Node [updatecategory]: ${id}, ${name}`);

        // Forwarding the request to the upstream RestAPI
        const response = await axios.post(
            AUTH_SERVICE_URL + "/api/usupdatecategory", 
            { id, name }, 
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


// ** User Management **

app.post('/api/adduser', async (req, res) => {
    try {
        const { username, password } = req.body;

        //console.log(`Node [addproduct]: ${proName} - ${catId}`);

        // Forwarding the request to the upstream RestAPI
        const response = await axios.post(
            AUTH_SERVICE_URL + "/api/usadduser", 
            { username, password }, 
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


//TEST
  app.post('/api/updateproduct', async (req, res) => { 
    try {
        const { id, name, idcategory } = req.body;

        console.log(`Node [updateproduct POST]: ${id}, ${name}, ${idcategory}`);

        const response = await axios.post(
            AUTH_SERVICE_URL + "/api/usupdateproduct",
            { id, name, idcategory },
            { httpsAgent }
        );

        res.status(response.status).json(response.data);

    } catch (error) {
        console.error("Upstream Error:", error.message);
        res.status(500).json({ message: "Update failed" });
    }
});




// Page Routing!


app.get('/', (req, res) => {
    // If no token or expired -> Login Page
    if (req.session.isLoggedIn)
    {
        res.redirect('/login');
    }
    // else -> index
    else
    {
        res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
    }
});

app.get('/home', (req, res) => {
    if (req.session.isLoggedIn) {
        // The user is logged in, send the actual HTML file
        res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
    } else {
        // The user is NOT logged in, redirect them
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

app.get('/products', (req, res) => {
    if (req.session.isLoggedIn) {
        // The user is logged in, send the actual HTML file
        res.sendFile(path.join(__dirname, 'public', 'pages', 'products.html'));
    } else {
        // The user is NOT logged in, redirect them
        res.redirect('/login');
    }
});

app.get('/inventory', (req, res) => {
    if (req.session.isLoggedIn) {
        // The user is logged in, send the actual HTML file
        res.sendFile(path.join(__dirname, 'public', 'pages', 'inventory.html'));
    } else {
        // The user is NOT logged in, redirect them
        res.redirect('/login');
    }
});

app.get('/add_product', (req, res) => {
    if (req.session.isLoggedIn) {
        // The user is logged in, send the actual HTML file
        res.sendFile(path.join(__dirname, 'public', 'pages', 'add_product.html'));
    } else {
        // The user is NOT logged in, redirect them
        res.redirect('/login');
    }
});

app.get('/manage_stores_cat', (req, res) => {
    if (req.session.isLoggedIn) {
        // The user is logged in, send the actual HTML file
        res.sendFile(path.join(__dirname, 'public', 'pages', 'manage_stores_cat.html'));
    } else {
        // The user is NOT logged in, redirect them
        res.redirect('/login');
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});