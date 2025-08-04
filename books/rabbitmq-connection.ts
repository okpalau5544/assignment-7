// eslint-disable-next-line @typescript-eslint/no-var-requires
const amqp = require('amqplib')

export interface RabbitMQConfig {
  url: string
  queues: Record<string, string>
  exchanges: Record<string, string>
}

export const RABBITMQ_CONFIG: RabbitMQConfig = {
  url: process.env.RABBITMQ_URL ?? 'amqp://admin:password@localhost:5672',
  queues: {
    ORDER_CREATED: 'order.created',
    ORDER_PROCESSED: 'order.processed',
    ORDER_FAILED: 'order.failed',
    INVENTORY_UPDATED: 'inventory.updated',
    FULFILLMENT_REQUEST: 'fulfillment.request',
    FULFILLMENT_COMPLETED: 'fulfillment.completed',
    BOOK_AVAILABILITY_CHECK: 'book.availability.check',
    BOOK_AVAILABILITY_RESPONSE: 'book.availability.response'
  },
  exchanges: {
    ORDERS: 'orders.exchange',
    INVENTORY: 'inventory.exchange',
    FULFILLMENT: 'fulfillment.exchange'
  }
}

export class RabbitMQConnection {
  private connection: any = null
  private channel: any = null
  private readonly config: RabbitMQConfig
  private readonly serviceName: string

  constructor (serviceName: string, config: RabbitMQConfig = RABBITMQ_CONFIG) {
    this.serviceName = serviceName
    this.config = config
  }

  async connect (): Promise<void> {
    try {
      if (this.connection === null) {
        console.log(`[${this.serviceName}] Connecting to RabbitMQ at ${this.config.url.replace(/\/\/.*@/, '//***:***@')}`)
        this.connection = await amqp.connect(this.config.url)
        this.channel = await this.connection.createChannel()

        // Assert all queues
        for (const queueName of Object.values(this.config.queues)) {
          await this.channel.assertQueue(queueName, { durable: true })
        }

        console.log(`[${this.serviceName}] Successfully connected to RabbitMQ`)

        // Handle connection events
        this.connection.on('error', (err: Error) => {
          console.error(`[${this.serviceName}] RabbitMQ connection error:`, err)
        })

        this.connection.on('close', () => {
          console.log(`[${this.serviceName}] RabbitMQ connection closed`)
          this.connection = null
          this.channel = null
        })
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to connect to RabbitMQ:`, error)
      throw error
    }
  }

  getChannel (): any {
    if (this.channel === null) {
      throw new Error(`[${this.serviceName}] RabbitMQ channel is not initialized. Call connect() first.`)
    }
    return this.channel
  }

  async publish (queue: string, message: any): Promise<void> {
    const channel = this.getChannel()
    const messageBuffer = Buffer.from(JSON.stringify(message))
    channel.sendToQueue(queue, messageBuffer, { persistent: true })
    console.log(`[${this.serviceName}] Published message to ${queue}:`, message)
  }

  async consume (queue: string, callback: (message: any) => void | Promise<void>): Promise<void> {
    const channel = this.getChannel()
    await channel.consume(queue, async (msg: any) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString() as string)
          console.log(`[${this.serviceName}] Received message from ${queue}:`, content)
          await callback(content)
          channel.ack(msg)
        } catch (error) {
          console.error(`[${this.serviceName}] Error processing message from ${queue}:`, error)
          channel.nack(msg, false, false) // Don't requeue on error
        }
      }
    })
  }

  async close (): Promise<void> {
    if (this.connection !== null) {
      await this.connection.close()
      this.connection = null
      this.channel = null
      console.log(`[${this.serviceName}] RabbitMQ connection closed`)
    }
  }
}

export default RabbitMQConnection
