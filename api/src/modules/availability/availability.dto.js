function createAvailabilityDtoError(message, statusCode = 400, details) {
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
    throw createAvailabilityDtoError(`El body de ${entityName} debe ser un objeto JSON valido.`)
  }
}

function normalizeText(value, { fieldName, required = false, nullable = false } = {}) {
  if (value === undefined) {
    if (required) {
      throw createAvailabilityDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return undefined
  }

  if (value === null) {
    if (nullable) {
      return null
    }

    throw createAvailabilityDtoError(`El campo "${fieldName}" no puede ser null.`)
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    throw createAvailabilityDtoError(`El campo "${fieldName}" debe ser texto.`)
  }

  const normalized = String(value).trim()

  if (!normalized) {
    if (required) {
      throw createAvailabilityDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return nullable ? null : undefined
  }

  return normalized
}

function normalizeDate(value, { fieldName, required = false } = {}) {
  if (value === undefined) {
    if (required) {
      throw createAvailabilityDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return undefined
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    throw createAvailabilityDtoError(`El campo "${fieldName}" debe ser una fecha valida.`)
  }

  return parsedDate
}

function normalizeAvailabilityType(value, fieldName) {
  const normalized = normalizeText(value, { fieldName, required: true })

  if (normalized !== 'available' && normalized !== 'unavailable') {
    throw createAvailabilityDtoError('El campo "availabilityType" debe ser "available" o "unavailable".')
  }

  return normalized
}

function normalizeSource(value) {
  if (value === undefined) {
    return 'manual'
  }

  const normalized = normalizeText(value, { fieldName: 'source', required: true })

  if (!['manual', 'import', 'system'].includes(normalized)) {
    throw createAvailabilityDtoError('El campo "source" debe ser "manual", "import" o "system".')
  }

  return normalized
}

function buildAvailabilityWindowCreateDto(payload) {
  ensureObject(payload, 'ventana de disponibilidad')

  const dto = {
    userNCarnet: normalizeText(payload.userNCarnet, { fieldName: 'userNCarnet', required: true }),
    fromDateTime: normalizeDate(payload.fromDateTime, { fieldName: 'fromDateTime', required: true }),
    toDateTime: normalizeDate(payload.toDateTime, { fieldName: 'toDateTime', required: true }),
    availabilityType: normalizeAvailabilityType(payload.availabilityType, 'availabilityType'),
    source: normalizeSource(payload.source),
    notes: normalizeText(payload.notes, { fieldName: 'notes', nullable: true }),
  }

  if (dto.toDateTime <= dto.fromDateTime) {
    throw createAvailabilityDtoError('El rango no es valido: "toDateTime" debe ser posterior a "fromDateTime".')
  }

  return dto
}

function buildAvailabilityWindowUpdateDto(payload) {
  ensureObject(payload, 'ventana de disponibilidad')

  const dto = {}

  if (payload.userNCarnet !== undefined) {
    dto.userNCarnet = normalizeText(payload.userNCarnet, { fieldName: 'userNCarnet', required: true })
  }

  if (payload.fromDateTime !== undefined) {
    dto.fromDateTime = normalizeDate(payload.fromDateTime, { fieldName: 'fromDateTime', required: true })
  }

  if (payload.toDateTime !== undefined) {
    dto.toDateTime = normalizeDate(payload.toDateTime, { fieldName: 'toDateTime', required: true })
  }

  if (payload.availabilityType !== undefined) {
    dto.availabilityType = normalizeAvailabilityType(payload.availabilityType, 'availabilityType')
  }

  if (payload.source !== undefined) {
    dto.source = normalizeSource(payload.source)
  }

  if (payload.notes !== undefined) {
    dto.notes = normalizeText(payload.notes, { fieldName: 'notes', nullable: true })
  }

  if (Object.keys(dto).length === 0) {
    throw createAvailabilityDtoError('Debes enviar al menos un campo para actualizar la ventana.')
  }

  return dto
}

function mapAvailabilityWindowToDto(window) {
  return {
    id: window.id,
    userNCarnet: window.userNCarnet,
    fromDateTime: window.fromDateTime,
    toDateTime: window.toDateTime,
    availabilityType: window.availabilityType,
    source: window.source,
    notes: window.notes,
    createdAt: window.createdAt,
    updatedAt: window.updatedAt,
  }
}

module.exports = {
  buildAvailabilityWindowCreateDto,
  buildAvailabilityWindowUpdateDto,
  createAvailabilityDtoError,
  mapAvailabilityWindowToDto,
}
