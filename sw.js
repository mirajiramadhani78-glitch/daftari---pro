// Offline app shell: the app opens without internet; data offline is handled by Firestore's own cache.
const CACHE='daftaripro-1.0.0-mvl9108y';
const SHELL=["./","./app.js","./apple-touch-icon.png","./config.js","./favicon.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./index.html","./manifest.webmanifest"];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin)return; // Firebase traffic goes straight to the network
  // config.js: try the network first so a changed config reaches phones; fall back to the cached copy offline
  if(url.pathname.endsWith('/config.js')){
    e.respondWith(fetch(req).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(req,c));return r}).catch(()=>caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(r=>{
    if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(req,c))}return r;
  }).catch(()=>req.mode==='navigate'?caches.match('./index.html'):undefined)));
});
