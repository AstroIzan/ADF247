const express = require('express')

const { requireAuth } = require('../../middlewares/auth.middleware')
const { createSimpleRateLimit } = require('../../middlewares/rate-limit.middleware')
const logsController = require('./logs.controller')

const router = express.Router()

const clientLogsRateLimit = createSimpleRateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyPrefix: 'client-logs',
})

router.post('/client', clientLogsRateLimit, logsController.createClientLog)
router.get('/access', requireAuth, logsController.getLogsAccess)
router.get('/search', requireAuth, logsController.searchLogs)

module.exports = router
