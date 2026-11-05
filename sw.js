// sw.js — service worker: cachea todo para que KAIRÓS Reader funcione 100% offline.
const CACHE = "kairos-reader-v1";
const ASSETS = [
  "./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest",
  "./kairos-adapter.js", "./scaffold-bank.js",
  "./engine/local-prosody.js", "./engine/eco-dsp-stub.js",
  "./content/phonetic-targets.json",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./audio/water.mp3", "./audio/little_star.mp3", "./audio/butterfly.mp3",
  "./audio/good_morning.mp3", "./audio/my_name_is.mp3", "./audio/thank_you.mp3"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(ASSETS.map(a => c.add(a)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// cache-first: offline total; si no está, intenta red (primera carga).
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
