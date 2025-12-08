async function getDataFromAPI(url, token, username) {

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
}