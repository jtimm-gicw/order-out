'use strict';

const { io } = require('socket.io-client');

const storeName = 'Hubba-Boba';

// Connect to hub namespace
const orderConnection = io('http://localhost:3001/orderOut');

orderConnection.on('connect', () => {
  console.log(`🧋 ${storeName} connected to /orderOut namespace`);

  // Request the hub to generate an order every 7 seconds
  setInterval(() => {
    console.log(`🧋 Requesting new order from hub...`);
    orderConnection.emit('newOrder');
  }, 7000);
});

// Listen for orders created by hub
orderConnection.on('orderCreated', (order) => {
  console.log(`🧋 Received order from hub:`, order);

  // Simulate marking the order as picked up
  setTimeout(() => {
    orderConnection.emit('PICKUP', { store: storeName, ...order });
    console.log(`🚚 Order ${order.orderId} picked up`);
  }, 2000);
});

// Listen for IN-TRANSIT events
orderConnection.on('IN-TRANSIT', (payload) => {
  if (payload.store === storeName) {
    console.log(`📦 Your order ${payload.orderId} is in-transit`);
  }
});

// Listen for DELIVERY events
orderConnection.on('DELIVERY', (payload) => {
  if (payload.store === storeName) {
    console.log(`✅ Your order ${payload.orderId} has been delivered`);
  }
});
