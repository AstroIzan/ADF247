/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js')

firebase.initializeApp({
    apiKey: "AIzaSyAqvmPgENspdFCwVKz9k0y7aCBMIHZpHvI",
    authDomain: "adf247-95ce1.firebaseapp.com",
    projectId: "adf247-95ce1",
    storageBucket: "adf247-95ce1.firebasestorage.app",
    messagingSenderId: "24116711500",
    appId: "1:24116711500:web:0463655ddef3a58d77e4e9",
})

const messaging = firebase.messaging()

// El SDK mostra les notificacions (bloc notification); aquí només gestionem el clic.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const nd = event.notification?.data || {}
  const link = nd.link || nd.FCM_MSG?.data?.link || '/home'
  const target = new URL(link, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          return client.focus().then((focused) => ('navigate' in focused ? focused.navigate(target) : focused))
        }
      }
      return clients.openWindow(target)
    })
  )
})
