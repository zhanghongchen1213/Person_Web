# ============================================
# Multi-stage Dockerfile for Person_Web
# Optimized for 2C2G environment
# ============================================

# ============================================
# Stage 1: Builder
# Purpose: Install dependencies and build the application
# ============================================
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Configure npm to use Taobao mirror and install pnpm globally
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

# Copy package files for dependency installation
# This layer will be cached if package files don't change
COPY package.json pnpm-lock.yaml ./

# Copy patches directory (required for pnpm patched dependencies)
COPY patches ./patches

# Install all dependencies (including devDependencies for build)
# Add retry mechanism and increase timeout for network issues
RUN pnpm install --frozen-lockfile || \
    pnpm install --frozen-lockfile || \
    pnpm install --frozen-lockfile

# Copy source code
# Separate layer to leverage Docker cache
COPY . .

# Build the application
# This compiles both frontend and backend
# Set Node.js heap size to 1GB for 2GB memory servers
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN pnpm build

# ============================================
# Stage 2: Runner
# Purpose: Create minimal production image
# ============================================
FROM node:22-alpine AS runner

# Set working directory
WORKDIR /app

# Configure npm to use Taobao mirror and install pnpm globally
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy patches directory (required for pnpm patched dependencies)
COPY patches ./patches

# Install production dependencies only
# This significantly reduces image size
# Add retry mechanism and increase timeout for network issues
RUN pnpm install --prod --frozen-lockfile || \
    pnpm install --prod --frozen-lockfile || \
    pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy database migration files
COPY --from=builder /app/drizzle ./drizzle

# Expose application port
EXPOSE 3000

# Add health check
# Checks if the application is responding on the root endpoint
# Increased start-period to 40s to allow application to fully initialize
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "dist/index.js"]
