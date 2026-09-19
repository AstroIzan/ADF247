param(
  [string]$MigrationName = "sqlserver_baseline"
)

$ErrorActionPreference = 'Stop'

$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$migrationDir = Join-Path $PSScriptRoot "..\prisma\migrations\$timestamp`_$MigrationName"
$sqlPath = Join-Path $migrationDir "migration.sql"

New-Item -Path $migrationDir -ItemType Directory -Force | Out-Null

npx prisma migrate diff `
  --from-empty `
  --to-schema-datamodel prisma/schema.prisma `
  --script `
  --output $sqlPath

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $sqlPath)) {
  throw "No se pudo generar la migracion baseline para el datasource configurado."
}

Write-Host "Baseline generado en: $sqlPath"