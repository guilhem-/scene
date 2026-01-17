/**
 * Performance Card component
 */

import { AudioPlayer } from './AudioPlayer.js';
import { getMusicUrl } from '../api/performanceApi.js';

export class PerformanceCard {
  constructor(performance, options = {}) {
    this.performance = performance;
    this.options = options;
    this.audioPlayer = null;
    this.element = null;
    this.statusEl = null;
    this.isCurrentlyPlaying = false;

    // Callbacks
    this.onEdit = options.onEdit || null;
    this.onDelete = options.onDelete || null;
    this.onToggleOver = options.onToggleOver || null;
    this.onPlayStateChange = options.onPlayStateChange || null;
  }

  /**
   * Create and return the card element
   */
  render() {
    const { id, title, performerName, performerPseudo, musicFile, startOffset, isOver } = this.performance;

    const card = document.createElement('div');
    card.className = `performance-card${isOver ? ' is-over' : ''}`;
    card.dataset.id = id;
    card.draggable = true;

    const offsetText = `${startOffset.minutes}:${startOffset.seconds.toString().padStart(2, '0')}`;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-info">
          <div class="card-title">${this.escapeHtml(title)}</div>
          <div class="card-performer">
            ${this.escapeHtml(performerName)}
            ${performerPseudo ? `<span class="card-pseudo">(${this.escapeHtml(performerPseudo)})</span>` : ''}
          </div>
        </div>
        <div class="card-actions">
          <button class="btn btn-sm btn-secondary edit-btn">Edit</button>
          <button class="btn btn-sm btn-danger delete-btn">Delete</button>
        </div>
      </div>
      <div class="card-body">
        ${musicFile ? `
          <div class="audio-controls">
            <button class="btn btn-primary play-btn" title="Play">&#9658;</button>
            <button class="btn btn-secondary pause-btn" title="Pause" style="display: none;">&#10074;&#10074;</button>
            <button class="btn btn-secondary stop-btn" title="Stop">&#9632;</button>
          </div>
          <span class="audio-status">Ready</span>
        ` : `
          <span class="no-music">No music file</span>
        `}
        <div class="card-meta">
          <span class="offset-badge">Start: ${offsetText}</span>
          <label class="over-toggle">
            <input type="checkbox" class="over-checkbox" ${isOver ? 'checked' : ''}>
            <span>Over</span>
          </label>
        </div>
      </div>
    `;

    this.element = card;
    this.setupEvents();

    return card;
  }

  /**
   * Setup event listeners
   */
  setupEvents() {
    const editBtn = this.element.querySelector('.edit-btn');
    const deleteBtn = this.element.querySelector('.delete-btn');
    const overCheckbox = this.element.querySelector('.over-checkbox');

    editBtn.addEventListener('click', () => {
      if (this.onEdit) this.onEdit(this.performance);
    });

    deleteBtn.addEventListener('click', () => {
      if (this.onDelete) this.onDelete(this.performance);
    });

    overCheckbox.addEventListener('change', (e) => {
      if (this.onToggleOver) {
        this.onToggleOver(this.performance, e.target.checked);
      }
    });

    // Audio controls
    if (this.performance.musicFile) {
      this.statusEl = this.element.querySelector('.audio-status');
      const playBtn = this.element.querySelector('.play-btn');
      const pauseBtn = this.element.querySelector('.pause-btn');
      const stopBtn = this.element.querySelector('.stop-btn');

      playBtn.addEventListener('click', () => this.handlePlay());
      pauseBtn.addEventListener('click', () => this.handlePause());
      stopBtn.addEventListener('click', () => this.handleStop());
    }
  }

  /**
   * Handle play button click
   */
  async handlePlay() {
    try {
      if (!this.audioPlayer) {
        this.audioPlayer = new AudioPlayer();
        this.audioPlayer.onStatusChange = (status) => this.updateAudioUI(status);

        this.statusEl.textContent = 'Loading...';
        await this.audioPlayer.load(getMusicUrl(this.performance.id));
      }

      const offset = this.performance.startOffset.minutes * 60 + this.performance.startOffset.seconds;
      this.audioPlayer.play(offset);

      if (this.onPlayStateChange) {
        this.onPlayStateChange(this.performance.id, true);
      }
    } catch (error) {
      console.error('Play error:', error);
      this.statusEl.textContent = 'Error loading';
    }
  }

  /**
   * Handle pause button click
   */
  async handlePause() {
    if (this.audioPlayer) {
      await this.audioPlayer.pause();
    }
  }

  /**
   * Handle stop button click
   */
  async handleStop() {
    if (this.audioPlayer) {
      await this.audioPlayer.stop();
      if (this.onPlayStateChange) {
        this.onPlayStateChange(this.performance.id, false);
      }
    }
  }

  /**
   * Stop playback (called externally when another card starts playing)
   */
  async stopPlayback() {
    if (this.audioPlayer && this.audioPlayer.isPlaying) {
      await this.audioPlayer.stop();
    }
  }

  /**
   * Update audio UI based on status
   */
  updateAudioUI(status) {
    const playBtn = this.element.querySelector('.play-btn');
    const pauseBtn = this.element.querySelector('.pause-btn');

    if (status.isPlaying) {
      playBtn.style.display = 'none';
      pauseBtn.style.display = '';
      this.statusEl.textContent = `Playing ${AudioPlayer.formatTime(status.currentTime)}`;
      this.statusEl.classList.add('playing');
      this.isCurrentlyPlaying = true;

      // Update time display periodically
      this.startTimeUpdate();
    } else if (status.isPaused) {
      playBtn.style.display = '';
      pauseBtn.style.display = 'none';
      this.statusEl.textContent = `Paused ${AudioPlayer.formatTime(status.currentTime)}`;
      this.statusEl.classList.remove('playing');
      this.isCurrentlyPlaying = false;
      this.stopTimeUpdate();
    } else {
      playBtn.style.display = '';
      pauseBtn.style.display = 'none';
      this.statusEl.textContent = 'Ready';
      this.statusEl.classList.remove('playing');
      this.isCurrentlyPlaying = false;
      this.stopTimeUpdate();
    }
  }

  /**
   * Start updating time display
   */
  startTimeUpdate() {
    this.stopTimeUpdate();
    this.timeUpdateInterval = setInterval(() => {
      if (this.audioPlayer && this.audioPlayer.isPlaying) {
        const time = this.audioPlayer.getCurrentTime();
        this.statusEl.textContent = `Playing ${AudioPlayer.formatTime(time)}`;
      }
    }, 500);
  }

  /**
   * Stop updating time display
   */
  stopTimeUpdate() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopTimeUpdate();
    if (this.audioPlayer) {
      this.audioPlayer.destroy();
      this.audioPlayer = null;
    }
  }
}
