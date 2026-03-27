const database = require('../../../../database/prisma/prisma')
const {
  buildAvailabilityWindowCreateDto,
  buildAvailabilityWindowUpdateDto,
  createAvailabilityDtoError,
  mapAvailabilityWindowToDto,
} = require('./availability.dto')
const { readNotificationSettings } = require('../notifications/notifications.config')

function createServiceError(message, statusCode = 500, details) {
  const error = new Error(message)
  error.statusCode = statusCode

  if (details) {
    error.details = details
  }

  return error
}

function parseDateOrUndefined(value, fieldName) {
  if (value === undefined) {
    return undefined
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    throw createAvailabilityDtoError(`El parametro "${fieldName}" debe ser una fecha valida.`)
  }

  return parsed
}

function buildListFilters(rawFilters = {}) {
  const where = {}

  if (rawFilters.userNCarnet) {
    where.userNCarnet = String(rawFilters.userNCarnet).trim()
  }

  if (rawFilters.availabilityType) {
    const availabilityType = String(rawFilters.availabilityType).trim()

    if (!['available', 'unavailable'].includes(availabilityType)) {
      throw createAvailabilityDtoError('El parametro "availabilityType" debe ser "available" o "unavailable".')
    }

    where.availabilityType = availabilityType
  }

  const fromDateTime = parseDateOrUndefined(rawFilters.fromDateTime, 'fromDateTime')
  const toDateTime = parseDateOrUndefined(rawFilters.toDateTime, 'toDateTime')

  if (fromDateTime || toDateTime) {
    where.AND = [
      fromDateTime ? { toDateTime: { gt: fromDateTime } } : {},
      toDateTime ? { fromDateTime: { lt: toDateTime } } : {},
    ]
  }

  return where
}

async function ensureUserExists(nCarnet) {
  const user = await database.user.findUnique({
    where: { nCarnet },
    select: { id: true },
  })

  if (!user) {
    throw createAvailabilityDtoError('No existe el usuario indicado en "userNCarnet".', 404)
  }
}

async function canManageAllAvailabilityWindows(authUser) {
  const isAdmin = await database.role.findFirst({
    where: {
      nCarnet: authUser?.nCarnet,
      isAdmin: true,
    },
    select: { id: true },
  })

  if (isAdmin) {
    return true
  }

  const settings = readNotificationSettings()
  const managers = settings?.typeGroups?.availabilityManagerNCarnets || []
  return managers.includes(authUser?.nCarnet)
}

async function resolveAllowedUserNCarnet(targetUserNCarnet, authUser) {
  if (!authUser?.nCarnet) {
    throw createAvailabilityDtoError('Usuario no autenticado.', 401)
  }

  const canManageAll = await canManageAllAvailabilityWindows(authUser)
  if (canManageAll) {
    return targetUserNCarnet
  }

  if (targetUserNCarnet && targetUserNCarnet !== authUser.nCarnet) {
    throw createAvailabilityDtoError('No tienes permisos para gestionar ventanas de otro usuario.', 403)
  }

  return authUser.nCarnet
}

function buildOverlappingWhere({ userNCarnet, fromDateTime, toDateTime, excludeId }) {
  const where = {
    userNCarnet,
    fromDateTime: { lt: toDateTime },
    toDateTime: { gt: fromDateTime },
  }

  if (excludeId) {
    where.id = { not: excludeId }
  }

  return where
}

async function mergeCompatibleOverlaps(currentWindow, overlappingWindows) {
  // Separate windows by type
  const sameTypeWindows = overlappingWindows.filter(
    (item) => item.availabilityType === currentWindow.availabilityType
  )

  // If there are overlaps with same type, merge them
  // If there are overlaps with different type, allow both to coexist (no error, just skip merge)
  if (sameTypeWindows.length === 0) {
    // No windows of the same type to merge with
    return currentWindow
  }

  // Merge with same-type overlaps: expand the range to cover all
  const mergedFromDateTime = new Date(
    Math.min(
      currentWindow.fromDateTime.getTime(),
      ...sameTypeWindows.map((item) => item.fromDateTime.getTime())
    )
  )

  const mergedToDateTime = new Date(
    Math.max(
      currentWindow.toDateTime.getTime(),
      ...sameTypeWindows.map((item) => item.toDateTime.getTime())
    )
  )

  const mergedWindow = await database.availabilityWindow.update({
    where: { id: currentWindow.id },
    data: {
      fromDateTime: mergedFromDateTime,
      toDateTime: mergedToDateTime,
    },
  })

  if (sameTypeWindows.length > 0) {
    await database.availabilityWindow.deleteMany({
      where: {
        id: {
          in: sameTypeWindows.map((item) => item.id),
        },
      },
    })
  }

  return mergedWindow
}

async function getAvailabilityWindows(filters, authUser) {
  const effectiveFilters = { ...(filters || {}) }
  const canManageAll = await canManageAllAvailabilityWindows(authUser)

  if (!canManageAll) {
    effectiveFilters.userNCarnet = authUser?.nCarnet
  }

  const windows = await database.availabilityWindow.findMany({
    where: buildListFilters(effectiveFilters),
    orderBy: [
      { fromDateTime: 'asc' },
      { id: 'asc' },
    ],
  })

  return windows.map(mapAvailabilityWindowToDto)
}

