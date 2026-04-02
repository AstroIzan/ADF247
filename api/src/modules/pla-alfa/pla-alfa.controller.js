const plaAlfaService = require('./pla-alfa.service')

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

async function getMunicipalitiesPlaAlfaStatus(_req, res) {
  try {
    const result = await plaAlfaService.getPlaAlfaMunicipalitiesStatus()
    res.json(result)
  } catch (error) {
    sendErrorResponse(res, error)
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
