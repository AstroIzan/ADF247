const database = require('../../../../database/prisma/prisma')
const {
  buildDeactivateDeviceTokenDto,
  buildNotificationLogsQueryDto,
  buildRegisterDeviceTokenDto,
  buildSendBroadcastDto,
  createNotificationsDtoError,
  mapDeviceTokenToDto,
  mapNotificationLogToDto,
} = require('./notifications.dto')
const { getFirebaseMessaging } = require('./notifications.firebase')

function createServiceError(message, statusCode = 500, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (details) {
    error.details = details
  }
  return error
}

async function ensureAdmin(authUser) {
  const role = await database.role.findFirst({
    where: {
      nCarnet: authUser.nCarnet,
      isAdmin: true,
    },
    select: { id: true },
  })

  if (!role) {
    throw createNotificationsDtoError('No tienes permisos para enviar notificaciones.', 403)
  }
}

async function registerDeviceToken(authUser, payload, userAgent) {
  const dto = buildRegisterDeviceTokenDto({
    ...payload,
    userAgent,
  })

  const now = new Date()

  const existing = await database.deviceToken.findUnique({
    where: { token: dto.token },
  })

  let tokenRecord

  if (existing) {
    tokenRecord = await database.deviceToken.update({
      where: { token: dto.token },
      data: {
        userId: authUser.userId,
        platform: dto.platform,
        userAgent: dto.userAgent,
        isActive: true,
        lastSeenAt: now,
      },
    })
  } else {
    tokenRecord = await database.deviceToken.create({
      data: {
        userId: authUser.userId,
        token: dto.token,
        platform: dto.platform,
        userAgent: dto.userAgent,
        isActive: true,
        lastSeenAt: now,
      },
    })
  }

  return mapDeviceTokenToDto(tokenRecord)
}

async function deactivateDeviceToken(authUser, payload) {
  const dto = buildDeactivateDeviceTokenDto(payload)

  await database.deviceToken.updateMany({
    where: {
      userId: authUser.userId,
      token: dto.token,
      isActive: true,
    },
    data: {
      isActive: false,
      lastSeenAt: new Date(),
    },
  })

  return { ok: true }
}

function chunkArray(values, chunkSize) {
  const chunks = []
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize))
  }
  return chunks
}

async function sendBroadcastNotification(authUser, payload) {
  await ensureAdmin(authUser)
  const dto = buildSendBroadcastDto(payload)

  const activeTokens = await database.deviceToken.findMany({
    where: { isActive: true },
    select: {
      token: true,
    },
  })

  const tokens = activeTokens.map((item) => item.token)

  if (tokens.length === 0) {
    const log = await database.notificationLog.create({
      data: {
        senderUserId: authUser.userId,
        title: dto.title,
        body: dto.body,
        dataJson: JSON.stringify(dto.data),
        requestedCount: 0,
        successCount: 0,
        failureCount: 0,
        status: 'no-targets',
      },
    })

    return mapNotificationLogToDto(log)
  }

  const messaging = getFirebaseMessaging()
  const batches = chunkArray(tokens, 500)

  let successCount = 0
  let failureCount = 0
  const tokensToDisable = []

  for (const batchTokens of batches) {
    const response = await messaging.sendEachForMulticast({
      tokens: batchTokens,
      notification: {
        title: dto.title,
        body: dto.body,
      },
      data: dto.data,
      webpush: {
        fcmOptions: {
          link: dto.link,
        },
      },
    })

    successCount += response.successCount
    failureCount += response.failureCount

    response.responses.forEach((result, index) => {
      if (!result.success) {
        const errorCode = result.error?.code || ''
        if (errorCode === 'messaging/registration-token-not-registered' || errorCode === 'messaging/invalid-registration-token') {
          tokensToDisable.push(batchTokens[index])
        }
      }
    })
  }

  if (tokensToDisable.length > 0) {
    await database.deviceToken.updateMany({
      where: {
        token: {
          in: tokensToDisable,
        },
      },
      data: {
        isActive: false,
      },
    })
  }

  const log = await database.notificationLog.create({
    data: {
      senderUserId: authUser.userId,
      title: dto.title,
      body: dto.body,
      dataJson: JSON.stringify(dto.data),
      requestedCount: tokens.length,
      successCount,
      failureCount,
      status: failureCount > 0 ? 'partial' : 'sent',
    },
  })

  return mapNotificationLogToDto(log)
}

async function getNotificationLogs(authUser, query) {
  await ensureAdmin(authUser)
  const dto = buildNotificationLogsQueryDto(query)

  const logs = await database.notificationLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: dto.limit,
  })

  return logs.map(mapNotificationLogToDto)
}

module.exports = {
  deactivateDeviceToken,
  getNotificationLogs,
  registerDeviceToken,
  sendBroadcastNotification,
  createServiceError,
}
