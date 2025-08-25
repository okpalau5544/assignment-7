import { MongoClient } from 'mongodb'
// We are importing the book type here, so we can keep our types consistent with the front end
import type { Book } from '../../schema/type'
import { Order } from '../documented_types'

// This is the connection string for the mongo database in our docker compose file
const uri = 'mongodb://localhost:27017'

// We're setting up a client, opening the database for our project, and then opening
// a typed collection for our orders.
export const client = new MongoClient(uri)
export const database = client.db('mcmasterful-books')
export const orderCollection = database.collection<Order>('orders')