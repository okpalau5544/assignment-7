/**
 * A unique identifier for a particular book
 */
export type BookID = string

/**
 * A unique identifier for a particular order
 */
export type OrderId = string

/**
 * The name of a shelf
 */
export type ShelfId = string

/**
 * An array listing how many copies of each book are taken from a given shelf while fulfilling an order
 */
export type FulfilledBooks = Array<{ book: BookID, shelf: ShelfId, numberOfBooks: number }>

/**
 * An array listing all the books ordered by Id. Multiple copies of a book are listed as duplicate IDs
 */
export type OrderPlacement = BookID[]

/**
 * An order's details
 */
export interface Order {
  /**
     * The order's unique id
     */
  orderId: OrderId
  /**
   * A dictionary of book id's matching the number of copies of each book requested for the order
   */
  books: Record<BookID, number>
}

export interface Book {
  id?: BookID
  name: string
  author: string
  description: string
  price: number
  image: string
}

export interface Filter {
  from?: number
  to?: number
  name?: string
  author?: string
};
