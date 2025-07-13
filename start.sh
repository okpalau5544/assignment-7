# Start script for McMasterful Books application
# This ensures proper startup order and dependency management

echo "Starting McMasterful Books application..."

# Build OpenAPI specifications first
echo "Building OpenAPI specifications..."
npm run build:swagger

# Generate client code if needed
if [ ! -d "client" ] || [ -z "$(ls -A client)" ]; then
    echo "Generating client code..."
    # Add client generation here if needed
fi

# Start the application
echo "Starting server on port ${PORT:-3000}..."
exec npx tsx ./index.ts
