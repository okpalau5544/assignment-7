import type * as koa from 'koa'
import { Controller, Route, Request, Body, Post, Get, Delete, Path } from 'tsoa'
import { type OrderId, type Book, type Filter } from '../documented_types'
import { type AppBookDatabaseState } from '../database_access'
import { Order } from '../documented_types'
import deleteOrder from './delete'
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

  @Delete('{id}')
  public async deleteOrder (@Path() id: OrderId, @Request() request: koa.Request): Promise<void> {
    const ctx: koa.ParameterizedContext<AppBookDatabaseState, koa.DefaultContext> = request.ctx
    // We'll need to implement a proper delete function that returns boolean
    // For now, this is a placeholder
    this.setStatus(501) // Not implemented
  }
}