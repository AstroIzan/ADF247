/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'REPLACE_WITH_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_FIREBASE_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_FIREBASE_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_FIREBASE_APP_ID',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'ADF247'
  const options = {
    body: payload.notification?.body || '',
    data: payload.data || {},
  }

  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetPath = event.notification?.data?.link || '/home'

  event.waitUntil(clients.openWindow(targetPath))
})
