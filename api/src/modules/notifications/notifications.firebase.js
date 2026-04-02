const fs = require('fs')
const path = require('path')
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
    const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH.trim()
    const apiRoot = path.resolve(__dirname, '../../..')
    const candidatePaths = [
      configuredPath,
      path.resolve(process.cwd(), configuredPath),
      path.resolve(apiRoot, configuredPath),
    ]

    const serviceAccountPath = candidatePaths.find((candidate) => fs.existsSync(candidate))

    try {
      if (!serviceAccountPath) {
        throw new Error('missing-file')
      }

      const raw = fs.readFileSync(serviceAccountPath, 'utf8')
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

function getFirebaseHealthStatus() {
  try {
    const serviceAccount = resolveServiceAccountFromEnv()
    const hasRequiredFields = Boolean(
      serviceAccount
      && serviceAccount.project_id
      && serviceAccount.client_email
      && serviceAccount.private_key
    )

    return {
      configured: hasRequiredFields,
      message: hasRequiredFields
        ? 'Firebase configurado correctamente.'
        : 'Credenciales Firebase incompletas.',
    }
  } catch (error) {
    return {
      configured: false,
      message: error.message || 'Firebase no configurado.',
    }
  }
}

module.exports = {
  getFirebaseHealthStatus,
  getFirebaseMessaging,
}
