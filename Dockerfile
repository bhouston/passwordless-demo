# syntax=docker/dockerfile:1.6
FROM --platform=linux/amd64 node:22-slim AS base

# Omit NODE_ENV=production so devDependencies (e.g. drizzle-kit) are installed for db:push
ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    PORT=8080 \
    CI=true

RUN npm install -g pnpm@10.17.0

WORKDIR /app

# Copy dependency manifests first so this layer is cacheable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm fetch --reporter=silent

COPY . .

RUN pnpm install --frozen-lockfile --prefer-offline

RUN pnpm build

# Domain and app config for passwordless-login.benhouston3d.com
# Override at runtime if needed (e.g. JWT_SECRET for persistence across restarts)
ENV SITE_URL="https://passwordless-login.benhouston3d.com" \
    SITE_NAME="Passwordless Login" \
    RP_ID="passwordless-login.benhouston3d.com" \
    DATABASE_URL="./db.sqlite"

# Build-time JWT_SECRET so db:push and app can run (override at runtime for a fixed secret)
ARG JWT_SECRET
ENV JWT_SECRET="${JWT_SECRET:-passwordless-login-docker-default-secret-min-32-chars}"

# Initialize SQLite schema (db resets with each new image deploy)
RUN pnpm db:push

# Production mode for the running app
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "/app/.output/server/index.mjs"]
