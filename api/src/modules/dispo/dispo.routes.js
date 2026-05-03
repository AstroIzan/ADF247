const express = require('express')
const { requireAuth } = require('../../middlewares/auth.middleware')
const dispoController = require('./dispo.controller')

const router = express.Router()

router.route('/')
  .get(requireAuth, dispoController.getRespuestas)
  .post(requireAuth, dispoController.createRespuesta)

router.route('/:id')
  .get(requireAuth, dispoController.getRespuestaById)
  .put(requireAuth, dispoController.updateRespuesta)
  .delete(requireAuth, dispoController.deleteRespuesta)

module.exports = router
