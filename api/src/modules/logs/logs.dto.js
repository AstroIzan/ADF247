const ALLOWED_LEVELS = new Set(['info', 'warn', 'error'])
const ALLOWED_INDEXES = new Set(['applogs', 'accesslogs', 'issserverlogs'])
const MAX_LOG_MESSAGE_LENGTH = 4000

function buildValidationError(message) {
  const error = new Error(message)
  error.statusCode = 400
  return error
}

function sanitizeMessage(rawMessage) {
  const message = String(rawMessage || '').trim()

  if (!message) {
    throw buildValidationError('El mensaje del log es obligatorio.')
  }

  if (message.length > MAX_LOG_MESSAGE_LENGTH) {
    return message.slice(0, MAX_LOG_MESSAGE_LENGTH - 18) + '... [truncated]'
  }

  return message
}

function sanitizeLevel(rawLevel) {
  const level = String(rawLevel || 'info').toLowerCase().trim()

  if (!ALLOWED_LEVELS.has(level)) {
    throw buildValidationError('Nivel de log no valido. Usa info, warn o error.')
  }

  return level
}

function sanitizeContext(rawContext) {
  if (rawContext == null) {
    return undefined
  }

  if (typeof rawContext !== 'object' || Array.isArray(rawContext)) {
    throw buildValidationError('El contexto del log debe ser un objeto JSON.')
  }

  return rawContext
}

function sanitizeTimestamp(rawTimestamp) {
  if (!rawTimestamp) {
    return new Date().toISOString()
  }

  const date = new Date(rawTimestamp)
  if (Number.isNaN(date.getTime())) {
    throw buildValidationError('timestamp no valido.')
  }

  return date.toISOString()
}

function sanitizeSource(rawSource) {
  const source = String(rawSource || '').trim()

  if (!source) {
    return 'ui'
  }

  return source.slice(0, 120)
}

function sanitizeIndex(rawIndex) {
  const index = String(rawIndex || 'applogs').trim().toLowerCase()

  if (!ALLOWED_INDEXES.has(index)) {
    throw buildValidationError('Indice de log no valido. Usa applogs o accesslogs.')
  }

  if (index === 'issserverlogs') {
    return 'accesslogs'
  }

  return index
}

function sanitizeEnvironment(rawEnvironment) {
  const value = String(rawEnvironment || '').trim().toLowerCase()
  if (!value) {
    return undefined
  }

  if (value === 'production' || value === 'pro') {
    return 'pro'
  }

  return 'dev'
}

function parseDateQuery(rawValue, fieldName) {
  if (!rawValue) {
    return null
  }

  const parsed = new Date(String(rawValue))
  if (Number.isNaN(parsed.getTime())) {
    throw buildValidationError(`Parametro ${fieldName} no valido.`)
  }

  return parsed
}

function sanitizeOptionalText(rawValue, maxLength) {
  if (rawValue == null) {
    return undefined
  }

  const value = String(rawValue).trim()
  if (!value) {
    return undefined
  }

  return value.slice(0, maxLength)
}

function validateClientLogPayload(payload = {}) {
  return {
    level: sanitizeLevel(payload.level),
    index: sanitizeIndex(payload.index),
    message: sanitizeMessage(payload.message),
    source: sanitizeSource(payload.source),
    timestamp: sanitizeTimestamp(payload.timestamp),
    environment: sanitizeEnvironment(payload.environment),
    context: sanitizeContext(payload.context),
  }
}

function parseLogsSearchQuery(query = {}) {
  let limit
  if (query.limit != null && String(query.limit).trim() !== '') {
    const rawLimit = Number.parseInt(String(query.limit), 10)
    limit = Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : undefined
  }
  const rawOffset = Number.parseInt(String(query.offset || '0'), 10)
  const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0

  const levelRaw = sanitizeOptionalText(query.level, 12)
  const level = levelRaw ? sanitizeLevel(levelRaw) : undefined

  return {
    index: sanitizeIndex(query.index),
    level,
    source: sanitizeOptionalText(query.source, 120),
    query: sanitizeOptionalText(query.q, 500),
    from: parseDateQuery(query.from, 'from'),
    to: parseDateQuery(query.to, 'to'),
    offset,
    limit,
  }
}

module.exports = {
  parseLogsSearchQuery,
  validateClientLogPayload,
}
