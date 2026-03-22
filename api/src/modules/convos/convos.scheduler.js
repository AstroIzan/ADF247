const { updateSortidaForTomorrow } = require('./convos.service')

let scheduledTimer = null

function getNextRunDate(referenceDate = new Date()) {
  const nextRun = new Date(referenceDate)
  nextRun.setHours(8, 0, 0, 0)

  if (nextRun <= referenceDate) {
    nextRun.setDate(nextRun.getDate() + 1)
  }

  return nextRun
}

function scheduleNextRun() {
  const now = new Date()
  const nextRun = getNextRunDate(now)
  const delay = nextRun.getTime() - now.getTime()

  scheduledTimer = setTimeout(async () => {
    try {
      await updateSortidaForTomorrow(new Date())
      console.log('[convos.scheduler] Sortida actualizada para las convocatorias de manana.')
    } catch (error) {
      console.error('[convos.scheduler] Error al actualizar sortida:', error)
    } finally {
      scheduleNextRun()
    }
  }, delay)
}

async function startConvoScheduler() {
  if (scheduledTimer) {
    return
  }

  try {
    await updateSortidaForTomorrow(new Date())
    console.log('[convos.scheduler] Estado inicial de sortida sincronizado.')
  } catch (error) {
    console.error('[convos.scheduler] Error en sincronizacion inicial de sortida:', error)
  }

  scheduleNextRun()
}

module.exports = {
  startConvoScheduler,
}
