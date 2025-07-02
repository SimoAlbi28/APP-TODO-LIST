const BASE_PATH = '/TODO-LIST-APP/';

const CACHE_NAME = 'todo-cache-v1';
const FILES_TO_CACHE = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'style.css',
  BASE_PATH + 'script.js',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'img/icon-192.png',
  BASE_PATH + 'img/icon-512.png'
];

self.addEventListener('install', event => {
  console.log('Service Worker installato');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker attivato');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResp => {
      return cachedResp || fetch(event.request);
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Promemoria Attività';
  const options = {
    body: data.body || 'Hai un’attività programmata!',
    icon: BASE_PATH + 'img/icon-192.png',
    badge: BASE_PATH + 'img/icon-192.png',
    tag: data.tag || 'todo-reminder'
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});