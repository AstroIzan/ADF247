const path = require('path')
const dotenv = require('dotenv')

const environment = (process.env.NODE_ENV || 'development').toLowerCase()
const normalizedEnvironment = environment === 'pro' ? 'production' : environment
const envFileName =
  normalizedEnvironment === 'production'
    ? '.env.pro'
    : `.env.${normalizedEnvironment}`

const databaseEnvFileName =
  normalizedEnvironment === 'production'
    ? '.env.pro'
    : `.env.${normalizedEnvironment}`

const ENV_PATHS = [
  path.resolve(__dirname, `../../${envFileName}`),
  path.resolve(__dirname, '../../.env.production'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, `../../../database/${databaseEnvFileName}`),
  path.resolve(__dirname, '../../../database/.env'),
]

for (const envPath of ENV_PATHS) {
  dotenv.config({ path: envPath })
}
