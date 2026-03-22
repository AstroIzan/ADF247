const database = require('../../../../database/prisma/prisma')
const {
  buildConvocatoriaCreateDto,
  buildConvocatoriaUpdateDto,
  buildConvoTypeCreateDto,
  buildConvoTypeUpdateDto,
  createConvosDtoError,
  mapConvocatoriaToDto,
  mapConvoTypeToDto,
} = require('./convos.dto')

const convocatoriaInclude = {
  user: true,
  convoType: true,
  _count: {
    select: {
      respostas: true,
    },
  },
}

const autoAssignCandidateInclude = {
  user: {
    include: {
      roles: true,
    },
  },
}

function createServiceError(message, statusCode = 500, details) {
  const error = new Error(message)
  error.statusCode = statusCode

  if (details) {
    error.details = details
  }

  return error
}

async function findConvoTypeOrThrow(id) {
  const convoType = await database.convoType.findUnique({
    where: { id },
  })

  if (!convoType) {
    throw createServiceError('No se ha encontrado el tipo de convocatoria solicitado.', 404)
  }

  return convoType
}

async function findConvocatoriaOrThrow(id) {
  const convocatoria = await database.convocatoria.findUnique({
    where: { id },
    include: convocatoriaInclude,
  })

  if (!convocatoria) {
    throw createServiceError('No se ha encontrado la convocatoria solicitada.', 404)
  }

  return convocatoria
}

async function ensureUserExists(userId) {
  const user = await database.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    throw createConvosDtoError('No existe el responsable indicado.', 404)
  }
}

async function ensureConvoTypeExists(convoTypeId) {
  const convoType = await database.convoType.findUnique({
    where: { id: convoTypeId },
    select: { id: true },
  })

  if (!convoType) {
    throw createConvosDtoError('No existe el tipo de convocatoria indicado.', 404)
  }
}

function getDefaultConvocatoriaTitle(convoTypeName, date) {
  return `${convoTypeName} - ${date.toISOString().slice(0, 10)}`
}

function getDefaultLocationForConvoType(convoType) {
  if (convoType?.defaultLocation) {
    return convoType.defaultLocation
  }

  if (/guardia|incendi/i.test(convoType?.name || '')) {
    return 'Brigadas'
  }

  return null
}

function getUserPriority(user) {
  const role = Array.isArray(user?.roles) ? user.roles[0] : null

  if (role?.isCapOperatiu) return 0
  if (role?.isCapColla) return 1
  if (role?.isGroc) return 2
  return 3
}

function shouldMarkSortida(convoType, positiveResponses) {
  const minimumGroc = convoType?.minGrocSortida ?? 0
  const minimumVerd = convoType?.minVerdSortida ?? 0

  const counts = positiveResponses.reduce((acc, respuesta) => {
    const role = Array.isArray(respuesta.user?.roles) ? respuesta.user.roles[0] : null

    if (role?.isGroc) {
      acc.groc += 1
    } else {
      acc.verd += 1
    }

    return acc
  }, { groc: 0, verd: 0 })

  return counts.groc >= minimumGroc && counts.verd >= minimumVerd
}

function mapPrismaError(error) {
  if (error?.code === 'P2002') {
    return createServiceError('Ya existe un registro con un valor unico que no puede repetirse.', 409)
  }

  if (error?.code === 'P2025') {
    return createServiceError('No se ha encontrado el registro solicitado.', 404)
  }

  if (error?.code === 'P2003') {
    return createServiceError('No se puede eliminar o modificar el registro porque tiene datos asociados.', 409)
  }

  return error
}

async function getAllConvoTypes() {
  const convoTypes = await database.convoType.findMany({
    orderBy: {
      id: 'asc',
    },
  })

  return convoTypes.map(mapConvoTypeToDto)
}

async function getConvoTypeById(id) {
  const convoType = await findConvoTypeOrThrow(id)
  return mapConvoTypeToDto(convoType)
}

