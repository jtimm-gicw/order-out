'use strict';

const { io } = require('socket.io-client');
const Chance = require('chance');
const chance = new Chance();

const orderConnection = io('http://localhost:3001/orderOut'); // updated port & namespace
const storeName = 'Noodies Noodle Shop';

orderConnection.on('connect', () => {
  console.log(`🍜 ${storeName} connected to /orderOut namespace`);

  // Subscribe to the store's queue for receiving updates
  orderConnection.emit('SUBSCRIBE', { queueId: storeName });

  // Simulate a new order every 5 seconds
  setInterval(() => {
    const order = {
      store: storeName,
      orderId: chance.guid(),
      customer: chance.name(),
      items: ['Pad Thai', 'Tom Yum Soup'],
      address: chance.address(),
      city: chance.city(),
      state: chance.state({ full: true }),
      zip: chance.zip(),
      email: chance.email(),
      phone: chance.phone({ formatted: true }),
      messageId: chance.guid()
    };
    console.log(`🍜 New order created:`, order);
    orderConnection.emit('PICKUP', order);
  }, 5000);
});

// Listen for IN-TRANSIT events for this store
orderConnection.on('IN-TRANSIT', (payload) => {
  if (payload.store === storeName) {
    console.log(`📦 Your order ${payload.orderId} is in-transit`);
  }
});

// Listen for DELIVERY events for this store
orderConnection.on('DELIVERY', (payload) => {
  if (payload.store === storeName) {
    console.log(`✅ Your order ${payload.orderId} has been delivered`);
  }
});
