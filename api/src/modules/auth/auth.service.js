const database = require('../../../../database/prisma/prisma')
const userInclude = { roles: true }
const jwt = require('jsonwebtoken')
const { mapPrismaError } = require('../users/users.service')
const { buildLoginDto, buildRefreshDto, createAuthDtoError, mapLoginResponseDto, mapRefreshResponseDto, mapSessionUserToDto } = require('./auth.dto')
const { hashPassword, isPasswordHash, verifyPassword } = require('./auth.password')

function isProductionEnvironment() {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase()
  return nodeEnv === 'production' || nodeEnv === 'pro'
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET
  }

  if (isProductionEnvironment()) {
    throw createAuthDtoError('Falta configurar JWT_SECRET en el entorno.', 500)
  }

  return 'adf247-dev-secret-change-me'
}

function getJwtRefreshSecret() {
  if (process.env.JWT_REFRESH_SECRET) {
    return process.env.JWT_REFRESH_SECRET
  }

  if (isProductionEnvironment()) {
    throw createAuthDtoError('Falta configurar JWT_REFRESH_SECRET en el entorno.', 500)
  }

  return 'adf247-dev-refresh-secret-change-me'
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '12h'
}

function getJwtRefreshExpiresIn() {
  return process.env.JWT_REFRESH_EXPIRES_IN || '30d'
}

function createTokenPayload(user, type) {
  return {
    sub: String(user.id),
    nCarnet: user.nCarnet,
    type,
  }
}

function signAccessToken(user) {
  return jwt.sign(createTokenPayload(user, 'access'), getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  })
}

function signRefreshToken(user) {
  return jwt.sign(createTokenPayload(user, 'refresh'), getJwtRefreshSecret(), {
    expiresIn: getJwtRefreshExpiresIn(),
  })
}

async function findUserByNCarnet(nCarnet) {
  return database.user.findUnique({
    where: { nCarnet },
    include: userInclude,
  })
}

async function findUserByIdOrThrow(id) {
  const user = await database.user.findUnique({
    where: { id },
    include: userInclude,
  })

  if (!user) {
    throw createAuthDtoError('No se ha encontrado el usuario autenticado.', 401)
  }

  return user
}

async function upgradeLegacyPasswordIfNeeded(user, rawPassword) {
  if (isPasswordHash(user.password)) {
    return
  }

  const hashedPassword = await hashPassword(rawPassword)

  try {
    await database.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    user.password = hashedPassword
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function login(payload) {
  const credentials = buildLoginDto(payload)
  const user = await findUserByNCarnet(credentials.nCarnet)

  if (!user) {
    throw createAuthDtoError('Credenciales invalidas.', 401)
  }

  const isPasswordValid = await verifyPassword(credentials.password, user.password)

  if (!isPasswordValid) {
    throw createAuthDtoError('Credenciales invalidas.', 401)
  }

  if (!user.isActive) {
    throw createAuthDtoError('El usuario esta inactivo y no puede iniciar sesion.', 403)
  }

  await upgradeLegacyPasswordIfNeeded(user, credentials.password)

  return mapLoginResponseDto({
    accessToken: signAccessToken(user),
    expiresIn: getJwtExpiresIn(),
    refreshToken: signRefreshToken(user),
    refreshExpiresIn: getJwtRefreshExpiresIn(),
    user,
  })
}

async function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, getJwtSecret())

    if (payload.type !== 'access') {
      throw createAuthDtoError('El token no es un access token valido.', 401)
    }

    return {
      userId: Number.parseInt(payload.sub, 10),
      nCarnet: payload.nCarnet,
    }
  } catch (_error) {
    throw createAuthDtoError('El token no es valido o ha expirado.', 401)
  }
}

async function refreshSession(payload) {
  const { refreshToken } = buildRefreshDto(payload)

  let decodedRefreshToken

  try {
    decodedRefreshToken = jwt.verify(refreshToken, getJwtRefreshSecret())
  } catch (_error) {
    throw createAuthDtoError('El refresh token no es valido o ha expirado.', 401)
  }

  if (decodedRefreshToken.type !== 'refresh') {
    throw createAuthDtoError('El token enviado no es un refresh token valido.', 401)
  }

  const userId = Number.parseInt(decodedRefreshToken.sub, 10)

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createAuthDtoError('El refresh token no es valido.', 401)
  }

  const user = await findUserByIdOrThrow(userId)

  if (!user.isActive) {
    throw createAuthDtoError('El usuario autenticado esta inactivo.', 403)
  }

  return mapRefreshResponseDto({
    accessToken: signAccessToken(user),
    expiresIn: getJwtExpiresIn(),
    refreshToken: signRefreshToken(user),
    refreshExpiresIn: getJwtRefreshExpiresIn(),
    user,
  })
}

async function getCurrentUser(authUser) {
  const user = await findUserByIdOrThrow(authUser.userId)

  if (!user.isActive) {
    throw createAuthDtoError('El usuario autenticado esta inactivo.', 403)
  }

  return mapSessionUserToDto(user)
}

module.exports = {
  getCurrentUser,
  login,
  refreshSession,
  verifyAccessToken,
}