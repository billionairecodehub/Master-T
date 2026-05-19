// ── MasterTogan Service Worker ────────────────────────────────
// Strategy: network-first for all navigation.
// Only caches the offline fallback page — never caches app assets
// (HTTP Cache-Control headers handle asset freshness).
// On every new deployment, activate immediately and wipe all old caches.
// ──────────────────────────────────────────────────────────────

const CACHE_NAME = "mtogan-offline-v1";
const OFFLINE_URL = "/offline.html";

// ── Install: cache the offline page only ─────────────────────
self.addEventListener("install", (event) => {
  // Take control immediately without waiting for old SW clients to close
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => {
        /* offline.html not reachable during install — skip */
      }),
  );
});

// ── Activate: delete every cache that isn't the current one ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: network-first; show branded offline page on failure ─
self.addEventListener("fetch", (event) => {
  // Only handle same-origin page navigations (not API calls, images, etc.)
  if (
    event.request.mode !== "navigate" ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then(
        (cached) =>
          cached ||
          new Response("<h1>You are offline</h1>", {
            headers: { "Content-Type": "text/html" },
          }),
      ),
    ),
  );
});
