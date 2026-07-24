/* Brasa — service worker.
   Estrategia: stale-while-revalidate — responde del caché (offline instantáneo)
   pero SIEMPRE refresca desde la red en segundo plano, así los deploys llegan
   en la siguiente visita sin depender de acordarse de subir la versión. */
const CACHE = 'brasa-v2';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/db.js',
  './js/data-test.js',
  './js/data-program.js',
  './js/coach-rules.js',
  './js/coach-ai.js',
  './js/ring.js',
  './js/charts.js',
  './js/views-hoy.js',
  './js/views-test.js',
  './js/views-programa.js',
  './js/views-metricas.js',
  './js/views-coach.js',
  './js/views-mas.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Nunca interceptar llamadas externas (API de Claude, CDN de WebLLM).
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      const refresh = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => hit); // sin red: nos quedamos con el caché
      return hit || refresh;
    })
  );
});
