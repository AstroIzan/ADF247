const { mapUserToDto } = require('../users/users.dto')

function createAuthDtoError(message, statusCode = 400, details) {
  const error = new Error(message)
  error.statusCode = statusCode

  if (details) {
    error.details = details
  }

  return error
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeText(value, fieldName) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw createAuthDtoError(`El campo "${fieldName}" es obligatorio.`)
  }

  const normalizedValue = String(value).trim()

  if (!normalizedValue) {
    throw createAuthDtoError(`El campo "${fieldName}" es obligatorio.`)
  }

  return normalizedValue
}

function buildLoginDto(payload) {
  if (!isPlainObject(payload)) {
    throw createAuthDtoError('El body de login debe ser un objeto JSON valido.')
  }

  return {
    nCarnet: normalizeText(payload.nCarnet, 'nCarnet'),
    password: normalizeText(payload.password, 'password'),
  }
}

function buildRefreshDto(payload) {
  if (!isPlainObject(payload)) {
    throw createAuthDtoError('El body de refresh debe ser un objeto JSON valido.')
  }

  return {
    refreshToken: normalizeText(payload.refreshToken, 'refreshToken'),
  }
}

function mapSessionUserToDto(user) {
  return mapUserToDto(user)
}

function mapLoginResponseDto({ accessToken, expiresIn, refreshToken, refreshExpiresIn, user }) {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn,
    refreshToken,
    refreshExpiresIn,
    user: mapSessionUserToDto(user),
  }
}

function mapRefreshResponseDto({ accessToken, expiresIn, refreshToken, refreshExpiresIn, user }) {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn,
    refreshToken,
    refreshExpiresIn,
    user: mapSessionUserToDto(user),
  }
}

module.exports = {
  buildLoginDto,
  buildRefreshDto,
  createAuthDtoError,
  mapLoginResponseDto,
  mapRefreshResponseDto,
  mapSessionUserToDto,
}