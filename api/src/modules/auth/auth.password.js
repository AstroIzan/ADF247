const bcrypt = require('bcrypt')

const DEFAULT_SALT_ROUNDS = 10

function getSaltRounds() {
  const parsedValue = Number.parseInt(process.env.PASSWORD_SALT_ROUNDS, 10)

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_SALT_ROUNDS
}

function isPasswordHash(value) {
  return typeof value === 'string' && value.startsWith('$2')
}

async function hashPassword(password) {
  if (isPasswordHash(password)) {
    return password
  }

  return bcrypt.hash(password, getSaltRounds())
}

async function verifyPassword(rawPassword, storedPassword) {
  if (typeof storedPassword !== 'string' || !storedPassword) {
    return false
  }

  if (isPasswordHash(storedPassword)) {
    return bcrypt.compare(rawPassword, storedPassword)
  }

  return rawPassword === storedPassword
}

module.exports = {
  hashPassword,
  isPasswordHash,
  verifyPassword,
}