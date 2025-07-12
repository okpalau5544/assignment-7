import { BodyProp, Controller, Get, Path, Post, Put, Route, SuccessResponse, Request } from 'tsoa'
import { getBookInfo } from './get_book_info'
import { type ShelfId, type BookID, type OrderId, type FulfilledBooks, type OrderPlacement, type Order } from '../documented_types'
import { placeBooksOnShelf } from './place_on_shelf'
import { fulfilOrder } from './fulfil_order'
import { placeOrder } from './place_order'
import { listOrders } from './list_orders'
import { type ParameterizedContext, type DefaultContext, type Request as KoaRequest } from 'koa'
import { type AppWarehouseDatabaseState } from './warehouse_database'

@Route('warehouse')
export class WarehouseRoutes extends Controller {
  /**
     * Find the shelves that have copies of the book, and how
     * many copies each shelf has
     * @param book The book's unique identifier!
     * @returns {BookInfo}
     */
  @Get('{book}')
  public async getBookInfo (
    @Path() book: BookID,
      @Request() request: KoaRequest
  ): Promise<Record<string, number>> {
    const ctx: ParameterizedContext<AppWarehouseDatabaseState, DefaultContext> = request.ctx
    const data = ctx.state.warehouse
    return await getBookInfo(data, book)
  }

  /**
   * Add copies of a book to a provided shelf
   * @param book The book's unique identifier
   * @param shelf The shelf's name
   * @param number The number of copies to place on the shelf
   */
  @Put('{book}/{shelf}/{number}')
  @SuccessResponse(201, 'Added')
  public async placeBooksOnShelf (@Path() book: BookID, @Path() shelf: ShelfId, @Path() number: number,
    @Request() request: KoaRequest): Promise<void> {
    const ctx: ParameterizedContext<AppWarehouseDatabaseState, DefaultContext> = request.ctx
    this.setStatus(201)
    await placeBooksOnShelf(ctx.state.warehouse, book, number, shelf)
  }
}

@Route('fulfil')
export class FulfilOrderRoutes extends Controller {
  /**
     * Fulfil an order by taking all the relevant book copies for the order off the shelves
     * @param order The Order ID
     * @param booksFulfilled An array lsting how many copies of each book were taken from each shelf
     */
  @Put('{order}')
  @SuccessResponse(201, 'Fulfilled')
  public async fulfilOrder (
    @Path() order: OrderId,
      @BodyProp('booksFulfilled') booksFulfilled: FulfilledBooks,
      @Request() request: KoaRequest
  ): Promise<void> {
    const ctx: ParameterizedContext<AppWarehouseDatabaseState, DefaultContext> = request.ctx
    this.setStatus(201)
    try {
      await fulfilOrder(ctx.state.warehouse, order, booksFulfilled)
      this.setStatus(201)
    } catch (e) {
      this.setStatus(500)
      console.error('Error Fulfilling Order', e)
    }
  }
}

@Route('order')
export class OrderRoutes extends Controller {
  /**
     * Place an order
     * @param order An array of the ordered book id's
     * @returns {OrderId}
     */
  @Post()
  @SuccessResponse(201, 'created')
  public async placeOrder (
    @BodyProp('order') order: OrderPlacement,
      @Request() request: KoaRequest
  ): Promise<OrderId> {
    const ctx: ParameterizedContext<AppWarehouseDatabaseState, DefaultContext> = request.ctx
    this.setStatus(201)
    try {
      const result = await placeOrder(ctx.state.warehouse, order)
      return result
    } catch (e) {
      this.setStatus(500)
      return ''
    }
  }

  /**
   * Get all the pending orders
   * @returns {Order[]}
   */
  @Get()
  public async listOrders (
    @Request() request: KoaRequest): Promise<Order[]> {
    const ctx: ParameterizedContext<AppWarehouseDatabaseState, DefaultContext> = request.ctx
    return await listOrders(ctx.state.warehouse)
  }
}
