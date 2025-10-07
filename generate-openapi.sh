#!/bin/bash

# Generate OpenAPI specifications and client code

set -e  # Exit on error

echo "Generating OpenAPI specifications..."

# Build swagger specs from TSOA routes
npm run build:swagger

# Check if client directory exists and has content
if [ ! -d "client" ] || [ -z "$(ls -A client 2>/dev/null)" ]; then
    echo "Generating TypeScript client from OpenAPI spec..."

    # Generate client using openapi-generator-cli
    npx @openapitools/openapi-generator-cli generate \
        -i build/swagger.json \
        -g typescript-fetch \
        -o client \
        --additional-properties=supportsES6=true,npmVersion=10.0.0,typescriptThreePlus=true

    echo "Client generated successfully"
else
    echo "Client directory already exists and has content, skipping generation"
fi

echo "OpenAPI generation complete"
