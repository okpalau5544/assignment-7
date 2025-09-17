import { ObjectId } from 'mongodb'
import { type BookDatabaseAccessor } from '../database_access'
import { OrderId, type Order } from '../documented_types'
import { orderCollection } from './database_access'

export default async function createOrUpdateOrder (order: Order, orders: BookDatabaseAccessor): Promise<OrderId | false> {
  const body = order

  if (typeof body.orderId === 'string' && body.orderId.length === 24) {
    const orderId = body.orderId
    const result = await orderCollection.replaceOne(
      { _id: { $eq: ObjectId.createFromHexString(orderId) } }, 
      {
        orderId,
        books: body.books
      }
    )
    if (result.modifiedCount === 1) {
      return orderId
    } else {
      return false
    }
  } else {
    const result = await orderCollection.insertOne({
      orderId: new ObjectId().toHexString(),
      books: body.books
    })
    return result.insertedId.toHexString()
  }
}
