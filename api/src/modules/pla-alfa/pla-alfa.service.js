const https = require('https')
const {
  readPlaAlfaSelection,
  readPlaAlfaMunicipalities,
  updatePlaAlfaMunicipalities,
} = require('./pla-alfa.config')

const ARC_GIS_TIMEOUT_MS = 10000
const ARC_GIS_QUERY_CHUNK_SIZE = 120
const AEMET_TIMEOUT_MS = 12000
const AEMET_BASE_URL = 'https://opendata.aemet.es/opendata'
const AEMET_MASTER_MUNICIPALITIES_PATH = '/api/maestro/municipios'
const AEMET_FORECAST_MUNICIPALITY_PATH = '/api/prediccion/especifica/municipio/diaria'
const AEMET_CACHE_TTL_MS = 12 * 60 * 60 * 1000
const AEMET_FORECAST_CACHE_TTL_MS = 20 * 60 * 1000
const AEMET_FORECAST_CONCURRENCY = 1
const PLA_ALFA_STATUS_CACHE_TTL_MS = 60 * 60 * 1000
const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const OPEN_METEO_FORECAST_CACHE_TTL_MS = 20 * 60 * 1000
const OPEN_METEO_FORECAST_CONCURRENCY = 2

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

const aemetMunicipalityCatalogCache = {
  updatedAt: 0,
  byNormalizedName: new Map(),
}
let aemetMunicipalityCatalogInFlightPromise = null

const aemetMunicipalityForecastCache = new Map()
const aemetMunicipalityForecastInFlight = new Map()

const openMeteoGeocodingCache = new Map()
const openMeteoGeocodingInFlight = new Map()
const openMeteoForecastCache = new Map()
const openMeteoForecastInFlight = new Map()

const plaAlfaStatusCache = {
  updatedAtMs: 0,
  municipalitiesKey: '',
  payload: null,
}
let plaAlfaStatusInFlightPromise = null

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

function normalizeComparableText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

function createIsoDateFromValue(value) {
  const text = String(value || '')
  return text.length >= 10 ? text.slice(0, 10) : null
}

function isCataloniaMatch(entry) {
  const text = normalizeComparableText(`${entry?.admin1 || ''} ${entry?.admin2 || ''} ${entry?.country || ''}`)
  return text.includes('catal')
}

function windDegreesToDirectionLabel(value) {
  const degrees = toFiniteNumber(value)
  if (degrees === null) {
    return null
  }

  const normalized = ((degrees % 360) + 360) % 360
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  const index = Math.round(normalized / 45) % labels.length
  return labels[index]
}

function toFiniteNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function mapWithConcurrency(items, concurrency, mapper) {
  if (!Array.isArray(items) || items.length === 0) {
    return Promise.resolve([])
  }

  const safeConcurrency = Math.max(1, Math.min(concurrency || 1, items.length))
  const results = new Array(items.length)
  let currentIndex = 0

  async function worker() {
    while (currentIndex < items.length) {
      const itemIndex = currentIndex
      currentIndex += 1
      results[itemIndex] = await mapper(items[itemIndex], itemIndex)
    }
  }

  const workers = Array.from({ length: safeConcurrency }, () => worker())
  return Promise.all(workers).then(() => results)
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function buildMunicipalitiesCacheKey(municipalities) {
  return municipalities.map((item) => normalizeMunicipalityName(item)).join('|')
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

function requestText(url, options = {}) {
  const requestUrl = new URL(url)
  const method = options.method || 'GET'
  const headers = options.headers || undefined
  const body = options.body || null
  const timeoutMs = Number.isInteger(options.timeoutMs) ? options.timeoutMs : ARC_GIS_TIMEOUT_MS

  return new Promise((resolve, reject) => {
    const request = https.request(requestUrl, {
      method,
      headers,
    }, (response) => {
      let rawBody = ''

      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        rawBody += chunk
      })

      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(createServiceError('El servicio externo no ha respondido correctamente.', 502, {
            statusCode: response.statusCode,
            endpoint: url,
          }))
          return
        }

        resolve(rawBody)
      })
    })

    if (body) {
      request.write(body)
    }

    request.end()

    request.setTimeout(timeoutMs, () => {
      request.destroy(createServiceError('Tiempo de espera agotado en la consulta externa.', 504, {
        endpoint: url,
      }))
    })

    request.on('error', (error) => {
      if (error.statusCode) {
        reject(error)
        return
      }

      reject(createServiceError('Error de red consultando un servicio externo.', 502, {
        endpoint: url,
        message: error.message,
      }))
    })
  })
}

