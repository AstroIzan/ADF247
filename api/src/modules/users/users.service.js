const database = require('../../../../database/prisma/prisma')
const {
  buildCreateUserDto,
  buildUpdateUserDto,
  createDtoError,
  extractRoles,
  mapUserToDto,
} = require('./users.dto')
const { hashPassword } = require('../auth/auth.password')

// Siempre que consultamos un usuario necesitamos tambien sus roles
const userInclude = {
  roles: true,
}

// Campos escalares directos del modelo User que se pueden copiar al data de Prisma
const USER_SCALAR_FIELDS = ['name', 'lastName', 'nCarnet', 'nIndicatiu', 'password', 'isActive']

// Igual que en DTO, estandarizamos errores para que controller pueda responder sin
// conocer detalles de Prisma ni de la logica de negocio interna.
function createServiceError(message, statusCode = 500, details) {
  const error = new Error(message)
  error.statusCode = statusCode

  if (details) {
    error.details = details
  }

  return error
}

// Atajo para comprobar si un campo existe realmente en el objeto y distinguirlo de
// un valor undefined heredado o ausente.
function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

// Extrae solo los campos escalares permitidos para construir el data de Prisma.
// Con esto evitamos copiar roles u otras propiedades que no pertenecen al modelo base.
function pickUserScalarFields(source) {
  const data = {}

  for (const field of USER_SCALAR_FIELDS) {
    if (hasOwn(source, field)) {
      data[field] = source[field]
    }
  }

  return data
}

// Prisma necesita una estructura concreta para reescribir la relacion de roles.
// Se borra el registro previo y se crea uno nuevo con el estado final deseado.
function buildRoleWrite(roles) {
  return {
    roles: {
      deleteMany: {},
      create: roles,
    },
  }
}

// Helper comun para recuperar un usuario o lanzar 404 si no existe.
// Asi create/update/delete no repiten la misma comprobacion.
async function findUserOrThrow(id) {
  const user = await database.user.findUnique({
    where: { id },
    include: userInclude,
  })

  if (!user) {
    throw createServiceError('No se ha encontrado el usuario solicitado.', 404)
  }

  return user
}

// nCarnet actua como clave referenciada por respuestas. Antes de permitir el cambio
// comprobamos que no existan relaciones que dejen datos colgando o rompan integridad.
async function ensureNCarnetCanChange(existingUser, updateDto) {
  if (!hasOwn(updateDto, 'nCarnet') || updateDto.nCarnet === existingUser.nCarnet) {
    return
  }

  const respuestasCount = await database.respuesta.count({
    where: {
      userNCarnet: existingUser.nCarnet,
    },
  })

  if (respuestasCount > 0) {
    throw createDtoError('No se puede cambiar el nCarnet de un usuario que ya tiene respuestas asociadas.', 409)
  }
}

// Data para create: copia campos simples y crea la relacion roles en la misma operacion.
async function buildCreateData(createDto) {
  const data = {
    ...(createDto.id !== undefined ? { id: createDto.id } : {}),
    ...pickUserScalarFields(createDto),
    roles: {
      create: createDto.roles,
    },
  }

  if (hasOwn(data, 'password')) {
    data.password = await hashPassword(data.password)
  }

  return data
}

// Data para update: solo envia a Prisma lo que llega en el DTO.
// Si cambia nCarnet o llegan roles, recompone el objeto de roles final completo.
async function buildUpdateData(updateDto, existingUser) {
  const shouldRewriteRoles =
    hasOwn(updateDto, 'roles') ||
    (hasOwn(updateDto, 'nCarnet') && updateDto.nCarnet !== existingUser.nCarnet)

  const data = {
    ...pickUserScalarFields(updateDto),
    ...(shouldRewriteRoles
      ? buildRoleWrite({
        ...extractRoles(existingUser.roles),
        ...(updateDto.roles || {}),
      })
      : {}),
  }

  if (hasOwn(data, 'password')) {
    data.password = await hashPassword(data.password)
  }

  return data
}

// Traducimos errores concretos de Prisma a mensajes de dominio entendibles.
// Esto evita filtrar detalles internos del ORM hacia el cliente.
function mapPrismaError(error) {
  if (error?.code === 'P2002') {
    return createServiceError('Ya existe un usuario con ese nCarnet.', 409)
  }

  if (error?.code === 'P2025') {
    return createServiceError('No se ha encontrado el usuario solicitado.', 404)
  }

  if (error?.code === 'P2003') {
    return createServiceError('No se puede eliminar o modificar el usuario porque tiene registros asociados.', 409)
  }

  return error
}

// Devuelve todos los usuarios ordenados por id para mantener una respuesta estable.
async function getAllUsers() {
  const users = await database.user.findMany({
    include: userInclude,
    orderBy: {
      id: 'asc',
    },
  })

  return users.map(mapUserToDto)
}

// Recupera un solo usuario y lo transforma al formato expuesto por la API.
async function getUserById(id) {
  const user = await findUserOrThrow(id)
  return mapUserToDto(user)
}

// Flujo de creacion: valida/normaliza con DTO, persiste en Prisma y devuelve la
// representacion publica del usuario creado.
async function createUser(payload, options = {}) {
  const createDto = buildCreateUserDto(payload, options)

  try {
    const user = await database.user.create({
      data: await buildCreateData(createDto),
      include: userInclude,
    })

    return mapUserToDto(user)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

// Flujo de actualizacion: primero valida existencia, luego valida restricciones de
// negocio y por ultimo actualiza solo los campos enviados.
async function updateUser(id, payload) {
  const existingUser = await findUserOrThrow(id)
  const updateDto = buildUpdateUserDto(payload)
  await ensureNCarnetCanChange(existingUser, updateDto)

  try {
    const user = await database.user.update({
      where: { id },
      data: await buildUpdateData(updateDto, existingUser),
      include: userInclude,
    })

    return mapUserToDto(user)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

// Borrado: eliminamos antes los roles asociados porque dependen del nCarnet del usuario.
// La respuesta devuelve el usuario previo ya mapeado para confirmar que se borro.
async function deleteUser(id) {
  const user = await findUserOrThrow(id)

  try {
    await database.$transaction([
      database.role.deleteMany({
        where: {
          nCarnet: user.nCarnet,
        },
      }),
      database.user.delete({
        where: { id },
      }),
    ])

    return mapUserToDto(user)
  } catch (error) {
    throw mapPrismaError(error)
  }
}

module.exports = {
  createUser,
  createServiceError,
  deleteUser,
  getAllUsers,
  getUserById,
  mapPrismaError,
  updateUser,
}
