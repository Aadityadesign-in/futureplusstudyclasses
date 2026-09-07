const CACHE_NAME = "future-plus-v2";
const PAGE_CACHE = "future-plus-pages-v2";

const STATIC_FILES = [
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
    "./admin/study-material.html",
    "./admin/notices.html",

    "./manifest.json",

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
    "./assets/images/icon-192.png",
    "./assets/images/icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_FILES))
    );

    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(
                        key =>
                            key !== CACHE_NAME &&
                            key !== PAGE_CACHE
                    )
                    .map(key => caches.delete(key))
            );
        })
    );

    self.clients.claim();
});

self.addEventListener("fetch", event => {

    const request = event.request;
    const url = new URL(request.url);

    if (
        url.hostname.includes("supabase.co") ||
        url.pathname.includes("/rest/v1/") ||
        url.pathname.includes("/auth/v1/")
    ) {
        return;
    }

    if (request.method !== "GET") {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {

                    const copy = response.clone();

                    caches.open(PAGE_CACHE)
                        .then(cache => {
                            cache.put(request, copy);
                        });

                    return response;
                })
                .catch(async () => {

                    const cachedPage =
                        await caches.match(request);

                    if (cachedPage) {
                        return cachedPage;
                    }

                    return caches.match("./index.html");
                })
        );

        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cached => {

                if (cached) {
                    return cached;
                }

                return fetch(request)
                    .then(response => {

                        if (
                            !response ||
                            response.status !== 200 ||
                            response.type === "opaque"
                        ) {
                            return response;
                        }

                        const copy = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(request, copy);
                            });

                        return response;
                    });
            })
    );
});

self.addEventListener("message", event => {

    if (event.data === "SKIP_WAITING") {
        self.skipWaiting();
    }

});
