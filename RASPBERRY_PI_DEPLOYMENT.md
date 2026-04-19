# Raspberry Pi OS + PM2 Deployment

## 1) Dependencias base

```bash
sudo apt update
sudo apt install -y git curl ca-certificates build-essential
```

## 2) Node.js LTS + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 3) PostgreSQL local (opcion A: Docker)

Instala Docker y levanta PostgreSQL del proyecto:

```bash
docker compose -f docker-compose.postgres.yml up -d
```

## 4) Clonar y preparar

```bash
git clone <TU_REPO_URL> ADF247
cd ADF247
npm install
npm run install:all
```

## 5) Ajustar entornos de produccion

Edita:

- `api/.env.pro`
- `database/.env.pro`

Valores minimos:

- `DATABASE_URL` de PostgreSQL en `database/.env.pro`
- `JWT_SECRET` y `JWT_REFRESH_SECRET` fuertes en `api/.env.pro`
- `CORS_ORIGIN` con dominio final
- `FIREBASE_SERVICE_ACCOUNT_PATH` correcto
- `AEMET_OPENDATA_API_KEY` valido

## 6) Primera puesta en marcha

```bash
npm run db:prepare:pro
npm run start:pro
```

Comprobacion:

- `http://<IP_RPI>:3001/health`
- `http://<IP_RPI>:3001` (frontend servido por API)

## 7) PM2 (persistente)

Arranque app pro:

```bash
pm2 start pm2.ecosystem.config.cjs --only adf247-pro
pm2 save
pm2 startup
```

Ejecuta el comando que te muestre `pm2 startup` (con sudo) y vuelve a hacer:

```bash
pm2 save
```

## 8) Actualizaciones

```bash
git pull
npm install
npm run install:all
pm2 restart adf247-pro --update-env
```

## 9) Logs utiles

```bash
pm2 logs adf247-pro
pm2 status
```

## 10) Logs JSONL para Loki/Promtail

La API escribe logs en JSON lineal (una linea JSON por evento):

- APP logs: `/home/pi/logs/api/app.log`
- API request logs: `/home/pi/logs/api/requests.log`

Estructura app logs:

```json
{
	"timestamp": "ISO8601",
	"level": "info|warn|error|debug",
	"service": "api",
	"module": "auth|users|scheduler|db|...",
	"message": "texto humano",
	"error": "stacktrace opcional",
	"env": "development|production"
}
```

Estructura request logs:

```json
{
	"timestamp": "ISO8601",
	"method": "GET|POST|PUT|DELETE",
	"route": "/api/login",
	"status": 200,
	"duration_ms": 120,
	"ip": "127.0.0.1",
	"userId": "opcional",
	"userAgent": "...",
	"query": {},
	"body": {}
}
```
