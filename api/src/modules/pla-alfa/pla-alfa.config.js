const fs = require('fs')
const path = require('path')

const PLA_ALFA_CONFIG_PATH = path.join(__dirname, '../../../config/pla-alfa-municipalities.json')

function normalizeMunicipalityList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  const unique = new Set()

  for (const entry of value) {
    if (typeof entry !== 'string') {
      continue
    }

    const normalized = entry.trim()
    if (!normalized) {
      continue
    }

    unique.add(normalized)
  }

  return Array.from(unique)
}

function readPlaAlfaMunicipalities() {
  try {
    const rawContent = fs.readFileSync(PLA_ALFA_CONFIG_PATH, 'utf8')
    const sanitized = rawContent.replace(/^\uFEFF/, '')
    const parsed = JSON.parse(sanitized)
    return normalizeMunicipalityList(parsed?.municipalities)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

function updatePlaAlfaMunicipalities(municipalities) {
  const normalized = normalizeMunicipalityList(municipalities)
  const sorted = [...normalized].sort((a, b) => a.localeCompare(b, 'ca'))

  const payload = {
    municipalities: sorted,
  }

  fs.writeFileSync(PLA_ALFA_CONFIG_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  return sorted
}

module.exports = {
  readPlaAlfaMunicipalities,
  updatePlaAlfaMunicipalities,
}
