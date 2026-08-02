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
    wget \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

ENV NODE_ENV=production
ENV CHROME_BIN="/usr/bin/chromium-browser"

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN chmod +x /usr/local/bin/docker-entrypoint.sh
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node

ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]

CMD ["node", "dist/src/main.js"]