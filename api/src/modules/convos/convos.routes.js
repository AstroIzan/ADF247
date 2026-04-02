const express = require('express')
const { requireAuth } = require('../../middlewares/auth.middleware')
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

router.post('/:id/start', requireAuth, convosController.startConvocatoria)
router.post('/:id/finish', requireAuth, convosController.finishConvocatoria)
router.get('/:id/campaign-form-context', requireAuth, convosController.getCampaignFormContext)
router.get('/campaign-forms/list', requireAuth, convosController.getCampaignForms)
router.delete('/campaign-forms/:id', requireAuth, convosController.deleteCampaignForm)
router.patch('/:id/lifecycle', requireAuth, convosController.updateConvocatoriaLifecycle)
router.get('/hours/summary', requireAuth, convosController.getHoursSummary)

module.exports = router
