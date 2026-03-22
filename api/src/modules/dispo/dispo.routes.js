const express = require('express')
const dispoController = require('./dispo.controller')

const router = express.Router()

router.route('/')
  .get(dispoController.getRespuestas)
  .post(dispoController.createRespuesta)

router.route('/:id')
  .get(dispoController.getRespuestaById)
  .put(dispoController.updateRespuesta)
  .delete(dispoController.deleteRespuesta)

module.exports = router
