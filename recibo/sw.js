// Lets the installed app open with no internet. The app itself is the single
// file next to this one: it opens from the cache at once, and any newer version
// found on the network is used the next time it opens.
const CACHE = 'talonario';
const APP = './';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(APP);
    const update = fetch(APP, { cache: 'no-cache' }).then((response) => {
      if (response.ok) cache.put(APP, response.clone());
      return response;
    });
    if (cached) {
      event.waitUntil(update.catch(() => {}));
      return cached;
    }
    return update;
  }));
});
