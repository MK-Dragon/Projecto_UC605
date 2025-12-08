// public/js/login.js

/*document.addEventListener('DOMContentLoaded', () => {
    // We now target the form using the ID we added in the HTML
    const form = document.getElementById('loginForm');
    //const btn_login = document.getElementById('btn_login');

    if (form) {
        // Attach the event listener to the form submission
        //form.addEventListener('submit', handleLogin);
    }

});*/

document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('btn_login');

    //console.log("Login clicked!!");

    if (loginButton) {
        loginButton.addEventListener('click', (event) => {
            // Because it's inside a mock form, prevent default behavior
            event.preventDefault(); 
            handleLogin(event);
        });
    }
});

/**
 * Handles the login request by sending credentials to the server.
 */
async function handleLogin(event) {

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const resultDiv = document.getElementById('message');

    console.log(username);
    console.log(password);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        console.log("html js - Status: " + response.status)
        
        if (response.ok) {
            resultDiv.innerText = `Success!\nToken: ${data.token}`;
            // Store token in localStorage for subsequent requests
            localStorage.setItem('authToken', data.token);
            console.log("front: Login good Token: " + data.token)
            resultDiv.innerText = `message: ${data.message}`;

            localStorage.setItem('authToken', data.token);
            localStorage.setItem('username', username);
            window.location.href = "/home";
        } else {
            resultDiv.innerText = `Error: ${data.message}`;
        }
    } catch (err) {
        resultDiv.innerText = `Network Error: ${err.message}`;
    }
}

async function printDebug(event) {
    event.preventDefault();
    const messageDiv = document.getElementById('message');
    console.log("Local Storage: ", localStorage.getItem("jwtToken"));
}