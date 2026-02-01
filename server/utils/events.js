const EventEmitter = require('events');

class PerformanceEvents extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
  }

  addClient(res) {
    this.clients.add(res);
    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(event, data) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      client.write(message);
    }
  }

  // Event types
  performanceCreated(performance) {
    this.broadcast('performance:created', { performance });
  }

  performanceUpdated(performance) {
    this.broadcast('performance:updated', { performance });
  }

  performanceDeleted(id) {
    this.broadcast('performance:deleted', { id });
  }

  performancesReordered(performances) {
    this.broadcast('performances:reordered', { performances });
  }
}

const performanceEvents = new PerformanceEvents();

module.exports = { performanceEvents };
