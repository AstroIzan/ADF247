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

## Auth JWT

- `POST /api/auth/login` recibe `nCarnet` y `password`.
- `POST /api/auth/refresh` recibe `refreshToken` y devuelve un nuevo `accessToken` y `refreshToken`.
- `GET /api/auth/me` requiere header `Authorization: Bearer <token>`.
- El login devuelve `accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `refreshExpiresIn` y `user`.
- El objeto `user` ya incluye `nCarnet`, `isActive` y `roles`, pensado para que el cliente lo cachee y no tenga que pedirlo a la API en cada vista.

## Variables de entorno utiles

- `PORT`: puerto del API.
- `JWT_SECRET`: secreto de firma para access tokens.
- `JWT_EXPIRES_IN`: expiracion del token, por ejemplo `12h`.
- `JWT_REFRESH_SECRET`: secreto de firma para refresh tokens.
- `JWT_REFRESH_EXPIRES_IN`: expiracion del refresh token, por ejemplo `30d`.
- `CORS_ORIGIN`: lista separada por comas de origenes permitidos. Por defecto `http://localhost:4200`.
- `PASSWORD_SALT_ROUNDS`: coste bcrypt para contrasenas nuevas.

## Entornos API

- Desarrollo: `api/.env.development`
- Produccion: `api/.env.pro`

La API carga primero el archivo de entorno segun `NODE_ENV` y despues `api/.env` como fallback.

Ejemplo de refresh desde cliente:

```http
POST /api/auth/refresh
Content-Type: application/json

{
	"refreshToken": "<token>"
}
```

## Coleccion Postman

- Archivo: `postman/ADF247.postman_collection.json`.
- Incluye health, auth y users con variables reutilizables (`baseUrl`, `token`, `userId`, `newUserId`).
- El request de login guarda automaticamente el token y el userId en variables de coleccion.

