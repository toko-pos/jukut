// ============================================================
// SERVICE WORKER - PWA POS SYSTEM
// ============================================================

const CACHE_NAME = 'pos-app-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './iconbayamtabur.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// ===== INSTALL =====
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('✅ All files cached');
        return self.skipWaiting();
      })
      .catch(function(err) {
        console.error('❌ Cache failed:', err);
      })
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', function(event) {
  console.log('🔧 Service Worker: Activating...');
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
    }).then(function() {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// ===== FETCH =====
self.addEventListener('fetch', function(event) {
  // Skip Google Apps Script requests
  if (event.request.url.indexOf('script.google.com') > -1) {
    return;
  }
  
  // Skip chrome-extension requests
  if (event.request.url.indexOf('chrome-extension') > -1) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request
        var fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(function(response) {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response for caching
            var responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(function(error) {
            console.log('❌ Fetch failed:', error);
            return caches.match('./index.html');
          });
      })
  );
});

console.log('✅ Service Worker loaded!');
