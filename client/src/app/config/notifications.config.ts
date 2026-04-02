export const notificationsConfig = {
  firebase: {
    apiKey: "AIzaSyAqvmPgENspdFCwVKz9k0y7aCBMIHZpHvI",
    authDomain: "adf247-95ce1.firebaseapp.com",
    projectId: "adf247-95ce1",
    storageBucket: "adf247-95ce1.firebasestorage.app",
    messagingSenderId: "24116711500",
    appId: "1:24116711500:web:0463655ddef3a58d77e4e9",
  },
  vapidKey: 'BMs8ElZ6Mp8DWTpAcqUK0L33iEGPYpmC1LfA1ZfPWBzqsI9Z28KwvEHdWuvdmyMr8KQl1sJSX_5bZCKD8otnnv0',
}

export function isNotificationsConfigReady() {
  return !Object.values(notificationsConfig.firebase).some((value) => value.startsWith('REPLACE_WITH_'))
    && !notificationsConfig.vapidKey.startsWith('REPLACE_WITH_')
}
