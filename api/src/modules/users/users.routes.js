const express = require('express')
const { requireAuth } = require('../../middlewares/auth.middleware')
const { createSimpleRateLimit } = require('../../middlewares/rate-limit.middleware')
const usersController = require('./users.controller')

const router = express.Router()
const importUsersRateLimit = createSimpleRateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyPrefix: 'users-import',
})

router.route('/')
  .get(requireAuth, usersController.getUsers)
  .post(requireAuth, usersController.createUser)

router.post('/import', requireAuth, importUsersRateLimit, usersController.importUsers)

router.route('/:id')
  .get(requireAuth, usersController.getUserById)
  .put(requireAuth, usersController.updateUser)
  .delete(requireAuth, usersController.deleteUser)

module.exports = router
