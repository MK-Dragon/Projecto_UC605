//--------------------------------------------------------------
//  SELECTORES (Index + Products)
//--------------------------------------------------------------
const tbody = document.querySelector("#productsTable tbody");
const rowTpl = document.querySelector("#rowTemplate");

const form = document.getElementById("productForm");
const idInput = document.getElementById("id");
const nameInput = document.getElementById("name");
const catInput = document.getElementById("category");
const qtyInput = document.getElementById("quantity");
const priceInput = document.getElementById("price");

const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");

const refreshBtn = document.getElementById("refreshBtn");
const clearBtn = document.getElementById("clearBtn");
const searchInput = document.getElementById("search");


//--------------------------------------------------------------
//  DB SIMULADA (LocalStorage)
//--------------------------------------------------------------
const DB = {
  products: JSON.parse(localStorage.getItem("db_products")) || [],
  categories: JSON.parse(localStorage.getItem("db_categories")) || [],
  stores: JSON.parse(localStorage.getItem("db_stores")) || [],
  store_stock: JSON.parse(localStorage.getItem("db_store_stock")) || [],
  users: JSON.parse(localStorage.getItem("db_users")) || []
};

function saveDB() {
  localStorage.setItem("db_products", JSON.stringify(DB.products));
  localStorage.setItem("db_categories", JSON.stringify(DB.categories));
  localStorage.setItem("db_stores", JSON.stringify(DB.stores));
  localStorage.setItem("db_store_stock", JSON.stringify(DB.store_stock));
  localStorage.setItem("db_users", JSON.stringify(DB.users));
}


//--------------------------------------------------------------
//  CRUD DE PRODUTOS
//--------------------------------------------------------------
function nextProductId() {
  return DB.products.length ? Math.max(...DB.products.map(p => p.id)) + 1 : 1;
}


function addProduct({ name, category, quantity, price }) {

  const id = nextProductId();

  DB.products.push({
    id: id,
    name: name.trim(),
    id_category: Number(category),
    price: Number(price)
  });

  DB.store_stock.push({
    id_store: 1,
    id_product: id,
    quant: Number(quantity)
  });

  saveDB();
  renderTable(searchInput?.value);
}


function updateProduct(id, { name, category, quantity, price }) {
  const p = DB.products.find(x => x.id === id);
  if (!p) return;

  p.name = name.trim();
  p.id_category = Number(category);
  p.price = Number(price);

  const stock = DB.store_stock.find(s => s.id_product === id);
  if (stock) stock.quant = Number(quantity);

  saveDB();
  renderTable(searchInput?.value);
}


function removeProduct(id) {
  if (!confirm("Delete this product?")) return;

  DB.products = DB.products.filter(p => p.id !== id);
  DB.store_stock = DB.store_stock.filter(s => s.id_product !== id);

  saveDB();
  renderTable(searchInput?.value);
  resetForm();
}


//--------------------------------------------------------------
//  FUNÇÕES AUXILIARES
//--------------------------------------------------------------
function getCategoryName(id) {
  const c = DB.categories.find(x => x.id === id);
  return c ? c.name : "—";
}

function getQuantity(id_product) {
  const s = DB.store_stock.find(x => x.id_product === id_product);
  return s ? s.quant : 0;
}


//--------------------------------------------------------------
//  RENDER TABELA (INDEX.HTML)
//--------------------------------------------------------------
function renderTable(filter = "") {
  if (!tbody) return; // Não está na página index

  tbody.innerHTML = "";
  const term = filter.trim().toLowerCase();

  const data = DB.products.filter(p =>
    !term ||
    p.name.toLowerCase().includes(term)
  );

  for (const p of data) {
    const row = rowTpl.content.firstElementChild.cloneNode(true);

    row.querySelector('[data-cell="id"]').textContent = p.id;
    row.querySelector('[data-cell="name"]').textContent = p.name;
    row.querySelector('[data-cell="category"]').textContent = getCategoryName(p.id_category);
    row.querySelector('[data-cell="quantity"]').textContent = getQuantity(p.id);
    row.querySelector('[data-cell="price"]').textContent = p.price.toFixed(2) + " €";

    row.querySelector(".edit").addEventListener("click", () => loadIntoForm(p.id));
    row.querySelector(".delete").addEventListener("click", () => removeProduct(p.id));

    tbody.appendChild(row);
  }
}


//--------------------------------------------------------------
//  FORMULARIO (INDEX)
//--------------------------------------------------------------
let editingId = null;

function loadIntoForm(id) {
  const p = DB.products.find(x => x.id === id);
  const stock = DB.store_stock.find(x => x.id_product === id);

  editingId = id;

  idInput.value = id;
  nameInput.value = p.name;
  catInput.value = p.id_category;
  qtyInput.value = stock ? stock.quant : 0;
  priceInput.value = p.price;

  submitBtn.textContent = "SAVE";
}

