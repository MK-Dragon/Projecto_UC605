document.addEventListener("DOMContentLoaded", initHome);

let categoryMap = new Map();

async function initHome() {
  await loadCategories();
  await loadLastProducts();
}

// ================= LOAD CATEGORIES =================
async function loadCategories() {
  try {
    const res = await fetch("/api/getcategories");
    if (!res.ok) throw new Error("Error loading categories");

    const categories = await res.json();

    categories.forEach(cat => {
      categoryMap.set(cat.id, cat.name);
    });

    console.log("Loaded categories:", categoryMap);

  } catch (err) {
    console.error("Error loading categories", err);
  }
}

// ================= LOAD PRODUCTS =================
async function loadLastProducts() {
  try {
    const res = await fetch("/api/getproducts");
    if (!res.ok) throw new Error("Error loading products");

    const products = await res.json();

    const container = document.getElementById("lastProducts");
    container.innerHTML = "";

    // últimos 3 produtos adicionados
    const lastProducts = products.slice(-3).reverse();

    lastProducts.forEach(p => {
      const categoryName =
        categoryMap.get(p.idCategory) ||
        p.category_name ||
        p.category ||
        "N/A";

      container.innerHTML += `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="card product-card h-100 border-0 rounded-4 text-center shadow-sm">
            <div class="card-body py-4">
              <i class="bi bi-box-seam fs-2 text-success mb-2"></i>
              <h5 class="mb-1 text-truncate">${p.name}</h5>
              <small class="text-muted">
                Category: ${categoryName}
              </small>
            </div>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("Error loading latest products:", err);
  }
}
