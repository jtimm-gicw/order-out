'use strict';

const { io } = require('socket.io-client');
const Chance = require('chance');
const chance = new Chance();

const orderConnection = io('http://localhost:3001/orderOut'); // connect to namespace
const storeName = 'Hubba-Boba';

orderConnection.on('connect', () => {
  console.log(`🧋 ${storeName} connected to /orderOut namespace`);

  // Subscribe to this store's updates if hub uses queue system
  orderConnection.emit('SUBSCRIBE', { queueId: storeName });

  // Simulate a new order every 5 seconds
  setInterval(() => {
    const order = {
      store: storeName,
      orderId: chance.guid(),
      customer: chance.name(),
      items: ['Taro Milk Tea', 'Brown Sugar Boba'],
      address: chance.address(),
      city: chance.city(),
      state: chance.state({ full: true }),
      zip: chance.zip(),
      email: chance.email(),
      phone: chance.phone({ formatted: true }),
      messageId: chance.guid()
    };

    console.log(`🧋 New order created:`, order);
    // Send this order to the hub so drivers can pick it up
    orderConnection.emit('PICKUP', order);
  }, 5000);
});

// Listen for driver updates
orderConnection.on('IN-TRANSIT', (payload) => {
  if (payload.store === storeName) {
    console.log(`📦 Your order ${payload.orderId} is in-transit`);
  }
});

orderConnection.on('DELIVERY', (payload) => {
  if (payload.store === storeName) {
    console.log(`✅ Your order ${payload.orderId} has been delivered`);
  }
});
