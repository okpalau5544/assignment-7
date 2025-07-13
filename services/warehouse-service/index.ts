import eventBus from '../eventBus'

interface Order {
  item: string
  [key: string]: any
}

eventBus.on('order:created', (order: Order) => {
  console.log(`[Warehouse] Decrease inventory for: ${order.item}`)
})
