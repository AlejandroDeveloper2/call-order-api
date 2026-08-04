# ------------------------------------------------------------------------------
# STAGE 1: Base (Común para todos)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base
# Alpine por tamaño reducido y seguridad. Official Image certificada por Docker.
WORKDIR /app
# Exponemos puerto estándar
EXPOSE 3000

# ------------------------------------------------------------------------------
# STAGE 2: Dependencias (Optimización de capas)
# ------------------------------------------------------------------------------
FROM base AS dependencies
COPY package*.json ./
# --frozen-lockfile asegura que CI falle si package-lock está desactualizado
# Este stage se usa como base para TEST y BUILD para cachear capas
RUN npm ci --no-audit --no-fund

# ------------------------------------------------------------------------------
# STAGE 3: Test (Entorno completo para pruebas)
# ------------------------------------------------------------------------------
FROM dependencies AS test
# Traemos el código fuente completo
COPY . .
# Comandos de validación
RUN npm run lint
# Unit tests con cobertura
RUN npm run test:cov
# Comando por defecto para E2E (lo usaremos en CI)
CMD ["npm", "run", "test:e2e"]

# ------------------------------------------------------------------------------
# STAGE 4: Build (Compilador TypeScript)
# ------------------------------------------------------------------------------
FROM dependencies AS build
COPY . .
# Genera la carpeta dist/
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 5: Producción (IMAGEN MÍNIMA Y SEGURA)
# ------------------------------------------------------------------------------
FROM base AS production
# 1. Instalamos SOLO dependencias de producción en una capa limpia
COPY --from=dependencies /app/node_modules ./node_modules
# 2. Copiamos el compilado desde el stage BUILD
COPY --from=build /app/dist ./dist
# 3. Copiamos archivos estáticos si los hubiera (ej: views, assets)
# COPY --from=build /app/public ./public

# --- SEGURIDAD CRÍTICA: Usuario no root ---
# Node imagen trae usuario 'node' por defecto (UID 1000)
USER node

# --- HEALTHCHECK para orquestadores (K8s, ECS, Load Balancers) ---
# Instalamos wget mínimamente para el healthcheck (se puede eliminar con multi-stage si se prefiere)
# Nota: alpine tiene wget por defecto, pero si no, usamos apk add --no-cache wget
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Variable de entorno por defecto
ENV NODE_ENV=production

# Puerto expuesto en producción
EXPOSE 3000

# Arranque directo sin Nest CLI
CMD ["node", "dist/main.js"]