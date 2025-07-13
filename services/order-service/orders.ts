import express from 'express'
import { connectToRabbit, getChannel } from './rabbitmq' // Fixed: Created rabbitmq.ts module

const app = express()
app.use(express.json())

app.post('/orders', (req: express.Request, res: express.Response) => {
  (async () => {
    const channel = getChannel()
    const order = req.body

    channel.sendToQueue('order.created', Buffer.from(JSON.stringify(order)))
    console.log('Sent order message:', order)

    res.status(201).send({ status: 'Order sent to queue' })
  })().catch(err => {
    console.error('Error processing order:', err)
    res.status(500).send({ error: 'Internal server error' })
  })
})

connectToRabbit().then(() => {
  app.listen(3000, () => {
    console.log('Orders API running on port 3000')
  })
}).catch((err: Error) => {
  console.error('Failed to connect to RabbitMQ:', err)
  process.exit(1)
})
