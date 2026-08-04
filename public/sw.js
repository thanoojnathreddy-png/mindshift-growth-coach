/* MindShift service worker — real Web Push delivery + notification routing. */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { title: "MindShift", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "MindShift";
  const options = {
    body: payload.body || "Take a moment to check in with yourself.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.tag || "mindshift",
    renotify: false,
    requireInteraction: false,
    data: {
      url: payload.url || "/dashboard",
      logId: payload.logId || null,
      notificationType: payload.notificationType || "commitment",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = new URL(data.url || "/dashboard", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin)) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(target);
              return;
            } catch (error) {
              /* fall through to openWindow */
            }
          }
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
