const database = require('../../../../database/prisma/prisma')
const {
  buildCampaignFormPayloadDto,
  buildConvocatoriaCreateDto,
  buildConvocatoriaLifecycleUpdateDto,
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

const MAX_KM_INCREASE_PER_FORM = 9999

function createServiceError(message, statusCode = 500, details) {
  const error = new Error(message)
  error.statusCode = statusCode

  if (details) {
    error.details = details
  }

  return error
}

async function ensureAdmin(authUser) {
  if (!authUser?.nCarnet) {
    throw createServiceError('Debes iniciar sesión para realizar esta acción.', 401)
  }

  const role = await database.role.findFirst({
    where: {
      nCarnet: authUser.nCarnet,
      isAdmin: true,
    },
    select: { id: true },
  })

  if (!role) {
    throw createServiceError('Solo un admin puede realizar esta acción.', 403)
  }
}

async function ensureCanManageConvocatoria(authUser, convocatoria) {
  if (!authUser?.userId || !authUser?.nCarnet) {
    throw createServiceError('Debes iniciar sesión para realizar esta acción.', 401)
  }

  if (Number(convocatoria?.responsableId) === Number(authUser.userId)) {
    return
  }

  const role = await database.role.findFirst({
    where: {
      nCarnet: authUser.nCarnet,
      isAdmin: true,
    },
    select: { id: true },
  })

  if (!role) {
    throw createServiceError('Solo el responsable o un admin puede gestionar esta convocatoria.', 403)
  }
}

function getConvocatoriaDurationHours(convocatoria) {
  const start = convocatoria.actualStartTime || convocatoria.startTime
  const end = convocatoria.actualEndTime || convocatoria.finalTime || new Date(new Date(start).getTime() + 60 * 60 * 1000)

  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return 0
  }

  return Number(((endTime - startTime) / (1000 * 60 * 60)).toFixed(2))
}

function isSameLocalCalendarDate(dateA, dateB) {
  const a = new Date(dateA)
  const b = new Date(dateB)

  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return false
  }

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getHourComputationSettings() {
  try {
    const { readNotificationSettings } = require('../notifications/notifications.config')
    const settings = readNotificationSettings()
    return settings.hourComputation || {
      campaignStartDate: null,
      campaignEndDate: null,
      unansweredPenaltyThreshold: 0,
      unansweredPenaltyHours: 1,
      noShowPenaltyHours: 4,
    }
  } catch {
    return {
      campaignStartDate: null,
      campaignEndDate: null,
      unansweredPenaltyThreshold: 0,
      unansweredPenaltyHours: 1,
      noShowPenaltyHours: 4,
    }
  }
}

function getCampaignFormSettings() {
  try {
    const { readNotificationSettings } = require('../notifications/notifications.config')
    const settings = readNotificationSettings()

    const vehicleCatalog = Array.isArray(settings?.campaignForm?.vehicleCatalog)
      ? settings.campaignForm.vehicleCatalog
        .map((entry) => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            return null
          }

          const indicativo = String(entry.indicativo || '').trim()
          if (!indicativo) {
            return null
          }

          const modelo = String(entry.modelo || '').trim()
          const litrosRaw = Number(entry.litros)

          return {
            indicativo,
            modelo,
            litros: Number.isFinite(litrosRaw) && litrosRaw >= 0 ? Number(litrosRaw.toFixed(2)) : 0,
            kms: Number.isFinite(Number(entry.kms)) && Number(entry.kms) >= 0 ? Number(Number(entry.kms).toFixed(2)) : 0,
          }
        })
        .filter(Boolean)
      : []

    return {
      vehicleCatalog,
    }
  } catch {
    return {
      vehicleCatalog: [],
    }
  }
}

