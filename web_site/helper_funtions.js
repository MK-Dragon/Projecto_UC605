/*async function getDataFromAPI(url, token, username) {

    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`, // Template literal (backticks)
            'Username': username,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API call failed:', error);
    }
}*/

/*
import axios from 'axios';


async function getDataFromAPI(url, token, username) {
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Username': username,
            'Content-Type': 'application/json'
        }
    };

    try {
        // Axios handles the 'GET' method by default if you use .get()
        const response = await axios.get(url, config);

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
}*/