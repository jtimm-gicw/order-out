'use strict';

const { Server } = require('socket.io');
const Chance = require('chance');

const chance = new Chance();
const io = new Server(3001); // Change to your actual port if needed

// Create the namespace
const orderOut = io.of('/orderOut');

orderOut.on('connection', (orderConnection) => {
  console.log('✅ Client connected to /orderOut namespace');

  // Listen for a new order event
  orderConnection.on('newOrder', () => {
    const orderData = {
      orderId: chance.guid(),
      customerName: chance.name(),
      address: chance.address(),
      city: chance.city(),
      state: chance.state({ full: true }),
      zip: chance.zip(),
      email: chance.email(),
      phone: chance.phone({ formatted: true })
    };

    console.log('📦 New Order:', orderData);

    // Emit the new order to all clients in the namespace
    orderOut.emit('orderCreated', orderData);
  });

  orderConnection.on('disconnect', () => {
    console.log('❌ Client disconnected from /orderOut');
  });
});
