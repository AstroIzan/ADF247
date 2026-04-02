const express = require('express')
const { requireAuth } = require('../../middlewares/auth.middleware')
const availabilityController = require('./availability.controller')

const router = express.Router()

router.route('/windows')
  .get(requireAuth, availabilityController.getAvailabilityWindows)
  .post(requireAuth, availabilityController.createAvailabilityWindow)

router.route('/windows/:id')
  .put(requireAuth, availabilityController.updateAvailabilityWindow)
  .delete(requireAuth, availabilityController.deleteAvailabilityWindow)

module.exports = router
