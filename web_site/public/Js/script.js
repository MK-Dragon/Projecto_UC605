// js/script.js

/* ====== SELECTORES ====== */
const tbody = document.querySelector("#productsTable tbody");
const rowTpl = document.querySelector("#rowTemplate");

const form = document.getElementById("productForm");
const idInput = document.getElementById("id");
const nameInput = document.getElementById("name");
const catInput = document.getElementById("category");
const qtyInput = document.getElementById("quantity");

const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");

const refreshBtn = document.getElementById("refreshBtn");
const clearBtn = document.getElementById("clearBtn");
const searchInput = document.getElementById("search");

/* ====== DB ====== */
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

/* ====== Produtos ====== */
function nextProductId() {
  return DB.products.length ? Math.max(...DB.products.map(p => p.id)) + 1 : 1;
}

function addProduct({ name, category, quantity }) {
  const id = nextProductId();

  DB.products.push({
    id: id,
    name: name.trim(),
    id_category: Number(category)
  });

  DB.store_stock.push({
    id_store: 1,
    id_product: id,
    quant: Number(quantity)
  });

  saveDB();
  renderTable(searchInput.value);
}

function updateProduct(id, { name, category, quantity }) {
  const p = DB.products.find(x => x.id === id);
  if (!p) return;

  p.name = name.trim();
  p.id_category = Number(category);

  const stock = DB.store_stock.find(s => s.id_product === id);
  if (stock) stock.quant = Number(quantity);

  saveDB();
  renderTable(searchInput.value);
}

function removeProduct(id) {
  if (!confirm("Delete this product?")) return;

  DB.products = DB.products.filter(p => p.id !== id);
  DB.store_stock = DB.store_stock.filter(s => s.id_product !== id);

  saveDB();
  renderTable(searchInput.value);
  resetForm();
}

/* ====== Render ====== */
function getCategoryName(id) {
  const c = DB.categories.find(x => x.id === id);
  return c ? c.name : "—";
}

function getQuantity(id_product) {
  const s = DB.store_stock.find(x => x.id_product === id_product);
  return s ? s.quant : 0;
}

function renderTable(filter = "") {
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

    row.querySelector(".edit").addEventListener("click", () => loadIntoForm(p.id));
    row.querySelector(".delete").addEventListener("click", () => removeProduct(p.id));

    tbody.appendChild(row);
  }
}

/* ====== Form ====== */
let editingId = null;

function loadIntoForm(id) {
  const p = DB.products.find(x => x.id === id);
  const stock = DB.store_stock.find(x => x.id_product === id);

  editingId = id;
  idInput.value = id;
  nameInput.value = p.name;
  catInput.value = p.id_category;
  qtyInput.value = stock ? stock.quant : 0;

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
    quantity: qtyInput.value
  };

  if (editingId) updateProduct(Number(editingId), payload);
  else addProduct(payload);

  resetForm();
});

searchInput.addEventListener("input", (e) => renderTable(e.target.value));

/* ====== Seed ====== */
(function seedIfEmpty() {
  if (!DB.categories.length) {
    DB.categories = [
      { id: 1, name: "Technologic" },
      { id: 2, name: "Clothing" },
      { id: 3, name: "Home" },
      { id: 4, name: "Sports" }
    ];
  }

  if (!DB.stores.length) {
    DB.stores = [
      { id: 1, name: "Main Store" }
    ];
  }

  if (!DB.users.length) {
    DB.users = [
      { id: 1, username: "admin", password: "1234" }
    ];
  }

  saveDB();
  renderTable();
})();





// public/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status immediately when the page loads
    checkAuthAndLoadData();

    // Attach logout functionality to a button (assuming you have a button with id="logoutButton" on index.html)
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

/**
 * Checks for a token and loads protected data, redirecting if unauthorized.
 */
async function checkAuthAndLoadData() {
    const token = localStorage.getItem('jwtToken');
    
    if (!token) {
        console.log('No token found. Redirecting to login.');
        // If no token, redirect to login page
        window.location.href = '/login'; 
        return;
    }

    try {
        const response = await fetch('/api/data', {
            method: 'GET',
            headers: {
                // Attach the JWT as a Bearer Token
                'Authorization': `Bearer ${token}` 
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Protected Data Received:', data);
            
            // TODO: Update your index.html UI with the data here (e.g., data.message)
            const welcomeElement = document.getElementById('welcomeMessage');
            if (welcomeElement) {
                welcomeElement.textContent = data.message;
            }
        } else if (response.status === 401 || response.status === 403) {
            // Token expired or invalid
            console.log('Token invalid or expired. Logging out.');
            handleLogout(); 
        } else {
            console.error('Failed to fetch data:', response.status);
        }

    } catch (error) {
        console.error('Error fetching protected data:', error);
    }
}

/**
 * Handles the user logout process.
 */
function handleLogout() {
    localStorage.removeItem('jwtToken'); // Remove the token
    console.log('Logged out successfully.');
    window.location.href = '/login'; // Redirect to log in
}