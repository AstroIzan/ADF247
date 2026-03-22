require('./config/env')

const cors = require('cors')
const express = require('express')
const routes = require('./routes')

const DEFAULT_CORS_ORIGINS = ['http://localhost:4200']

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

app.get('/health', (_req, res) => {
	res.json({ ok: true, service: 'api' })
})

app.use('/api', routes)

app.use((error, _req, res, _next) => {
	const statusCode = error.statusCode || 500
	const payload = {
		message: error.message || 'Ha ocurrido un error interno en el servidor.',
	}

	if (error.details) {
		payload.details = error.details
	}

	res.status(statusCode).json(payload)
})

module.exports = app