//import { fetchUserData, logoutUser } from './general_scripts.js';
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
document.addEventListener("DOMContentLoaded", () => {
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

  loadCategories();

  document.getElementById("addProductBtn").addEventListener("click", async () => {
    const name = document.getElementById("productName").value.trim();
    const categoryId = document.getElementById("categorySelect").value;
    const msg = document.getElementById("msg");

    if (!name || categoryId === "Escolhe a categoria") {
      msg.textContent = "Preenche todos os campos!";
      msg.style.color = "red";
      return;
    }

    try {
      //console.log(`FE - Try: ${name} - ${categoryId}`)

      const res = await fetch("/api/addproduct", { //
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proName: name,              // <-- campo usado no server.js
          catId: parseInt(categoryId) // <-- campo usado no server.js
        })
      });

      //console.log(`FE - Status: ${res.status} - ${res.message}`)

      if (!res.ok) {
        const error = await res.json();
        msg.textContent = `Erro: ${res.status}` + " " + (error?.message || "Falha ao adicionar");
        msg.style.color = "red";
        return;
      }

      msg.textContent = "Produto adicionado com sucesso!";
      msg.style.color = "green";
    } catch (error) {
      msg.textContent = "Erro de ligação ao servidor.";
      msg.style.color = "red";
      console.error(error);
    }
  });
});

async function loadCategories() {
  const categorySelect = document.getElementById("categorySelect");

  try {
    const res = await fetch("/api/getcategories"); // <-- via node.js
    const categories = await res.json();

    console.log("\n\nLoad Cat:")
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);

      console.log(`\t[${cat.id}] ${cat.name}`)
    });
  } catch (err) {
    console.error("Erro ao carregar categorias:", err);
  }
}
