const fs = require('fs')
const path = require('path')
const util = require('util')

const APP_LOG_FILE = process.env.APP_LOG_FILE || '/home/pi/logs/api/app.log'

function resolveEnvironment() {
  const raw = String(process.env.NODE_ENV || 'development').trim().toLowerCase()
  return raw === 'production' || raw === 'pro' ? 'production' : 'development'
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function safeStringify(value) {
  try {
    return JSON.stringify(value)
  } catch {
    return '{}'
  }
}

function writeJsonLogLine(filePath, payload) {
  try {
    ensureDirectory(filePath)
    fs.appendFileSync(filePath, `${safeStringify(payload)}\n`)
  } catch {
    // Ignore file logging errors to avoid taking down the API process.
  }
}

function normalizeError(errorValue) {
  if (!errorValue) {
    return undefined
  }

  if (errorValue instanceof Error) {
    return errorValue.stack || errorValue.message
  }

  return String(errorValue)
}

function normalizeModule(moduleName) {
  const value = String(moduleName || '').trim().toLowerCase()
  if (!value) {
    return 'app'
  }

  return value
}

function logApp({ level, module, message, error, service = 'api' }) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service,
    module: normalizeModule(module),
    message: String(message || ''),
    env: resolveEnvironment(),
  }

  const normalizedError = normalizeError(error)
  if (normalizedError) {
    payload.error = normalizedError
  }

  writeJsonLogLine(APP_LOG_FILE, payload)
}

function buildApiLogger(moduleName = 'app') {
  return {
    info(message, meta = {}) {
      logApp({ level: 'info', module: meta.module || moduleName, message, error: meta.error })
    },
    warn(message, meta = {}) {
      logApp({ level: 'warn', module: meta.module || moduleName, message, error: meta.error })
    },
    error(message, meta = {}) {
      logApp({
        level: 'error',
        module: meta.module || moduleName,
        message,
        error: meta.error || meta.stack || meta.details,
      })
    },
    debug(message, meta = {}) {
      logApp({ level: 'debug', module: meta.module || moduleName, message, error: meta.error })
    },
  }
}

const apiLogger = buildApiLogger('api')

function toLogMessage(args) {
  if (!Array.isArray(args) || args.length === 0) {
    return ''
  }

  if (args.length === 1) {
    const value = args[0]
    if (value instanceof Error) {
      return value.stack || value.message
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value)
      } catch {
        return util.inspect(value, { depth: 4 })
      }
    }
    return String(value)
  }

  return util.format(...args)
}

let consolePatched = false

function patchGlobalConsole() {
  if (consolePatched) {
    return
  }

  console.log = (...args) => {
    apiLogger.info(toLogMessage(args), { module: 'console' })
  }

  console.info = (...args) => {
    apiLogger.info(toLogMessage(args), { module: 'console' })
  }

  console.warn = (...args) => {
    apiLogger.warn(toLogMessage(args), { module: 'console' })
  }

  console.error = (...args) => {
    apiLogger.error(toLogMessage(args), { module: 'console' })
  }

  console.debug = (...args) => {
    apiLogger.debug(toLogMessage(args), { module: 'console' })
  }

  consolePatched = true
}

module.exports = {
  APP_LOG_FILE,
  apiLogger,
  buildApiLogger,
  logApp,
  patchGlobalConsole,
}
