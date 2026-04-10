const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/auth.middleware')
const plaAlfaController = require('./pla-alfa.controller')

const router = express.Router()

router.get('/catalog', requireAuth, plaAlfaController.getMunicipalitiesPlaAlfaCatalog)
router.get('/municipalities', requireAuth, plaAlfaController.getMunicipalitiesPlaAlfaStatus)
router.put('/municipalities', requireAuth, requireAdmin, plaAlfaController.updateMunicipalitiesPlaAlfaSelection)

module.exports = router
