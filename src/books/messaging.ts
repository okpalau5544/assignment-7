import { BookID, type Book } from "../../documented_types";
import amqp from "amqplib";
import timers from "node:timers/promises";

const send = {
    bookCreatedOrUpdated: async (book: Book) => {},
    bookDeleted: async (book: BookID) => {}
}

export async  function setupMessaging () {
    const channelName = 'books';
    const conn = await new Promise<amqp.Connection>(async (resolve, reject) => {
        for (let i = 0; i < 10; i++) {
            try {
                let result = await amqp.connect("amqp://rabbitmq");
                return resolve(result);
            } catch (e) {
                await timers.setTimeout(1000);
            }
        }
        console.error("Couldn't connect in time");
        reject("Couldn't connect in time");
    });

    const channel = await conn.createChannel();
    await channel.assertExchange(channelName, "topic", { durable: false});

    send.bookCreatedOrUpdated = async (book) => {
        channel.publish(channelName, '', Buffer.from(JSON.stringify({ created: book })));
    };

    send.bookDeleted = async (book) => {
        channel.publish(channelName, '', Buffer.from(JSON.stringify({deleted: book})));
    }
}

export async function bookCreatedOrUpdated(book: Book) {
    send.bookCreatedOrUpdated(book);
}

export async function bookDeleted(book: BookID) {
    send.bookDeleted(book);
}