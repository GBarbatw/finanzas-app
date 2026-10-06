const CACHE = 'finanzas-v1';
const ARCHIVOS = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json', '/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return; // la API siempre en vivo
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