async function requestJsonFromUrl(url, options = {}) {
  const rawBody = await requestText(url, options)

  try {
    return JSON.parse(rawBody)
  } catch {
    throw createServiceError('No se ha podido parsear una respuesta JSON externa.', 502, {
      endpoint: url,
    })
  }
}

async function requestJsonFromBaseUrl(baseUrl, queryParams, options = {}) {
  const url = new URL(baseUrl)

  for (const [key, value] of Object.entries(queryParams || {})) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    url.searchParams.set(key, String(value))
  }

  return requestJsonFromUrl(url.toString(), options)
}

function getAemetApiToken() {
  return String(process.env.AEMET_OPENDATA_API_KEY || '').trim()
}

function buildAemetGatewayUrl(pathname) {
  const token = getAemetApiToken()

  if (!token) {
    throw createServiceError('Falta configurar AEMET_OPENDATA_API_KEY.', 500)
  }

  const url = new URL(`${AEMET_BASE_URL}${pathname}`)
  url.searchParams.set('api_key', token)
  return url.toString()
}

function extractAemetMunicipalityCode(entry) {
  const candidates = [entry?.id, entry?.id_old, entry?.idOld]

  for (const candidate of candidates) {
    const match = String(candidate || '').match(/(\d{5})$/)
    if (match) {
      return match[1]
    }
  }

  return null
}

function pickMostRelevantDirection(directions, speeds) {
  if (!Array.isArray(directions) || !Array.isArray(speeds)) {
    return null
  }

  let bestDirection = null
  let bestSpeed = -Infinity

  for (let index = 0; index < speeds.length; index += 1) {
    const speed = toFiniteNumber(speeds[index])
    if (speed === null) {
      continue
    }

    if (speed > bestSpeed) {
      bestSpeed = speed
      bestDirection = directions[index] || directions[0] || null
    }
  }

  return bestDirection
}

function normalizeWindDirection(direction) {
  const value = String(direction || '').trim()
  return value || null
}

function pushWindCandidate(candidates, speedValue, directionValue) {
  const speed = toFiniteNumber(speedValue)
  if (speed === null) {
    return
  }

  candidates.push({
    speed,
    direction: normalizeWindDirection(directionValue),
  })
}

function summarizeAemetDay(day) {
  if (!day || typeof day !== 'object') {
    return null
  }

  const temperature = day.temperatura || {}
  const humidity = day.humedadRelativa || {}
  const winds = Array.isArray(day.viento) ? day.viento : []
  const windCandidates = []

  for (const windPeriod of winds) {
    const speedValue = windPeriod?.velocidad
    const directionValue = windPeriod?.direccion

    if (Array.isArray(speedValue)) {
      for (let index = 0; index < speedValue.length; index += 1) {
        const direction = Array.isArray(directionValue)
          ? (directionValue[index] || directionValue[0] || null)
          : directionValue
        pushWindCandidate(windCandidates, speedValue[index], direction)
      }
      continue
    }

    if (Array.isArray(directionValue)) {
      const direction = pickMostRelevantDirection(directionValue, [speedValue])
      pushWindCandidate(windCandidates, speedValue, direction)
      continue
    }

    pushWindCandidate(windCandidates, speedValue, directionValue)
  }

  let maxWindSpeedKmh = null
  let windDirection = null
  for (const candidate of windCandidates) {
    if (maxWindSpeedKmh === null || candidate.speed > maxWindSpeedKmh) {
      maxWindSpeedKmh = candidate.speed
      windDirection = candidate.direction
    }
  }

  const summarized = {
    temperatureC: {
      min: toFiniteNumber(temperature.minima),
      max: toFiniteNumber(temperature.maxima),
    },
    humidityPct: {
      min: toFiniteNumber(humidity.minima),
      max: toFiniteNumber(humidity.maxima),
    },
    wind: {
      maxSpeedKmh: maxWindSpeedKmh,
      direction: windDirection,
    },
  }

  const hasTemperature = summarized.temperatureC.min !== null || summarized.temperatureC.max !== null
  const hasHumidity = summarized.humidityPct.min !== null || summarized.humidityPct.max !== null
  const hasWind = summarized.wind.maxSpeedKmh !== null || Boolean(summarized.wind.direction)

  return hasTemperature || hasHumidity || hasWind ? summarized : null
}

