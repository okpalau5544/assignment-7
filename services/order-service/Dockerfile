# Dockerfile for Order Service
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including mongodb and other required packages)
RUN npm ci

# Install TypeScript and tsx globally
RUN npm install -g tsx typescript

# Copy necessary files
COPY services/rabbitmq-connection.ts ./services/
COPY services/order-service/ ./services/order-service/
COPY services/eventBus.ts ./services/
COPY documented_types.ts ./

# Expose port (if the service has a web interface)
EXPOSE 3002

# Set environment variables
ENV NODE_ENV=production
ENV SERVICE_NAME=order-service
ENV RABBITMQ_URL=amqp://admin:password@rabbitmq:5672
ENV MONGO_ORDERS_URL=mongodb://mongo-orders:27017/mcmasterful-orders

# Health check - simple port check instead of database connection
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start the order service
CMD ["tsx", "./services/order-service/index.ts"]
