import type * as koa from 'koa'
import { Controller, Route, Request, Body, Post, Get, Delete, Path } from 'tsoa'
import { type BookID, type Book, type Filter } from '../documented_types'
import { type AppBookDatabaseState } from '../database_access'
import { ObjectId } from 'mongodb'
import listBooks from './list'
import createOrUpdateBook from './create_or_update'

// Helper function for getting a book by ID
async function getBook (id: BookID, books: any): Promise<Book | false> {
  const { books: bookCollection } = books
  if (id.length !== 24) {
    return false
  }
  const result = await bookCollection.findOne({ _id: { $eq: ObjectId.createFromHexString(id.trim()) } })
  if (result === null) {
    return false
  }
  return {
    id: result._id.toHexString(),
    name: result.name,
    author: result.author,
    description: result.description,
    price: result.price,
    image: result.image
  }
}

@Route('books')
export class BooksRoutes extends Controller {
  @Post('list')
  public async listBooks (@Body() filters: Filter[], @Request() request: koa.Request): Promise<Book[]> {
    const ctx: koa.ParameterizedContext<AppBookDatabaseState, koa.DefaultContext> = request.ctx
    return await listBooks(ctx.state.books, filters)
  }

  @Post()
  public async createOrUpdateBook (@Body() book: Book, @Request() request: koa.Request): Promise<{ id: BookID }> {
    const ctx: koa.ParameterizedContext<AppBookDatabaseState, koa.DefaultContext> = request.ctx
    const result = await createOrUpdateBook(book, ctx.state.books)

    if (result !== false) {
      return { id: result }
    } else {
      this.setStatus(404)
      return { id: book.id ?? '' }
    }
  }

  @Get('{id}')
  public async getBook (@Path() id: BookID, @Request() request: koa.Request): Promise<Book> {
    const ctx: koa.ParameterizedContext<AppBookDatabaseState, koa.DefaultContext> = request.ctx
    const result = await getBook(id, ctx.state.books)

    if (result !== false) {
      return result
    } else {
      this.setStatus(404)
      throw new Error('Book not found')
    }
  }

  @Delete('{id}')
  public async deleteBook (@Path() id: BookID, @Request() _request: koa.Request): Promise<void> {
    // Placeholder for delete functionality - id would be used here
    console.log('Delete requested for book:', id)
    this.setStatus(501) // Not implemented yet
  }
}
