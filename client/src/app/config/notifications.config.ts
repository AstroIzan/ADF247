export const notificationsConfig = {
  firebase: {
    apiKey: 'REPLACE_WITH_FIREBASE_API_KEY',
    authDomain: 'REPLACE_WITH_FIREBASE_AUTH_DOMAIN',
    projectId: 'REPLACE_WITH_FIREBASE_PROJECT_ID',
    storageBucket: 'REPLACE_WITH_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'REPLACE_WITH_FIREBASE_APP_ID',
  },
  vapidKey: 'REPLACE_WITH_FIREBASE_WEB_PUSH_CERTIFICATE_KEY_PAIR',
}

export function isNotificationsConfigReady() {
  return !Object.values(notificationsConfig.firebase).some((value) => value.startsWith('REPLACE_WITH_'))
    && !notificationsConfig.vapidKey.startsWith('REPLACE_WITH_')
}
