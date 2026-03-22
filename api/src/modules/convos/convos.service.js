const database = require('../../../../database/prisma/prisma')
const {
  buildConvocatoriaCreateDto,
  buildConvocatoriaUpdateDto,
  buildConvoTypeCreateDto,
  buildConvoTypeUpdateDto,
  createConvosDtoError,
  mapConvocatoriaToDto,
  mapConvoTypeToDto,
} = require('./convos.dto')

const convocatoriaInclude = {
  user: true,
  convoType: true,
  _count: {
    select: {
      respostas: true,
    },
  },
}

function createServiceError(message, statusCode = 500, details) {
  const error = new Error(message)
  error.statusCode = statusCode

  if (details) {
    error.details = details
  }

  return error
}

async function findConvoTypeOrThrow(id) {
  const convoType = await database.convoType.findUnique({
    where: { id },
  })

  if (!convoType) {
    throw createServiceError('No se ha encontrado el tipo de convocatoria solicitado.', 404)
  }

  return convoType
}

async function findConvocatoriaOrThrow(id) {
  const convocatoria = await database.convocatoria.findUnique({
    where: { id },
    include: convocatoriaInclude,
  })

  if (!convocatoria) {
    throw createServiceError('No se ha encontrado la convocatoria solicitada.', 404)
  }

  return convocatoria
}

async function ensureUserExists(userId) {
  const user = await database.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    throw createConvosDtoError('No existe el responsable indicado.', 404)
  }
}

async function ensureConvoTypeExists(convoTypeId) {
  const convoType = await database.convoType.findUnique({
    where: { id: convoTypeId },
    select: { id: true },
  })

  if (!convoType) {
    throw createConvosDtoError('No existe el tipo de convocatoria indicado.', 404)
  }
}

function getDefaultConvocatoriaTitle(convoTypeName, date) {
  return `${convoTypeName} - ${date.toISOString().slice(0, 10)}`
}

function mapPrismaError(error) {
  if (error?.code === 'P2002') {
    return createServiceError('Ya existe un registro con un valor unico que no puede repetirse.', 409)
  }

  if (error?.code === 'P2025') {
    return createServiceError('No se ha encontrado el registro solicitado.', 404)
  }

  if (error?.code === 'P2003') {
    return createServiceError('No se puede eliminar o modificar el registro porque tiene datos asociados.', 409)
  }

  return error
}

async function getAllConvoTypes() {
  const convoTypes = await database.convoType.findMany({
    orderBy: {
      id: 'asc',
    },
  })

  return convoTypes.map(mapConvoTypeToDto)
}

async function getConvoTypeById(id) {
  const convoType = await findConvoTypeOrThrow(id)
  return mapConvoTypeToDto(convoType)
}

async function createConvoType(payload) {
  const createDto = buildConvoTypeCreateDto(payload)

  try {
    const convoType = await database.convoType.create({
      data: createDto,
    })

    return mapConvoTypeToDto(convoType)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function updateConvoType(id, payload) {
  const updateDto = buildConvoTypeUpdateDto(payload)

  await findConvoTypeOrThrow(id)

  try {
    const convoType = await database.convoType.update({
      where: { id },
      data: updateDto,
    })

    return mapConvoTypeToDto(convoType)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function deleteConvoType(id) {
  await findConvoTypeOrThrow(id)

  try {
    const convoType = await database.convoType.delete({
      where: { id },
    })

    return mapConvoTypeToDto(convoType)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function getAllConvocatorias() {
  const convocatorias = await database.convocatoria.findMany({
    include: convocatoriaInclude,
    orderBy: {
      id: 'asc',
    },
  })

  return convocatorias.map(mapConvocatoriaToDto)
}

async function getConvocatoriaById(id) {
  const convocatoria = await findConvocatoriaOrThrow(id)
  return mapConvocatoriaToDto(convocatoria)
}

async function createConvocatoria(payload) {
  const createDto = buildConvocatoriaCreateDto(payload)

  await ensureUserExists(createDto.responsableId)
  await ensureConvoTypeExists(createDto.convoTypeId)

  const convoType = await findConvoTypeOrThrow(createDto.convoTypeId)

  const data = {
    ...createDto,
    title: createDto.title || getDefaultConvocatoriaTitle(convoType.name, createDto.date),
  }

  try {
    const convocatoria = await database.convocatoria.create({
      data,
      include: convocatoriaInclude,
    })

    return mapConvocatoriaToDto(convocatoria)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function updateConvocatoria(id, payload) {
  const existingConvocatoria = await findConvocatoriaOrThrow(id)
  const updateDto = buildConvocatoriaUpdateDto(payload)

  if (updateDto.responsableId !== undefined) {
    await ensureUserExists(updateDto.responsableId)
  }

  if (updateDto.convoTypeId !== undefined) {
    await ensureConvoTypeExists(updateDto.convoTypeId)
  }

  const finalStartTime = updateDto.startTime ?? existingConvocatoria.startTime
  const finalTimeSent = Object.prototype.hasOwnProperty.call(updateDto, 'finalTime')
  const finalFinalTime = finalTimeSent ? updateDto.finalTime : existingConvocatoria.finalTime

  if (finalFinalTime && finalFinalTime < finalStartTime) {
    throw createConvosDtoError('El campo "finalTime" no puede ser anterior a "startTime".')
  }

  try {
    const convocatoria = await database.convocatoria.update({
      where: { id },
      data: updateDto,
      include: convocatoriaInclude,
    })

    return mapConvocatoriaToDto(convocatoria)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

async function deleteConvocatoria(id) {
  await findConvocatoriaOrThrow(id)

  try {
    const convocatoria = await database.convocatoria.delete({
      where: { id },
      include: convocatoriaInclude,
    })

    return mapConvocatoriaToDto(convocatoria)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

module.exports = {
  createConvocatoria,
  createConvoType,
  createServiceError,
  deleteConvocatoria,
  deleteConvoType,
  getAllConvocatorias,
  getAllConvoTypes,
  getConvocatoriaById,
  getConvoTypeById,
  mapPrismaError,
  updateConvocatoria,
  updateConvoType,
}
