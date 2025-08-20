import { MongoClient, type Db, type Collection } from 'mongodb'

interface BookReference {
  bookId: string
  title: string
  author: string
  lastUpdated: Date
}

interface OrderServiceData {
  bookReferences: Collection<BookReference>
}

let client: MongoClient | null = null
let database: Db | null = null

export async function getOrderServiceDatabase (dbName: string = 'mcmasterful-orders'): Promise<OrderServiceData> {
  if (client === null || database === null) {
  const mongoUrl = process.env.MONGO_ORDERS_URL ?? `mongodb://localhost:27017/${dbName}`
    console.log(`[Order Service] Connecting to MongoDB at ${mongoUrl}`)

    client = new MongoClient(mongoUrl)
    await client.connect()
    database = client.db(dbName)

    console.log('[Order Service] Connected to MongoDB successfully')
  }

  return {
    bookReferences: database.collection<BookReference>('bookReferences')
  }
}

export async function closeOrderServiceDatabase (): Promise<void> {
  if (client !== null) {
    await client.close()
    client = null
    database = null
    console.log('[Order Service] MongoDB connection closed')
  }
}

// Cache management functions
export async function cacheBookReference (bookId: string, title: string, author: string): Promise<void> {
  const db = await getOrderServiceDatabase()
  await db.bookReferences.updateOne(
    { bookId },
    {
      $set: {
        bookId,
        title,
        author,
        lastUpdated: new Date()
      }
    },
    { upsert: true }
  )
  console.log(`[Order Service] Cached book reference: ${bookId} - ${title}`)
  return
}

export async function getValidBookIds (): Promise<string[]> {
  const db = await getOrderServiceDatabase()
  const bookRefs = await db.bookReferences.find({}).toArray()
  return await bookRefs.map((ref: BookReference) => ref.bookId)
}

export async function isValidBookId (bookId: string): Promise<boolean> {
  const db = await getOrderServiceDatabase()
  const count = await db.bookReferences.countDocuments({ bookId })
  return await (count > 0)
}

export async function getBookReference (bookId: string): Promise<BookReference | null> {
  const db = await getOrderServiceDatabase()
  return await db.bookReferences.findOne({ bookId })
}

export type { BookReference, OrderServiceData }
