document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const messageDiv = document.getElementById('message');
    const btnSignup = document.getElementById('btn_signup');

    // Function to display a message
    const displayMessage = (text, isSuccess) => {
        messageDiv.textContent = text;
        messageDiv.classList.remove('text-success-main', 'text-danger-main');
        messageDiv.classList.add(isSuccess ? 'text-success-main' : 'text-danger-main');
    };

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the default form submission (page reload)

        // Clear previous messages
        displayMessage('', false);
        btnSignup.disabled = true;
        btnSignup.textContent = 'Creating User...';

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm_password').value.trim(); // NEW: Get confirm password

        // --- Client-Side Validation ---

        if (!username || !password || !confirmPassword) {
            displayMessage('Please fill in all fields.', false);
            btnSignup.disabled = false;
            btnSignup.textContent = 'Create Account';
            return;
        }

        // NEW: Check if passwords match
        if (password !== confirmPassword) {
            displayMessage('Error: Passwords do not match.', false);
            btnSignup.disabled = false;
            btnSignup.textContent = 'Create Account';
            return;
        }
        
        // --- End Validation ---

        try {
            // Note: We only send the original password field to the server.
            const response = await fetch('/api/adduser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success: User created
                displayMessage('The user has been created successfully.', true);
                
                // Redirect user to the login page after a short delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000); // Redirect after 2 seconds
                
            } else {
                // Error: Server responded with an error status (e.g., 409 Conflict, 500)
                // Use the error message from the backend, or a generic one
                const errorMessage = data.message || 'An error occurred during account creation. Please try again.';
                displayMessage(errorMessage, false);
                btnSignup.disabled = false;
                btnSignup.textContent = 'Create Account';
            }

        } catch (error) {
            // Network error (e.g., server is down)
            console.error('Sign Up Error:', error);
            displayMessage('Cannot connect to the server. Please check your connection.', false);
            btnSignup.disabled = false;
            btnSignup.textContent = 'Create Account';
        }
    });
});