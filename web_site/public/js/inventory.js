document.addEventListener("DOMContentLoaded", async () => {
  const msg = document.getElementById("msg");
  const tableBody = document.getElementById("inventoryTable");
  const storeFilter = document.getElementById("filterStore");
  const qtyFilter = document.getElementById("filterQty");
  const sortSelect = document.getElementById("sortSelect");

  let inventoryData = [];
  let storeData = [];


  try {
    const res = await fetch("/api/getinventory");
    if (!res.ok) throw new Error("Erro ao buscar inventário");
    inventoryData = await res.json();
    renderTable(inventoryData);

    // Debug
    /*console.log("Inv Load:")
    inventoryData.forEach(item => {
      console.log(item);
      console.log(`${item.productName} - ${item.storeName } - ${item.stock} - ${item.categoryName}`);
    });*/

    res2 = await fetch("/api/getstores");
    if (!res2.ok) throw new Error("Erro ao buscar inventário");
    storeData = await res2.json();
    populateStoreFilter(storeData);

    // Debug
    /*console.log("Stores Load:")
    storeData.forEach(item => {
      console.log(item);
      //console.log(`${item.storeId} - ${item.storeName }`);
    });*/

    //msg.textContent = "Dados carregados!";
    //msg.style.color = "green";
  } catch (e) {
    msg.textContent = "Erro: " + e.message;
    msg.style.color = "red";
  }

  storeFilter.addEventListener("change", () => renderTable(inventoryData));
  qtyFilter.addEventListener("input", () => renderTable(inventoryData));
  sortSelect.addEventListener("change", () => renderTable(inventoryData));

  function populateStoreFilter(stores) {
    console.log("Load Store DD");

    stores.forEach(store => {
      //console.log(`${store.id} - ${store.name}`)
      const option = document.createElement("option");
      option.value = store.id;
      option.textContent = store.name;
      storeFilter.appendChild(option);
    });
  }

  function renderTable(data) {
    let filtered = [...data];

    const store = storeFilter.value;
    const minQty = parseInt(qtyFilter.value);
    const sortBy = sortSelect.value;

    if (store !== "all") filtered = filtered.filter(i => `${i.idStore}` == `${store}`);
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
      console.log(item);
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
