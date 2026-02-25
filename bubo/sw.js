// Service Worker - Cache del app shell, network-first para API

const CACHE_NAME = 'rover-scout-v7';
const SHELL_FILES = [
  './',
  './index.html',
  './config.js',
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/dashboard.css',
  './css/responsive.css',
  './js/app.js',
  './js/state.js',
  './js/router.js',
  './js/auth.js',
  './js/sheets.js',
  './js/models/rover.js',
  './js/views/login.js',
  './js/views/dashboard.js',
  './js/views/rover-detail.js',
  './js/views/rover-form.js',
  './js/views/my-progress.js',
  './js/views/events.js',
  './js/components/navbar.js',
  './js/components/sidebar.js',
  './js/components/progress-ring.js',
  './js/components/rover-card.js',
  './js/components/toast.js',
  './js/components/modal.js',
  './assets/Bubo_app_logo.png',
];

// Install: cache shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first para API, cache-first para shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Google API calls → network only
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // CDN resources → network first, fallback to cache
  if (url.hostname !== location.hostname) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell → cache first, fallback to network
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
