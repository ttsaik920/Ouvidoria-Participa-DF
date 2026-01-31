const CACHE_NAME = 'participa-df-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // Bibliotecas Externas (CDNs)
  'https://unpkg.com/@tailwindcss/browser@4',
  'https://unpkg.com/lucide@latest',
  'https://vlibras.gov.br/app/vlibras-plugin.js',
  'https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;900&display=swap',
  'https://fonts.cdnfonts.com/css/rawline',
  // Imagens e Assets Visuais
  'https://sso.acesso.gov.br/assets/govbr/img/govbr.png',
  'https://sso.acesso.gov.br/assets/govbr/img/conta_govbr_v2.jpg',
  'https://sso.acesso.gov.br/assets/govbr/img/senha.png',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTop6zJhmEKdP3sVHeIIJIwZsVx3lVxL1W9xf9ovAPhnET6qUTg8w&s&ec=121525316',
  // Ícones Locais (Garantir que o PWA instale corretamente)
  './public/ouvidoria-pwa/icons/icon-192x192.png',
  './public/ouvidoria-pwa/icons/icon-512x512.png'
];

// Instalação: Cachear tudo imediatamente
self.addEventListener('install', (event) => {
  // Força o SW a assumir o controle imediatamente, sem esperar o usuário fechar a aba
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Cacheando assets estáticos...');
      
      // Estratégia Robusta: Tratar imagens externas com 'no-cors' para garantir cache (opaco)
      const promises = ASSETS.map(async (url) => {
        try {
          // Para imagens do gov.br e google, forçamos no-cors para garantir que sejam cacheadas
          if (url.includes('sso.acesso.gov.br') || url.includes('gstatic.com')) {
            const req = new Request(url, { mode: 'no-cors' });
            const res = await fetch(req);
            return cache.put(url, res);
          }
          // Para arquivos locais e bibliotecas compatíveis, usa o padrão
          return cache.add(url);
        } catch (err) {
          console.warn('[SW] Falha ao cachear recurso:', url, err);
        }
      });
      
      return Promise.all(promises);
    })
  );
});

// Ativação: Limpar caches antigos e assumir controle dos clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  // Garante que o SW controle a página imediatamente após ativar, sem precisar de reload
  self.clients.claim();
});

// Fetch: Estratégia Cache-First (Cache, depois Rede)
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não sejam GET (ex: POST de formulários)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Se estiver no cache, retorna o cache (Velocidade máxima e Offline garantido)
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Se não estiver no cache, tenta a rede
      return fetch(event.request).catch(() => {
        // 3. Se a rede falhar (Offline) e for uma navegação (HTML), retorna a Home
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        // Opcional: Retornar placeholder para imagens se necessário
      });
    })
  );
});