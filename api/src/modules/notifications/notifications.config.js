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
    weeklyTypeNames: ['Guardia', 'Guardia PVI', 'Semanal'],
    sortidaTypeNames: [],
    availabilityManagerNCarnets: [],
    guardiaSourceTypeName: 'Guardia',
    guardiaPviTypeName: 'Guardia PVI',
  },
  responseRequest: {
    sendOnCreationForNonWeekly: true,
    pendingLeadDays: 0,
    pendingLeadHours: 24,
    link: '/dashboard',
    creationTitle: 'Nova convocatòria per respondre',
    creationBody: '{title} ({type}) per al dia {date}. Revisa i respon la teva disponibilitat.',
    pendingTitle: 'Tens convocatòries pendents',
    pendingBody: 'Encara tens {count} convocatòries pendents per respondre.',
  },
  weeklyRequest: {
    enabled: true,
    requestWeekday: 5,
    requestHour: 19,
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
    titleYes: 'Demà sí que se surt',
    bodyYes: '{title} ({type}) està confirmada per demà {date}.',
    titleNo: 'Demà no se surt',
    bodyNo: '{title} ({type}) finalment no surt demà {date}.',
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
      weeklyTypeNames: normalizeStringList(input.typeGroups?.weeklyTypeNames, defaults.typeGroups.weeklyTypeNames),
      sortidaTypeNames: Array.isArray(input.typeGroups?.sortidaTypeNames)
        ? normalizeStringList(input.typeGroups?.sortidaTypeNames, [])
        : defaults.typeGroups.sortidaTypeNames,
      availabilityManagerNCarnets: Array.isArray(input.typeGroups?.availabilityManagerNCarnets)
        ? normalizeStringList(input.typeGroups?.availabilityManagerNCarnets, [])
        : defaults.typeGroups.availabilityManagerNCarnets,
      guardiaSourceTypeName: normalizeText(input.typeGroups?.guardiaSourceTypeName, defaults.typeGroups.guardiaSourceTypeName),
      guardiaPviTypeName: normalizeText(input.typeGroups?.guardiaPviTypeName, defaults.typeGroups.guardiaPviTypeName),
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
      pendingTitle: normalizeText(input.responseRequest?.pendingTitle, defaults.responseRequest.pendingTitle),
      pendingBody: normalizeText(input.responseRequest?.pendingBody, defaults.responseRequest.pendingBody),
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