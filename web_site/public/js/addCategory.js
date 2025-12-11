document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addCategoryBtn").addEventListener("click", async () => {
    const name = document.getElementById("categoryName").value.trim();
    const msg = document.getElementById("msg");

    if (!name) {
      msg.textContent = "Preenche o nome da categoria.";
      msg.style.color = "red";
      return;
    }

    try {
    const res = await fetch("/api/addcategory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name })
      });

      if (!res.ok) {
        const error = await res.json();
        msg.textContent = "Erro: " + (error?.message || "Falha ao adicionar");
        msg.style.color = "red";
        return;
      }

      msg.textContent = "Categoria adicionada com sucesso!";
      msg.style.color = "green";
    } catch (err) {
      msg.textContent = "Erro de ligação ao servidor.";
      msg.style.color = "red";
      console.error(err);
    }
  });
});
