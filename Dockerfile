FROM node:20-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Rebuild para producción
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para el build
ENV NEXT_TELEMETRY_DISABLED=1

# Build args para variables NEXT_PUBLIC_* (se bakean en el bundle del cliente)
ARG NEXT_PUBLIC_CENTRAL_FIREBASE_API_KEY
ARG NEXT_PUBLIC_CENTRAL_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_CENTRAL_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_CENTRAL_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_CENTRAL_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_CENTRAL_FIREBASE_APP_ID
ARG NEXT_PUBLIC_PLATFORM_DOMAIN
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_CENTRAL_FIREBASE_API_KEY=$NEXT_PUBLIC_CENTRAL_FIREBASE_API_KEY
ENV NEXT_PUBLIC_CENTRAL_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_CENTRAL_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_CENTRAL_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_CENTRAL_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_CENTRAL_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_CENTRAL_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_CENTRAL_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_CENTRAL_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_CENTRAL_FIREBASE_APP_ID=$NEXT_PUBLIC_CENTRAL_FIREBASE_APP_ID
ENV NEXT_PUBLIC_PLATFORM_DOMAIN=$NEXT_PUBLIC_PLATFORM_DOMAIN
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Asegurar que el directorio public existe
RUN mkdir -p public

# Build de Next.js
RUN npm run build:ci

# Imagen de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copiar archivos públicos (logo, favicon, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
