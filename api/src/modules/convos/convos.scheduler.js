const {
  ensureConfiguredConvoTypes,
  runDailyNotificationAutomation,
  detectAndRecordMissedRun,
  runRetentionCleanup,
} = require('../notifications/notifications.service')
const { readNotificationSettings } = require('../notifications/notifications.config')

let scheduledTimer = null
let cleanupTimer = null

function getNextRunDate(referenceDate = new Date()) {
  const settings = readNotificationSettings()
  const nextRun = new Date(referenceDate)
  nextRun.setHours(settings.schedule.dailyRunHour, settings.schedule.dailyRunMinute, 0, 0)

  if (nextRun <= referenceDate) {
    nextRun.setDate(nextRun.getDate() + 1)
  }

  return nextRun
}

function scheduleRetentionCleanup() {
  const now = new Date()
  const nextCleanup = new Date(now)
  nextCleanup.setHours(3, 0, 0, 0)
  if (nextCleanup <= now) {
    nextCleanup.setDate(nextCleanup.getDate() + 1)
  }

  const delay = nextCleanup.getTime() - now.getTime()
  cleanupTimer = setTimeout(async () => {
    try {
      await runRetentionCleanup()
    } catch (error) {
      console.error('[convos.scheduler] Error en limpieza de histórico:', error)
    } finally {
      scheduleRetentionCleanup()
    }
  }, delay)
}

function scheduleNextRun() {
  const now = new Date()
  const nextRun = getNextRunDate(now)
  const delay = nextRun.getTime() - now.getTime()

  scheduledTimer = setTimeout(async () => {
    try {
      // Check for potential missed runs before executing (edge case: server was briefly down)
      await detectAndRecordMissedRun(new Date()).catch((err) => {
        console.error('[convos.scheduler] Error al detectar execution omesa:', err)
      })
      const summary = await runDailyNotificationAutomation(null, new Date())
      console.log('[convos.scheduler] Automatizacion diaria completada.', summary)
    } catch (error) {
      console.error('[convos.scheduler] Error en automatizacion diaria:', error)
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
    await ensureConfiguredConvoTypes()
    // Detect missed runs before attempting the initial run
    await detectAndRecordMissedRun(new Date()).catch((err) => {
      console.error('[convos.scheduler] Error al detectar execution omesa en inicio:', err)
    })
    console.log('[convos.scheduler] Scheduler inicializado. Esperando siguiente franja programada.')
  } catch (error) {
    console.error('[convos.scheduler] Error en sincronizacion inicial de automatizacion:', error)
  }

  // Run initial cleanup and schedule daily cleanup at 03:00
  try {
    await runRetentionCleanup()
  } catch (error) {
    console.error('[convos.scheduler] Error en limpieza inicial de histórico:', error)
  }
  scheduleRetentionCleanup()

  scheduleNextRun()
}

module.exports = {
  startConvoScheduler,
}
