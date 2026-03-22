const express = require('express')
const convosController = require('./convos.controller')

const router = express.Router()

router.route('/types')
  .get(convosController.getConvoTypes)
  .post(convosController.createConvoType)

router.route('/types/:id')
  .get(convosController.getConvoTypeById)
  .put(convosController.updateConvoType)
  .delete(convosController.deleteConvoType)

router.route('/')
  .get(convosController.getConvocatorias)
  .post(convosController.createConvocatoria)

router.route('/:id')
  .get(convosController.getConvocatoriaById)
  .put(convosController.updateConvocatoria)
  .delete(convosController.deleteConvocatoria)

module.exports = router
