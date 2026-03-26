const express = require('express')

const { requireAuth } = require('../../middlewares/auth.middleware')
const notificationsController = require('./notifications.controller')

const router = express.Router()

router.post('/device-token', requireAuth, notificationsController.registerDeviceToken)
router.get('/device-tokens', requireAuth, notificationsController.getCurrentUserDeviceTokens)
router.get('/device-tokens/all', requireAuth, notificationsController.getAllDeviceTokens)
router.delete('/device-token', requireAuth, notificationsController.deactivateDeviceToken)
router.post('/device-token/deactivate', requireAuth, notificationsController.deactivateDeviceToken)
router.get('/config', requireAuth, notificationsController.getNotificationConfig)
router.put('/config', requireAuth, notificationsController.updateNotificationConfig)
router.post('/broadcast', requireAuth, notificationsController.sendBroadcastNotification)
router.post('/dispatch/convocatoria/:convoId/response-request', requireAuth, notificationsController.sendConvocatoriaResponseRequest)
router.post('/dispatch/convocatoria/:convoId/sortida-status', requireAuth, notificationsController.sendConvocatoriaSortidaStatus)
router.post('/automation/convocatoria/:convoId/run', requireAuth, notificationsController.runConvocatoriaNotificationAutomation)
router.post('/automation/tasks/:taskKey/run', requireAuth, notificationsController.runNotificationAutomationTask)
router.get('/automation/runs', requireAuth, notificationsController.getAutomationRuns)
router.get('/automation/runs/:id', requireAuth, notificationsController.getAutomationRunById)
router.post('/dispatch/pending-responses', requireAuth, notificationsController.sendPendingResponsesReminder)
router.post('/dispatch/weekly-response-digest', requireAuth, notificationsController.sendWeeklyResponseDigest)
router.post('/dispatch/tomorrow-sortida', requireAuth, notificationsController.sendTomorrowSortidaNotifications)
router.post('/automation/run', requireAuth, notificationsController.runDailyNotificationAutomation)
router.put('/automation/config', requireAuth, notificationsController.updateNotificationConfig)
router.get('/logs', requireAuth, notificationsController.getNotificationLogs)

module.exports = router
