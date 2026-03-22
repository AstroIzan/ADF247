require('./config/env')

const app = require('./app')
const { startConvoScheduler } = require('./modules/convos/convos.scheduler')

const PORT = process.env.PORT || 3001

startConvoScheduler()

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})