function parseJsonList(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeVehicleName(value) {
  return String(value || '').trim()
}

function collectVehicleNamesFromVehiclesJson(vehiclesJson) {
  return parseJsonList(vehiclesJson)
    .map((vehicle) => normalizeVehicleName(vehicle?.vehicleName))
    .filter(Boolean)
}

async function getLatestServiceMomentByVehicle(vehicleNames) {
  const normalizedNames = Array.from(new Set((vehicleNames || []).map((name) => normalizeVehicleName(name)).filter(Boolean)))
  if (normalizedNames.length === 0) {
    return new Map()
  }

  const targetSet = new Set(normalizedNames)
  const latestByVehicle = new Map()

  const rows = await database.formulariCampanya.findMany({
    where: {
      serviceMoment: {
        in: ['START', 'END'],
      },
    },
    select: {
      serviceMoment: true,
      vehiclesJson: true,
      dia: true,
      id: true,
    },
    orderBy: [
      { dia: 'desc' },
      { id: 'desc' },
    ],
  })

  for (const row of rows) {
    const namesInRow = collectVehicleNamesFromVehiclesJson(row.vehiclesJson)
    for (const name of namesInRow) {
      if (!targetSet.has(name) || latestByVehicle.has(name)) {
        continue
      }

      latestByVehicle.set(name, row.serviceMoment)
    }

    if (latestByVehicle.size === targetSet.size) {
      break
    }
  }

  return latestByVehicle
}

async function getLockedVehicleNames(vehicleNames) {
  const latestByVehicle = await getLatestServiceMomentByVehicle(vehicleNames)
  return Array.from(latestByVehicle.entries())
    .filter(([, serviceMoment]) => serviceMoment === 'START')
    .map(([vehicleName]) => vehicleName)
}

async function ensureVehiclesCanStartService(vehicleNames) {
  const lockedVehicles = await getLockedVehicleNames(vehicleNames)
  if (lockedVehicles.length > 0) {
    throw createServiceError(
      `No es pot iniciar servei perquè aquests vehicles ja estan iniciats pendent de finalitzar: ${lockedVehicles.join(', ')}.`,
      409,
      { lockedVehicles }
    )
  }
}

function buildVehicleKmsMap(vehicles) {
  const kmsByVehicle = new Map()

  for (const vehicle of Array.isArray(vehicles) ? vehicles : []) {
    const vehicleName = normalizeVehicleName(vehicle?.vehicleName)
    const kmsRaw = Number(vehicle?.kms)
    if (!vehicleName || !Number.isFinite(kmsRaw) || kmsRaw < 0) {
      continue
    }

    kmsByVehicle.set(vehicleName, Number(kmsRaw.toFixed(2)))
  }

  return kmsByVehicle
}

function syncCampaignVehicleCatalogKms(vehicles) {
  const kmsByVehicle = buildVehicleKmsMap(vehicles)
  if (kmsByVehicle.size === 0) {
    return
  }

  try {
    const { readNotificationSettings, updateNotificationSettings } = require('../notifications/notifications.config')
    const settings = readNotificationSettings()
    const currentCatalog = Array.isArray(settings?.campaignForm?.vehicleCatalog) ? settings.campaignForm.vehicleCatalog : []

    let hasChanges = false
    const nextCatalog = currentCatalog.map((vehicle) => {
      const indicativo = normalizeVehicleName(vehicle?.indicativo)
      if (!indicativo || !kmsByVehicle.has(indicativo)) {
        return vehicle
      }

      const nextKms = kmsByVehicle.get(indicativo)
      const currentKms = Number(vehicle?.kms)
      if (Number.isFinite(currentKms) && Number(currentKms.toFixed(2)) === nextKms) {
        return vehicle
      }

      hasChanges = true
      return {
        ...vehicle,
        kms: nextKms,
      }
    })

    if (hasChanges) {
      updateNotificationSettings({
        campaignForm: {
          vehicleCatalog: nextCatalog,
        },
      })
    }
  } catch (error) {
    console.error('[convos.service] Error actualitzant els kms del cataleg de vehicles:', error.message)
  }
}

function buildCampaignFormPrefillFromRecord(record, eligibleUserIds) {
  if (!record) {
    return null
  }

  const volunteerUserIds = parseJsonList(record.voluntarisJson)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && eligibleUserIds.has(value))

  const vehicles = parseJsonList(record.vehiclesJson)
    .map((vehicle) => {
      if (!vehicle || typeof vehicle !== 'object' || Array.isArray(vehicle)) {
        return null
      }

      const vehicleName = String(vehicle.vehicleName || '').trim()
      if (!vehicleName) {
        return null
      }

      const kmsRaw = Number(vehicle.kms)
      const conductorRaw = vehicle.conductorUserId
      const conductorUserId =
        conductorRaw == null
          ? null
          : Number.isInteger(Number(conductorRaw)) && eligibleUserIds.has(Number(conductorRaw))
            ? Number(conductorRaw)
            : null

      const volunteerIds = Array.from(
        new Set(
          (Array.isArray(vehicle.volunteerUserIds) ? vehicle.volunteerUserIds : [])
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && eligibleUserIds.has(value))
        )
      )

      return {
        vehicleName,
        kms: Number.isFinite(kmsRaw) && kmsRaw >= 0 ? Number(kmsRaw.toFixed(2)) : 0,
        conductorUserId,
        volunteerUserIds: volunteerIds,
      }
    })
    .filter(Boolean)

  return {
    dia: record.dia,
    volunteerUserIds,
    vehicles,
  }
}

