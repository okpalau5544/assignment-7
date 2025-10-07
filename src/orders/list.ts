import { orderCollection } from './database_access'
import { type BookDatabaseAccessor } from '../database_access'
import { type Filter, type Order } from '../documented_types'

export default async function listOrders (books: BookDatabaseAccessor, filters: Filter[]): Promise<Order[]> {
  // For now, we'll return all orders since order filtering by book properties
  // would require more complex logic involving book lookups
  const orderList = await orderCollection.find({}).toArray()

  return orderList.map(document => ({
    orderId: document.orderId,
    books: document.books
  }))
}
