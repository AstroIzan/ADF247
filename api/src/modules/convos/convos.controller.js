const convosService = require('./convos.service')

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

async function getConvoTypes(_req, res) {
  try {
    const convoTypes = await convosService.getAllConvoTypes()
    res.json(convoTypes)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function getConvoTypeById(req, res) {
  try {
    const convoTypeId = parsePositiveInt(req.params.id, 'id')
    const convoType = await convosService.getConvoTypeById(convoTypeId)
    res.json(convoType)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function createConvoType(req, res) {
  try {
    const convoType = await convosService.createConvoType(req.body)
    res.status(201).json(convoType)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function updateConvoType(req, res) {
  try {
    const convoTypeId = parsePositiveInt(req.params.id, 'id')
    const convoType = await convosService.updateConvoType(convoTypeId, req.body)
    res.json(convoType)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function deleteConvoType(req, res) {
  try {
    const convoTypeId = parsePositiveInt(req.params.id, 'id')
    const convoType = await convosService.deleteConvoType(convoTypeId)
    res.json(convoType)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function getConvocatorias(_req, res) {
  try {
    const convocatorias = await convosService.getAllConvocatorias()
    res.json(convocatorias)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function getConvocatoriaById(req, res) {
  try {
    const convocatoriaId = parsePositiveInt(req.params.id, 'id')
    const convocatoria = await convosService.getConvocatoriaById(convocatoriaId)
    res.json(convocatoria)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function createConvocatoria(req, res) {
  try {
    const convocatoria = await convosService.createConvocatoria(req.body)
    res.status(201).json(convocatoria)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function updateConvocatoria(req, res) {
  try {
    const convocatoriaId = parsePositiveInt(req.params.id, 'id')
    const convocatoria = await convosService.updateConvocatoria(convocatoriaId, req.body)
    res.json(convocatoria)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function deleteConvocatoria(req, res) {
  try {
    const convocatoriaId = parsePositiveInt(req.params.id, 'id')
    const convocatoria = await convosService.deleteConvocatoria(convocatoriaId)
    res.json(convocatoria)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = {
  createConvocatoria,
  createConvoType,
  deleteConvocatoria,
  deleteConvoType,
  getConvocatoriaById,
  getConvocatorias,
  getConvoTypeById,
  getConvoTypes,
  updateConvocatoria,
  updateConvoType,
}
