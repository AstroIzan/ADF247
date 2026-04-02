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

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

function summarizeTaskResult(result) {
  if (!result || typeof result !== 'object') {
    return { skipped: false }
  }

  return {
    skipped: Boolean(result.skipped),
    reason: result.reason || null,
    notificationCount: result.notificationCount ?? result.notifications?.length ?? null,
    targetedUsers: result.targetedUsers ?? null,
  }
}

function generateCorrelationId(prefix = 'run') {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now()}-${random}`
}

async function createAutomationRun({ trigger, source, actorUserId }) {
  return database.notificationAutomationRun.create({
    data: {
      trigger,
      source,
      actorUserId: actorUserId || null,
      status: 'running',
      startedAt: new Date(),
      correlationId: generateCorrelationId(trigger),
    },
  })
}

async function logAdminAuditEvent({ actorUserId, trigger, source, message }) {
  const now = new Date()
  return database.notificationAutomationRun.create({
    data: {
      trigger,
      source,
      actorUserId: actorUserId || null,
      status: 'success',
      startedAt: now,
      finishedAt: now,
      durationMs: 0,
      errorMessage: message || null,
      correlationId: generateCorrelationId(trigger),
    },
  })
}

async function finishAutomationRun(runId, { status, startedAt, errorMessage }) {
  const finishedAt = new Date()
  await database.notificationAutomationRun.update({
    where: { id: runId },
    data: {
      status,
      finishedAt,
      durationMs: Math.max(0, finishedAt.getTime() - new Date(startedAt).getTime()),
      errorMessage: errorMessage || null,
    },
  })
}

async function executeAutomationTask(runId, taskKey, handler) {
  const taskRun = await database.notificationAutomationTaskRun.create({
    data: {
      runId,
      taskKey,
      status: 'running',
      startedAt: new Date(),
    },
  })

  try {
    const result = await handler()
    const finishedAt = new Date()
    await database.notificationAutomationTaskRun.update({
      where: { id: taskRun.id },
      data: {
        status: result?.skipped ? 'skipped' : 'success',
        finishedAt,
        durationMs: Math.max(0, finishedAt.getTime() - new Date(taskRun.startedAt).getTime()),
        detailsJson: safeJsonStringify(summarizeTaskResult(result)),
      },
    })

    return { ok: true, result }
  } catch (error) {
    const finishedAt = new Date()
    await database.notificationAutomationTaskRun.update({
      where: { id: taskRun.id },
      data: {
        status: 'failed',
        finishedAt,
        durationMs: Math.max(0, finishedAt.getTime() - new Date(taskRun.startedAt).getTime()),
        errorMessage: error.message,
      },
    })

    return { ok: false, error }
  }
}

function canViewAutomationRuns(authUser, settings) {
  return Array.isArray(settings?.automation?.viewerNCarnets)
    && settings.automation.viewerNCarnets.includes(authUser?.nCarnet)
}

async function ensureAutomationViewer(authUser) {
  try {
    await ensureAdmin(authUser)
    return
  } catch {
    const settings = readNotificationSettings()
    if (canViewAutomationRuns(authUser, settings)) {
      return
    }
    throw createNotificationsDtoError('No tienes permisos para consultar el orquestador.', 403)
  }
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

function isGuardiaOrPviType(typeName, settings) {
  const normalized = normalizeTypeName(typeName)
  const guardia = normalizeTypeName(settings?.typeGroups?.guardiaSourceTypeName)
  const guardiaPvi = normalizeTypeName(settings?.typeGroups?.guardiaPviTypeName)
  return normalized === guardia || normalized === guardiaPvi
}

function getWeekRangeForDate(referenceDate = new Date()) {
  const start = startOfDay(referenceDate)
  const day = start.getDay()
  const daysSinceMonday = (day + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)

  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start, end }
}

function formatDateForText(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
}

function formatTimeForText(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) {
    return '--:--'
  }

  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function buildConvocatoriaNotificationTitle(convocatoria) {
  const title = String(convocatoria?.title || '').trim() || 'Sense títol'
  return `**Convocatoria** ${title}`
}

function buildConvocatoriaNotificationBody(convocatoria) {
  const horaInici = formatTimeForText(convocatoria?.startTime)
  const ubicacio = String(convocatoria?.ubiSortida || convocatoria?.convoType?.defaultLocation || '-').trim() || '-'
  const responsableCarnet = String(convocatoria?.user?.nCarnet || '-').trim() || '-'
  const responsableNom = `${convocatoria?.user?.name || ''} ${convocatoria?.user?.lastName || ''}`.trim() || '-'

  return `Demà a les ${horaInici} a ${ubicacio}\nResponsable ${responsableCarnet} ${responsableNom}`
}

function buildConvocatoriaTemplateContext(convocatoria) {
  const horaInici = formatTimeForText(convocatoria?.startTime)
  const ubicacio = String(convocatoria?.ubiSortida || convocatoria?.convoType?.defaultLocation || '-').trim() || '-'
  const responsableCarnet = String(convocatoria?.user?.nCarnet || '-').trim() || '-'
  const responsableNom = `${convocatoria?.user?.name || ''} ${convocatoria?.user?.lastName || ''}`.trim() || '-'

  return {
    title: convocatoria?.title || '',
    type: convocatoria?.convoType?.name || '',
    date: formatDateForText(convocatoria?.date),
    horaInici,
    ubicació: ubicacio,
    ubicacio,
    'nºCarnet': responsableCarnet,
    nCarnet: responsableCarnet,
    'nom + cognom': responsableNom,
    nomCognom: responsableNom,
  }
}

function applyTemplate(template, context) {
  return String(template || '').replace(/\{([^}]+)\}/g, (_match, rawKey) => {
    const key = String(rawKey || '').trim()
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

function getSortidaTriggerAt(convocatoriaDate, settings) {
  const triggerAt = startOfDay(convocatoriaDate)
  triggerAt.setDate(triggerAt.getDate() - Number(settings.sortidaStatus.confirmDaysBefore || 0))
  triggerAt.setHours(
    Number(settings.sortidaStatus.confirmHour || 0),
    Number(settings.sortidaStatus.confirmMinute || 0),
    0,
    0
  )
  return triggerAt
}

function shouldSendSortidaStatusForConvocatoria(convocatoria, settings, referenceDate = new Date()) {
  if (!settings.sortidaStatus.enabled) {
    return { shouldSend: false, reason: 'sortida-disabled' }
  }

  if (!isTypeListed(convocatoria.convoType?.name, settings.typeGroups.sortidaTypeNames)) {
    return { shouldSend: false, reason: 'type-not-configured' }
  }

  const triggerAt = getSortidaTriggerAt(convocatoria.date, settings)
  if (referenceDate < triggerAt) {
    return { shouldSend: false, reason: 'before-sortida-trigger', triggerAt }
  }

  return { shouldSend: true, triggerAt }
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
      user: {
        select: {
          nCarnet: true,
          name: true,
          lastName: true,
        },
      },
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
  const previousSettings = readNotificationSettings()
  const dto = buildNotificationConfigUpdateDto(payload)
  const settings = updateNotificationSettings(dto)
  await ensureConfiguredConvoTypes()

  const changedKeys = Object.keys(dto || {})
  await logAdminAuditEvent({
    actorUserId: authUser?.userId,
    trigger: 'config-update',
    source: 'api',
    message: `Canvis en configuracio de notificacions: ${changedKeys.join(', ') || 'none'}`,
  })

  // Keep lightweight in-service traceability for critical changes.
  if (safeJsonStringify(previousSettings) !== safeJsonStringify(settings)) {
    console.log(`[notifications.service] Config actualitzada per ${authUser?.nCarnet || 'unknown'} (${changedKeys.join(', ') || 'none'})`)
  }

  return settings
}

async function sendBroadcastNotification(authUser, payload) {
  await ensureAdmin(authUser)
  const dto = buildSendBroadcastDto(payload)

  await logAdminAuditEvent({
    actorUserId: authUser?.userId,
    trigger: 'manual-broadcast',
    source: 'api',
    message: `Broadcast manual: ${dto.title}`,
  })

  return sendMulticastNotification({
    title: dto.title,
    body: dto.body,
    link: dto.link,
    data: dto.data,
    targetScope: `manual-broadcast:${Date.now()}`,
    senderUserId: authUser.userId,
  })
}

async function sendAutoAvailableNotifications({ convocatoria, userIds }) {
  const targetUserIds = Array.isArray(userIds)
    ? [...new Set(userIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
    : []

  if (targetUserIds.length === 0) {
    return { skipped: true, reason: 'no-target-users' }
  }

  const settings = readNotificationSettings()
  if (!settings?.availabilityMatching?.notifyOnAutoAvailableResponse) {
    return { skipped: true, reason: 'notifications-disabled' }
  }

  return sendMulticastNotification({
    title: 'Disponibilitat aplicada automàticament',
    body: applyTemplate(
      'S\'ha marcat automàticament la teva disponibilitat com a disponible per a {title} ({date}).',
      {
        title: convocatoria?.title || 'convocatòria',
        date: formatDateForText(convocatoria?.date),
      }
    ),
    link: '/availability',
    data: {
      kind: 'availability-auto-available',
      convocatoriaId: convocatoria?.id || '',
    },
    targetScope: `auto-availability-available:${convocatoria?.id || 'unknown'}:${Date.now()}`,
    senderUserId: null,
    userIds: targetUserIds,
  })
}

async function sendConvocatoriaResponseRequestInternal(convocatoria, senderUserId, targetScope, options = {}) {
  const settings = readNotificationSettings()
  const recipients = Array.isArray(options.userIds)
    ? options.userIds.map((userId) => ({ userId }))
    : await getMissingResponseUsersForConvocatorias([convocatoria])
  const context = buildConvocatoriaTemplateContext(convocatoria)
  const titleTemplate = options.titleTemplate || settings.responseRequest.creationTitle
  const bodyTemplate = options.bodyTemplate || settings.responseRequest.creationBody
  const dataKind = options.dataKind || 'response-request'

  return sendMulticastNotification({
    title: applyTemplate(titleTemplate, context),
    body: applyTemplate(bodyTemplate, context),
    link: settings.responseRequest.link,
    data: {
      kind: dataKind,
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

  await logAdminAuditEvent({
    actorUserId: authUser?.userId,
    trigger: 'manual-response-request',
    source: 'api',
    message: `Enviament manual de resposta per convocatoria ${convocatoria.id}`,
  })

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
  const typeName = convocatoria.convoType?.name || ''
  const isWeekly = isWeeklyType(typeName, settings)
  const isFire = normalizeTypeName(typeName) === 'incendi'

  if (!settings.responseRequest.sendOnCreationForNonWeekly) {
    return { skipped: true, reason: 'creation-disabled' }
  }

  const notifications = []

  if (isFire || isWeekly) {
    const baseNotification = await sendConvocatoriaResponseRequestInternal(
      convocatoria,
      null,
      `auto-response-request:${convocatoria.id}`,
      {
        titleTemplate: settings.responseRequest.creationTitle,
        bodyTemplate: settings.responseRequest.creationBody,
        dataKind: 'new-convocatoria',
      }
    )
    notifications.push(baseNotification)
  }

  if (isFire) {
    const activeUsers = await database.user.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    const fireNotification = await sendConvocatoriaResponseRequestInternal(
      convocatoria,
      null,
      `auto-fire-created:${convocatoria.id}`,
      {
        titleTemplate: settings.responseRequest.fireTitle,
        bodyTemplate: settings.responseRequest.fireBody,
        dataKind: 'incendi-created',
        userIds: activeUsers.map((u) => u.id),
      }
    )
    notifications.push(fireNotification)
  }

  if (isWeekly) {
    const { start, end } = getWeekRangeForDate(convocatoria.date)
    const weeklyCount = await database.convocatoria.count({
      where: {
        isActive: true,
        date: {
          gte: start,
          lt: end,
        },
        convoType: {
          name: {
            in: settings.typeGroups.weeklyTypeNames,
          },
        },
      },
    })

    const activeUsers = await database.user.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    const summaryNotification = await sendMulticastNotification({
      title: settings.responseRequest.weeklyCreatedTitle,
      body: applyTemplate(settings.responseRequest.weeklyCreatedBody, { count: weeklyCount, title: convocatoria.title || '' }),
      link: settings.responseRequest.link,
      data: {
        kind: 'weekly-created-summary',
        convocatoriaId: convocatoria.id,
        weeklyCount,
      },
      targetScope: `auto-weekly-created:${convocatoria.id}`,
      senderUserId: null,
      userIds: activeUsers.map((u) => u.id),
    })
    notifications.push(summaryNotification)
  }

  if (notifications.length === 0) {
    return { skipped: true, reason: 'creation-type-not-configured' }
  }

  return {
    skipped: false,
    notificationCount: notifications.length,
    notifications,
  }
}

async function sendConvocatoriaSortidaStatusInternal(convocatoria, senderUserId, targetScope) {
  const settings = readNotificationSettings()
  const context = buildConvocatoriaTemplateContext(convocatoria)
  const isGuardiaType = isGuardiaOrPviType(convocatoria.convoType?.name, settings)

  const titleTemplate = convocatoria.sortida
    ? settings.sortidaStatus.titleYes
    : isGuardiaType
      ? (settings.sortidaStatus.titleReten || settings.sortidaStatus.titleNo)
      : (settings.sortidaStatus.titleCancelled || settings.sortidaStatus.titleNo)

  const bodyTemplate = convocatoria.sortida
    ? settings.sortidaStatus.bodyYes
    : isGuardiaType
      ? (settings.sortidaStatus.bodyReten || settings.sortidaStatus.bodyNo)
      : (settings.sortidaStatus.bodyCancelled || settings.sortidaStatus.bodyNo)

  const dataKind = convocatoria.sortida
    ? 'sortida-status-confirmed'
    : isGuardiaType
      ? 'sortida-status-reten'
      : 'sortida-status-cancelled'

  const targetUserIds = [...new Set(
    (convocatoria.respostas || [])
      .filter((respuesta) => respuesta.response && respuesta.user?.isActive)
      .map((respuesta) => respuesta.user.id)
  )]

  return sendMulticastNotification({
    title: applyTemplate(titleTemplate, context),
    body: applyTemplate(bodyTemplate, context),
    link: settings.sortidaStatus.link,
    data: {
      kind: dataKind,
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

  await logAdminAuditEvent({
    actorUserId: authUser?.userId,
    trigger: 'manual-sortida-status',
    source: 'api',
    message: `Confirmacio manual de sortida per convocatoria ${convocatoria.id}`,
  })

  return sendConvocatoriaSortidaStatusInternal(
    convocatoria,
    authUser.userId,
    `manual-sortida-status:${convocatoria.id}:${Date.now()}`
  )
}

async function runConvocatoriaNotificationAutomation(authUser, convoId, referenceDate = new Date()) {
  await ensureAdmin(authUser)

  const settings = readNotificationSettings()
  const convocatoria = await getConvocatoriaWithContext(convoId)

  const responseSummary = await sendConvocatoriaResponseRequestInternal(
    convocatoria,
    authUser.userId,
    `manual-convo-automation-response:${convocatoria.id}:${Date.now()}`
  )

  const sortidaDecision = shouldSendSortidaStatusForConvocatoria(convocatoria, settings, referenceDate)

  let sortidaSummary = {
    skipped: true,
    reason: sortidaDecision.reason || 'not-applicable',
    triggerAt: sortidaDecision.triggerAt || null,
  }

  if (sortidaDecision.shouldSend) {
    convocatoria.sortida = shouldMarkSortida(
      convocatoria.convoType,
      (convocatoria.respostas || []).filter((respuesta) => respuesta.response && respuesta.user?.isActive)
    )

    await database.convocatoria.update({
      where: { id: convocatoria.id },
      data: { sortida: convocatoria.sortida },
    })

    const notification = await sendConvocatoriaSortidaStatusInternal(
      convocatoria,
      authUser.userId,
      `manual-convo-automation-sortida:${convocatoria.id}:${Date.now()}`
    )

    sortidaSummary = {
      skipped: false,
      triggerAt: sortidaDecision.triggerAt || null,
      notification,
    }
  }

  return {
    convoId: convocatoria.id,
    ranAt: new Date(referenceDate),
    responseSummary,
    sortidaSummary,
  }
}

async function sendPendingResponsesReminder(authUser, options = {}) {
  if (authUser) {
    await ensureAdmin(authUser)

    await logAdminAuditEvent({
      actorUserId: authUser?.userId,
      trigger: 'manual-pending-responses',
      source: 'api',
      message: 'Execucio manual del recordatori de respostes pendents',
    })
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

  const filteredUpcoming = Array.isArray(options.convoTypeFilter) && options.convoTypeFilter.length > 0
    ? upcomingConvocatorias.filter((c) => isTypeListed(c.convoType?.name, options.convoTypeFilter))
    : upcomingConvocatorias

  const recipients = await getMissingResponseUsersForConvocatorias(filteredUpcoming)

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

    await logAdminAuditEvent({
      actorUserId: authUser?.userId,
      trigger: 'manual-weekly-digest',
      source: 'api',
      message: 'Execucio manual del digest setmanal',
    })
  }

  const settings = readNotificationSettings()
  if (!settings.weeklyRequest.enabled) {
    return { skipped: true, reason: 'weekly-digest-disabled' }
  }

  const useCurrentWeek = options.weekScope === 'current-week'
  const { start, end } = useCurrentWeek ? getWeekRangeForDate(referenceDate) : getNextWeekRange(referenceDate)
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

  const filteredConvocatorias = Array.isArray(options.convoTypeFilter) && options.convoTypeFilter.length > 0
    ? weeklyConvocatorias.filter((convocatoria) => isTypeListed(convocatoria.convoType?.name, options.convoTypeFilter))
    : weeklyConvocatorias.filter((convocatoria) => isWeeklyType(convocatoria.convoType?.name, settings))

  if (filteredConvocatorias.length === 0) {
    return { skipped: true, reason: 'no-weekly-convos' }
  }

  const weekKey = start.toISOString().slice(0, 10)
  const targetScope = `scheduled-weekly-response-digest:${weekKey}`
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

    await logAdminAuditEvent({
      actorUserId: authUser?.userId,
      trigger: 'manual-tomorrow-sortida',
      source: 'api',
      message: 'Execucio manual de notificacions de sortida de dema',
    })
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

  const sortidaTypeList = Array.isArray(options.convoTypeFilter) && options.convoTypeFilter.length > 0
    ? options.convoTypeFilter
    : settings.typeGroups.sortidaTypeNames

  const notifications = []
  for (const convocatoria of targetConvocatorias) {
    if (sortidaTypeList.length > 0 && !isTypeListed(convocatoria.convoType?.name, sortidaTypeList)) {
      continue
    }

    const isGuardiaType = isGuardiaOrPviType(convocatoria.convoType?.name, settings)
    if (options.guardiaMode === 'only-guardia' && !isGuardiaType) {
      continue
    }
    if (options.guardiaMode === 'exclude-guardia' && isGuardiaType) {
      continue
    }

    const nextSortida = shouldMarkSortida(convocatoria.convoType, convocatoria.respostas || [])

    if (typeof options.requiredSortida === 'boolean' && nextSortida !== options.requiredSortida) {
      continue
    }

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

  const run = await createAutomationRun({
    trigger: authUser ? 'manual' : 'scheduled',
    source: authUser ? 'api' : 'scheduler',
    actorUserId: authUser?.userId || null,
  })

  await ensureConfiguredConvoTypes()
  await updateSortidaForTomorrow(referenceDate)

  const settings = readNotificationSettings()

  const canRunTimedTasks = authUser
    ? true
    : referenceDate.getHours() === settings.schedule.dailyRunHour
      && referenceDate.getMinutes() === settings.schedule.dailyRunMinute

  const configuredTasks = Array.isArray(settings.automation?.tasks) && settings.automation.tasks.length > 0
    ? settings.automation.tasks
    : [
      { taskKey: 'sortida-d1-confirmed', notifyKind: 'sortida-confirmed', enabled: true, schedule: { kind: 'daily' }, convoTypeFilter: [] },
      { taskKey: 'sortida-d1-cancelled', notifyKind: 'sortida-cancelled', enabled: true, schedule: { kind: 'daily' }, convoTypeFilter: [] },
      { taskKey: 'sortida-d1-reten', notifyKind: 'sortida-reten', enabled: true, schedule: { kind: 'daily' }, convoTypeFilter: [] },
      { taskKey: 'weekly-pending-summary', notifyKind: 'weekly-pending', enabled: true, schedule: { kind: 'weekly' }, convoTypeFilter: [] },
    ]

  const taskResults = []

  for (const taskConfig of configuredTasks) {
    if (!taskConfig.enabled) {
      await database.notificationAutomationTaskRun.create({
        data: {
          runId: run.id,
          taskKey: taskConfig.taskKey,
          status: 'skipped',
          startedAt: new Date(),
          finishedAt: new Date(),
          durationMs: 0,
          detailsJson: safeJsonStringify({ skipped: true, reason: 'disabled' }),
        },
      })
      taskResults.push({ ok: true, result: { skipped: true, reason: 'disabled' } })
      continue
    }

    const notifyKind = taskConfig.notifyKind || taskConfig.taskKey
    const convoTypeFilter = Array.isArray(taskConfig.convoTypeFilter) && taskConfig.convoTypeFilter.length > 0
      ? taskConfig.convoTypeFilter
      : undefined

    const taskResult = await executeAutomationTask(run.id, taskConfig.taskKey, async () => {
      if (notifyKind === 'weekly-digest' || notifyKind === 'weekly-pending') {
        if (!canRunTimedTasks || referenceDate.getDay() !== settings.schedule.weeklyRequestWeekday) {
          return { skipped: true, reason: 'not-weekly-day' }
        }
        return sendWeeklyResponseDigest(authUser, referenceDate, {
          skipIfAlreadySent: !authUser,
          convoTypeFilter,
          weekScope: notifyKind === 'weekly-pending' ? 'current-week' : 'next-week',
        })
      }

      if (!canRunTimedTasks) {
        return { skipped: true, reason: 'outside-scheduled-time' }
      }

      if (notifyKind === 'sortida-status' || notifyKind === 'sortida-confirmed') {
        return sendTomorrowSortidaNotifications(authUser, referenceDate, {
          skipIfAlreadySent: !authUser,
          convoTypeFilter,
          requiredSortida: true,
        })
      }

      if (notifyKind === 'sortida-cancelled') {
        return sendTomorrowSortidaNotifications(authUser, referenceDate, {
          skipIfAlreadySent: !authUser,
          convoTypeFilter,
          requiredSortida: false,
          guardiaMode: 'exclude-guardia',
        })
      }

      if (notifyKind === 'sortida-reten') {
        return sendTomorrowSortidaNotifications(authUser, referenceDate, {
          skipIfAlreadySent: !authUser,
          convoTypeFilter,
          requiredSortida: false,
          guardiaMode: 'only-guardia',
        })
      }

      return sendPendingResponsesReminder(authUser, {
        referenceDate,
        scheduled: !authUser,
        skipIfAlreadySent: !authUser,
        useLeadWindow: true,
        convoTypeFilter,
      })
    })

    taskResults.push(taskResult)
  }

  const taskFailures = taskResults.filter((task) => !task.ok)
  const taskSuccesses = taskResults.filter((task) => task.ok)

  const runStatus = taskFailures.length === 0
    ? 'success'
    : taskSuccesses.length === 0
      ? 'failed'
      : 'partial'

  await finishAutomationRun(run.id, {
    status: runStatus,
    startedAt: run.startedAt,
    errorMessage: taskFailures.map((task) => task.error?.message || 'error').join(' | ') || null,
  })

  if (runStatus !== 'success') {
    const currentSettings = readNotificationSettings()
    if (currentSettings?.automation?.monitoring?.enabled && currentSettings?.automation?.monitoring?.alertOnTaskFailure) {
      const failedMessages = taskFailures.map((task) => task.error?.message || 'unknown').join('; ')
      await sendAutomationAlertPush({
        alertType: 'task-failure',
        message: `Error en automatisme (${runStatus}): ${failedMessages}`,
        runId: run.id,
        settings: currentSettings,
      }).catch((err) => {
        console.error('[notifications.service] Error al enviar alerta push de fallada:', err.message)
      })
    }
  }

  const resultMap = {}
  configuredTasks.forEach((taskConfig, index) => {
    const res = taskResults[index]
    resultMap[taskConfig.taskKey] = res?.ok ? res.result : { skipped: true, reason: res?.error?.message }
  })

  return {
    runId: run.id,
    ranAt: new Date(referenceDate),
    status: runStatus,
    pendingSummary: resultMap['pending-responses'] || resultMap['weekly-pending-summary'],
    sortidaSummary: resultMap['sortida-status'] || resultMap['sortida-d1-confirmed'],
    weeklySummary: resultMap['weekly-digest'] || resultMap['weekly-pending-summary'],
    taskSummaries: resultMap,
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

async function getAutomationRuns(authUser, query = {}) {
  await ensureAutomationViewer(authUser)

  const limit = Number.isInteger(Number(query.limit))
    ? Math.min(Math.max(Number(query.limit), 1), 200)
    : 50

  const runs = await database.notificationAutomationRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actorUser: {
        select: { id: true, nCarnet: true, name: true, lastName: true },
      },
      tasks: {
        orderBy: { id: 'asc' },
      },
    },
  })

  return runs.map((run) => ({
    id: run.id,
    correlationId: run.correlationId,
    trigger: run.trigger,
    source: run.source,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: run.durationMs,
    errorMessage: run.errorMessage,
    actor: run.actorUser,
    tasks: run.tasks.map((task) => ({
      id: task.id,
      taskKey: task.taskKey,
      status: task.status,
      startedAt: task.startedAt,
      finishedAt: task.finishedAt,
      durationMs: task.durationMs,
      errorMessage: task.errorMessage,
    })),
  }))
}

async function getAutomationRunById(authUser, runId) {
  await ensureAutomationViewer(authUser)

  const parsedRunId = Number.parseInt(String(runId), 10)
  if (!Number.isInteger(parsedRunId) || parsedRunId < 1) {
    throw createNotificationsDtoError('El id de run no es valido.')
  }

  const run = await database.notificationAutomationRun.findUnique({
    where: { id: parsedRunId },
    include: {
      actorUser: {
        select: { id: true, nCarnet: true, name: true, lastName: true },
      },
      tasks: {
        orderBy: { id: 'asc' },
      },
    },
  })

  if (!run) {
    throw createNotificationsDtoError('No se ha encontrado la corrida solicitada.', 404)
  }

  return {
    id: run.id,
    correlationId: run.correlationId,
    trigger: run.trigger,
    source: run.source,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: run.durationMs,
    errorMessage: run.errorMessage,
    actor: run.actorUser,
    tasks: run.tasks.map((task) => ({
      id: task.id,
      taskKey: task.taskKey,
      status: task.status,
      startedAt: task.startedAt,
      finishedAt: task.finishedAt,
      durationMs: task.durationMs,
      errorMessage: task.errorMessage,
      details: (() => {
        if (!task.detailsJson) {
          return null
        }

        try {
          return JSON.parse(task.detailsJson)
        } catch {
          return null
        }
      })(),
    })),
  }
}

async function getUserIdsByNCarnets(nCarnets) {
  if (!Array.isArray(nCarnets) || nCarnets.length === 0) {
    return []
  }

  const users = await database.user.findMany({
    where: { nCarnet: { in: nCarnets }, isActive: true },
    select: { id: true },
  })

  return users.map((user) => user.id)
}

async function sendAutomationAlertPush({ alertType, message, runId, settings }) {
  const monitoring = settings?.automation?.monitoring
  if (!monitoring?.enabled) {
    return
  }

  const recipients = monitoring.alertRecipientNCarnets || []
  if (recipients.length === 0) {
    return
  }

  const userIds = await getUserIdsByNCarnets(recipients)
  if (userIds.length === 0) {
    return
  }

  const titleMap = {
    'missed-run': 'Correguda omesa del automatisme',
    'task-failure': 'Error en tasca del automatisme',
  }
  const title = titleMap[alertType] || 'Alerta del automatisme'

  await sendMulticastNotification({
    title,
    body: message || 'Hi ha hagut un problema amb l\'automatisme de notificacions.',
    link: '/settings',
    data: { kind: 'automation-alert', alertType, runId: String(runId || '') },
    targetScope: `automation-alert:${alertType}:${runId || Date.now()}`,
    senderUserId: null,
    userIds,
  }).catch((err) => {
    console.error('[notifications.service] Error al enviar alerta push de automatisme:', err.message)
  })
}

async function detectAndRecordMissedRun(referenceDate = new Date()) {
  const settings = readNotificationSettings()
  const monitoring = settings?.automation?.monitoring
  if (!monitoring?.enabled || !monitoring?.alertOnMissedRun) {
    return null
  }

  const now = new Date(referenceDate)
  const expectedHour = settings.schedule.dailyRunHour
  const expectedMinute = settings.schedule.dailyRunMinute

  const expectedRunTime = new Date(now)
  expectedRunTime.setHours(expectedHour, expectedMinute, 0, 0)

  // Only check if we are past the expected run time by at least 30 minutes
  const gracePeriodMs = 30 * 60 * 1000
  if (now.getTime() < expectedRunTime.getTime() + gracePeriodMs) {
    return null
  }

  const dayStart = startOfDay(now)
  const dayEnd = endOfDay(now)

  const existingRun = await database.notificationAutomationRun.findFirst({
    where: {
      trigger: 'scheduled',
      startedAt: { gte: dayStart, lt: dayEnd },
      status: { in: ['success', 'partial', 'running'] },
    },
    select: { id: true },
  })

  if (existingRun) {
    return null
  }

  const existingMissedRun = await database.notificationAutomationRun.findFirst({
    where: {
      trigger: 'missed-run',
      startedAt: { gte: dayStart, lt: dayEnd },
    },
    select: { id: true },
  })

  if (existingMissedRun) {
    return null
  }

  const pad = (n) => String(n).padStart(2, '0')
  const expectedTimeStr = `${pad(expectedHour)}:${pad(expectedMinute)}`

  const missedRun = await database.notificationAutomationRun.create({
    data: {
      trigger: 'missed-run',
      source: 'scheduler',
      actorUserId: null,
      status: 'failed',
      startedAt: expectedRunTime,
      finishedAt: now,
      durationMs: 0,
      errorMessage: `Correguda omesa: l'automatisme no s'ha executat a les ${expectedTimeStr}.`,
      correlationId: generateCorrelationId('missed-run'),
    },
  })

  await sendAutomationAlertPush({
    alertType: 'missed-run',
    message: `L'automatisme no s'ha executat avui a les ${expectedTimeStr}.`,
    runId: missedRun.id,
    settings,
  })

  console.log(`[notifications.service] Correguda omesa detectada a les ${expectedTimeStr}. Run id: ${missedRun.id}`)
  return missedRun
}

async function runRetentionCleanup() {
  const settings = readNotificationSettings()
  const retentionDays = settings?.automation?.retentionDays ?? 7
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)

  const result = await database.notificationAutomationRun.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })

  if (result.count > 0) {
    console.log(`[notifications.service] Limpieza de histórico: ${result.count} corridas eliminadas (>${retentionDays} dies).`)
  }

  return result.count
}

async function runNotificationAutomationTask(authUser, taskKey, referenceDate = new Date()) {
  await ensureAdmin(authUser)

  const normalizedTaskKey = String(taskKey || '').trim().toLowerCase()
  const settings = readNotificationSettings()
  const taskConfig = settings.automation?.tasks?.find((t) => t.taskKey === normalizedTaskKey)
  const notifyKind = taskConfig?.notifyKind || normalizedTaskKey
  const convoTypeFilter = Array.isArray(taskConfig?.convoTypeFilter) && taskConfig.convoTypeFilter.length > 0
    ? taskConfig.convoTypeFilter
    : undefined

  const run = await createAutomationRun({
    trigger: 'task-manual',
    source: 'api',
    actorUserId: authUser?.userId || null,
  })

  const allowedKinds = ['pending-responses', 'sortida-status', 'weekly-digest', 'sortida-confirmed', 'sortida-cancelled', 'sortida-reten', 'weekly-pending']
  const resolvedKind = allowedKinds.includes(notifyKind) ? notifyKind : null

  if (!resolvedKind) {
    await finishAutomationRun(run.id, {
      status: 'failed',
      startedAt: run.startedAt,
      errorMessage: 'task-key-not-supported',
    })
    throw createNotificationsDtoError('El taskKey indicado no esta soportado.', 400)
  }

  const handlerMap = {
    'pending-responses': () => sendPendingResponsesReminder(authUser, {
      referenceDate,
      scheduled: false,
      skipIfAlreadySent: false,
      useLeadWindow: true,
      convoTypeFilter,
    }),
    'sortida-status': () => sendTomorrowSortidaNotifications(authUser, referenceDate, {
      skipIfAlreadySent: false,
      convoTypeFilter,
      requiredSortida: true,
    }),
    'sortida-confirmed': () => sendTomorrowSortidaNotifications(authUser, referenceDate, {
      skipIfAlreadySent: false,
      convoTypeFilter,
      requiredSortida: true,
    }),
    'sortida-cancelled': () => sendTomorrowSortidaNotifications(authUser, referenceDate, {
      skipIfAlreadySent: false,
      convoTypeFilter,
      requiredSortida: false,
      guardiaMode: 'exclude-guardia',
    }),
    'sortida-reten': () => sendTomorrowSortidaNotifications(authUser, referenceDate, {
      skipIfAlreadySent: false,
      convoTypeFilter,
      requiredSortida: false,
      guardiaMode: 'only-guardia',
    }),
    'weekly-digest': () => sendWeeklyResponseDigest(authUser, referenceDate, {
      skipIfAlreadySent: false,
      convoTypeFilter,
      weekScope: 'next-week',
    }),
    'weekly-pending': () => sendWeeklyResponseDigest(authUser, referenceDate, {
      skipIfAlreadySent: false,
      convoTypeFilter,
      weekScope: 'current-week',
    }),
  }

  const taskResult = await executeAutomationTask(run.id, normalizedTaskKey, handlerMap[resolvedKind])

  await finishAutomationRun(run.id, {
    status: taskResult.ok ? 'success' : 'failed',
    startedAt: run.startedAt,
    errorMessage: taskResult.ok ? null : taskResult.error.message,
  })

  return {
    runId: run.id,
    taskKey: normalizedTaskKey,
    status: taskResult.ok ? 'success' : 'failed',
    result: taskResult.ok ? taskResult.result : null,
  }
}

module.exports = {
  createServiceError,
  deactivateDeviceToken,
  detectAndRecordMissedRun,
  ensureConfiguredConvoTypes,
  getAllDeviceTokens,
  getCurrentUserDeviceTokens,
  getNotificationConfig,
  getNotificationLogs,
  getAutomationRunById,
  getAutomationRuns,
  handleConvocatoriaCreated,
  registerDeviceToken,
  runConvocatoriaNotificationAutomation,
  runDailyNotificationAutomation,
  runRetentionCleanup,
  sendBroadcastNotification,
  sendConvocatoriaResponseRequest,
  sendConvocatoriaSortidaStatus,
  sendAutoAvailableNotifications,
  sendPendingResponsesReminder,
  sendTomorrowSortidaNotifications,
  sendWeeklyResponseDigest,
  runNotificationAutomationTask,
  updateNotificationConfig,
}