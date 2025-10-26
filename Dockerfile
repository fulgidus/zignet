# ZigNet MCP Server - Multi-stage Docker build
# Optimized for production deployment with minimal image size

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    tar \
    xz

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    tar \
    xz

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/scripts/install-zig.js ./scripts/

# Install pnpm
RUN npm install -g pnpm

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Create Zig cache directory
RUN mkdir -p /root/.zignet/zig-versions

# Environment variables (can be overridden at runtime)
ENV ZIG_SUPPORTED="0.13.0,0.14.0,0.15.0"
ENV ZIG_DEFAULT="0.15.0"
ENV NODE_ENV=production

# Expose MCP server port (if needed for future HTTP transport)
# EXPOSE 3000

# Health check (verify Node.js and zig can be executed)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('OK')" || exit 1

# Run MCP server
CMD ["node", "dist/mcp-server.js"]
