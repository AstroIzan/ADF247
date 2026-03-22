const express = require('express')

const { requireAuth } = require('../../middlewares/auth.middleware')
const authController = require('./auth.controller')

const router = express.Router()

router.post('/login', authController.login)
router.post('/refresh', authController.refreshSession)
router.get('/me', requireAuth, authController.getCurrentUser)

module.exports = router