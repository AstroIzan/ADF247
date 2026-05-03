const database = require('../../../../database/prisma/prisma')
const {
  buildCreateUserDto,
  buildUpdateUserDto,
  createDtoError,
  extractRoles,
  mapUserToDto,
} = require('./users.dto')
const { hashPassword } = require('../auth/auth.password')

const CSV_HEADERS = [
  'nCarnet',
  'nIndicatiu',
  'phone',
  'name',
  'lastName',
  'password',
  'isActive',
  'isAdmin',
  'isGroc',
  'isCapOperatiu',
  'isCapColla',
]

const CSV_MAX_BYTES = 2 * 1024 * 1024
const CSV_MAX_ROWS = 1500

// Siempre que consultamos un usuario necesitamos tambien sus roles
const userInclude = {
  roles: true,
}

// Campos escalares directos del modelo User que se pueden copiar al data de Prisma
const USER_SCALAR_FIELDS = ['name', 'lastName', 'nCarnet', 'nIndicatiu', 'phone', 'password', 'isActive']

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

function parseCsvLine(line) {
  const fields = []
  let current = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }

      continue
    }

    if (char === ',' && !insideQuotes) {
      fields.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  fields.push(current.trim())
  return fields
}

function parseCsvBoolean(value, { defaultValue = false, rowNumber, fieldName } = {}) {
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  const normalized = String(value).trim().toLowerCase()

  if (['true', '1', 'yes', 'si', 's'].includes(normalized)) {
    return true
  }

  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false
  }

  throw createDtoError(`Fila ${rowNumber}: el campo "${fieldName}" debe ser booleano (true/false/1/0/yes/no).`)
}

function parseCsvRows(csvContent) {
  const normalizedContent = String(csvContent).replace(/^\uFEFF/, '')
  const lines = normalizedContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw createDtoError('El CSV debe incluir cabecera y al menos una fila de datos.')
  }

  const header = parseCsvLine(lines[0])

  if (header.length !== CSV_HEADERS.length || header.some((entry, index) => entry !== CSV_HEADERS[index])) {
    throw createDtoError(`Cabecera CSV invalida. Debe ser exactamente: ${CSV_HEADERS.join(',')}`)
  }

  const rows = lines.slice(1)

  if (rows.length > CSV_MAX_ROWS) {
    throw createDtoError(`El CSV supera el maximo permitido de ${CSV_MAX_ROWS} filas.`)
  }

  return rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 2
    const values = parseCsvLine(row)

    if (values.length > CSV_HEADERS.length) {
      throw createDtoError(`Fila ${rowNumber}: tiene mas columnas de las esperadas (${CSV_HEADERS.length}).`)
    }

    const alignedValues = [...values]
    while (alignedValues.length < CSV_HEADERS.length) {
      alignedValues.push('')
    }

    return CSV_HEADERS.reduce((acc, headerName, index) => {
      acc[headerName] = alignedValues[index]
      return acc
    }, { __rowNumber: rowNumber })
  })
}

function mapCsvRowToUserPayload(row) {
  const rowNumber = row.__rowNumber
  const nCarnet = String(row.nCarnet || '').trim()
  const name = String(row.name || '').trim()
  const password = String(row.password || '').trim()

  if (!nCarnet) {
    throw createDtoError(`Fila ${rowNumber}: "nCarnet" es obligatorio.`)
  }

  if (!name) {
    throw createDtoError(`Fila ${rowNumber}: "name" es obligatorio.`)
  }

  if (!password || password.length < 6) {
    throw createDtoError(`Fila ${rowNumber}: "password" es obligatorio y debe tener al menos 6 caracteres.`)
  }

  return {
    nCarnet,
    nIndicatiu: String(row.nIndicatiu || '').trim() || undefined,
    phone: String(row.phone || '').trim() || undefined,
    name,
    lastName: String(row.lastName || '').trim() || undefined,
    password,
    isActive: parseCsvBoolean(row.isActive, {
      defaultValue: true,
      rowNumber,
      fieldName: 'isActive',
    }),
    roles: {
      isAdmin: parseCsvBoolean(row.isAdmin, { rowNumber, fieldName: 'isAdmin' }),
      isGroc: parseCsvBoolean(row.isGroc, { rowNumber, fieldName: 'isGroc' }),
      isCapOperatiu: parseCsvBoolean(row.isCapOperatiu, { rowNumber, fieldName: 'isCapOperatiu' }),
      isCapColla: parseCsvBoolean(row.isCapColla, { rowNumber, fieldName: 'isCapColla' }),
    },
    __rowNumber: rowNumber,
  }
}

async function importUsersFromCsv(payload, options = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createDtoError('El body de importacion debe ser un objeto JSON valido.')
  }

  const csvContent = typeof payload.csvContent === 'string' ? payload.csvContent : ''
  const fileName = typeof payload.fileName === 'string' ? payload.fileName.trim() : ''
  const createUserFn = typeof options.createUserFn === 'function' ? options.createUserFn : createUser

  if (!csvContent.trim()) {
    throw createDtoError('El campo "csvContent" es obligatorio y debe contener el fichero CSV.')
  }

  if (fileName && !fileName.toLowerCase().endsWith('.csv')) {
    throw createDtoError('El nombre de fichero debe terminar en .csv.')
  }

  const byteSize = Buffer.byteLength(csvContent, 'utf8')

  if (byteSize > CSV_MAX_BYTES) {
    throw createDtoError(`El CSV supera el tamaño maximo permitido (${CSV_MAX_BYTES} bytes).`)
  }

  const parsedRows = parseCsvRows(csvContent)
  const result = {
    totalRows: parsedRows.length,
    inserted: 0,
    rejected: 0,
    rows: [],
  }

  for (const row of parsedRows) {
    try {
      const userPayload = mapCsvRowToUserPayload(row)

      await createUserFn({
        nCarnet: userPayload.nCarnet,
        nIndicatiu: userPayload.nIndicatiu,
        phone: userPayload.phone,
        name: userPayload.name,
        lastName: userPayload.lastName,
        password: userPayload.password,
        isActive: userPayload.isActive,
        roles: userPayload.roles,
      })

      result.inserted += 1
      result.rows.push({
        rowNumber: userPayload.__rowNumber,
        nCarnet: userPayload.nCarnet,
        status: 'inserted',
      })
    } catch (error) {
      result.rejected += 1
      result.rows.push({
        rowNumber: row.__rowNumber,
        nCarnet: row.nCarnet || null,
        status: 'rejected',
        reason: error.message,
      })
    }
  }

  console.info('[users.import] Resultado import CSV', {
    fileName: fileName || 'inline-content',
    totalRows: result.totalRows,
    inserted: result.inserted,
    rejected: result.rejected,
  })

  return result
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

async function getUsersPage({ page, pageSize }) {
  const skip = (page - 1) * pageSize

  const [total, users] = await Promise.all([
    database.user.count(),
    database.user.findMany({
      include: userInclude,
      orderBy: {
        id: 'asc',
      },
      skip,
      take: pageSize,
    }),
  ])

  return {
    items: users.map(mapUserToDto),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  }
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
  getUsersPage,
  getUserById,
  importUsersFromCsv,
  __csvInternals: {
    mapCsvRowToUserPayload,
    parseCsvRows,
  },
  mapPrismaError,
  updateUser,
}
