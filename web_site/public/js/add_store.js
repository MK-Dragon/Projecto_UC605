document.addEventListener("DOMContentLoaded", () => {

  // ===== CATEGORIAS =====
  const categoryForm = document.getElementById("categoryForm");
  const categoryName = document.getElementById("categoryName");
  const categoryMsg = document.getElementById("categoryMsg");
  const categoryList = document.getElementById("categoryList");
  const categoryEmpty = document.getElementById("categoryEmpty");

  // ===== LOJAS =====
  const storeForm = document.getElementById("storeForm");
  const storeName = document.getElementById("storeName");
  const storeMsg = document.getElementById("storeMsg");
  const storeList = document.getElementById("storeList");
  const storeEmpty = document.getElementById("storeEmpty");

  // ===== CARREGAR CATEGORIAS =====
  async function loadCategories() {
    try {
      const res = await fetch("/api/getcategories");
      if (!res.ok) throw new Error("Erro GET categories");

      const data = await res.json();
      categoryList.innerHTML = "";

      if (!data || data.length === 0) {
        categoryEmpty.style.display = "block";
        return;
      }

      categoryEmpty.style.display = "none";
      data.forEach(cat => {
        const li = document.createElement("li");
        li.className = "list-group-item py-3 text-center";
        li.textContent = cat.name; // backend deve devolver sempre "name"
        categoryList.appendChild(li);
      });
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }

  // ===== CARREGAR LOJAS =====
  async function loadStores() {
    try {
      const res = await fetch("/api/getstores");
      if (!res.ok) throw new Error("Erro GET stores");

      const data = await res.json();
      storeList.innerHTML = "";

      if (!data || data.length === 0) {
        storeEmpty.style.display = "block";
        return;
      }

      storeEmpty.style.display = "none";
      data.forEach(store => {
        const li = document.createElement("li");
        li.className = "list-group-item py-3 text-center";
        li.textContent = store.name;
        storeList.appendChild(li);
      });
    } catch (err) {
      console.error("Erro ao carregar lojas:", err);
    }
  }

  // ===== ADICIONAR CATEGORIA =====
  if (categoryForm) {
    categoryForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = categoryName.value.trim();
      if (!name) return;

      try {
        const res = await fetch("/api/addcategory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        });

        if (!res.ok) throw new Error("Erro POST category");

        categoryName.value = "";
        categoryMsg.textContent = "Categoria adicionada!";
        categoryMsg.style.color = "green";
        setTimeout(() => categoryMsg.textContent = "", 3000);

        loadCategories();
      } catch (err) {
        categoryMsg.textContent = "Erro ao adicionar categoria.";
        categoryMsg.style.color = "red";
      }
    });
  }

  // ===== ADICIONAR LOJA =====
  if (storeForm) {
    storeForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = storeName.value.trim();
      if (!name) return;

      try {
        const res = await fetch("/api/addstore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        });

        if (!res.ok) throw new Error("Erro POST store");

        storeName.value = "";
        storeMsg.textContent = "Loja adicionada!";
        storeMsg.style.color = "green";
        setTimeout(() => storeMsg.textContent = "", 3000);

        loadStores();
      } catch (err) {
        storeMsg.textContent = "Erro ao adicionar loja.";
        storeMsg.style.color = "red";
      }
    });
  }

  // ===== INIT =====
  loadCategories();
  loadStores();
});
