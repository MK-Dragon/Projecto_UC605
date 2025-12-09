document.addEventListener("DOMContentLoaded", async () => {
  const msg = document.getElementById("msg");
  const tableBody = document.getElementById("inventoryTable");
  const storeFilter = document.getElementById("filterStore");
  const qtyFilter = document.getElementById("filterQty");
  const sortSelect = document.getElementById("sortSelect");

  let originalData = [];

  try {
    const res = await fetch("/api/getinventory"); // ⚠️ Ajusta o endpoint no server.js se necessário
    if (!res.ok) throw new Error("Erro ao buscar inventário");
    originalData = await res.json();
    renderTable(originalData);
    populateStoreFilter(originalData);
    msg.textContent = "Dados carregados!";
    msg.style.color = "green";
  } catch (e) {
    msg.textContent = "Erro: " + e.message;
    msg.style.color = "red";
  }

  storeFilter.addEventListener("change", () => renderTable(originalData));
  qtyFilter.addEventListener("input", () => renderTable(originalData));
  sortSelect.addEventListener("change", () => renderTable(originalData));

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
      case "name_az": filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name_za": filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "qty_low_high": filtered.sort((a, b) => a.quantity - b.quantity); break;
      case "qty_high_low": filtered.sort((a, b) => b.quantity - a.quantity); break;
      case "category": filtered.sort((a, b) => a.category.localeCompare(b.category)); break;
    }

    tableBody.innerHTML = "";
    filtered.forEach(item => {
      tableBody.innerHTML += `
        <tr>
          <td>${item.name}</td>
          <td>${item.store}</td>
          <td>${item.quantity}</td>
          <td>${item.category}</td>
        </tr>
      `;
    });
  }
});
