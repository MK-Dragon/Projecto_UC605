import { fetchUserData, logoutUser } from './general_scripts.js';

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
