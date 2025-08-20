import eventBus from './eventBus'
import RabbitMQConnection, { RABBITMQ_CONFIG } from './rabbitmq-connection'
import { getWarehouseServiceDatabase, cacheBookInfo, getBookInfo, updateInventory as updateWarehouseInventory, getInventoryForBook, getTotalStock } from './database'

interface Order {
  orderId: string
  item: string
  bookTitle?: string
  quantity: number
  timestamp: string
  [key: string]: any
}

interface InventoryUpdate {
  item: string
  quantityChanged: number
  newQuantity: number
  timestamp: string
}

const rabbitMQ = new RabbitMQConnection('Warehouse Service')

// Initialize RabbitMQ connection and database
async function initializeService (): Promise<void> {
  try {
    // Initialize database connection
    await getWarehouseServiceDatabase()
    console.log('[Warehouse Service] Database initialized successfully')

    await rabbitMQ.connect()
    console.log('[Warehouse Service] RabbitMQ initialized successfully')

    // Set up message consumers
    await setupMessageConsumers()

    console.log('[Warehouse Service] Message consumers set up')
  } catch (error) {
    console.error('[Warehouse Service] Failed to initialize:', error)
    // Retry connection after 5 seconds
    setTimeout(() => {
      initializeService().catch(console.error)
    }, 5000)
  }
}

async function setupMessageConsumers (): Promise<void> {
  // Listen for new orders
  await rabbitMQ.consume(RABBITMQ_CONFIG.queues.ORDER_CREATED, (order: Order) => {
    console.log(`[Warehouse] Processing order: ${order.orderId} for item: ${order.item}`)

    // Simulate inventory processing
    processOrder(order).catch((error) => {
      console.error(`[Warehouse] Error processing order ${order.orderId}:`, error)
    })
  })

  // Listen for fulfillment requests
  await rabbitMQ.consume(RABBITMQ_CONFIG.queues.FULFILLMENT_REQUEST, (request: any) => {
    console.log('[Warehouse] Received fulfillment request:', request)
    // Handle fulfillment request logic here
  })

  // Listen for book availability checks to respond with cached info
  await rabbitMQ.consume(RABBITMQ_CONFIG.queues.BOOK_AVAILABILITY_CHECK, async (request: any) => {
    console.log('[Warehouse] Received book availability check:', request)

    if (typeof request.bookId === 'string') {
      if (request.bookId === '*') {
        // Send all book information
        await sendAllBookInfo()
      } else {
        // Send specific book information
        await sendBookInfo(request.bookId as string)
      }
    }
  })
}

async function sendBookInfo (bookId: string): Promise<void> {
  const bookInfo = await getBookInfo(bookId)

  if (bookInfo !== null) {
    await rabbitMQ.publish(RABBITMQ_CONFIG.queues.BOOK_AVAILABILITY_RESPONSE, {
      bookId: bookInfo.bookId,
      title: bookInfo.title,
      author: bookInfo.author,
      isbn: bookInfo.isbn,
      description: bookInfo.description,
      timestamp: new Date().toISOString()
    })
  }
}

async function sendAllBookInfo (): Promise<void> {
  const { getAllBookInfo } = await import('./database')
  const allBooks = await getAllBookInfo()

  for (const book of allBooks) {
    await rabbitMQ.publish(RABBITMQ_CONFIG.queues.BOOK_AVAILABILITY_RESPONSE, {
      bookId: book.bookId,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      timestamp: new Date().toISOString()
    })
  }
}

