const availabilityService = require('./availability.service')

function parseWindowId(rawId) {
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error('El parametro "id" debe ser un numero entero positivo.')
    error.statusCode = 400
    throw error
  }

  return id
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

async function getAvailabilityWindows(req, res) {
  try {
    const windows = await availabilityService.getAvailabilityWindows(req.query, req.auth)
    res.json(windows)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function createAvailabilityWindow(req, res) {
  try {
    const window = await availabilityService.createAvailabilityWindow(req.body, req.auth)
    res.status(201).json(window)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function updateAvailabilityWindow(req, res) {
  try {
    const id = parseWindowId(req.params.id)
    const window = await availabilityService.updateAvailabilityWindow(id, req.body, req.auth)
    res.json(window)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function deleteAvailabilityWindow(req, res) {
  try {
    const id = parseWindowId(req.params.id)
    const deleted = await availabilityService.deleteAvailabilityWindow(id, req.auth)
    res.json(deleted)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = {
  createAvailabilityWindow,
  deleteAvailabilityWindow,
  getAvailabilityWindows,
  updateAvailabilityWindow,
}
