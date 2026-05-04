const plaAlfaService = require('./pla-alfa.service')
const { readPlaAlfaSelection } = require('./pla-alfa.config')

function sendErrorResponse(res, error) {
  const statusCode = error.statusCode || 500
  const payload = {
    message: error.message || 'Ha ocurrido un error interno en el servidor.',
  }

  if (error.details) {
    payload.details = error.details
  }

  res.status(statusCode).json(payload)
}

function parseForceRefreshFlag(value) {
  const text = String(value || '').trim().toLowerCase()
  return text === '1' || text === 'true' || text === 'yes'
}

async function getMunicipalitiesPlaAlfaStatus(req, res) {
  try {
    const forceRefresh = parseForceRefreshFlag(req.query?.refresh) || parseForceRefreshFlag(req.query?.forceRefresh)
    const result = await plaAlfaService.getPlaAlfaMunicipalitiesStatus({ forceRefresh })
    res.json(result)
  } catch (error) {
    try {
      const selection = readPlaAlfaSelection()
      const fallbackRows = (selection?.municipalities || []).map((municipality) => ({
        municipality,
        isPrincipal: municipality === (selection?.principalMunicipality || null),
        comarca: null,
        todayLevel: null,
        tomorrowLevel: null,
        todayForecast: null,
        todayForecastSource: null,
        tomorrowForecast: null,
        tomorrowForecastSource: null,
        forecastSource: null,
        todayObjectId: null,
        tomorrowObjectId: null,
        foundToday: false,
        foundTomorrow: false,
      }))

      res.status(200).json({
        updatedAt: new Date().toISOString(),
        principalMunicipality: selection?.principalMunicipality || null,
        municipalities: fallbackRows,
        warnings: [
          {
            source: 'pla-alfa-status',
            message: error?.message || 'No s\'ha pogut actualitzar Pla Alfa en temps real.',
            details: error?.details || null,
          },
        ],
      })
      return
    } catch {
      sendErrorResponse(res, error)
    }
  }
}

async function getMunicipalitiesPlaAlfaCatalog(_req, res) {
  try {
    const result = await plaAlfaService.getPlaAlfaMunicipalitiesCatalog()
    res.json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function updateMunicipalitiesPlaAlfaSelection(req, res) {
  try {
    const result = await plaAlfaService.updatePlaAlfaMunicipalitiesSelection(req.body)
    res.json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = {
  getMunicipalitiesPlaAlfaCatalog,
  getMunicipalitiesPlaAlfaStatus,
  updateMunicipalitiesPlaAlfaSelection,
}
