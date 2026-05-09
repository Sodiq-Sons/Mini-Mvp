const CACHE_NAME = "campconnect-v2";
const PRECACHE_URLS = ["/offline.html"];

// ─── Install: pre-cache only the offline fallback page ───────────────────────
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .catch(() => {}),
    );
    // Activate immediately — don't wait for old tabs to close
    self.skipWaiting();
});

// ─── Activate: delete every cache that isn't the current version ──────────────
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== CACHE_NAME)
                        .map((k) => caches.delete(k)),
                ),
            ),
    );
    // Take control of all open tabs right away
    self.clients.claim();
});

// ─── Fetch: network-first, cache on success, serve stale when offline ─────────
self.addEventListener("fetch", (event) => {
    // Only handle same-origin GET requests
    if (
        event.request.method !== "GET" ||
        !event.request.url.startsWith(self.location.origin)
    ) {
        return;
    }

    // Never intercept Next.js HMR / webpack internals in dev
    const url = new URL(event.request.url);
    if (url.pathname.startsWith("/_next/webpack-hmr")) return;

    // For Next.js static assets (_next/static) use cache-first:
    // these are content-addressed (hashed filenames) so they never go stale.
    if (url.pathname.startsWith("/_next/static/")) {
        event.respondWith(cacheFirst(event.request));
        return;
    }

    // Everything else (pages, API routes, images…) → network-first
    event.respondWith(networkFirst(event.request));
});

// ─── Strategy: network-first ──────────────────────────────────────────────────
// 1. Try the network.
// 2. On success → update the cache in the background, return fresh response.
// 3. On failure (offline/timeout) → serve from cache.
// 4. Nothing in cache → serve /offline.html for navigation requests.
async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        const networkResponse = await fetch(request);

        // Only cache valid responses
        if (networkResponse.ok) {
            // Clone before consuming — Response body can only be read once
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch {
        // Offline or network error — fall back to cache
        const cached = await cache.match(request);
        if (cached) return cached;

        // For navigate requests with no cache entry, show the offline page
        if (request.mode === "navigate") {
            const offline = await cache.match("/offline.html");
            if (offline) return offline;
        }

        // Last resort: let the browser show its own error
        return Response.error();
    }
}

// ─── Strategy: cache-first (for hashed static assets) ────────────────────────
// 1. Return from cache if present (always fresh — filename changes on rebuild).
// 2. Otherwise fetch, cache, and return.
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch {
        return Response.error();
    }
}
