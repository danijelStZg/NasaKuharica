// Naša kuharica — service worker
// Verzija cachea — promijeni broj kad ažuriraš datoteke da se cache osvježi.
const CACHE = 'nasa-kuharica-v1';

// Lokalne datoteke koje se precachiraju pri instalaciji (offline od prvog otvaranja).
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

// INSTALL: spremi lokalne datoteke u cache.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE: obriši stare verzije cachea.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH: posluži iz cachea, padni na mrežu, a nove odgovore spremi u cache.
// Ovo pokriva i Google Fonts (fonts.googleapis.com / fonts.gstatic.com) —
// nakon prvog uspješnog učitavanja fontovi rade i offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // Spremi uspješne odgovore (uklj. fontove s drugih domena).
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Offline i nema u cacheu: za navigaciju vrati index.html.
          if (req.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});
