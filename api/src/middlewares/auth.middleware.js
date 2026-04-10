const authService = require('../modules/auth/auth.service')
const database = require('../../../database/prisma/prisma')

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

async function requireAdmin(req, _res, next) {
  try {
    if (!req.auth?.userId) {
      const error = new Error('Debes estar autenticado para realizar esta accion.')
      error.statusCode = 401
      throw error
    }

    const isAdmin = await database.role.findFirst({
      where: {
        userId: req.auth.userId,
        isAdmin: true,
      },
      select: { id: true },
    })

    if (!isAdmin) {
      const error = new Error('Solo un admin puede realizar esta accion.')
      error.statusCode = 403
      throw error
    }

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  requireAuth,
  requireAdmin,
}