const express = require('express')
const usersController = require('./users.controller')

const router = express.Router()

router.route('/')
  .get(usersController.getUsers)
  .post(usersController.createUser)

router.route('/:id')
  .get(usersController.getUserById)
  .put(usersController.updateUser)
  .delete(usersController.deleteUser)

module.exports = router
