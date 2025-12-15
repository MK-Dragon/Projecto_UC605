import { fetchUserData, logoutUser } from './general_scripts.js';

document.addEventListener("DOMContentLoaded", async () => {
  const udata = fetchUserData()
    
  const logoutButton = document.getElementById('logout-button');
  
  if (logoutButton) {
      // Attach the event listener
      logoutButton.addEventListener('click', (event) => {
          // CRITICAL: Stop the browser's default action (e.g., following the 'href="#"')
          event.preventDefault(); 
          
          // Call the function that makes the POST request and redirects
          logoutUser();
      });
  }

  const msg = document.getElementById("msg");
  const tableBody = document.getElementById("inventoryTable");
  const storeFilter = document.getElementById("filterStore");
  const qtyFilter = document.getElementById("filterQty");
  const sortSelect = document.getElementById("sortSelect");

  let inventoryData = [];
  let storeData = [];

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

    populateStoreFilter(originalData);

    // ADIÇÃO: carrega listas para os dropdowns do painel
    products = await (await fetch("/api/getproducts")).json(); //acho que este é o endpoint correto
    stores = await (await fetch("/api/getstores")).json(); 
    populateAdjustDropdowns();

    //msg.textContent = "Dados carregados!";
    //msg.style.color = "green";
  } catch (e) {
    msg.textContent = "Erro: " + e.message;
    msg.style.color = "red";
  }

  storeFilter.addEventListener("change", () => renderTable(inventoryData));
  qtyFilter.addEventListener("input", () => renderTable(inventoryData));
  sortSelect.addEventListener("change", () => renderTable(inventoryData));

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
      const res = await fetch("/api/updatestock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idstore: storeId,
          idproduct: productId,
          stock: direction * qty
        })
      });

      if (!res.ok) throw new Error("Erro no servidor");

      // reload page! ^_^ f#$% this bugs!
      //window.location.href = "/home";
      loadInventory(); // Testing

      // Atualiza local
      /*const item = originalData.find(i => i.productId === productId && i.storeId === storeId);
      if (item) {
        item.stock += direction * qty;
        if (item.stock < 0) item.stock = 0;
      }
        
      renderTable(originalData);
      */

      /*const res_reload = await fetch("/api/getinventory"); // MANTEVE EXATAMENTE O TEU ENDPOINT ORIGINAL
      if (!res_reload.ok) throw new Error("Erro ao buscar inventário");
      inventoryData = await res.json();
      renderTable(inventoryData);*/
      
      //adjustMsg.textContent = "Stock atualizado!";
      //adjustMsg.style.color = "green";
    } catch (err) {
      adjustMsg.textContent = "Erro: " + err.message;
      adjustMsg.style.color = "red";
    }
  }

  // ADIÇÃO: preenche dropdowns do painel
  function populateAdjustDropdowns() {
    //console.log("Stores:");
    stores.forEach(s => {
      //console.log(s);
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      adjustStore.appendChild(opt);
    });

    //console.log("Products:");
    products.forEach(p => {
      //console.log(p);
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      adjustProduct.appendChild(opt);
    });
  }

  // codigo existente!!
  function populateStoreFilter(stores) {
    //console.log("Load Store DD");

    stores.forEach(store => {
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
      //console.log(item);
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


  async function loadInventory() {
    try {
      const res = await fetch("/api/getinventory");
      if (!res.ok) throw new Error("Erro GET getinventory");

      const data = await res.json();
      //categoryList.innerHTML = "";

      if (!data || data.length === 0) {
        //categoryEmpty.style.display = "block";
        return;
      }

      renderTable(data);

      /*categoryEmpty.style.display = "none";
      data.forEach(cat => {
        const li = document.createElement("li");
        li.className = "list-group-item py-3 text-center";
        li.textContent = cat.name; // backend deve devolver sempre "name"
        categoryList.appendChild(li);
      });*/
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }

});