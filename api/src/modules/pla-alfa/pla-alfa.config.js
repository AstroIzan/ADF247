const fs = require('fs')
const path = require('path')

const PLA_ALFA_CONFIG_PATH = path.join(__dirname, '../../../config/pla-alfa-municipalities.json')

function sanitizeTextValue(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  // Recover common mojibake when text was decoded with the wrong charset.
  if (trimmed.includes('Ã') || trimmed.includes('Â')) {
    try {
      return Buffer.from(trimmed, 'latin1').toString('utf8').trim()
    } catch {
      return trimmed
    }
  }

  return trimmed
}

function normalizeMunicipalityList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  const unique = new Set()

  for (const entry of value) {
    if (typeof entry !== 'string') {
      continue
    }

    const normalized = sanitizeTextValue(entry)
    if (!normalized) {
      continue
    }

    unique.add(normalized)
  }

  return Array.from(unique)
}

function parseSelectionFromText(rawText) {
  const sanitized = String(rawText || '').replace(/^\uFEFF/, '')
  const parsed = JSON.parse(sanitized)
  const municipalities = normalizeMunicipalityList(parsed?.municipalities)
  const principalRaw = sanitizeTextValue(parsed?.principalMunicipality)

  return {
    municipalities,
    principalMunicipality: principalRaw,
  }
}

function writeSelectionFile(municipalities, principalMunicipality) {
  const payload = {
    municipalities,
    principalMunicipality,
  }

  fs.writeFileSync(PLA_ALFA_CONFIG_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

function readSelectionWithEncodingFallback() {
  const rawBuffer = fs.readFileSync(PLA_ALFA_CONFIG_PATH)

  let utf8Parsed = null
  try {
    utf8Parsed = parseSelectionFromText(rawBuffer.toString('utf8'))
  } catch {
    utf8Parsed = null
  }

  const utf8HasReplacementChar = rawBuffer.toString('utf8').includes('\uFFFD')
  if (utf8Parsed && !utf8HasReplacementChar) {
    return {
      ...utf8Parsed,
      recoveredFromFallback: false,
    }
  }

  try {
    const latin1Parsed = parseSelectionFromText(rawBuffer.toString('latin1'))
    return {
      ...latin1Parsed,
      recoveredFromFallback: true,
    }
  } catch {
    if (utf8Parsed) {
      return {
        ...utf8Parsed,
        recoveredFromFallback: false,
      }
    }

    throw new Error('No se ha podido leer la configuracion de Pla Alfa.')
  }
}

function readPlaAlfaMunicipalities() {
  try {
    const { municipalities } = readSelectionWithEncodingFallback()
    return municipalities
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

function readPlaAlfaSelection() {
  try {
    const selection = readSelectionWithEncodingFallback()
    const municipalities = normalizeMunicipalityList(selection?.municipalities)
    const principalRaw = sanitizeTextValue(selection?.principalMunicipality)
    const principalMunicipality = principalRaw && municipalities.includes(principalRaw)
      ? principalRaw
      : null

    if (selection.recoveredFromFallback) {
      writeSelectionFile(municipalities, principalMunicipality)
    }

    return {
      municipalities,
      principalMunicipality,
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        municipalities: [],
        principalMunicipality: null,
      }
    }

    throw error
  }
}

function updatePlaAlfaMunicipalities(municipalities, principalMunicipality = null) {
  const normalized = normalizeMunicipalityList(municipalities)
  const sorted = [...normalized].sort((a, b) => a.localeCompare(b, 'ca'))
  const principalRaw = sanitizeTextValue(principalMunicipality)
  const principal = principalRaw && sorted.includes(principalRaw)
    ? principalRaw
    : null

  writeSelectionFile(sorted, principal)

  return {
    municipalities: sorted,
    principalMunicipality: principal,
  }
}

module.exports = {
  readPlaAlfaSelection,
  readPlaAlfaMunicipalities,
  updatePlaAlfaMunicipalities,
}
