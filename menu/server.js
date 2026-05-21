const express = require("express");
const Docker = require("dockerode");
const path = require("path");

const app = express();
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

// Mapa de juegos: nombre → { contenedor, puerto }
const JUEGOS = {
  buscaminas: { container: "ludolab-buscaminas", port: 8001 },
  sudoku:     { container: "ludolab-sudoku",     port: 8002 },
};

app.use(express.static(path.join(__dirname, "public")));

// Estado de cada contenedor
app.get("/api/estado", async (req, res) => {
  const estado = {};
  for (const [nombre, cfg] of Object.entries(JUEGOS)) {
    try {
      const c = docker.getContainer(cfg.container);
      const info = await c.inspect();
      estado[nombre] = info.State.Running ? "corriendo" : "detenido";
    } catch {
      estado[nombre] = "no existe";
    }
  }
  res.json(estado);
});

// Arrancar un juego y devolver su URL
app.post("/api/jugar/:juego", async (req, res) => {
  const cfg = JUEGOS[req.params.juego];
  if (!cfg) return res.status(404).json({ error: "Juego no encontrado" });

  try {
    const container = docker.getContainer(cfg.container);
    const info = await container.inspect();

    if (!info.State.Running) {
      await container.start();
      // Esperar un momento para que nginx arranque
      await new Promise((r) => setTimeout(r, 800));
    }

    // Devolvemos la URL del juego (mismo host, distinto puerto)
    const host = req.headers.host?.split(":")[0] || "localhost";
    res.json({ url: `http://${host}:${cfg.port}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detener un juego
app.post("/api/detener/:juego", async (req, res) => {
  const cfg = JUEGOS[req.params.juego];
  if (!cfg) return res.status(404).json({ error: "Juego no encontrado" });

  try {
    const container = docker.getContainer(cfg.container);
    await container.stop();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`LudoLab menú en http://localhost:${PORT}`));

const { exec } = require('child_process');

// Pasadizo para detener el sudoku
app.post('/api/stop/sudoku', (req, res) => {
    exec('docker container stop ludolab-sudoku', (err) => {
        if (err) return res.status(500).send(err.message);
        res.sendStatus(200);
    });
});

// Pasadizo para detener el buscaminas
app.post('/api/stop/buscaminas', (req, res) => {
    exec('docker container stop ludolab-buscaminas', (err) => {
        if (err) return res.status(500).send(err.message);
        res.sendStatus(200);
    });
});