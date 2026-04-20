const express = require('express')
const fs = require('fs')
const path = require('path')
const { attachAuthIfPresent } = require('../../middlewares/auth.middleware')

const APP_REQUESTS_LOG_FILE = process.env.APP_REQUESTS_LOG_FILE || '/home/pi/logs/api/app-requests.log'

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function writeJsonLine(filePath, payload) {
  ensureDirectory(filePath)
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`)
}

function normalizeRoute(rawRoute) {
  const value = String(rawRoute || '').trim()
  if (!value) {
    return '/unknown'
  }

  return value.startsWith('/') ? value : `/${value}`
}

function deriveSection(route) {
  const cleaned = route.split('?')[0].split('#')[0]
  const parts = cleaned.split('/').filter(Boolean)
  return parts[0] || 'home'
}

const router = express.Router()

router.post('/app-requests', attachAuthIfPresent, (req, res, next) => {
  try {
    const route = normalizeRoute(req.body?.route)
    const payload = {
      timestamp: new Date().toISOString(),
      route,
      section: String(req.body?.section || deriveSection(route)).toLowerCase(),
      source: 'frontend',
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
    }

    if (req.auth?.userId) {
      payload.userId = String(req.auth.userId)
    }

    if (req.auth?.nCarnet) {
      payload.nCarnet = String(req.auth.nCarnet)
    }

    writeJsonLine(APP_REQUESTS_LOG_FILE, payload)

    res.status(202).json({ ok: true })
  } catch (error) {
    next(error)
  }
})

module.exports = router
