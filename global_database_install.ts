import { MongoMemoryServer } from 'mongodb-memory-server'

export async function setup (): Promise<void> {
  const instance = await MongoMemoryServer.create({ binary: { version: '7.0.7' } })
  await instance.stop({ doCleanup: true })
}

export async function teardown (): Promise<void> {
}
