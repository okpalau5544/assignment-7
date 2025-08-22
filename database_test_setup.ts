import { MongoMemoryServer } from 'mongodb-memory-server'
import { afterAll } from 'vitest'

export async function setup (): Promise<void> {
  // Create single MongoDB Memory Server instance for testing
  const instance = await MongoMemoryServer.create({ binary: { version: '7.0.7' } })
  
  while (instance.state === 'new') {
    await instance.start()
  }
  
  const uri = (instance as any).getUri() as string
  
  (global as any).__MONGOINSTANCE = instance;
  (global as any).MONGO_URI = uri.slice(0, uri.lastIndexOf('/'))
  
  // For microservice tests, we'll use the same database with different collection prefixes
  // This avoids the complexity of multiple MongoDB instances for testing
  const baseUri = uri.slice(0, uri.lastIndexOf('/'))
  process.env.MONGO_BOOKS_URL = `${baseUri}/test-books`
  process.env.MONGO_WAREHOUSE_URL = `${baseUri}/test-warehouse`  
  process.env.MONGO_ORDERS_URL = `${baseUri}/test-orders`
  
  console.log('[Test Setup] MongoDB Memory Server configured:', {
    baseUri,
    books: process.env.MONGO_BOOKS_URL,
    warehouse: process.env.MONGO_WAREHOUSE_URL,
    orders: process.env.MONGO_ORDERS_URL
  })
}

export async function teardown (): Promise<void> {
  const instance: MongoMemoryServer = (global as any).__MONGOINSTANCE
  if (instance) {
    await instance.stop({ doCleanup: true })
  }
}

await setup()

afterAll(teardown)
