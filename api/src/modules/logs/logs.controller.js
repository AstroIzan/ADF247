const { parseLogsSearchQuery, validateClientLogPayload } = require('./logs.dto')
const logsService = require('./logs.service')

async function createClientLog(req, res, next) {
  try {
    const entry = validateClientLogPayload(req.body)
    logsService.writeClientLog(entry, req)

    res.status(202).json({
      ok: true,
    })
  } catch (error) {
    next(error)
  }
}

async function getLogsAccess(req, res, next) {
  try {
    const result = logsService.getLogsAccess(req.auth)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

async function searchLogs(req, res, next) {
  try {
    const query = parseLogsSearchQuery(req.query)
    const result = logsService.searchLogs(req.auth, query)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createClientLog,
  getLogsAccess,
  searchLogs,
}
