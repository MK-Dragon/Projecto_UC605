console.log("products.js carregado!");
<<<<<<< HEAD
=======
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
});
>>>>>>> 97d5870db143cf05ac6de44e007b049dff1af0a0


document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    loadProducts();
});

// ================= GLOBALS =================
let catMap = new Map();
catMap.set(-1, "N/A");

let allProducts = [];
let currentProduct = null;

<<<<<<< HEAD
// ================= LOAD PRODUCTS =================
=======
loadCategories();

let allProducts = []; // <-- Mantemos todos os produtos aqui para filtrar depois

>>>>>>> 97d5870db143cf05ac6de44e007b049dff1af0a0
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
                <div class="product-card p-3 shadow-sm"
                     style="cursor:pointer"
                     onclick='openProductModal(${JSON.stringify(p)})'>
                    <h5>${p.name}</h5>
                    <p>Categoria: ${categoryName}</p>
                </div>
            </div>
        `;
    });
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
function openProductModal(product) {
    currentProduct = product;

    document.getElementById("modalName").textContent = product.name;
    document.getElementById("modalID").textContent = product.id;
    document.getElementById("modalQty").textContent =
        product.quantity ?? "N/A";
    document.getElementById("modalCategory").textContent =
        catMap.get(product.idCategory) || "N/A";

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

    if (!res.ok) throw new Error("Erro ao atualizar");

    loadProducts();

    bootstrap.Modal
        .getInstance(document.getElementById("productModal"))
        .hide();

} catch (err) {
    console.error(err);
    alert("Erro ao guardar alterações");
}
}
