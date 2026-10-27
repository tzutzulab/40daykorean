// 40daykorean - Final PWA SW
const CACHE_NAME = '40korean-v3-final';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安裝：預快取，單個失敗不影響整體
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // 一個一個加，404 也不會讓整個 install 失敗
      await Promise.allSettled(
        PRECACHE.map(async url => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res.ok) await cache.put(url, res);
          } catch (e) {
            console.warn('[SW] precache skip', url, e);
          }
        })
      );
    })()
  );
  self.skipWaiting();
});

// 啟用：清掉舊版
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// 請求：導航用 network-first，其他用 cache-first
self.addEventListener('fetch', event => {
  const req = event.request;
  if (!req.url.startsWith('http')) return;
  if (req.method !== 'GET') return;

  // 頁面導航：先試網路，失敗回 index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match('./index.html');
          return cached || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // 靜態資源：先快取，再網路
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        // 只快取同源的成功回應
        if (res.ok && req.url.startsWith(self.location.origin)) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        // 圖片離線時回傳空
        return new Response('', { status: 204 });
      }
    })()
  );
});
