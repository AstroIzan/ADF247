const database = require('../../../../database/prisma/prisma')
const {
  buildDeactivateDeviceTokenDto,
  buildNotificationConfigUpdateDto,
  buildNotificationLogsQueryDto,
  buildRegisterDeviceTokenDto,
  buildSendBroadcastDto,
  createNotificationsDtoError,
  mapDeviceTokenToDto,
  mapNotificationLogToDto,
} = require('./notifications.dto')
const {
  readNotificationSettings,
  updateNotificationSettings,
} = require('./notifications.config')
const { getFirebaseMessaging } = require('./notifications.firebase')
const { updateSortidaForTomorrow } = require('../convos/convos.service')

const INACTIVE_DEVICE_TOKEN_RETENTION_DAYS = 30

function createServiceError(message, statusCode = 500, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (details) {
    error.details = details
  }
  return error
}

async function ensureAdmin(authUser) {
  const role = await database.role.findFirst({
    where: {
      nCarnet: authUser.nCarnet,
      isAdmin: true,
    },
    select: { id: true },
  })

  if (!role) {
    throw createNotificationsDtoError('No tienes permisos para enviar notificaciones.', 403)
  }
}

function normalizeTypeName(value) {
  return String(value || '').trim().toLowerCase()
}

function isTypeListed(typeName, configuredNames = []) {
  if (!configuredNames || configuredNames.length === 0) {
    return true
  }

  const normalizedTypeName = normalizeTypeName(typeName)
  return configuredNames.some((configuredName) => normalizeTypeName(configuredName) === normalizedTypeName)
}

function isWeeklyType(typeName, settings) {
  return isTypeListed(typeName, settings.typeGroups.weeklyTypeNames)
}

function formatDateForText(date) {
  return new Date(date).toLocaleDateString('ca-ES')
}

function applyTemplate(template, context) {
  return String(template || '').replace(/\{(\w+)\}/g, (_match, key) => {
    const value = context[key]
    return value === undefined || value === null ? '' : String(value)
  })
}

function chunkArray(values, chunkSize) {
  const chunks = []
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize))
  }
  return chunks
}

function startOfDay(referenceDate) {
  const value = new Date(referenceDate)
  value.setHours(0, 0, 0, 0)
  return value
}

function endOfDay(referenceDate) {
  const value = startOfDay(referenceDate)
  value.setDate(value.getDate() + 1)
  return value
}

function getDateRangeByDaysAhead(referenceDate = new Date(), daysAhead = 1) {
  const start = startOfDay(referenceDate)
  start.setDate(start.getDate() + daysAhead)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start, end }
}

function getNextWeekRange(referenceDate = new Date()) {
  const start = startOfDay(referenceDate)
  const day = start.getDay()
  const daysUntilNextMonday = ((8 - day) % 7) || 7
  start.setDate(start.getDate() + daysUntilNextMonday)

  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  return { start, end }
}

function getWeekKey(referenceDate = new Date()) {
  const range = getNextWeekRange(referenceDate)
  return range.start.toISOString().slice(0, 10)
}

function getDateKey(referenceDate = new Date()) {
  return startOfDay(referenceDate).toISOString().slice(0, 10)
}

async function pruneInactiveDeviceTokensForUser(userId) {
  if (!userId) {
    return
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - INACTIVE_DEVICE_TOKEN_RETENTION_DAYS)

  await database.deviceToken.deleteMany({
    where: {
      userId,
      isActive: false,
      createdAt: {
        lt: cutoff,
      },
    },
  })
}

function countEligibleResponses(positiveResponses = []) {
  return positiveResponses.reduce((acc, respuesta) => {
    const role = Array.isArray(respuesta.user?.roles) ? respuesta.user.roles[0] : null
    acc.total += 1

    if (role?.isGroc) {
      acc.groc += 1
    }

    return acc
  }, { groc: 0, total: 0 })
}

function shouldMarkSortida(convoType, positiveResponses) {
  const minimumGroc = convoType?.minGrocSortida ?? 0
  const minimumVerd = convoType?.minVerdSortida ?? 0
  const counts = countEligibleResponses(positiveResponses)

  return counts.groc >= minimumGroc && counts.total >= minimumVerd
}

