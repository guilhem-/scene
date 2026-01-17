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
  }

  /**
   * Render the list of performances
   */
  render(performances, loading = false) {
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
    performances.forEach(performance => {
      const card = new PerformanceCard(performance, {
        onEdit: this.onEdit,
        onDelete: this.onDelete,
        onToggleOver: this.onToggleOver,
        onPlayStateChange: (id, isPlaying) => this.handlePlayStateChange(id, isPlaying)
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
}
