# Tutorial completo de arranque por entorno (DEV y PRO)

Este documento te sirve como guia unica para levantar el proyecto sin volver al chat.

Incluye:

- Preparacion inicial
- Configuracion pendiente por entorno
- Arranque en DEV
- Arranque en PRO (local, simulando servidor)
- Arranque con PM2 (modo servidor)
- Verificaciones
- Problemas frecuentes

## 1. Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 14+

Comprobacion:

```bash
node -v
npm -v
```

## 2. Estructura y concepto de entornos

- DEV usa:
  - `api/.env.development`
  - `database/.env.development`
- PRO usa:
  - `api/.env.pro`
  - `database/.env.pro`

Credenciales compartidas entre DEV y PRO segun tu decision actual:

- `AEMET_OPENDATA_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_PATH`

## 3. Configuracion pendiente antes de levantar

### 3.1 Pendiente en DEV

Revisar:

- `database/.env.development`
- `api/.env.development`

Valores clave:

- `DATABASE_URL` apuntando a `adf247_dev`
- `NOTIFICATION_DEV_ALLOWED_NCARNETS` con los nCarnet permitidos para push en desarrollo
- Ruta valida de Firebase service account

### 3.2 Pendiente en PRO

Revisar:

- `database/.env.pro`
- `api/.env.pro`

Valores que debes cambiar si siguen con placeholder:

- `database/.env.pro`
  - `DATABASE_URL` (password real)
- `api/.env.pro`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - `CORS_ORIGIN`

Valores compartidos DEV/PRO ya alineados:

- `AEMET_OPENDATA_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_PATH`

## 4. Instalacion inicial (una sola vez)

Desde raiz del repo:

```bash
npm install
npm run install:all
```

## 5. Levantar PostgreSQL local

En Raspberry/Linux con PostgreSQL del sistema:

```bash
sudo systemctl enable postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql --no-pager
```

## 6. Arranque en DEV (paso a paso)

### 6.1 Preparar base de datos DEV

```bash
npm run db:prepare:dev
```

### 6.2 Seed DEV (usuarios + convoTypes + datos ejemplo)

```bash
npm run db:seed:dev
```

### 6.3 Levantar entorno DEV completo

```bash
npm start
```

Equivale a `npm run start:dev`.

### 6.4 Verificar DEV

- API health: `http://localhost:3001/health`
- Frontend: `http://localhost:4200`

## 7. Arranque en PRO local (simulando servidor)

### 7.1 Preparar base de datos PRO

```bash
npm run db:prepare:pro
```

### 7.2 Seed PRO (solo si quieres datos iniciales)

```bash
npm run db:seed:pro
```

### 7.3 Arrancar PRO

```bash
npm run start:pro
```

En PRO:

- Se compila Angular
- La API sirve el frontend estatico
- Se accede todo por el puerto API

### 7.4 Verificar PRO

- Health: `http://localhost:3001/health`
- App: `http://localhost:3001`

## 8. PM2 (modo servidor)

El ecosistema ya esta preparado en `pm2.ecosystem.config.cjs`.

### 8.1 Levantar PRO con PM2

```bash
pm2 start pm2.ecosystem.config.cjs --only adf247-pro
pm2 save
```

### 8.2 Revisar estado/logs

```bash
pm2 status
pm2 logs adf247-pro
```

### 8.3 Reiniciar tras cambios

```bash
pm2 restart adf247-pro --update-env
```

## 9. Scripts utiles de referencia

Desde raiz:

- `npm run db:prepare:dev`
- `npm run db:prepare:pro`
- `npm run db:seed:dev`
- `npm run db:seed:pro`
- `npm run start:dev`
- `npm run start:pro`

## 10. Problemas frecuentes

### 10.1 Error P1001 (PostgreSQL no accesible)

Causa:

- PostgreSQL no esta levantado en host/puerto de `DATABASE_URL`.

Solucion:

- Arrancar servicio PostgreSQL local (`sudo systemctl restart postgresql`).

### 10.2 Seed falla por tablas/relaciones

Causa:

- DB sin migrar.

Solucion:

```bash
npm run db:prepare:dev
npm run db:seed:dev
```

(o pro, segun entorno)

### 10.3 Push en DEV no llega a todos

Comportamiento esperado:

- En DEV solo se envia a nCarnet permitidos en `NOTIFICATION_DEV_ALLOWED_NCARNETS` y existentes/activos en BBDD.

### 10.4 Frontend no carga en PRO

Revisar:

- `npm run start:pro` completo sin errores
- Ruta `FRONTEND_DIST_PATH` en `api/.env.pro`

## 11. Checklist rapido final

DEV:

1. PostgreSQL levantado
2. `npm run db:prepare:dev`
3. `npm run db:seed:dev`
4. `npm start`

PRO:

1. Variables reales en `.env.pro`
2. PostgreSQL pro accesible
3. `npm run db:prepare:pro`
4. (Opcional) `npm run db:seed:pro`
5. `npm run start:pro` o PM2 `adf247-pro`
