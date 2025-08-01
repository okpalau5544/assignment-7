import Koa from 'koa'
import cors from '@koa/cors'
import qs from 'koa-qs'
import zodRouter from 'koa-zod-router'
import { setupBookRoutes } from './src/books'
import { RegisterRoutes } from './build/routes'
import swagger from './build/swagger.json'
import KoaRouter from '@koa/router'
import { koaSwagger } from 'koa2-swagger-ui'
import bodyParser from 'koa-bodyparser'
import { type Server, type IncomingMessage, type ServerResponse } from 'http'
import { type AppBookDatabaseState, getBookDatabase } from './src/database_access'
import { type AppWarehouseDatabaseState, getDefaultWarehouseDatabase } from './src/warehouse/warehouse_database'

export default async function (port?: number, randomizeDbs?: boolean): Promise<{ server: Server<typeof IncomingMessage, typeof ServerResponse>, state: AppBookDatabaseState & AppWarehouseDatabaseState }> {
  const bookDb = getBookDatabase(randomizeDbs === true ? undefined : 'mcmasterful-books')
  const warehouseDb = await getDefaultWarehouseDatabase(randomizeDbs === true ? undefined : 'mcmasterful-warehouse')

  // Initialize microservices
  async function initializeMicroservices (): Promise<void> {
    try {
      // Import and initialize books service
      const { initializeService: initBooksService } = await import('./services/books-service/index')
      await initBooksService()

      // Import and initialize order service
      const { initializeService: initOrderService } = await import('./services/order-service/index')
      await initOrderService()

      // Import and initialize warehouse service
      const { initializeService: initWarehouseService } = await import('./services/warehouse-service/index')
      await initWarehouseService()

      console.log('[Server] Microservices initialized successfully')
    } catch (error) {
      console.error('[Server] Failed to initialize microservices:', error)
      // Don't fail server startup if microservices fail to initialize
    }
  }

  await initializeMicroservices()

  const state: AppBookDatabaseState & AppWarehouseDatabaseState = {
    books: bookDb,
    warehouse: warehouseDb
  }

  const app = new Koa<AppBookDatabaseState & AppWarehouseDatabaseState, Koa.DefaultContext>()

  app.use(async (ctx, next): Promise<void> => {
    ctx.state = state
    await next()
  })

  // We use koa-qs to enable parsing complex query strings, like our filters.
  qs(app)

  // And we add cors to ensure we can access our API from the mcmasterful-books website
  app.use(cors())

  const router = zodRouter({ zodRouter: { exposeRequestErrors: true } })

  setupBookRoutes(router, state.books)

  app.use(bodyParser())
  app.use(router.routes())

  const koaRouter = new KoaRouter()

  // Health check endpoint for load balancer
  koaRouter.get('/health', (ctx) => {
    ctx.body = { status: 'ok', timestamp: new Date().toISOString() }
    ctx.status = 200
  })

  // Database health check endpoint
  koaRouter.get('/health/databases', async (ctx) => {
    const dbStatus = {
      books: 'unknown',
      warehouse: 'unknown',
      orders: 'unknown',
      timestamp: new Date().toISOString()
    }

    try {
      // Check books service database
      const { getBooksServiceDatabase } = await import('./services/books-service/database')
      await getBooksServiceDatabase()
      dbStatus.books = 'connected'
    } catch (error) {
      dbStatus.books = 'error'
    }

    try {
      // Check warehouse service database
      const { getWarehouseServiceDatabase } = await import('./services/warehouse-service/database')
      await getWarehouseServiceDatabase()
      dbStatus.warehouse = 'connected'
    } catch (error) {
      dbStatus.warehouse = 'error'
    }

    try {
      // Check order service database
      const { getOrderServiceDatabase } = await import('./services/order-service/database')
      await getOrderServiceDatabase()
      dbStatus.orders = 'connected'
    } catch (error) {
      dbStatus.orders = 'error'
    }

    const allConnected = Object.values(dbStatus).every(status => status === 'connected' || status === new Date().toISOString())

    ctx.body = dbStatus
    ctx.status = allConnected ? 200 : 503
  })

  RegisterRoutes(koaRouter)

  app.use(koaRouter.routes())
  app.use(koaSwagger({
    routePrefix: '/docs',
    specPrefix: '/docs/spec',
    exposeSpec: true,
    swaggerOptions: {
      spec: swagger
    }

  }))

  return {
    server: app.listen(port, () => {
      console.log('listening')
    }),
    state
  }
}
