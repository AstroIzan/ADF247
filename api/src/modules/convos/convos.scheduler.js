const {
  ensureConfiguredConvoTypes,
  runDailyNotificationAutomation,
} = require('../notifications/notifications.service')
const { readNotificationSettings } = require('../notifications/notifications.config')

let scheduledTimer = null

function getNextRunDate(referenceDate = new Date()) {
  const settings = readNotificationSettings()
  const nextRun = new Date(referenceDate)
  nextRun.setHours(settings.schedule.dailyRunHour, settings.schedule.dailyRunMinute, 0, 0)

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
    await runDailyNotificationAutomation(null, new Date())
    console.log('[convos.scheduler] Estado inicial de automatizacion sincronizado.')
  } catch (error) {
    console.error('[convos.scheduler] Error en sincronizacion inicial de automatizacion:', error)
  }

  scheduleNextRun()
}

module.exports = {
  startConvoScheduler,
}
