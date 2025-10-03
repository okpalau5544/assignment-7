import { type ZodRouter } from 'koa-zod-router'
import deleteOrder from './delete'
import getOrderRoute from './lookup'
import { type BookDatabaseAccessor } from '../database_access'

export function setupOrderRoutes (router: ZodRouter, orders: BookDatabaseAccessor): void {
  // Setup Order Delete Route
  deleteOrder(router, orders)

  // Lookup Order
  getOrderRoute(router, orders)
}
