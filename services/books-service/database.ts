import { MongoClient, type Db, type Collection } from 'mongodb'

interface BookWithStock {
  bookId: string
  title: string
  author: string
  isbn?: string
  description?: string
  totalStock: number
  availableStock: number
  lastStockUpdate: Date
  lastUpdated: Date
}

interface StockCache {
  bookId: string
  totalStock: number
  availableStock: number
  lastUpdated: Date
}

interface BooksServiceData {
  books: Collection<BookWithStock>
  stockCache: Collection<StockCache>
}

let client: MongoClient | null = null
let database: Db | null = null

export async function getBooksServiceDatabase (dbName: string = 'mcmasterful-books'): Promise<BooksServiceData> {
  if (client === null || database === null) {
    const mongoUrl = process.env.MONGO_BOOKS_URL ?? `mongodb://localhost:27017/${dbName}`
    console.log(`[Books Service] Connecting to MongoDB at ${mongoUrl}`)

    client = new MongoClient(mongoUrl)
    await client.connect()
    database = client.db(dbName)

    console.log('[Books Service] Connected to MongoDB successfully')
  }

  return {
    books: database.collection<BookWithStock>('books'),
    stockCache: database.collection<StockCache>('stockCache')
  }
}

export async function closeBooksServiceDatabase (): Promise<void> {
  if (client !== null) {
    await client.close()
    client = null
    database = null
    console.log('[Books Service] MongoDB connection closed')
  }
}

// Stock cache management functions
export async function updateStockCache (bookId: string, totalStock: number, availableStock: number): Promise<void> {
  const db = await getBooksServiceDatabase()

  await db.stockCache.updateOne(
    { bookId },
    {
      $set: {
        bookId,
        totalStock,
        availableStock,
        lastUpdated: new Date()
      }
    },
    { upsert: true }
  )

  // Also update the main books collection
  await db.books.updateOne(
    { bookId },
    {
      $set: {
        totalStock,
        availableStock,
        lastStockUpdate: new Date()
      }
    }
  )

  console.log(`[Books Service] Updated stock cache for ${bookId}: total=${totalStock}, available=${availableStock}`)
}

export async function getStockLevel (bookId: string): Promise<{ totalStock: number, availableStock: number } | null> {
  const db = await getBooksServiceDatabase()

  const stockCache = await db.stockCache.findOne({ bookId })

  if (stockCache !== null) {
    return {
      totalStock: stockCache.totalStock,
      availableStock: stockCache.availableStock
    }
  }

  return null
}

export async function createOrUpdateBook (
  bookId: string,
  title: string,
  author: string,
  isbn?: string,
  description?: string
): Promise<void> {
  const db = await getBooksServiceDatabase()

  await db.books.updateOne(
    { bookId },
    {
      $set: {
        bookId,
        title,
        author,
        isbn,
        description,
        lastUpdated: new Date()
      },
      $setOnInsert: {
        totalStock: 0,
        availableStock: 0,
        lastStockUpdate: new Date()
      }
    },
    { upsert: true }
  )

  console.log(`[Books Service] Created/updated book: ${bookId} - ${title}`)
}

export async function getBookWithStock (bookId: string): Promise<BookWithStock | null> {
  const db = await getBooksServiceDatabase()

  return await db.books.findOne({ bookId })
}

export async function getAllBooksWithStock (): Promise<BookWithStock[]> {
  const db = await getBooksServiceDatabase()

  return await db.books.find({}).toArray()
}

export async function isStockCacheStale (bookId: string, maxAgeMinutes: number = 5): Promise<boolean> {
  const db = await getBooksServiceDatabase()

  const stockCache = await db.stockCache.findOne({ bookId })

  if (stockCache === null) {
    return true // No cache means it's stale
  }

  const now = new Date()
  const cacheAge = now.getTime() - stockCache.lastUpdated.getTime()
  const maxAgeMs = maxAgeMinutes * 60 * 1000

  return cacheAge > maxAgeMs
}

export type { BookWithStock, StockCache, BooksServiceData }
