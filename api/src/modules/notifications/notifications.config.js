const fs = require('fs')
const path = require('path')

const NOTIFICATION_SETTINGS_PATH = path.join(__dirname, '../../../config/notification-rules.json')

const DEFAULT_NOTIFICATION_SETTINGS = {
  schedule: {
    dailyRunHour: 8,
    dailyRunMinute: 0,
    weeklyRequestWeekday: 5,
  },
  typeGroups: {
    weeklyTypeNames: ['Guardia', 'PVI', 'Semanal'],
    sortidaTypeNames: [],
    availabilityManagerNCarnets: [],
    guardiaSourceTypeName: 'Guardia',
    guardiaPviTypeName: 'PVI',
  },
  responseRequest: {
    sendOnCreationForNonWeekly: true,
    pendingLeadDays: 0,
    pendingLeadHours: 24,
    link: '/dashboard',
    creationTitle: 'Nova convocatòria',
    creationBody: '{title} ({type}) per al dia {date}. Revisa i respon la teva disponibilitat.',
    fireTitle: 'Incendi',
    fireBody: 'S\'ha creat una convocatòria d\'incendi: {title} ({date}).',
    weeklyCreatedTitle: 'Disponibilitat setmanal',
    weeklyCreatedBody: 'Aquesta setmana hi ha {count} convocatòries setmanals creades.',
    pendingTitle: 'Tens convocatòries pendents',
    pendingBody: 'Encara tens {count} convocatòries pendents per respondre.',
  },
  availabilityMatching: {
    conflictPolicy: 'unavailable-wins',
    createAvailableResponses: true,
    createUnavailableResponses: true,
    autoCreateUnavailableForUsersWithoutWindow: false,
    notifyOnAutoAvailableResponse: false,
  },
  hourComputation: {
    campaignStartDate: null,
    campaignEndDate: null,
    unansweredPenaltyThreshold: 0,
    unansweredPenaltyHours: 1,
    noShowPenaltyHours: 4,
  },
  campaignForm: {
    vehicleCatalog: [],
  },
  weeklyRequest: {
    enabled: true,
    requestWeekday: 5,
    requestHour: 8,
    requestMinute: 0,
    link: '/dashboard',
    title: 'Disponibilitat pendent per convocatòries setmanals',
    body: 'Tens convocatòries setmanals de la setmana vinent pendents de resposta.',
  },
  sortidaStatus: {
    enabled: true,
    confirmDaysBefore: 1,
    confirmHour: 19,
    confirmMinute: 0,
    link: '/dashboard',
    titleYes: '**Convocatoria** {title}',
    bodyYes: 'Demà a les {horaInici} a {ubicació}\nResponsable {nºCarnet} {nom + cognom}',
    titleNo: 'Convocatòria cancel·lada',
    bodyNo: '{title} ({type}) finalment no surt demà {date}.',
    titleCancelled: 'Convocatòria cancel·lada',
    bodyCancelled: '{title} ({type}) finalment no surt demà {date}.',
    titleReten: 'Retén',
    bodyReten: '{title} ({type}) passa a retén per demà {date}.',
  },
  automation: {
    retentionDays: 7,
    viewerNCarnets: [],
    developerNCarnets: [],
    monitoring: {
      enabled: false,
      alertRecipientNCarnets: [],
      alertOnMissedRun: true,
      alertOnTaskFailure: true,
    },
    tasks: [
      { taskKey: 'campaign-d1-guardia-pvi', notifyKind: 'campaign-d1-guardia-pvi', convoTypeFilter: ['Guardia', 'PVI'], enabled: true, schedule: { kind: 'daily' }, timeoutMs: 120000, retryPolicy: { maxRetries: 0 }, dependsOn: [] },
      { taskKey: 'pla-alfa-daily-summary', notifyKind: 'pla-alfa-daily-summary', convoTypeFilter: [], enabled: true, schedule: { kind: 'daily' }, timeoutMs: 120000, retryPolicy: { maxRetries: 0 }, dependsOn: [] },
      { taskKey: 'sortida-d1-confirmed', notifyKind: 'sortida-confirmed', convoTypeFilter: [], enabled: true, schedule: { kind: 'daily' }, timeoutMs: 120000, retryPolicy: { maxRetries: 0 }, dependsOn: [] },
      { taskKey: 'sortida-d1-cancelled', notifyKind: 'sortida-cancelled', convoTypeFilter: [], enabled: true, schedule: { kind: 'daily' }, timeoutMs: 120000, retryPolicy: { maxRetries: 0 }, dependsOn: [] },
      { taskKey: 'sortida-d1-reten', notifyKind: 'sortida-reten', convoTypeFilter: [], enabled: true, schedule: { kind: 'daily' }, timeoutMs: 120000, retryPolicy: { maxRetries: 0 }, dependsOn: [] },
      { taskKey: 'weekly-request-guardia-pvi', notifyKind: 'weekly-guardia-pvi-bootstrap', convoTypeFilter: ['Guardia', 'PVI'], enabled: true, schedule: { kind: 'weekly' }, timeoutMs: 120000, retryPolicy: { maxRetries: 0 }, dependsOn: [] },
    ],
  },
}

