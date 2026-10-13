FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY database/package*.json ./database/
COPY api/package*.json ./api/

RUN npm ci --prefix database --omit=dev \
    && npm ci --prefix api --omit=dev

COPY database/prisma ./database/prisma
COPY api/src ./api/src
COPY api/scripts ./api/scripts

RUN ./database/node_modules/.bin/prisma generate \
    --schema=/app/database/prisma/schema.prisma

WORKDIR /app/api

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

RUN chmod +x scripts/docker-entrypoint.sh

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]