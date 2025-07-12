import { ObjectId } from 'mongodb'
import { type BookDatabaseAccessor } from '../database_access'
import { type Book, type BookID } from '../../adapter/assignment-4'

export default async function createOrUpdateBook (book: Book, books: BookDatabaseAccessor): Promise<BookID | false> {
  const { books: bookCollection } = books
  const body = book

  if (typeof body.id === 'string') {
    const id = body.id
    const result = await bookCollection.replaceOne({ _id: { $eq: ObjectId.createFromHexString(id) } }, {
      id,
      name: body.name,
      description: body.description,
      price: body.price,
      author: body.author,
      image: body.image
    })
    if (result.modifiedCount === 1) {
      return id
    } else {
      return false
    }
  } else {
    const result = await bookCollection.insertOne({
      name: body.name,
      description: body.description,
      price: body.price,
      author: body.author,
      image: body.image
    })
    return result.insertedId.toHexString()
  }
}