function buildCampaignFormDto(form) {
  const voluntaris = parseJsonList(form.voluntarisJson)
  const vehicles = parseJsonList(form.vehiclesJson)

  return {
    id: form.id,
    convocatoriaId: form.convocatoriaId,
    serviceMoment: form.serviceMoment,
    dia: form.dia,
    responsableId: form.responsableId,
    responsableNCarnet: form.responsableNCarnet,
    createdByNCarnet: form.createdByNCarnet,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    voluntaris,
    vehicles,
    convocatoria: form.convocatoria
      ? {
        id: form.convocatoria.id,
        title: form.convocatoria.title,
        date: form.convocatoria.date,
      }
      : null,
  }
}

function isWithinCampaign(dateValue, settings) {
  if (!settings.campaignStartDate || !settings.campaignEndDate) {
    return false
  }

  const current = new Date(dateValue)
  const start = new Date(`${settings.campaignStartDate}T00:00:00`)
  const end = new Date(`${settings.campaignEndDate}T23:59:59`)

  if (Number.isNaN(current.getTime()) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false
  }

  return current >= start && current <= end
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

async function getEligibleCampaignParticipants(convocatoriaId) {
  const respuestas = await database.respuesta.findMany({
    where: {
      convoId: convocatoriaId,
      response: true,
      attendanceConfirmed: true,
      user: {
        isActive: true,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          nCarnet: true,
          name: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      userNCarnet: 'asc',
    },
  })

  return respuestas
    .map((respuesta) => respuesta.user)
    .filter(Boolean)
    .map((user) => ({
      id: user.id,
      nCarnet: user.nCarnet,
      name: user.name,
      lastName: user.lastName,
    }))
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

function isIncendiConvoTypeName(convoTypeName) {
  return /incendi/i.test(convoTypeName || '')
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
    await recalculateAutoAssignedResponsable(convocatoria.id)
  } catch (error) {
    console.error('[convos.service] Error al recalcular autoresponsable tras auto-respuestas:', error.message)
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
  // Sortida is manual-only (responsable/admin). Keep function for compatibility with existing callers.
  const convocatoria = await database.convocatoria.findUnique({
    where: { id: convoId },
    include: convocatoriaInclude,
  })

  return convocatoria || null
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

  if (createDto.responsableId != null) {
    await ensureUserExists(createDto.responsableId)
  }
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

async function updateConvocatoria(id, payload, authUser = null) {
  const existingConvocatoria = await findConvocatoriaOrThrow(id)
  const updateDto = buildConvocatoriaUpdateDto(payload)

  if (Object.prototype.hasOwnProperty.call(updateDto, 'sortida')) {
    await ensureCanManageConvocatoria(authUser, existingConvocatoria)
  }

  if (updateDto.responsableId !== undefined && updateDto.responsableId !== null) {
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

  const finalSortida = Object.prototype.hasOwnProperty.call(updateDto, 'sortida')
    ? Boolean(updateDto.sortida)
    : Boolean(existingConvocatoria.sortida)
  const shouldNotifyIncendiSortidaActivation =
    !Boolean(existingConvocatoria.sortida)
    && finalSortida

  try {
    const convocatoria = await database.convocatoria.update({
      where: { id },
      data: updateDto,
      include: convocatoriaInclude,
    })

    if (shouldNotifyIncendiSortidaActivation) {
      try {
        const notificationsService = require('../notifications/notifications.service')
        await notificationsService.sendIncendiSortidaActivated(convocatoria.id, authUser?.userId || null)
      } catch (error) {
        console.error('[convos.service] Error al enviar aviso de sortida per incendi:', error.message)
      }
    }

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
    const convocatoria = await database.$transaction(async (tx) => {
      await tx.respuesta.deleteMany({
        where: { convoId: id },
      })

      await tx.formulariCampanya.deleteMany({
        where: { convocatoriaId: id },
      })

      return tx.convocatoria.delete({
        where: { id },
        include: convocatoriaInclude,
      })
    })

    return mapConvocatoriaToDto(convocatoria)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function getCampaignFormContext(id, authUser, options = {}) {
  const convocatoria = await findConvocatoriaOrThrow(id)
  await ensureCanManageConvocatoria(authUser, convocatoria)

  const eligibleUsers = await getEligibleCampaignParticipants(id)
  const eligibleUserIds = new Set(eligibleUsers.map((user) => user.id))
  const settings = getCampaignFormSettings()
  const mode = String(options?.mode || '').trim().toLowerCase()
  const lockedVehicleNames = mode === 'start'
    ? await getLockedVehicleNames((settings.vehicleCatalog || []).map((vehicle) => vehicle.indicativo))
    : []

  const responsable = convocatoria.responsableId
    ? await database.user.findUnique({
      where: { id: convocatoria.responsableId },
      select: {
        id: true,
        nCarnet: true,
        name: true,
        lastName: true,
      },
    })
    : null

  let prefill = null
  if (mode === 'finish') {
    const latestStartForm = await database.formulariCampanya.findFirst({
      where: {
        convocatoriaId: id,
        serviceMoment: 'START',
      },
      select: {
        dia: true,
        voluntarisJson: true,
        vehiclesJson: true,
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    })

    prefill = buildCampaignFormPrefillFromRecord(latestStartForm, eligibleUserIds)
  }

  return {
    convocatoria: mapConvocatoriaToDto(convocatoria),
    responsable,
    eligibleUsers,
    vehicleCatalog: settings.vehicleCatalog,
    lockedVehicleNames,
    prefill,
  }
}

async function createCampaignFormForConvocatoria({ convocatoria, authUser, payload, serviceMoment }) {
  const campaignFormDto = buildCampaignFormPayloadDto(payload || {})
  const eligibleUsers = await getEligibleCampaignParticipants(convocatoria.id)
  const eligibleUserIds = new Set(eligibleUsers.map((user) => user.id))

  const selectedVolunteerIds = campaignFormDto.volunteerUserIds.filter((userId) => eligibleUserIds.has(userId))
  const invalidVolunteerCount = campaignFormDto.volunteerUserIds.length - selectedVolunteerIds.length
  if (invalidVolunteerCount > 0) {
    throw createServiceError('El formulari inclou voluntaris que no han respost afirmativament o no han assistit.', 400)
  }

  const settings = getCampaignFormSettings()
  const catalog = new Set((settings.vehicleCatalog || []).map((item) => String(item.indicativo || '').trim()).filter(Boolean))
  const catalogKmsByVehicle = new Map(
    (settings.vehicleCatalog || [])
      .map((item) => {
        const indicativo = String(item?.indicativo || '').trim()
        const kms = Number(item?.kms)
        if (!indicativo) {
          return null
        }

        return [indicativo, Number.isFinite(kms) && kms >= 0 ? Number(kms.toFixed(2)) : 0]
      })
      .filter(Boolean)
  )

  const normalizedVehicles = campaignFormDto.vehicles.map((vehicle) => {
    if (catalog.size > 0 && !catalog.has(vehicle.vehicleName)) {
      throw createServiceError(`El vehicle "${vehicle.vehicleName}" no forma part del cataleg configurat.`, 400)
    }

    if (vehicle.conductorUserId != null && !eligibleUserIds.has(vehicle.conductorUserId)) {
      throw createServiceError(`El conductor del vehicle "${vehicle.vehicleName}" no es valid per aquesta convocatoria.`, 400)
    }

    const volunteerIds = vehicle.volunteerUserIds.filter((userId) => eligibleUserIds.has(userId))
    if (volunteerIds.length !== vehicle.volunteerUserIds.length) {
      throw createServiceError(`Els voluntaris del vehicle "${vehicle.vehicleName}" no son valids per aquesta convocatoria.`, 400)
    }

    const currentKms = catalogKmsByVehicle.get(vehicle.vehicleName) ?? 0
    if (vehicle.kms < currentKms) {
      throw createServiceError(
        `Els KM del vehicle "${vehicle.vehicleName}" no poden ser inferiors als actuals (${currentKms}).`,
        400
      )
    }

    const kmsIncrease = vehicle.kms - currentKms
    if (kmsIncrease > MAX_KM_INCREASE_PER_FORM) {
      throw createServiceError(
        `L'increment de KM del vehicle "${vehicle.vehicleName}" es massa alt (+${kmsIncrease}). Revisa si hi ha un zero de mes.`,
        400
      )
    }

    return {
      vehicleName: vehicle.vehicleName,
      kms: vehicle.kms,
      conductorUserId: vehicle.conductorUserId,
      volunteerUserIds: volunteerIds,
    }
  })

  if (serviceMoment === 'START') {
    await ensureVehiclesCanStartService(normalizedVehicles.map((vehicle) => vehicle.vehicleName))
  }

  const responsable = convocatoria.responsableId
    ? await database.user.findUnique({
      where: { id: convocatoria.responsableId },
      select: {
        id: true,
        nCarnet: true,
      },
    })
    : null

  const created = await database.formulariCampanya.create({
    data: {
      convocatoriaId: convocatoria.id,
      dia: campaignFormDto.dia,
      responsableId: responsable?.id || convocatoria.responsableId || null,
      responsableNCarnet: responsable?.nCarnet || null,
      voluntarisJson: JSON.stringify(selectedVolunteerIds),
      vehiclesJson: JSON.stringify(normalizedVehicles),
      serviceMoment,
      createdByNCarnet: authUser?.nCarnet || null,
    },
  })

  if (serviceMoment === 'END') {
    syncCampaignVehicleCatalogKms(normalizedVehicles)
  }

  return buildCampaignFormDto(created)
}

async function listCampaignForms(authUser, filters = {}) {
  const where = {}
  let scopedByConvo = false

  if (filters.convoId !== undefined) {
    const convoId = Number(filters.convoId)
    if (Number.isInteger(convoId) && convoId > 0) {
      const convocatoria = await findConvocatoriaOrThrow(convoId)
      await ensureCanManageConvocatoria(authUser, convocatoria)
      where.convocatoriaId = convoId
      scopedByConvo = true
    }
  }

  if (!scopedByConvo) {
    await ensureAdmin(authUser)
  }

  if (typeof filters.serviceMoment === 'string' && filters.serviceMoment.trim()) {
    const normalizedMoment = filters.serviceMoment.trim().toUpperCase()
    if (['START', 'END'].includes(normalizedMoment)) {
      where.serviceMoment = normalizedMoment
    }
  }

  const rows = await database.formulariCampanya.findMany({
    where,
    include: {
      convocatoria: {
        select: {
          id: true,
          title: true,
          date: true,
        },
      },
    },
    orderBy: [
      { dia: 'desc' },
      { id: 'desc' },
    ],
  })

  return rows.map(buildCampaignFormDto)
}

async function deleteCampaignForm(id, authUser) {
  const existing = await database.formulariCampanya.findUnique({
    where: { id },
    include: {
      convocatoria: {
        include: convocatoriaInclude,
      },
    },
  })

  if (!existing) {
    throw createServiceError('No s\'ha trobat el formulari de campanya.', 404)
  }

  if (!existing.convocatoria) {
    throw createServiceError('La convocatòria associada al formulari no existeix.', 404)
  }

  await ensureCanManageConvocatoria(authUser, existing.convocatoria)

  const deleted = await database.formulariCampanya.delete({
    where: { id },
    include: {
      convocatoria: {
        select: {
          id: true,
          title: true,
          date: true,
        },
      },
    },
  })

  return buildCampaignFormDto(deleted)
}

async function startConvocatoria(id, authUser, payload = {}) {
  const convocatoria = await findConvocatoriaOrThrow(id)
  await ensureCanManageConvocatoria(authUser, convocatoria)

  if (convocatoria.actualStartTime) {
    throw createServiceError('La convocatoria ya fue iniciada.', 409)
  }

  const now = new Date()
  if (!isSameLocalCalendarDate(now, convocatoria.date)) {
    throw createServiceError('Nomes pots iniciar la guardia el mateix dia de la convocatoria.', 409)
  }

  const updated = await database.convocatoria.update({
    where: { id },
    data: {
      actualStartTime: now,
    },
    include: convocatoriaInclude,
  })

  await createCampaignFormForConvocatoria({
    convocatoria: updated,
    authUser,
    payload,
    serviceMoment: 'START',
  })

  return mapConvocatoriaToDto(updated)
}

async function finishConvocatoria(id, authUser, payload = {}) {
  const convocatoria = await findConvocatoriaOrThrow(id)
  await ensureCanManageConvocatoria(authUser, convocatoria)

  if (!convocatoria.actualStartTime) {
    throw createServiceError('Debes iniciar la convocatoria antes de finalizarla.', 409)
  }

  if (convocatoria.actualEndTime) {
    throw createServiceError('La convocatoria ya fue finalizada.', 409)
  }

  const now = new Date()

  if (now < convocatoria.actualStartTime) {
    throw createServiceError('La hora de finalización no puede ser anterior al inicio real.', 409)
  }

  const updated = await database.convocatoria.update({
    where: { id },
    data: {
      actualEndTime: now,
      isActive: false,
    },
    include: convocatoriaInclude,
  })

  await createCampaignFormForConvocatoria({
    convocatoria: updated,
    authUser,
    payload,
    serviceMoment: 'END',
  })

  return mapConvocatoriaToDto(updated)
}

async function getHoursSummary(authUser) {
  await ensureAdmin(authUser)

  const settings = getHourComputationSettings()
  const now = new Date()

  const users = await database.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nCarnet: true,
      name: true,
      lastName: true,
    },
    orderBy: {
      nCarnet: 'asc',
    },
  })

  const convocatorias = await database.convocatoria.findMany({
    where: {
      startTime: {
        lte: now,
      },
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      finalTime: true,
      actualStartTime: true,
      actualEndTime: true,
      convoType: {
        select: {
          name: true,
        },
      },
    },
  })

  const respuestas = await database.respuesta.findMany({
    where: {
      convoId: {
        in: convocatorias.map((convo) => convo.id),
      },
    },
    select: {
      convoId: true,
      userNCarnet: true,
      response: true,
      attendanceConfirmed: true,
      attendanceJustified: true,
    },
  })

  const responseByConvoAndUser = new Map(
    respuestas.map((respuesta) => [`${respuesta.convoId}:${respuesta.userNCarnet}`, respuesta])
  )

  const rows = []

  for (const user of users) {
    let campaignHours = 0
    let offCampaignHours = 0
    let unansweredCount = 0
    let noShowCount = 0

    for (const convo of convocatorias) {
      const responseKey = `${convo.id}:${user.nCarnet}`
      const respuesta = responseByConvoAndUser.get(responseKey)
      const inCampaign = isWithinCampaign(convo.date, settings)
      const isIncendiConvo = isIncendiConvoTypeName(convo.convoType?.name)
      const durationHours = getConvocatoriaDurationHours(convo)

      if (!respuesta) {
        if (inCampaign && !isIncendiConvo) {
          unansweredCount += 1
        }
        continue
      }

      if (respuesta.response === true && respuesta.attendanceConfirmed === true) {
        if (inCampaign) {
          campaignHours += durationHours
        } else {
          offCampaignHours += durationHours
        }
        continue
      }

      if (
        inCampaign &&
        respuesta.response === true &&
        respuesta.attendanceConfirmed === false &&
        respuesta.attendanceJustified !== true
      ) {
        noShowCount += 1
      }
    }

    const unansweredPenaltyEvents = Math.max(0, unansweredCount - Number(settings.unansweredPenaltyThreshold || 0))
    const unansweredPenaltyHours = unansweredPenaltyEvents * Number(settings.unansweredPenaltyHours || 1)
    const noShowPenaltyHours = noShowCount * Number(settings.noShowPenaltyHours || 4)
    const totalHours = Number((campaignHours + offCampaignHours - unansweredPenaltyHours - noShowPenaltyHours).toFixed(2))

    const row = {
      userId: user.id,
      userNCarnet: user.nCarnet,
      userName: `${user.name} ${user.lastName || ''}`.trim(),
      campaignHours: Number(campaignHours.toFixed(2)),
      offCampaignHours: Number(offCampaignHours.toFixed(2)),
      unansweredCount,
      noShowCount,
      unansweredPenaltyHours: Number(unansweredPenaltyHours.toFixed(2)),
      noShowPenaltyHours: Number(noShowPenaltyHours.toFixed(2)),
      totalHours,
    }

    rows.push(row)

    await database.userHoursSummary.upsert({
      where: { userId: user.id },
      update: {
        campaignHours: row.campaignHours,
        offCampaignHours: row.offCampaignHours,
        unansweredCount: row.unansweredCount,
        noShowCount: row.noShowCount,
        unansweredPenaltyHours: row.unansweredPenaltyHours,
        noShowPenaltyHours: row.noShowPenaltyHours,
        totalHours: row.totalHours,
      },
      create: {
        userId: user.id,
        campaignHours: row.campaignHours,
        offCampaignHours: row.offCampaignHours,
        unansweredCount: row.unansweredCount,
        noShowCount: row.noShowCount,
        unansweredPenaltyHours: row.unansweredPenaltyHours,
        noShowPenaltyHours: row.noShowPenaltyHours,
        totalHours: row.totalHours,
      },
    })
  }

  return {
    generatedAt: now.toISOString(),
    settings,
    users: rows,
  }
}

async function updateConvocatoriaLifecycle(id, payload, authUser) {
  const convocatoria = await findConvocatoriaOrThrow(id)
  await ensureCanManageConvocatoria(authUser, convocatoria)

  const lifecycleDto = buildConvocatoriaLifecycleUpdateDto(payload)

  const resolvedStart = Object.prototype.hasOwnProperty.call(lifecycleDto, 'actualStartTime')
    ? lifecycleDto.actualStartTime
    : convocatoria.actualStartTime
  const resolvedEnd = Object.prototype.hasOwnProperty.call(lifecycleDto, 'actualEndTime')
    ? lifecycleDto.actualEndTime
    : convocatoria.actualEndTime

  if (!resolvedStart && resolvedEnd) {
    throw createServiceError('No puedes indicar fin real sin inicio real.', 400)
  }

  if (resolvedStart && resolvedEnd && resolvedEnd < resolvedStart) {
    throw createServiceError('La hora real de fin no puede ser anterior al inicio real.', 400)
  }

  try {
    const updated = await database.convocatoria.update({
      where: { id },
      data: lifecycleDto,
      include: convocatoriaInclude,
    })

    return mapConvocatoriaToDto(updated)
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
  // Kept for compatibility with scheduler/orchestrator call sites.
  // Sortida is manual-only and no longer auto-updated based on minimum responses.
  return 0
}

module.exports = {
  applyAvailabilityWindowsToConvocatoria,
  getCampaignFormContext,
  listCampaignForms,
  deleteCampaignForm,
  createConvocatoria,
  createConvoType,
  createServiceError,
  deleteConvocatoria,
  deleteConvoType,
  finishConvocatoria,
  getAllConvocatorias,
  getAllConvoTypes,
  getConvocatoriaById,
  getConvoTypeById,
  getHoursSummary,
  mapPrismaError,
  recalculateSortidaForConvocatoria,
  recalculateAutoAssignedResponsable,
  updateSortidaForTomorrow,
  updateConvocatoriaLifecycle,
  updateConvocatoria,
  updateConvoType,
  startConvocatoria,
  __matchingInternals: {
    resolveAvailabilityDecision,
    shouldMarkSortida,
    getUserPriority,
  },
}
