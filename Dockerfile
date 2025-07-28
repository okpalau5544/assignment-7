# Dockerfile for Main Node.js API Server
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsoa.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Make scripts executable
RUN chmod +x ./start.sh
RUN chmod +x ./generate-openapi.sh

# Install TypeScript compiler globally for runtime
RUN npm install -g tsx typescript tsoa

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
