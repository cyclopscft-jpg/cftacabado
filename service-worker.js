const CACHE_NAME = "cft-manager-v2";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


/* =========================================
   INSTALAR
   ========================================= */

self.addEventListener(
    "install",
    (event) => {

        self.skipWaiting();

        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(
                    (cache) => {
                        return cache.addAll(
                            ARCHIVOS
                        );
                    }
                )
        );
    }
);


/* =========================================
   ACTIVAR
   ========================================= */

self.addEventListener(
    "activate",
    (event) => {

        event.waitUntil(

            caches.keys()
                .then(
                    (keys) =>
                        Promise.all(
                            keys
                                .filter(
                                    (key) =>
                                        key !==
                                        CACHE_NAME
                                )
                                .map(
                                    (key) =>
                                        caches.delete(
                                            key
                                        )
                                )
                        )
                )
                .then(
                    () =>
                        self.clients.claim()
                )
        );
    }
);


/* =========================================
   FETCH
   ========================================= */

self.addEventListener(
    "fetch",
    (event) => {

        event.respondWith(

            fetch(event.request)

                .then(
                    (respuesta) => {

                        const copia =
                            respuesta.clone();

                        caches
                            .open(CACHE_NAME)
                            .then(
                                (cache) => {

                                    cache.put(
                                        event.request,
                                        copia
                                    );

                                }
                            );

                        return respuesta;
                    }
                )

                .catch(
                    () => {

                        return caches.match(
                            event.request
                        );

                    }
                )
        );
    }
);


/* =========================================
   PUSH
   ========================================= */

self.addEventListener(
    "push",
    (event) => {

        let datos = {
            titulo:
                "CFT Manager",

            mensaje:
                "Nueva solicitud de renovación",

            solicitud_id:
                null
        };


        try {

            if (event.data) {

                datos =
                    event.data.json();

            }

        } catch (error) {

            console.log(
                "ℹ️ PUSH recibido como texto."
            );

            if (event.data) {

                datos.mensaje =
                    event.data.text();

            }
        }


        const urlNotificaciones =
            new URL(
                "./?cft_notificaciones=1",
                self.registration.scope
            ).href;


        event.waitUntil(

            self.registration.showNotification(
                datos.titulo ||
                    "CFT Manager",

                {
                    body:
                        datos.mensaje ||
                        "Tienes una nueva notificación.",

                    data: {
                        url:
                            urlNotificaciones,

                        solicitud_id:
                            datos.solicitud_id ||
                            null
                    },

                    tag:
    "cft-renovacion-" +
    (datos.solicitud_id || Date.now()),

renotify:
    true,

silent:
    false
                }
            )

        );
    }
);


/* =========================================
   CLICK EN LA NOTIFICACIÓN
   ========================================= */

self.addEventListener(
    "notificationclick",
    (event) => {

        event.notification.close();


        const url =
            event.notification?.data?.url ||
            new URL(
                "./?cft_notificaciones=1",
                self.registration.scope
            ).href;


        event.waitUntil(

            self.clients
                .matchAll({
                    type:
                        "window",

                    includeUncontrolled:
                        true
                })

                .then(
                    async (clientes) => {

                        for (
                            const cliente
                            of clientes
                        ) {

                            try {

                                await cliente.navigate(
                                    url
                                );

                                return cliente.focus();

                            } catch (error) {

                                console.log(
                                    "⚠️ No se pudo reutilizar la ventana:",
                                    error
                                );

                            }
                        }


                        if (
                            self.clients.openWindow
                        ) {

                            return self.clients.openWindow(
                                url
                            );

                        }

                    }
                )

        );
    }
);
