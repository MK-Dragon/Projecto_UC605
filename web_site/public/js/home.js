//document.addEventListener("DOMContentLoaded", initHome);

document.addEventListener('DOMContentLoaded', async () => {
    // This will cause a different error in a module, 
    // but reinforces the 'top level' rule.
    const udata = fetchUserData()
    
    const logoutButton = document.getElementById('logout-button');
    
    if (logoutButton) {
        // Attach the event listener
        logoutButton.addEventListener('click', (event) => {
            // CRITICAL: Stop the browser's default action (e.g., following the 'href="#"')
            event.preventDefault(); 
            
            // Call the function that makes the POST request and redirects
            logoutUser();
        });
    }
    initHome();
});

let categoryMap = new Map();


async function fetchUserData() {
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
            window.location.href = '/login'; 
            //return null;
        }
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        return null;
    }
}

async function logoutUser() {
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




async function initHome() {
  await loadCategories();
  await loadLastProducts();
}

// ================= LOAD CATEGORIES =================
async function loadCategories() {
  try {
    const res = await fetch("/api/getcategories");
    if (!res.ok) throw new Error("Error loading categories");

    const categories = await res.json();

    categories.forEach(cat => {
      categoryMap.set(cat.id, cat.name);
    });

    console.log("Loaded categories:", categoryMap);

  } catch (err) {
    console.error("Error loading categories", err);
  }
}

// ================= LOAD PRODUCTS =================
async function loadLastProducts() {
  try {
    const res = await fetch("/api/getproducts");
    if (!res.ok) throw new Error("Error loading products");

    const products = await res.json();

    const container = document.getElementById("lastProducts");
    container.innerHTML = "";

    // últimos 3 produtos adicionados
    const lastProducts = products.slice(-3).reverse();

    lastProducts.forEach(p => {
      const categoryName =
        categoryMap.get(p.idCategory) ||
        p.category_name ||
        p.category ||
        "N/A";

      container.innerHTML += `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="card product-card h-100 border-0 rounded-4 text-center shadow-sm">
            <div class="card-body py-4">
              <i class="bi bi-box-seam fs-2 text-success mb-2"></i>
              <h5 class="mb-1 text-truncate">${p.name}</h5>
              <small class="text-muted">
                Category: ${categoryName}
              </small>
            </div>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("Error loading latest products:", err);
  }
}
