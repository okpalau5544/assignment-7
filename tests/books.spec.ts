import { expect, test } from 'vitest'
import setup, { type ServerTestContext } from './run_server'
import { Configuration, DefaultApi } from '../client'
import { generateId, seedBookDatabase } from '../database_test_utilities'
import { type BookID, type Book } from '../src/documented_types'
import { ObjectId } from 'mongodb'

setup()

test<ServerTestContext>('list books', async ({ address, state }) => {
  const id1 = generateId<BookID>()
  const book1: Book = {
    id: id1,
    name: 'My First Book',
    author: 'An Author',
    description: '',
    price: 0,
    image: ''
  }
  const id2 = generateId<BookID>()
  const book2: Book = {
    id: id2,
    name: 'My Second Book',
    author: 'Another Author',
    description: '',
    price: 0,
    image: ''
  }
  await seedBookDatabase(state.books, { books: { [id1]: book1, [id2]: book2 } })
  const client = new DefaultApi(new Configuration({ basePath: address }))
  const response = await client.listBooks({ filter: [] })

  expect(response).toHaveLength(2)

  expect(response[0].id).not.toEqual(response[1].id)

  for (const book of response) {
    const compare = book.id === id1 ? book1 : book2

    expect(book.name).toEqual(compare.name)
    expect(book.author).toEqual(compare.author)
  }
})

test<ServerTestContext>('create and update books', async ({ address, state }) => {
  const book: Book = {
    name: 'My First Book',
    author: 'An Author',
    description: '',
    price: 0,
    image: ''
  }
  const client = new DefaultApi(new Configuration({ basePath: address }))
  const response: { id: BookID } = await client.createOrUpdateBook({ book })
  const addedBook = await state.books.books.findOne({ _id: ObjectId.createFromHexString(response.id) })

  expect(addedBook?.name).toEqual(book.name)
  expect(addedBook?.author).toEqual(book.author)

  book.id = response.id
  book.name = 'My First Book Version 2'

  await client.createOrUpdateBook({ book })
  const updatedBook = await state.books.books.findOne({ _id: ObjectId.createFromHexString(response.id) })

  expect(updatedBook?.name).toEqual(book.name)
  expect(updatedBook?.author).toEqual(book.author)
})
