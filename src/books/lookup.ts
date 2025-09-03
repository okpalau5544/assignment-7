import { z } from 'zod'
import { getBookDatabase, type BookDatabaseAccessor } from './database_access'
import { type BookID, type Book } from '../../documented_types'
import { type ZodRouter } from 'koa-zod-router'
import { ObjectId } from 'mongodb'
import { generateId, seedBookDatabase } from '../database_test_utilities'


export default  async function getBook (id: BookID, { books }: BookDatabaseAccessor): Promise<Book | false> {
  if (id.length !== 24) {
    console.error('Failed with id: ', id)
    return false
  }
  const result = await books.findOne({ _id: ObjectId.createFromHexString(id.trim()) })
  if (result === null) {
    return false
  }
  const book: Book = {
    id,
    name: result.name,
    author: result.author,
    description: result.description,
    price: result.price,
    image: result.image
  }
  return book
}

if (import.meta.vitest !== undefined) {
  const { test, expect } = import.meta.vitest

  test('Can Find A Matching Book', async () => {
    const db = getBookDatabase()
    const id: BookID = generateId()
    const testBook: Book = {
      id,
      name: 'My Book!',
      author: 'test author',
      description: '',
      price: 0,
      image: ''
    }
    await seedBookDatabase(db, { books: { [id]: testBook } })
    const result = await getBook(id, db)

    expect(result).toBeTruthy()
    if (result !== false) {
      expect(result.name).toEqual(testBook.name)
      expect(result.author).toEqual(testBook.author)
      expect(result.id).toEqual(testBook.id)
    }
  })
}