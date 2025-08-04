import RabbitMQConnection, { RABBITMQ_CONFIG } from '../rabbitmq-connection'
import { getBooksServiceDatabase, updateStockCache, getStockLevel, createOrUpdateBook, getAllBooksWithStock, isStockCacheStale } from './database'

const rabbitMQ = new RabbitMQConnection('Books Service')

// Initialize RabbitMQ connection and database
async function initializeService (): Promise<void> {
  try {
    // Initialize database connection
    await getBooksServiceDatabase()
    console.log('[Books Service] Database initialized successfully')

    await rabbitMQ.connect()
    console.log('[Books Service] RabbitMQ initialized successfully')

    // Set up message consumers
    await setupMessageConsumers()

    console.log('[Books Service] Message consumers set up')
  } catch (error) {
    console.error('[Books Service] Failed to initialize:', error)
    // Retry connection after 5 seconds
    setTimeout(() => {
      initializeService().catch(console.error)
    }, 5000)
  }
}

async function setupMessageConsumers (): Promise<void> {
  // Listen for inventory updates to update local stock cache
  await rabbitMQ.consume(RABBITMQ_CONFIG.queues.INVENTORY_UPDATED, async (message) => {
    console.log('[Books Service] Received inventory update:', message)

    if (typeof message.item === 'string' && typeof message.newQuantity === 'number') {
      // Update the stock cache with new information
      const currentStock = await getStockLevel(message.item as string)
      const totalStock = currentStock?.totalStock ?? message.newQuantity as number
      const availableStock = message.newQuantity as number

      await updateStockCache(message.item as string, totalStock, availableStock)
      console.log(`[Books Service] Updated stock cache for ${message.item}: ${availableStock} available`)
    }
  })

  // Listen for book availability checks and respond with book information
  await rabbitMQ.consume(RABBITMQ_CONFIG.queues.BOOK_AVAILABILITY_CHECK, async (request) => {
    console.log('[Books Service] Received book availability check:', request)

    if (typeof request.bookId === 'string') {
      if (request.bookId === '*') {
        // Send all book information
        await sendAllBooksInfo()
      } else {
        // Send specific book information
        await sendBookInfo(request.bookId as string)
      }
    }
  })
}

async function sendBookInfo (bookId: string): Promise<void> {
  const { getBookWithStock } = await import('./database')
  const book = await getBookWithStock(bookId)

  if (book !== null) {
    await rabbitMQ.publish(RABBITMQ_CONFIG.queues.BOOK_AVAILABILITY_RESPONSE, {
      bookId: book.bookId,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      totalStock: book.totalStock,
      availableStock: book.availableStock,
      timestamp: new Date().toISOString()
    })
  }
}

async function sendAllBooksInfo (): Promise<void> {
  const allBooks = await getAllBooksWithStock()

  for (const book of allBooks) {
    await rabbitMQ.publish(RABBITMQ_CONFIG.queues.BOOK_AVAILABILITY_RESPONSE, {
      bookId: book.bookId,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      totalStock: book.totalStock,
      availableStock: book.availableStock,
      timestamp: new Date().toISOString()
    })
  }
}

async function requestStockUpdate (bookId: string): Promise<void> {
  // Check if stock cache is stale
  const isStale = await isStockCacheStale(bookId)

  if (isStale) {
    console.log(`[Books Service] Stock cache stale for ${bookId}, requesting update`)

    // Request current inventory from warehouse
    await rabbitMQ.publish('warehouse.inventory.request', {
      bookId,
      requestedBy: 'books-service',
      timestamp: new Date().toISOString()
    })
  }
}

// Function to seed initial book data
async function seedBookData (): Promise<void> {
  console.log('[Books Service] Seeding initial book data...')

  const sampleBooks = [
    {
      bookId: 'book-001',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      description: 'A classic American novel set in the Jazz Age.'
    },
    {
      bookId: 'book-002',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      description: 'A novel about childhood, racism, and moral growth in the American South.'
    },
    {
      bookId: 'book-003',
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0-452-28423-4',
      description: 'A dystopian social science fiction novel and cautionary tale.'
    }
  ]

  for (const book of sampleBooks) {
    await createOrUpdateBook(book.bookId, book.title, book.author, book.isbn, book.description)
    // Initialize with zero stock - will be updated when warehouse reports inventory
    await updateStockCache(book.bookId, 0, 0)
  }

  console.log('[Books Service] Initial book data seeded')
}

// Initialize the service
initializeService().then(async () => {
  // Seed book data after initialization
  setTimeout(() => {
    seedBookData().catch(console.error)
  }, 500) // Wait 0.5 seconds
}).catch(console.error)

export { initializeService, requestStockUpdate, sendBookInfo, sendAllBooksInfo, seedBookData }
