// eslint-disable-next-line @typescript-eslint/no-var-requires
const amqp = require('amqplib')

let channel: any = null
let connection: any = null

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://admin:password@localhost:5672'
const QUEUE_NAMES = {
  ORDER_CREATED: 'order.created',
  ORDER_PROCESSED: 'order.processed',
  INVENTORY_UPDATED: 'inventory.updated',
  FULFILLMENT_REQUEST: 'fulfillment.request',
  FULFILLMENT_COMPLETED: 'fulfillment.completed'
} as const

export async function connectToRabbit (): Promise<void> {
  try {
    if (connection === null) {
      console.log(`[Warehouse Service] Connecting to RabbitMQ at ${RABBITMQ_URL.replace(/\/\/.*@/, '//***:***@')}`)
      connection = await amqp.connect(RABBITMQ_URL)
      channel = await connection.createChannel()

      // Assert all queues used by warehouse service
      await channel.assertQueue(QUEUE_NAMES.ORDER_CREATED, { durable: true })
      await channel.assertQueue(QUEUE_NAMES.ORDER_PROCESSED, { durable: true })
      await channel.assertQueue(QUEUE_NAMES.INVENTORY_UPDATED, { durable: true })
      await channel.assertQueue(QUEUE_NAMES.FULFILLMENT_REQUEST, { durable: true })
      await channel.assertQueue(QUEUE_NAMES.FULFILLMENT_COMPLETED, { durable: true })

      console.log('[Warehouse Service] Successfully connected to RabbitMQ')

      // Handle connection errors
      connection.on('error', (err: Error) => {
        console.error('[Warehouse Service] RabbitMQ connection error:', err)
      })

      connection.on('close', () => {
        console.log('[Warehouse Service] RabbitMQ connection closed')
        connection = null
        channel = null
      })
    }
  } catch (error) {
    console.error('[Warehouse Service] Failed to connect to RabbitMQ:', error)
    throw error
  }
}

export function getChannel (): any {
  if (channel === null) {
    throw new Error('RabbitMQ channel is not initialized. Call connectToRabbit first.')
  }
  return channel
}

export async function publishMessage (queue: string, message: any): Promise<void> {
  const ch = getChannel()
  const messageBuffer = Buffer.from(JSON.stringify(message))
  ch.sendToQueue(queue, messageBuffer, { persistent: true })
  console.log(`[Warehouse Service] Published message to ${queue}:`, message)
}

export async function consumeMessages (queue: string, callback: (message: any) => void): Promise<void> {
  const ch = getChannel()
  await ch.consume(queue, (msg: any) => {
    if (msg !== null) {
      try {
        const content = JSON.parse(msg.content.toString() as string)
        console.log(`[Warehouse Service] Received message from ${queue}:`, content)
        callback(content)
        ch.ack(msg)
      } catch (error) {
        console.error(`[Warehouse Service] Error processing message from ${queue}:`, error)
        ch.nack(msg, false, false) // Don't requeue on parse error
      }
    }
  })
}

export { QUEUE_NAMES }
