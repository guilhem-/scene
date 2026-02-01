/**
 * EventService - Handles Server-Sent Events for real-time updates
 */
class EventService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
  }

  /**
   * Connect to the SSE endpoint
   */
  connect() {
    if (this.eventSource) {
      return;
    }

    this.eventSource = new EventSource('/api/events');

    this.eventSource.addEventListener('connected', () => {
      console.log('EventService: Connected to server');
      this.reconnectAttempts = 0;
    });

    this.eventSource.addEventListener('heartbeat', () => {
      // Keep-alive received
    });

    // Performance events
    this.eventSource.addEventListener('performance:created', (e) => {
      this.emit('performance:created', JSON.parse(e.data));
    });

    this.eventSource.addEventListener('performance:updated', (e) => {
      this.emit('performance:updated', JSON.parse(e.data));
    });

    this.eventSource.addEventListener('performance:deleted', (e) => {
      this.emit('performance:deleted', JSON.parse(e.data));
    });

    this.eventSource.addEventListener('performances:reordered', (e) => {
      this.emit('performances:reordered', JSON.parse(e.data));
    });

    this.eventSource.onerror = () => {
      console.log('EventService: Connection error, attempting reconnect...');
      this.eventSource.close();
      this.eventSource = null;
      this.scheduleReconnect();
    };
  }

  /**
   * Schedule a reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('EventService: Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);

    setTimeout(() => {
      console.log(`EventService: Reconnect attempt ${this.reconnectAttempts}`);
      this.connect();
    }, delay);
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit an event to all listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventService: Error in listener for ${event}:`, error);
        }
      }
    }
  }
}

// Export singleton instance
export const eventService = new EventService();
