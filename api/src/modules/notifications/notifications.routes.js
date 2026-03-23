const express = require('express')

const { requireAuth } = require('../../middlewares/auth.middleware')
const notificationsController = require('./notifications.controller')

const router = express.Router()

router.post('/device-token', requireAuth, notificationsController.registerDeviceToken)
router.delete('/device-token', requireAuth, notificationsController.deactivateDeviceToken)
router.post('/device-token/deactivate', requireAuth, notificationsController.deactivateDeviceToken)
router.post('/broadcast', requireAuth, notificationsController.sendBroadcastNotification)
router.get('/logs', requireAuth, notificationsController.getNotificationLogs)

module.exports = router
