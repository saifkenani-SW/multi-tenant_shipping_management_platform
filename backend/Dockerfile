############################################
# Base
############################################
FROM node:24-alpine AS base

RUN apk add --no-cache \
    openssl \
    libc6-compat

WORKDIR /app

############################################
# Dependencies
############################################
FROM base AS dependencies

COPY package*.json ./

RUN npm ci

############################################
# Builder
############################################
FROM dependencies AS builder

COPY . .

RUN npx prisma generate

RUN npm run build

############################################
# Production Dependencies
############################################
FROM base AS production-dependencies

COPY package*.json ./

RUN npm ci --omit=dev

############################################
# Runtime
############################################
FROM node:24-alpine AS runtime

RUN apk add --no-cache \
    dumb-init \
    openssl \
    libc6-compat \
    wget

WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node

ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]

CMD ["node", "dist/main.js"]