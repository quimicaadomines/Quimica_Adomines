const CACHE_NAME = 'adomines-cache-v1';
const urlsToCache = [
  './',
  'index.html',
  'global.css',
  'global.js',
  'manifest.json',
  'logobranca.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Tenta cachear todos os recursos de uma vez de forma padrão
        return cache.addAll(urlsToCache).catch(err => {
          console.warn("Aviso: Falha ao cachear todos os arquivos em lote. Tentando cacheamento individual...", err);
          
          // Fallback robusto: se um arquivo falhar (ex: 404), os outros continuam sendo cacheados
          // Isso garante que o Service Worker instale e o botão de download funcione mesmo se faltar algum recurso
          return Promise.all(
            urlsToCache.map(url => {
              return cache.add(url).catch(cacheErr => {
                console.error(`Erro ao cachear recurso individual (${url}):`, cacheErr);
              });
            })
          );
        });
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});