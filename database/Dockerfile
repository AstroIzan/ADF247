FROM node:24-bookworm-slim

WORKDIR /app/database

RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY database/package*.json ./
RUN npm ci

COPY database/prisma ./prisma

CMD ["npx", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]
