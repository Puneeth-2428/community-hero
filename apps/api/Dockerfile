FROM node:20-alpine AS builder

# Setup pnpm
RUN npm install -g pnpm
WORKDIR /app

# Copy root configurations and workspace definition
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all packages and apps (you could prune this, but doing it simply here)
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client and build
WORKDIR /app/apps/api
RUN pnpm prisma generate
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Setup pnpm for production run if needed, though npm start is fine
RUN npm install -g pnpm

# Copy built artifacts and node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api
EXPOSE 4000

# Start command
CMD ["pnpm", "start"]
