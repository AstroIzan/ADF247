# PostgreSQL Migration Status

Estado actualizado: 2026-04-19

## Hecho

- Prisma datasource cambiado a `postgresql`.
- Carga de entorno unificada (`api/.env.*` + `database/.env.*`) segun `NODE_ENV`.
- Scripts raiz estandarizados para `start:dev` y `start:pro`.
- Historico de migraciones Prisma reseteado para PostgreSQL.
- Carpeta `database/prisma/migrations` limpiada de SQL SQLite y reconstruida con una unica migracion inicial PostgreSQL.
- `db:prepare` actualizado a `prisma generate + prisma migrate deploy`.
- Flujo DB por entorno habilitado: `db:prepare:dev` y `db:prepare:pro`.
- Filtro de notificaciones en desarrollo para enviar solo a usuarios permitidos por `nCarnet` y existentes en BBDD.
- PM2 ecosystem incluido para API y cliente en dev/pro.
- Credenciales de AEMET y Firebase alineadas entre dev/pro en `.env` de API.

## Pendiente Critico

1. Migrar datos de SQLite a PostgreSQL (si hay datos reales que conservar).
- Exportar desde SQLite.
- Importar a PostgreSQL con script ETL o carga por tablas.
- Verificar integridad referencial y recuentos.

2. Endurecer secretos para produccion.
- Cambiar `JWT_SECRET` y `JWT_REFRESH_SECRET` por valores fuertes.
- Revisar `CORS_ORIGIN` a dominios finales.

## Pendiente Recomendado

1. Despliegue cliente en pro con build estatico.
- Para Raspberry suele ser mejor `ng build` + Nginx/Caddy que `ng serve`.

2. Pipeline de despliegue.
- Añadir tareas de `db:prepare`, healthcheck y reinicio PM2.

## Comandos base actuales

Desde raiz:

```bash
sudo systemctl restart postgresql
npm run install:all
npm run db:prepare
npm start
```

Produccion (api + cliente por PM2 ecosystem):

```bash
pm2 start pm2.ecosystem.config.cjs --only adf247-pro
pm2 save
```

## Validaciones minimas antes de cutover

- `GET /health` responde `ok: true`.
- Login y refresh token funcionando.
- Creacion/edicion de convocatorias correcta.
- Notificaciones push en dev llegan solo a usuarios permitidos.
- `prisma migrate deploy` aplica correctamente la migracion inicial en PostgreSQL vacio.
- Prisma generate y tests API verdes.
