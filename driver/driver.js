'use strict';

const { io } = require('socket.io-client');
const Chance = require('chance');
const chance = new Chance();

// Connect to the /orderOut namespace
const orderConnection = io('http://localhost:3001/orderOut');

orderConnection.on('connect', () => {
  console.log('🚚 Driver connected to /orderOut namespace');

  // Subscribe driver to its queue so it receives pickup notifications
  orderConnection.emit('SUBSCRIBE', { queueId: 'drivers' });
});

// Listen for PICKUP events to simulate package pickup and delivery
orderConnection.on('PICKUP', (payload) => {
  console.log('📦 PICKUP received:', payload);

  // Simulate picking up the package after 1 second
  setTimeout(() => {
    console.log('🚚 DRIVER: picked up package.');

    // Emit IN-TRANSIT event with random driver info added
    orderConnection.emit('IN-TRANSIT', {
      ...payload,
      driverId: chance.guid(),
      driverName: chance.name()
    });
  }, 1000);

  // Simulate delivery after 2 seconds
  setTimeout(() => {
    console.log('🚚 DRIVER: package delivered.');

    // Emit DELIVERY event with random driver info added
    orderConnection.emit('DELIVERY', {
      ...payload,
      driverId: chance.guid(),
      driverName: chance.name()
    });
  }, 2000);
});

