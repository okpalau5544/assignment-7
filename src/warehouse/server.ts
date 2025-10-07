import Koa from 'koa'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import Router from '@koa/router'
const app = new Koa()

// Add middleware
app.use(cors())
app.use(bodyParser())

// Create router
const router = new Router()

// Add basic health check
router.get('/health', (ctx) => {
  ctx.body = { status: 'healthy', service: 'warehouse' }
})

// Add warehouse API routes
router.get('/warehouse/:bookId', (ctx) => {
  ctx.body = { message: 'Get book info endpoint', bookId: ctx.params.bookId }
})

router.put('/warehouse/:bookId/:shelf/:number', (ctx) => {
  ctx.body = {
    message: 'Place books on shelf endpoint',
    bookId: ctx.params.bookId,
    shelf: ctx.params.shelf,
    number: ctx.params.number
  }
})

router.get('/order', (ctx) => {
  ctx.body = { message: 'List orders endpoint', orders: [] }
})

router.put('/fulfil/:orderId', (ctx) => {
  ctx.body = { message: 'Fulfil order endpoint', orderId: ctx.params.orderId }
})

app.use(router.routes())
app.use(router.allowedMethods())

// Start server
const port = process.env.PORT ?? 3000

app.listen(port, () => {
  console.log(`Warehouse server running on port ${port}`)
  console.log(`Health check available at http://localhost:${port}/health`)
})