async function fetchAemetGatewayData(pathname) {
  const gatewayUrl = buildAemetGatewayUrl(pathname)
  const gatewayPayload = await requestJsonFromUrl(gatewayUrl, {
    timeoutMs: AEMET_TIMEOUT_MS,
  })

  const dataUrl = String(gatewayPayload?.datos || '').trim()
  if (!dataUrl) {
    throw createServiceError('AEMET no ha proporcionado URL de datos.', 502, {
      gateway: gatewayUrl,
      payload: gatewayPayload,
    })
  }

  return requestJsonFromUrl(dataUrl, {
    timeoutMs: AEMET_TIMEOUT_MS,
  })
}

async function getAemetMunicipalityCodesMap(options = {}) {
  const forceRefresh = Boolean(options.forceRefresh)
  const now = Date.now()
  if (!forceRefresh && aemetMunicipalityCatalogCache.updatedAt > 0 && (now - aemetMunicipalityCatalogCache.updatedAt) < AEMET_CACHE_TTL_MS) {
    return aemetMunicipalityCatalogCache.byNormalizedName
  }

  if (!forceRefresh && aemetMunicipalityCatalogInFlightPromise) {
    return aemetMunicipalityCatalogInFlightPromise
  }

  aemetMunicipalityCatalogInFlightPromise = (async () => {
    const masterData = await fetchAemetGatewayData(AEMET_MASTER_MUNICIPALITIES_PATH)
    const byNormalizedName = new Map()

    for (const item of masterData || []) {
      const municipalityName = String(item?.nombre || '').trim()
      const code = extractAemetMunicipalityCode(item)

      if (!municipalityName || !code) {
        continue
      }

      const normalized = normalizeComparableText(municipalityName)
      if (!normalized) {
        continue
      }

      if (!byNormalizedName.has(normalized)) {
        byNormalizedName.set(normalized, [])
      }

      byNormalizedName.get(normalized).push(code)
    }

    aemetMunicipalityCatalogCache.updatedAt = Date.now()
    aemetMunicipalityCatalogCache.byNormalizedName = byNormalizedName
    return byNormalizedName
  })()

  try {
    return await aemetMunicipalityCatalogInFlightPromise
  } finally {
    aemetMunicipalityCatalogInFlightPromise = null
  }
}

function getSingleAemetCodeForMunicipality(name, codesMap) {
  const normalized = normalizeComparableText(name)
  const codes = codesMap.get(normalized)

  if (!Array.isArray(codes) || !codes.length) {
    return null
  }

  return String(codes[0])
}

