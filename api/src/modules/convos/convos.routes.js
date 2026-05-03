const express = require('express')
const { requireAuth } = require('../../middlewares/auth.middleware')
const convosController = require('./convos.controller')

const router = express.Router()

router.route('/types')
  .get(requireAuth, convosController.getConvoTypes)
  .post(requireAuth, convosController.createConvoType)

router.route('/types/:id')
  .get(requireAuth, convosController.getConvoTypeById)
  .put(requireAuth, convosController.updateConvoType)
  .delete(requireAuth, convosController.deleteConvoType)

router.route('/')
  .get(requireAuth, convosController.getConvocatorias)
  .post(requireAuth, convosController.createConvocatoria)

router.route('/:id')
  .get(requireAuth, convosController.getConvocatoriaById)
  .put(requireAuth, convosController.updateConvocatoria)
  .delete(requireAuth, convosController.deleteConvocatoria)

router.post('/:id/start', requireAuth, convosController.startConvocatoria)
router.post('/:id/finish', requireAuth, convosController.finishConvocatoria)
router.get('/:id/campaign-form-context', requireAuth, convosController.getCampaignFormContext)
router.get('/campaign-forms/list', requireAuth, convosController.getCampaignForms)
router.delete('/campaign-forms/:id', requireAuth, convosController.deleteCampaignForm)
router.patch('/:id/lifecycle', requireAuth, convosController.updateConvocatoriaLifecycle)
router.get('/hours/summary', requireAuth, convosController.getHoursSummary)

module.exports = router
