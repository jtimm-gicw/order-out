'use strict';

const { io } = require('socket.io-client');
const Chance = require('chance');
const chance = new Chance();

// Single connection to the /orderOut namespace
const orderConnection = io('http://localhost:3001/orderOut');

orderConnection.on('connect', () => {
  console.log('🚚 Driver connected to /orderOut namespace');

  // Subscribe driver to its queue so it receives PICKUP events
  orderConnection.emit('SUBSCRIBE', { queueId: 'drivers' });
});

// Listen for PICKUP events from the hub
orderConnection.on('PICKUP', (order) => {
  console.log(`📦 DRIVER: Received order ${order.orderId} for ${order.customerName}`);

  // Simulate picking up the order after 1 second
  setTimeout(() => {
    console.log(`🚚 DRIVER: Picking up order ${order.orderId}`);

    // Emit IN-TRANSIT with driver info
    orderConnection.emit('IN-TRANSIT', {
      ...order,
      driverId: chance.guid(),
      driverName: chance.name()
    });

    // Simulate delivery after another 2 seconds
    setTimeout(() => {
      console.log(`✅ DRIVER: Delivered order ${order.orderId}`);

      // Emit DELIVERY event with driver info
      orderConnection.emit('DELIVERY', {
        ...order,
        driverId: chance.guid(),
        driverName: chance.name()
      });
    }, 2000);
  }, 1000);
});

// Optionally, listen for hub updates on your queue (IN-TRANSIT/DELIVERY)
orderConnection.on('IN-TRANSIT', (payload) => {
  console.log(`📦 Order ${payload.orderId} is in-transit by ${payload.driverName}`);
});

orderConnection.on('DELIVERY', (payload) => {
  console.log(`✅ Order ${payload.orderId} delivered by ${payload.driverName}`);
});
