console.log("products.js carregado!");
document.addEventListener("DOMContentLoaded", loadProducts);

let allProducts = [];  // <-- Mantemos todos os produtos aqui para filtrar depois

async function loadProducts() {
    const msg = document.getElementById("msg");
    console.log("Load Products");

    const token = localStorage.getItem("authToken");
    const username = localStorage.getItem("username");

    console.log("User: " + username + " Token:" + token);

    if (!token || !username) {
        msg.textContent = "Não tens sessão iniciada!";
        msg.style.color = "red";
        console.log("Error - No token or username");
        return;
    }

    try {
        console.log("Try Hard: ");
        const res = await fetch("/api/getproducts");

        if (!res.ok) {
            msg.textContent = "Erro ao carregar produtos";
            msg.style.color = "red";
            console.log("Try Hard - RES Not OK - " + res.status);
            return;
        }

        const data = await res.json();
        console.log("PRODUTOS:", data);

        msg.textContent = "Produtos carregados!";
        msg.style.color = "green";

        allProducts = data; // <-- Guardar todos os produtos numa variável global
        fillCategoryFilter(data); // <-- NOVO: preencher o dropdown de categorias
        applyFilters(); // <-- NOVO: renderizar produtos filtrados (inicialmente todos)

    } catch (err) {
        msg.textContent = "Erro de ligação ao servidor";
        msg.style.color = "red";
        console.error(err);
    }
}

// ⬇️ NOVO: Listener para aplicar o filtro sempre que o utilizador muda a categoria
document.getElementById("filterCategory").addEventListener("change", applyFilters);

// ⬇️ NOVO: Renderiza os produtos filtrados
function applyFilters() {
    const cat = document.getElementById("filterCategory").value;
    let filtered = [...allProducts];

    if (cat !== "all") {
        filtered = filtered.filter(p => p.id_category === cat);
    }

    renderProducts(filtered);
}

// ⬇️ NOVO: Preencher o dropdown com categorias únicas dos produtos
function fillCategoryFilter(products) {
    const select = document.getElementById("filterCategory");
    const categories = [...new Set(products.map(p => p.id_category))];

    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

function renderProducts(list) {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = "";

    list.forEach(p => {
        grid.innerHTML += `
            <div class="col-md-4">
                <div class="product-card p-3 shadow-sm">
                    <h5>${p.name}</h5>
                    <p>Categoria: ${p.id_category}</p>
                    <p>Stock: ${p.quantity}</p>
                </div>
            </div>
        `;
    });
}
