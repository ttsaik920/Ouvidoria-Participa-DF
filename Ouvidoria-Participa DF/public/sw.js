const CACHE_NAME = 'ouvidoria-gdf-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Recursos Externos (CDNs) essenciais para Offline
  'https://unpkg.com/@tailwindcss/browser@4',
  'https://unpkg.com/lucide@latest',
  'https://vlibras.gov.br/app/vlibras-plugin.js',
  'https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;900&display=swap',
  'https://fonts.cdnfonts.com/css/rawline',
  'https://sso.acesso.gov.br/assets/govbr/img/govbr.png',
  'https://sso.acesso.gov.br/assets/govbr/img/conta_govbr_v2.jpg',
  'https://sso.acesso.gov.br/assets/govbr/img/senha.png',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTop6zJhmEKdP3sVHeIIJIwZsVx3lVxL1W9xf9ovAPhnET6qUTg8w&s&ec=121525316'
];

// Estratégia Cache-First para garantir funcionamento Offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
          return response;
        })
        .catch(() => {
          // Se falhar rede e não tiver cache, retorna fallback para página principal
          return cached || caches.match('/');
        });

      // Retorna cache imediatamente se houver, ou a rede se não houver cache
      return cached || networked;
    })
  );
});

// Sincronização em background para formulários quando voltar a internet
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-manifestacao') {
    console.log('Sincronizando manifestações offline...');
  }
});
