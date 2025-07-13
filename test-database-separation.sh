#!/bin/bash

echo "Testing Database Separation and Caching..."

# Wait for services to start
echo "Waiting for services to initialize..."
sleep 10

echo "1. Testing order creation with unknown book ID (should request book info)..."
curl -X POST http://localhost:8080/api/messages/test-order \
  -H "Content-Type: application/json" \
  -d '{"item": "book-001", "quantity": 1}' \
  && echo ""

echo "2. Waiting for book info to be cached..."
sleep 3

echo "3. Testing order creation again (should work with cached book info)..."
curl -X POST http://localhost:8080/api/messages/test-order \
  -H "Content-Type: application/json" \
  -d '{"item": "book-001", "quantity": 2}' \
  && echo ""

echo "4. Testing inventory update..."
curl -X POST http://localhost:8080/api/messages/test-inventory \
  -H "Content-Type: application/json" \
  -d '{"item": "book-002", "quantityChange": 5}' \
  && echo ""

echo "5. Testing with another book..."
curl -X POST http://localhost:8080/api/messages/test-order \
  -H "Content-Type: application/json" \
  -d '{"item": "book-003", "quantity": 1}' \
  && echo ""

echo ""
echo "Check the logs to see:"
echo "- Order service validating book IDs against its cache"
echo "- Warehouse service managing inventory in its database"
echo "- Books service caching stock levels from inventory updates"
echo "- RabbitMQ messages flowing between services"
echo ""
echo "Each service uses its own MongoDB database for data isolation!"
