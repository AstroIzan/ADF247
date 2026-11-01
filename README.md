# ADF247

Monorepo con 3 partes:

- `database`: migraciones SQL versionadas + migrador .NET (Microsoft SQL Server)
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
- Instala dependencias de `client`

## 4) Configuracion de entorno

### Base de datos

El migrador (`database/ADF247.Database.Migrator`) lee la conexion de variables de entorno, igual que los servicios .NET:

- `ConnectionStrings__Adf247`, o
- `DATABASE_URL="sqlserver://HOST:1433;database=DATABASE;user=USER;password=PASSWORD;encrypt=true;trustServerCertificate=true"`

Exporta la variable antes de ejecutar `npm run db:migrate`. En produccion, usa un certificado confiable y configura `trustServerCertificate` segun la politica del entorno.

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

- El migrador y la API .NET aceptan `DATABASE_URL` en formato `sqlserver://...` para conservar los secretos de despliegue existentes.
- Si faltan secretos JWT en producción, la API falla al iniciar auth (esperado).

## 5) Preparar la base de datos

Desde la raiz:

```bash
npm run db:migrate
npm run db:seed:dev   # opcional, solo desarrollo
```

La base de datos indicada por `database` en la cadena de conexion debe existir y estar vacia en una instalacion inicial. El migrador crea el modelo completo bajo el esquema `dbo`.

Equivalente directo: `dotnet run --project database/ADF247.Database.Migrator -- migrate`.

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

El seed crea usuarios de ejemplo con password en claro definida en `database/ADF247.Database.Migrator/DevSeeder.cs`.

Ejemplos:

- `nCarnet: 247/GI/239` / `password: Airline7`
- `nCarnet: 247/GI/200` / `password: Airline1`

## 8) Scripts disponibles

### Raiz

- `npm run install:all`: instala dependencias del `client`
- `npm run db:migrate` / `npm run db:prepare`: aplica migraciones pendientes con el migrador .NET
- `npm run db:seed:dev`: ejecuta migraciones y carga datos de ejemplo (borra datos existentes)
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
4. Preparar DB (`npm run db:prepare` y, opcionalmente, `npm run db:seed:dev`)
5. `npm run dev`
6. Abrir `http://localhost:4200`

## 12) Problemas frecuentes

### Puerto 8080 ocupado

- Cambia el puerto del perfil local de ASP.NET Core o libera el puerto.


### Login falla por JWT en produccion

- Revisa `JWT_SECRET` y `JWT_REFRESH_SECRET` en `dotnet-services/.env.pro`.

### Error al abrir disponibilidad: tabla `AvailabilityWindow` no existe

Si aparece un error tipo `The table main.AvailabilityWindow does not exist`:

- Ejecuta `npm run db:prepare` desde la raiz.

### Microsoft SQL Server (estado actual)

- El migrador .NET usa `ConnectionStrings__Adf247` o `DATABASE_URL` (formato `sqlserver://host:puerto;database=...;user=...;password=...`).
- Las migraciones SQL versionadas estan en `database/migrations` y se incrustan en el migrador; el historial se guarda en `dbo.SchemaMigration`.
- En bases ya migradas con Prisma, el migrador importa automaticamente las migraciones completadas de `dbo._prisma_migrations`.
- Flujo recomendado: `npm run db:prepare` (equivale a `migrate`).
- Para anadir una migracion crea `database/migrations/<yyyyMMddHHmmss>_<nombre>/migration.sql` con el SQL idempotente y transaccional.

### PM2 en Raspberry

Se incluye `pm2.ecosystem.config.cjs` con perfiles `adf247-dev` y `adf247-pro`.

Ejemplos:

```bash
pm2 start pm2.ecosystem.config.cjs --only adf247-dev
pm2 start pm2.ecosystem.config.cjs --only adf247-pro
pm2 save
```

Importante:

- La base de datos se gestiona con `database/ADF247.Database.Migrator`; no hay herramientas Node para el esquema.

## 13) Postman

Coleccion incluida:

- `postman/ADF247.postman_collection.json`

Incluye requests de health, auth y users con variables de coleccion.
