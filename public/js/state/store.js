/**
 * Simple state management store
 */

class Store {
  constructor() {
    this.state = {
      performances: [],
      loading: true,
      error: null,
      currentlyPlaying: null // ID of currently playing performance
    };
    this.listeners = [];
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update state and notify listeners
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Set performances list
   */
  setPerformances(performances) {
    this.setState({ performances, loading: false, error: null });
  }

  /**
   * Add a performance
   */
  addPerformance(performance) {
    this.setState({
      performances: [...this.state.performances, performance]
    });
  }

  /**
   * Update a performance
   */
  updatePerformance(id, updates) {
    this.setState({
      performances: this.state.performances.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    });
  }

  /**
   * Remove a performance
   */
  removePerformance(id) {
    this.setState({
      performances: this.state.performances.filter(p => p.id !== id),
      currentlyPlaying: this.state.currentlyPlaying === id ? null : this.state.currentlyPlaying
    });
  }

  /**
   * Reorder performances
   */
  reorderPerformances(performances) {
    this.setState({ performances });
  }

  /**
   * Set currently playing
   */
  setCurrentlyPlaying(id) {
    this.setState({ currentlyPlaying: id });
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.setState({ loading });
  }

  /**
   * Set error
   */
  setError(error) {
    this.setState({ error, loading: false });
  }
}

// Singleton instance
export const store = new Store();
