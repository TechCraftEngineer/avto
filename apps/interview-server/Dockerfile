FROM node:24-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
# Install bun
RUN npm install -g bun@1.3.9
# Set working directory
WORKDIR /app
# Install turbo globally
RUN npm install -g turbo@2.8.10
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace
RUN turbo prune @qbs-autonaim/interview-server --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
# Install bun
RUN npm install -g bun@1.3.9
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/bun.lock .
RUN bun install

# Build the project
COPY --from=builder /app/out/full/ .
ARG POSTGRES_URL
ENV POSTGRES_URL=$POSTGRES_URL
ENV CI=true
RUN bun turbo run build --filter=@qbs-autonaim/interview-server

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunuser

# Install bun in runner stage
RUN npm install -g bun@1.3.9

USER bunuser

# Copy built application
COPY --from=installer --chown=bunuser:nodejs /app/apps/interview-server/dist ./dist
COPY --from=installer --chown=bunuser:nodejs /app/apps/interview-server/package.json ./package.json
COPY --from=installer --chown=bunuser:nodejs /app/node_modules ./node_modules
# Expose port
EXPOSE 7001

# Use bun to run the server
CMD ["bun", "run", "start"]
