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

    acc.total += 1

    if (role?.isGroc) {
      acc.groc += 1
    }

    return acc
  }, { groc: 0, total: 0 })

  return counts.groc >= minimumGroc && counts.total >= minimumVerd
}

function resolveAvailabilityDecision(windows, rules) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return null
  }

  const hasUnavailable = windows.some((window) => window.availabilityType === 'unavailable')
  const hasAvailable = windows.some((window) => window.availabilityType === 'available')

  if (hasUnavailable && hasAvailable) {
    if (rules.conflictPolicy === 'available-wins') {
      return rules.createAvailableResponses ? true : null
    }

    if (rules.conflictPolicy === 'skip-on-conflict') {
      return null
    }

    return rules.createUnavailableResponses ? false : null
  }

  if (hasUnavailable) {
    return rules.createUnavailableResponses ? false : null
  }

  if (hasAvailable) {
    return rules.createAvailableResponses ? true : null
  }

  return null
}

function getAvailabilityMatchingRules() {
  try {
    const { readNotificationSettings } = require('../notifications/notifications.config')
    const settings = readNotificationSettings()
    return settings.availabilityMatching || {
      conflictPolicy: 'unavailable-wins',
      createAvailableResponses: true,
      createUnavailableResponses: true,
    }
  } catch {
    return {
      conflictPolicy: 'unavailable-wins',
      createAvailableResponses: true,
      createUnavailableResponses: true,
    }
  }
}

async function applyAvailabilityWindowsToConvocatoria(convocatoria) {
  const matchingRules = getAvailabilityMatchingRules()
  const rangeStart = convocatoria.startTime
  const rangeEnd = convocatoria.finalTime
    ? convocatoria.finalTime
    : new Date(new Date(convocatoria.startTime).getTime() + 60 * 1000)

  const overlappedWindows = await database.availabilityWindow.findMany({
    where: {
      fromDateTime: {
        lt: rangeEnd,
      },
      toDateTime: {
        gt: rangeStart,
      },
      user: {
        isActive: true,
      },
    },
    select: {
      userNCarnet: true,
      availabilityType: true,
    },
  })

  if (overlappedWindows.length === 0) {
    return 0
  }

  const windowsByUser = overlappedWindows.reduce((acc, window) => {
    if (!acc.has(window.userNCarnet)) {
      acc.set(window.userNCarnet, [])
    }

    acc.get(window.userNCarnet).push(window)
    return acc
  }, new Map())

  const existingResponses = await database.respuesta.findMany({
    where: {
      convoId: convocatoria.id,
      userNCarnet: {
        in: Array.from(windowsByUser.keys()),
      },
    },
    select: {
      userNCarnet: true,
    },
  })

  const existingNCarnets = new Set(existingResponses.map((item) => item.userNCarnet))
  const candidateUserNCarnets = Array.from(windowsByUser.keys())
  const candidateUsers = candidateUserNCarnets.length > 0
    ? await database.user.findMany({
      where: {
        nCarnet: {
          in: candidateUserNCarnets,
        },
      },
      select: {
        id: true,
        nCarnet: true,
      },
    })
    : []
  const candidateUserIdsByCarnet = new Map(candidateUsers.map((user) => [user.nCarnet, user.id]))

  const rowsToInsert = []
  const autoAvailableUserIds = []

  for (const [userNCarnet, userWindows] of windowsByUser.entries()) {
    if (existingNCarnets.has(userNCarnet)) {
      continue
    }

    const canAttend = resolveAvailabilityDecision(userWindows, matchingRules)

    if (canAttend === null) {
      continue
    }

    rowsToInsert.push({
      convoId: convocatoria.id,
      userNCarnet,
      response: canAttend,
      isCustom: false,
      customText: null,
      fullHorari: canAttend,
      source: 'auto-window',
      autoAssignReason: canAttend ? 'available-window-match' : 'unavailable-window-match',
    })

    if (canAttend) {
      const userId = candidateUserIdsByCarnet.get(userNCarnet)

      if (userId) {
        autoAvailableUserIds.push(userId)
      }
    }
  }

  if (matchingRules.autoCreateUnavailableForUsersWithoutWindow) {
    const usersWithoutWindows = await database.user.findMany({
      where: {
        isActive: true,
        nCarnet: {
          notIn: Array.from(windowsByUser.keys()),
        },
      },
      select: {
        nCarnet: true,
      },
    })

    for (const user of usersWithoutWindows) {
      if (existingNCarnets.has(user.nCarnet)) {
        continue
      }

      rowsToInsert.push({
        convoId: convocatoria.id,
        userNCarnet: user.nCarnet,
        response: false,
        isCustom: false,
        customText: null,
        fullHorari: false,
        source: 'auto-no-window',
        autoAssignReason: 'no-availability-window-registered',
      })
    }
  }

  if (rowsToInsert.length === 0) {
    return 0
  }

  const created = await database.respuesta.createMany({
    data: rowsToInsert,
  })

  try {
    await recalculateSortidaForConvocatoria(convocatoria.id)
    await recalculateAutoAssignedResponsable(convocatoria.id)
  } catch (error) {
    console.error('[convos.service] Error al recalcular sortida/autoresponsable tras auto-respuestas:', error.message)
  }

  if (matchingRules.notifyOnAutoAvailableResponse && autoAvailableUserIds.length > 0) {
    try {
      const notificationsService = require('../notifications/notifications.service')
      await notificationsService.sendAutoAvailableNotifications({
        convocatoria,
        userIds: autoAvailableUserIds,
      })
    } catch (error) {
      console.error('[convos.service] Error al enviar avisos automáticos de disponibilidad:', error.message)
    }
  }

  return created.count || 0
}

async function recalculateSortidaForConvocatoria(convoId) {
  const convocatoria = await database.convocatoria.findUnique({
    where: { id: convoId },
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

  if (!convocatoria) {
    return null
  }

  const nextSortida = shouldMarkSortida(convocatoria.convoType, convocatoria.respostas || [])

  return database.convocatoria.update({
    where: { id: convoId },
    data: {
      sortida: nextSortida,
    },
    include: convocatoriaInclude,
  })
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

    const relatedConvocatorias = await database.convocatoria.findMany({
      where: { convoTypeId: id },
      select: { id: true },
    })

    await Promise.all(relatedConvocatorias.map((convocatoria) => recalculateSortidaForConvocatoria(convocatoria.id)))

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

    try {
      await applyAvailabilityWindowsToConvocatoria(convocatoria)
    } catch (error) {
      console.error('[convos.service] Error al aplicar ventanas de disponibilidad:', error.message)
    }

    try {
      const notificationsService = require('../notifications/notifications.service')
      await notificationsService.handleConvocatoriaCreated(convocatoria.id)
    } catch (error) {
      console.error('[convos.service] Error al enviar aviso de nueva convocatoria:', error.message)
    }

    return getConvocatoriaById(convocatoria.id)
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
        sortida: nextSortida,
      },
    })
  }))
}

module.exports = {
  applyAvailabilityWindowsToConvocatoria,
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
  recalculateSortidaForConvocatoria,
  recalculateAutoAssignedResponsable,
  updateSortidaForTomorrow,
  updateConvocatoria,
  updateConvoType,
  __matchingInternals: {
    resolveAvailabilityDecision,
    shouldMarkSortida,
    getUserPriority,
  },
}
