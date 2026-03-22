function createConvosDtoError(message, statusCode = 400, details) {
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
    throw createConvosDtoError(`El body de ${entityName} debe ser un objeto JSON valido.`)
  }
}

function normalizeText(value, { fieldName, required = false, nullable = false } = {}) {
  if (value === undefined) {
    if (required) {
      throw createConvosDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return undefined
  }

  if (value === null) {
    if (nullable) {
      return null
    }

    throw createConvosDtoError(`El campo "${fieldName}" no puede ser null.`)
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    throw createConvosDtoError(`El campo "${fieldName}" debe ser texto.`)
  }

  const normalizedValue = String(value).trim()

  if (!normalizedValue) {
    if (required) {
      throw createConvosDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return nullable ? null : undefined
  }

  return normalizedValue
}

function normalizeBoolean(value, fieldName) {
  if (value === undefined) return undefined

  if (typeof value === 'boolean') return value

  if (['true', 'false'].includes(value)) {
    return value === 'true'
  }

  throw createConvosDtoError(`El campo "${fieldName}" debe ser booleano.`)
}

function normalizeInteger(value, { fieldName, required = false, min = 1 } = {}) {
  if (value === undefined) {
    if (required) {
      throw createConvosDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return undefined
  }

  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue < min) {
    throw createConvosDtoError(`El campo "${fieldName}" debe ser un entero mayor o igual a ${min}.`)
  }

  return parsedValue
}

function normalizeDate(value, { fieldName, required = false, nullable = false } = {}) {
  if (value === undefined) {
    if (required) {
      throw createConvosDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return undefined
  }

  if (value === null) {
    if (nullable) {
      return null
    }

    throw createConvosDtoError(`El campo "${fieldName}" no puede ser null.`)
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    throw createConvosDtoError(`El campo "${fieldName}" debe ser una fecha valida.`)
  }

  return parsedDate
}

function buildConvoTypeCreateDto(payload) {
  ensureObject(payload, 'tipo de convocatoria')

  return {
    name: normalizeText(payload.name, {
      fieldName: 'name',
      required: true,
    }),
  }
}

function buildConvoTypeUpdateDto(payload) {
  ensureObject(payload, 'tipo de convocatoria')

  const dto = {}

  const normalizedName = normalizeText(payload.name, {
    fieldName: 'name',
  })

  if (normalizedName !== undefined) {
    dto.name = normalizedName
  }

  if (Object.keys(dto).length === 0) {
    throw createConvosDtoError('Debes enviar al menos un campo para actualizar el tipo de convocatoria.')
  }

  return dto
}

function buildConvocatoriaCreateDto(payload) {
  ensureObject(payload, 'convocatoria')

  const dto = {
    date: normalizeDate(payload.date, { fieldName: 'date', required: true }),
    title: normalizeText(payload.title, { fieldName: 'title' }),
    ubiSortida: normalizeText(payload.ubiSortida, { fieldName: 'ubiSortida', required: true }),
    responsableId: normalizeInteger(payload.responsableId, { fieldName: 'responsableId', required: true }),
    convoTypeId: normalizeInteger(payload.convoTypeId, { fieldName: 'convoTypeId', required: true }),
    moreThan2: normalizeBoolean(payload.moreThan2, 'moreThan2') ?? false,
    startTime: normalizeDate(payload.startTime, { fieldName: 'startTime', required: true }),
    finalTime: normalizeDate(payload.finalTime, { fieldName: 'finalTime', nullable: true }),
    isActive: normalizeBoolean(payload.isActive, 'isActive') ?? true,
  }

  if (dto.finalTime && dto.finalTime < dto.startTime) {
    throw createConvosDtoError('El campo "finalTime" no puede ser anterior a "startTime".')
  }

  return dto
}

function buildConvocatoriaUpdateDto(payload) {
  ensureObject(payload, 'convocatoria')

  const dto = {}

  if (payload.date !== undefined) {
    dto.date = normalizeDate(payload.date, { fieldName: 'date' })
  }

  if (payload.title !== undefined) {
    dto.title = normalizeText(payload.title, { fieldName: 'title' })
  }

  if (payload.ubiSortida !== undefined) {
    dto.ubiSortida = normalizeText(payload.ubiSortida, { fieldName: 'ubiSortida' })
  }

  if (payload.responsableId !== undefined) {
    dto.responsableId = normalizeInteger(payload.responsableId, {
      fieldName: 'responsableId',
      min: 1,
    })
  }

  if (payload.convoTypeId !== undefined) {
    dto.convoTypeId = normalizeInteger(payload.convoTypeId, {
      fieldName: 'convoTypeId',
      min: 1,
    })
  }

  if (payload.moreThan2 !== undefined) {
    dto.moreThan2 = normalizeBoolean(payload.moreThan2, 'moreThan2')
  }

  if (payload.startTime !== undefined) {
    dto.startTime = normalizeDate(payload.startTime, { fieldName: 'startTime' })
  }

  if (payload.finalTime !== undefined) {
    dto.finalTime = normalizeDate(payload.finalTime, {
      fieldName: 'finalTime',
      nullable: true,
    })
  }

  if (payload.isActive !== undefined) {
    dto.isActive = normalizeBoolean(payload.isActive, 'isActive')
  }

  if (Object.keys(dto).length === 0) {
    throw createConvosDtoError('Debes enviar al menos un campo para actualizar la convocatoria.')
  }

  return dto
}

function mapConvoTypeToDto(convoType) {
  return {
    id: convoType.id,
    name: convoType.name,
  }
}

function mapConvocatoriaToDto(convocatoria) {
  return {
    id: convocatoria.id,
    date: convocatoria.date,
    title: convocatoria.title,
    ubiSortida: convocatoria.ubiSortida,
    responsableId: convocatoria.responsableId,
    responsable: convocatoria.user
      ? {
        id: convocatoria.user.id,
        nCarnet: convocatoria.user.nCarnet,
        name: convocatoria.user.name,
        lastName: convocatoria.user.lastName,
      }
      : null,
    convoTypeId: convocatoria.convoTypeId,
    convoType: convocatoria.convoType ? mapConvoTypeToDto(convocatoria.convoType) : null,
    moreThan2: convocatoria.moreThan2,
    startTime: convocatoria.startTime,
    finalTime: convocatoria.finalTime,
    isActive: convocatoria.isActive,
    responseCount: convocatoria._count?.respostas ?? 0,
  }
}

module.exports = {
  buildConvocatoriaCreateDto,
  buildConvocatoriaUpdateDto,
  buildConvoTypeCreateDto,
  buildConvoTypeUpdateDto,
  createConvosDtoError,
  mapConvocatoriaToDto,
  mapConvoTypeToDto,
}
