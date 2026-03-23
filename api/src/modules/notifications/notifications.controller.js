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

async function getCurrentUserDeviceTokens(req, res) {
  try {
    const result = await notificationsService.getCurrentUserDeviceTokens(req.auth)
    res.json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function getAllDeviceTokens(req, res) {
  try {
    const result = await notificationsService.getAllDeviceTokens(req.auth)
    res.json(result)
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

async function getNotificationConfig(req, res) {
  try {
    const result = await notificationsService.getNotificationConfig(req.auth)
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

async function updateNotificationConfig(req, res) {
  try {
    const result = await notificationsService.updateNotificationConfig(req.auth, req.body)
    res.json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function sendConvocatoriaResponseRequest(req, res) {
  try {
    const result = await notificationsService.sendConvocatoriaResponseRequest(req.auth, req.params.convoId)
    res.status(201).json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function sendConvocatoriaSortidaStatus(req, res) {
  try {
    const result = await notificationsService.sendConvocatoriaSortidaStatus(req.auth, req.params.convoId)
    res.status(201).json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function sendPendingResponsesReminder(req, res) {
  try {
    const result = await notificationsService.sendPendingResponsesReminder(req.auth)
    res.status(201).json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function sendWeeklyResponseDigest(req, res) {
  try {
    const result = await notificationsService.sendWeeklyResponseDigest(req.auth)
    res.status(201).json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function sendTomorrowSortidaNotifications(req, res) {
  try {
    const result = await notificationsService.sendTomorrowSortidaNotifications(req.auth)
    res.status(201).json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function runDailyNotificationAutomation(req, res) {
  try {
    const result = await notificationsService.runDailyNotificationAutomation(req.auth)
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
  getAllDeviceTokens,
  getCurrentUserDeviceTokens,
  getNotificationConfig,
  getNotificationLogs,
  registerDeviceToken,
  runDailyNotificationAutomation,
  sendConvocatoriaResponseRequest,
  sendConvocatoriaSortidaStatus,
  sendBroadcastNotification,
  sendPendingResponsesReminder,
  sendTomorrowSortidaNotifications,
  sendWeeklyResponseDigest,
  updateNotificationConfig,
}
