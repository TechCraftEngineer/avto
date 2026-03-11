FROM node:24-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
# Install bun
RUN npm install -g bun
# Set working directory
WORKDIR /app
# Install turbo globally
RUN npm install -g turbo@2.8.15
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune @qbs-autonaim/cvscore --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
# Install bun
RUN npm install -g bun
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/bun.lock .
RUN bun install

# Build the project
COPY --from=builder /app/out/full/ .
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SITE_URL
# Placeholder for build — DB не подключается при сборке, реальный URL задаётся в k8s
ARG POSTGRES_URL=postgresql://localhost:5432/cvscore
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV POSTGRES_URL=$POSTGRES_URL
ENV CI=true
RUN bun turbo run build --filter=@qbs-autonaim/cvscore

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/cvscore/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/cvscore/.next/static ./apps/cvscore/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/cvscore/public ./apps/cvscore/public

# Expose port (cvscore runs on 3200 by default)
EXPOSE 3200

ENV PORT=3200
ENV HOSTNAME="0.0.0.0"

# Use node to run the server
CMD ["node", "apps/cvscore/server.js"]
