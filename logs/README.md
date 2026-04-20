# Logs

Este directorio centraliza los logs operativos en formato JSONL (una linea JSON por evento).

## Archivos actuales

- `logs/api/app.log`: eventos de aplicacion de la API.
- `logs/api/requests.log`: trazas de peticiones HTTP de la API.
- `logs/api/app-requests.log`: navegacion de usuarios en la app (rutas/sections).

Las rutas se configuran con variables de entorno:

- `APP_LOG_FILE`
- `REQUESTS_LOG_FILE`
- `APP_REQUESTS_LOG_FILE`

## Formato JSONL

`app.log`:

- `timestamp`
- `level`
- `service`
- `module`
- `message`
- `error` (opcional)
- `env`

`requests.log`:

- `timestamp`
- `method`
- `route`
- `status`
- `duration_ms`
- `ip`
- `userId` (opcional)
- `userAgent`
- `query`
- `body`

`app-requests.log`:

- `timestamp`
- `route`
- `section`
- `source`
- `ip`
- `userAgent`
- `userId` (opcional)
- `nCarnet` (opcional)

## Nota de operacion

La rotacion y retencion ya no las hace la aplicacion. Se recomienda gestionarlas con el sistema de logs del servidor o el pipeline de observabilidad (Promtail/Loki/Grafana).

Los archivos `*.log` estan ignorados por git.
