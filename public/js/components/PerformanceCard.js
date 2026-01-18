/**
 * Performance Card component
 */

import { AudioPlayer } from './AudioPlayer.js';
import { getMusicUrl } from '../api/performanceApi.js';

export class PerformanceCard {
  constructor(performance, options = {}) {
    this.performance = performance;
    this.options = options;
    this.position = options.position || 1;
    this.audioPlayer = null;
    this.element = null;
    this.statusEl = null;
    this.isCurrentlyPlaying = false;

    // Callbacks
    this.onEdit = options.onEdit || null;
    this.onDelete = options.onDelete || null;
    this.onToggleOver = options.onToggleOver || null;
    this.onPlayStateChange = options.onPlayStateChange || null;
    this.onDurationLoaded = options.onDurationLoaded || null;
  }

  /**
   * Create and return the card element
   */
  render() {
    const { id, title, performerName, performerPseudo, musicFile, startOffset, endTime, fadeIn, fadeOut, isOver } = this.performance;

    const card = document.createElement('div');
    card.className = `performance-card${isOver ? ' is-over' : ''}`;
    card.dataset.id = id;
    card.draggable = true;

    const offsetText = `${startOffset.minutes}:${startOffset.seconds.toString().padStart(2, '0')}`;
    const endTimeTotal = (endTime?.minutes || 0) * 60 + (endTime?.seconds || 0);
    const duration = this.performance.duration || 0;

    let timeRangeText;
    if (endTimeTotal > 0) {
      const endTimeText = `${endTime.minutes}:${endTime.seconds.toString().padStart(2, '0')}`;
      timeRangeText = `${offsetText} → ${endTimeText}`;
    } else if (duration > 0) {
      const durationMin = Math.floor(duration / 60);
      const durationSec = Math.floor(duration % 60);
      timeRangeText = `${offsetText} → ${durationMin}:${durationSec.toString().padStart(2, '0')}`;
    } else {
      timeRangeText = offsetText;
    }

    // Build fade badges (show when enabled)
    const fadeBadges = [];
    if (fadeIn !== false) fadeBadges.push('<span class="fade-badge fade-on" title="Fondu en entrée activé">Fade in</span>');
    if (fadeOut !== false) fadeBadges.push('<span class="fade-badge fade-on" title="Fondu en sortie activé">Fade out</span>');
    const fadeBadgesHtml = fadeBadges.join('');

    if (isOver) {
      // Compact view for completed performances
      card.innerHTML = `
        <div class="card-handle" title="Glisser pour réordonner">
          <span class="card-position">${this.position}</span>
          <span class="handle-icon">⋮⋮</span>
        </div>
        <div class="card-content">
          <div class="card-header card-header-compact">
            <label class="over-toggle">
              <input type="checkbox" class="over-checkbox" checked>
            </label>
            <div class="card-info">
              <span class="card-title-compact">${this.escapeHtml(title)}</span>
              <span class="card-performer-compact">
                ${this.escapeHtml(performerName)}${performerPseudo ? ` (${this.escapeHtml(performerPseudo)})` : ''}
              </span>
            </div>
            <div class="card-actions">
              <button class="btn btn-sm btn-secondary edit-btn">Modifier</button>
              <button class="btn btn-sm btn-danger delete-btn">Supprimer</button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Full view for active performances
      card.innerHTML = `
        <div class="card-handle" title="Glisser pour réordonner">
          <span class="card-position">${this.position}</span>
          <span class="handle-icon">⋮⋮</span>
        </div>
        <div class="card-content">
          <div class="card-header">
            <div class="card-info">
              <div class="card-title">${this.escapeHtml(title)}</div>
              <div class="card-performer">
                ${this.escapeHtml(performerName)}
                ${performerPseudo ? `<span class="card-pseudo">(${this.escapeHtml(performerPseudo)})</span>` : ''}
              </div>
            </div>
            <div class="card-actions">
              <button class="btn btn-sm btn-secondary edit-btn">Modifier</button>
              <button class="btn btn-sm btn-danger delete-btn">Supprimer</button>
            </div>
          </div>
          <div class="audio-slider-container hidden">
            <div class="audio-slider-row">
              <span class="slider-time slider-current">0:00</span>
              <div class="audio-slider-wrapper">
                <div class="audio-slider-track">
                  <div class="audio-slider-start-marker" style="display: none;"></div>
                  <div class="audio-slider-end-marker" style="display: none;"></div>
                  <div class="audio-slider-progress"></div>
                  <div class="audio-slider-thumb"></div>
                </div>
                <input type="range" class="audio-slider" min="0" max="100" value="0" step="0.1">
              </div>
              <span class="slider-time slider-duration">0:00</span>
            </div>
          </div>
          <div class="card-body">
            ${musicFile ? `
              <div class="audio-controls">
                <button class="btn btn-primary play-btn" title="Lecture">&#9658;</button>
                <button class="btn btn-secondary pause-btn" title="Pause" style="display: none;">&#10074;&#10074;</button>
                <button class="btn btn-secondary stop-btn" title="Arrêt">&#9632;</button>
              </div>
              <span class="audio-status">Prêt</span>
            ` : `
              <span class="no-music">Pas de fichier musical</span>
            `}
            <div class="card-meta">
              ${musicFile ? `<span class="file-badge" title="${this.escapeHtml(musicFile.originalName)}">${this.escapeHtml(this.truncateFilename(musicFile.originalName))}</span>` : ''}
              <span class="offset-badge" title="Plage de lecture audio">${timeRangeText}</span>
              ${fadeBadgesHtml}
              <label class="over-toggle">
                <input type="checkbox" class="over-checkbox">
                <span>Terminé</span>
              </label>
            </div>
          </div>
        </div>
      `;
    }

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

    // Audio controls (only for non-over performances with music)
    if (this.performance.musicFile && !this.performance.isOver) {
      this.statusEl = this.element.querySelector('.audio-status');
      this.sliderContainer = this.element.querySelector('.audio-slider-container');
      this.slider = this.element.querySelector('.audio-slider');
      this.sliderProgress = this.element.querySelector('.audio-slider-progress');
      this.sliderThumb = this.element.querySelector('.audio-slider-thumb');
      this.sliderCurrent = this.element.querySelector('.slider-current');
      this.sliderDuration = this.element.querySelector('.slider-duration');
      this.sliderStartMarker = this.element.querySelector('.audio-slider-start-marker');
      this.sliderEndMarker = this.element.querySelector('.audio-slider-end-marker');

      const playBtn = this.element.querySelector('.play-btn');
      const pauseBtn = this.element.querySelector('.pause-btn');
      const stopBtn = this.element.querySelector('.stop-btn');

      if (playBtn && pauseBtn && stopBtn) {
        playBtn.addEventListener('click', () => this.handlePlay());
        pauseBtn.addEventListener('click', () => this.handlePause());
        stopBtn.addEventListener('click', () => this.handleStop());
      }

      // Slider seek functionality
      if (this.slider) {
        this.slider.addEventListener('input', (e) => this.handleSliderChange(e));
        this.slider.addEventListener('change', (e) => this.handleSliderSeek(e));
      }
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

        this.statusEl.textContent = 'Chargement...';
        await this.audioPlayer.load(getMusicUrl(this.performance.id));

        // Report duration when loaded
        const duration = this.audioPlayer.getDuration();
        if (duration > 0 && this.onDurationLoaded) {
          this.onDurationLoaded(this.performance.id, duration);
        }
      }

      const offset = (this.performance.startOffset?.minutes || 0) * 60 +
                     (this.performance.startOffset?.seconds || 0);
      const endTime = (this.performance.endTime?.minutes || 0) * 60 +
                      (this.performance.endTime?.seconds || 0);
      const fadeOptions = {
        fadeIn: this.performance.fadeIn !== false,
        fadeOut: this.performance.fadeOut !== false
      };
      await this.audioPlayer.play(offset, endTime, fadeOptions);

      if (this.onPlayStateChange) {
        this.onPlayStateChange(this.performance.id, true);
      }
    } catch (error) {
      console.error('Play error:', error);
      this.statusEl.textContent = 'Erreur de chargement';
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
   * Get playback info for end time calculation
   */
  getPlaybackInfo() {
    if (!this.audioPlayer || !this.isCurrentlyPlaying) {
      return null;
    }

    const currentTime = this.audioPlayer.getCurrentTime();
    const endTimeSeconds = (this.performance.endTime?.minutes || 0) * 60 +
                           (this.performance.endTime?.seconds || 0);
    const duration = this.audioPlayer.getDuration();

    // Effective end is endTime if set, otherwise full duration
    const effectiveEnd = endTimeSeconds > 0 ? endTimeSeconds : duration;
    const remaining = Math.max(0, effectiveEnd - currentTime);

    return {
      id: this.performance.id,
      currentTime,
      duration,
      endTimeSeconds,
      remaining
    };
  }

  /**
   * Update audio UI based on status
   */
  updateAudioUI(status) {
    const playBtn = this.element.querySelector('.play-btn');
    const pauseBtn = this.element.querySelector('.pause-btn');

    if (status.isPlaying || status.isPaused) {
      // Show slider during playback or pause
      if (this.sliderContainer) {
        this.sliderContainer.classList.remove('hidden');
        this.setupSliderMarkers(status.duration);
        this.updateSlider(status.currentTime, status.duration);
      }
    }

    if (status.isPlaying) {
      playBtn.style.display = 'none';
      pauseBtn.style.display = '';
      this.statusEl.textContent = `Lecture ${AudioPlayer.formatTime(status.currentTime)}`;
      this.statusEl.classList.add('playing');
      this.isCurrentlyPlaying = true;

      // Update time display periodically
      this.startTimeUpdate();
    } else if (status.isPaused) {
      playBtn.style.display = '';
      pauseBtn.style.display = 'none';
      this.statusEl.textContent = `Pause ${AudioPlayer.formatTime(status.currentTime)}`;
      this.statusEl.classList.remove('playing');
      this.isCurrentlyPlaying = false;
      this.stopTimeUpdate();
    } else {
      playBtn.style.display = '';
      pauseBtn.style.display = 'none';
      this.statusEl.textContent = 'Prêt';
      this.statusEl.classList.remove('playing');
      this.isCurrentlyPlaying = false;
      this.stopTimeUpdate();

      // Hide slider when stopped
      if (this.sliderContainer) {
        this.sliderContainer.classList.add('hidden');
      }
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
        const duration = this.audioPlayer.getDuration();
        this.statusEl.textContent = `Lecture ${AudioPlayer.formatTime(time)}`;
        this.updateSlider(time, duration);
      }
    }, 100);
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
   * Setup slider markers for start offset and end time
   */
  setupSliderMarkers(duration) {
    if (!duration || duration <= 0) return;

    const startOffset = (this.performance.startOffset?.minutes || 0) * 60 +
                        (this.performance.startOffset?.seconds || 0);
    const endTime = (this.performance.endTime?.minutes || 0) * 60 +
                    (this.performance.endTime?.seconds || 0);

    // Show start marker if offset > 0
    if (this.sliderStartMarker && startOffset > 0) {
      const startPercent = (startOffset / duration) * 100;
      this.sliderStartMarker.style.display = '';
      this.sliderStartMarker.style.left = `${startPercent}%`;
      this.sliderStartMarker.title = `Début: ${AudioPlayer.formatTime(startOffset)}`;
    }

    // Show end marker if endTime is set
    if (this.sliderEndMarker && endTime > 0 && endTime < duration) {
      const endPercent = (endTime / duration) * 100;
      this.sliderEndMarker.style.display = '';
      this.sliderEndMarker.style.left = `${endPercent}%`;
      this.sliderEndMarker.title = `Fin: ${AudioPlayer.formatTime(endTime)}`;
    }
  }

  /**
   * Update slider position and display
   */
  updateSlider(currentTime, duration) {
    if (!this.slider || !duration || duration <= 0) return;

    const percent = (currentTime / duration) * 100;
    this.slider.value = percent;
    this.slider.max = 100;

    if (this.sliderProgress) {
      this.sliderProgress.style.width = `${percent}%`;
    }
    if (this.sliderThumb) {
      this.sliderThumb.style.left = `${percent}%`;
    }
    if (this.sliderCurrent) {
      this.sliderCurrent.textContent = AudioPlayer.formatTime(currentTime);
    }
    if (this.sliderDuration) {
      this.sliderDuration.textContent = AudioPlayer.formatTime(duration);
    }
  }

  /**
   * Handle slider input (while dragging)
   */
  handleSliderChange(e) {
    if (!this.audioPlayer) return;
    const duration = this.audioPlayer.getDuration();
    const newTime = (e.target.value / 100) * duration;
    if (this.sliderCurrent) {
      this.sliderCurrent.textContent = AudioPlayer.formatTime(newTime);
    }
    if (this.sliderProgress) {
      this.sliderProgress.style.width = `${e.target.value}%`;
    }
    if (this.sliderThumb) {
      this.sliderThumb.style.left = `${e.target.value}%`;
    }
  }

  /**
   * Handle slider seek (on release)
   */
  handleSliderSeek(e) {
    if (!this.audioPlayer) return;
    const duration = this.audioPlayer.getDuration();
    const newTime = (e.target.value / 100) * duration;
    this.audioPlayer.seekTo(newTime);
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
   * Truncate filename for display
   */
  truncateFilename(filename, maxLength = 20) {
    if (!filename || filename.length <= maxLength) return filename;
    const ext = filename.slice(filename.lastIndexOf('.'));
    const name = filename.slice(0, filename.lastIndexOf('.'));
    const truncatedName = name.slice(0, maxLength - ext.length - 3) + '...';
    return truncatedName + ext;
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
