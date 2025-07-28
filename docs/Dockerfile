# Dockerfile for API Documentation (Swagger UI)
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
RUN npm install -g tsx typescript tsoa @openapitools/openapi-generator-cli

# Copy source files needed for generating docs
COPY services/ ./services/
COPY build/ ./build/
COPY src/ ./src/
COPY tsoa.json ./
COPY generate-openapi.sh ./

# Make script executable
RUN chmod +x ./generate-openapi.sh

# Generate OpenAPI specs
RUN ./generate-openapi.sh

# Install express and swagger-ui-express for serving docs
RUN npm install express swagger-ui-express

# Create a simple server to serve Swagger UI
RUN echo 'const express = require("express"); \
const swaggerUi = require("swagger-ui-express"); \
const fs = require("fs"); \
const app = express(); \
let swaggerDocument; \
try { \
  swaggerDocument = JSON.parse(fs.readFileSync("./build/swagger.json", "utf8")); \
} catch (err) { \
  console.error("Error loading swagger.json:", err); \
  swaggerDocument = { openapi: "3.0.0", info: { title: "API Documentation", version: "1.0.0" }, paths: {} }; \
} \
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument)); \
app.get("/", (req, res) => res.redirect("/docs")); \
app.get("/health", (req, res) => res.json({ status: "ok" })); \
const PORT = process.env.PORT || 3004; \
app.listen(PORT, () => console.log(`API Documentation running on port ${PORT}`));' > docs-server.js

# Expose port
EXPOSE 3004

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

# Start the documentation server
CMD ["node", "docs-server.js"]