async function ensureConfiguredConvoTypes() {
  const settings = readNotificationSettings()
  const sourceName = settings.typeGroups.guardiaSourceTypeName
  const targetName = settings.typeGroups.guardiaPviTypeName

  const sourceType = await database.convoType.findFirst({
    where: { name: sourceName },
  })

  if (!sourceType || !targetName) {
    return null
  }

  const existing = await database.convoType.findFirst({
    where: { name: targetName },
  })

  if (!existing) {
    return database.convoType.create({
      data: {
        name: targetName,
        minGrocSortida: sourceType.minGrocSortida,
        minVerdSortida: sourceType.minVerdSortida,
        defaultLocation: sourceType.defaultLocation,
      },
    })
  }

  if (
    existing.minGrocSortida !== sourceType.minGrocSortida
    || existing.minVerdSortida !== sourceType.minVerdSortida
    || existing.defaultLocation !== sourceType.defaultLocation
  ) {
    return database.convoType.update({
      where: { id: existing.id },
      data: {
        minGrocSortida: sourceType.minGrocSortida,
        minVerdSortida: sourceType.minVerdSortida,
        defaultLocation: sourceType.defaultLocation,
      },
    })
  }

  return existing
}

async function getConvocatoriaWithContext(convoId) {
  const parsedId = Number.parseInt(String(convoId), 10)

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw createNotificationsDtoError('El identificador de convocatoria no es valido.')
  }

  const convocatoria = await database.convocatoria.findUnique({
    where: { id: parsedId },
    include: {
      convoType: true,
      respostas: {
        include: {
          user: {
            include: {
              roles: true,
            },
          },
        },
      },
    },
  })

  if (!convocatoria) {
    throw createNotificationsDtoError('No se ha encontrado la convocatoria indicada.', 404)
  }

  return convocatoria
}

async function getMissingResponseUsersForConvocatorias(convocatorias) {
  if (!Array.isArray(convocatorias) || convocatorias.length === 0) {
    return []
  }

  const activeUsers = await database.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nCarnet: true,
    },
  })

  const answersByConvo = new Map()
  convocatorias.forEach((convocatoria) => {
    const answeredUsers = new Set((convocatoria.respostas || []).map((respuesta) => respuesta.userNCarnet))
    answersByConvo.set(convocatoria.id, answeredUsers)
  })

  return activeUsers.map((user) => {
    let pendingCount = 0

    convocatorias.forEach((convocatoria) => {
      const answeredUsers = answersByConvo.get(convocatoria.id)
      if (!answeredUsers?.has(user.nCarnet)) {
        pendingCount += 1
      }
    })

    return {
      userId: user.id,
      pendingCount,
    }
  }).filter((entry) => entry.pendingCount > 0)
}

async function hasNotificationLogForScope(targetScope, referenceDate = new Date()) {
  const existing = await database.notificationLog.findFirst({
    where: {
      targetScope,
      createdAt: {
        gte: startOfDay(referenceDate),
        lt: endOfDay(referenceDate),
      },
      status: {
        not: 'failed',
      },
    },
    select: { id: true },
  })

  return Boolean(existing)
}