async function createConvoType(payload) {
  const createDto = buildConvoTypeCreateDto(payload)

  try {
    const convoType = await database.convoType.create({
      data: createDto,
    })

    return mapConvoTypeToDto(convoType)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function updateConvoType(id, payload) {
  const updateDto = buildConvoTypeUpdateDto(payload)

  await findConvoTypeOrThrow(id)

  try {
    const convoType = await database.convoType.update({
      where: { id },
      data: updateDto,
    })

    return mapConvoTypeToDto(convoType)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function deleteConvoType(id) {
  await findConvoTypeOrThrow(id)

  try {
    const convoType = await database.convoType.delete({
      where: { id },
    })

    return mapConvoTypeToDto(convoType)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function getAllConvocatorias() {
  const convocatorias = await database.convocatoria.findMany({
    include: convocatoriaInclude,
    orderBy: {
      id: 'asc',
    },
  })

  return convocatorias.map(mapConvocatoriaToDto)
}

async function getConvocatoriaById(id) {
  const convocatoria = await findConvocatoriaOrThrow(id)
  return mapConvocatoriaToDto(convocatoria)
}

async function createConvocatoria(payload) {
  const createDto = buildConvocatoriaCreateDto(payload)

  await ensureUserExists(createDto.responsableId)
  await ensureConvoTypeExists(createDto.convoTypeId)

  const convoType = await findConvoTypeOrThrow(createDto.convoTypeId)
  const resolvedLocation = createDto.ubiSortida || getDefaultLocationForConvoType(convoType)

  if (!resolvedLocation) {
    throw createConvosDtoError('El campo "ubiSortida" es obligatorio.')
  }

  const data = {
    ...createDto,
    ubiSortida: resolvedLocation,
    title: createDto.title || getDefaultConvocatoriaTitle(convoType.name, createDto.date),
  }

  try {
    const convocatoria = await database.convocatoria.create({
      data,
      include: convocatoriaInclude,
    })

    return mapConvocatoriaToDto(convocatoria)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function updateConvocatoria(id, payload) {
  const existingConvocatoria = await findConvocatoriaOrThrow(id)
  const updateDto = buildConvocatoriaUpdateDto(payload)

  if (updateDto.responsableId !== undefined) {
    await ensureUserExists(updateDto.responsableId)
  }

  if (updateDto.convoTypeId !== undefined) {
    await ensureConvoTypeExists(updateDto.convoTypeId)
  }

  if (updateDto.ubiSortida === undefined) {
    const finalConvoTypeId = updateDto.convoTypeId ?? existingConvocatoria.convoTypeId
    const convoType = await findConvoTypeOrThrow(finalConvoTypeId)
    const defaultLocation = getDefaultLocationForConvoType(convoType)

    if (!existingConvocatoria.ubiSortida && defaultLocation) {
      updateDto.ubiSortida = defaultLocation
    }
  }

  const finalStartTime = updateDto.startTime ?? existingConvocatoria.startTime
  const finalTimeSent = Object.prototype.hasOwnProperty.call(updateDto, 'finalTime')
  const finalFinalTime = finalTimeSent ? updateDto.finalTime : existingConvocatoria.finalTime

  if (finalFinalTime && finalFinalTime < finalStartTime) {
    throw createConvosDtoError('El campo "finalTime" no puede ser anterior a "startTime".')
  }

  try {
    const convocatoria = await database.convocatoria.update({
      where: { id },
      data: updateDto,
      include: convocatoriaInclude,
    })

    if (convocatoria.autoAssignResponsable) {
      await recalculateAutoAssignedResponsable(convocatoria.id)
      return getConvocatoriaById(convocatoria.id)
    }

    return mapConvocatoriaToDto(convocatoria)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function deleteConvocatoria(id) {
  await findConvocatoriaOrThrow(id)

  try {
    const convocatoria = await database.convocatoria.delete({
      where: { id },
      include: convocatoriaInclude,
    })

    return mapConvocatoriaToDto(convocatoria)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function recalculateAutoAssignedResponsable(convoId) {
  const convocatoria = await database.convocatoria.findUnique({
    where: { id: convoId },
    include: {
      convoType: true,
    },
  })

  if (!convocatoria?.autoAssignResponsable) {
    return convocatoria
  }

  const positiveResponses = await database.respuesta.findMany({
    where: {
      convoId,
      response: true,
      user: {
        isActive: true,
      },
    },
    include: autoAssignCandidateInclude,
  })

  const sortedCandidates = positiveResponses
    .filter((respuesta) => respuesta.user)
    .sort((left, right) => {
      const priorityDiff = getUserPriority(left.user) - getUserPriority(right.user)

      if (priorityDiff !== 0) {
        return priorityDiff
      }

      return new Date(left.user.createdAt).getTime() - new Date(right.user.createdAt).getTime()
    })

  const selectedCandidate = sortedCandidates[0]?.user

  if (!selectedCandidate || selectedCandidate.id === convocatoria.responsableId) {
    return convocatoria
  }

  return database.convocatoria.update({
    where: { id: convoId },
    data: {
      responsableId: selectedCandidate.id,
    },
    include: convocatoriaInclude,
  })
}

async function updateSortidaForTomorrow(referenceDate = new Date()) {
  const startOfTomorrow = new Date(referenceDate)
  startOfTomorrow.setHours(0, 0, 0, 0)
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

  const endOfTomorrow = new Date(startOfTomorrow)
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1)

  const convocatorias = await database.convocatoria.findMany({
    where: {
      date: {
        gte: startOfTomorrow,
        lt: endOfTomorrow,
      },
      isActive: true,
    },
    include: {
      convoType: true,
      respostas: {
        where: {
          response: true,
          user: {
            isActive: true,
          },
        },
        include: autoAssignCandidateInclude,
      },
    },
  })

  await Promise.all(convocatorias.map((convocatoria) => {
    const nextSortida = shouldMarkSortida(convocatoria.convoType, convocatoria.respostas || [])

    return database.convocatoria.update({
      where: { id: convocatoria.id },
      data: {
        sortida: convocatoria.sortida || nextSortida,
      },
    })
  }))
}

module.exports = {
  createConvocatoria,
  createConvoType,
  createServiceError,
  deleteConvocatoria,
  deleteConvoType,
  getAllConvocatorias,
  getAllConvoTypes,
  getConvocatoriaById,
  getConvoTypeById,
  mapPrismaError,
  recalculateAutoAssignedResponsable,
  updateSortidaForTomorrow,
  updateConvocatoria,
  updateConvoType,
}
