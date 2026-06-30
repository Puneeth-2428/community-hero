FROM node:20-alpine AS builder

RUN npm install -g pnpm
WORKDIR /app

# Copy root configs
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the Next.js app
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy standalone output from builder
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

# Next.js standalone puts the entrypoint in the apps/web/server.js relative to the project root
CMD ["node", "apps/web/server.js"]
