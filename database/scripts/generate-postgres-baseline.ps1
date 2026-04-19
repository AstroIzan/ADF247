param(
  [string]$MigrationName = "postgresql_baseline"
)

$ErrorActionPreference = 'Stop'

$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$migrationDir = Join-Path $PSScriptRoot "..\prisma\migrations\$timestamp`_$MigrationName"
$sqlPath = Join-Path $migrationDir "migration.sql"

New-Item -Path $migrationDir -ItemType Directory -Force | Out-Null

$scriptOutput = npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script

if (-not $scriptOutput) {
  throw "No se pudo generar SQL baseline para PostgreSQL."
}

$scriptOutput | Out-File -FilePath $sqlPath -Encoding utf8

Write-Host "Baseline PostgreSQL generado en: $sqlPath"
