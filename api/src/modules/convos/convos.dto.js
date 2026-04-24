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

function normalizeIntegerList(value, { fieldName } = {}) {
  if (value === undefined || value === null) {
    return []
  }

  if (!Array.isArray(value)) {
    throw createConvosDtoError(`El campo "${fieldName}" debe ser una lista de numeros enteros.`)
  }

  return Array.from(new Set(value.map((entry) => normalizeInteger(entry, { fieldName, min: 1 }))))
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
    minGrocSortida: normalizeInteger(payload.minGrocSortida, {
      fieldName: 'minGrocSortida',
      min: 0,
    }) ?? 0,
    minVerdSortida: normalizeInteger(payload.minVerdSortida, {
      fieldName: 'minVerdSortida',
      min: 0,
    }) ?? 0,
    defaultLocation: normalizeText(payload.defaultLocation, {
      fieldName: 'defaultLocation',
      nullable: true,
    }) ?? null,
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

  if (payload.minGrocSortida !== undefined) {
    dto.minGrocSortida = normalizeInteger(payload.minGrocSortida, {
      fieldName: 'minGrocSortida',
      min: 0,
    })
  }

  if (payload.minVerdSortida !== undefined) {
    dto.minVerdSortida = normalizeInteger(payload.minVerdSortida, {
      fieldName: 'minVerdSortida',
      min: 0,
    })
  }

  if (payload.defaultLocation !== undefined) {
    dto.defaultLocation = normalizeText(payload.defaultLocation, {
      fieldName: 'defaultLocation',
      nullable: true,
    })
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
    ubiSortida: normalizeText(payload.ubiSortida, { fieldName: 'ubiSortida' }),
    responsableId: payload.responsableId != null ? normalizeInteger(payload.responsableId, { fieldName: 'responsableId' }) : null,
    convoTypeId: normalizeInteger(payload.convoTypeId, { fieldName: 'convoTypeId', required: true }),
    startTime: normalizeDate(payload.startTime, { fieldName: 'startTime', required: true }),
    finalTime: normalizeDate(payload.finalTime, { fieldName: 'finalTime', nullable: true }),
    isActive: normalizeBoolean(payload.isActive, 'isActive') ?? true,
    autoAssignResponsable: normalizeBoolean(payload.autoAssignResponsable, 'autoAssignResponsable') ?? false,
    sortida: normalizeBoolean(payload.sortida, 'sortida') ?? false,
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
    dto.responsableId = payload.responsableId == null ? null : normalizeInteger(payload.responsableId, {
      fieldName: 'responsableId',
      min: 1,
    });
  }

  if (payload.convoTypeId !== undefined) {
    dto.convoTypeId = normalizeInteger(payload.convoTypeId, {
      fieldName: 'convoTypeId',
      min: 1,
    })
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

  if (payload.autoAssignResponsable !== undefined) {
    dto.autoAssignResponsable = normalizeBoolean(payload.autoAssignResponsable, 'autoAssignResponsable')
  }

  if (payload.sortida !== undefined) {
    dto.sortida = normalizeBoolean(payload.sortida, 'sortida')
  }

  if (Object.keys(dto).length === 0) {
    throw createConvosDtoError('Debes enviar al menos un campo para actualizar la convocatoria.')
  }

  return dto
}

function buildConvocatoriaLifecycleUpdateDto(payload) {
  ensureObject(payload, 'actualizacion de ciclo de convocatoria')

  const dto = {}

  if (Object.prototype.hasOwnProperty.call(payload, 'actualStartTime')) {
    dto.actualStartTime = normalizeDate(payload.actualStartTime, {
      fieldName: 'actualStartTime',
      nullable: true,
    })
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'actualEndTime')) {
    dto.actualEndTime = normalizeDate(payload.actualEndTime, {
      fieldName: 'actualEndTime',
      nullable: true,
    })
  }

  if (Object.keys(dto).length === 0) {
    throw createConvosDtoError('Debes enviar actualStartTime y/o actualEndTime para editar el ciclo real.')
  }

  if (dto.actualStartTime === null && dto.actualEndTime !== undefined && dto.actualEndTime !== null) {
    throw createConvosDtoError('No puedes indicar hora real de fin sin hora real de inicio.')
  }

  if (
    dto.actualStartTime instanceof Date &&
    dto.actualEndTime instanceof Date &&
    dto.actualEndTime < dto.actualStartTime
  ) {
    throw createConvosDtoError('La hora real de fin no puede ser anterior a la hora real de inicio.')
  }

  return dto
}

function buildCampaignFormPayloadDto(payload) {
  ensureObject(payload, 'formulario de campanya')

  const dia = normalizeDate(payload.dia, { fieldName: 'dia' }) || new Date()
  const volunteerUserIds = normalizeIntegerList(payload.volunteerUserIds, {
    fieldName: 'volunteerUserIds',
  })

  const sourceVehicles = payload.vehicles === undefined ? [] : payload.vehicles
  if (!Array.isArray(sourceVehicles)) {
    throw createConvosDtoError('El campo "vehicles" debe ser una lista.')
  }

  const vehicles = sourceVehicles.map((vehicle, index) => {
    if (!isPlainObject(vehicle)) {
      throw createConvosDtoError(`El elemento ${index + 1} de "vehicles" no es valido.`)
    }

    const vehicleName = normalizeText(vehicle.vehicleName, {
      fieldName: `vehicles[${index}].vehicleName`,
      required: true,
    })

    const kmsRaw = vehicle.kms ?? 0
    const kms = Number(kmsRaw)
    if (!Number.isFinite(kms) || kms < 0) {
      throw createConvosDtoError(`El campo "vehicles[${index}].kms" debe ser un numero mayor o igual a 0.`)
    }

    const conductorUserId = vehicle.conductorUserId == null
      ? null
      : normalizeInteger(vehicle.conductorUserId, {
        fieldName: `vehicles[${index}].conductorUserId`,
        min: 1,
      })

    const volunteerIds = normalizeIntegerList(vehicle.volunteerUserIds, {
      fieldName: `vehicles[${index}].volunteerUserIds`,
    })

    return {
      vehicleName,
      kms: Number(kms.toFixed(2)),
      conductorUserId,
      volunteerUserIds: volunteerIds,
    }
  })

  return {
    dia,
    volunteerUserIds,
    vehicles,
  }
}

function mapConvoTypeToDto(convoType) {
  return {
    id: convoType.id,
    name: convoType.name,
    minGrocSortida: convoType.minGrocSortida,
    minVerdSortida: convoType.minVerdSortida,
    defaultLocation: convoType.defaultLocation,
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
    startTime: convocatoria.startTime,
    finalTime: convocatoria.finalTime,
    actualStartTime: convocatoria.actualStartTime,
    actualEndTime: convocatoria.actualEndTime,
    isActive: convocatoria.isActive,
    autoAssignResponsable: convocatoria.autoAssignResponsable,
    sortida: convocatoria.sortida,
    responseCount: convocatoria._count?.respostas ?? 0,
  }
}

module.exports = {
  buildConvocatoriaCreateDto,
  buildCampaignFormPayloadDto,
  buildConvocatoriaLifecycleUpdateDto,
  buildConvocatoriaUpdateDto,
  buildConvoTypeCreateDto,
  buildConvoTypeUpdateDto,
  createConvosDtoError,
  mapConvocatoriaToDto,
  mapConvoTypeToDto,
}
