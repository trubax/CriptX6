importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD38C-wyEziutHYrQG4rFatW-9Z5In37Ss",
  authDomain: "criptax-8d87d.firebaseapp.com",
  projectId: "criptax-8d87d",
  storageBucket: "criptax-8d87d.appspot.com",
  messagingSenderId: "693837443791",
  appId: "1:693837443791:web:c3d93b462cc82458e6bdba",
  measurementId: "G-YNX6MZDC7K"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { notification } = payload;
  
  if (!notification) return;

  const notificationOptions = {
    body: notification.body,
    icon: notification.icon || '/logo.svg',
    badge: notification.badge,
    tag: notification.tag,
    data: notification.click_action ? { url: notification.click_action } : undefined
  };

  self.registration.showNotification(notification.title, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data?.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});