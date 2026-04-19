# ADF247

Monorepo con 3 partes:

- `database`: Prisma + PostgreSQL
- `api`: Express
- `client`: Angular

Este README esta pensado para que cualquier persona pueda clonar el repo y levantar el proyecto desde cero.

## 1) Requisitos

- Node.js 20 o superior
- npm 10 o superior
- PostgreSQL 14+ (o Docker)

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

Archivos de entorno disponibles:

- `database/.env.development`
- `database/.env.pro`
- `database/.env` (fallback)

Variable usada:

- `DATABASE_URL="postgresql://..."`

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
- `AEMET_OPENDATA_API_KEY`
- `NOTIFICATION_DEV_ALLOWED_NCARNETS` (solo en desarrollo)

Notas importantes:

- En desarrollo, la API carga `api/.env.development`.
- En produccion (`NODE_ENV=pro` o `production`), carga `api/.env.pro`.
- La API tambien carga automaticamente `database/.env.development` o `database/.env.pro` segun entorno.
- AEMET y Firebase pueden compartirse entre dev y pro si ambos apuntan al mismo proyecto operativo.
- En desarrollo, las push notifications solo se envian a usuarios activos cuyo `nCarnet` este en `NOTIFICATION_DEV_ALLOWED_NCARNETS` (y/o en `automation.developerNCarnets`).
- Si faltan secretos JWT en produccion, la API falla al iniciar auth (esperado).

## 5) Preparar la base de datos

### Arranque rapido de PostgreSQL con Docker (opcional)

```bash
docker compose -f docker-compose.postgres.yml up -d
```

Desde `database`:

```bash
npm run prisma:generate
npm run prisma:db:push
npm run prisma:seed
```

Alternativa recomendada desde raiz (entorno ya existente):

```bash
npm run db:prepare
```

Opcional para inspeccionar datos:

```bash
npm run prisma:studio
```

## 6) Arranque en desarrollo

Desde la raiz:

```bash
npm start
```

`npm start` (equivale a `npm run start:dev`) sincroniza esquema y levanta API + cliente.

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
- `npm run db:migrate:deploy`: aplica migraciones pendientes sobre la DB actual
- `npm run db:migrate:deploy:dev`: aplica migraciones en DB de desarrollo (`database/.env.development`)
- `npm run db:migrate:deploy:pro`: aplica migraciones en DB de produccion (`database/.env.pro`)
- `npm run db:sync`: sincroniza schema Prisma contra la DB (`prisma db push`)
- `npm run db:prepare`: genera cliente Prisma y aplica migraciones (`prisma migrate deploy`)
- `npm run db:prepare:dev`: genera cliente y aplica migraciones en desarrollo
- `npm run db:prepare:pro`: genera cliente y aplica migraciones en produccion
- `npm start`: arranca entorno de desarrollo completo (API + cliente)
- `npm run start:dev`: igual que `npm start`
- `npm run start:pro`: arranca API + cliente en modo produccion
- `npm run start:pro`: aplica DB, compila Angular y arranca API (sirviendo frontend estatico)
- `npm run dev`: alias de `npm run start:dev`
- `npm run pro`: alias de `npm run start:pro`
- `npm run test`: ejecuta tests API + cliente en modo no interactivo

### API (`api/package.json`)

- `npm run dev`: nodemon con `NODE_ENV=development`
- `npm run start`: inicio simple (usar con `NODE_ENV` desde PM2)
- `npm run start:dev`: inicio con `NODE_ENV=development`
- `npm run start:pro`: inicio con `NODE_ENV=production`
- `npm run test`: ejecuta runner de tests de Node

### Cliente (`client/package.json`)

- `npm run start`: servidor Angular en desarrollo
- `npm run start:pro`: servidor Angular en configuracion produccion
- `npm run build`: build produccion
- `npm run build:dev`: build desarrollo
- `npm run test`: tests en modo interactivo
- `npm run test:ci`: tests en modo no-watch

### Database (`database/package.json`)

- `npm run prisma:generate`
- `npm run prisma:generate:dev`
- `npm run prisma:generate:pro`
- `npm run prisma:migrate`
- `npm run prisma:migrate:deploy`
- `npm run prisma:migrate:deploy:dev`
- `npm run prisma:migrate:deploy:pro`
- `npm run prisma:baseline:pg` (genera SQL baseline PostgreSQL desde schema)
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

