// public/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    // We now target the form using the ID we added in the HTML
    const form = document.getElementById('loginForm');

    if (form) {
        // Attach the event listener to the form submission
        form.addEventListener('submit', handleLogin);
    }
});

/**
 * Handles the login request by sending credentials to the server.
 */
async function handleLogin(event) {
    event.preventDefault(); // Stop the form from submitting normally

    // Get input values using the IDs we added to the HTML
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    // Clear previous message
    messageDiv.textContent = 'A processar...';
    messageDiv.style.color = 'gray';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // 1. Success: Store the JWT in Local Storage
            localStorage.setItem('jwtToken', data.token);
            
            messageDiv.textContent = 'Login bem-sucedido! A redirecionar...';
            messageDiv.style.color = 'green';
            
            // 2. Redirect the user to the main page
            window.location.href = '/'; 
            
        } else {
            // Failure: Display the error message from the server
            const errorMessage = data.message || 'Falha no login. Verifique as credenciais.';
            messageDiv.textContent = errorMessage;
            messageDiv.style.color = 'red';
        }

    } catch (error) {
        console.error('Network or server error:', error);
        messageDiv.textContent = 'Ocorreu um erro no servidor.';
        messageDiv.style.color = 'red';
    }
}