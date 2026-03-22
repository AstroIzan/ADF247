const express = require('express')
const authRoutes = require('../modules/auth/auth.routes')
const convosRoutes = require('../modules/convos/convos.routes')
const dispoRoutes = require('../modules/dispo/dispo.routes')
const usersRoutes = require('../modules/users/users.routes')

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/convos', convosRoutes)
router.use('/dispo', dispoRoutes)
router.use('/users', usersRoutes)

module.exports = router