async function fetchAemetForecastByMunicipalityCode(code, options = {}) {
  const forceRefresh = Boolean(options.forceRefresh)
  const now = Date.now()
  const cacheKey = String(code)
  const cacheEntry = aemetMunicipalityForecastCache.get(cacheKey)

  if (!forceRefresh && cacheEntry && (now - cacheEntry.updatedAt) < AEMET_FORECAST_CACHE_TTL_MS) {
    return cacheEntry.byDate
  }

  const inFlight = aemetMunicipalityForecastInFlight.get(cacheKey)
  if (inFlight) {
    return inFlight
  }

  const requestPromise = (async () => {
    const endpoint = `${AEMET_FORECAST_MUNICIPALITY_PATH}/${encodeURIComponent(cacheKey)}`
    const payload = await fetchAemetGatewayData(endpoint)
    const firstEntry = Array.isArray(payload) ? payload[0] : null
    const days = Array.isArray(firstEntry?.prediccion?.dia) ? firstEntry.prediccion.dia : []

    const byDate = new Map()
    for (const day of days) {
      const date = createIsoDateFromValue(day?.fecha)
      if (!date) {
        continue
      }

      const summary = summarizeAemetDay(day)
      if (summary) {
        byDate.set(date, summary)
      }
    }

    aemetMunicipalityForecastCache.set(cacheKey, {
      updatedAt: Date.now(),
      byDate,
    })

    return byDate
  })()

  aemetMunicipalityForecastInFlight.set(cacheKey, requestPromise)

  try {
    return await requestPromise
  } finally {
    aemetMunicipalityForecastInFlight.delete(cacheKey)
  }
}

async function getAemetForecastForMunicipalities(municipalities, options = {}) {
  const forceRefresh = Boolean(options.forceRefresh)
  const token = getAemetApiToken()
  if (!token || !Array.isArray(municipalities) || municipalities.length === 0) {
    return {
      byMunicipality: new Map(),
      warnings: token ? [] : [{
        source: 'aemet',
        message: 'AEMET_OPENDATA_API_KEY no esta configurado.',
      }],
    }
  }

  const warnings = []
  let codesMap

  try {
    codesMap = await getAemetMunicipalityCodesMap({ forceRefresh })
  } catch (error) {
    warnings.push({
      source: 'aemet',
      message: error?.message || 'No se ha podido cargar el catalogo de municipios de AEMET.',
      details: error?.details || null,
    })

    return {
      byMunicipality: new Map(),
      warnings,
    }
  }

  const byMunicipality = new Map()

  await mapWithConcurrency(municipalities, AEMET_FORECAST_CONCURRENCY, async (municipality) => {
    const municipalityName = String(municipality || '')
    const code = getSingleAemetCodeForMunicipality(municipalityName, codesMap)

    if (!code) {
      warnings.push({
        source: 'aemet',
        municipality: municipalityName,
        message: 'No se ha encontrado codigo AEMET para el municipio.',
      })
      return
    }

    try {
      const byDate = await fetchAemetForecastByMunicipalityCode(code, { forceRefresh })
      byMunicipality.set(normalizeMunicipalityName(municipalityName), {
        code,
        byDate,
      })
    } catch (error) {
      warnings.push({
        source: 'aemet',
        municipality: municipalityName,
        message: error?.message || 'No se ha podido consultar prediccion diaria en AEMET.',
        details: error?.details || null,
      })
    }
  })

  return {
    byMunicipality,
    warnings,
  }
}

function mapOpenMeteoDailyToByDate(daily) {
  const dates = Array.isArray(daily?.time) ? daily.time : []
  const minTemp = Array.isArray(daily?.temperature_2m_min) ? daily.temperature_2m_min : []
  const maxTemp = Array.isArray(daily?.temperature_2m_max) ? daily.temperature_2m_max : []
  const minHumidity = Array.isArray(daily?.relative_humidity_2m_min) ? daily.relative_humidity_2m_min : []
  const maxHumidity = Array.isArray(daily?.relative_humidity_2m_max) ? daily.relative_humidity_2m_max : []
  const maxWind = Array.isArray(daily?.wind_speed_10m_max) ? daily.wind_speed_10m_max : []
  const windDirection = Array.isArray(daily?.wind_direction_10m_dominant) ? daily.wind_direction_10m_dominant : []

  const byDate = new Map()

  for (let index = 0; index < dates.length; index += 1) {
    const date = createIsoDateFromValue(dates[index])
    if (!date) {
      continue
    }

    const summary = {
      temperatureC: {
        min: toFiniteNumber(minTemp[index]),
        max: toFiniteNumber(maxTemp[index]),
      },
      humidityPct: {
        min: toFiniteNumber(minHumidity[index]),
        max: toFiniteNumber(maxHumidity[index]),
      },
      wind: {
        maxSpeedKmh: toFiniteNumber(maxWind[index]),
        direction: windDegreesToDirectionLabel(windDirection[index]),
      },
    }

    const hasTemperature = summary.temperatureC.min !== null || summary.temperatureC.max !== null
    const hasHumidity = summary.humidityPct.min !== null || summary.humidityPct.max !== null
    const hasWind = summary.wind.maxSpeedKmh !== null || summary.wind.direction !== null

    if (hasTemperature || hasHumidity || hasWind) {
      byDate.set(date, summary)
    }
  }

  return byDate
}