## 10) Nuevas acciones admin

### Ventanas de disponibilidad (API)

Endpoints disponibles:

- `GET /api/availability/windows`
- `POST /api/availability/windows`
- `PUT /api/availability/windows/:id`
- `DELETE /api/availability/windows/:id`

Campos de ventana:

- `userNCarnet`
- `fromDateTime`
- `toDateTime`
- `availabilityType` (`available` o `unavailable`)
- `source` (`manual`, `import`, `system`)
- `notes`

Comportamiento implementado:

- validacion de rangos (`toDateTime` debe ser posterior a `fromDateTime`)
- solape permitido solo si es del mismo tipo (fusion automatica de ventanas)
- solape con tipo distinto rechazado
- matching automatico al crear convocatoria para generar respuestas iniciales

### Importacion masiva de usuarios por CSV

Disponible en modulo de usuarios del cliente:

- boton `Importar CSV`
- descarga de plantilla v1
- modal de subida y preview de cabeceras
- reporte por fila (insertada/rechazada)

Endpoint backend:

- `POST /api/users/import`

Contrato de cabecera CSV v1:

`nCarnet,nIndicatiu,name,lastName,password,isActive,isAdmin,isGroc,isCapOperatiu,isCapColla`

Reglas clave:

- insercion por fila (sin rollback global)
- `nCarnet`, `name` y `password` obligatorios
- password minima de 6 caracteres
- limite de 2MB y maximo 1500 filas

### Semilla de ejemplo

El seed incluye ventanas iniciales de disponibilidad para pruebas funcionales.

### Orquestador de automatismos de notificaciones (API)

Endpoints disponibles:

- `POST /api/notifications/automation/run`
- `POST /api/notifications/automation/tasks/:taskKey/run`
- `GET /api/notifications/automation/runs`
- `GET /api/notifications/automation/runs/:id`
- `PUT /api/notifications/automation/config`

Persistencia de trazabilidad:

- `NotificationAutomationRun` (execution global)
- `NotificationAutomationTaskRun` (detalle por tarea)

Configuracion versionada (json):

- `automation.retentionDays`
- `automation.viewerNCarnets[]`
- `automation.monitoring.*`
- `automation.tasks[]`

## 11) Levantar en otra maquina (checklist rapido)

1. Clonar repo
2. `npm install`
3. `npm run install:all`
4. Preparar DB (`prisma:generate`, `migrate`, `seed`)
5. `npm run dev`
6. Abrir `http://localhost:4200`

## 12) Problemas frecuentes

### Puerto 3001 ocupado

- Cambia `PORT` en `api/.env.development` o libera el puerto.

### Error de Prisma Client no generado

- Ejecuta en `database`: `npm run prisma:generate`

### CORS bloqueando peticiones

- Verifica `CORS_ORIGIN` en `api/.env.development`.
- Para local, debe incluir `http://localhost:4200`.

### Login falla por JWT en produccion

- Revisa `JWT_SECRET` y `JWT_REFRESH_SECRET` en `api/.env.pro`.

### Error al abrir disponibilidad: tabla `AvailabilityWindow` no existe

Si aparece un error tipo `The table main.AvailabilityWindow does not exist`:

- Ejecuta `npm run db:prepare` desde la raiz.

### Migracion a PostgreSQL (estado actual)

- El proyecto ya esta preparado para usar `DATABASE_URL` de PostgreSQL.
- El historico de migraciones se ha reseteado para PostgreSQL y queda una migracion inicial limpia desde cero.
- El flujo recomendado actual es `prisma migrate deploy` (`npm run db:prepare`) para crear/actualizar esquema en despliegues.
- Puedes generar baseline SQL PostgreSQL con `npm run prisma:baseline:pg --prefix database`.

### PM2 en Raspberry

Se incluye `pm2.ecosystem.config.cjs` con perfiles `adf247-dev` y `adf247-pro`.

Ejemplos:

```bash
pm2 start pm2.ecosystem.config.cjs --only adf247-dev
pm2 start pm2.ecosystem.config.cjs --only adf247-pro
pm2 save
```

Importante:

- No uses `npx prisma ...` desde la raiz del repo, porque puede tomar una version global distinta y mostrar errores de schema incompatibles.

## 13) Postman

Coleccion incluida:

- `postman/ADF247.postman_collection.json`

Incluye requests de health, auth y users con variables de coleccion.

