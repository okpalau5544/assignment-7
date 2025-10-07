import { type BookID, type Book } from '../documented_types'
import amqp from 'amqplib'
import timers from 'node:timers/promises'

const send = {
  bookCreatedOrUpdated: async (book: Book) => {},
  bookDeleted: async (book: BookID) => {}
}

export async function setupMessaging (): Promise<void> {
  const channelName = 'books'
  const conn = await new Promise<amqp.ChannelModel>((resolve, reject) => {
    void (async () => {
      for (let i = 0; i < 10; i++) {
        try {
          const result = await amqp.connect('amqp://rabbitmq')
          resolve(result); return
        } catch (e) {
          await timers.setTimeout(1000)
        }
      }
      console.error("Couldn't connect in time")
      reject(new Error("Couldn't connect in time"))
    })()
  })

  const channel = await conn.createChannel()
  await channel.assertExchange(channelName, 'topic', { durable: false })

  send.bookCreatedOrUpdated = async (book) => {
    channel.publish(channelName, '', Buffer.from(JSON.stringify({ created: book })))
  }

  send.bookDeleted = async (book) => {
    channel.publish(channelName, '', Buffer.from(JSON.stringify({ deleted: book })))
  }
}

export async function bookCreatedOrUpdated (book: Book): Promise<void> {
  await send.bookCreatedOrUpdated(book)
}

export async function bookDeleted (book: BookID): Promise<void> {
  await send.bookDeleted(book)
}
