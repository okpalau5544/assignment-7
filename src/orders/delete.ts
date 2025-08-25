import { z } from 'zod'
import { type ZodRouter } from 'koa-zod-router'
import { ObjectId } from 'mongodb'
import { type BookDatabaseAccessor } from '../database_access'

export default function deleteBook (router: ZodRouter, orders: BookDatabaseAccessor): void {
  router.register({
    name: 'delete an order',
    method: 'delete',
    path: '/orders/:id',
    validate: {
      params: z.object({
        id: z.string()
      })
    },
    handler: async (ctx, next) => {
      const { orders: orderCollection } = orders
      const id = ctx.request.params.id
      const objectId = ObjectId.createFromHexString(id)
      const result = await orderCollection.deleteOne({ _id: { $eq: objectId } })
      if (result.deletedCount === 1) {
        ctx.body = {}
      } else {
        ctx.statusCode = 404
      }
      await next()
    }
  })
}
