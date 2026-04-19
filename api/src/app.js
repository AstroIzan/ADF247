require('./config/env')

const path = require('path')
const cors = require('cors')
const express = require('express')
const routes = require('./routes')
const { apiLogger } = require('./config/logger')
const { requestLogger } = require('./middlewares/request-logger.middleware')
const { getFirebaseHealthStatus } = require('./modules/notifications/notifications.firebase')

const DEFAULT_CORS_ORIGINS = ['http://localhost:4200', 'https://localhost:4200']
const IS_PRODUCTION = ['production', 'pro'].includes(String(process.env.NODE_ENV || '').toLowerCase())
const FRONTEND_DIST_PATH = process.env.FRONTEND_DIST_PATH
	? path.resolve(__dirname, '..', process.env.FRONTEND_DIST_PATH)
	: path.resolve(__dirname, '..', '..', 'client', 'dist', 'client-app', 'browser')

function getCorsOrigins() {
	const rawOrigins = process.env.CORS_ORIGIN

	if (!rawOrigins) {
		return DEFAULT_CORS_ORIGINS
	}

	return rawOrigins
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean)
}

const app = express()

app.use(cors({
	origin: getCorsOrigins(),
}))
app.use(express.json())
app.use(requestLogger)
app.use('/api/content', express.static(path.join(__dirname, 'config', 'content')))

function getHealthPayload() {
	const firebase = getFirebaseHealthStatus()
	return {
		ok: true,
		service: 'api',
		dependencies: {
			firebase,
		},
 	}
}

app.get('/health', (_req, res) => {
	res.json(getHealthPayload())
})

app.get('/api/health', (_req, res) => {
	res.json(getHealthPayload())
})

app.use('/api', routes)

if (IS_PRODUCTION) {
	app.use(express.static(FRONTEND_DIST_PATH))

	// Express 5 no longer accepts '*' as a string path pattern.
	app.get(/.*/, (req, res, next) => {
		if (req.path.startsWith('/api')) {
			return next()
		}

		return res.sendFile(path.join(FRONTEND_DIST_PATH, 'index.html'))
	})
}

app.use((error, _req, res, _next) => {
	const statusCode = error.statusCode || 500
	apiLogger.error('Unhandled API error', {
		statusCode,
		message: error.message,
		stack: error.stack,
		details: error.details,
	})

	const payload = {
		message: error.message || 'Ha ocurrido un error interno en el servidor.',
	}

	if (error.details) {
		payload.details = error.details
	}

	res.status(statusCode).json(payload)
})

module.exports = app