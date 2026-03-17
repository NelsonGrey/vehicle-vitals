// Firebase Messaging Service Worker
/* eslint-disable no-undef */
// Use compat builds — they expose the `firebase` global required by service workers.
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js'
);
// Firebase Hosting automatically serves the correct project config here,
// including calling firebase.initializeApp() — no hard-coded values needed.
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(payload => {
  console.log('Received background message:', payload);

  const notificationUrl =
    payload.data?.path ||
    (payload.data?.vin
      ? `/app/upcoming?source=push&vin=${encodeURIComponent(payload.data.vin)}`
      : '/app/upcoming?source=push');

  const notificationTitle = payload.notification?.title || 'Vehicle Vitals';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/firebase-logo.png',
    badge: '/firebase-logo.png',
    tag: payload.data?.tag || 'vehicle-vitals-notification',
    data: {
      url: notificationUrl,
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || '/app/upcoming?source=push';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({
              type: 'vehicle-vitals:notification-click',
              url: targetUrl,
            });
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }

        return clients.openWindow(targetUrl);
      })
  );
});
/* eslint-enable no-undef */
