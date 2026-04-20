// Firebase Cloud Messaging service worker.
// NOTE: Replace the placeholders with real values for production hosting.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || 'demo-api-key-for-emulator',
  authDomain: self.FIREBASE_AUTH_DOMAIN || 'demo-venueflow.firebaseapp.com',
  projectId: self.FIREBASE_PROJECT_ID || 'demo-venueflow',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: self.FIREBASE_APP_ID || '1:000000000000:web:demo000000000000',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'VenueFlow';
  const options = {
    body: payload?.notification?.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    data: payload?.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || '/map';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(target);
      }

      return undefined;
    }),
  );
});
