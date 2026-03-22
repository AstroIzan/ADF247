const authService = require('./auth.service')

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

async function login(req, res) {
  try {
    const session = await authService.login(req.body)
    res.json(session)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function refreshSession(req, res) {
  try {
    const session = await authService.refreshSession(req.body)
    res.json(session)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await authService.getCurrentUser(req.auth)
    res.json(user)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = {
  getCurrentUser,
  login,
  refreshSession,
}