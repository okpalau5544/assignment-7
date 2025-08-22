# Dockerfile for Main Node.js API Server
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsoa.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Make scripts executable
RUN chmod +x ./start.sh
RUN chmod +x ./generate-openapi.sh

# Install TypeScript compiler globally for runtime
RUN npm install -g tsx typescript tsoa

# Build the application
RUN npm run build:swagger || echo "Build swagger completed"

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["./start.sh"]
