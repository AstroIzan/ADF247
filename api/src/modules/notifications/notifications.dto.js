function createNotificationsDtoError(message, statusCode = 400, details) {
  const error = new Error(message)
  error.statusCode = statusCode

  if (details) {
    error.details = details
  }

  return error
}

function parseTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildRegisterDeviceTokenDto(payload = {}) {
  const token = parseTrimmedString(payload.token)

  if (!token) {
    throw createNotificationsDtoError('El campo "token" es obligatorio.')
  }

  return {
    token,
    platform: parseTrimmedString(payload.platform) || 'web',
    userAgent: parseTrimmedString(payload.userAgent) || undefined,
  }
}

function buildDeactivateDeviceTokenDto(payload = {}) {
  const token = parseTrimmedString(payload.token)

  if (!token) {
    throw createNotificationsDtoError('El campo "token" es obligatorio.')
  }

  return { token }
}

function buildSendBroadcastDto(payload = {}) {
  const title = parseTrimmedString(payload.title)
  const body = parseTrimmedString(payload.body)

  if (!title) {
    throw createNotificationsDtoError('El campo "title" es obligatorio.')
  }

  if (!body) {
    throw createNotificationsDtoError('El campo "body" es obligatorio.')
  }

  const link = parseTrimmedString(payload.link) || '/home'
  const data = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data
    : {}

  const stringData = {}
  for (const [key, rawValue] of Object.entries(data)) {
    stringData[key] = String(rawValue)
  }

  return {
    title,
    body,
    link,
    data: stringData,
  }
}

function buildNotificationLogsQueryDto(query = {}) {
  const rawLimit = Number.parseInt(String(query.limit || '20'), 10)
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20

  return { limit }
}

function mapDeviceTokenToDto(deviceToken) {
  return {
    id: deviceToken.id,
    token: deviceToken.token,
    platform: deviceToken.platform,
    isActive: deviceToken.isActive,
    lastSeenAt: deviceToken.lastSeenAt,
    createdAt: deviceToken.createdAt,
  }
}

function mapNotificationLogToDto(log) {
  return {
    id: log.id,
    title: log.title,
    body: log.body,
    targetScope: log.targetScope,
    requestedCount: log.requestedCount,
    successCount: log.successCount,
    failureCount: log.failureCount,
    status: log.status,
    errorMessage: log.errorMessage,
    createdAt: log.createdAt,
    senderUserId: log.senderUserId,
  }
}

module.exports = {
  buildDeactivateDeviceTokenDto,
  buildNotificationLogsQueryDto,
  buildRegisterDeviceTokenDto,
  buildSendBroadcastDto,
  createNotificationsDtoError,
  mapDeviceTokenToDto,
  mapNotificationLogToDto,
}
