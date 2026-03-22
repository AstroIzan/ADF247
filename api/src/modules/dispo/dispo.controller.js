const dispoService = require('./dispo.service')

function parsePositiveInt(rawValue, fieldName) {
  const parsedValue = Number(rawValue)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    const error = new Error(`El parametro "${fieldName}" debe ser un numero entero positivo.`)
    error.statusCode = 400
    throw error
  }

  return parsedValue
}

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

function buildListFilters(query) {
  const filters = {}

  if (query.convoId !== undefined) {
    filters.convoId = parsePositiveInt(query.convoId, 'convoId')
  }

  if (query.userNCarnet !== undefined) {
    const userNCarnet = String(query.userNCarnet).trim()

    if (!userNCarnet) {
      const error = new Error('El parametro "userNCarnet" no puede estar vacio.')
      error.statusCode = 400
      throw error
    }

    filters.userNCarnet = userNCarnet
  }

  return filters
}

async function getRespuestas(req, res) {
  try {
    const filters = buildListFilters(req.query)
    const respuestas = await dispoService.getAllRespuestas(filters)
    res.json(respuestas)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function getRespuestaById(req, res) {
  try {
    const respuestaId = parsePositiveInt(req.params.id, 'id')
    const respuesta = await dispoService.getRespuestaById(respuestaId)
    res.json(respuesta)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function createRespuesta(req, res) {
  try {
    const respuesta = await dispoService.createRespuesta(req.body)
    res.status(201).json(respuesta)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function updateRespuesta(req, res) {
  try {
    const respuestaId = parsePositiveInt(req.params.id, 'id')
    const respuesta = await dispoService.updateRespuesta(respuestaId, req.body)
    res.json(respuesta)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function deleteRespuesta(req, res) {
  try {
    const respuestaId = parsePositiveInt(req.params.id, 'id')
    const respuesta = await dispoService.deleteRespuesta(respuestaId)
    res.json(respuesta)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = {
  createRespuesta,
  deleteRespuesta,
  getRespuestaById,
  getRespuestas,
  updateRespuesta,
}
