// eslint-disable-next-line @typescript-eslint/no-var-requires
const amqp = require('amqplib')

let channel: any = null
let connection: any = null

export async function connectToRabbit (): Promise<void> {
  try {
    if (connection === null) {
      connection = await amqp.connect('amqp://localhost')
      channel = await connection.createChannel()
      await channel.assertQueue('order.created', { durable: true })
    }
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error)
    throw error
  }
}

export function getChannel (): any {
  if (channel === null) {
    throw new Error('RabbitMQ channel is not initialized. Call connectToRabbit first.')
  }
  return channel
}