async function processOrder (order: Order): Promise<void> {
  try {
    // Get book info from local cache
    let bookInfo = await getBookInfo(order.item)

    if (bookInfo === null && typeof order.bookTitle === 'string' && order.bookTitle.length > 0) {
      // Cache the book info from the order if not already cached
      await cacheBookInfo(order.item, order.bookTitle, 'Unknown Author')
      bookInfo = await getBookInfo(order.item)
    }

    console.log(`[Warehouse] Checking inventory for: ${order.item}`)

    // Get current inventory
    const currentInventory = await getInventoryForBook(order.item)
    const totalStock = await getTotalStock(order.item)

    if (totalStock >= order.quantity) {
      // Process the order by reducing inventory
      const shelfToReduce = Object.keys(currentInventory).find(shelf => currentInventory[shelf] >= order.quantity)

      if (typeof shelfToReduce === 'string' && shelfToReduce.length > 0) {
        const newQuantity = currentInventory[shelfToReduce] - order.quantity
        await updateWarehouseInventory(order.item, shelfToReduce, newQuantity)

        // Publish inventory update
        const inventoryUpdate: InventoryUpdate = {
          item: order.item,
          quantityChanged: -order.quantity,
          newQuantity: await getTotalStock(order.item), // Get updated total
          timestamp: new Date().toISOString()
        }

        await rabbitMQ.publish(RABBITMQ_CONFIG.queues.INVENTORY_UPDATED, inventoryUpdate)

        // Publish order processed confirmation
        await rabbitMQ.publish(RABBITMQ_CONFIG.queues.ORDER_PROCESSED, {
          orderId: order.orderId,
          status: 'processed',
          processedAt: new Date().toISOString()
        })

        console.log(`[Warehouse] Successfully processed order ${order.orderId}`)
      } else {
        throw new Error('Inventory fragmented across shelves')
      }
    } else {
      throw new Error(`Insufficient stock: ${totalStock} available, ${order.quantity} requested`)
    }
  } catch (error) {
    console.error(`[Warehouse] Failed to process order ${order.orderId}:`, error)

    // Publish order failed
    await rabbitMQ.publish(RABBITMQ_CONFIG.queues.ORDER_FAILED, {
      orderId: order.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
      failedAt: new Date().toISOString()
    })
  }
}

async function updateInventory (item: string, quantityChange: number, shelf: string = 'default'): Promise<void> {
  // Get current quantity for the shelf
  const currentInventory = await getInventoryForBook(item)
  const currentQuantity = currentInventory[shelf] ?? 0
  const newQuantity = Math.max(0, currentQuantity + quantityChange)

  await updateWarehouseInventory(item, shelf, newQuantity)

  const inventoryUpdate: InventoryUpdate = {
    item,
    quantityChanged: quantityChange,
    newQuantity: await getTotalStock(item),
    timestamp: new Date().toISOString()
  }

  await rabbitMQ.publish(RABBITMQ_CONFIG.queues.INVENTORY_UPDATED, inventoryUpdate)
  console.log(`[Warehouse] Inventory updated for ${item}: ${quantityChange > 0 ? '+' : ''}${quantityChange}`)
}

// Function to seed initial book data
async function seedBookData (): Promise<void> {
  console.log('[Warehouse Service] Seeding initial book data...')

  const sampleBooks = [
    { bookId: 'book-001', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5' },
    { bookId: 'book-002', title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-06-112008-4' },
    { bookId: 'book-003', title: '1984', author: 'George Orwell', isbn: '978-0-452-28423-4' }
  ]

  for (const book of sampleBooks) {
    await cacheBookInfo(book.bookId, book.title, book.author, book.isbn)
    await updateWarehouseInventory(book.bookId, 'shelf-A', 10)
    await updateWarehouseInventory(book.bookId, 'shelf-B', 5)
  }

  console.log('[Warehouse Service] Initial book data seeded')
}

// Legacy event bus listener for backwards compatibility
eventBus.on('order:created', (order: Order) => {
  console.log(`[Warehouse] (Legacy) Decrease inventory for: ${order.item}`)
})

// Initialize the service
initializeService().then(async () => {
  // Seed book data after initialization
  setTimeout(() => {
    seedBookData().catch(console.error)
  }, 1000)
}).catch(console.error)

export { processOrder, updateInventory, initializeService, seedBookData }
