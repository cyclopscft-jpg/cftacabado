const CACHE_NAME = "cft-manager-v2";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARCHIVOS);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((respuesta) => {
        const copia = respuesta.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copia);
        });

        return respuesta;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
/* =========================================
   CFT — PRUEBA PUSH TEMPORAL
   ========================================= */

self.addEventListener("push", (event) => {

    let datos = {
        titulo: "CFT Manager",
        mensaje: "Nueva solicitud de renovación"
    };

    try {

        if (event.data) {

            datos =
                event.data.json();

        }

    } catch (error) {

        console.log(
            "Push recibido como texto."
        );

        if (event.data) {

            datos.mensaje =
                event.data.text();

        }
    }

    event.waitUntil(

        self.registration.showNotification(
            datos.titulo ||
            "CFT Manager",
            {
                body:
                    datos.mensaje ||
                    "Tienes una nueva notificación."
            }
        )

    );

});
