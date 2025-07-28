# Dockerfile for Books Service
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Install TypeScript and tsx globally
RUN npm install -g tsx typescript

# Copy necessary files
COPY services/rabbitmq-connection.ts ./services/
COPY services/books-service/ ./services/books-service/

# Expose port (if the service has a web interface)
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV SERVICE_NAME=books-service
ENV RABBITMQ_URL=amqp://admin:password@rabbitmq:5672
ENV MONGO_BOOKS_URL=mongodb://mongo:27017/mcmasterful-books

# Health check - check if the service can connect to its database
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "const { getBooksServiceDatabase } = require('./services/books-service/database.js'); getBooksServiceDatabase().then(() => process.exit(0)).catch(() => process.exit(1));" || exit 1

# Start the books service
CMD ["tsx", "./services/books-service/index.ts"]
