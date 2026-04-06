const { apiAccessLogger } = require('../config/logger')

function requestLogger(req, res, next) {
  const startedAt = Date.now()

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    const payload = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
    }

    if (res.statusCode >= 500) {
      apiAccessLogger.error('HTTP request completed with server error', payload)
      return
    }

    if (res.statusCode >= 400) {
      apiAccessLogger.warn('HTTP request completed with client error', payload)
      return
    }

    apiAccessLogger.info('HTTP request completed', payload)
  })

  next()
}

module.exports = {
  requestLogger,
}
