const CACHE_NAME = 'chembase-pro-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (event.request.headers.has('Authorization')) return;

  // For navigation and static asset requests, always fetch from network first
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const cacheControl = (networkResponse.headers.get('Cache-Control') || '').toLowerCase();
        const isSensitive = cacheControl.includes('no-store') || cacheControl.includes('private');
        if (networkResponse && networkResponse.status === 200 && !isSensitive) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