function resetForm() {
  editingId = null;
  idInput.value = "";
  form.reset();
  submitBtn.textContent = "ADD";
}

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = {
      name: nameInput.value,
      category: catInput.value,
      quantity: qtyInput.value,
      price: priceInput.value
    };

    if (editingId) updateProduct(Number(editingId), payload);
    else addProduct(payload);

    resetForm();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => renderTable(e.target.value));
}


//--------------------------------------------------------------
//  SEED INICIAL (com preço!)
//--------------------------------------------------------------
(function seedIfEmpty() {

  if (!DB.categories.length) {
    DB.categories = [
      { id: 1, name: "Technologic" },
      { id: 2, name: "Clothing" },
      { id: 3, name: "Home" },
      { id: 4, name: "Sports" }
    ];
  }

  if (!DB.products.length) {
    DB.products = [
      { id:1, name:"Laptop",      id_category:1, price:999 },
      { id:2, name:"T-Shirt",     id_category:2, price:20 },
      { id:3, name:"Chair",       id_category:3, price:45 },
      { id:4, name:"Football",    id_category:4, price:15 }
    ];

    DB.store_stock = [
      { id_store:1, id_product:1, quant:5 },
      { id_store:1, id_product:2, quant:30 },
      { id_store:1, id_product:3, quant:12 },
      { id_store:1, id_product:4, quant:8 }
    ];
  }

  saveDB();
  renderTable();
})();



// ======================================================================
// ========================= PRODUCTS PAGE ===============================
// ======================================================================

const isProductsPage = window.location.pathname.includes("products.html");


//--------------------------------------------------------------
//  CARDS DE PRODUTOS
//--------------------------------------------------------------
function renderProductCards() {
  if (!isProductsPage) return;

  const container = document.getElementById("productsGrid");
  const filterSelect = document.getElementById("filterCategory");
  if (!container) return;

  let cat = filterSelect.value;
  container.innerHTML = "";

  DB.products.forEach(prod => {
    if (cat !== "all" && prod.id_category != cat) return;

    const qty = getQuantity(prod.id);

    container.innerHTML += `
      <div class="col-md-4">
        <div class="product-card p-3 shadow-sm">
          <h5>${prod.name}</h5>
          <p class="mb-1"><strong>Category:</strong> ${getCategoryName(prod.id_category)}</p>
          <p class="mb-1"><strong>Stock:</strong> ${qty}</p>
          <p class="mb-3"><strong>Price:</strong> €${prod.price}</p>
          <button class="btn btn-primary w-100 btnView" data-id="${prod.id}">View</button>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".btnView").forEach(btn => {
    btn.addEventListener("click", () => openProductModal(btn.dataset.id));
  });
}


//--------------------------------------------------------------
//  MODAL VIEW PRODUCT
//--------------------------------------------------------------
function openProductModal(id) {
  id = Number(id);

  const p = DB.products.find(x => x.id === id);
  const s = DB.store_stock.find(x => x.id_product === id);

  document.getElementById("modalID").textContent = p.id;
  document.getElementById("modalName").textContent = p.name;
  document.getElementById("modalCategory").textContent = getCategoryName(p.id_category);
  document.getElementById("modalQty").textContent = s ? s.quant : 0;
  document.getElementById("modalPrice").textContent = p.price;

  document.getElementById("modalEdit").onclick = () =>
    window.location.href = `index.html?edit=${p.id}`;

  document.getElementById("modalDelete").onclick = () => {
    if (confirm("Delete this product?")) {
      removeProduct(p.id);
      renderProductCards();
      bootstrap.Modal.getInstance(document.getElementById("productModal")).hide();
    }
  };

  new bootstrap.Modal(document.getElementById("productModal")).show();
}


//--------------------------------------------------------------
//  FILTRO DE CATEGORIAS
//--------------------------------------------------------------
function loadCategoryFilter() {
  if (!isProductsPage) return;

  const select = document.getElementById("filterCategory");

  DB.categories.forEach(cat => {
    select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });

  select.addEventListener("change", renderProductCards);
}


//--------------------------------------------------------------
//  ADD PRODUCT BUTTON (products page)
//--------------------------------------------------------------
function setupAddProductButton() {
  if (!isProductsPage) return;

  document.getElementById("btnAddProduct").onclick = () => {
    new bootstrap.Modal(document.getElementById("addConfirmModal")).show();
  };

  document.getElementById("confirmAddBtn").onclick = () =>
    window.location.href = "index.html";
}


//--------------------------------------------------------------
//  SE VIER COM ?edit=ID, CARREGA NO FORM
//--------------------------------------------------------------
function handleEditFromURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("edit");
  if (!id) return;

  if (document.getElementById("productForm")) {
    loadIntoForm(Number(id));
  }
}


//--------------------------------------------------------------
//  INICIALIZADOR
//--------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (isProductsPage) {
    loadCategoryFilter();
    renderProductCards();
    setupAddProductButton();
  }

  handleEditFromURL();
});
