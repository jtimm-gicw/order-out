'use strict';

const { Server } = require('socket.io');
const Chance = require('chance');

const chance = new Chance();
const io = new Server(3001); // Server listening on port 3001

// Create a namespace for the order system
const orderOut = io.of('/orderOut');

// Handle connections to the namespace
orderOut.on('connection', (socket) => {
  console.log('✅ Client connected to /orderOut namespace:', socket.id);

  /**
   * SUBSCRIBE
   * Clients (vendors or drivers) can join a specific queue.
   * Vendors join their store queue, drivers join 'drivers'.
   */
  socket.on('SUBSCRIBE', ({ queueId }) => {
    socket.join(queueId);
    console.log(`📥 Client ${socket.id} joined queue: ${queueId}`);
  });

  /**
   * PICKUP
   * Vendors emit this when a new order is ready.
   * The hub sends the order to all subscribed drivers.
   */
  socket.on('PICKUP', (orderData) => {
    console.log(`📦 New order received from vendor ${orderData.store}:`, orderData);

    // Emit the order only to drivers subscribed to the 'drivers' queue
    orderOut.to('drivers').emit('PICKUP', orderData);
  });

  /**
   * IN-TRANSIT
   * Drivers emit this when they pick up a package.
   * Hub broadcasts to all clients so the vendors can see the status.
   */
  socket.on('IN-TRANSIT', (payload) => {
    console.log(`🚚 Order ${payload.orderId} is in transit by ${payload.driverName}`);
    orderOut.emit('IN-TRANSIT', payload);
  });

  /**
   * DELIVERY
   * Drivers emit this when they complete delivery.
   * Hub broadcasts to all clients so the vendors and customers see delivery.
   */
  socket.on('DELIVERY', (payload) => {
    console.log(`✅ Order ${payload.orderId} delivered by ${payload.driverName}`);
    orderOut.emit('DELIVERY', payload);
  });

  /**
   * DISCONNECT
   * Log when a client disconnects
   */
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected from /orderOut:', socket.id);
  });
});

console.log('🚀 Hub server running on port 3001, namespace /orderOut');
