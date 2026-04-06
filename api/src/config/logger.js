const fs = require('fs')
const path = require('path')
const util = require('util')
const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

const { combine, errors, json, timestamp } = winston.format

const LOG_ROOT_DIR = process.env.LOGS_DIR || path.resolve(__dirname, '..', '..', '..', 'logs')
const API_LOG_DIR = path.join(LOG_ROOT_DIR, 'api')
const CLIENT_LOG_DIR = path.join(LOG_ROOT_DIR, 'client')
const ACCESS_LOG_DIR = path.join(LOG_ROOT_DIR, 'accesslogs')

const LOG_INDEX_APP = 'applogs'
const LOG_INDEX_ACCESS = 'accesslogs'

function resolveEnvironmentTag(rawNodeEnv) {
  const value = String(rawNodeEnv || 'development').trim().toLowerCase()
  return value === 'production' || value === 'pro' ? 'pro' : 'dev'
}

const LOG_ENVIRONMENT = resolveEnvironmentTag(process.env.NODE_ENV)

fs.mkdirSync(API_LOG_DIR, { recursive: true })
fs.mkdirSync(CLIENT_LOG_DIR, { recursive: true })
fs.mkdirSync(ACCESS_LOG_DIR, { recursive: true })

function buildBaseTransports(dirPath, appPrefix) {
  return [
    new DailyRotateFile({
      filename: path.join(dirPath, `${appPrefix}-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
      level: 'info',
    }),
    new DailyRotateFile({
      filename: path.join(dirPath, `${appPrefix}-error-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
      level: 'error',
    }),
  ]
}

const loggerFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
)

const apiLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  defaultMeta: { service: 'api', index: LOG_INDEX_APP, environment: LOG_ENVIRONMENT },
  format: loggerFormat,
  transports: [
    ...buildBaseTransports(API_LOG_DIR, LOG_INDEX_APP),
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp: ts, stack }) => {
          return `${ts} [${level.toUpperCase()}] ${stack || message}`
        }),
      ),
    }),
  ],
})

const clientLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'client', index: LOG_INDEX_APP, environment: LOG_ENVIRONMENT },
  format: loggerFormat,
  transports: buildBaseTransports(CLIENT_LOG_DIR, LOG_INDEX_APP),
})

const apiAccessLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'api', index: LOG_INDEX_ACCESS, environment: LOG_ENVIRONMENT },
  format: loggerFormat,
  transports: buildBaseTransports(ACCESS_LOG_DIR, LOG_INDEX_ACCESS),
})

const clientAccessLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'client', index: LOG_INDEX_ACCESS, environment: LOG_ENVIRONMENT },
  format: loggerFormat,
  transports: buildBaseTransports(ACCESS_LOG_DIR, LOG_INDEX_ACCESS),
})

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
    apiLogger.info(toLogMessage(args))
  }

  console.info = (...args) => {
    apiLogger.info(toLogMessage(args))
  }

  console.warn = (...args) => {
    apiLogger.warn(toLogMessage(args))
  }

  console.error = (...args) => {
    apiLogger.error(toLogMessage(args))
  }

  console.debug = (...args) => {
    apiLogger.debug(toLogMessage(args))
  }

  consolePatched = true
}

function normalizeClientLevel(level) {
  const rawLevel = String(level || '').toLowerCase()

  if (rawLevel === 'error') {
    return 'error'
  }

  if (rawLevel === 'warn' || rawLevel === 'warning') {
    return 'warn'
  }

  return 'info'
}

function normalizeLogIndex(rawIndex) {
  const index = String(rawIndex || '').trim().toLowerCase()
  if (index === LOG_INDEX_ACCESS || index === 'issserverlogs') {
    return LOG_INDEX_ACCESS
  }

  return LOG_INDEX_APP
}

function getClientLoggerForIndex(index) {
  const normalized = normalizeLogIndex(index)
  if (normalized === LOG_INDEX_ACCESS) {
    return clientAccessLogger
  }

  return clientLogger
}

module.exports = {
  LOG_INDEX_APP,
  LOG_INDEX_ACCESS,
  LOG_ROOT_DIR,
  apiLogger,
  apiAccessLogger,
  clientAccessLogger,
  clientLogger,
  getClientLoggerForIndex,
  normalizeLogIndex,
  normalizeClientLevel,
  patchGlobalConsole,
}
