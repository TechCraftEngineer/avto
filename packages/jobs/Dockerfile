FROM oven/bun:1.3.8-alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app

FROM base AS prepare
# Install turbo globally
RUN bun add -g turbo@2.8.3
COPY . .
# Generate a partial monorepo with a pruned lockfile for @qbs-autonaim/jobs workspace
RUN turbo prune @qbs-autonaim/jobs --docker

FROM base AS builder
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN bun install
# Build the project
COPY --from=prepare /app/out/full/ .
# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM
# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN
# Disable telemetry and daemon for Docker builds
ENV TURBO_TELEMETRY_DISABLED=1
RUN bunx turbo build --filter=@qbs-autonaim/jobs --daemon=false

FROM base AS runner
# Install system dependencies including Chromium for Puppeteer
RUN apk add --no-cache \
    openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set environment variables
ENV NODE_ENV=production \
    PORT=8000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Don't run production as root
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 bunjs

# Создаем директорию для MTCute с правами для bunjs
RUN mkdir -p /tmp/mtcute && chown -R bunjs:bunjs /tmp/mtcute

USER bunjs

COPY --from=builder /app .

CMD ["bun", "run", "packages/jobs/src/inngest/server.ts"]