async function sendMulticastNotification({
  title,
  body,
  link = '/dashboard',
  data = {},
  targetScope,
  senderUserId = null,
  userIds,
}) {
  const tokenWhere = { isActive: true }

  if (Array.isArray(userIds)) {
    tokenWhere.userId = { in: userIds }
  }

  const activeTokens = await database.deviceToken.findMany({
    where: tokenWhere,
    select: {
      token: true,
    },
  })

  const tokens = [...new Set(activeTokens.map((item) => item.token))]

  if (tokens.length === 0) {
    const log = await database.notificationLog.create({
      data: {
        senderUserId,
        title,
        body,
        dataJson: JSON.stringify(data),
        requestedCount: 0,
        successCount: 0,
        failureCount: 0,
        targetScope,
        status: 'no-targets',
      },
    })

    return mapNotificationLogToDto(log)
  }

  try {
    const messaging = getFirebaseMessaging()
    const batches = chunkArray(tokens, 500)
    let successCount = 0
    let failureCount = 0
    const tokensToDisable = []

    for (const batchTokens of batches) {
      const response = await messaging.sendEachForMulticast({
        tokens: batchTokens,
        notification: {
          title,
          body,
        },
        data: Object.entries(data).reduce((acc, [key, value]) => {
          acc[key] = String(value)
          return acc
        }, {}),
        webpush: {
          fcmOptions: {
            link,
          },
        },
      })

      successCount += response.successCount
      failureCount += response.failureCount

      response.responses.forEach((result, index) => {
        if (!result.success) {
          const errorCode = result.error?.code || ''
          if (errorCode === 'messaging/registration-token-not-registered' || errorCode === 'messaging/invalid-registration-token') {
            tokensToDisable.push(batchTokens[index])
          }
        }
      })
    }

    if (tokensToDisable.length > 0) {
      await database.deviceToken.updateMany({
        where: {
          token: {
            in: tokensToDisable,
          },
        },
        data: {
          isActive: false,
        },
      })
    }

    const log = await database.notificationLog.create({
      data: {
        senderUserId,
        title,
        body,
        dataJson: JSON.stringify(data),
        requestedCount: tokens.length,
        successCount,
        failureCount,
        targetScope,
        status: failureCount > 0 ? 'partial' : 'sent',
      },
    })

    return mapNotificationLogToDto(log)
  } catch (error) {
    const log = await database.notificationLog.create({
      data: {
        senderUserId,
        title,
        body,
        dataJson: JSON.stringify(data),
        requestedCount: tokens.length,
        successCount: 0,
        failureCount: tokens.length,
        targetScope,
        status: 'failed',
        errorMessage: error.message,
      },
    })

    const serviceError = createServiceError(error.message, 500)
    serviceError.log = mapNotificationLogToDto(log)
    throw serviceError
  }
}

async function registerDeviceToken(authUser, payload, userAgent) {
  const dto = buildRegisterDeviceTokenDto({
    ...payload,
    userAgent,
  })

  const now = new Date()
  const existing = await database.deviceToken.findUnique({
    where: { token: dto.token },
  })

  let tokenRecord

  if (existing) {
    tokenRecord = await database.deviceToken.update({
      where: { token: dto.token },
      data: {
        userId: authUser.userId,
        platform: dto.platform,
        userAgent: dto.userAgent,
        isActive: true,
        lastSeenAt: now,
      },
    })
  } else {
    tokenRecord = await database.deviceToken.create({
      data: {
        userId: authUser.userId,
        token: dto.token,
        platform: dto.platform,
        userAgent: dto.userAgent,
        isActive: true,
        lastSeenAt: now,
      },
    })
  }

  // Keep historical table bounded by removing old inactive rows.
  await pruneInactiveDeviceTokensForUser(authUser.userId)

  return mapDeviceTokenToDto(tokenRecord)
}

async function deactivateDeviceToken(authUser, payload) {
  const dto = buildDeactivateDeviceTokenDto(payload)

  await database.deviceToken.updateMany({
    where: {
      userId: authUser.userId,
      token: dto.token,
      isActive: true,
    },
    data: {
      isActive: false,
      lastSeenAt: new Date(),
    },
  })

  await pruneInactiveDeviceTokensForUser(authUser.userId)

  return { ok: true }
}

