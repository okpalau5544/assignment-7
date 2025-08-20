import { MongoClient, type Db, type Collection } from 'mongodb'

interface BookInfo {
  bookId: string
  title: string
  author: string
  isbn?: string
  description?: string
  lastUpdated: Date
}

interface InventoryItem {
  bookId: string
  shelf: string
  quantity: number
  lastUpdated: Date
}

interface WarehouseServiceData {
  bookInfo: Collection<BookInfo>
  inventory: Collection<InventoryItem>
}

let client: MongoClient | null = null
let database: Db | null = null

export async function getWarehouseServiceDatabase (dbName: string = 'mcmasterful-warehouse'): Promise<WarehouseServiceData> {
  if (client === null || database === null) {
    const mongoUrl = process.env.MONGO_WAREHOUSE_URL ?? `mongodb://localhost:27018/${dbName}`
    console.log(`[Warehouse Service] Connecting to MongoDB at ${mongoUrl}`)

    client = new MongoClient(mongoUrl)
    await client.connect()
    database = client.db(dbName)

    console.log('[Warehouse Service] Connected to MongoDB successfully')
  }

  return {
    bookInfo: database.collection<BookInfo>('bookInfo'),
    inventory: database.collection<InventoryItem>('inventory')
  }
}

export async function closeWarehouseServiceDatabase (): Promise<void> {
  if (client !== null) {
    await client.close()
    client = null
    database = null
    console.log('[Warehouse Service] MongoDB connection closed')
  }
}

// Cache management functions for book info
export async function cacheBookInfo (bookId: string, title: string, author: string, isbn?: string, description?: string): Promise<void> {
  const db = await getWarehouseServiceDatabase()

  await db.bookInfo.updateOne(
    { bookId },
    {
      $set: {
        bookId,
        title,
        author,
        isbn,
        description,
        lastUpdated: new Date()
      }
    },
    { upsert: true }
  )

  console.log(`[Warehouse Service] Cached book info: ${bookId} - ${title}`)
}

export async function getBookInfo (bookId: string): Promise<BookInfo | null> {
  const db = await getWarehouseServiceDatabase()
  return db.bookInfo.findOne({ bookId })
}

export async function getAllBookInfo (): Promise<BookInfo[]> {
  const db = await getWarehouseServiceDatabase()
  return db.bookInfo.find({}).toArray()
}

// Inventory management functions
export async function updateInventory (bookId: string, shelf: string, quantity: number): Promise<void> {
  const db = await getWarehouseServiceDatabase()

  await db.inventory.updateOne(
    { bookId, shelf },
    {
      $set: {
        bookId,
        shelf,
        quantity,
        lastUpdated: new Date()
      }
    },
    { upsert: true }
  )

  console.log(`[Warehouse Service] Updated inventory: ${bookId} on ${shelf} = ${quantity}`)
}

export async function getInventoryForBook (bookId: string): Promise<Record<string, number>> {
  const db = await getWarehouseServiceDatabase()

  const items = await db.inventory.find({ bookId }).toArray()

  const result: Record<string, number> = {}
  items.forEach(item => {
    result[(item as InventoryItem).shelf] = (item as InventoryItem).quantity
  })

  return result
}

export async function getTotalStock (bookId: string): Promise<number> {
  const db = await getWarehouseServiceDatabase()

  const items = await db.inventory.find({ bookId }).toArray()
  return items.reduce((total: number, item: InventoryItem) => total + item.quantity, 0)
}

export type { BookInfo, InventoryItem, WarehouseServiceData }
