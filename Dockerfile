# Multi-stage build for NestJS application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) for build
RUN npm ci

# Copy source code to the container
COPY . .

# Build the application (TypeScript -> JavaScript)
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
# Copy any config files needed at runtime (uncomment if needed)
# COPY ormconfig.ts ./
# COPY schema.gql ./
# COPY .env ./

# Switch to non-root user
USER nestjs

# Expose port (NestJS default)
EXPOSE 3000

# Health check for ECS
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application (logs go to stdout/stderr for ECS)
CMD ["node", "dist/src/main"] 