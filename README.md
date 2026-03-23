# ADF247

Monorepo con 3 partes:

- `database`: Prisma + SQLite
- `api`: Express
- `client`: Angular

Este README esta pensado para que cualquier persona pueda clonar el repo y levantar el proyecto desde cero.

## 1) Requisitos

- Node.js 20 o superior
- npm 10 o superior

Comprobacion rapida:

```bash
node -v
npm -v
```

## 2) Estructura del repositorio

```
ADF247/
	api/
	client/
	database/
	postman/
	package.json (scripts raiz)
```

## 3) Instalacion completa

Desde la raiz del repo:

```bash
npm install
npm run install:all
```

Que hace esto:

- Instala dependencias de la raiz (incluye `concurrently`)
- Instala dependencias de `database`, `api` y `client`

## 4) Configuracion de entorno

### Base de datos (Prisma)

Archivo ya presente:

- `database/.env`

Variable usada:

- `DATABASE_URL="file:./dev.db"`

### API

Archivos ya presentes:

- `api/.env.development`
- `api/.env.pro`

Variables principales:

- `NODE_ENV`
- `PORT`
- `CORS_ORIGIN`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `PASSWORD_SALT_ROUNDS`

Notas importantes:

- En desarrollo, la API carga `api/.env.development`.
- En produccion (`NODE_ENV=pro` o `production`), carga `api/.env.pro`.
- Si faltan secretos JWT en produccion, la API falla al iniciar auth (esperado).

## 5) Preparar la base de datos

Desde `database`:

```bash
npm run prisma:generate
npx prisma migrate dev --name adf_schema
npm run prisma:seed
```

Opcional para inspeccionar datos:

```bash
npm run prisma:studio
```

## 6) Arranque en desarrollo

Desde la raiz:

```bash
npm run dev
```

Esto levanta:

- API en `http://localhost:3001`
- Cliente en `http://localhost:4200`

Comprobacion API:

- `http://localhost:3001/health`

## 7) Credenciales de prueba (seed)

El seed crea usuarios de ejemplo con password en claro definida en `database/prisma/seed.js`.

Ejemplos:

- `nCarnet: 247/GI/239` / `password: Airline7`
- `nCarnet: 247/GI/200` / `password: Airline1`

## 8) Scripts disponibles

### Raiz

- `npm run install:all`: instala dependencias en `database`, `api` y `client`
- `npm run dev`: arranca API + cliente en paralelo
- `npm run pro`: arranca API en modo pro y ejecuta build del cliente

### API (`api/package.json`)

- `npm run dev`: nodemon con `NODE_ENV=development`
- `npm run start`: inicio simple
- `npm run start:pro`: inicio con `NODE_ENV=pro`

### Cliente (`client/package.json`)

- `npm run start`: servidor Angular
- `npm run build`: build produccion
- `npm run build:dev`: build desarrollo

### Database (`database/package.json`)

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run prisma:studio`

## 9) API Auth (resumen)

- `POST /api/auth/login` con `nCarnet` y `password`
- `POST /api/auth/refresh` con `refreshToken`
- `GET /api/auth/me` con `Authorization: Bearer <token>`

Respuesta de login/refresh incluye:

- `accessToken`
- `refreshToken`
- `tokenType`
- `expiresIn`
- `refreshExpiresIn`
- `user`

## 10) Levantar en otra maquina (checklist rapido)

1. Clonar repo
2. `npm install`
3. `npm run install:all`
4. Preparar DB (`prisma:generate`, `migrate`, `seed`)
5. `npm run dev`
6. Abrir `http://localhost:4200`

## 11) Problemas frecuentes

### Puerto 3001 ocupado

- Cambia `PORT` en `api/.env.development` o libera el puerto.

### Error de Prisma Client no generado

- Ejecuta en `database`: `npm run prisma:generate`

### CORS bloqueando peticiones

- Verifica `CORS_ORIGIN` en `api/.env.development`.
- Para local, debe incluir `http://localhost:4200`.

### Login falla por JWT en produccion

- Revisa `JWT_SECRET` y `JWT_REFRESH_SECRET` en `api/.env.pro`.

## 12) Postman

Coleccion incluida:

- `postman/ADF247.postman_collection.json`

Incluye requests de health, auth y users con variables de coleccion.

