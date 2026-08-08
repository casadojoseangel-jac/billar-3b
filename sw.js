const SHELL = 'billar-shell-v1';
const IMG = 'billar-img-v1';
const CORE = ['./', 'index.html', 'data.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== SHELL && k !== IMG).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // YouTube etc: red directa
  if (url.pathname.includes('/img/')) {
    // imágenes: cache primero, si no red + guardar
    e.respondWith(
      caches.open(IMG).then(async c => {
        const hit = await c.match(e.request);
        if (hit) return hit;
        const r = await fetch(e.request);
        if (r.ok) c.put(e.request, r.clone());
        return r;
      })
    );
  } else {
    // shell: red primero (para actualizaciones), cache como fallback
    e.respondWith(
      fetch(e.request, {cache:'no-cache'}).then(r => {
        const copy = r.clone();
        caches.open(SHELL).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
  }
});
