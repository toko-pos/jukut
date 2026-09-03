// ==================== SERVICE WORKER ====================
const CACHE_NAME = 'pos-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
  // Tambahkan file lain jika ada (CSS, JS, gambar, dll)
];

// ===== INSTALL =====
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(function(err) {
        console.error('❌ Cache failed:', err);
      })
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ===== FETCH =====
self.addEventListener('fetch', function(event) {

if (event.request.url.indexOf('script.google.com') > -1) return;
  if (event.request.url.indexOf('chrome-extension') > -1) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached response if found, else fetch from network
        return response || fetch(event.request)
          .then(function(response) {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response for caching
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});
