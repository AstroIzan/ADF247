function createSimpleRateLimit({ windowMs, max, keyPrefix = 'global' }) {
  const requestsByKey = new Map()

  return function simpleRateLimit(req, _res, next) {
    const key = `${keyPrefix}:${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`
    const now = Date.now()
    const current = requestsByKey.get(key)

    if (!current || now > current.resetAt) {
      requestsByKey.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      next()
      return
    }

    if (current.count >= max) {
      const error = new Error('Has superado el limite de peticiones para este recurso. Intenta de nuevo en unos minutos.')
      error.statusCode = 429
      next(error)
      return
    }

    current.count += 1
    next()
  }
}

module.exports = {
  createSimpleRateLimit,
}
