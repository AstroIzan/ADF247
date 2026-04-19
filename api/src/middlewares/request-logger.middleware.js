const fs = require('fs')
const path = require('path')

const REQUESTS_LOG_FILE = process.env.REQUESTS_LOG_FILE || '/home/pi/logs/api/requests.log'

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value)
  } catch {
    return '{}'
  }
}

function appendRequestLog(payload) {
  try {
    ensureDirectory(REQUESTS_LOG_FILE)
    fs.appendFileSync(REQUESTS_LOG_FILE, `${safeJsonStringify(payload)}\n`)
  } catch {
    // Ignore file logging errors to avoid breaking request handling.
  }
}

function requestLogger(req, res, next) {
  const startedAt = Date.now()

  res.on('finish', () => {
    const payload = {
      timestamp: new Date().toISOString(),
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - startedAt,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
      query: req.query || {},
      body: req.body || {},
    }

    if (req.auth?.userId) {
      payload.userId = String(req.auth.userId)
    }

    appendRequestLog(payload)
  })

  next()
}

module.exports = {
  requestLogger,
}
