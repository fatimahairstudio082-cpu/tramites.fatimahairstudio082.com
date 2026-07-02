/* Bóveda Legal — Service Worker (PWA offline) · v4 network-first, nunca cuelga */
const CACHE = 'boveda-legal-v4';
const ASSETS = [
  './',
  './index.html',
  './documentos.html',
  './herramientas.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Red primero, con tiempo límite; la caché es solo respaldo. Nunca cuelga la navegación.
function conTimeout(promise, ms) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    promise.then((r) => { clearTimeout(t); resolve(r); }).catch(() => { clearTimeout(t); resolve(null); });
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase / gobierno pasan directo

  e.respondWith((async () => {
    // Documentos y navegación: SIEMPRE red primero (evita servir HTML viejo y colgar)
    const esNavegacion = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
    if (esNavegacion) {
      const res = await conTimeout(fetch(req), 4000);
      if (res) return res;
      const cached = await caches.match(req);
      return cached || Response.error();
    }
    // Recursos estáticos: caché primero, con actualización en segundo plano
    const cached = await caches.match(req);
    const red = fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => null);
    return cached || (await red) || Response.error();
  })());
});
