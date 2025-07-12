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
