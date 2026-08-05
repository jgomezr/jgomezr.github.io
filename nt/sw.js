// Notas PWA — service worker mínimo.
// Estrategia: responde desde caché al instante (offline garantizado) y
// actualiza la caché en segundo plano (la versión nueva entra en la siguiente apertura).
const CACHE = 'notas-v4';
const SHELL = ['./', './index.html'];
const EXTRAS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(SHELL)
        // los extras son opcionales: su ausencia no debe impedir instalar el SW
        .then(() => Promise.allSettled(EXTRAS.map(u => c.add(u))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // solo el shell propio: la API de GitHub y todo lo externo pasa directo a la red
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // Navegaciones (abrir la app): siempre el index cacheado, sea cual sea la
  // variante de URL con la que se lance (con ?query, con /index.html, etc.).
  // La red actualiza la copia en segundo plano.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(cached => {
        const fresh = fetch(e.request)
          .then(res => {
            if (res.ok) caches.open(CACHE).then(c => c.put('./index.html', res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached || fresh;
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const fresh = fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached || Response.error());
      return cached || fresh;
    })
  );
});
