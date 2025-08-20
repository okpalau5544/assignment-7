import eventBus from './eventBus'
import RabbitMQConnection, { RABBITMQ_CONFIG } from './rabbitmq-connection'
import { getOrderServiceDatabase, cacheBookReference, isValidBookId, getBookReference } from './database'

interface Order {
  id: string
  item: string
  quantity: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  timestamp: string
}

const rabbitMQ = new RabbitMQConnection('Order Service')

// Initialize RabbitMQ connection and database
async function initializeService (): Promise<void> {
  try {
    // Initialize database connection
    await getOrderServiceDatabase()
    console.log('[Order Service] Database initialized successfully')

    await rabbitMQ.connect()
    console.log('[Order Service] RabbitMQ initialized successfully')

    // Set up message consumers
    await setupMessageConsumers()

    console.log('[Order Service] Message consumers set up')
  } catch (error) {
    console.error('[Order Service] Failed to initialize:', error)
    // Retry connection after 5 seconds
    setTimeout(() => {
      initializeService().catch(console.error)
    }, 5000)
  }
}

async function setupMessageConsumers (): Promise<void> {
  // Listen for inventory updates
  await rabbitMQ.consume(RABBITMQ_CONFIG.queues.INVENTORY_UPDATED, (message: any) => {
    console.log('[Order Service] Received inventory update:', message)
    // Handle inventory update logic here
  })

  // Listen for order processing confirmations
  await rabbitMQ.consume(RABBITMQ_CONFIG.queues.ORDER_PROCESSED, (message: any) => {
    console.log('[Order Service] Order processed:', message)
    // Handle order processing confirmation
  })

  // Listen for book information updates to cache locally
  await rabbitMQ.consume(RABBITMQ_CONFIG.queues.BOOK_AVAILABILITY_RESPONSE, async (message: any) => {
    console.log('[Order Service] Received book info update:', message)
    if (typeof message.bookId === 'string' && typeof message.title === 'string' && typeof message.author === 'string') {
      await cacheBookReference(message.bookId as string, message.title as string, message.author as string)
    }
  })
}

async function createOrder (item: string, quantity: number = 1): Promise<Order> {
  console.log(`[Orders] Creating order for: ${item} (quantity: ${quantity})`)

  // Check if the book ID is valid (cached locally)
  const isValid = await isValidBookId(item)
  if (!isValid) {
    console.log(`[Orders] Unknown book ID: ${item}, requesting book info`)
    // Request book information from books service
    await rabbitMQ.publish(RABBITMQ_CONFIG.queues.BOOK_AVAILABILITY_CHECK, {
      bookId: item,
      requestedBy: 'order-service',
      timestamp: new Date().toISOString()
    })

    throw new Error(`Unknown book ID: ${item}. Book information requested.`)
  }

  const bookRef = await getBookReference(item)
  const bookTitle = bookRef?.title ?? item

  const order: Order = {
    id: `order-${Date.now()}`,
    item,
    quantity,
    status: 'pending',
    timestamp: new Date().toISOString()
  }

  // Emit to local event bus (legacy)
  eventBus.emit('order:created', order)

  // Publish to RabbitMQ
  try {
    await rabbitMQ.publish(RABBITMQ_CONFIG.queues.ORDER_CREATED, {
      orderId: order.id,
      item: order.item,
      bookTitle,
      quantity: order.quantity,
      timestamp: order.timestamp
    })
    console.log(`[Orders] Order ${order.id} published to message queue`)
  } catch (error) {
    console.error(`[Orders] Failed to publish order ${order.id}:`, error)
    order.status = 'failed'
  }

  return order
}

// Function to pre-populate book references (for initialization)
async function seedBookReferences (): Promise<void> {
  console.log('[Order Service] Seeding initial book references...')

  // Request all book information from books service
  await rabbitMQ.publish(RABBITMQ_CONFIG.queues.BOOK_AVAILABILITY_CHECK, {
    bookId: '*', // Special marker for "all books"
    requestedBy: 'order-service',
    timestamp: new Date().toISOString()
  })
}

// Initialize the service
initializeService().then(async () => {
  // Seed book references after initialization
  setTimeout(() => {
    seedBookReferences().catch(console.error)
  }, 2000) // Wait 2 seconds for other services to be ready
}).catch(console.error)

// Example usage
setTimeout(() => {
  createOrder('sample-book-id', 2).catch((error) => {
    console.log('[Order Service] Example order failed as expected:', error.message)
  })
}, 5000)

export { createOrder, initializeService, seedBookReferences }
