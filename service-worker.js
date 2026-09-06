const CACHE_VERSION = "future-plus-v1.0.0";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./login.html",
  "./register.html",
  "./admission.html",

  "./student/dashboard.html",

  "./admin/dashboard.html",
  "./admin/admissions.html",
  "./admin/assignments.html",
  "./admin/attendance.html",
  "./admin/fees.html",
  "./admin/notices.html",
  "./admin/study-material.html",

  "./assets/css/style.css",

  "./assets/js/app.js",
  "./assets/js/supabase.js",
  "./assets/js/auth.js",
  "./assets/js/student.js",
  "./assets/js/admin.js",
  "./assets/js/admissions-admin.js",
  "./assets/js/assignments-admin.js",
  "./assets/js/attendance-admin.js",
  "./assets/js/fees-admin.js",
  "./assets/js/notices-admin.js",
  "./assets/js/study-material-admin.js",

  "./assets/images/logo.jpg",

  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(error => {
        console.error("PWA cache install error:", error);
      })
  );

  self.skipWaiting();
});


self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => {
            return name !== STATIC_CACHE && name !== PAGE_CACHE;
          })
          .map(name => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});


self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Supabase/API requests should always use network.
  if (
    url.hostname.includes("supabase.co") ||
    url.pathname.includes("/rest/") ||
    url.pathname.includes("/auth/")
  ) {
    return;
  }

  // HTML navigation = Network First
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(PAGE_CACHE).then(cache => {
            cache.put(request, copy);
          });

          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cached => {
              return cached || caches.match("./index.html");
            });
        })
    );

    return;
  }

  // CSS / JS / images / manifest = Cache First
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(networkResponse => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type !== "opaque"
            ) {
              const copy = networkResponse.clone();

              caches.open(STATIC_CACHE).then(cache => {
                cache.put(request, copy);
              });
            }

            return networkResponse;
          });
      })
      .catch(() => {
        return new Response(
          "You are offline. Please reconnect to the internet.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      })
  );
});


self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
