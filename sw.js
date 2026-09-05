// ============================================================
// SERVICE WORKER - PWA POS SYSTEM (TOKO + RESELLER)
// ============================================================

const CACHE_NAME = 'pos-app-v3';

// 🔥 FIX: Base path dari lokasi script saat ini
const BASE_PATH = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/') + 1);

const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'iconbayamtabur.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

console.log('📁 Service Worker BASE_PATH:', BASE_PATH);
console.log('📁 urlsToCache:', urlsToCache);

// ===== INSTALL =====
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('✅ Cache opened');
        // Coba cache semua file
        return cache.addAll(urlsToCache).catch(function(err) {
          console.error('❌ Cache addAll failed:', err);
          // Fallback: cache minimal
          return cache.add(BASE_PATH + 'index.html');
        });
      })
      .then(function() {
        console.log('✅ All files cached');
        return self.skipWaiting();
      })
      .catch(function(err) {
        console.error('❌ Cache failed:', err);
        return self.skipWaiting();
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
  const requestUrl = event.request.url;
  
  // Skip Google Apps Script API requests
  if (requestUrl.indexOf('script.google.com') > -1 || 
      requestUrl.indexOf('googleapis.com') > -1) {
    console.log('⏭️ Skip API request:', requestUrl);
    return;
  }

  // Skip chrome-extension requests
  if (requestUrl.indexOf('chrome-extension') > -1) {
    return;
  }

  // Skip POST requests (API calls)
  if (event.request.method === 'POST') {
    return;
  }

  console.log('🔄 Fetching:', requestUrl);

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          console.log('✅ From cache:', requestUrl);
          return response;
        }

        return fetch(event.request)
          .then(function(response) {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              console.log('⚠️ Response not OK:', response ? response.status : 'no response');
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();
            
            // Cache the response
            caches.open(CACHE_NAME)
              .then(function(cache) {
                try {
                  cache.put(event.request, responseToCache);
                } catch(e) {
                  console.warn('⚠️ Failed to cache:', e);
                }
              });

            return response;
          })
          .catch(function(error) {
            console.log('❌ Fetch failed:', error);
            // 🔥 FIX: Coba ambil index.html dari cache
            return caches.match(BASE_PATH + 'index.html')
              .then(function(cachedResponse) {
                if (cachedResponse) {
                  console.log('✅ Returning cached index.html');
                  return cachedResponse;
                }
                // Fallback: coba root
                return caches.match('index.html');
              });
          });
      })
  );
});

console.log('✅ Service Worker loaded!');
