const fs = require('fs')
const path = require('path')

const DEVICE_TOKENS_PATH = path.join(__dirname, '../../../config/device-tokens.json')

function toDateOrNow(value) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function mapStoredToken(entry = {}) {
  return {
    id: Number(entry.id) || 0,
    userId: Number(entry.userId) || 0,
    token: String(entry.token || '').trim(),
    platform: entry.platform ? String(entry.platform) : null,
    userAgent: entry.userAgent ? String(entry.userAgent) : null,
    isActive: Boolean(entry.isActive),
    lastSeenAt: toDateOrNow(entry.lastSeenAt),
    createdAt: toDateOrNow(entry.createdAt),
    updatedAt: toDateOrNow(entry.updatedAt),
  }
}

function readStore() {
  try {
    const raw = fs.readFileSync(DEVICE_TOKENS_PATH, 'utf8').replace(/^\uFEFF/, '')
    const parsed = JSON.parse(raw)
    const tokens = Array.isArray(parsed?.tokens) ? parsed.tokens : []
    return tokens
      .map(mapStoredToken)
      .filter((entry) => entry.id > 0 && entry.userId > 0 && entry.token)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

function writeStore(tokens) {
  const payload = {
    tokens: tokens.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      token: entry.token,
      platform: entry.platform || null,
      userAgent: entry.userAgent || null,
      isActive: Boolean(entry.isActive),
      lastSeenAt: new Date(entry.lastSeenAt).toISOString(),
      createdAt: new Date(entry.createdAt).toISOString(),
      updatedAt: new Date(entry.updatedAt).toISOString(),
    })),
  }

  fs.writeFileSync(DEVICE_TOKENS_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

function getNextId(tokens) {
  if (tokens.length === 0) {
    return 1
  }

  return Math.max(...tokens.map((entry) => entry.id)) + 1
}

function upsertDeviceToken({ userId, token, platform, userAgent }) {
  const now = new Date()
  const tokens = readStore()
  const index = tokens.findIndex((entry) => entry.token === token)

  if (index >= 0) {
    const updated = {
      ...tokens[index],
      userId,
      platform: platform || tokens[index].platform,
      userAgent: userAgent || tokens[index].userAgent,
      isActive: true,
      lastSeenAt: now,
      updatedAt: now,
    }

    tokens[index] = updated
    writeStore(tokens)
    return updated
  }

  const created = {
    id: getNextId(tokens),
    userId,
    token,
    platform: platform || 'web',
    userAgent: userAgent || null,
    isActive: true,
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now,
  }

  tokens.push(created)
  writeStore(tokens)
  return created
}

function deactivateDeviceTokenForUser({ userId, token }) {
  const now = new Date()
  const tokens = readStore()
  let updatedCount = 0

  for (const entry of tokens) {
    if (entry.userId === userId && entry.token === token && entry.isActive) {
      entry.isActive = false
      entry.lastSeenAt = now
      entry.updatedAt = now
      updatedCount += 1
    }
  }

  if (updatedCount > 0) {
    writeStore(tokens)
  }

  return updatedCount
}

function deactivateTokensByValue(tokenValues = []) {
  if (!Array.isArray(tokenValues) || tokenValues.length === 0) {
    return 0
  }

  const now = new Date()
  const valueSet = new Set(tokenValues)
  const tokens = readStore()
  let updatedCount = 0

  for (const entry of tokens) {
    if (valueSet.has(entry.token) && entry.isActive) {
      entry.isActive = false
      entry.updatedAt = now
      updatedCount += 1
    }
  }

  if (updatedCount > 0) {
    writeStore(tokens)
  }

  return updatedCount
}

function listDeviceTokensByUser(userId) {
  return readStore()
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

function listAllDeviceTokens() {
  return readStore().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

function listActiveDeviceTokens(userIds) {
  const tokens = readStore().filter((entry) => entry.isActive)

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return tokens
  }

  const idSet = new Set(userIds)
  return tokens.filter((entry) => idSet.has(entry.userId))
}

function pruneInactiveDeviceTokensForUser(userId, retentionDays) {
  if (!userId || !Number.isInteger(retentionDays) || retentionDays <= 0) {
    return 0
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)

  const tokens = readStore()
  const initialLength = tokens.length
  const kept = tokens.filter((entry) => !(entry.userId === userId && !entry.isActive && entry.createdAt < cutoff))

  if (kept.length !== initialLength) {
    writeStore(kept)
  }

  return initialLength - kept.length
}

module.exports = {
  deactivateDeviceTokenForUser,
  deactivateTokensByValue,
  listActiveDeviceTokens,
  listAllDeviceTokens,
  listDeviceTokensByUser,
  pruneInactiveDeviceTokensForUser,
  upsertDeviceToken,
}
