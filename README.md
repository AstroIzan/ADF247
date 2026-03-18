# ADF247

Monorepo con tres partes:
- `database` (Prisma + SQLite)
- `api` (Express)
- `client` (Angular)

## Requisitos

- Node.js 20+
- npm 10+

## Instalacion rapida

1. Clonar el repositorio.
2. En la raiz, instalar todo:

```bash
npm install
npm run install:all
```

## Preparar base de datos

Desde la carpeta `database`:

```bash
npm run prisma:generate
npx prisma migrate dev --name adf_schema
node prisma/seed.js
```

Opcional, abrir Prisma Studio:

```bash
npm run prisma:studio
```

## Estructura BBDD actual (resumen)

- Users: voluntarios ADF con `nCarnet` unico y `nIndicatiu` opcional.
- Roles: permisos y rol operativo por usuario (`isCapOperatiu`, `isCapColla`, `isAdmin`, `isGroc`).
- ConvoTypes: tipos de convocatoria (`Guardia`, `Formacion`, `Salida`).
- Convocatories: convocatorias de guardias/formaciones/salidas.
- Respostes: respuestas de disponibilidad por usuario y convocatoria.

## Seed de desarrollo

- El seed activo esta en `database/prisma/seed.js`.
- Carga 8 usuarios de ejemplo ADF, tipos de convocatoria y varias convocatorias.
- Si quieres volver a cargarlo desde cero, ejecuta de nuevo:

```bash
node prisma/seed.js
```

## Ejecutar proyecto

Desde la raiz:

```bash
npm run dev
```

Esto levanta:
- API en `http://localhost:3001`
- Cliente Angular en `http://localhost:4200`

## Comprobacion basica

- Estado API: `http://localhost:3001/health`

