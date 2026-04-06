const fs = require('fs')
const path = require('path')

const {
  LOG_INDEX_APP,
  LOG_INDEX_ACCESS,
  LOG_ROOT_DIR,
  getClientLoggerForIndex,
  normalizeClientLevel,
} = require('../../config/logger')
const { readNotificationSettings } = require('../notifications/notifications.config')

function resolveEnvironmentTag(rawNodeEnv) {
  const value = String(rawNodeEnv || 'development').trim().toLowerCase()
  return value === 'production' || value === 'pro' ? 'pro' : 'dev'
}

const SERVER_ENVIRONMENT = resolveEnvironmentTag(process.env.NODE_ENV)

const INDEX_METADATA = {
  [LOG_INDEX_APP]: {
    key: LOG_INDEX_APP,
    label: 'applogs',
    description: 'Eventos funcionales de API y cliente (info/warn/error).',
  },
  [LOG_INDEX_ACCESS]: {
    key: LOG_INDEX_ACCESS,
    label: 'accesslogs',
    description: 'Peticiones HTTP de API y cliente para observabilidad de trafico.',
  },
}

function createForbiddenError() {
  const error = new Error('No tienes permisos para consultar logs. Solo developers autorizados.')
  error.statusCode = 403
  return error
}

function isDeveloperNCarnet(nCarnet) {
  const settings = readNotificationSettings()
  const developers = settings?.automation?.developerNCarnets || []
  return Array.isArray(developers) && developers.includes(nCarnet)
}

function ensureDeveloperAccess(authUser) {
  if (!authUser?.nCarnet || !isDeveloperNCarnet(authUser.nCarnet)) {
    throw createForbiddenError()
  }
}

function getIndexCandidates(indexKey) {
  if (indexKey === LOG_INDEX_ACCESS) {
    return [{
      dirPath: path.join(LOG_ROOT_DIR, 'accesslogs'),
      prefixes: [LOG_INDEX_ACCESS],
    }, {
      // Legacy compatibility: keep reading old directory/prefix while migrating.
      dirPath: path.join(LOG_ROOT_DIR, 'issserverlogs'),
      prefixes: ['issserverlogs'],
    }]
  }

  return [
    {
      dirPath: path.join(LOG_ROOT_DIR, 'api'),
      prefixes: [LOG_INDEX_APP, 'application'],
    },
    {
      dirPath: path.join(LOG_ROOT_DIR, 'client'),
      prefixes: [LOG_INDEX_APP, 'application'],
    },
  ]
}

function listLogFiles(indexKey) {
  const candidates = getIndexCandidates(indexKey)
  const files = []

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate.dirPath)) {
      continue
    }

    const dirEntries = fs.readdirSync(candidate.dirPath)
    for (const entry of dirEntries) {
      if (!entry.endsWith('.log')) {
        continue
      }

      if (!candidate.prefixes.some((prefix) => entry.startsWith(`${prefix}-`))) {
        continue
      }

      files.push(path.join(candidate.dirPath, entry))
    }
  }

  return files.sort((a, b) => b.localeCompare(a))
}

