const CACHE_NAME = 'coloreco-cache-v1';
const STATIC_CACHE_NAME = 'coloreco-static-v1';

// Lista de archivos críticos para cachear inmediatamente
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
];

// Patrones de archivos estáticos a cachear
const STATIC_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
  /\.(?:mp3|wav|ogg|m4a)$/i,
  /\.(?:woff|woff2|ttf|eot)$/i,
  /\.(?:json)$/i,
];

// Archivos a cachear bajo demanda (cache-first)
const RUNTIME_CACHE_PATTERNS = [
  /^\/audio\//,
  /^\/escenas\//,
  /^\/historias\//,
  /^\/logros\//,
  /^\/pictograms\//,
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching critical assets');
        return cache.addAll(PRECACHE_ASSETS.filter(Boolean));
      })
      .then(() => self.skipWaiting())
      .catch((error) => console.error('[SW] Precache failed:', error))
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear peticiones del mismo origen
  if (url.origin !== self.location.origin) {
    return;
  }

  // Estrategia para archivos estáticos: Cache First
  if (shouldCacheStatic(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // Estrategia para páginas HTML: Network First
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, CACHE_NAME));
    return;
  }

  // Para otros recursos: Network First con fallback a cache
  event.respondWith(networkFirst(request, CACHE_NAME));
});

// Verifica si un archivo debe ser cacheado como estático
function shouldCacheStatic(pathname) {
  // Verifica extensiones de archivo
  if (STATIC_PATTERNS.some(pattern => pattern.test(pathname))) {
    return true;
  }
  
  // Verifica patrones de rutas
  if (RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(pathname))) {
    return true;
  }
  
  return false;
}

// Estrategia Cache First (para archivos estáticos)
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Actualizar cache en segundo plano
      fetchAndCache(request, cacheName);
      return cachedResponse;
    }
    
    return await fetchAndCache(request, cacheName);
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Estrategia Network First (para páginas HTML)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline - content not available', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Obtener y cachear un recurso
async function fetchAndCache(request, cacheName) {
  const networkResponse = await fetch(request);
  
  if (networkResponse && networkResponse.status === 200) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Precarga de archivos estáticos específicos cuando el SW está activo
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRECACHE_ASSETS') {
    const urls = event.data.urls;
    
    event.waitUntil(
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => {
          console.log('[SW] Precaching additional assets:', urls.length);
          return cache.addAll(urls);
        })
        .catch((error) => console.error('[SW] Failed to precache assets:', error))
    );
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
