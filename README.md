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
npm run prisma:migrate -- --name init
```

Opcional, abrir Prisma Studio:

```bash
npm run prisma:studio
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

