FROM node:24-bookworm-slim

WORKDIR /app/database

COPY database/package*.json ./
RUN npm ci

COPY database/prisma ./prisma

CMD ["npx", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]
