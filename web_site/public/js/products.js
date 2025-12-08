//console.log("products.js carregado!");
// Quando a página termina de carregar, chamamos a função loadProducts()
document.addEventListener("DOMContentLoaded", loadProducts);

async function loadProducts() {
    const msg = document.getElementById("msg");

    console.log("Load Products");

    // Buscar o token que recebeste no login (está no localStorage)
    //const token = localStorage.getItem("jwtToken");
    const token = localStorage.getItem("authToken");
    const username = localStorage.getItem("username")

    console.log("User: " + username + " Token:" + token);

    // Se não existir token → o user não está autenticado
    if (!token) {
        msg.textContent = "Não tens sessão iniciada!";
        msg.style.color = "red";
        console.log("Error - No token");
        return;
    }

    if (!username) {
        msg.textContent = "Não tens sessão iniciada!";
        msg.style.color = "red";
        console.log("Error - No username");
        return;
    }

    try {
        // Fazer pedido para o backend, na rota protegida /api/products
        // Aqui enviamos o token no header Authorization
        console.log("Try Hard: ");
        const res = await fetch("/api/getproducts", {
            method: "GET",
            /*headers: {
                "authorization": "Bearer " + token,
                "username": username,
                "Content-Type": "application/json"
            }*/
        });

        // Se o backend devolver erro (token inválido, expirado, etc.)
        if (!res.ok) {
            msg.textContent = "Erro ao carregar produtos";
            msg.style.color = "red";
            console.log("Try Hard - RES Not OK - " + res.status); // -> 403
            return;
        }

        // Transformar resposta em JSON (lista de produtos)
        const data = await res.json();
        console.log("PRODUTOS:", data); // DEBUG: ver os produtos na consola

        msg.textContent = "Produtos carregados!";
        msg.style.color = "green";

        // Criar os cards de produtos no HTML
        renderProducts(data);

    } catch (err) {
        // Qualquer erro de ligação ao servidor aparece aqui
        msg.textContent = "Erro de ligação ao servidor";
        msg.style.color = "red";
        console.error(err);
    }
}

// Função que recebe a lista de produtos e mete tudo na página
function renderProducts(list) {
    const grid = document.getElementById("productsGrid");

    // Limpa tudo antes de meter os cards
    grid.innerHTML = "";

    // Para cada produto, cria um card bonito
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
