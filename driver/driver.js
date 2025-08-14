'use strict';

const { io } = require('socket.io-client');
const Chance = require('chance');
const chance = new Chance();

// Connect to the /orderOut namespace
const orderConnection = io('http://localhost:3001/orderOut');

orderConnection.on('connect', () => {
  console.log('🚚 Driver connected to /orderOut namespace');
});

// Listen for new orders from the hub
orderConnection.on('orderCreated', (payload) => {
  console.log('📦 DRIVER received new order:', payload);

  // Simulate picking up the package after 1 second
  setTimeout(() => {
    console.log(`🚚 DRIVER: Picked up package for ${payload.customerName}`);

    // Emit IN-TRANSIT event
    orderConnection.emit('IN-TRANSIT', {
      ...payload,
      driverId: chance.guid(),
      driverName: chance.name()
    });
  }, 1000);

  // Simulate delivery after 2 seconds
  setTimeout(() => {
    console.log(`📬 DRIVER: Delivered package for ${payload.customerName}`);

    // Emit DELIVERED event
    orderConnection.emit('DELIVERED', {
      ...payload,
      driverId: chance.guid(),
      driverName: chance.name()
    });
  }, 2000);
});
