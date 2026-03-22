// El controller es la capa HTTP del modulo users.
// Solo se encarga de leer parametros de la request, llamar al service y traducir
// el resultado o el error a una respuesta JSON.
const usersService = require('./users.service')

// Los ids llegan por URL como string. Aqui los convertimos y validamos una sola vez
// para no repetir la misma comprobacion en cada handler.
function parseUserId(rawId) {
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error('El parametro "id" debe ser un numero entero positivo.')
    error.statusCode = 400
    throw error
  }

  return id
}

// Respuesta de error comun para todos los endpoints del controller.
// Si el service ya adjunto statusCode o details, los respetamos.
function sendErrorResponse(res, error) {
  const statusCode = error.statusCode || 500
  const payload = {
    message: error.message || 'Ha ocurrido un error interno en el servidor.',
  }

  if (error.details) {
    payload.details = error.details
  }

  res.status(statusCode).json(payload)
}

// GET /users -> lista completa de usuarios.
async function getUsers(_req, res) {
  try {
    const users = await usersService.getAllUsers()
    res.json(users)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

// GET /users/:id -> devuelve un unico usuario si existe.
async function getUserById(req, res) {
  try {
    const userId = parseUserId(req.params.id)
    const user = await usersService.getUserById(userId)
    res.json(user)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

// POST /users -> crea un usuario usando el body enviado por el cliente.
async function createUser(req, res) {
  try {
    const user = await usersService.createUser(req.body)
    res.status(201).json(user)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

// PUT /users/:id -> actualiza un usuario existente. No crea si no existe.
async function updateUser(req, res) {
  try {
    const userId = parseUserId(req.params.id)
    const user = await usersService.updateUser(userId, req.body)
    res.json(user)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

// DELETE /users/:id -> elimina el usuario y devuelve el registro eliminado.
async function deleteUser(req, res) {
  try {
    const userId = parseUserId(req.params.id)
    const deletedUser = await usersService.deleteUser(userId)
    res.json(deletedUser)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
}
