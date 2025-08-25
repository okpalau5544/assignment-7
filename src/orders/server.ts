import Koa from 'koa'
import cors from '@koa/cors'
import zodRouter from 'koa-zod-router'
import qs from 'koa-qs'
import { z } from 'zod'
import listOrders from './list'
import createOrUpdateOrder from './create_or_update'
import deleteOrder from './delete'
import { client, database } from './database_access'
import { type BookDatabaseAccessor } from '../database_access'

const app = new Koa()

// We use koa-qs to enable parsing complex query strings, like our filters.
qs(app)

// And we add cors to ensure we can access our API from the mcmasterful-books website
app.use(cors())

const router = zodRouter()

// Create database accessor
const bookDatabaseAccessor: BookDatabaseAccessor = {
  database,
  books: database.collection('books'),
  orders: database.collection('orders')
}

// Setup Order List Route (wrapper for TSOA function)
router.register({
  name: 'list orders',
  method: 'post',
  path: '/orders/list',
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
    const result = await listOrders(bookDatabaseAccessor, filters)
    ctx.body = result
    await next()
  }
})

// Setup Order Create Route
// createOrUpdateOrder(router, bookDatabaseAccessor)

// Setup Order Delete Route
deleteOrder(router, bookDatabaseAccessor)

app.use(router.routes())

app.listen(4000, () => {
  console.log('Orders service listening on port 4000!')
})