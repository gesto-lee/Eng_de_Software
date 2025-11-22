// Nome do cache
const cacheName = 'pwa-alnails-v1';

// Lista de arquivos a serem cacheados
const filesToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Como não temos ícones reais, vamos simular que eles estão aqui.
  // Se você tivesse ícones, eles deveriam ser listados aqui!
  // '/icon-192x192.png',
  // '/icon-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(cacheName)
      .then((cache) => {
        console.log('Service Worker: Cacheando arquivos essenciais.');
        return cache.addAll(filesToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando.');
  // Exclui caches antigos
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== cacheName) {
          console.log('Service Worker: Removendo cache antigo', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Busca (Fetch) - Intercepta requisições
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam 'http' ou 'https' (como extensões)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna o cache se ele existir
        if (response) {
          return response;
        }

        // Se não estiver no cache, faz a requisição normal (fetch)
        return fetch(event.request).then((networkResponse) => {
          // Verifica se a resposta da rede é válida antes de cachear
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clona a resposta para cachear e retornar
          const responseToCache = networkResponse.clone();
          caches.open(cacheName)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        });
      })
      .catch((error) => {
        // Isto acontece quando a rede falha e não há cache.
        console.error('Service Worker: Falha na busca e sem cache.', error);
        // Você poderia retornar uma página offline aqui, se tivesse uma.
      })
  );
});