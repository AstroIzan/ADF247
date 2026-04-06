# Logs

Este directorio centraliza los logs de API y cliente.

- `logs/api`: eventos de aplicacion de la API (indice `applogs`).
- `logs/client`: eventos de aplicacion del cliente Angular (indice `applogs`).
- `logs/accesslogs`: trazas de peticiones HTTP API+cliente (indice `accesslogs`).

## Rotacion y retencion

- Rotacion diaria por fecha (`YYYY-MM-DD`).
- Retencion de los ultimos 30 dias.
- Los archivos antiguos se comprimen automaticamente (`.gz`).

## Patrones de archivo

- `applogs` (API): `applogs-YYYY-MM-DD.log` y `applogs-error-YYYY-MM-DD.log`
- `applogs` (Client): `applogs-YYYY-MM-DD.log` y `applogs-error-YYYY-MM-DD.log`
- `accesslogs` (API+Client): `accesslogs-YYYY-MM-DD.log` y `accesslogs-error-YYYY-MM-DD.log`

Los archivos `*.log` estan ignorados por git.
