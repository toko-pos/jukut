// ============================================================
// SERVICE WORKER - PWA POS SYSTEM UNTUK GITHUB PAGES
// ============================================================

const CACHE_NAME = 'pos-app-v6';  // 🔥 GANTI VERSI!

// 🔥 FIX: Base path untuk GitHub Pages
const BASE_PATH = self.location.pathname.replace(/\/[^/]*$/, '/') || '/';

// 🔥 HANYA CACHE FILE STATIS YANG SANGAT PENTING
const urlsToCache = [
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'iconbayamtabur.png'
  // 🔥 JANGAN CACHE library external! Biarkan browser handle sendiri
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
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('✅ Files cached');
        // 🔥 FORCE SKIP WAITING!
        return self.skipWaiting();
      })
      .catch(function(err) {
        console.error('❌ Cache failed:', err);
        // Minimal cache: hanya index.html
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
      console.log('✅ Old caches cleared');
      // 🔥 CLAIM CLIENTS IMMEDIATELY
      return self.clients.claim();
    })
  );
});

// ===== FETCH =====
self.addEventListener('fetch', function(event) {
  const requestUrl = event.request.url;
  
  // 🔥 KRUSIAL: SKIP SEMUA REQUEST KE GAS!
  if (requestUrl.indexOf('script.google.com') > -1 || 
      requestUrl.indexOf('googleapis.com') > -1 ||
      requestUrl.indexOf('gstatic.com') > -1 ||
      requestUrl.indexOf('script.googleusercontent.com') > -1) {
    console.log('⏭️ Skip API request:', requestUrl);
    return; // Biarkan browser handle
  }

  // Skip chrome-extension requests
  if (requestUrl.indexOf('chrome-extension') > -1) {
    return;
  }

  // 🔥 KRUSIAL: JANGAN CACHE POST REQUESTS!
  if (event.request.method === 'POST') {
    return;
  }

  // 🔥 HANYA UNTUK FILE STATIS
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          console.log('✅ From cache:', requestUrl);
          return response;
        }

        return fetch(event.request)
          .then(function(response) {
            // 🔥 JANGAN CACHE JIKA RESPONSE ERROR!
            if (!response || response.status !== 200) {
              console.log('⚠️ Response not 200:', response ? response.status : 'no response');
              return response;
            }

            // Hanya cache HTML, CSS, JS, Images
            const contentType = response.headers.get('content-type') || '';
            const isCacheable = contentType.includes('text/html') || 
                               contentType.includes('text/css') || 
                               contentType.includes('application/javascript') ||
                               contentType.includes('image/');
            
            if (isCacheable) {
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
            // 🔥 FALLBACK: Tampilkan index.html dari cache
            return caches.match(BASE_PATH + 'index.html')
              .then(function(cachedResponse) {
                if (cachedResponse) {
                  return cachedResponse;
                }
                return new Response('Halaman tidak ditemukan', { status: 404 });
              });
          });
      })
  );
});

console.log('✅ Service Worker loaded!');
