# ADF247

Monorepo con 3 partes:

- `database`: Prisma + Microsoft SQL Server
- `dotnet-services`: API y worker de mensajería .NET 10
- `client`: Angular

Este README esta pensado para que cualquier persona pueda clonar el repo y levantar el proyecto desde cero.

## 1) Requisitos

- Node.js 20 o superior
- npm 10 o superior
- .NET SDK 10
- Microsoft SQL Server 2019 o superior

Comprobacion rapida:

```bash
node -v
npm -v
```

## 2) Estructura del repositorio

```
ADF247/
	client/
	database/
	dotnet-services/
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
- Instala dependencias de `database` y `client`

## 4) Configuracion de entorno

### Base de datos (Prisma)

Archivos de entorno disponibles:

- `database/.env.example` (plantilla versionada)
- `database/.env.development`
- `database/.env.pro`
- `database/.env` (fallback)

Variable usada:

- `DATABASE_URL="sqlserver://HOST:1433;database=DATABASE;user=USER;password=PASSWORD;encrypt=true;trustServerCertificate=true"`

Copia la plantilla al archivo del entorno correspondiente y sustituye sus valores ficticios. En produccion, usa un certificado confiable y configura `trustServerCertificate` segun la politica del entorno.

### Servicios .NET

Archivos ya presentes:

- `dotnet-services/.env.development`
- `dotnet-services/.env.pre`
- `dotnet-services/.env.pro`

Variables principales:

- `ASPNETCORE_ENVIRONMENT`
- `DATABASE_URL` o `ConnectionStrings__Adf247`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `FIREBASE_SERVICE_ACCOUNT_PATH`

Notas importantes:

- El despliegue migra automáticamente los ficheros secretos históricos desde `api/.env.<stage>` a `dotnet-services/.env.<stage>` durante el primer corte.
- La API .NET acepta `DATABASE_URL` en formato Prisma SQL Server para conservar los secretos de despliegue existentes.
- Si faltan secretos JWT en producción, la API falla al iniciar auth (esperado).

## 5) Preparar la base de datos

Desde `database`:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
```

La base de datos indicada por `database` en `DATABASE_URL` debe existir y estar vacia en una instalacion inicial. `prisma migrate deploy` crea el modelo completo bajo el esquema `dbo`.

Alternativa recomendada desde raiz (entorno ya existente):

```bash
npm run db:prepare
```

Opcional para inspeccionar datos:

```bash
npm run prisma:studio
```

## 6) Arranque en desarrollo

Antes de arrancar, asegura que la instancia SQL Server indicada en `DATABASE_URL` esta en ejecucion y que acepta conexiones TCP en el puerto configurado.

Desde la raiz:

```bash
npm start
```

`npm start` (equivale a `npm run start:dev`) sincroniza esquema y levanta API + cliente.

Esto levanta:

- API en `http://localhost:3001`
- Cliente en `http://localhost:4200`

Comprobacion API:

- `http://localhost:5000/api/health`

## 7) Credenciales de prueba (seed)

El seed crea usuarios de ejemplo con password en claro definida en `database/prisma/seed.js`.

Ejemplos:

- `nCarnet: 247/GI/239` / `password: Airline7`
- `nCarnet: 247/GI/200` / `password: Airline1`

## 8) Scripts disponibles

### Raiz

- `npm run install:all`: instala dependencias en `database` y `client`
- `npm run db:migrate:deploy`: aplica migraciones pendientes sobre la DB actual
- `npm run db:migrate:deploy:dev`: aplica migraciones en DB de desarrollo (`database/.env.development`)
- `npm run db:migrate:deploy:pro`: aplica migraciones en DB de produccion (`database/.env.pro`)
- `npm run db:sync`: sincroniza schema Prisma contra la DB (`prisma db push`)
- `npm run db:prepare`: genera cliente Prisma y aplica migraciones (`prisma migrate deploy`)
- `npm run db:prepare:dev`: genera cliente y aplica migraciones en desarrollo
- `npm run db:prepare:pro`: genera cliente y aplica migraciones en produccion
- `npm start`: arranca entorno de desarrollo completo (API + cliente)
- `npm run start:dev`: igual que `npm start`
- `npm run start:pro`: aplica DB, compila Angular y arranca la API .NET en modo producción
- `npm run dev`: alias de `npm run start:dev`
- `npm run pro`: alias de `npm run start:pro`
- `npm run test`: compila los servicios .NET y ejecuta los tests no interactivos del cliente

### Servicios .NET

- `dotnet run --project dotnet-services/ADF247.Api`: arranca la API.
- `dotnet build dotnet-services/ADF247.slnx`: compila la API y el worker de mensajería.

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
- `npm run prisma:baseline` (genera una baseline para el datasource del schema)
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

### Puerto 8080 ocupado

- Cambia el puerto del perfil local de ASP.NET Core o libera el puerto.

### Error de Prisma Client no generado

- Ejecuta en `database`: `npm run prisma:generate`

### Login falla por JWT en produccion

- Revisa `JWT_SECRET` y `JWT_REFRESH_SECRET` en `dotnet-services/.env.pro`.

### Error al abrir disponibilidad: tabla `AvailabilityWindow` no existe

Si aparece un error tipo `The table main.AvailabilityWindow does not exist`:

- Ejecuta `npm run db:prepare` desde la raiz.

### Microsoft SQL Server (estado actual)

- Prisma usa exclusivamente `DATABASE_URL` para conectarse a SQL Server.
- El historico contiene una baseline SQL Server para crear el modelo completo desde cero.
- El flujo recomendado es `prisma migrate deploy` (`npm run db:prepare`) para crear o actualizar el esquema.
- Puedes generar una nueva baseline desde el schema con `npm run prisma:baseline --prefix database`.

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