function cloneDefaultSettings() {
  return JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS))
}

function normalizeText(value, fallback) {
  if (typeof value !== 'string') {
    return fallback
  }

  const normalized = value.trim()
  return normalized || fallback
}

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isInteger(parsed)) {
    return fallback
  }

  return Math.min(Math.max(parsed, min), max)
}

function normalizeStringList(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

function canonicalizePviTypeName(value) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return normalized
  }

  if (normalized.toLowerCase() === 'guardia pvi') {
    return 'PVI'
  }

  if (normalized.toLowerCase() === 'pvi') {
    return 'PVI'
  }

  return normalized
}

function canonicalizePviTypeNames(list = []) {
  const canonicalized = Array.isArray(list)
    ? list.map((entry) => canonicalizePviTypeName(entry)).filter(Boolean)
    : []

  const deduped = []
  const seen = new Set()

  for (const item of canonicalized) {
    const key = item.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(item)
  }

  return deduped
}

function normalizeVehicleCatalog(value, fallback = []) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .map((entry) => {
      if (typeof entry === 'string') {
        const indicativo = entry.trim()
        if (!indicativo) {
          return null
        }

        return {
          indicativo,
          modelo: '',
          litros: 0,
          kms: 0,
        }
      }

      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null
      }

      const indicativo = normalizeText(entry.indicativo, '')
      if (!indicativo) {
        return null
      }

      const modelo = normalizeText(entry.modelo, '')
      const litrosRaw = Number(entry.litros)
      const litros = Number.isFinite(litrosRaw) && litrosRaw >= 0
        ? Number(litrosRaw.toFixed(2))
        : 0
      const kmsRaw = Number(entry.kms)
      const kms = Number.isFinite(kmsRaw) && kmsRaw >= 0
        ? Number(kmsRaw.toFixed(2))
        : 0

      return {
        indicativo,
        modelo,
        litros,
        kms,
      }
    })
    .filter(Boolean)

  const deduped = []
  const seen = new Set()
  for (const vehicle of normalized) {
    const key = String(vehicle.indicativo).toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(vehicle)
  }

  return deduped
}

function normalizeAutomationTask(task, fallbackTask) {
  const source = task && typeof task === 'object' ? task : {}
  const fallback = fallbackTask && typeof fallbackTask === 'object' ? fallbackTask : {}

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
    'pla-alfa-daily-summary',
  ]
  const rawKind = source.notifyKind || fallback.notifyKind || source.taskKey || fallback.taskKey || ''
  const notifyKind = allowedKinds.includes(rawKind) ? rawKind : 'pending-responses'

  const convoTypeFilter = Array.isArray(source.convoTypeFilter)
    ? (source.convoTypeFilter.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean))
    : (Array.isArray(fallback.convoTypeFilter) ? fallback.convoTypeFilter : [])

  const canonicalConvoTypeFilter = canonicalizePviTypeNames(convoTypeFilter)

  return {
    taskKey: normalizeText(source.taskKey, fallback.taskKey || ''),
    notifyKind,
    convoTypeFilter: canonicalConvoTypeFilter,
    enabled: normalizeBoolean(source.enabled, fallback.enabled ?? true),
    schedule: {
      kind: ['daily', 'weekly', 'manual'].includes(source.schedule?.kind)
        ? source.schedule.kind
        : (fallback.schedule?.kind || 'daily'),
    },
    timeoutMs: normalizeInteger(source.timeoutMs, fallback.timeoutMs || 120000, 1000, 900000),
    retryPolicy: {
      maxRetries: normalizeInteger(source.retryPolicy?.maxRetries, fallback.retryPolicy?.maxRetries || 0, 0, 5),
    },
    dependsOn: normalizeStringList(source.dependsOn, fallback.dependsOn || []),
  }
}

