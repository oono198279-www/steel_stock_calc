const CACHE_NAME = 'steel-calc-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
  // 必要に応じてCSS/画像/フォントなどを追加
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return; // POST等はスルー
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // 同一オリジンのGETのみキャッシュ追記
        try {
          const url = new URL(event.request.url);
          if (url.origin === location.origin) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
          }
        } catch {}
        return resp;
      }).catch(() => {
        // オフライン時はトップをフォールバック
        return caches.match('./index.html');
      });
    })
  );
});
