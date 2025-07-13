import eventBus from '../eventBus'

interface Order {
  item: string
}

function createOrder (item: string): void {
  console.log(`[Orders] Creating order for: ${item}`)
  const order: Order = { item }
  eventBus.emit('order:created', order)
}

// Example usage
createOrder('Sample Item')
