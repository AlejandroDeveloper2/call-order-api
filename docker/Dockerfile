# ==========================================
# Base
# ==========================================

FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./


# ==========================================
# Dependencies
# ==========================================

FROM base AS dependencies

RUN npm ci


# ==========================================
# Build
# ==========================================

FROM dependencies AS build

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npm run build


# ==========================================
# Production
# ==========================================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]