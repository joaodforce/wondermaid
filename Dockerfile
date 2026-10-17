# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

# Install all dependencies (including dev deps needed to build and to run migrations)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build the standalone Next.js server
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Shown in the version badge; NEXT_PUBLIC_* values are inlined at build time
ARG NEXT_PUBLIC_APP_VERSION=
ARG NEXT_PUBLIC_GIT_SHA=unknown
ARG NEXT_PUBLIC_APP_ENV=
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION \
    NEXT_PUBLIC_GIT_SHA=$NEXT_PUBLIC_GIT_SHA \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
RUN npm run build && npm run db:migrate:bundle

# One-off image for `npm run db:migrate`, `leaderboard:recalculate` and `leaderboard:backfill`:
#   docker build --target tools -t wondermaid-tools .
FROM base AS tools
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY src ./src
CMD ["npm", "run", "db:migrate"]

# Minimal production image (default target); applies pending migrations on boot
FROM base AS runner
ARG NEXT_PUBLIC_APP_VERSION=
ARG NEXT_PUBLIC_GIT_SHA=unknown
ARG NEXT_PUBLIC_APP_ENV=
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION \
    NEXT_PUBLIC_GIT_SHA=$NEXT_PUBLIC_GIT_SHA \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist/migrate.cjs ./migrate.cjs
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
USER nextjs
EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
