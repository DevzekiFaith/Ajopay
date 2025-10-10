const CACHE_NAME = 'ajopay-cache-v2'; // Updated version to force cache refresh
const STATIC_ASSETS = [
  '/aj2.png',
  '/manifest.webmanifest'
];

// Don't cache dynamic pages that depend on authentication
const NO_CACHE_PATHS = [
  '/sign-in',
  '/sign-up', 
  '/dashboard',
  '/customer',
  '/admin',
  '/agent',
  '/payment',
  '/wallet'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  
  // Only handle GET requests
  if (req.method !== 'GET') return;
  
  // Don't cache dynamic pages that depend on authentication
  const shouldNotCache = NO_CACHE_PATHS.some(path => url.pathname.startsWith(path));
  
  if (shouldNotCache) {
    // Always fetch fresh content for authenticated pages
    event.respondWith(fetch(req));
    return;
  }
  
  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        return cached;
      }
      
      return fetch(req).then((res) => {
        // Only cache successful responses for static assets
        if (res.status === 200 && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        }
        return res;
      }).catch(() => {
        // Return cached version if fetch fails
        return caches.match(req);
      });
    })
  );
});

// Listen for messages to clear cache (e.g., after sign-in/sign-out)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});