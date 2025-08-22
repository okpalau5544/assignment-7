import { afterEach, beforeEach } from 'vitest'
import server from '../server'
import { type AppBookDatabaseState } from '../src/database_access'
import { type AppWarehouseDatabaseState } from '../src/warehouse/warehouse_database'

export interface ServerTestContext {
  address: string
  state: AppBookDatabaseState & AppWarehouseDatabaseState
  closeServer: () => Promise<void>
}

export default function (): void {
  beforeEach<ServerTestContext>(async (context) => {
    // Set test environment variable
    process.env.NODE_ENV = 'test'

    // Start server with microservices disabled
    const { server: instance, state } = await server(undefined, true, true)
    const address = instance.address()
    if (typeof address === 'string') {
      context.address = `http://${address}`
    } else if (address !== null) {
      context.address = `http://localhost:${address.port}`
    } else {
      throw new Error('couldnt set up server')
    }
    context.state = state
    context.closeServer = async () => {
      await new Promise<void>((resolve) => {
        instance.close(() => {
          resolve()
        })
      })
    }
  }, 30000) // Increase timeout to 30 seconds

  afterEach<ServerTestContext>(async (context) => {
    if (context.closeServer != null) {
      await context.closeServer()
    }

    // Clean up microservice database connections
    try {
      const { closeBooksServiceDatabase } = await import('../services/books-service/database')
      await closeBooksServiceDatabase()
    } catch (error) {
      // Service may not be initialized
    }

    try {
      const { closeWarehouseServiceDatabase } = await import('../services/warehouse-service/database')
      await closeWarehouseServiceDatabase()
    } catch (error) {
      // Service may not be initialized
    }

    try {
      const { closeOrderServiceDatabase } = await import('../services/order-service/database')
      await closeOrderServiceDatabase()
    } catch (error) {
      // Service may not be initialized
    }
  })
}
