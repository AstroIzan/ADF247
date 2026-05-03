const database = require('../../../../database/prisma/prisma')
const {
  buildDeactivateDeviceTokenDto,
  buildNotificationConfigUpdateDto,
  buildNotificationLogsQueryDto,
  buildRegisterDeviceTokenDto,
  buildSendBroadcastDto,
  createNotificationsDtoError,
  mapNotificationLogToDto,
} = require('./notifications.dto')
const {
  readNotificationSettings,
  updateNotificationSettings,
} = require('./notifications.config')
const { getFirebaseMessaging } = require('./notifications.firebase')
const { getPlaAlfaMunicipalitiesStatus } = require('../pla-alfa/pla-alfa.service')
const { updateSortidaForTomorrow } = require('../convos/convos.service')

const GLOBAL_NOTIFICATION_TOPIC = 'adf247-all'
const NOTIFICATION_LOGO_URL = process.env.NOTIFICATION_LOGO_URL || '/icons/notification-icon-512.png'
const NOTIFICATION_BADGE_URL = process.env.NOTIFICATION_BADGE_URL || '/icons/favicon-64.png'

function isProductionEnvironment() {
  const nodeEnv = String(process.env.NODE_ENV || 'development').trim().toLowerCase()
  return nodeEnv === 'production' || nodeEnv === 'pro'
}

function parseNCarnetList(rawValue) {
  if (!rawValue) {
    return []
  }

  return String(rawValue)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

async function resolveAllowedDevNotificationUserIds() {
  if (isProductionEnvironment()) {
    return null
  }

  const envList = parseNCarnetList(process.env.NOTIFICATION_DEV_ALLOWED_NCARNETS)
  const settings = readNotificationSettings()
  const settingsList = Array.isArray(settings?.automation?.developerNCarnets)
    ? settings.automation.developerNCarnets
    : []
  const targetNCarnets = [...new Set([...envList, ...settingsList])]

  if (targetNCarnets.length === 0) {
    return []
  }

  const users = await database.user.findMany({
    where: {
      nCarnet: {
        in: targetNCarnets,
      },
      isActive: true,
    },
    select: {
      id: true,
    },
  })

  return users.map((user) => user.id)
}

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

  const detailKeys = [
    'decision',
    'campaignDate',
    'maxTomorrowAlfaLevel',
    'daysProcessed',
    'daysInCampaign',
    'weekStart',
    'weekEnd',
    'weekHadAlfa2',
    'updatedSortidaCount',
    'createdGuardiaCount',
    'createdPviCount',
    'createdConvocatoriasCount',
  ]

  const details = {}
  for (const key of detailKeys) {
    if (result[key] !== undefined) {
      details[key] = result[key]
    }
  }

  return {
    skipped: Boolean(result.skipped),
    reason: result.reason || null,
    notificationCount: result.notificationCount ?? result.notifications?.length ?? null,
    targetedUsers: result.targetedUsers ?? null,
    ...details,
  }
}

