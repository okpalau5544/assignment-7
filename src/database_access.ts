import { type Collection, type Db, MongoClient } from 'mongodb'
// We are importing the book type here, so we can keep our types consistent with the front end
import { type Book } from '../adapter/assignment-3'
import { type Order } from './documented_types'

// This is the connection string for the mongo database in our docker compose file
// We're using process.env to detect if a different mongo uri is set, primarily for testing purposes
console.log('mongodbUri')
console.log(process.env.MONGO_URI)
const uri = process.env.MONGO_URI ?? 'mongodb://localhost:27017'
// const uri = (global as any).MONGO_URI as string ?? 'mongodb://localhost:27017'

// We're setting up a client, opening the database for our project, and then opening
// a typed collection for our books.
export const client = new MongoClient(uri)

// We're moving the setup of the database and collections into a function with a returned value,
// to allow us to isolate them in tests

export interface BookDatabaseAccessor {
  database: Db
  books: Collection<Book>
  orders: Collection<Order>
}

export interface AppBookDatabaseState {
  books: BookDatabaseAccessor
  orders: BookDatabaseAccessor
}

export function getBookDatabase (dbName?: string): BookDatabaseAccessor {
  const database = client.db(dbName ?? Math.floor(Math.random() * 100000).toPrecision().toString())
  const books = database.collection<Book>('books')

  return {
    database,
    books,
    orders: database.collection<Order>('orders')
  }
}

if (import.meta.vitest !== undefined) {
  const { test, expect } = import.meta.vitest

  test('Can Setup Test DB', () => {
    const { database } = getBookDatabase()
    expect(database.databaseName, `URI: ${uri}, DB: ${database.databaseName}`).not.toEqual('mcmasterful-books')
  })
}
