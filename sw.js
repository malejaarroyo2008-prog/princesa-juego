/* =========================================================
   sw.js — Service worker: guarda la app en el celular para
   que funcione sin internet. Si cambias algún archivo, sube
   el número de VERSION para que el celular baje lo nuevo.
   ========================================================= */
const VERSION = 'princesa-v2';
const ARCHIVOS = [
  './',
  'index.html',
  'manifest.json',
  'css/styles.css',
  'js/data.js',
  'js/logic.js',
  'js/princesa.js',
  'js/app.js',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
  'iconos/icono-maskable-512.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero internet (así siempre llega la versión nueva) y, si no hay conexión,
// la copia guardada. Cada respuesta buena actualiza la copia.
self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET' || new URL(ev.request.url).origin !== location.origin) return;
  ev.respondWith(
    fetch(ev.request, { cache: 'no-cache' }).then(resp => {
      if (resp.ok) {
        const copia = resp.clone();
        caches.open(VERSION).then(c => c.put(ev.request, copia));
      }
      return resp;
    }).catch(() => caches.match(ev.request, { ignoreSearch: true })
      .then(guardada => guardada || caches.match('index.html')))
  );
});
