function createDispoDtoError(message, statusCode = 400, details) {
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

function ensureObject(payload, entityName) {
  if (!isPlainObject(payload)) {
    throw createDispoDtoError(`El body de ${entityName} debe ser un objeto JSON valido.`)
  }
}

function normalizeBoolean(value, fieldName) {
  if (value === undefined) return undefined

  if (typeof value === 'boolean') return value

  if (['true', 'false'].includes(value)) {
    return value === 'true'
  }

  throw createDispoDtoError(`El campo "${fieldName}" debe ser booleano.`)
}

function normalizeInteger(value, { fieldName, required = false, min = 1 } = {}) {
  if (value === undefined) {
    if (required) {
      throw createDispoDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return undefined
  }

  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue < min) {
    throw createDispoDtoError(`El campo "${fieldName}" debe ser un entero mayor o igual a ${min}.`)
  }

  return parsedValue
}

function normalizeText(value, { fieldName, required = false, nullable = false } = {}) {
  if (value === undefined) {
    if (required) {
      throw createDispoDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return undefined
  }

  if (value === null) {
    if (nullable) {
      return null
    }

    throw createDispoDtoError(`El campo "${fieldName}" no puede ser null.`)
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    throw createDispoDtoError(`El campo "${fieldName}" debe ser texto.`)
  }

  const normalizedValue = String(value).trim()

  if (!normalizedValue) {
    if (required) {
      throw createDispoDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return nullable ? null : undefined
  }

  return normalizedValue
}

function validateCustomState({ isCustom, customText }) {
  if (!isCustom && customText) {
    throw createDispoDtoError('No puedes enviar "customText" si "isCustom" es false.')
  }

  if (isCustom && !customText) {
    throw createDispoDtoError('Debes enviar "customText" cuando "isCustom" es true.')
  }
}

function buildRespuestaCreateDto(payload) {
  ensureObject(payload, 'respuesta')

  const dto = {
    convoId: normalizeInteger(payload.convoId, { fieldName: 'convoId', required: true }),
    userNCarnet: normalizeText(payload.userNCarnet, { fieldName: 'userNCarnet', required: true }),
    isCustom: normalizeBoolean(payload.isCustom, 'isCustom') ?? false,
    customText: normalizeText(payload.customText, { fieldName: 'customText', nullable: true }),
    fullHorari: normalizeBoolean(payload.fullHorari, 'fullHorari') ?? false,
    response: normalizeBoolean(payload.response, 'response'),
  }

  if (dto.response === undefined) {
    throw createDispoDtoError('El campo "response" es obligatorio.')
  }

  validateCustomState(dto)

  return dto
}

function buildRespuestaUpdateDto(payload) {
  ensureObject(payload, 'respuesta')

  const dto = {}

  if (payload.convoId !== undefined) {
    dto.convoId = normalizeInteger(payload.convoId, { fieldName: 'convoId', min: 1 })
  }

  if (payload.userNCarnet !== undefined) {
    dto.userNCarnet = normalizeText(payload.userNCarnet, { fieldName: 'userNCarnet' })
  }

  if (payload.isCustom !== undefined) {
    dto.isCustom = normalizeBoolean(payload.isCustom, 'isCustom')
  }

  if (payload.customText !== undefined) {
    dto.customText = normalizeText(payload.customText, { fieldName: 'customText', nullable: true })
  }

  if (payload.fullHorari !== undefined) {
    dto.fullHorari = normalizeBoolean(payload.fullHorari, 'fullHorari')
  }

  if (payload.response !== undefined) {
    dto.response = normalizeBoolean(payload.response, 'response')
  }

  if (Object.keys(dto).length === 0) {
    throw createDispoDtoError('Debes enviar al menos un campo para actualizar la respuesta.')
  }

  return dto
}

function mapRespuestaToDto(respuesta) {
  return {
    id: respuesta.id,
    convoId: respuesta.convoId,
    convocatoria: respuesta.convocatoria
      ? {
        id: respuesta.convocatoria.id,
        title: respuesta.convocatoria.title,
        date: respuesta.convocatoria.date,
        startTime: respuesta.convocatoria.startTime,
        finalTime: respuesta.convocatoria.finalTime,
        isActive: respuesta.convocatoria.isActive,
      }
      : null,
    userNCarnet: respuesta.userNCarnet,
    user: respuesta.user
      ? {
        id: respuesta.user.id,
        nCarnet: respuesta.user.nCarnet,
        name: respuesta.user.name,
        lastName: respuesta.user.lastName,
      }
      : null,
    isCustom: respuesta.isCustom,
    customText: respuesta.customText,
    fullHorari: respuesta.fullHorari,
    response: respuesta.response,
  }
}

module.exports = {
  buildRespuestaCreateDto,
  buildRespuestaUpdateDto,
  createDispoDtoError,
  mapRespuestaToDto,
}
