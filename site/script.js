/* ====== Helpers de armazenamento ====== */
const STORAGE_KEY = "wm_products";

function loadProducts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}
function saveProducts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ====== Estado ====== */
let products = loadProducts();
let editingId = null;

/* ====== Selectores ====== */
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

/* ====== Renderização da tabela ====== */
function formatPrice(n) {
  const val = Number(n || 0);
  return val.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function renderTable(filter = "") {
  tbody.innerHTML = "";
  const term = filter.trim().toLowerCase();

  const data = products
    .filter(p =>
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    )
    .sort((a,b) => a.id - b.id);

  for (const p of data) {
    const row = rowTpl.content.firstElementChild.cloneNode(true);
    row.querySelector('[data-cell="id"]').textContent = p.id;
    row.querySelector('[data-cell="name"]').textContent = p.name;
    row.querySelector('[data-cell="category"]').textContent = p.category;
    row.querySelector('[data-cell="quantity"]').textContent = p.quantity;
    row.querySelector('[data-cell="price"]').textContent = formatPrice(p.price);

    // ações
    row.querySelector(".edit").addEventListener("click", () => loadIntoForm(p.id));
    row.querySelector(".delete").addEventListener("click", () => removeProduct(p.id));

    tbody.appendChild(row);
  }
}

/* ====== CRUD ====== */
function nextId() {
  return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
}

function addProduct({ name, category, quantity, price }) {
  const item = {
    id: nextId(),
    name: name.trim(),
    category,
    quantity: Number(quantity),
    price: Number(price)
  };
  products.push(item);
  saveProducts(products);
  renderTable(searchInput.value);
}

function updateProduct(id, { name, category, quantity, price }) {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return;

  products[idx] = {
    ...products[idx],
    name: name.trim(),
    category,
    quantity: Number(quantity),
    price: Number(price)
  };
  saveProducts(products);
  renderTable(searchInput.value);
}

function removeProduct(id) {
  if (!confirm("Delete this product?")) return;
  products = products.filter(p => p.id !== id);
  saveProducts(products);
  renderTable(searchInput.value);
  resetForm();
}

/* ====== Formulário ====== */
function loadIntoForm(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  idInput.value = id;
  nameInput.value = p.name;
  catInput.value = p.category;
  qtyInput.value = p.quantity;
  priceInput.value = p.price;
  submitBtn.textContent = "SAVE";
}

function resetForm() {
  editingId = null;
  idInput.value = "";
  form.reset();
  submitBtn.textContent = "ADD";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const payload = {
    name: nameInput.value,
    category: catInput.value,
    quantity: qtyInput.value,
    price: priceInput.value
  };

  // validação rápida
  if (!payload.name || !payload.category) {
    alert("Preenche nome e categoria.");
    return;
  }

  if (editingId) updateProduct(Number(editingId), payload);
  else addProduct(payload);

  resetForm();
});

resetBtn.addEventListener("click", resetForm);
refreshBtn.addEventListener("click", () => renderTable(searchInput.value));
clearBtn.addEventListener("click", () => {
  if (confirm("Apagar todos os produtos guardados?")) {
    products = [];
    saveProducts(products);
    renderTable();
    resetForm();
  }
});
searchInput.addEventListener("input", (e) => renderTable(e.target.value));

/* ====== Demo: seed inicial (apenas se vazio) ====== */
(function seedIfEmpty(){
  if (products.length) { renderTable(); return; }
  products = [
    { id:1, name:"product 1", category:"Technologic", quantity:5, price:100.00 },
    { id:2, name:"product 2", category:"Clothing",   quantity:10, price:500.00 },
    { id:3, name:"product 3", category:"Home",       quantity:3,  price:120.00 },
    { id:4, name:"product 4", category:"Sports",     quantity:8,  price:175.00 }
  ];
  saveProducts(products);
  renderTable();
})();
