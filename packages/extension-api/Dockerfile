FROM oven/bun:1.3.9-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Установка turbo глобально
RUN bun install -g turbo@2.8.12
COPY . .

# Создание изолированного монорепозитория для extension-api
RUN turbo prune @qbs-autonaim/extension-api --docker

FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Установка зависимостей
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/bun.lock .
RUN bun install 
# Копирование исходного кода
COPY --from=builder /app/out/full/ .

# Сборка проекта
ARG POSTGRES_URL
ENV POSTGRES_URL=$POSTGRES_URL
ENV CI=true
RUN bun turbo run build --filter=@qbs-autonaim/extension-api

FROM base AS runner
WORKDIR /app

# Создание непривилегированного пользователя
RUN addgroup --system --gid 1001 bunuser
RUN adduser --system --uid 1001 bunuser
USER bunuser

# Копирование собранного приложения
COPY --from=installer --chown=bunuser:bunuser /app/packages/extension-api/dist ./dist
COPY --from=installer --chown=bunuser:bunuser /app/packages/extension-api/package.json ./package.json
COPY --from=installer --chown=bunuser:bunuser /app/node_modules ./node_modules
COPY --from=installer --chown=bunuser:bunuser /app/packages ./packages

# Порт по умолчанию
EXPOSE 3000

# Запуск приложения
CMD ["bun", "run", "dist/index.js"]
