'use strict';

const { io } = require('socket.io-client');
const Chance = require('chance');
const chance = new Chance();

const orderConnection = io('http://localhost:3001/orderOut'); // Updated port & namespace
const storeName = 'Hubba-Boba';

orderConnection.on('connect', () => {
  console.log(`🧋 ${storeName} connected to /orderOut namespace`);

  // Subscribe to this store's queue to receive relevant events
  orderConnection.emit('SUBSCRIBE', { queueId: storeName });

  // Simulate new orders every 7 seconds with random data
  setInterval(() => {
    const order = {
      store: storeName,
      orderId: chance.guid(),
      customer: chance.name(),
      items: ['Brown Sugar Boba', 'Taro Milk Tea'],
      address: chance.address(),
      city: chance.city(),
      state: chance.state({ full: true }),
      zip: chance.zip(),
      email: chance.email(),
      phone: chance.phone({ formatted: true }),
      messageId: chance.guid() // For tracking in queues
    };
    console.log(`🧋 New order created:`, order);
    orderConnection.emit('PICKUP', order);
  }, 7000);
});

// Listen for IN-TRANSIT events related to this store
orderConnection.on('IN-TRANSIT', (payload) => {
  if (payload.store === storeName) {
    console.log(`📦 Your order ${payload.orderId} is in-transit`);
  }
});

// Listen for DELIVERY events related to this store
orderConnection.on('DELIVERY', (payload) => {
  if (payload.store === storeName) {
    console.log(`✅ Your order ${payload.orderId} has been delivered`);
  }
});
