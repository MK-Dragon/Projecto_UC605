document.addEventListener("DOMContentLoaded", async () => {
  const msg = document.getElementById("msg");
  const tableBody = document.getElementById("inventoryTable");
  const storeFilter = document.getElementById("filterStore");
  const qtyFilter = document.getElementById("filterQty");
  const sortSelect = document.getElementById("sortSelect");

  // ADIÇÃO: elementos do painel lateral
  const adjustStore = document.getElementById("adjustStore");
  const adjustProduct = document.getElementById("adjustProduct");
  const adjustQty = document.getElementById("adjustQty");
  const btnAdd = document.getElementById("btnAdd");
  const btnRemove = document.getElementById("btnRemove");
  const adjustMsg = document.getElementById("adjustMsg");

  let originalData = [];
  let products = []; // ADIÇÃO: para preencher dropdown de produtos
  let stores = [];   // ADIÇÃO: para preencher dropdown de lojas

  try {
    const res = await fetch("/api/getinventory"); // MANTEVE EXATAMENTE O TEU ENDPOINT ORIGINAL
    if (!res.ok) throw new Error("Erro ao buscar inventário");
    originalData = await res.json();
    renderTable(originalData);

    console.log("Inv Load:")
    originalData.forEach(item => {
      console.log(item);
      console.log(`${item.productName} - ${item.storeName } - ${item.stock} - ${item.categoryName}`);
    });

    populateStoreFilter(originalData);

    // ADIÇÃO: carrega listas para os dropdowns do painel
    products = await (await fetch("/api/usgetproducts")).json(); //acho que este é o endpoint correto
    stores = await (await fetch("/api/usgetstores")).json(); 
    populateAdjustDropdowns();

    msg.textContent = "Dados carregados!";
    msg.style.color = "green";
  } catch (e) {
    msg.textContent = "Erro: " + e.message;
    msg.style.color = "red";
  }

  storeFilter.addEventListener("change", () => renderTable(originalData));
  qtyFilter.addEventListener("input", () => renderTable(originalData));
  sortSelect.addEventListener("change", () => renderTable(originalData));

  // ADIÇÃO: eventos dos botões
  btnAdd.addEventListener("click", () => adjustStock(1));
  btnRemove.addEventListener("click", () => adjustStock(-1));

  // ADIÇÃO: função de ajuste
  async function adjustStock(direction) {
    const storeId = parseInt(adjustStore.value);
    const productId = parseInt(adjustProduct.value);
    const qty = parseInt(adjustQty.value || 0);

    if (!storeId || !productId || qty <= 0) {
      adjustMsg.textContent = "Preencha todos os campos!";
      adjustMsg.style.color = "red";
      return;
    }

    try {
      const res = await fetch("/api/adjuststock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productId,
          storeId: storeId,
          quantity: direction * qty
        })
      });

      if (!res.ok) throw new Error("Erro no servidor");

      // Atualiza local
      const item = originalData.find(i => i.productId === productId && i.storeId === storeId);
      if (item) {
        item.stock += direction * qty;
        if (item.stock < 0) item.stock = 0;
      }

      renderTable(originalData);
      adjustMsg.textContent = "Stock atualizado!";
      adjustMsg.style.color = "green";
    } catch (err) {
      adjustMsg.textContent = "Erro: " + err.message;
      adjustMsg.style.color = "red";
    }
  }

  // ADIÇÃO: preenche dropdowns do painel
  function populateAdjustDropdowns() {
    stores.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.Id;
      opt.textContent = s.Name;
      adjustStore.appendChild(opt);
    });
    products.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.Id;
      opt.textContent = p.Name;
      adjustProduct.appendChild(opt);
    });
  }

  // codigo existente!!
  function populateStoreFilter(data) {
    const lojas = [...new Set(data.map(d => d.store))];
    lojas.forEach(loja => {
      const option = document.createElement("option");
      option.value = loja;
      option.textContent = loja;
      storeFilter.appendChild(option);
    });
  }

  function renderTable(data) {
    let filtered = [...data];

    const store = storeFilter.value;
    const minQty = parseInt(qtyFilter.value);
    const sortBy = sortSelect.value;

    if (store !== "all") filtered = filtered.filter(i => i.store === store);
    if (!isNaN(minQty)) filtered = filtered.filter(i => i.quantity >= minQty);

    switch (sortBy) {
      case "name_az": filtered.sort((a, b) => a.productName.localeCompare(b.productName)); break;
      case "name_za": filtered.sort((a, b) => b.productName.localeCompare(a.productName)); break;
      case "qty_low_high": filtered.sort((a, b) => a.stock - b.stock); break;
      case "qty_high_low": filtered.sort((a, b) => b.stock - a.stock); break;
      case "category": filtered.sort((a, b) => a.categoryName.localeCompare(b.categoryName)); break;
    }

    tableBody.innerHTML = "";
    filtered.forEach(item => {
      tableBody.innerHTML += `
        <tr>
          <td>${item.productName}</td>
          <td>${item.storeName}</td>
          <td>${item.stock}</td>
          <td>${item.categoryName}</td>
        </tr>
      `;
    });
  }
});