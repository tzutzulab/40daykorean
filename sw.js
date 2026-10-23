const CACHE_NAME = 'korean-40day-v12-android-fix';
const URLS_TO_CACHE = ['./','./index.html'];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(URLS_TO_CACHE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', (e)=>{
  if(e.request.method!=='GET') return;
  if(e.request.url.includes('translate.google') || e.request.url.includes('chrome-extension') || e.request.url.includes('speech')) return;
  e.respondWith(
    fetch(e.request).then(resp=>{
      if(resp && resp.status===200 && resp.type==='basic'){
        const clone=resp.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(e.request, clone));
      }
      return resp;
    }).catch(()=>caches.match(e.request))
  );
});