const CACHE_NAME = 'participa-df-v14-local-vlibras';

const assets = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/@tailwindcss/browser@4',
  'https://unpkg.com/lucide@latest',
  './public/vlibras/vlibras-plugin.js',
  './public/vlibras/vlibras-plugin.css'
];

// Instalação: Cache dos arquivos estáticos iniciais
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força ativação imediata
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ [SW] Caching arquivos essenciais...');
      return cache.addAll(assets);
    })
  );
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('🧹 [SW] Removendo cache antigo:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Estratégia Cache First + Dynamic Caching (Crucial para VLibras)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Aceita status 0 (opaque) para permitir cache de CDNs externos como VLibras
        if (!response || (response.status !== 200 && response.status !== 0) || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
            cache.put(event.request, responseToCache);
          } catch (err) {
            // Ignora erros de quota ou tipos de requisição não suportados
          }
        });

        return response;
      }).catch(() => {
        // Se falhar (sem internet e não está no cache), não faz nada
      });
    })
  );
});