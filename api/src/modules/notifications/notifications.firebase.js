const fs = require('fs')
const admin = require('firebase-admin')

function createFirebaseConfigError(message) {
  const error = new Error(message)
  error.statusCode = 500
  return error
}

function resolveServiceAccountFromEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    } catch {
      throw createFirebaseConfigError('FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON valido.')
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const raw = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
      return JSON.parse(raw)
    } catch {
      throw createFirebaseConfigError('No se ha podido leer FIREBASE_SERVICE_ACCOUNT_PATH.')
    }
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  }

  throw createFirebaseConfigError(
    'Faltan credenciales Firebase. Configura FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_SERVICE_ACCOUNT_PATH.'
  )
}

function ensureFirebaseApp() {
  if (admin.apps.length > 0) {
    return admin.app()
  }

  const serviceAccount = resolveServiceAccountFromEnv()

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

function getFirebaseMessaging() {
  ensureFirebaseApp()
  return admin.messaging()
}

module.exports = {
  getFirebaseMessaging,
}
