// ============================================================
// SERVICE WORKER - PWA POS SYSTEM (TOKO + RESELLER)
// ============================================================

const CACHE_NAME = 'pos-app-v2';

// 🔥 PERUBAHAN: Deteksi base path secara otomatis
const BASE_PATH = self.location.pathname.replace(/\/[^/]*$/, '/') || '/';

const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'iconbayamtabur.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// ===== INSTALL =====
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker: Installing...');
  console.log('📁 BASE_PATH:', BASE_PATH);
  
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
        // Coba cache minimal
        return caches.open(CACHE_NAME)
          .then(function(cache) {
            return cache.add(BASE_PATH + 'index.html');
          })
          .then(function() {
            return self.skipWaiting();
          });
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

  // Skip POST requests (API calls)
  if (event.request.method === 'POST') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }

        var fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(function(response) {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(function(error) {
            console.log('❌ Fetch failed:', error);
            // 🔥 PERBAIKAN: Coba ambil index.html dari cache
            return caches.match(BASE_PATH + 'index.html')
              .then(function(cachedIndex) {
                if (cachedIndex) {
                  return cachedIndex;
                }
                // Fallback ke root
                return caches.match('/index.html');
              })
              .catch(function() {
                return new Response('Halaman tidak ditemukan', { status: 404 });
              });
          });
      })
  );
});

console.log('✅ Service Worker loaded!');
console.log('📁 BASE_PATH:', BASE_PATH);
