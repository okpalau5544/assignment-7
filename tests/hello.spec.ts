import { expect, test } from 'vitest'
import setup, { type ServerTestContext } from './run_server'
import { Configuration, DefaultApi } from '../client'

setup()

test<ServerTestContext>('the hello route says hello to the correct person', async ({ address }) => {
  const client = new DefaultApi(new Configuration({ basePath: address }))
  const response = await client.sayHello({ name: 'my_name' })
  expect(response).toEqual('Hello my_name')
})
