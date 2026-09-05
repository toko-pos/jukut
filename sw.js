// ============================================================
// SERVICE WORKER - PWA POS SYSTEM (TOKO + RESELLER)
// UNTUK GITHUB PAGES
// ============================================================

const CACHE_NAME = 'pos-app-v4';

// 🔥 FIX: Deteksi base path untuk GitHub Pages
const BASE_PATH = self.location.pathname.replace(/\/[^/]*$/, '/') || '/';
const FULL_URL = self.location.origin + BASE_PATH;

console.log('📁 Service Worker BASE_PATH:', BASE_PATH);
console.log('📁 FULL_URL:', FULL_URL);

// 🔥 HANYA CACHE FILE STATIS (TIDAK TERMASUK API GAS)
const urlsToCache = [
  './',  // root
  './index.html',
  './manifest.json',
  './iconbayamtabur.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// ===== INSTALL =====
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker: Installing...');
  console.log('📁 Cache targets:', urlsToCache);
  
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
        // Minimal cache: hanya index.html
        return caches.open(CACHE_NAME)
          .then(function(cache) {
            return cache.add('./index.html');
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
  const requestUrl = event.request.url;
  
  // 🔥 SKIP SEMUA REQUEST KE GAS
  if (requestUrl.indexOf('script.google.com') > -1 || 
      requestUrl.indexOf('googleapis.com') > -1 ||
      requestUrl.indexOf('script.googleusercontent.com') > -1) {
    console.log('⏭️ Skip GAS request:', requestUrl);
    return; // Biarkan browser handle sendiri
  }

  // Skip chrome-extension requests
  if (requestUrl.indexOf('chrome-extension') > -1) {
    return;
  }

  // Skip POST requests (API calls)
  if (event.request.method === 'POST') {
    return;
  }

  // 🔥 HANYA UNTUK FILE STATIS DI GITHUB PAGES
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

            // Only cache static assets (images, css, js, html)
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/html') || 
                contentType.includes('text/css') || 
                contentType.includes('application/javascript') ||
                contentType.includes('image/')) {
              
              var responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  try {
                    cache.put(event.request, responseToCache);
                  } catch(e) {
                    console.warn('⚠️ Failed to cache:', e);
                  }
                });
            }

            return response;
          })
          .catch(function(error) {
            console.log('❌ Fetch failed:', error);
            // 🔥 FIX: Coba ambil index.html dari cache
            return caches.match('./index.html')
              .then(function(cachedResponse) {
                if (cachedResponse) {
                  console.log('✅ Returning cached index.html');
                  return cachedResponse;
                }
                return new Response('Halaman tidak ditemukan', { status: 404 });
              });
          });
      })
  );
});

console.log('✅ Service Worker loaded!');
console.log('📁 GitHub Pages URL:', FULL_URL);
