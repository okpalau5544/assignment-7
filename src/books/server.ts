import Koa from 'koa'
import cors from '@koa/cors'
import zodRouter from 'koa-zod-router'
import qs from 'koa-qs'
import { z } from 'zod'
import listBooks from './list'
import createOrUpdateBook from './create_or_update'
import deleteBook from './delete'
import { MongoClient } from 'mongodb'
import { type BookDatabaseAccessor } from '../database_access'

const app = new Koa()

// We use koa-qs to enable parsing complex query strings, like our filters.
qs(app)

// And we add cors to ensure we can access our API from the mcmasterful-books website
app.use(cors())

const router = zodRouter()

// Create MongoDB client and database
const client = new MongoClient(process.env.MONGO_URL ?? 'mongodb://mongo-books:27017')
const database = client.db('mcmasterful-books')

// Create database accessor
const bookDatabaseAccessor: BookDatabaseAccessor = {
  database,
  books: database.collection('books'),
  orders: database.collection('orders')
}

// Setup Book List Route (wrapper for TSOA function)
router.register({
  name: 'list books',
  method: 'post',
  path: '/books/list',
  validate: {
    body: z.object({
      filters: z.array(z.object({
        from: z.number().optional(),
        to: z.number().optional(),
        name: z.string().optional(),
        author: z.string().optional()
      })).optional()
    })
  },
  handler: async (ctx, next) => {
    const { filters = [] } = ctx.request.body
    const result = await listBooks(bookDatabaseAccessor, filters)
    ctx.body = result
    await next()
  }
})

// Setup Book Create/Update Route (wrapper for TSOA function)
router.register({
  name: 'create or update book',
  method: 'post',
  path: '/books',
  validate: {
    body: z.object({
      id: z.string().optional(),
      name: z.string(),
      author: z.string(),
      description: z.string(),
      price: z.number(),
      image: z.string()
    })
  },
  handler: async (ctx, next) => {
    const book = ctx.request.body
    const result = await createOrUpdateBook(book, bookDatabaseAccessor)

    if (result !== false) {
      ctx.body = { id: result }
    } else {
      ctx.status = 404
      ctx.body = { id: book.id ?? '' }
    }
    await next()
  }
})

// Setup Book Delete Route (already compatible)
deleteBook(router, bookDatabaseAccessor)

app.use(router.routes())

// Connect to MongoDB and start server
async function startServer (): Promise<void> {
  await client.connect()
  app.listen(3000, () => {
    console.log('Books service listening on port 3000!')
  })
}

startServer().catch(console.error)