async function getCurrentUserDeviceTokens(authUser) {
  const tokens = await database.deviceToken.findMany({
    where: {
      userId: authUser.userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return tokens.map(mapDeviceTokenToDto)
}

async function getAllDeviceTokens(authUser) {
  await ensureAdmin(authUser)

  const tokens = await database.deviceToken.findMany({
    include: {
      user: {
        select: { id: true, nCarnet: true, name: true, lastName: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return tokens.map((t) => ({
    ...mapDeviceTokenToDto(t),
    user: t.user
      ? { id: t.user.id, nCarnet: t.user.nCarnet, name: t.user.name, lastName: t.user.lastName }
      : null,
  }))
}

async function getNotificationConfig(authUser) {
  await ensureAdmin(authUser)
  await ensureConfiguredConvoTypes()
  return readNotificationSettings()
}

async function updateNotificationConfig(authUser, payload) {
  await ensureAdmin(authUser)
  const dto = buildNotificationConfigUpdateDto(payload)
  const settings = updateNotificationSettings(dto)
  await ensureConfiguredConvoTypes()
  return settings
}

async function sendBroadcastNotification(authUser, payload) {
  await ensureAdmin(authUser)
  const dto = buildSendBroadcastDto(payload)

  return sendMulticastNotification({
    title: dto.title,
    body: dto.body,
    link: dto.link,
    data: dto.data,
    targetScope: `manual-broadcast:${Date.now()}`,
    senderUserId: authUser.userId,
  })
}

async function sendConvocatoriaResponseRequestInternal(convocatoria, senderUserId, targetScope) {
  const settings = readNotificationSettings()
  const recipients = await getMissingResponseUsersForConvocatorias([convocatoria])

  return sendMulticastNotification({
    title: applyTemplate(settings.responseRequest.creationTitle, {
      title: convocatoria.title,
      type: convocatoria.convoType?.name || '',
      date: formatDateForText(convocatoria.date),
    }),
    body: applyTemplate(settings.responseRequest.creationBody, {
      title: convocatoria.title,
      type: convocatoria.convoType?.name || '',
      date: formatDateForText(convocatoria.date),
    }),
    link: settings.responseRequest.link,
    data: {
      kind: 'response-request',
      convocatoriaId: convocatoria.id,
      typeName: convocatoria.convoType?.name || '',
    },
    targetScope,
    senderUserId,
    userIds: recipients.map((recipient) => recipient.userId),
  })
}

async function sendConvocatoriaResponseRequest(authUser, convoId) {
  await ensureAdmin(authUser)
  const convocatoria = await getConvocatoriaWithContext(convoId)

  return sendConvocatoriaResponseRequestInternal(
    convocatoria,
    authUser.userId,
    `manual-response-request:${convocatoria.id}:${Date.now()}`
  )
}

async function handleConvocatoriaCreated(convoId) {
  const settings = readNotificationSettings()
  await ensureConfiguredConvoTypes()

  const convocatoria = await getConvocatoriaWithContext(convoId)

  if (!settings.responseRequest.sendOnCreationForNonWeekly) {
    return { skipped: true, reason: 'creation-disabled' }
  }

  if (isWeeklyType(convocatoria.convoType?.name, settings)) {
    return { skipped: true, reason: 'weekly-type' }
  }

  return sendConvocatoriaResponseRequestInternal(convocatoria, null, `auto-response-request:${convocatoria.id}`)
}

async function sendConvocatoriaSortidaStatusInternal(convocatoria, senderUserId, targetScope) {
  const settings = readNotificationSettings()
  const targetUserIds = [...new Set(
    (convocatoria.respostas || [])
      .filter((respuesta) => respuesta.response && respuesta.user?.isActive)
      .map((respuesta) => respuesta.user.id)
  )]

  return sendMulticastNotification({
    title: convocatoria.sortida ? settings.sortidaStatus.titleYes : settings.sortidaStatus.titleNo,
    body: applyTemplate(
      convocatoria.sortida ? settings.sortidaStatus.bodyYes : settings.sortidaStatus.bodyNo,
      {
        title: convocatoria.title,
        type: convocatoria.convoType?.name || '',
        date: formatDateForText(convocatoria.date),
      }
    ),
    link: settings.sortidaStatus.link,
    data: {
      kind: 'sortida-status',
      convocatoriaId: convocatoria.id,
      sortida: convocatoria.sortida,
      typeName: convocatoria.convoType?.name || '',
    },
    targetScope,
    senderUserId,
    userIds: targetUserIds,
  })
}

async function sendConvocatoriaSortidaStatus(authUser, convoId) {
  await ensureAdmin(authUser)
  const convocatoria = await getConvocatoriaWithContext(convoId)
  convocatoria.sortida = shouldMarkSortida(
    convocatoria.convoType,
    (convocatoria.respostas || []).filter((respuesta) => respuesta.response && respuesta.user?.isActive)
  )

  await database.convocatoria.update({
    where: { id: convocatoria.id },
    data: { sortida: convocatoria.sortida },
  })

  return sendConvocatoriaSortidaStatusInternal(
    convocatoria,
    authUser.userId,
    `manual-sortida-status:${convocatoria.id}:${Date.now()}`
  )
}

async function sendPendingResponsesReminder(authUser, options = {}) {
  if (authUser) {
    await ensureAdmin(authUser)
  }

  const settings = readNotificationSettings()
  const now = options.referenceDate ? new Date(options.referenceDate) : new Date()
  const useLeadWindow = options.useLeadWindow ?? !authUser
  const leadEndDate = new Date(now)
  leadEndDate.setDate(leadEndDate.getDate() + (settings.responseRequest.pendingLeadDays || 0))
  leadEndDate.setHours(leadEndDate.getHours() + (settings.responseRequest.pendingLeadHours || 0))

  const dateFilter = useLeadWindow
    ? {
      gte: startOfDay(now),
      lte: leadEndDate,
    }
    : {
      gte: startOfDay(now),
    }

  const upcomingConvocatorias = await database.convocatoria.findMany({
    where: {
      isActive: true,
      date: {
        ...dateFilter,
      },
    },
    include: {
      convoType: true,
      respostas: true,
    },
    orderBy: {
      date: 'asc',
    },
  })

  const recipients = await getMissingResponseUsersForConvocatorias(upcomingConvocatorias)

  if (recipients.length === 0) {
    return {
      targetedUsers: 0,
      notifications: [],
    }
  }

  const groups = new Map()
  recipients.forEach((recipient) => {
    if (!groups.has(recipient.pendingCount)) {
      groups.set(recipient.pendingCount, [])
    }
    groups.get(recipient.pendingCount).push(recipient.userId)
  })

  const notifications = []
  for (const [pendingCount, userIds] of groups.entries()) {
    const targetScope = options.scheduled
      ? `scheduled-pending-responses:${getDateKey(now)}:count:${pendingCount}`
      : `manual-pending-responses:${Date.now()}:count:${pendingCount}`

    if (options.skipIfAlreadySent && await hasNotificationLogForScope(targetScope, now)) {
      continue
    }

    const notification = await sendMulticastNotification({
      title: settings.responseRequest.pendingTitle,
      body: applyTemplate(settings.responseRequest.pendingBody, { count: pendingCount }),
      link: settings.responseRequest.link,
      data: {
        kind: 'pending-responses',
        count: pendingCount,
      },
      targetScope,
      senderUserId: authUser?.userId ?? null,
      userIds,
    })
    notifications.push(notification)
  }

  return {
    targetedUsers: recipients.length,
    notifications,
  }
}

async function sendWeeklyResponseDigest(authUser, referenceDate = new Date(), options = {}) {
  if (authUser) {
    await ensureAdmin(authUser)
  }

  const settings = readNotificationSettings()
  if (!settings.weeklyRequest.enabled) {
    return { skipped: true, reason: 'weekly-digest-disabled' }
  }

  const { start, end } = getNextWeekRange(referenceDate)
  const weeklyConvocatorias = await database.convocatoria.findMany({
    where: {
      isActive: true,
      date: {
        gte: start,
        lt: end,
      },
    },
    include: {
      convoType: true,
      respostas: true,
    },
    orderBy: {
      date: 'asc',
    },
  })

  const filteredConvocatorias = weeklyConvocatorias.filter((convocatoria) => isWeeklyType(convocatoria.convoType?.name, settings))

  if (filteredConvocatorias.length === 0) {
    return { skipped: true, reason: 'no-weekly-convos' }
  }

  const targetScope = `scheduled-weekly-response-digest:${getWeekKey(referenceDate)}`
  if (options.skipIfAlreadySent && await hasNotificationLogForScope(targetScope, referenceDate)) {
    return { skipped: true, reason: 'already-sent', targetScope }
  }

  const recipients = await getMissingResponseUsersForConvocatorias(filteredConvocatorias)

  const notification = await sendMulticastNotification({
    title: settings.weeklyRequest.title,
    body: settings.weeklyRequest.body,
    link: settings.weeklyRequest.link,
    data: {
      kind: 'weekly-response-digest',
      count: filteredConvocatorias.length,
      weekStart: start.toISOString(),
    },
    targetScope,
    senderUserId: authUser?.userId ?? null,
    userIds: recipients.map((recipient) => recipient.userId),
  })

  return {
    targetedUsers: recipients.length,
    convocatoriaCount: filteredConvocatorias.length,
    notification,
  }
}

async function sendTomorrowSortidaNotifications(authUser, referenceDate = new Date(), options = {}) {
  if (authUser) {
    await ensureAdmin(authUser)
  }

  const settings = readNotificationSettings()
  if (!settings.sortidaStatus.enabled) {
    return { skipped: true, reason: 'sortida-disabled' }
  }

  const daysBefore = Number(settings.sortidaStatus.confirmDaysBefore || 1)
  const { start, end } = getDateRangeByDaysAhead(referenceDate, daysBefore)
  const targetConvocatorias = await database.convocatoria.findMany({
    where: {
      isActive: true,
      date: {
        gte: start,
        lt: end,
      },
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
        include: {
          user: {
            include: {
              roles: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  })

  const notifications = []
  for (const convocatoria of targetConvocatorias) {
    if (!isTypeListed(convocatoria.convoType?.name, settings.typeGroups.sortidaTypeNames)) {
      continue
    }

    const nextSortida = shouldMarkSortida(convocatoria.convoType, convocatoria.respostas || [])
    if (convocatoria.sortida !== nextSortida) {
      await database.convocatoria.update({
        where: { id: convocatoria.id },
        data: { sortida: nextSortida },
      })
      convocatoria.sortida = nextSortida
    }

    const targetScope = `scheduled-sortida-status:${getDateKey(start)}:${convocatoria.id}`
    if (options.skipIfAlreadySent && await hasNotificationLogForScope(targetScope, referenceDate)) {
      continue
    }

    const notification = await sendConvocatoriaSortidaStatusInternal(
      convocatoria,
      authUser?.userId ?? null,
      targetScope
    )
    notifications.push(notification)
  }

  return {
    notificationCount: notifications.length,
    notifications,
  }
}

async function runDailyNotificationAutomation(authUser, referenceDate = new Date()) {
  if (authUser) {
    await ensureAdmin(authUser)
  }

  await ensureConfiguredConvoTypes()
  await updateSortidaForTomorrow(referenceDate)

  const settings = readNotificationSettings()

  const canRunTimedTasks = authUser
    ? true
    : referenceDate.getHours() === settings.schedule.dailyRunHour
      && referenceDate.getMinutes() === settings.schedule.dailyRunMinute

  let pendingSummary = { skipped: true, reason: 'outside-scheduled-time' }
  if (canRunTimedTasks) {
    pendingSummary = await sendPendingResponsesReminder(authUser, {
      referenceDate,
      scheduled: !authUser,
      skipIfAlreadySent: !authUser,
      useLeadWindow: true,
    })
  }

  let sortidaSummary = { skipped: true, reason: 'outside-scheduled-time' }
  if (canRunTimedTasks) {
    sortidaSummary = await sendTomorrowSortidaNotifications(authUser, referenceDate, {
      skipIfAlreadySent: true,
    })
  }

  let weeklySummary = { skipped: true, reason: 'not-weekly-day' }

  if (canRunTimedTasks && referenceDate.getDay() === settings.schedule.weeklyRequestWeekday) {
    weeklySummary = await sendWeeklyResponseDigest(authUser, referenceDate, {
      skipIfAlreadySent: true,
    })
  }

  return {
    ranAt: new Date(referenceDate),
    pendingSummary,
    sortidaSummary,
    weeklySummary,
  }
}

async function getNotificationLogs(authUser, query) {
  await ensureAdmin(authUser)
  const dto = buildNotificationLogsQueryDto(query)

  const logs = await database.notificationLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: dto.limit,
  })

  return logs.map(mapNotificationLogToDto)
}

module.exports = {
  createServiceError,
  deactivateDeviceToken,
  ensureConfiguredConvoTypes,
  getAllDeviceTokens,
  getCurrentUserDeviceTokens,
  getNotificationConfig,
  getNotificationLogs,
  handleConvocatoriaCreated,
  registerDeviceToken,
  runDailyNotificationAutomation,
  sendBroadcastNotification,
  sendConvocatoriaResponseRequest,
  sendConvocatoriaSortidaStatus,
  sendPendingResponsesReminder,
  sendTomorrowSortidaNotifications,
  sendWeeklyResponseDigest,
  updateNotificationConfig,
}