async function getOpenMeteoCoordinatesByMunicipality(name) {
  const cacheKey = normalizeComparableText(name)
  const cached = openMeteoGeocodingCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const inFlight = openMeteoGeocodingInFlight.get(cacheKey)
  if (inFlight) {
    return inFlight
  }

  const requestPromise = (async () => {
    const payload = await requestJsonFromBaseUrl(OPEN_METEO_GEOCODING_URL, {
      name,
      count: 10,
      language: 'es',
      countryCode: 'ES',
      format: 'json',
    }, {
      timeoutMs: AEMET_TIMEOUT_MS,
    })

    const results = Array.isArray(payload?.results) ? payload.results : []
    if (!results.length) {
      return null
    }

    const normalizedTarget = normalizeComparableText(name)
    const exact = results.find((entry) => normalizeComparableText(entry?.name) === normalizedTarget && isCataloniaMatch(entry))
    const catalonia = results.find((entry) => isCataloniaMatch(entry))
    const selected = exact || catalonia || results[0]

    const coordinates = {
      latitude: toFiniteNumber(selected?.latitude),
      longitude: toFiniteNumber(selected?.longitude),
    }

    if (coordinates.latitude === null || coordinates.longitude === null) {
      return null
    }

    openMeteoGeocodingCache.set(cacheKey, coordinates)
    return coordinates
  })()

  openMeteoGeocodingInFlight.set(cacheKey, requestPromise)

  try {
    return await requestPromise
  } finally {
    openMeteoGeocodingInFlight.delete(cacheKey)
  }
}

