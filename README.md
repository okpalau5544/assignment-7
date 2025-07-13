# bvd-103-assignment-7-template
This is a template repository for the seventh assignment in BVD 103 at McMaster Continuing Education.

## Architecture

This application uses a microservices architecture with:
- **Load Balanced API Servers**: 3 Node.js instances running the same API
- **NGINX Reverse Proxy**: Routes requests and provides caching
- **Frontend Service**: Serves the McMasterful Books website
- **Separate MongoDB Databases**: Each service has its own database for data isolation
  - `mongo` (port 27017): Books service database - stores books with cached stock levels
  - `mongo-warehouse` (port 27018): Warehouse service database - stores book info and inventory
  - `mongo-orders` (port 27019): Order service database - stores valid book IDs and references
- **RabbitMQ**: Message broker for inter-service communication

## Database Architecture

### Data Isolation & Caching Strategy

Each service maintains its own database and caches only the data it needs:

1. **Books Service Database** (`mcmasterful-books`)
   - Stores complete book information
   - Caches total stock levels for each book
   - Updates stock cache when receiving inventory updates via RabbitMQ

2. **Warehouse Service Database** (`mcmasterful-warehouse`) 
   - Stores book names and metadata locally
   - Manages detailed inventory by shelf
   - Responds to book availability requests

3. **Order Service Database** (`mcmasterful-orders`)
   - Stores valid book IDs and basic book references
   - Validates orders against cached book list
   - Requests book info for unknown IDs via RabbitMQ

### Cross-Service Communication

Services communicate only through RabbitMQ messages, preventing direct database connections:
- Book information is synchronized via `book.availability.check/response` queues
- Inventory updates flow through `inventory.updated` queue
- Orders are processed via `order.created/processed/failed` queues

## Running the Application

### Production
```bash
docker-compose up -d
```

### Development
```bash
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml up
```

## Endpoints

- **Website**: http://localhost:8080
- **API**: http://localhost:8080/api
- **Swagger Documentation**: http://localhost:8080/docs
- **Health Check**: http://localhost:8080/health
- **RabbitMQ Management** (dev only): http://localhost:15672 (admin/password)
- **Books Database** (dev only): mongodb://localhost:27017
- **Warehouse Database** (dev only): mongodb://localhost:27018  
- **Orders Database** (dev only): mongodb://localhost:27019

## API Routes

- `/api/books` - Book management operations
- `/api/warehouse` - Warehouse operations
- `/api/fulfil` - Order fulfillment operations
- `/api/messages` - RabbitMQ message testing endpoints
- `/docs` - Swagger documentation

## RabbitMQ Message Broker

The application uses RabbitMQ for asynchronous communication between microservices:

### Message Queues
- `order.created` - New orders from order service
- `order.processed` - Order processing confirmations from warehouse
- `order.failed` - Failed order notifications
- `inventory.updated` - Inventory changes from warehouse
- `fulfillment.request` - Fulfillment requests
- `fulfillment.completed` - Fulfillment completions
- `book.availability.check` - Book availability queries
- `book.availability.response` - Book availability responses

### Services
1. **Order Service** (`/services/order-service/`)
   - Creates orders and publishes to `order.created` queue
   - Listens for inventory updates and order processing confirmations

2. **Warehouse Service** (`/services/warehouse-service/`)
   - Processes orders from `order.created` queue
   - Publishes inventory updates and order confirmations
   - Handles fulfillment requests

### Testing RabbitMQ

You can test the message broker using the API endpoints:

```bash
# Create a test order
curl -X POST http://localhost:8080/api/messages/test-order \
  -H "Content-Type: application/json" \
  -d '{"item": "Test Book", "quantity": 2}'

# Update inventory
curl -X POST http://localhost:8080/api/messages/test-inventory \
  -H "Content-Type: application/json" \
  -d '{"item": "Test Book", "quantityChange": -5}'
```

## Load Balancing

The application uses NGINX to load balance between 3 Node.js server instances. Each server is identical and can handle any request. Failed servers will be automatically removed from the pool for 30 seconds.

## Caching

- GET requests to `/api/books` are cached for 1 minute
- POST requests to `/api/books/list` are cached based on request body
- Frontend assets are cached for 1 minute
- Swagger documentation is cached for performance

## Environment Variables

- `RABBITMQ_URL` - RabbitMQ connection URL (default: amqp://admin:password@rabbitmq:5672)
- `MONGO_BOOKS_URL` - Books service MongoDB URL (default: mongodb://mongo:27017/mcmasterful-books)
- `MONGO_WAREHOUSE_URL` - Warehouse service MongoDB URL (default: mongodb://mongo-warehouse:27017/mcmasterful-warehouse)
- `MONGO_ORDERS_URL` - Order service MongoDB URL (default: mongodb://mongo-orders:27017/mcmasterful-orders)
- `NODE_ENV` - Node environment (production/development)
- `PORT` - Server port (default: 3000)