function generateCorrelationId(prefix = 'run') {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now()}-${random}`
}

function buildUserNotificationTopic(userId) {
  const normalized = Number(userId)
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null
  }

  return `adf247-user-${normalized}`
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

async function ensureCanManageConvocatoriaNotifications(authUser, convocatoria) {
  if (!authUser?.userId || !authUser?.nCarnet) {
    throw createNotificationsDtoError('Debes iniciar sesion para realizar esta accion.', 401)
  }

  if (Number(convocatoria?.responsableId) === Number(authUser.userId)) {
    return
  }

  await ensureAdmin(authUser)
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

function getRelativeDayDescriptor(targetDate, referenceDate = new Date()) {
  const target = startOfDay(targetDate)
  const reference = startOfDay(referenceDate)
  const dayDiff = Math.round((target.getTime() - reference.getTime()) / (24 * 60 * 60 * 1000))

  if (dayDiff === 0) {
    return {
      key: 'today',
      label: 'avui',
      labelCapitalized: 'Avui',
      dateText: formatDateForText(targetDate),
    }
  }

  if (dayDiff === 1) {
    return {
      key: 'tomorrow',
      label: 'demà',
      labelCapitalized: 'Demà',
      dateText: formatDateForText(targetDate),
    }
  }

  const dateText = formatDateForText(targetDate)
  return {
    key: 'date',
    label: `el dia ${dateText}`,
    labelCapitalized: `El dia ${dateText}`,
    dateText,
  }
}

function getRelativeDayLabel(targetDate, referenceDate = new Date()) {
  const descriptor = getRelativeDayDescriptor(targetDate, referenceDate)
  if (descriptor.key === 'today') {
    return 'avui'
  }

  if (descriptor.key === 'tomorrow') {
    return 'demà'
  }

  return descriptor.dateText
}

function buildResponseRequestManualMessage(convocatoria, referenceDate = new Date()) {
  const dayLabel = getRelativeDayLabel(convocatoria?.date, referenceDate)
  const horaInici = formatTimeForText(convocatoria?.startTime)
  const horaFinal = formatTimeForText(convocatoria?.finalTime || convocatoria?.startTime)
  const title = String(convocatoria?.title || 'convocatòria').trim() || 'convocatòria'
  const typeName = String(convocatoria?.convoType?.name || '').trim().toLowerCase()

  if (typeName.includes('formaci')) {
    return {
      title: 'Formació',
      body: `Recordatori de formació: ${title} el dia ${dayLabel} de ${horaInici} a ${horaFinal}`,
    }
  }

  return {
    title: 'Disponibilitat',
    body: `Es solicita disponibilitat per ${title} el dia ${dayLabel} de ${horaInici} a ${horaFinal}`,
  }
}

function buildSortidaStatusManualMessage(convocatoria, settings, referenceDate = new Date()) {
  const dayLabel = getRelativeDayLabel(convocatoria?.date, referenceDate)
  const horaInici = formatTimeForText(convocatoria?.startTime)
  const ubicacio = String(convocatoria?.ubiSortida || convocatoria?.convoType?.defaultLocation || '-').trim() || '-'
  const responsableNom = `${convocatoria?.user?.name || ''} ${convocatoria?.user?.lastName || ''}`.trim() || '-'
  const typeName = String(convocatoria?.convoType?.name || '').trim().toLowerCase()
  const isIncendiType = typeName === 'incendi'
  const guardiaSource = String(settings?.typeGroups?.guardiaSourceTypeName || 'guardia').trim().toLowerCase()
  const guardiaPvi = String(settings?.typeGroups?.guardiaPviTypeName || 'pvi').trim().toLowerCase()
  const isGuardiaType = typeName === guardiaSource || typeName === guardiaPvi

  if (convocatoria?.sortida) {
    return {
      title: 'Convocatoria',
      body: `Sortida ${dayLabel} a les ${horaInici} a ${ubicacio}\nResponsable ${responsableNom}`,
      dataKind: 'sortida-status-confirmed',
    }
  }

  if (isIncendiType) {
    return {
      title: 'Reten per Incendi a Sabadell',
      body: `El grocs disponibles queden de reten\nResponsable ${responsableNom}`,
      dataKind: 'incendi-sortida-reten',
    }
  }

  if (isGuardiaType) {
    return {
      title: 'Convocatoria',
      body: `No se surt per la convocatoria de ${dayLabel}`,
      dataKind: 'sortida-status-reten',
    }
  }

  return {
    title: 'Convocatoria',
    body: `No se surt per la convocatoria de ${dayLabel}`,
    dataKind: 'sortida-status-cancelled',
  }
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

const GUARDIA_DAILY_SLOTS = [
  { startHour: 12, startMinute: 0, endHour: 16, endMinute: 0 },
  { startHour: 16, startMinute: 0, endHour: 20, endMinute: 0 },
]

const PVI_DAILY_SLOT = { startHour: 10, startMinute: 0, endHour: 16, endMinute: 0 }
const PVI_WEEKLY_SLOT = { startHour: 12, startMinute: 0, endHour: 16, endMinute: 0 }

function buildDateWithTime(baseDate, hour, minute = 0) {
  const value = startOfDay(baseDate)
  value.setHours(hour, minute, 0, 0)
  return value
}

function buildCampaignPeriod(settings) {
  const startRaw = settings?.hourComputation?.campaignStartDate
  const endRaw = settings?.hourComputation?.campaignEndDate

  if (!startRaw || !endRaw) {
    return null
  }

  const start = startOfDay(new Date(startRaw))
  const end = endOfDay(new Date(endRaw))

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return null
  }

  return { start, end }
}

function isDateInsideCampaign(date, settings) {
  const period = buildCampaignPeriod(settings)
  if (!period) {
    return false
  }

  const timestamp = new Date(date).getTime()
  return timestamp >= period.start.getTime() && timestamp < period.end.getTime()
}

function getGuardiaAndPviTypeNames(settings) {
  return {
    guardiaTypeName: String(settings?.typeGroups?.guardiaSourceTypeName || 'Guardia').trim(),
    pviTypeName: String(settings?.typeGroups?.guardiaPviTypeName || 'PVI').trim(),
  }
}

function slotMatchesConvocatoria(convocatoria, slot) {
  const start = new Date(convocatoria?.startTime)
  const end = convocatoria?.finalTime ? new Date(convocatoria.finalTime) : null

  if (Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
    return false
  }

  return (
    start.getHours() === slot.startHour
    && start.getMinutes() === slot.startMinute
    && end.getHours() === slot.endHour
    && end.getMinutes() === slot.endMinute
  )
}

async function getMaxTomorrowPlaAlfaLevel(forceRefresh = false) {
  const status = await getPlaAlfaMunicipalitiesStatus({ forceRefresh })
  const levels = Array.isArray(status?.municipalities)
    ? status.municipalities
      .map((item) => Number(item?.tomorrowLevel))
      .filter((level) => Number.isInteger(level) && level >= 0)
    : []

  if (levels.length === 0) {
    return null
  }

  return Math.max(...levels)
}

async function findConvoTypesOrSkip(settings) {
  const { guardiaTypeName, pviTypeName } = getGuardiaAndPviTypeNames(settings)

  const convoTypes = await database.convoType.findMany({
    where: {
      name: {
        in: [guardiaTypeName, pviTypeName],
      },
    },
  })

  const guardiaType = convoTypes.find((item) => item.name === guardiaTypeName) || null
  const pviType = convoTypes.find((item) => item.name === pviTypeName) || null

  if (!guardiaType || !pviType) {
    return {
      skipped: true,
      reason: 'missing-convo-types',
      missingTypes: [!guardiaType ? guardiaTypeName : null, !pviType ? pviTypeName : null].filter(Boolean),
      guardiaType,
      pviType,
    }
  }

  return {
    skipped: false,
    guardiaType,
    pviType,
  }
}

async function getGuardiaPviConvocatoriasForDay(targetDate, settings) {
  const { guardiaTypeName, pviTypeName } = getGuardiaAndPviTypeNames(settings)
  const dayStart = startOfDay(targetDate)
  const dayEnd = endOfDay(targetDate)

  return database.convocatoria.findMany({
    where: {
      isActive: true,
      date: {
        gte: dayStart,
        lt: dayEnd,
      },
      convoType: {
        name: {
          in: [guardiaTypeName, pviTypeName],
        },
      },
    },
    include: {
      convoType: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  })
}

async function ensureConvocatoriaForSlot({
  targetDate,
  slot,
  convoType,
  existingConvocatorias,
  defaultSortida = false,
  includeDateInTitle = true,
}) {
  const alreadyExists = existingConvocatorias.some((convocatoria) => {
    if (convocatoria.convoTypeId !== convoType.id) {
      return false
    }

    return slotMatchesConvocatoria(convocatoria, slot)
  })

  if (alreadyExists) {
    return null
  }

  const created = await database.convocatoria.create({
    data: {
      date: startOfDay(targetDate),
      title: includeDateInTitle
        ? `${convoType.name} - ${getDateKey(targetDate)}`
        : `${convoType.name}`,
      ubiSortida: convoType.defaultLocation || 'Brigadas',
      convoTypeId: convoType.id,
      autoAssignResponsable: true,
      startTime: buildDateWithTime(targetDate, slot.startHour, slot.startMinute),
      finalTime: buildDateWithTime(targetDate, slot.endHour, slot.endMinute),
      sortida: defaultSortida,
    },
    include: {
      convoType: true,
    },
  })

  existingConvocatorias.push(created)
  return created
}

async function applyCampaignD1GuardiaPviPlan(_authUser, referenceDate = new Date(), options = {}) {
  const settings = readNotificationSettings()
  const { start: tomorrowStart } = getDateRangeByDaysAhead(referenceDate, 1)

  if (!isDateInsideCampaign(tomorrowStart, settings)) {
    return {
      skipped: true,
      reason: 'outside-campaign',
      campaignDate: getDateKey(tomorrowStart),
    }
  }

  const maxTomorrowAlfaLevel = await getMaxTomorrowPlaAlfaLevel(Boolean(options.forceRefreshPlaAlfa))
  if (maxTomorrowAlfaLevel === null) {
    return {
      skipped: true,
      reason: 'no-pla-alfa-data',
      campaignDate: getDateKey(tomorrowStart),
    }
  }

  const convoTypesResult = await findConvoTypesOrSkip(settings)
  if (convoTypesResult.skipped) {
    return {
      skipped: true,
      reason: convoTypesResult.reason,
      campaignDate: getDateKey(tomorrowStart),
      maxTomorrowAlfaLevel,
      missingTypes: convoTypesResult.missingTypes,
    }
  }

  const { guardiaType, pviType } = convoTypesResult
  const existingConvocatorias = await getGuardiaPviConvocatoriasForDay(tomorrowStart, settings)

  let createdGuardiaCount = 0
  let createdPviCount = 0

  const shouldActivateSortida = maxTomorrowAlfaLevel >= 2
  if (shouldActivateSortida) {
    for (const slot of GUARDIA_DAILY_SLOTS) {
      const created = await ensureConvocatoriaForSlot({
        targetDate: tomorrowStart,
        slot,
        convoType: guardiaType,
        existingConvocatorias,
      })
      if (created) {
        createdGuardiaCount += 1
      }
    }

    const createdPvi = await ensureConvocatoriaForSlot({
      targetDate: tomorrowStart,
      slot: PVI_DAILY_SLOT,
      convoType: pviType,
      existingConvocatorias,
    })

    if (createdPvi) {
      createdPviCount += 1
    }
  }

  const updateResult = await database.convocatoria.updateMany({
    where: {
      id: {
        in: existingConvocatorias.map((convocatoria) => convocatoria.id),
      },
    },
    data: {
      sortida: shouldActivateSortida,
    },
  })

  return {
    skipped: false,
    decision: shouldActivateSortida ? 'se-surt' : 'no-se-surt',
    campaignDate: getDateKey(tomorrowStart),
    maxTomorrowAlfaLevel,
    updatedSortidaCount: updateResult.count,
    createdGuardiaCount,
    createdPviCount,
    createdConvocatoriasCount: createdGuardiaCount + createdPviCount,
  }
}

function getCurrentWeekRange(referenceDate = new Date()) {
  const start = startOfDay(referenceDate)
  const day = start.getDay()
  const daysSinceMonday = (day + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)

  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start, end }
}

async function didCurrentWeekReachAlfa2(referenceDate = new Date()) {
  const { start } = getCurrentWeekRange(referenceDate)
  const now = new Date(referenceDate)

  const taskRuns = await database.notificationAutomationTaskRun.findMany({
    where: {
      taskKey: 'campaign-d1-guardia-pvi',
      startedAt: {
        gte: start,
        lte: now,
      },
      detailsJson: {
        not: null,
      },
    },
    select: {
      detailsJson: true,
    },
  })

  for (const taskRun of taskRuns) {
    if (!taskRun.detailsJson) {
      continue
    }

    try {
      const details = JSON.parse(taskRun.detailsJson)
      if (Number(details?.maxTomorrowAlfaLevel) >= 2) {
        return true
      }
    } catch {
      // Ignore malformed historical task payloads.
    }
  }

  const fallbackMaxLevel = await getMaxTomorrowPlaAlfaLevel(false)
  return Number(fallbackMaxLevel) >= 2
}

async function seedNextWeekGuardiaPviConvocatorias(_authUser, referenceDate = new Date()) {
  const settings = readNotificationSettings()
  const convoTypesResult = await findConvoTypesOrSkip(settings)
  if (convoTypesResult.skipped) {
    return {
      skipped: true,
      reason: convoTypesResult.reason,
      missingTypes: convoTypesResult.missingTypes,
    }
  }

  const { guardiaType, pviType } = convoTypesResult
  const nextWeek = getNextWeekRange(referenceDate)
  const days = []
  for (let current = new Date(nextWeek.start); current < nextWeek.end; current.setDate(current.getDate() + 1)) {
    days.push(startOfDay(current))
  }

  const campaignDays = days.filter((day) => isDateInsideCampaign(day, settings))
  if (campaignDays.length === 0) {
    return {
      skipped: true,
      reason: 'outside-campaign',
      weekStart: getDateKey(nextWeek.start),
      weekEnd: getDateKey(new Date(nextWeek.end.getTime() - (24 * 60 * 60 * 1000))),
    }
  }

  const weekHadAlfa2 = await didCurrentWeekReachAlfa2(referenceDate)

  let createdGuardiaCount = 0
  let createdPviCount = 0

  for (const day of campaignDays) {
    const existingConvocatorias = await getGuardiaPviConvocatoriasForDay(day, settings)

    for (const slot of GUARDIA_DAILY_SLOTS) {
      const created = await ensureConvocatoriaForSlot({
        targetDate: day,
        slot,
        convoType: guardiaType,
        existingConvocatorias,
        includeDateInTitle: false,
      })
      if (created) {
        createdGuardiaCount += 1
      }
    }

    if (weekHadAlfa2) {
      const createdPvi = await ensureConvocatoriaForSlot({
        targetDate: day,
        slot: PVI_WEEKLY_SLOT,
        convoType: pviType,
        existingConvocatorias,
        includeDateInTitle: false,
      })

      if (createdPvi) {
        createdPviCount += 1
      }
    }
  }

  return {
    skipped: false,
    weekStart: getDateKey(nextWeek.start),
    weekEnd: getDateKey(new Date(nextWeek.end.getTime() - (24 * 60 * 60 * 1000))),
    daysInCampaign: campaignDays.length,
    weekHadAlfa2,
    createdGuardiaCount,
    createdPviCount,
    createdConvocatoriasCount: createdGuardiaCount + createdPviCount,
  }
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
  const legacyGuardiaPviName = 'Guardia PVI'
  const settings = readNotificationSettings()
  const sourceName = settings.typeGroups.guardiaSourceTypeName
  const targetName = settings.typeGroups.guardiaPviTypeName

  const sourceType = await database.convoType.findFirst({
    where: { name: sourceName },
  })

  if (!sourceType || !targetName) {
    return null
  }

  let existing = await database.convoType.findFirst({
    where: { name: targetName },
  })

  const hasLegacyAlias = legacyGuardiaPviName.toLowerCase() !== String(targetName).trim().toLowerCase()
  const legacyType = hasLegacyAlias
    ? await database.convoType.findFirst({ where: { name: legacyGuardiaPviName } })
    : null

  if (legacyType && !existing) {
    existing = await database.convoType.update({
      where: { id: legacyType.id },
      data: { name: targetName },
    })
  } else if (legacyType && existing && legacyType.id !== existing.id) {
    await database.$transaction([
      database.convocatoria.updateMany({
        where: { convoTypeId: legacyType.id },
        data: { convoTypeId: existing.id },
      }),
      database.convoType.delete({
        where: { id: legacyType.id },
      }),
    ])
  }

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

async function getPendingGrocResponseUserIdsForConvocatoria(convocatoria) {
  const pendingRecipients = await getMissingResponseUsersForConvocatorias([convocatoria])
  if (pendingRecipients.length === 0) {
    return []
  }

  const grocRoles = await database.role.findMany({
    where: {
      isGroc: true,
      user: {
        isActive: true,
      },
    },
    select: {
      user: {
        select: {
          id: true,
        },
      },
    },
  })

  const grocUserIds = new Set(grocRoles.map((role) => role.user?.id).filter((id) => Number.isInteger(id)))
  return pendingRecipients
    .map((recipient) => recipient.userId)
    .filter((userId) => grocUserIds.has(userId))
}

function getPositiveGrocResponderUserIds(convocatoria) {
  return [...new Set(
    (convocatoria?.respostas || [])
      .filter((respuesta) => {
        if (!respuesta?.response || !respuesta?.user?.isActive) {
          return false
        }

        const roles = Array.isArray(respuesta.user.roles) ? respuesta.user.roles : []
        return roles.some((role) => role?.isGroc)
      })
      .map((respuesta) => respuesta.user.id)
      .filter((userId) => Number.isInteger(userId) && userId > 0)
  )]
}

function getMinutesUntilConvocatoriaStart(convocatoria, referenceDate = new Date()) {
  const startAt = new Date(convocatoria?.startTime)
  if (Number.isNaN(startAt.getTime())) {
    return 0
  }

  const diffMs = startAt.getTime() - new Date(referenceDate).getTime()
  return Math.max(0, Math.ceil(diffMs / 60000))
}

async function sendIncendiCreationNotification(convocatoria, senderUserId = null, targetScope = null) {
  const typeName = normalizeTypeName(convocatoria?.convoType?.name)
  if (typeName !== 'incendi') {
    return { skipped: true, reason: 'not-incendi' }
  }

  const targetUserIds = await getPendingGrocResponseUserIdsForConvocatoria(convocatoria)
  if (targetUserIds.length === 0) {
    return { skipped: true, reason: 'no-pending-groc-users' }
  }

  const ubicacio = String(convocatoria?.ubiSortida || convocatoria?.convoType?.defaultLocation || 'ubicacio').trim() || 'ubicacio'
  const minutesUntilStart = getMinutesUntilConvocatoriaStart(convocatoria)

  return sendMulticastNotification({
    title: 'Disponibilitat: Incendi a Sabadell',
    body: `Grocs disponibles per estar a ${ubicacio} en ${minutesUntilStart} minuts`,
    link: '/dashboard',
    data: {
      kind: 'incendi-created-pending-groc',
      convocatoriaId: convocatoria.id,
      typeName: convocatoria.convoType?.name || '',
      minutesUntilStart,
    },
    targetScope: targetScope || `auto-incendi-created:${convocatoria.id}`,
    senderUserId,
    userIds: targetUserIds,
  })
}

async function sendIncendiSortidaActivated(convocatoriaId, senderUserId = null, options = {}) {
  const convocatoria = await getConvocatoriaWithContext(convocatoriaId)
  const typeName = normalizeTypeName(convocatoria?.convoType?.name)

  if (typeName !== 'incendi') {
    return { skipped: true, reason: 'not-incendi' }
  }

  if (!convocatoria.sortida) {
    return { skipped: true, reason: 'sortida-not-active' }
  }

  const targetUserIds = getPositiveGrocResponderUserIds(convocatoria)
  if (targetUserIds.length === 0) {
    return { skipped: true, reason: 'no-groc-positive-responders' }
  }

  const ubicacio = String(convocatoria?.ubiSortida || convocatoria?.convoType?.defaultLocation || 'brigades').trim() || 'brigades'
  const responsableNom = `${convocatoria?.user?.name || ''} ${convocatoria?.user?.lastName || ''}`.trim() || '-'

  return sendMulticastNotification({
    title: 'Sortida per Incendi a Sabadell',
    body: `Grocs disponibles a brigades\nResponsable ${responsableNom}`,
    link: '/dashboard',
    data: {
      kind: 'incendi-sortida-activated',
      convocatoriaId: convocatoria.id,
      typeName: convocatoria.convoType?.name || '',
      sortida: true,
    },
    targetScope: options.targetScope || `incendi-sortida-activated:${convocatoria.id}:${Date.now()}`,
    senderUserId,
    userIds: targetUserIds,
  })
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
  const payloadData = {
    notificationIcon: NOTIFICATION_LOGO_URL,
    notificationBadge: NOTIFICATION_BADGE_URL,
    ...Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = String(value)
      return acc
    }, {}),
  }

  const allowedDevUserIds = await resolveAllowedDevNotificationUserIds()

  let targetUserIds = null
  if (Array.isArray(userIds)) {
    targetUserIds = [...new Set(userIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
    if (Array.isArray(allowedDevUserIds)) {
      const allowedSet = new Set(allowedDevUserIds)
      targetUserIds = targetUserIds.filter((userId) => allowedSet.has(userId))
    }
  } else if (Array.isArray(allowedDevUserIds)) {
    targetUserIds = allowedDevUserIds
  }

  let topics = []
  if (Array.isArray(targetUserIds)) {
    topics = [...new Set(targetUserIds.map(buildUserNotificationTopic).filter(Boolean))]
  } else {
    topics = [GLOBAL_NOTIFICATION_TOPIC]
  }

  if (topics.length === 0) {
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
    let successCount = 0
    let failureCount = 0

    for (const topic of topics) {
      try {
        await messaging.send({
          topic,
          notification: {
            title,
            body,
          },
          data: payloadData,
          webpush: {
            headers: {
              Urgency: 'high',
              TTL: '3600',
            },
            notification: {
              title,
              body,
              icon: NOTIFICATION_LOGO_URL,
              badge: NOTIFICATION_BADGE_URL,
              image: NOTIFICATION_LOGO_URL,
            },
            fcmOptions: {
              link,
            },
          },
        })

        successCount += 1
      } catch {
        failureCount += 1
      }
    }

    const log = await database.notificationLog.create({
      data: {
        senderUserId,
        title,
        body,
        dataJson: JSON.stringify(data),
        requestedCount: topics.length,
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
        requestedCount: topics.length,
        successCount: 0,
        failureCount: topics.length,
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

  const userTopic = buildUserNotificationTopic(authUser?.userId)
  const topics = [GLOBAL_NOTIFICATION_TOPIC, userTopic].filter(Boolean)
  const messaging = getFirebaseMessaging()

  // Prevent stale cross-user subscriptions on shared browsers by removing
  // this token from all user-scoped topics except the current authenticated user.
  const users = await database.user.findMany({
    select: { id: true },
  })
  const staleUserTopics = users
    .map((user) => buildUserNotificationTopic(user.id))
    .filter((topic) => topic && topic !== userTopic)

  await Promise.allSettled(staleUserTopics.map((topic) => messaging.unsubscribeFromTopic([dto.token], topic)))

  await Promise.all(topics.map((topic) => messaging.subscribeToTopic([dto.token], topic)))

  return { ok: true, topics }
}

async function deactivateDeviceToken(authUser, payload) {
  const dto = buildDeactivateDeviceTokenDto(payload)

  const userTopic = buildUserNotificationTopic(authUser?.userId)
  const topics = [GLOBAL_NOTIFICATION_TOPIC, userTopic].filter(Boolean)
  const messaging = getFirebaseMessaging()

  const users = await database.user.findMany({
    select: { id: true },
  })
  const allUserTopics = users
    .map((user) => buildUserNotificationTopic(user.id))
    .filter(Boolean)
  const topicsToUnsubscribe = [...new Set([...topics, ...allUserTopics])]

  await Promise.allSettled(topicsToUnsubscribe.map((topic) => messaging.unsubscribeFromTopic([dto.token], topic)))

  return { ok: true }
}

async function getCurrentUserDeviceTokens(authUser) {
  return []
}

async function getAllDeviceTokens(authUser) {
  await ensureAdmin(authUser)

  return []
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
  const manualMessage = options.useManualMessage
    ? buildResponseRequestManualMessage(convocatoria, options.referenceDate)
    : null
  const titleTemplate = manualMessage?.title || options.titleTemplate || settings.responseRequest.creationTitle
  const bodyTemplate = manualMessage?.body || options.bodyTemplate || settings.responseRequest.creationBody
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
    `manual-response-request:${convocatoria.id}:${Date.now()}`,
    {
      useManualMessage: true,
      referenceDate: new Date(),
    }
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

  if (isWeekly) {
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
    const fireNotification = await sendIncendiCreationNotification(
      convocatoria,
      null,
      `auto-fire-created:${convocatoria.id}`
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
  const typeName = normalizeTypeName(convocatoria?.convoType?.name)
  if (typeName === 'incendi' && convocatoria?.sortida) {
    return sendIncendiSortidaActivated(convocatoria.id, senderUserId, { targetScope })
  }

  const settings = readNotificationSettings()
  const manualMessage = buildSortidaStatusManualMessage(convocatoria, settings, new Date())

  const targetUserIds = [...new Set(
    (convocatoria.respostas || [])
      .filter((respuesta) => respuesta.response && respuesta.user?.isActive)
      .map((respuesta) => respuesta.user.id)
  )]

  return sendMulticastNotification({
    title: manualMessage.title,
    body: manualMessage.body,
    link: settings.sortidaStatus.link,
    data: {
      kind: manualMessage.dataKind,
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
  const convocatoria = await getConvocatoriaWithContext(convoId)
  await ensureCanManageConvocatoriaNotifications(authUser, convocatoria)

  const missingResponders = await getMissingResponseUsersForConvocatorias([convocatoria])

  let responseSummary = {
    skipped: true,
    reason: 'no-pending-responders',
    pendingCount: 0,
  }

  if (missingResponders.length > 0) {
    const pendingNotification = await sendConvocatoriaResponseRequestInternal(
      convocatoria,
      authUser.userId,
      `manual-convo-automation-response:${convocatoria.id}:${Date.now()}`,
      {
        userIds: missingResponders.map((recipient) => recipient.userId),
        useManualMessage: true,
        referenceDate,
      }
    )

    responseSummary = {
      skipped: false,
      pendingCount: missingResponders.length,
      notification: pendingNotification,
    }
  }

  const sortidaNotification = await sendConvocatoriaSortidaStatusInternal(
    convocatoria,
    authUser.userId,
    `manual-convo-automation-sortida:${convocatoria.id}:${Date.now()}`
  )

  const sortidaSummary = {
    skipped: false,
    triggerAt: null,
    notification: sortidaNotification,
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
      message: 'Manual execution del recordatori de respostes pendents',
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
      title: 'Disponibilitat',
      body: `Tens ${pendingCount} convocatories sense respondre la disponibilitat`,
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
      message: 'Manual execution del digest setmanal',
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
      message: 'Manual execution de notificacions de sortida de dema',
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

  const eligibleConvocatorias = []

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

    if (typeof options.requiredSortida === 'boolean' && Boolean(convocatoria.sortida) !== options.requiredSortida) {
      continue
    }

    eligibleConvocatorias.push(convocatoria)
  }

  if (eligibleConvocatorias.length === 0) {
    return {
      notificationCount: 0,
      notifications: [],
    }
  }

  const notifications = []
  if (eligibleConvocatorias.length > 1) {
    const userIds = [...new Set(
      eligibleConvocatorias.flatMap((convocatoria) =>
        (convocatoria.respostas || [])
          .filter((respuesta) => respuesta.response && respuesta.user?.isActive)
          .map((respuesta) => respuesta.user.id)
      )
    )]

    const summaryScope = `scheduled-sortida-status-summary:${getDateKey(start)}`
    if (!options.skipIfAlreadySent || !(await hasNotificationLogForScope(summaryScope, referenceDate))) {
      const summaryNotification = await sendMulticastNotification({
        title: 'Convocatoria',
        body: 'Hi han diferents convocatories programades per aquesta setmana, revisa el teu calendari',
        link: settings.sortidaStatus.link,
        data: {
          kind: 'sortida-status-summary',
          count: eligibleConvocatorias.length,
        },
        targetScope: summaryScope,
        senderUserId: authUser?.userId ?? null,
        userIds,
      })
      notifications.push(summaryNotification)
    }

    return {
      notificationCount: notifications.length,
      notifications,
    }
  }

  const convocatoria = eligibleConvocatorias[0]
  const targetScope = `scheduled-sortida-status:${getDateKey(start)}:${convocatoria.id}`
  if (options.skipIfAlreadySent && await hasNotificationLogForScope(targetScope, referenceDate)) {
    return {
      notificationCount: 0,
      notifications: [],
    }
  }

  const notification = await sendConvocatoriaSortidaStatusInternal(
    convocatoria,
    authUser?.userId ?? null,
    targetScope
  )
  notifications.push(notification)

  return {
    notificationCount: notifications.length,
    notifications,
  }

}

async function runDailyNotificationAutomation(authUser, referenceDate = new Date()) {
  if (authUser) {
    await ensureAdmin(authUser)
  }

  const settings = readNotificationSettings()
  const canRunTimedTasks = authUser
    ? true
    : referenceDate.getHours() === settings.schedule.dailyRunHour
      && referenceDate.getMinutes() === settings.schedule.dailyRunMinute

  // Defensive guard: if scheduler invokes this outside the configured minute,
  // do not create historical run records.
  if (!authUser && !canRunTimedTasks) {
    return {
      skipped: true,
      reason: 'outside-scheduled-time',
      expectedHour: settings.schedule.dailyRunHour,
      expectedMinute: settings.schedule.dailyRunMinute,
      executedAt: referenceDate.toISOString(),
    }
  }

  const run = await createAutomationRun({
    trigger: authUser ? 'manual' : 'scheduled',
    source: authUser ? 'api' : 'scheduler',
    actorUserId: authUser?.userId || null,
  })

  await ensureConfiguredConvoTypes()
  await updateSortidaForTomorrow(referenceDate)

  const configuredTasks = Array.isArray(settings.automation?.tasks) && settings.automation.tasks.length > 0
    ? settings.automation.tasks
    : [
      { taskKey: 'campaign-d1-guardia-pvi', notifyKind: 'campaign-d1-guardia-pvi', enabled: true, schedule: { kind: 'daily' }, convoTypeFilter: ['Guardia', 'PVI'] },
      { taskKey: 'sortida-d1-confirmed', notifyKind: 'sortida-confirmed', enabled: true, schedule: { kind: 'daily' }, convoTypeFilter: [] },
      { taskKey: 'sortida-d1-cancelled', notifyKind: 'sortida-cancelled', enabled: true, schedule: { kind: 'daily' }, convoTypeFilter: [] },
      { taskKey: 'sortida-d1-reten', notifyKind: 'sortida-reten', enabled: true, schedule: { kind: 'daily' }, convoTypeFilter: [] },
      { taskKey: 'weekly-request-guardia-pvi', notifyKind: 'weekly-guardia-pvi-bootstrap', enabled: true, schedule: { kind: 'weekly' }, convoTypeFilter: ['Guardia', 'PVI'] },
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
      if (notifyKind === 'weekly-digest' || notifyKind === 'weekly-pending' || notifyKind === 'weekly-guardia-pvi-bootstrap') {
        if (!canRunTimedTasks || referenceDate.getDay() !== settings.schedule.weeklyRequestWeekday) {
          return { skipped: true, reason: 'not-weekly-day' }
        }

        if (notifyKind === 'weekly-guardia-pvi-bootstrap') {
          const seedResult = await seedNextWeekGuardiaPviConvocatorias(authUser, referenceDate)
          const digestResult = await sendWeeklyResponseDigest(authUser, referenceDate, {
            skipIfAlreadySent: !authUser,
            convoTypeFilter,
            weekScope: 'next-week',
          })

          return {
            skipped: Boolean(seedResult?.skipped) && Boolean(digestResult?.skipped),
            reason: seedResult?.reason || digestResult?.reason || null,
            weekStart: seedResult?.weekStart || null,
            weekEnd: seedResult?.weekEnd || null,
            weekHadAlfa2: seedResult?.weekHadAlfa2 ?? null,
            daysInCampaign: seedResult?.daysInCampaign ?? null,
            createdGuardiaCount: seedResult?.createdGuardiaCount ?? 0,
            createdPviCount: seedResult?.createdPviCount ?? 0,
            createdConvocatoriasCount: seedResult?.createdConvocatoriasCount ?? 0,
            targetedUsers: digestResult?.targetedUsers ?? null,
            notificationCount: digestResult?.notification ? 1 : 0,
          }
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

      if (notifyKind === 'campaign-d1-guardia-pvi') {
        return applyCampaignD1GuardiaPviPlan(authUser, referenceDate)
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
    throw createNotificationsDtoError('El id de execution no es valido.')
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
    throw createNotificationsDtoError('No se ha encontrado la execution solicitada.', 404)
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
    'missed-run': 'Execution omesa del automatisme',
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

  // Avoid late-night false alerts: only detect a missed execution during
  // a bounded window after the expected schedule time.
  const detectionWindowMs = 2 * 60 * 60 * 1000
  if (now.getTime() > expectedRunTime.getTime() + gracePeriodMs + detectionWindowMs) {
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
      errorMessage: `Execution omesa: l'automatisme no s'ha executat a les ${expectedTimeStr}.`,
      correlationId: generateCorrelationId('missed-run'),
    },
  })

  await sendAutomationAlertPush({
    alertType: 'missed-run',
    message: `L'automatisme no s'ha executat avui a les ${expectedTimeStr}.`,
    runId: missedRun.id,
    settings,
  })

  console.log(`[notifications.service] Execution omesa detectada a les ${expectedTimeStr}. Execution id: ${missedRun.id}`)
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
    console.log(`[notifications.service] Limpieza de histórico: ${result.count} executions eliminades (>${retentionDays} dies).`)
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

  const allowedKinds = [
    'pending-responses',
    'sortida-status',
    'weekly-digest',
    'sortida-confirmed',
    'sortida-cancelled',
    'sortida-reten',
    'weekly-pending',
    'campaign-d1-guardia-pvi',
    'weekly-guardia-pvi-bootstrap',
  ]
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
    'campaign-d1-guardia-pvi': () => applyCampaignD1GuardiaPviPlan(authUser, referenceDate, {
      forceRefreshPlaAlfa: true,
    }),
    'weekly-guardia-pvi-bootstrap': async () => {
      const seedResult = await seedNextWeekGuardiaPviConvocatorias(authUser, referenceDate)
      const digestResult = await sendWeeklyResponseDigest(authUser, referenceDate, {
        skipIfAlreadySent: false,
        convoTypeFilter,
        weekScope: 'next-week',
      })

      return {
        skipped: Boolean(seedResult?.skipped) && Boolean(digestResult?.skipped),
        reason: seedResult?.reason || digestResult?.reason || null,
        weekStart: seedResult?.weekStart || null,
        weekEnd: seedResult?.weekEnd || null,
        weekHadAlfa2: seedResult?.weekHadAlfa2 ?? null,
        daysInCampaign: seedResult?.daysInCampaign ?? null,
        createdGuardiaCount: seedResult?.createdGuardiaCount ?? 0,
        createdPviCount: seedResult?.createdPviCount ?? 0,
        createdConvocatoriasCount: seedResult?.createdConvocatoriasCount ?? 0,
        targetedUsers: digestResult?.targetedUsers ?? null,
        notificationCount: digestResult?.notification ? 1 : 0,
      }
    },
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
  sendIncendiSortidaActivated,
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