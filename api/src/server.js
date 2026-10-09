require('./config/env')

const { apiLogger, patchGlobalConsole } = require('./config/logger')
const app = require('./app')
const { startConvoScheduler } = require('./modules/convos/convos.scheduler')

const PORT = process.env.PORT || 3001

patchGlobalConsole()
startConvoScheduler()

app.listen(PORT, () => {
  apiLogger.info(`Servidor corriendo en http://localhost:${PORT}`)
})