/**
 * Performance List component - renders all performance cards
 */

import { PerformanceCard } from './PerformanceCard.js';

export class PerformanceList {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.emptyState = document.getElementById('empty-state');
    this.loadingEl = document.getElementById('loading');
    this.cards = new Map(); // id -> PerformanceCard instance
    this.currentlyPlayingId = null;

    // Callbacks
    this.onEdit = null;
    this.onDelete = null;
    this.onToggleOver = null;
    this.onToggleCancelled = null;
    this.onDurationLoaded = null;
  }

  /**
   * Render the list of performances
   */
  render(performances, loading = false, authenticated = false) {
    // Show/hide loading
    this.loadingEl.classList.toggle('hidden', !loading);

    if (loading) {
      this.container.classList.add('hidden');
      this.emptyState.classList.add('hidden');
      return;
    }

    // Cleanup old cards
    this.cards.forEach(card => card.destroy());
    this.cards.clear();
    this.container.innerHTML = '';

    // Show empty state or list
    if (performances.length === 0) {
      this.container.classList.add('hidden');
      this.emptyState.classList.remove('hidden');
      return;
    }

    this.emptyState.classList.add('hidden');
    this.container.classList.remove('hidden');

    // Render each card
    performances.forEach((performance, index) => {
      const card = new PerformanceCard(performance, {
        position: index + 1,
        authenticated,
        onEdit: this.onEdit,
        onDelete: this.onDelete,
        onToggleOver: this.onToggleOver,
        onToggleCancelled: this.onToggleCancelled,
        onPlayStateChange: (id, isPlaying) => this.handlePlayStateChange(id, isPlaying),
        onDurationLoaded: (id, duration) => {
          if (this.onDurationLoaded) this.onDurationLoaded(id, duration);
        }
      });

      const element = card.render();
      this.container.appendChild(element);
      this.cards.set(performance.id, card);
    });
  }

  /**
   * Handle play state change - ensure only one audio plays at a time
   */
  handlePlayStateChange(id, isPlaying) {
    if (isPlaying) {
      // Stop other playing cards
      this.cards.forEach((card, cardId) => {
        if (cardId !== id) {
          card.stopPlayback();
        }
      });
      this.currentlyPlayingId = id;
    } else if (this.currentlyPlayingId === id) {
      this.currentlyPlayingId = null;
    }
  }

  /**
   * Get the currently playing card ID
   */
  getCurrentlyPlayingId() {
    return this.currentlyPlayingId;
  }

  /**
   * Stop all audio playback
   */
  stopAllPlayback() {
    this.cards.forEach(card => card.stopPlayback());
    this.currentlyPlayingId = null;
  }

  /**
   * Get playback info from the currently playing card
   */
  getCurrentPlaybackInfo() {
    if (!this.currentlyPlayingId) return null;
    const card = this.cards.get(this.currentlyPlayingId);
    return card ? card.getPlaybackInfo() : null;
  }
}
