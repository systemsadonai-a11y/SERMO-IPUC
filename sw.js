'use strict';

// Sube este número cada vez que cambies index.html para forzar
// a los teléfonos a descargar la versión nueva.
const CACHE_NAME = 'sermonwriter-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: red primero (para tener siempre lo último estando online),
// con respaldo en caché para que la app abra sin conexión.
// Las llamadas a Firebase (firebaseio.com / googleapis.com) se dejan pasar
// directo a la red, ya que no tiene sentido cachearlas.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('firebaseio.com') || url.includes('googleapis.com') || url.includes('gstatic.com/firebasejs')) {
    return; // deja pasar sin interceptar
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