function safeParseLogLine(line) {
  if (!line || typeof line !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(line)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function includesText(log, query) {
  if (!query) {
    return true
  }

  const haystack = JSON.stringify(log).toLowerCase()
  return haystack.includes(query.toLowerCase())
}

function parseSearchExpression(rawQuery) {
  const query = String(rawQuery || '').trim()
  if (!query) {
    return {
      textTerms: [],
      fieldTerms: [],
    }
  }

  const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || []
  const textTerms = []
  const fieldTerms = []

  for (const token of tokens) {
    const separatorIndex = token.indexOf(':')
    if (separatorIndex > 0) {
      const field = normalizeSearchFieldAlias(token.slice(0, separatorIndex).trim())
      let value = token.slice(separatorIndex + 1).trim()
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }

      if (field && value) {
        fieldTerms.push({ field: field.toLowerCase(), value: value.toLowerCase() })
        continue
      }
    }

    const normalized = token.replace(/^"|"$/g, '').trim().toLowerCase()
    if (normalized) {
      textTerms.push(normalized)
    }
  }

  return { textTerms, fieldTerms }
}

function normalizeSearchFieldAlias(fieldName) {
  const normalized = String(fieldName || '').trim().toLowerCase()

  if (normalized === 'application') {
    return 'service'
  }

  if (normalized === 'log.level' || normalized === 'loglevel') {
    return 'level'
  }

  return normalized
}

function resolveFieldValue(rawLog, fieldName) {
  const normalizedField = normalizeSearchFieldAlias(fieldName)
  if (!normalizedField) {
    return null
  }

  if (normalizedField.startsWith('context.')) {
    const contextKey = normalizedField.slice('context.'.length)
    const context = rawLog?.context
    if (!context || typeof context !== 'object') {
      return null
    }

    const contextEntry = Object.entries(context).find(([key]) => String(key).toLowerCase() === contextKey)
    return contextEntry ? contextEntry[1] : null
  }

  const direct = rawLog?.[normalizedField]
  if (direct !== undefined) {
    return direct
  }

  const entry = Object.entries(rawLog || {}).find(([key]) => String(key).toLowerCase() === normalizedField)
  return entry ? entry[1] : null
}

function matchesSearchExpression(rawLog, rawQuery) {
  const parsed = parseSearchExpression(rawQuery)

  if (parsed.textTerms.length > 0) {
    let haystack = null
    for (const term of parsed.textTerms) {
      if (term === 'application') {
        if (rawLog?.service) {
          continue
        }
        return false
      }

      if (term === 'log.level' || term === 'loglevel') {
        if (rawLog?.level) {
          continue
        }
        return false
      }

      if (!haystack) {
        // Include UI aliases in searchable text so free-text terms match visible labels.
        const searchView = {
          ...rawLog,
          application: rawLog?.service,
          'log.level': rawLog?.level,
        }
        haystack = JSON.stringify(searchView).toLowerCase()
      }

      if (!haystack.includes(term)) {
        return false
      }
    }
  }

  for (const fieldTerm of parsed.fieldTerms) {
    const fieldValue = resolveFieldValue(rawLog, fieldTerm.field)
    if (fieldValue == null) {
      return false
    }

    const normalizedFieldValue = String(fieldValue).toLowerCase()
    if (!normalizedFieldValue.includes(fieldTerm.value)) {
      return false
    }
  }

  return true
}

function normalizeDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function mapLogEntry(indexKey, rawLog) {
  return {
    index: indexKey,
    level: rawLog.level || 'info',
    message: rawLog.message || '',
    service: rawLog.service || 'unknown',
    environment: rawLog.environment || null,
    source: rawLog.source || null,
    timestamp: rawLog.timestamp || null,
    clientTimestamp: rawLog.clientTimestamp || null,
    serverTimestamp: rawLog.serverTimestamp || null,
    method: rawLog.method || null,
    path: rawLog.path || null,
    statusCode: rawLog.statusCode ?? null,
    durationMs: rawLog.durationMs ?? null,
    context: rawLog.context || null,
    ip: rawLog.ip || null,
    userAgent: rawLog.userAgent || null,
  }
}

function matchesFilters(rawLog, filters) {
  if (filters.level && String(rawLog.level || '').toLowerCase() !== filters.level) {
    return false
  }

  if (filters.source && String(rawLog.source || '').toLowerCase() !== String(filters.source).toLowerCase()) {
    return false
  }

  const date = normalizeDate(rawLog.timestamp || rawLog.serverTimestamp || rawLog.clientTimestamp)
  if (filters.from && (!date || date.getTime() < filters.from.getTime())) {
    return false
  }

  if (filters.to && (!date || date.getTime() > filters.to.getTime())) {
    return false
  }

  if (!matchesSearchExpression(rawLog, filters.query)) {
    return false
  }

  return true
}

function searchInFile(filePath, indexKey, filters, accumulator) {
  const rawContent = fs.readFileSync(filePath, 'utf8')
  const lines = rawContent.split('\n')

  for (const line of lines) {
    const parsed = safeParseLogLine(line)
    if (!parsed || !matchesFilters(parsed, filters)) {
      continue
    }

    accumulator.push(mapLogEntry(indexKey, parsed))
  }
}

function sortLogsByTimestampDesc(logs) {
  return logs.sort((a, b) => {
    const left = normalizeDate(a.timestamp || a.serverTimestamp || a.clientTimestamp)
    const right = normalizeDate(b.timestamp || b.serverTimestamp || b.clientTimestamp)

    const leftMs = left ? left.getTime() : 0
    const rightMs = right ? right.getTime() : 0
    return rightMs - leftMs
  })
}

function writeClientLog(entry, req) {
  const level = normalizeClientLevel(entry.level)
  const logger = getClientLoggerForIndex(entry.index)

  const payload = {
    index: entry.index,
    source: entry.source,
    environment: entry.environment || SERVER_ENVIRONMENT,
    clientTimestamp: entry.timestamp,
    serverTimestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
    path: req.originalUrl,
  }

  if (entry.context) {
    payload.context = entry.context
  }

  logger.log(level, entry.message, payload)
}

function getLogsAccess(authUser) {
  const allowed = Boolean(authUser?.nCarnet && isDeveloperNCarnet(authUser.nCarnet))

  return {
    allowed,
    indexes: Object.values(INDEX_METADATA),
  }
}

function searchLogs(authUser, filters) {
  ensureDeveloperAccess(authUser)

  const files = listLogFiles(filters.index)
  const results = []

  for (const filePath of files) {
    searchInFile(filePath, filters.index, filters, results)
  }

  const sorted = sortLogsByTimestampDesc(results)
  const offset = Math.min(filters.offset || 0, sorted.length)
  const pageSize = Number.isInteger(filters.limit) && filters.limit > 0
    ? filters.limit
    : Math.max(0, sorted.length - offset)
  const paginated = sorted.slice(offset, offset + pageSize)

  return {
    index: filters.index,
    total: sorted.length,
    offset,
    limit: pageSize,
    hasMore: offset + paginated.length < sorted.length,
    nextOffset: offset + paginated.length < sorted.length ? offset + paginated.length : null,
    items: paginated,
  }
}

module.exports = {
  getLogsAccess,
  searchLogs,
  writeClientLog,
}