function normalizeNotificationSettings(input = {}) {
  const defaults = cloneDefaultSettings()
  const weeklySource = input.weeklyRequest || input.weeklyDigest || {}
  const weeklyRequestWeekday = normalizeInteger(
    weeklySource.requestWeekday ?? input.schedule?.weeklyRequestWeekday ?? input.schedule?.weeklyDigestWeekday,
    defaults.schedule.weeklyRequestWeekday,
    0,
    6
  )

  return {
    schedule: {
      dailyRunHour: normalizeInteger(input.schedule?.dailyRunHour, defaults.schedule.dailyRunHour, 0, 23),
      dailyRunMinute: normalizeInteger(input.schedule?.dailyRunMinute, defaults.schedule.dailyRunMinute, 0, 59),
      weeklyRequestWeekday,
    },
    typeGroups: {
      weeklyTypeNames: canonicalizePviTypeNames(
        normalizeStringList(input.typeGroups?.weeklyTypeNames, defaults.typeGroups.weeklyTypeNames)
      ),
      sortidaTypeNames: Array.isArray(input.typeGroups?.sortidaTypeNames)
        ? canonicalizePviTypeNames(normalizeStringList(input.typeGroups?.sortidaTypeNames, []))
        : defaults.typeGroups.sortidaTypeNames,
      availabilityManagerNCarnets: Array.isArray(input.typeGroups?.availabilityManagerNCarnets)
        ? normalizeStringList(input.typeGroups?.availabilityManagerNCarnets, [])
        : defaults.typeGroups.availabilityManagerNCarnets,
      guardiaSourceTypeName: normalizeText(input.typeGroups?.guardiaSourceTypeName, defaults.typeGroups.guardiaSourceTypeName),
      guardiaPviTypeName: canonicalizePviTypeName(
        normalizeText(input.typeGroups?.guardiaPviTypeName, defaults.typeGroups.guardiaPviTypeName)
      ),
    },
    responseRequest: {
      sendOnCreationForNonWeekly: normalizeBoolean(
        input.responseRequest?.sendOnCreationForNonWeekly,
        defaults.responseRequest.sendOnCreationForNonWeekly
      ),
      pendingLeadDays: normalizeInteger(
        input.responseRequest?.pendingLeadDays,
        defaults.responseRequest.pendingLeadDays,
        0,
        30
      ),
      pendingLeadHours: normalizeInteger(
        input.responseRequest?.pendingLeadHours,
        defaults.responseRequest.pendingLeadHours,
        0,
        720
      ),
      link: normalizeText(input.responseRequest?.link, defaults.responseRequest.link),
      creationTitle: normalizeText(input.responseRequest?.creationTitle, defaults.responseRequest.creationTitle),
      creationBody: normalizeText(input.responseRequest?.creationBody, defaults.responseRequest.creationBody),
      fireTitle: normalizeText(input.responseRequest?.fireTitle, defaults.responseRequest.fireTitle),
      fireBody: normalizeText(input.responseRequest?.fireBody, defaults.responseRequest.fireBody),
      weeklyCreatedTitle: normalizeText(input.responseRequest?.weeklyCreatedTitle, defaults.responseRequest.weeklyCreatedTitle),
      weeklyCreatedBody: normalizeText(input.responseRequest?.weeklyCreatedBody, defaults.responseRequest.weeklyCreatedBody),
      pendingTitle: normalizeText(input.responseRequest?.pendingTitle, defaults.responseRequest.pendingTitle),
      pendingBody: normalizeText(input.responseRequest?.pendingBody, defaults.responseRequest.pendingBody),
    },
    availabilityMatching: {
      conflictPolicy: ['unavailable-wins', 'available-wins', 'skip-on-conflict'].includes(
        input.availabilityMatching?.conflictPolicy
      )
        ? input.availabilityMatching.conflictPolicy
        : defaults.availabilityMatching.conflictPolicy,
      createAvailableResponses: normalizeBoolean(
        input.availabilityMatching?.createAvailableResponses,
        defaults.availabilityMatching.createAvailableResponses
      ),
      createUnavailableResponses: normalizeBoolean(
        input.availabilityMatching?.createUnavailableResponses,
        defaults.availabilityMatching.createUnavailableResponses
      ),
      autoCreateUnavailableForUsersWithoutWindow: normalizeBoolean(
        input.availabilityMatching?.autoCreateUnavailableForUsersWithoutWindow,
        defaults.availabilityMatching.autoCreateUnavailableForUsersWithoutWindow
      ),
      notifyOnAutoAvailableResponse: normalizeBoolean(
        input.availabilityMatching?.notifyOnAutoAvailableResponse,
        defaults.availabilityMatching.notifyOnAutoAvailableResponse
      ),
    },
    hourComputation: {
      campaignStartDate: normalizeText(input.hourComputation?.campaignStartDate, '') || null,
      campaignEndDate: normalizeText(input.hourComputation?.campaignEndDate, '') || null,
      unansweredPenaltyThreshold: normalizeInteger(
        input.hourComputation?.unansweredPenaltyThreshold,
        defaults.hourComputation.unansweredPenaltyThreshold,
        0,
        365
      ),
      unansweredPenaltyHours: normalizeInteger(
        input.hourComputation?.unansweredPenaltyHours,
        defaults.hourComputation.unansweredPenaltyHours,
        0,
        24
      ),
      noShowPenaltyHours: normalizeInteger(
        input.hourComputation?.noShowPenaltyHours,
        defaults.hourComputation.noShowPenaltyHours,
        0,
        24
      ),
    },
    campaignForm: {
      vehicleCatalog: Array.isArray(input.campaignForm?.vehicleCatalog)
        ? normalizeVehicleCatalog(input.campaignForm?.vehicleCatalog, defaults.campaignForm.vehicleCatalog)
        : defaults.campaignForm.vehicleCatalog,
    },
    weeklyRequest: {
      enabled: normalizeBoolean(weeklySource.enabled, defaults.weeklyRequest.enabled),
      requestWeekday: weeklyRequestWeekday,
      requestHour: normalizeInteger(weeklySource.requestHour, defaults.weeklyRequest.requestHour, 0, 23),
      requestMinute: normalizeInteger(weeklySource.requestMinute, defaults.weeklyRequest.requestMinute, 0, 59),
      link: normalizeText(weeklySource.link, defaults.weeklyRequest.link),
      title: normalizeText(weeklySource.title, defaults.weeklyRequest.title),
      body: normalizeText(weeklySource.body, defaults.weeklyRequest.body),
    },
    sortidaStatus: {
      enabled: normalizeBoolean(input.sortidaStatus?.enabled, defaults.sortidaStatus.enabled),
      confirmDaysBefore: normalizeInteger(
        input.sortidaStatus?.confirmDaysBefore,
        defaults.sortidaStatus.confirmDaysBefore,
        0,
        30
      ),
      confirmHour: normalizeInteger(input.sortidaStatus?.confirmHour, defaults.sortidaStatus.confirmHour, 0, 23),
      confirmMinute: normalizeInteger(input.sortidaStatus?.confirmMinute, defaults.sortidaStatus.confirmMinute, 0, 59),
      link: normalizeText(input.sortidaStatus?.link, defaults.sortidaStatus.link),
      titleYes: normalizeText(input.sortidaStatus?.titleYes, defaults.sortidaStatus.titleYes),
      bodyYes: normalizeText(input.sortidaStatus?.bodyYes, defaults.sortidaStatus.bodyYes),
      titleNo: normalizeText(input.sortidaStatus?.titleNo, defaults.sortidaStatus.titleNo),
      bodyNo: normalizeText(input.sortidaStatus?.bodyNo, defaults.sortidaStatus.bodyNo),
      titleCancelled: normalizeText(input.sortidaStatus?.titleCancelled, defaults.sortidaStatus.titleCancelled),
      bodyCancelled: normalizeText(input.sortidaStatus?.bodyCancelled, defaults.sortidaStatus.bodyCancelled),
      titleReten: normalizeText(input.sortidaStatus?.titleReten, defaults.sortidaStatus.titleReten),
      bodyReten: normalizeText(input.sortidaStatus?.bodyReten, defaults.sortidaStatus.bodyReten),
    },
    automation: {
      retentionDays: normalizeInteger(input.automation?.retentionDays, defaults.automation.retentionDays, 1, 60),
      viewerNCarnets: Array.isArray(input.automation?.viewerNCarnets)
        ? normalizeStringList(input.automation?.viewerNCarnets, [])
        : defaults.automation.viewerNCarnets,
      developerNCarnets: Array.isArray(input.automation?.developerNCarnets)
        ? normalizeStringList(input.automation?.developerNCarnets, [])
        : defaults.automation.developerNCarnets,
      monitoring: {
        enabled: normalizeBoolean(input.automation?.monitoring?.enabled, defaults.automation.monitoring.enabled),
        alertRecipientNCarnets: Array.isArray(input.automation?.monitoring?.alertRecipientNCarnets)
          ? normalizeStringList(input.automation?.monitoring?.alertRecipientNCarnets, [])
          : defaults.automation.monitoring.alertRecipientNCarnets,
        alertOnMissedRun: normalizeBoolean(input.automation?.monitoring?.alertOnMissedRun, defaults.automation.monitoring.alertOnMissedRun),
        alertOnTaskFailure: normalizeBoolean(input.automation?.monitoring?.alertOnTaskFailure, defaults.automation.monitoring.alertOnTaskFailure),
      },
      tasks: Array.isArray(input.automation?.tasks) && input.automation.tasks.length > 0
        ? input.automation.tasks.map((task, index) => normalizeAutomationTask(task, defaults.automation.tasks[index]))
          .filter((task) => Boolean(task.taskKey))
        : defaults.automation.tasks,
    },
  }
}

