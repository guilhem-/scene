const express = require('express');
const { performanceEvents } = require('../utils/events');

const router = express.Router();

/**
 * GET /api/events
 * Server-Sent Events endpoint for real-time updates
 */
router.get('/', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection event
  res.write('event: connected\ndata: {}\n\n');

  // Register this client
  performanceEvents.addClient(res);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write('event: heartbeat\ndata: {}\n\n');
  }, 30000);

  // Clean up on close
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

module.exports = router;
