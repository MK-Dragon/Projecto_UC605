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
console.log("products.js carregado!");

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
    loadProducts();
    loadCategories();
});




// ================= GLOBALS =================
let catMap = new Map();
catMap.set(-1, "N/A");
let allProducts = []; // <-- Mantemos todos os produtos aqui para filtrar depois
let currentProduct = null;


// ================= LOAD PRODUCTS =================
async function loadProducts() {
    const msg = document.getElementById("msg");

    try {
        const res = await fetch("/api/getproducts");
        if (!res.ok) throw new Error("Erro ao carregar produtos");

        const data = await res.json();
        console.log("PRODUTOS:", data);

        msg.textContent = "Produtos carregados!";
        msg.style.color = "green";

        allProducts = data;
        applyFilters();

    } catch (err) {
        msg.textContent = "Erro de ligação ao servidor";
        msg.style.color = "red";
        console.error(err);
    }
}

// ================= FILTER =================
document.getElementById("filterCategory")
    .addEventListener("change", applyFilters);

function applyFilters() {
    const cat = document.getElementById("filterCategory").value;
    let filtered = [...allProducts];

    if (cat !== "all") {
        const selectedCatId = parseInt(cat, 10);
        filtered = filtered.filter(p => p.idCategory === selectedCatId);
    }

    renderProducts(filtered);
}

// ================= RENDER =================
function renderProducts(list) {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = "";

    list.forEach(p => {
        const categoryName = catMap.get(p.idCategory) || "N/A";

        grid.innerHTML += `
            <div class="col-md-4">
                <div class="product-card p-3 shadow-sm product-clickable" 
                     style="cursor:pointer"
                     data-product-id="${p.id}"> <h5>${p.name}</h5>
                    <p>Categoria: ${categoryName}</p>
                </div>
            </div>
        `;
    });
    
    // NOVO PASSO: Anexar o manipulador de eventos após a renderização
    attachProductClickHandlers(); 
}

// ================= LOAD CATEGORIES =================
async function loadCategories() {
    const categorySelect = document.getElementById("filterCategory");

    try {
        const res = await fetch("/api/getcategories");
        const categories = await res.json();

        categories.forEach(cat => {
            if (!categorySelect.querySelector(`option[value="${cat.id}"]`)) {
                const opt = document.createElement("option");
                opt.value = cat.id;
                opt.textContent = cat.name;
                categorySelect.appendChild(opt);
            }

            catMap.set(parseInt(cat.id, 10), cat.name);
        });

    } catch (err) {
        console.error("Erro ao carregar categorias:", err);
    }
}

// ================= MODAL =================
function openProductModal(idproduct) { 
    
    // 1. Encontre o produto completo no array global
    const product = allProducts.find(p => p.id === idproduct);

    if (!product) {
        console.error("Produto não encontrado com ID:", idproduct);
        return; 
    }
    
    // 2. O resto da função continua a usar o objeto 'product'
    currentProduct = product;

    document.getElementById("modalName").textContent = product.name;
    document.getElementById("modalID").textContent = product.id;
    document.getElementById("modalQty").textContent =
        product.quantity ?? "N/A";
    document.getElementById("modalCategory").textContent =
        catMap.get(product.idCategory) || "N/A";

    // O código do Bootstrap parece estar correto
    new bootstrap.Modal(
        document.getElementById("productModal")
    ).show();
}

// ================= EDIT =================
document.getElementById("modalEdit").addEventListener("click", () => {
    if (!currentProduct) return;

    document.getElementById("modalName").innerHTML = `
        <input id="editName" class="form-control"
               value="${currentProduct.name}">
    `;

    document.getElementById("modalCategory").innerHTML = `
        <select id="editCategory" class="form-select">
            ${[...catMap.entries()]
                .filter(([id]) => id !== -1)
                .map(([id, name]) =>
                    `<option value="${id}"
                        ${id === currentProduct.idCategory ? "selected" : ""}>
                        ${name}
                    </option>`
                ).join("")}
        </select>
    `;

    const btn = document.getElementById("modalEdit");
    btn.textContent = "Save";
   btn.onclick = () => saveProductEdit(currentProduct.id);

});

// ================= SAVE (POST) =================
async function saveProductEdit(idproduct) {
    console.log("Saving product edit...", idproduct);
    const newName = document.getElementById("editName").value.trim();
    const newCategory = parseInt(
        document.getElementById("editCategory").value,
        10
    );

    if (!newName) {
        alert("Nome do produto obrigatório");
        return;
    }

    console.log("POST /api/updateproduct");

  try {

    console.log(
        "Update Produto:",
        idproduct,
        newName,
        newCategory
    );

    const res = await fetch("/api/updateproduct", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: idproduct,
            name: newName,
            idcategory: newCategory
        })
    });
    console.log(`Status: ${res.status}`)
    if (!res.ok) throw new Error("Erro ao atualizar");

    loadProducts();

    bootstrap.Modal
        .getInstance(document.getElementById("productModal"))
        .hide();

} catch (err) {
    console.error(err);
    alert("Erro ao guardar alterações"); // pop do ERRO!
}
}

// ================= HANDLERS DINÂMICOS =================

function attachProductClickHandlers() {
    const productCards = document.querySelectorAll('.product-clickable');
    
    productCards.forEach(card => {
        card.addEventListener('click', (event) => {
            // Pega o ID do atributo 'data-product-id'
            const productId = parseInt(event.currentTarget.dataset.productId, 10);
            
            // Chama a função openProductModal com o ID
            openProductModal(productId);
        });
    });
}

