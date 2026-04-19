const express = require('express')
const availabilityRoutes = require('../modules/availability/availability.routes')
const authRoutes = require('../modules/auth/auth.routes')
const convosRoutes = require('../modules/convos/convos.routes')
const dispoRoutes = require('../modules/dispo/dispo.routes')
const notificationsRoutes = require('../modules/notifications/notifications.routes')
const plaAlfaRoutes = require('../modules/pla-alfa/pla-alfa.routes')
const usersRoutes = require('../modules/users/users.routes')

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/availability', availabilityRoutes)
router.use('/convos', convosRoutes)
router.use('/dispo', dispoRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/pla-alfa', plaAlfaRoutes)
router.use('/users', usersRoutes)

module.exports = router