async function applyWindowToExistingConvocatorias(resolvedWindow) {
  // eslint-disable-next-line global-require
  const { applyAvailabilityWindowsToConvocatoria } = require('../convos/convos.service')

  const overlappingConvocatorias = await database.convocatoria.findMany({
    where: {
      isActive: true,
      AND: [
        { startTime: { lt: resolvedWindow.toDateTime } },
        {
          OR: [
            { finalTime: { gt: resolvedWindow.fromDateTime } },
            { finalTime: null, startTime: { gte: resolvedWindow.fromDateTime } },
          ],
        },
      ],
    },
    select: {
      id: true,
      startTime: true,
      finalTime: true,
    },
  })

  if (overlappingConvocatorias.length === 0) {
    return 0
  }

  let totalApplied = 0

  for (const convocatoria of overlappingConvocatorias) {
    try {
      const applied = await applyAvailabilityWindowsToConvocatoria(convocatoria)
      totalApplied += applied
    } catch (error) {
      console.error(
        `[availability.service] Error al aplicar disponibilidad a convocatoria ${convocatoria.id}:`,
        error.message
      )
    }
  }

  return totalApplied
}

async function createAvailabilityWindow(payload, authUser) {
  const createDto = buildAvailabilityWindowCreateDto(payload)
  createDto.userNCarnet = await resolveAllowedUserNCarnet(createDto.userNCarnet, authUser)

  await ensureUserExists(createDto.userNCarnet)

  const created = await database.availabilityWindow.create({
    data: createDto,
  })

  const overlapping = await database.availabilityWindow.findMany({
    where: buildOverlappingWhere({
      userNCarnet: createDto.userNCarnet,
      fromDateTime: createDto.fromDateTime,
      toDateTime: createDto.toDateTime,
      excludeId: created.id,
    }),
  })

  const resolved = await mergeCompatibleOverlaps(created, overlapping)

  try {
    await applyWindowToExistingConvocatorias(resolved)
  } catch (error) {
    console.error('[availability.service] Error al aplicar ventana a convocatorias existentes:', error.message)
  }

  return mapAvailabilityWindowToDto(resolved)
}

async function findAvailabilityWindowOrThrow(id) {
  const window = await database.availabilityWindow.findUnique({
    where: { id },
  })

  if (!window) {
    throw createServiceError('No se ha encontrado la ventana de disponibilidad solicitada.', 404)
  }

  return window
}

async function ensureCanAccessWindow(window, authUser) {
  const canManageAll = await canManageAllAvailabilityWindows(authUser)
  if (canManageAll) {
    return
  }

  if (!authUser?.nCarnet || window.userNCarnet !== authUser.nCarnet) {
    throw createAvailabilityDtoError('No tienes permisos para gestionar esta ventana de disponibilidad.', 403)
  }
}

async function updateAvailabilityWindow(id, payload, authUser) {
  const existingWindow = await findAvailabilityWindowOrThrow(id)
  await ensureCanAccessWindow(existingWindow, authUser)
  const updateDto = buildAvailabilityWindowUpdateDto(payload)

  if (updateDto.userNCarnet !== undefined) {
    updateDto.userNCarnet = await resolveAllowedUserNCarnet(updateDto.userNCarnet, authUser)
  }

  const finalWindow = {
    ...existingWindow,
    ...updateDto,
  }

  if (finalWindow.toDateTime <= finalWindow.fromDateTime) {
    throw createAvailabilityDtoError('El rango no es valido: "toDateTime" debe ser posterior a "fromDateTime".')
  }

  if (updateDto.userNCarnet && updateDto.userNCarnet !== existingWindow.userNCarnet) {
    await ensureUserExists(updateDto.userNCarnet)
  }

  const updated = await database.availabilityWindow.update({
    where: { id },
    data: updateDto,
  })

  const overlapping = await database.availabilityWindow.findMany({
    where: buildOverlappingWhere({
      userNCarnet: finalWindow.userNCarnet,
      fromDateTime: finalWindow.fromDateTime,
      toDateTime: finalWindow.toDateTime,
      excludeId: id,
    }),
  })

  const resolved = await mergeCompatibleOverlaps(updated, overlapping)

  try {
    await applyWindowToExistingConvocatorias(resolved)
  } catch (error) {
    console.error('[availability.service] Error al aplicar ventana a convocatorias existentes:', error.message)
  }

  return mapAvailabilityWindowToDto(resolved)
}

async function deleteAvailabilityWindow(id, authUser) {
  const window = await findAvailabilityWindowOrThrow(id)
  await ensureCanAccessWindow(window, authUser)
  await database.availabilityWindow.delete({ where: { id } })
  return mapAvailabilityWindowToDto(window)
}

function mapPrismaError(error) {
  if (error?.code === 'P2003') {
    return createServiceError('No existe el usuario referenciado para la ventana de disponibilidad.', 409)
  }

  if (error?.code === 'P2025') {
    return createServiceError('No se ha encontrado la ventana de disponibilidad solicitada.', 404)
  }

  return error
}

module.exports = {
  createAvailabilityWindow,
  createServiceError,
  deleteAvailabilityWindow,
  getAvailabilityWindows,
  mapPrismaError,
  updateAvailabilityWindow,
}
