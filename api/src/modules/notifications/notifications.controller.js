const notificationsService = require('./notifications.service')

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

async function registerDeviceToken(req, res) {
  try {
    const result = await notificationsService.registerDeviceToken(req.auth, req.body, req.headers['user-agent'])
    res.status(201).json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function deactivateDeviceToken(req, res) {
  try {
    const result = await notificationsService.deactivateDeviceToken(req.auth, req.body)
    res.json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function sendBroadcastNotification(req, res) {
  try {
    const result = await notificationsService.sendBroadcastNotification(req.auth, req.body)
    res.status(201).json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function getNotificationLogs(req, res) {
  try {
    const result = await notificationsService.getNotificationLogs(req.auth, req.query)
    res.json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = {
  deactivateDeviceToken,
  getNotificationLogs,
  registerDeviceToken,
  sendBroadcastNotification,
}
