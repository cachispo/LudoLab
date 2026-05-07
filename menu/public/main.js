async function actualizarEstados() {
  try {
    const res = await fetch("/api/estado");
    const estados = await res.json();
    for (const [juego, estado] of Object.entries(estados)) {
      const el = document.getElementById(`estado-${juego}`);
      if (!el) continue;
      el.textContent = estado;
      el.className = "estado" + (estado === "corriendo" ? " corriendo" : "");
    }
  } catch {
    // silencio si falla
  }
}

async function jugar(juego) {
  const btn = document.querySelector(`[data-juego="${juego}"] button`);
  const spinner = document.getElementById(`spinner-${juego}`);

  btn.disabled = true;
  spinner.classList.add("visible");

  try {
    const res = await fetch(`/api/jugar/${juego}`, { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Error al arrancar el juego: " + (data.error || "desconocido"));
    }
  } catch (e) {
    alert("Error de red: " + e.message);
  } finally {
    btn.disabled = false;
    spinner.classList.remove("visible");
    actualizarEstados();
  }
}

// Actualizar estados al cargar y cada 5 segundos
actualizarEstados();
setInterval(actualizarEstados, 5000);
