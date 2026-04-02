const https = require('https')
const {
  readPlaAlfaMunicipalities,
  updatePlaAlfaMunicipalities,
} = require('./pla-alfa.config')

const ARC_GIS_TIMEOUT_MS = 10000
const ARC_GIS_QUERY_CHUNK_SIZE = 120

const PLA_ALFA_SERVICES = {
  today: {
    url: 'https://services7.arcgis.com/ZCqVt1fRXwwK6GF4/ArcGIS/rest/services/Pla_Alfa_Municipal_Avui_FL_alternatiu_VW/FeatureServer/0/query',
    objectIdField: 'OBJECTID',
  },
  tomorrow: {
    url: 'https://services7.arcgis.com/ZCqVt1fRXwwK6GF4/ArcGIS/rest/services/pla_alfa_municipal_dema_FL_VW/FeatureServer/5/query',
    objectIdField: 'FID',
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

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''")
}

function createWhereClause(municipalities) {
  const names = municipalities.map((entry) => `'${escapeSqlString(entry)}'`).join(',')
  return `NOMMUNI IN (${names})`
}

function normalizeMunicipalityName(value) {
  return String(value || '').trim().toLowerCase()
}

function toIntegerOrNull(value) {
  return Number.isInteger(value) ? value : null
}

function splitInChunks(values, chunkSize) {
  const chunks = []

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize))
  }

  return chunks
}

function requestJson(url, queryParams) {
  const requestUrl = new URL(url)
  const body = new URLSearchParams(queryParams || {}).toString()
  const shouldUsePost = Boolean(body)

  return new Promise((resolve, reject) => {
    const request = https.request(requestUrl, {
      method: shouldUsePost ? 'POST' : 'GET',
      headers: shouldUsePost
        ? {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
          }
        : undefined,
    }, (response) => {
      let rawBody = ''

      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        rawBody += chunk
      })

      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(createServiceError('ArcGIS no ha respondido correctamente.', 502, {
            statusCode: response.statusCode,
            endpoint: url,
          }))
          return
        }

        try {
          const parsed = JSON.parse(rawBody)

          if (parsed?.error) {
            reject(createServiceError('ArcGIS ha devuelto un error al consultar Pla Alfa.', 502, parsed.error))
            return
          }

          resolve(parsed)
        } catch {
          reject(createServiceError('No se ha podido parsear la respuesta de ArcGIS.', 502, {
            endpoint: url,
          }))
        }
      })
    })

    if (shouldUsePost) {
      request.write(body)
    }

    request.end()

    request.setTimeout(ARC_GIS_TIMEOUT_MS, () => {
      request.destroy(createServiceError('Tiempo de espera agotado consultando ArcGIS.', 504))
    })

    request.on('error', (error) => {
      if (error.statusCode) {
        reject(error)
        return
      }

      reject(createServiceError('Error de red consultando ArcGIS.', 502, {
        message: error.message,
      }))
    })
  })
}

async function fetchPlaAlfaForDate(serviceConfig, municipalities) {
  const byMunicipality = new Map()

  const chunks = splitInChunks(municipalities, ARC_GIS_QUERY_CHUNK_SIZE)

  for (const chunk of chunks) {
    const payload = await requestJson(serviceConfig.url, {
      f: 'pjson',
      where: createWhereClause(chunk),
      outFields: `NOMMUNI,NOMCOMAR,PERIL_M,${serviceConfig.objectIdField}`,
      returnGeometry: 'false',
    })

    for (const feature of payload.features || []) {
      const attributes = feature?.attributes || {}
      const normalizedName = normalizeMunicipalityName(attributes.NOMMUNI)

      if (!normalizedName) {
        continue
      }

      byMunicipality.set(normalizedName, {
        name: attributes.NOMMUNI || null,
        comarca: attributes.NOMCOMAR || null,
        level: toIntegerOrNull(attributes.PERIL_M),
        objectId: attributes[serviceConfig.objectIdField] ?? null,
      })
    }
  }

  return byMunicipality
}

