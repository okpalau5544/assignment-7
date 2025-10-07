import { z } from 'zod'
import { type BookDatabaseAccessor } from '../database_access'
import { type OrderId } from '../../adapter/assignment-4'
import { type Order } from '../documented_types'
import { type ZodRouter } from 'koa-zod-router'
import { ObjectId } from 'mongodb'

export async function getOrder (id: OrderId, { orders }: BookDatabaseAccessor): Promise<Order | false> {
  if (id.length !== 24) {
    console.error('Failed with order id: ', id)
    return false
  }

  try {
    const result = await orders.findOne({ _id: ObjectId.createFromHexString(id.trim()) })
    if (result === null) {
      return false
    }

    const order: Order = {
      orderId: id,
      books: result.books
    }
    return order
  } catch (error) {
    console.error('Error looking up order:', error)
    return false
  }
}

export default function getOrderRoute (router: ZodRouter, orders: BookDatabaseAccessor): void {
  router.register({
    name: 'get order',
    method: 'get',
    path: '/orders/:id',
    validate: {
      params: z.object({
        id: z.string().min(2)
      })
    },
    handler: async (ctx, next) => {
      const { id } = ctx.request.params

      const result = await getOrder(id, orders)

      if (result === false) {
        ctx.status = 404
        return await next()
      }

      ctx.body = result
      await next()
    }
  })
}
