const ROLE_FIELDS = ['isAdmin', 'isGroc', 'isCapColla', 'isCapOperatiu']

// Campos de texto que se reciben en el body para create/update.
const USER_TEXT_FIELDS = {
  name: { requiredOnCreate: true },
  lastName: { nullable: true },
  nCarnet: { requiredOnCreate: true },
  nIndicatiu: { nullable: true },
  password: { requiredOnCreate: true },
}

// Valores por defecto para roles cuando no llegan informados o no existen aun.
const DEFAULT_ROLES = {
  isAdmin: false,
  isGroc: false,
  isCapColla: false,
  isCapOperatiu: false,
}

// Estandarizamos la construccion de errores para que controller pueda responder con statusCode y detalles sin tener que interpretar cada caso manualmente.
function createDtoError(message, statusCode = 400, details) {
  const error = new Error(message)
  error.statusCode = statusCode

  if (details) { error.details = details }

  return error
}

// Comprobacion minima para asegurarnos de que el body recibido es un objeto JSON.
function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

// Validacion comun para todos los DTOs de usuario: el body debe ser un objeto JSON valido.
function ensureObject(payload, entityName) {
  if (!isPlainObject(payload)) {
    throw createDtoError(`El body de ${entityName} debe ser un objeto JSON valido.`)
  }
}

// Normaliza strings para que entren limpios al sistema: convierte a texto, elimina espacios sobrantes y controla si el campo es obligatorio o nullable.
function normalizeText(value, { fieldName, required = false, nullable = false } = {}) {
  if (value === undefined) {
    if (required) {
      throw createDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return undefined
  }

  if (value === null) {
    if (nullable) {
      return null
    }

    throw createDtoError(`El campo "${fieldName}" no puede ser null.`)
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    throw createDtoError(`El campo "${fieldName}" debe ser texto.`)
  }

  const normalizedValue = String(value).trim()

  if (!normalizedValue) {
    if (required) {
      throw createDtoError(`El campo "${fieldName}" es obligatorio.`)
    }

    return nullable ? null : undefined
  }

  return normalizedValue
}

// Aceptamos booleanos reales y tambien los strings 'true'/'false' para tolerar clientes que serializan mal el body. Todo lo demas se rechaza.
function normalizeBoolean(value, fieldName) {
  if (value === undefined) return undefined

  if (typeof value === 'boolean') return value

  if (['true', 'false'].includes(value)) {
    return value === 'true'
  }

  throw createDtoError(`El campo "${fieldName}" debe ser booleano.`)
}

// Los roles son un subobjeto del usuario. Esta funcion los normaliza por separado para poder reutilizarla tanto en create como en update parcial.
function normalizeRoles(rolesPayload, { partial = false } = {}) {
  if (rolesPayload === undefined) {
    return partial ? undefined : { ...DEFAULT_ROLES }
  }

  if (!isPlainObject(rolesPayload)) {
    throw createDtoError('El campo "roles" debe ser un objeto JSON valido.')
  }

  const base = partial ? {} : { ...DEFAULT_ROLES }

  return ROLE_FIELDS.reduce((acc, field) => {
    const value = normalizeBoolean(rolesPayload[field], `roles.${field}`)
    if (value !== undefined) acc[field] = value
    return acc
  }, base)
}

// Este builder concentra el mapeo de campos de texto comunes.
// mode=create exige obligatorios; mode=update solo incluye lo que realmente llega.
function buildUserTextDto(body, mode) {
  const dto = {}

  for (const [field, options] of Object.entries(USER_TEXT_FIELDS)) {
    const normalizedValue = normalizeText(body[field], {
      fieldName: field,
      nullable: options.nullable,
      required: mode === 'create' && options.requiredOnCreate,
    })

    if (mode === 'create' || normalizedValue !== undefined || body[field] === null) {
      dto[field] = normalizedValue
    }
  }

  return dto
}

// DTO de alta: exige campos obligatorios, rellena defaults y opcionalmente permite inyectar un id si el service lo necesita para algun caso controlado.
function buildCreateUserDto(body, { id } = {}) {
  ensureObject(body, 'usuario')

  const dto = {
    ...buildUserTextDto(body, 'create'),
    isActive: normalizeBoolean(body.isActive, 'isActive') ?? true,
    roles: normalizeRoles(body.roles),
  }

  if (id !== undefined) {
    dto.id = id
  }

  return dto
}

// DTO de actualizacion: solo incluye los campos presentes en el body.
function buildUpdateUserDto(body) {
  ensureObject(body, 'usuario')

  const dto = buildUserTextDto(body, 'update')
  const normalizedIsActive = normalizeBoolean(body.isActive, 'isActive')

  if (normalizedIsActive !== undefined) {
    dto.isActive = normalizedIsActive
  }

  const normalizedRoles = normalizeRoles(body.roles, { partial: true })

  if (normalizedRoles !== undefined) {
    dto.roles = normalizedRoles
  }

  if (Object.keys(dto).length === 0) {
    throw createDtoError('Debes enviar al menos un campo para actualizar el usuario.')
  }

  return dto
}

// Prisma devuelve roles como relacion. Esta funcion los aplana a un objeto simple para que el resto del backend y el frontend consuman una estructura estable.
function extractRoles(roleRecords) {
  const role = Array.isArray(roleRecords) ? roleRecords[0] : null

  if (!role) return { ...DEFAULT_ROLES }

  return {
    ...DEFAULT_ROLES,
    ...ROLE_FIELDS.reduce((acc, field) => {
      acc[field] = role[field]
      return acc
    }, {}),
  }
}

// DTO de salida: define exactamente que datos del usuario salen por la API.
function mapUserToDto(user) {
  return {
    id: user.id,
    nCarnet: user.nCarnet,
    nIndicatiu: user.nIndicatiu,
    name: user.name,
    lastName: user.lastName,
    isActive: user.isActive,
    roles: extractRoles(user.roles),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

module.exports = {
  buildCreateUserDto,
  buildUpdateUserDto,
  createDtoError,
  extractRoles,
  mapUserToDto,
}