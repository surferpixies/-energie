// Énergie v3.56.194 — les URL versionnées identifient les fichiers à renouveler.
const CACHE_NAME = "energie-runtime-v2";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const target = await caches.open(CACHE_NAME);
    for (const name of await caches.keys()) {
      if (name === CACHE_NAME || !name.startsWith("energie-runtime-")) continue;
      const old = await caches.open(name);
      for (const request of await old.keys()) {
        if (!await target.match(request)) await target.put(request, await old.match(request));
      }
      await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  const versionedAsset = /\.(js|css)$/.test(url.pathname) && url.searchParams.has("v");
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (versionedAsset && cached) return cached;
    const network = fetch(event.request, { cache: "no-store" }).then(response => {
      if (response.ok) {
        const write = cache.put(event.request, response.clone()).catch(() => {});
        event.waitUntil(write);
      }
      return response;
    });
    if (event.request.mode === "navigate" && cached) {
      let timer;
      try {
        // Le document se vérifie sur le réseau, mais une connexion lente ne bloque pas le journal.
        event.waitUntil(network.catch(() => {}));
        return await Promise.race([network, new Promise(resolve => { timer = setTimeout(() => resolve(cached), 2000); })]);
      } catch (error) { return cached; }
      finally { clearTimeout(timer); }
    }
    try { return await network; }
    catch (error) { if (cached) return cached; throw error; }
  })());
});

