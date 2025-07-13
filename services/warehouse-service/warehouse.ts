import express from 'express'
import { connectToRabbit, getChannel } from './rabbitmq'

const app = express()

connectToRabbit().then(async () => {
  const channel = getChannel()

  channel.consume('order.created', (msg: any) => {
    if (msg !== null) {
      const order = JSON.parse(msg.content.toString() as string)
      console.log('🏬 Warehouse received order:', order)
      channel.ack(msg)
    }
  })

  app.listen(3000, () => {
    console.log('🏬 Warehouse API running on port 3000')
  })
}).catch((err: Error) => {
  console.error('Failed to connect to RabbitMQ:', err)
  process.exit(1)
})

// This code sets up a simple warehouse service that listens for order creation messages from RabbitMQ.
