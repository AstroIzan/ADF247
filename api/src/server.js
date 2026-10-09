require('./config/env')

const { apiLogger, patchGlobalConsole } = require('./config/logger')
const app = require('./app')
const { startConvoScheduler } = require('./modules/convos/convos.scheduler')

const PORT = process.env.PORT || 3001

patchGlobalConsole()
if (process.env.LEGACY_NOTIFICATION_SCHEDULER === 'true') {
  startConvoScheduler()
} else {
  apiLogger.info('Scheduler de notificaciones Node desactivado; lo procesa el worker Messaging.')
}

app.listen(PORT, () => {
  apiLogger.info(`Servidor corriendo en http://localhost:${PORT}`)
})