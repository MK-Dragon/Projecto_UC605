document.addEventListener("DOMContentLoaded", () => {

  const tableBody = document.getElementById("inventoryTable");
  const storeFilter = document.getElementById("filterStore");
  const qtyFilter = document.getElementById("filterQty");
  const sortSelect = document.getElementById("sortSelect");
  const msg = document.getElementById("msg");

  const actionCard = document.getElementById("actionCard");
  const qtyInput = document.getElementById("qtyInput");
  const btnAdd = document.getElementById("btnAdd");
  const btnRemove = document.getElementById("btnRemove");
  const actionMsg = document.getElementById("actionMsg");
  const selectedProduct = document.getElementById("selectedProduct");

  let originalData = [];
  let selectedStoreId = null;
  let selectedProductId = null;

  // ===============================
  // CARREGAR INVENTÁRIO
  // ===============================
  async function loadData() {
    try {
      const res = await fetch("/api/usgetstock");
      if (!res.ok) throw new Error("Erro ao buscar inventário");

      originalData = await res.json();
      populateStoreFilter(originalData);
      renderTable(originalData);

      msg.textContent = "Inventário carregado!";
      msg.style.color = "green";
    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "red";
    }
  }

  loadData();

  // ===============================
  // EVENTOS DE FILTRO
  // ===============================
  storeFilter.addEventListener("change", () => renderTable(originalData));
  qtyFilter.addEventListener("input", () => renderTable(originalData));
  sortSelect.addEventListener("change", () => renderTable(originalData));

  // ===============================
  // POPULAR FILTRO DE LOJAS
  // ===============================
  function populateStoreFilter(data) {
    storeFilter.innerHTML = `<option value="all">Todas</option>`;

    [...new Set(data.map(i => i.storeName))].forEach(store => {
      const opt = document.createElement("option");
      opt.value = store;
      opt.textContent = store;
      storeFilter.appendChild(opt);
    });
  }

  // ===============================
  // RENDER DA TABELA
  // ===============================
  function renderTable(data) {
    let filtered = [...data];

    if (storeFilter.value !== "all") {
      filtered = filtered.filter(i => i.storeName === storeFilter.value);
    }

    if (qtyFilter.value) {
      filtered = filtered.filter(i => i.stock >= parseInt(qtyFilter.value));
    }

    if (sortSelect.value === "qty_low_high") {
      filtered.sort((a, b) => a.stock - b.stock);
    }

    if (sortSelect.value === "qty_high_low") {
      filtered.sort((a, b) => b.stock - a.stock);
    }

    tableBody.innerHTML = "";

    filtered.forEach(item => {
      tableBody.innerHTML += `
        <tr>
          <td>${item.productName}</td>
          <td>${item.storeName}</td>
          <td>${item.categoryName}</td>
          <td class="text-center">
            <span class="badge bg-primary qty-btn"
                  style="cursor:pointer"
                  data-store="${item.idStore}"
                  data-product="${item.idProduct}"
                  data-name="${item.productName}">
              ${item.stock}
            </span>
          </td>
        </tr>
      `;
    });

    document.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedStoreId = parseInt(btn.dataset.store);
        selectedProductId = parseInt(btn.dataset.product);

        selectedProduct.textContent = `Produto: ${btn.dataset.name}`;
        qtyInput.value = "";
        actionMsg.textContent = "";
        actionCard.classList.remove("d-none");
      });
    });
  }

  // ===============================
  // BOTÕES
  // ===============================
  btnAdd.addEventListener("click", () => updateStock("add"));
  btnRemove.addEventListener("click", () => updateStock("remove"));

  // ===============================
  // UPDATE STOCK
  // ===============================
  async function updateStock(action) {
    const value = parseInt(qtyInput.value);

    if (!value || value <= 0) {
      actionMsg.textContent = "Quantidade inválida!";
      actionMsg.style.color = "red";
      return;
    }

    const current = originalData.find(
      i => i.idStore === selectedStoreId && i.idProduct === selectedProductId
    );

    let newStock = action === "add"
      ? current.stock + value
      : current.stock - value;

    if (newStock < 0) {
      actionMsg.textContent = "Não dá para remover mais do que existe!";
      actionMsg.style.color = "red";
      return;
    }

    try {
      const res = await fetch("/api/usupdatestock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idStore: selectedStoreId,
          idProduct: selectedProductId,
          stock: newStock
        })
      });

      if (!res.ok) throw new Error("Erro ao atualizar stock");

      actionMsg.textContent = "Stock atualizado!";
      actionMsg.style.color = "green";
      loadData();

    } catch (err) {
      actionMsg.textContent = err.message;
      actionMsg.style.color = "red";
    }
  }

});
