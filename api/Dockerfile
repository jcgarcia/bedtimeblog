# api/Dockerfile - Production optimized with native module support
FROM node:20-alpine

# Install build dependencies for native modules (Argon2)
RUN apk add --no-cache \
    curl \
    make \
    g++ \
    python3 \
    py3-pip \
    libc6-compat

WORKDIR /app

# Install dependencies first for better caching
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["pnpm", "start"]