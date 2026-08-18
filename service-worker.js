// service-worker.js - Cache offline de Mi Biblioteca de Sermones
//
// IMPORTANTE: todas las rutas son relativas (sin "/" al inicio).
// Con rutas absolutas ("/inicio.html") la app se rompe al publicarse
// en GitHub Pages, porque ahí el sitio vive en una subcarpeta
// (https://usuario.github.io/tu-repo/) y no en la raíz del dominio.
//
// Sube el número de CACHE_NAME cada vez que cambies archivos de la
// lista, para que los teléfonos que ya instalaron la app descarguen
// la versión nueva en vez de quedarse con la cacheada.
const CACHE_NAME = 'sermones-pwa-v2';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './inicio.html',
    './sermon.html',
    './biblia.html',
    './diccionario.html',
    './manifest.json',
    './css/global.css',
    './css/index.css',
    './css/inicio.css',
    './css/sermon.css',
    './css/biblia.css',
    './css/diccionario.css',
    './js/app.js',
    './js/database.js',
    './js/index.js',
    './js/inicio.js',
    './js/sermon.js',
    './js/biblia.js',
    './js/diccionario.js',
    './data/biblia.js',
    './data/diccionario.js',
    './data/sermones.js',
    './components/sidebar.js',
    './components/modal.js',
    './components/toast.js',
    './assets/icons/icon-72x72.png',
    './assets/icons/icon-96x96.png',
    './assets/icons/icon-128x128.png',
    './assets/icons/icon-144x144.png',
    './assets/icons/icon-152x152.png',
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-384x384.png',
    './assets/icons/icon-512x512.png',
    './assets/icons/maskable-512x512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache abierto');
                // addAll falla completo si UN solo archivo da 404; se usa
                // uno por uno para que un ícono faltante no tumbe el resto.
                return Promise.all(
                    ASSETS_TO_CACHE.map((asset) =>
                        cache.add(asset).catch((error) => {
                            console.warn('No se pudo cachear:', asset, error);
                        })
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
    // Solo interceptar peticiones GET del mismo origen (evita romper
    // peticiones a APIs externas, fuentes de Google, etc.)
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Devuelve del cache si existe
                if (response) {
                    return response;
                }

                // Si no está en cache, intenta obtenerlo de la red
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Verifica si la respuesta es válida
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clona la respuesta para guardarla en cache
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // Si falla la red y es una página, devuelve la página principal
                        if (event.request.mode === 'navigate') {
                            return caches.match('./inicio.html');
                        }

                        // Para recursos, devuelve un error
                        return new Response('Sin conexión', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Manejar mensajes
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});