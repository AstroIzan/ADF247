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