function ensureNotificationSettingsFile() {
  const dirPath = path.dirname(NOTIFICATION_SETTINGS_PATH)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  if (!fs.existsSync(NOTIFICATION_SETTINGS_PATH)) {
    fs.writeFileSync(NOTIFICATION_SETTINGS_PATH, JSON.stringify(cloneDefaultSettings(), null, 2) + '\n', 'utf8')
  }
}

function readNotificationSettings() {
  ensureNotificationSettingsFile()

  const raw = fs.readFileSync(NOTIFICATION_SETTINGS_PATH, 'utf8')
  const parsed = JSON.parse(raw)
  const normalized = normalizeNotificationSettings(parsed)

  if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
    fs.writeFileSync(NOTIFICATION_SETTINGS_PATH, JSON.stringify(normalized, null, 2) + '\n', 'utf8')
  }

  return normalized
}

function writeNotificationSettings(payload) {
  ensureNotificationSettingsFile()
  const normalized = normalizeNotificationSettings(payload)
  fs.writeFileSync(NOTIFICATION_SETTINGS_PATH, JSON.stringify(normalized, null, 2) + '\n', 'utf8')
  return normalized
}

function updateNotificationSettings(partialPayload) {
  const current = readNotificationSettings()

  const merged = {
    ...current,
    ...partialPayload,
    schedule: {
      ...current.schedule,
      ...(partialPayload.schedule || {}),
    },
    typeGroups: {
      ...current.typeGroups,
      ...(partialPayload.typeGroups || {}),
    },
    responseRequest: {
      ...current.responseRequest,
      ...(partialPayload.responseRequest || {}),
    },
    availabilityMatching: {
      ...current.availabilityMatching,
      ...(partialPayload.availabilityMatching || {}),
    },
    hourComputation: {
      ...(current.hourComputation || {}),
      ...(partialPayload.hourComputation || {}),
    },
    campaignForm: {
      ...(current.campaignForm || {}),
      ...(partialPayload.campaignForm || {}),
    },
    weeklyDigest: {
      ...(current.weeklyDigest || {}),
      ...(partialPayload.weeklyDigest || {}),
    },
    weeklyRequest: {
      ...(current.weeklyRequest || {}),
      ...(partialPayload.weeklyRequest || {}),
    },
    sortidaStatus: {
      ...current.sortidaStatus,
      ...(partialPayload.sortidaStatus || {}),
    },
    automation: {
      ...current.automation,
      ...(partialPayload.automation || {}),
      monitoring: {
        ...(current.automation?.monitoring || {}),
        ...(partialPayload.automation?.monitoring || {}),
      },
    },
  }

  return writeNotificationSettings(merged)
}

module.exports = {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_SETTINGS_PATH,
  readNotificationSettings,
  updateNotificationSettings,
  writeNotificationSettings,
}