async function getOpenMeteoForecastByCoordinates(latitude, longitude, options = {}) {
  const forceRefresh = Boolean(options.forceRefresh)
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`
  const now = Date.now()
  const cached = openMeteoForecastCache.get(cacheKey)

  if (!forceRefresh && cached && (now - cached.updatedAt) < OPEN_METEO_FORECAST_CACHE_TTL_MS) {
    return cached.byDate
  }

  const inFlight = openMeteoForecastInFlight.get(cacheKey)
  if (inFlight) {
    return inFlight
  }

  const requestPromise = (async () => {
    const payload = await requestJsonFromBaseUrl(OPEN_METEO_FORECAST_URL, {
      latitude,
      longitude,
      daily: [
        'temperature_2m_min',
        'temperature_2m_max',
        'relative_humidity_2m_min',
        'relative_humidity_2m_max',
        'wind_speed_10m_max',
        'wind_direction_10m_dominant',
      ].join(','),
      timezone: 'Europe/Madrid',
      forecast_days: 3,
    }, {
      timeoutMs: AEMET_TIMEOUT_MS,
    })

    const byDate = mapOpenMeteoDailyToByDate(payload?.daily)

    openMeteoForecastCache.set(cacheKey, {
      updatedAt: Date.now(),
      byDate,
    })

    return byDate
  })()

  openMeteoForecastInFlight.set(cacheKey, requestPromise)

  try {
    return await requestPromise
  } finally {
    openMeteoForecastInFlight.delete(cacheKey)
  }
}

async function getOpenMeteoFallbackForecastForMunicipalities(municipalities, options = {}) {
  const forceRefresh = Boolean(options.forceRefresh)
  if (!Array.isArray(municipalities) || municipalities.length === 0) {
    return {
      byMunicipality: new Map(),
      warnings: [],
    }
  }

  const warnings = []
  const byMunicipality = new Map()

  await mapWithConcurrency(municipalities, OPEN_METEO_FORECAST_CONCURRENCY, async (municipality) => {
    const municipalityName = String(municipality || '')

    try {
      const coordinates = await getOpenMeteoCoordinatesByMunicipality(municipalityName)
      if (!coordinates) {
        warnings.push({
          source: 'open-meteo',
          municipality: municipalityName,
          message: 'No se han encontrado coordenadas de municipio en Open-Meteo.',
        })
        return
      }

      const byDate = await getOpenMeteoForecastByCoordinates(coordinates.latitude, coordinates.longitude, { forceRefresh })
      byMunicipality.set(normalizeMunicipalityName(municipalityName), {
        byDate,
        coordinates,
      })
    } catch (error) {
      warnings.push({
        source: 'open-meteo',
        municipality: municipalityName,
        message: error?.message || 'No se ha podido consultar Open-Meteo.',
        details: error?.details || null,
      })
    }
  })

  return {
    byMunicipality,
    warnings,
  }
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

async function getPlaAlfaMunicipalitiesStatus(options = {}) {
  const forceRefresh = Boolean(options.forceRefresh)
  const { municipalities, principalMunicipality } = readPlaAlfaSelection()
  const municipalitiesKey = buildMunicipalitiesCacheKey(municipalities)

  if (!forceRefresh && plaAlfaStatusCache.payload && plaAlfaStatusCache.municipalitiesKey === municipalitiesKey) {
    const ageMs = Date.now() - plaAlfaStatusCache.updatedAtMs

    if (ageMs < PLA_ALFA_STATUS_CACHE_TTL_MS) {
      return cloneJson(plaAlfaStatusCache.payload)
    }
  }

  if (!forceRefresh && plaAlfaStatusInFlightPromise) {
    return plaAlfaStatusInFlightPromise
  }

  if (municipalities.length === 0) {
    const emptyPayload = {
      updatedAt: new Date().toISOString(),
      principalMunicipality: null,
      municipalities: [],
    }

    plaAlfaStatusCache.updatedAtMs = Date.now()
    plaAlfaStatusCache.municipalitiesKey = municipalitiesKey
    plaAlfaStatusCache.payload = emptyPayload
    return cloneJson(emptyPayload)
  }

  const computationPromise = (async () => {

  const todayDate = new Date()
  const tomorrowDate = new Date(Date.now() + (24 * 60 * 60 * 1000))
  const todayDateIso = todayDate.toISOString().slice(0, 10)
  const tomorrowDateIso = tomorrowDate.toISOString().slice(0, 10)

  const [todayResult, tomorrowResult, aemetForecastResult] = await Promise.allSettled([
    fetchPlaAlfaForDate(PLA_ALFA_SERVICES.today, municipalities),
    fetchPlaAlfaForDate(PLA_ALFA_SERVICES.tomorrow, municipalities),
    getAemetForecastForMunicipalities(municipalities, { forceRefresh }),
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

  const aemetForecastByMunicipality =
    aemetForecastResult.status === 'fulfilled'
      ? aemetForecastResult.value.byMunicipality
      : new Map()

  if (aemetForecastResult.status === 'fulfilled') {
    warnings.push(...(aemetForecastResult.value.warnings || []))
  } else {
    warnings.push({
      source: 'aemet',
      message: aemetForecastResult.reason?.message || 'No se ha podido consultar AEMET.',
      details: aemetForecastResult.reason?.details || null,
    })
  }

  const missingAemetMunicipalities = municipalities.filter((name) => {
    const byDate = aemetForecastByMunicipality.get(normalizeMunicipalityName(name))?.byDate
    if (!byDate) {
      return true
    }

    return !byDate.get(todayDateIso) || !byDate.get(tomorrowDateIso)
  })

  let openMeteoFallbackByMunicipality = new Map()
  if (missingAemetMunicipalities.length > 0) {
    try {
      const openMeteoResult = await getOpenMeteoFallbackForecastForMunicipalities(missingAemetMunicipalities, { forceRefresh })
      openMeteoFallbackByMunicipality = openMeteoResult.byMunicipality
      warnings.push(...(openMeteoResult.warnings || []))
    } catch (error) {
      warnings.push({
        source: 'open-meteo',
        message: error?.message || 'No se ha podido consultar Open-Meteo.',
        details: error?.details || null,
      })
    }
  }

  const result = municipalities.map((name) => {
    const normalized = normalizeMunicipalityName(name)
    const today = todayData.get(normalized)
    const tomorrow = tomorrowData.get(normalized)

    const weatherByDateAemet = aemetForecastByMunicipality.get(normalized)?.byDate || new Map()
    const weatherByDateFallback = openMeteoFallbackByMunicipality.get(normalized)?.byDate || new Map()

    const todayForecastAemet = weatherByDateAemet.get(todayDateIso) || null
    const todayForecastFallback = weatherByDateFallback.get(todayDateIso) || null
    const tomorrowForecastAemet = weatherByDateAemet.get(tomorrowDateIso) || null
    const tomorrowForecastFallback = weatherByDateFallback.get(tomorrowDateIso) || null

    const todayForecast = todayForecastAemet || todayForecastFallback || null
    const tomorrowForecast = tomorrowForecastAemet || tomorrowForecastFallback || null
    const todayForecastSource = todayForecastAemet ? 'aemet' : (todayForecastFallback ? 'open-meteo' : null)
    const tomorrowForecastSource = tomorrowForecastAemet ? 'aemet' : (tomorrowForecastFallback ? 'open-meteo' : null)

    let forecastSource = null
    if (todayForecastSource && tomorrowForecastSource) {
      forecastSource = todayForecastSource === tomorrowForecastSource ? todayForecastSource : 'mixed'
    } else {
      forecastSource = todayForecastSource || tomorrowForecastSource || null
    }

    return {
      municipality: name,
      isPrincipal: name === principalMunicipality,
      comarca: today?.comarca || tomorrow?.comarca || null,
      todayLevel: today?.level ?? null,
      tomorrowLevel: tomorrow?.level ?? null,
      todayForecast,
      todayForecastSource,
      tomorrowForecast,
      tomorrowForecastSource,
      forecastSource,
      todayObjectId: today?.objectId ?? null,
      tomorrowObjectId: tomorrow?.objectId ?? null,
      foundToday: Boolean(today),
      foundTomorrow: Boolean(tomorrow),
    }
  })

  const payload = {
    updatedAt: new Date().toISOString(),
    principalMunicipality,
    municipalities: result,
    warnings,
  }

  plaAlfaStatusCache.updatedAtMs = Date.now()
  plaAlfaStatusCache.municipalitiesKey = municipalitiesKey
  plaAlfaStatusCache.payload = payload

  return cloneJson(payload)
  })()

  if (!forceRefresh) {
    plaAlfaStatusInFlightPromise = computationPromise.finally(() => {
      plaAlfaStatusInFlightPromise = null
    })
    return plaAlfaStatusInFlightPromise
  }

  return computationPromise
}

async function getPlaAlfaMunicipalitiesCatalog() {
  const { municipalities: selected, principalMunicipality } = readPlaAlfaSelection()
  const selectedSet = new Set(selected.map(normalizeMunicipalityName))
  const catalog = await fetchAllMunicipalitiesCatalog()

  return {
    updatedAt: new Date().toISOString(),
    selectedMunicipalities: selected,
    principalMunicipality,
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
    principalMunicipality: payload.principalMunicipality,
  }
}

async function updatePlaAlfaMunicipalitiesSelection(payload) {
  const dto = buildUpdateMunicipalitiesDto(payload)
  const selection = updatePlaAlfaMunicipalities(dto.municipalities, dto.principalMunicipality)
  return {
    updatedAt: new Date().toISOString(),
    municipalities: selection.municipalities,
    principalMunicipality: selection.principalMunicipality,
  }
}

module.exports = {
  createServiceError,
  getPlaAlfaMunicipalitiesCatalog,
  getPlaAlfaMunicipalitiesStatus,
  updatePlaAlfaMunicipalitiesSelection,
}
