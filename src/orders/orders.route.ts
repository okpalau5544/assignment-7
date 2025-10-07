import type * as koa from 'koa'
import { Controller, Route, Request, Body, Post, Get, Path } from 'tsoa'
import { type OrderId, type Filter, type Order } from '../documented_types'
import { type AppBookDatabaseState } from '../database_access'
import listOrders from './list'
import createOrUpdateOrder from './create_or_update'
import { getOrder } from './lookup'

@Route('orders')
export class OrdersRoutes extends Controller {
  @Post('list')
  public async listOrders (@Body() filters: Filter[], @Request() request: koa.Request): Promise<Order[]> {
    const ctx: koa.ParameterizedContext<AppBookDatabaseState, koa.DefaultContext> = request.ctx
    return await listOrders(ctx.state.books, filters)
  }

  @Post()
  public async createOrUpdateOrder (@Body() order: Order, @Request() request: koa.Request): Promise<{ id: OrderId }> {
    const ctx: koa.ParameterizedContext<AppBookDatabaseState, koa.DefaultContext> = request.ctx
    const result = await createOrUpdateOrder(order, ctx.state.books)

    if (result !== false) {
      return { id: result }
    } else {
      this.setStatus(404)
      return { id: order.orderId ?? '' }
    }
  }

  @Get('{id}')
  public async getOrder (@Path() id: OrderId, @Request() request: koa.Request): Promise<Order> {
    const ctx: koa.ParameterizedContext<AppBookDatabaseState, koa.DefaultContext> = request.ctx
    const result = await getOrder(id, ctx.state.books)

    if (result !== false) {
      return result
    } else {
      this.setStatus(404)
      throw new Error('Order not found')
    }
  }

  public async deleteOrder (@Path() id: OrderId, @Request() _request: koa.Request): Promise<void> {
    // We'll need to implement a proper delete function that returns boolean
    // For now, this is a placeholder - id would be used here
    console.log('Delete requested for order:', id)
    this.setStatus(501) // Not implemented
  }
}
