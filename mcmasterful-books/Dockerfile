# Dockerfile for McMasterful Books Frontend
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

# Copy adapter source
COPY adapter/ ./adapter/

# Copy necessary dependencies for building client
COPY client/ ./client/
COPY build/ ./build/

# Expose port
EXPOSE 9080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=9080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9080 || exit 1

# Create a simple server to serve the adapter
RUN echo 'const express = require("express"); \
const path = require("path"); \
const app = express(); \
app.use(express.static(path.join(__dirname, "adapter"))); \
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "adapter", "index.html"))); \
const PORT = process.env.PORT || 9080; \
app.listen(PORT, () => console.log(`McMasterful Books frontend running on port ${PORT}`));' > server.js

# Install express for the simple server
RUN npm install express

# Start the frontend server
CMD ["node", "server.js"]
