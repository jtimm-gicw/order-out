'use strict';

require('dotenv').config();
const { Server } = require('socket.io');
const Chance = require('chance');
const Queue = require('./lib/queue');  // Your queue implementation

const PORT = process.env.PORT || 3001;  // Default port or from .env
const io = new Server(PORT);

const orderOut = io.of('/orderOut');   // Create namespace for orderOut

const orderQueue = new Queue();         // Master queue store for all vendors/drivers
const subscriptions = {};              // Track subscribers per queueId (store or driver)

// Helper function to emit events to all subscribers of a queueId
function emitToSubscribers(queueId, event, payload) {
  const subs = subscriptions[queueId];
  if (!subs) return; // No subscribers for this queue yet

  subs.forEach(socketId => {
    const clientSocket = orderOut.sockets.get(socketId);
    if (clientSocket) {
      clientSocket.emit(event, payload);
    }
  });
}

orderOut.on('connection', (socket) => {
  console.log(`🔌 Client connected to /orderOut namespace: ${socket.id}`);

  // Log every event received, for debugging
  socket.onAny((event, payload) => {
    console.log(`📥 Event: ${event}`, payload);
  });

  // Handle subscriptions from clients (vendors or drivers)
  socket.on('SUBSCRIBE', ({ queueId }) => {
    if (!subscriptions[queueId]) {
      subscriptions[queueId] = new Set();
    }
    subscriptions[queueId].add(socket.id);
    console.log(`📝 Socket ${socket.id} subscribed to queue ${queueId}`);
  });

  // Handle new package ready for pickup
  socket.on('PICKUP', (payload) => {
    // Store the payload in the driver's queue
    let driverQueue = orderQueue.read('drivers');
    if (!driverQueue) {
      orderQueue.store('drivers', new Queue());
      driverQueue = orderQueue.read('drivers');
    }
    driverQueue.store(payload.messageId, payload);

    // Notify all subscribed drivers
    emitToSubscribers('drivers', 'PICKUP', payload);
  });

  // Handle package in transit event
  socket.on('IN-TRANSIT', (payload) => {
    emitToSubscribers(payload.store, 'IN-TRANSIT', payload);
  });

  // Handle package delivered event
  socket.on('DELIVERY', (payload) => {
    // Store delivery info in vendor's queue
    let vendorQueue = orderQueue.read(payload.store);
    if (!vendorQueue) {
      orderQueue.store(payload.store, new Queue());
      vendorQueue = orderQueue.read(payload.store);
    }
    vendorQueue.store(payload.messageId, payload);

    // Notify all subscribers for the vendor
    emitToSubscribers(payload.store, 'DELIVERY', payload);
  });

  // Confirm a message was received and remove it from queue
  socket.on('RECEIVED', (payload) => {
    const currentQueue = orderQueue.read(payload.queueId);
    if (!currentQueue) {
      console.error(`⚠️ No queue found for queueId: ${payload.queueId}`);
      return;
    }
    currentQueue.remove(payload.messageId);
    console.log(`✅ Removed message ${payload.messageId} from queue ${payload.queueId}`);
  });

  // Client requests all undelivered messages in their queue
  socket.on('GET-ALL', (payload) => {
    const currentQueue = orderQueue.read(payload.queueId);
    if (currentQueue && currentQueue.data) {
      Object.values(currentQueue.data).forEach(message => {
        socket.emit(message.event, message);
      });
    }
  });

  // Cleanup subscriptions when client disconnects
  socket.on('disconnect', () => {
    Object.entries(subscriptions).forEach(([queueId, subs]) => {
      subs.delete(socket.id);
      if (subs.size === 0) {
        delete subscriptions[queueId];
      }
    });
    console.log(`❌ Socket ${socket.id} disconnected and unsubscribed.`);
  });
});

console.log(`🚀 Server listening on port ${PORT}`);
