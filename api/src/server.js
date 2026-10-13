require('./config/env')

const { apiLogger, patchGlobalConsole } = require('./config/logger')
const app = require('./app')

const PORT = process.env.PORT || 3001

patchGlobalConsole()

app.listen(PORT, () => {
  apiLogger.info(`Servidor corriendo en http://localhost:${PORT}`)
})