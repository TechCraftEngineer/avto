FROM oven/bun:1.3.10-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app
RUN bun add -g turbo

COPY . .
RUN turbo prune @qbs-autonaim/tg-client --docker

FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=builder /app/out/json/ .
RUN bun install

COPY --from=builder /app/out/full/ .
RUN bunx turbo build --filter=@qbs-autonaim/tg-client

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 bunjs
RUN mkdir -p /app/storage && chown -R bunjs:bunjs /app/storage

USER bunjs

COPY --from=installer /app .

# API port
EXPOSE 8001

CMD ["bun", "run", "packages/tg-client/src/api/index.ts"]
