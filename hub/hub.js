'use strict';

const { Server } = require('socket.io');
const Chance = require('chance');

const chance = new Chance();
const io = new Server(3001);

const orderOut = io.of('/orderOut');

orderOut.on('connection', (socket) => {
  console.log('✅ Client connected to /orderOut namespace');

  // Allow clients to join specific queues
  socket.on('SUBSCRIBE', ({ queueId }) => {
    socket.join(queueId);
    console.log(`📥 Client joined queue: ${queueId}`);
  });

  // Vendor creates a new order
  socket.on('newOrder', () => {
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

    // Send to all drivers subscribed
    orderOut.to('drivers').emit('PICKUP', orderData);
  });

  // Driver updates order status
  socket.on('IN-TRANSIT', (payload) => {
    console.log(`🚚 Order ${payload.orderId} is in transit by ${payload.driverName}`);
    orderOut.emit('IN-TRANSIT', payload);
  });

  socket.on('DELIVERY', (payload) => {
    console.log(`✅ Order ${payload.orderId} delivered by ${payload.driverName}`);
    orderOut.emit('DELIVERY', payload);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected from /orderOut');
  });
});
