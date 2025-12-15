/**
 * Fetches user data from the server's session.
 * @returns {object|null} The user data (username, isLoggedIn, etc.) or null on failure.
 * 
 * import on other JSs:
 * //import { fetchUserData, fetchMainPageData } from '../js/general_scrip.js';
 * 
 * change type in HTMLs so the Browser knows what to do with "Import"
 * <script src="/js/main.js" type="module"></script>
 */
export async function fetchUserData() {
    try {
        const response = await fetch('/api/get-user-data');
        const data = await response.json();

        if (response.ok && data.isLoggedIn) {
            // Success: Return the user data
            const usernameElement = document.getElementById('username-display');
            if (usernameElement) {
                usernameElement.innerHTML = `<i class="bi bi-person-circle"></i> ${data.username}`;
                //usernameElement.textContent += data.username;
            }
            console.log("\t\tUSER: " + data.username)
            return data;
        } else {
            // Not logged in or session expired
            console.warn("User session expired or not logged in.");
            return null;
        }
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        return null;
    }
}

export async function logoutUser() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST', // CRITICAL: Logout actions should use POST
            headers: {
                'Content-Type': 'application/json'
                // The browser automatically attaches the session cookie here
            }
        });

        // The server response will tell us if the session was successfully destroyed
        if (response.ok) {
            console.log("User successfully logged out and session destroyed.");
            
            // Redirect the user to the login page after successful server action
            window.location.href = '/login'; 
        } else {
            // Handle server-side failure (e.g., 500 status from the server)
            const data = await response.json();
            alert(`Logout failed on server: ${data.message}`);
        }

    } catch (error) {
        console.error("Network error during logout:", error);
        alert("A network error occurred during logout. Please try again.");
    }
}

// You can export as many functions or variables as needed