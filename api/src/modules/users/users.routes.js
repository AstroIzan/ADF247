const express = require('express')
const { createSimpleRateLimit } = require('../../middlewares/rate-limit.middleware')
const usersController = require('./users.controller')

const router = express.Router()
const importUsersRateLimit = createSimpleRateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyPrefix: 'users-import',
})

router.route('/')
  .get(usersController.getUsers)
  .post(usersController.createUser)

router.post('/import', importUsersRateLimit, usersController.importUsers)

router.route('/:id')
  .get(usersController.getUserById)
  .put(usersController.updateUser)
  .delete(usersController.deleteUser)

module.exports = router
