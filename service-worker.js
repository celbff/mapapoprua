/* ============================================================
   SERVICE WORKER — Rede de Apoio Araraquara
   Cache offline (PWA)
   ============================================================ */

const CACHE_NAME = "rede-apoio-v1";

const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/placeholder.jpg"
];

/* INSTALAÇÃO */

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

/* ATIVAÇÃO */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
});

/* FETCH — offline first */

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return (
        resp ||
        fetch(event.request).then(fetchResp => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResp.clone());
            return fetchResp;
          });
        })
      );
    })
  );
});