async function fetchAllMunicipalitiesCatalog() {
  const payload = await requestJson(PLA_ALFA_SERVICES.today.url, {
    f: 'pjson',
    where: '1=1',
    outFields: 'NOMMUNI,NOMCOMAR,OBJECTID',
    returnGeometry: 'false',
  })

  const byMunicipality = new Map()

  for (const feature of payload.features || []) {
    const attributes = feature?.attributes || {}
    const municipality = String(attributes.NOMMUNI || '').trim()

    if (!municipality) {
      continue
    }

    const normalized = normalizeMunicipalityName(municipality)

    byMunicipality.set(normalized, {
      municipality,
      comarca: attributes.NOMCOMAR || null,
      objectId: attributes.OBJECTID ?? null,
    })
  }

  return Array.from(byMunicipality.values()).sort((a, b) => a.municipality.localeCompare(b.municipality, 'ca'))
}

async function getPlaAlfaMunicipalitiesStatus() {
  const municipalities = readPlaAlfaMunicipalities()

  if (municipalities.length === 0) {
    return {
      updatedAt: new Date().toISOString(),
      municipalities: [],
    }
  }

  const [todayResult, tomorrowResult] = await Promise.allSettled([
    fetchPlaAlfaForDate(PLA_ALFA_SERVICES.today, municipalities),
    fetchPlaAlfaForDate(PLA_ALFA_SERVICES.tomorrow, municipalities),
  ])

  const warnings = []

  const todayData = todayResult.status === 'fulfilled' ? todayResult.value : new Map()
  if (todayResult.status === 'rejected') {
    warnings.push({
      source: 'today',
      message: todayResult.reason?.message || 'No se ha podido consultar ArcGIS para Avui.',
      details: todayResult.reason?.details || null,
    })
  }

  const tomorrowData = tomorrowResult.status === 'fulfilled' ? tomorrowResult.value : new Map()
  if (tomorrowResult.status === 'rejected') {
    warnings.push({
      source: 'tomorrow',
      message: tomorrowResult.reason?.message || 'No se ha podido consultar ArcGIS para Demà.',
      details: tomorrowResult.reason?.details || null,
    })
  }

  const result = municipalities.map((name) => {
    const normalized = normalizeMunicipalityName(name)
    const today = todayData.get(normalized)
    const tomorrow = tomorrowData.get(normalized)

    return {
      municipality: name,
      comarca: today?.comarca || tomorrow?.comarca || null,
      todayLevel: today?.level ?? null,
      tomorrowLevel: tomorrow?.level ?? null,
      todayObjectId: today?.objectId ?? null,
      tomorrowObjectId: tomorrow?.objectId ?? null,
      foundToday: Boolean(today),
      foundTomorrow: Boolean(tomorrow),
    }
  })

  return {
    updatedAt: new Date().toISOString(),
    municipalities: result,
    warnings,
  }
}

async function getPlaAlfaMunicipalitiesCatalog() {
  const selected = readPlaAlfaMunicipalities()
  const selectedSet = new Set(selected.map(normalizeMunicipalityName))
  const catalog = await fetchAllMunicipalitiesCatalog()

  return {
    updatedAt: new Date().toISOString(),
    selectedMunicipalities: selected,
    municipalities: catalog.map((item) => ({
      ...item,
      selected: selectedSet.has(normalizeMunicipalityName(item.municipality)),
    })),
  }
}

function buildUpdateMunicipalitiesDto(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createServiceError('El cuerpo de la peticion debe ser un objeto JSON valido.', 400)
  }

  if (!Array.isArray(payload.municipalities)) {
    throw createServiceError('El campo "municipalities" debe ser un array de strings.', 400)
  }

  return {
    municipalities: payload.municipalities,
  }
}

async function updatePlaAlfaMunicipalitiesSelection(payload) {
  const dto = buildUpdateMunicipalitiesDto(payload)
  const municipalities = updatePlaAlfaMunicipalities(dto.municipalities)
  return {
    updatedAt: new Date().toISOString(),
    municipalities,
  }
}

module.exports = {
  createServiceError,
  getPlaAlfaMunicipalitiesCatalog,
  getPlaAlfaMunicipalitiesStatus,
  updatePlaAlfaMunicipalitiesSelection,
}
