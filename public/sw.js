const CACHE_NAME = "pricecompare-v1";

// Assets to cache on install
const PRECACHE_ASSETS = [
  "/",
  "/budget",
  "/party",
  "/flyers",
  "/receipt-scan",
  "/my-prices",
  "/watch-list",
  "/shopping-list",
  "/scan",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install — precache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first for API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== "GET") return;

  // API requests — network only (prices must be fresh)
  if (url.pathname.startsWith("/api/")) return;

  // HTML pages & static assets — stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback — return cached or a basic offline page
          return cachedResponse;
        });

      // Return cached immediately, update in background
      return cachedResponse || fetchPromise;
    })
  );
});
