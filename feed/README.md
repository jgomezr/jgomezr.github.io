# Feed de Conocimiento — PWA

App tipo feed vertical (estilo Reels) de tarjetas de conocimiento, implementada como
**PWA** con **SQLite en el navegador** (WebAssembly + OPFS). Un solo usuario, sin
autenticación, todo local. El resumen y las citas APA se delegan a n8n.

## Stack

- **Vite + React + TypeScript**
- **@sqlite.org/sqlite-wasm** sobre **OPFS SAHPool** (BD persistente on-device, en un Web Worker)
- **Zustand** para el estado del feed (lista append-only + prefetch)
- **vite-plugin-pwa** (service worker, precache, instalable)
- **Vitest + node:sqlite** para los tests de la capa de datos

## Puesta en marcha

```bash
cd app
npm install
npm run dev        # desarrollo con hot reload
npm run build      # build de producción (dist/) + service worker
npm run preview    # sirve el build
npm test           # tests de la capa de datos (12)
```

Al primer arranque se siembran tarjetas de ejemplo para ver el feed sin webhook.

## Configuración de n8n

En **Ajustes**, poner la URL base del webhook, p. ej. `https://n8n.juliangomez.me/webhook`.
La app le añade dos rutas (ambos workflows están en la carpeta raíz del repo, ya con CORS):

- `POST {base}/fetch-feeds` — lee los RSS (la PWA no puede por CORS) y devuelve URLs/DOIs normalizados.
- `POST {base}/summarize-batch` — extrae, resume y construye la cita APA.

Importar en n8n: `n8n_feed_conocimiento_fetch_feeds.json` y
`n8n_feed_conocimiento_summarize_batch.json`, y activarlos.

> Nota CORS: los webhooks vienen con `allowedOrigins: "*"`. Cuando la PWA tenga dominio
> fijo, cambiar `*` por ese origen en el nodo Webhook de cada workflow.

## Estructura

```
src/
  db/            worker sqlite-wasm (OPFS), cliente RPC, schema, repositorio, eventos
  lib/           hash SHA-1, settings, webhook (fetch/summarize), ingesta, purga, seed
  store/         feed (zustand: append-only + prefetch), useLive (reactividad ligera)
  features/      Feed, CardView, Saved, Library, Sources, Settings
  ui/            iconos
tests/           hash + repo (dedupe, purga, interacciones, fuentes, biblioteca)
```

## Notas de arquitectura

- **Fuente de verdad única:** SQLite local. El feed y Guardados se leen de la BD; offline es el estado natural.
- **Dedupe:** hash SHA-1 de la URL del artículo (o título+texto si no hay URL), con
  `content_hash UNIQUE` + `INSERT OR IGNORE`.
- **Prefetch:** a 3 tarjetas del final se dispara la ingesta, con guard `isLoading` y
  cooldown de 10 min si el RSS no trae nada nuevo (evita martillar el webhook).
- **Purga diaria:** no hay tarea de background fiable en web, así que la limpieza corre
  al abrir la app (`purgeIfDue`). Borra tarjetas del feed sin like/save y no protegidas;
  Biblioteca (protegida) y favoritos nunca se tocan.
- **Citas APA:** las construye n8n con metadatos reales (Crossref/arXiv/ISBN), nunca el LLM.
