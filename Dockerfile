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

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files for dependency installation
# This layer will be cached if package files don't change
COPY package.json pnpm-lock.yaml ./

# Copy patches directory (required for pnpm patched dependencies)
COPY patches ./patches

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
# Separate layer to leverage Docker cache
COPY . .

# Build the application
# This compiles both frontend and backend
RUN pnpm build

# ============================================
# Stage 2: Runner
# Purpose: Create minimal production image
# ============================================
FROM node:22-alpine AS runner

# Set working directory
WORKDIR /app

# Install pnpm globally (needed for production dependencies)
RUN npm install -g pnpm

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy patches directory (required for pnpm patched dependencies)
COPY patches ./patches

# Install production dependencies only
# This significantly reduces image size
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy database migration files
COPY --from=builder /app/drizzle ./drizzle

# Expose application port
EXPOSE 3000

# Add health check
# Checks if the application is responding on the health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/trpc/system.health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/index.js"]
