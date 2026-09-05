// ============================================================
// SERVICE WORKER - PWA POS SYSTEM UNTUK GITHUB PAGES
// ============================================================

const CACHE_NAME = 'pos-app-v7';

// 🔥 Base path untuk GitHub Pages
const BASE_PATH = self.location.pathname.replace(/\/[^/]*$/, '/') || '/';

// 🔥 HANYA CACHE FILE STATIS - JANGAN CACHE API GAS!
const urlsToCache = [
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'iconbayamtabur.png'
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
      })
      .catch(function(err) {
        console.error('❌ Cache failed:', err);
        // Fallback: cache index.html saja
        return caches.open(CACHE_NAME)
          .then(function(cache) {
            return cache.add(BASE_PATH + 'index.html');
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
    })
  );
});

// ===== FETCH =====
self.addEventListener('fetch', function(event) {
  const requestUrl = event.request.url;
  
  // 🔥 SKIP SEMUA REQUEST KE GAS (biarkan browser handle)
  if (requestUrl.indexOf('script.google.com') > -1 || 
      requestUrl.indexOf('googleapis.com') > -1 ||
      requestUrl.indexOf('gstatic.com') > -1 ||
      requestUrl.indexOf('script.googleusercontent.com') > -1 ||
      requestUrl.indexOf('translate.googleapis.com') > -1 ||
      requestUrl.indexOf('translate.google.com') > -1) {
    console.log('⏭️ Skip API request:', requestUrl);
    return;
  }

  // Skip chrome-extension requests
  if (requestUrl.indexOf('chrome-extension') > -1) {
    return;
  }

  // 🔥 JANGAN CACHE POST REQUESTS
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
            // Jangan cache jika response error
            if (!response || response.status !== 200) {
              console.log('⚠️ Response not 200:', response ? response.status : 'no response');
              return response;
            }

            // Hanya cache static assets
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
            // Fallback: tampilkan index.html dari cache
            return caches.match(BASE_PATH + 'index.html')
              .then(function(cachedResponse) {
                if (cachedResponse) {
                  return cachedResponse;
                }
                return new Response('Halaman tidak ditemukan', { 
                  status: 404,
                  statusText: 'Not Found' 
                });
              });
          });
      })
  );
});

console.log('✅ Service Worker loaded!');
