FROM oven/bun:1.3.9-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app
RUN bun add -g turbo

COPY . .
RUN turbo prune @qbs-autonaim/webhooks --docker

FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=builder /app/out/json/ .
RUN bun install

COPY --from=builder /app/out/full/ .
RUN bunx turbo build --filter=@qbs-autonaim/webhooks

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 bunjs

USER bunjs

COPY --from=installer /app .

# Webhooks port
EXPOSE 3001

CMD ["bun", "run", "apps/webhooks/src/index.ts"]
