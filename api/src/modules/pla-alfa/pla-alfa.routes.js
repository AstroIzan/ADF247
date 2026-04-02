const express = require('express')
const { requireAuth } = require('../../middlewares/auth.middleware')
const plaAlfaController = require('./pla-alfa.controller')

const router = express.Router()

router.get('/catalog', requireAuth, plaAlfaController.getMunicipalitiesPlaAlfaCatalog)
router.get('/municipalities', requireAuth, plaAlfaController.getMunicipalitiesPlaAlfaStatus)
router.put('/municipalities', requireAuth, plaAlfaController.updateMunicipalitiesPlaAlfaSelection)

module.exports = router
