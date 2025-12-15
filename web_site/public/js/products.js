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
});

// global Cattegory MAP!
let catMap = new Map();
catMap.set(-1, "NADA");


loadCategories();

let allProducts = [];  // <-- Mantemos todos os produtos aqui para filtrar depois

async function loadProducts() {
    const msg = document.getElementById("msg");
    console.log("Load Products");

    test = 2;

    const token = localStorage.getItem("authToken");
    const username = localStorage.getItem("username");

    //console.log("User: " + username + " Token:" + token);

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
         // fillCategoryFilter(data); // <-- REMOVIDO: loadCategories() já deve preencher o filtro
         applyFilters(); // <-- NOVO: renderizar produtos filtrados (inicialmente todos)

    } catch (err) {
         msg.textContent = "Erro de ligação ao servidor";
         msg.style.color = "red";
         console.error(err);
    }
}

// ⬇️ NOVO: Listener para aplicar o filtro sempre que o utilizador muda a categoria
document.getElementById("filterCategory").addEventListener("change", applyFilters);

// ⬇️ CORREÇÃO NA LÓGICA DE FILTRAGEM
function applyFilters() {
     const cat = document.getElementById("filterCategory").value;
     let filtered = [...allProducts];

    //console.log("Selected Category Value (cat): " + cat);
    //console.log("All Products count: " + allProducts.length);

    if (cat !== "all") {
        // 🛑 CORREÇÃO AQUI: Comparar p.idCategory (do produto) com cat (o valor da categoria no filtro)
        // Também é bom converter cat para número se p.idCategory for um número, para evitar problemas de tipo.
        const selectedCatId = parseInt(cat, 10);
        filtered = filtered.filter(p => p.idCategory === selectedCatId);
     }

        console.log("Filtered Products count: " + filtered.length);

    renderProducts(filtered);
}


function renderProducts(list_a) {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = "";

    //console.log("Render product list size: " + list_a.length)
    list_a.forEach(p => {
        // 🛑 CORREÇÃO AQUI: Use p.idCategory para obter o nome da categoria.
         const categoryName = catMap.get(p.idCategory) || "N/A";

        grid.innerHTML += `
            <div class="col-md-4">
                <div class="product-card p-3 shadow-sm">
                    <h5>${p.name}</h5>
                    <p>Categoria: ${categoryName}</p>
                    
                </div>
            </div>
         `;
        // <p>Stock: ${parseInt(p.quantity)}</p>
        //console.log(`\tPName_${p.name} - Cat_${categoryName} - Id_${p.idCategory} - Type_${typeof(p.id)} - test ${test}`)
    });
}

async function loadCategories() {
     const categorySelect = document.getElementById("filterCategory");
  // Adicionar a opção "Todos" (All) no início, se ainda não existir
    if (!categorySelect.querySelector('option[value="all"]')) {

        const allOpt = document.createElement("option");
        allOpt.value = "all";
        allOpt.textContent = "Todos";
        categorySelect.prepend(allOpt);
        categorySelect.value = "all"; // Selecionar 'Todos' por defeito
    }

    try {
        const res = await fetch("/api/getcategories"); // <-- via node.js
        const categories = await res.json();

        //console.log("\n\nLoad Cat:")
        categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        // 🛑 CORREÇÃO AQUI: Não adicionar a opção se ela já foi adicionada (para evitar duplicados com a lógica de filtro)
        if (!categorySelect.querySelector(`option[value="${cat.id}"]`)) {
            categorySelect.appendChild(opt);
        }

        // Certifique-se de que o ID da categoria no catMap é um número se for assim que ele vem do backend
        catMap.set(parseInt(cat.id, 10), cat.name) 

        //console.log(`\t[${cat.id}] ${cat.name} - CatMap: ${catMap.get(cat.id)}`)
          });
        } catch (err) {
            console.error("Erro ao carregar categorias:", err);
    }
}