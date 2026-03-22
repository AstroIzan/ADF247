const database = require('../../../../database/prisma/prisma')
const {
  buildRespuestaCreateDto,
  buildRespuestaUpdateDto,
  createDispoDtoError,
  mapRespuestaToDto,
} = require('./dispo.dto')

const respuestaInclude = {
  convocatoria: true,
  user: true,
}

function createServiceError(message, statusCode = 500, details) {
  const error = new Error(message)
  error.statusCode = statusCode

  if (details) {
    error.details = details
  }

  return error
}

async function findRespuestaOrThrow(id) {
  const respuesta = await database.respuesta.findUnique({
    where: { id },
    include: respuestaInclude,
  })

  if (!respuesta) {
    throw createServiceError('No se ha encontrado la respuesta solicitada.', 404)
  }

  return respuesta
}

async function ensureConvocatoriaExists(convoId) {
  const convocatoria = await database.convocatoria.findUnique({
    where: { id: convoId },
    select: {
      id: true,
      isActive: true,
    },
  })

  if (!convocatoria) {
    throw createDispoDtoError('No existe la convocatoria indicada.', 404)
  }

  return convocatoria
}

async function ensureUserExistsByNCarnet(userNCarnet) {
  const user = await database.user.findUnique({
    where: { nCarnet: userNCarnet },
    select: {
      id: true,
      nCarnet: true,
      isActive: true,
    },
  })

  if (!user) {
    throw createDispoDtoError('No existe el usuario indicado por nCarnet.', 404)
  }

  return user
}

function mapPrismaError(error) {
  if (error?.code === 'P2002') {
    return createServiceError('Ya existe una respuesta con esa combinacion unica.', 409)
  }

  if (error?.code === 'P2025') {
    return createServiceError('No se ha encontrado el registro solicitado.', 404)
  }

  if (error?.code === 'P2003') {
    return createServiceError('No se puede guardar la respuesta porque hay referencias invalidas.', 409)
  }

  return error
}

async function ensureUniqueResponse(convoId, userNCarnet, ignoredResponseId) {
  const existing = await database.respuesta.findFirst({
    where: {
      convoId,
      userNCarnet,
      ...(ignoredResponseId ? { id: { not: ignoredResponseId } } : {}),
    },
    select: {
      id: true,
    },
  })

  if (existing) {
    throw createDispoDtoError('Ya existe una respuesta para este usuario en esta convocatoria.', 409)
  }
}

function normalizeCustomFields(data) {
  if (Object.prototype.hasOwnProperty.call(data, 'isCustom') && data.isCustom === false) {
    data.customText = null
  }

  if (
    Object.prototype.hasOwnProperty.call(data, 'isCustom') &&
    data.isCustom === true &&
    !data.customText
  ) {
    throw createDispoDtoError('Debes enviar "customText" cuando "isCustom" es true.')
  }

  if (
    Object.prototype.hasOwnProperty.call(data, 'customText') &&
    data.customText &&
    Object.prototype.hasOwnProperty.call(data, 'isCustom') &&
    data.isCustom === false
  ) {
    throw createDispoDtoError('No puedes enviar "customText" si "isCustom" es false.')
  }
}

async function getAllRespuestas(filters = {}) {
  const where = {}

  if (filters.convoId !== undefined) {
    where.convoId = filters.convoId
  }

  if (filters.userNCarnet !== undefined) {
    where.userNCarnet = filters.userNCarnet
  }

  const respuestas = await database.respuesta.findMany({
    where,
    include: respuestaInclude,
    orderBy: {
      id: 'asc',
    },
  })

  return respuestas.map(mapRespuestaToDto)
}

async function getRespuestaById(id) {
  const respuesta = await findRespuestaOrThrow(id)
  return mapRespuestaToDto(respuesta)
}

async function createRespuesta(payload) {
  const createDto = buildRespuestaCreateDto(payload)

  const convocatoria = await ensureConvocatoriaExists(createDto.convoId)
  const user = await ensureUserExistsByNCarnet(createDto.userNCarnet)

  if (!convocatoria.isActive) {
    throw createDispoDtoError('No se pueden registrar respuestas en una convocatoria inactiva.', 409)
  }

  if (!user.isActive) {
    throw createDispoDtoError('No se pueden registrar respuestas para un usuario inactivo.', 409)
  }

  await ensureUniqueResponse(createDto.convoId, createDto.userNCarnet)

  try {
    const respuesta = await database.respuesta.create({
      data: createDto,
      include: respuestaInclude,
    })

    return mapRespuestaToDto(respuesta)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function updateRespuesta(id, payload) {
  const existing = await findRespuestaOrThrow(id)
  const updateDto = buildRespuestaUpdateDto(payload)

  const nextConvoId = updateDto.convoId ?? existing.convoId
  const nextUserNCarnet = updateDto.userNCarnet ?? existing.userNCarnet

  const convocatoria = await ensureConvocatoriaExists(nextConvoId)
  const user = await ensureUserExistsByNCarnet(nextUserNCarnet)

  if (!convocatoria.isActive) {
    throw createDispoDtoError('No se pueden guardar cambios en respuestas de convocatorias inactivas.', 409)
  }

  if (!user.isActive) {
    throw createDispoDtoError('No se pueden guardar cambios para un usuario inactivo.', 409)
  }

  await ensureUniqueResponse(nextConvoId, nextUserNCarnet, id)

  const mergedCustomState = {
    ...existing,
    ...updateDto,
  }

  normalizeCustomFields(mergedCustomState)

  const finalData = {
    ...updateDto,
  }

  if (mergedCustomState.isCustom === false) {
    finalData.customText = null
  }

  try {
    const respuesta = await database.respuesta.update({
      where: { id },
      data: finalData,
      include: respuestaInclude,
    })

    return mapRespuestaToDto(respuesta)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function deleteRespuesta(id) {
  await findRespuestaOrThrow(id)

  try {
    const respuesta = await database.respuesta.delete({
      where: { id },
      include: respuestaInclude,
    })

    return mapRespuestaToDto(respuesta)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

module.exports = {
  createRespuesta,
  createServiceError,
  deleteRespuesta,
  getAllRespuestas,
  getRespuestaById,
  mapPrismaError,
  updateRespuesta,
}
