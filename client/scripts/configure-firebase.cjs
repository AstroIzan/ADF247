const fs = require('fs')
const path = require('path')

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
]

const firebaseConfig = JSON.parse(process.env.FIREBASE_WEB_CONFIG_JSON)
const vapidKey = process.env.FIREBASE_WEB_VAPID_KEY

for (const key of requiredConfigKeys) {
  if (typeof firebaseConfig[key] !== 'string' || !firebaseConfig[key].trim()) {
    throw new Error(`Firebase web configuration is missing ${key}.`)
  }
}

if (!vapidKey || !vapidKey.trim()) {
  throw new Error('Firebase web configuration is missing the VAPID key.')
}

const notificationsConfig = `export const notificationsConfig = {
  firebase: ${JSON.stringify(firebaseConfig, null, 2)},
  vapidKey: ${JSON.stringify(vapidKey)},
}

export function isNotificationsConfigReady() {
  return !Object.values(notificationsConfig.firebase).some((value) => value.startsWith('REPLACE_WITH_'))
    && !notificationsConfig.vapidKey.startsWith('REPLACE_WITH_')
}
`

const serviceWorker = `/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js')

firebase.initializeApp(${JSON.stringify(firebaseConfig, null, 2)})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'ADF247'
  const icon = payload.data?.notificationIcon || payload.notification?.image || '/icons/notification-icon-512.png'
  const badge = payload.data?.notificationBadge || '/icons/favicon-64.png'
  const options = {
    body: payload.notification?.body || '',
    data: payload.data || {},
    icon,
    badge,
  }

  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification?.data || {}
  const convoId = data.convocatoriaId || data.convoId
  const kind = data.kind || ''
  const targetPath = convoId
    ? \`/home?notificationKind=\${encodeURIComponent(kind)}&convoId=\${encodeURIComponent(convoId)}\`
    : (data.link || '/home')

  event.waitUntil(clients.openWindow(targetPath))
})
`

fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'app', 'config', 'notifications.config.ts'),
  notificationsConfig,
)
fs.writeFileSync(
  path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js'),
  serviceWorker,
)
