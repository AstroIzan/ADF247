const authService = require('../modules/auth/auth.service')

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

async function requireAuth(req, _res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization)

    if (!token) {
      const error = new Error('Debes enviar un token Bearer valido.')
      error.statusCode = 401
      throw error
    }

    req.auth = await authService.verifyAccessToken(token)
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  requireAuth,
}