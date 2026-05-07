# 🎮 LudoLab

**Plataforma de juegos clásicos offline, sin anuncios, sin rastreo, lista para desplegar en tu red local con Docker.**

LudoLab nació como Proyecto de Fin de Grado del ciclo **ASIR** (Administración de Sistemas Informáticos en Red). La idea es simple: tener un sitio donde jugar a juegos clásicos del navegador sin depender de internet, sin publicidad y sin que nadie recopile tus datos, alojado en tu propia máquina o red local.

---

## 🕹️ Juegos disponibles

| Juego | Tecnología | Estado |
|---|---|---|
| 💣 Buscaminas | HTML · CSS · JavaScript | ✅ Completo |
| 🔢 Sudoku | HTML · CSS · PyScript | 🚧 En desarrollo |
| ♟️ Ajedrez | — | 📋 Planificado |

---

## ✨ ¿Por qué LudoLab?

- **Sin anuncios.** Ninguno. Jamás.
- **Sin internet.** Una vez instalado, funciona completamente offline.
- **Sin rastreo.** No hay analíticas, cookies de terceros ni telemetría.
- **Ligero.** Cada juego corre en su propio contenedor nginx mínimo.
- **Bajo demanda.** Los contenedores de juegos solo se encienden cuando alguien quiere jugar, ahorrando recursos.
- **Fácil de ampliar.** Añadir un juego nuevo es cuestión de minutos siguiendo la estructura existente.

---

## 🏗️ Arquitectura

LudoLab usa **Docker** para aislar cada juego en su propio contenedor. Un servidor central (el menú) es el único que está siempre encendido. Cuando el usuario elige un juego, el menú arranca ese contenedor y redirige el navegador directamente a él.

```
Navegador
    │
    ▼
┌─────────────────────────────────────────────┐
│               Docker host                   │
│                                             │
│  ┌──────────────────┐                       │
│  │  Menú (Node.js)  │ :80  ← siempre activo │
│  └────────┬─────────┘                       │
│           │ docker start (bajo demanda)      │
│           ▼                                 │
│  ┌──────────────────┐  ┌─────────────────┐  │
│  │   Buscaminas     │  │     Sudoku      │  │
│  │   nginx :8001    │  │   nginx :8002   │  │
│  └──────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 📋 Requisitos

### Docker y Docker Compose

**Linux (Ubuntu/Debian):**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Añadir tu usuario al grupo docker (para no usar sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalación
docker --version
docker compose version
```

**Windows / macOS:**
Descarga e instala [Docker Desktop](https://www.docker.com/products/docker-desktop/) desde la web oficial. Docker Compose viene incluido.

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/cachispo/ludolab.git
cd ludolab
```

### 2. Construir las imágenes

```bash
docker compose build
```

### 3. Crear los contenedores de juegos (sin arrancarlos todavía)

```bash
docker compose create buscaminas sudoku
```

### 4. Arrancar el menú

```bash
docker compose up -d menu
```

¡Listo! Abre tu navegador en **http://localhost** y ya puedes jugar.

> Si estás en otra máquina de la misma red, sustituye `localhost` por la IP local del servidor (por ejemplo `http://192.168.1.50`).

---

## 🎮 Uso

1. Abre **http://localhost** en el navegador.
2. El menú muestra los juegos disponibles y si su contenedor está activo o no.
3. Haz clic en **Jugar** — el menú arranca el contenedor si estaba apagado y te redirige automáticamente.
4. Cuando termines, el contenedor sigue corriendo hasta que se reinicie el host o lo pares manualmente (ver abajo).

### Parar un juego manualmente

```bash
docker stop ludolab-buscaminas
docker stop ludolab-sudoku
```

### Parar todo LudoLab

```bash
docker compose down
```

### Volver a arrancar tras un reinicio

```bash
docker compose up -d menu
```

Los contenedores de juegos se arrancan solos cuando alguien los pide desde el menú; no hace falta levantarlos a mano.

---

## 🔌 Puertos utilizados

| Servicio | Puerto |
|---|---|
| Menú principal | 80 |
| Buscaminas | 8001 |
| Sudoku | 8002 |

Si algún puerto está ocupado en tu máquina, cámbialo en `docker-compose.yml` (la parte izquierda del par `"puerto_host:puerto_contenedor"`).

---

## ➕ Añadir un juego nuevo

1. Crea una carpeta con los archivos del juego y copia el `Dockerfile` del buscaminas dentro.
2. Añade el servicio en `docker-compose.yml` con un puerto libre y el perfil `games`.
3. Registra el juego en `menu/server.js` dentro del objeto `JUEGOS`.
4. Añade la tarjeta en `menu/public/index.html`.
5. Ejecuta:

```bash
docker compose build nuevo-juego
docker compose create nuevo-juego
```

El menú lo detecta automáticamente en el siguiente refresco.

---

## 👤 Autor

**José Rodríguez**
📧 [58joserc@gmail.com](mailto:58joserc@gmail.com)
🔗 [GitHub](https://github.com/cachispo) · [LinkedIn](https://linkedin.com/in/cachispo)

---

## 📄 Licencia

Proyecto educativo — Proyecto de Fin de Grado ASIR 2025.
