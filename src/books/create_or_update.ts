import { ObjectId } from 'mongodb'
import { type BookDatabaseAccessor } from '../database_access'
import { type Book, type BookID } from '../documented_types'
import ( bookCreatedOrUpdated ) from './messaging'

export default async function createOrUpdateBook (book: Book, books: BookDatabaseAccessor): Promise<BookID | false> {
  const { books: bookCollection } = books
  const body = book

  if (typeof body.id === 'string') {
    const id = body.id
    const book = {
      id,
      name: body.name,
      description: body.description,
      price: body.price,
      author: body.author,
      image: body.image
    }
    const result = await bookCollection.replaceOne({ _id: { $eq: ObjectId.createFromHexString(id) } }, book, { upsert: true })
    if (result.modifiedCount === 1) {
      await bookCreatedOrUpdated(book)
      return id
    } else {
      return false
    }
  } else {
    let book : Book = {
      name: body.name,
      description: body.description,
      price: body.price,
      author: body.author,
      image: body.image
    }
    const result = await bookCollection.insertOne(book)
    const id = result.insertedId.toHexString()
    book = {
      id,
      ...book
    }
    await bookCreatedOrUpdated(book)
    return id
  }
}