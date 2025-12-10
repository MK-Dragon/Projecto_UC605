document.addEventListener("DOMContentLoaded", () => {
  loadCategories();

  document.getElementById("addProductBtn").addEventListener("click", async () => {
    const name = document.getElementById("productName").value.trim();
    const categoryId = document.getElementById("categorySelect").value;
    const msg = document.getElementById("msg");

    if (!name || categoryId === "Escolhe a categoria") {
      msg.textContent = "Preenche todos os campos!";
      msg.style.color = "red";
      return;
    }

    try {
      const res = await fetch("/api/addproduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proName: name,              // <-- campo usado no server.js
          catId: parseInt(categoryId) // <-- campo usado no server.js
        })
      });

      if (!res.ok) {
        const error = await res.json();
        msg.textContent = "Erro: " + (error?.message || "Falha ao adicionar");
        msg.style.color = "red";
        return;
      }

      msg.textContent = "Produto adicionado com sucesso!";
      msg.style.color = "green";
    } catch (error) {
      msg.textContent = "Erro de ligação ao servidor.";
      msg.style.color = "red";
      console.error(error);
    }
  });
});

async function loadCategories() {
  const categorySelect = document.getElementById("categorySelect");

  try {
    const res = await fetch("/api/getcategories"); // <-- via node.js
    const categories = await res.json();

    console.log("\n\nLoad Cat:")
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);

      console.log(`\t[${cat.id}] ${cat.name}`)
    });
  } catch (err) {
    console.error("Erro ao carregar categorias:", err);
  }
}
