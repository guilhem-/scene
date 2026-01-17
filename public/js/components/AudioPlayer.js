/**
 * Audio Player with Web Audio API for fade effects
 */

export class AudioPlayer {
  constructor() {
    this.audioContext = null;
    this.gainNode = null;
    this.sourceNode = null;
    this.audioBuffer = null;
    this.audioElement = null;

    this.isPlaying = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.startOffset = 0;

    this.fadeInDuration = 1.0; // seconds
    this.fadeOutDuration = 0.5; // seconds

    this.onStatusChange = null;
  }

  /**
   * Initialize AudioContext (must be called after user interaction)
   */
  initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Load audio from URL
   */
  async load(url) {
    this.initContext();

    // Stop any currently playing audio
    this.stop(true);

    // Use HTML Audio element for streaming (better for large files)
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.src = url;

    // Create MediaElementSource
    this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
    this.gainNode = this.audioContext.createGain();

    // Connect nodes: source -> gain -> destination
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Wait for audio to be ready
    return new Promise((resolve, reject) => {
      this.audioElement.addEventListener('canplaythrough', () => resolve(), { once: true });
      this.audioElement.addEventListener('error', (e) => reject(new Error('Failed to load audio')), { once: true });
      this.audioElement.load();
    });
  }

  /**
   * Play audio with fade in
   */
  async play(offsetSeconds = 0) {
    if (!this.audioElement) return;

    this.initContext();

    if (this.isPaused) {
      // Resume from pause position
      this.audioElement.play();
      this.fadeIn();
      this.isPaused = false;
      this.isPlaying = true;
    } else {
      // Start from offset
      this.startOffset = offsetSeconds;
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

      // Set currentTime and wait for seek to complete
      if (offsetSeconds > 0) {
        await this.seekTo(offsetSeconds);
      }

      await this.audioElement.play();
      this.fadeIn();
      this.isPlaying = true;
    }

    this.notifyStatus();
  }

  /**
   * Seek to specific time and wait for completion
   */
  seekTo(timeSeconds) {
    return new Promise((resolve) => {
      const onSeeked = () => {
        this.audioElement.removeEventListener('seeked', onSeeked);
        resolve();
      };
      this.audioElement.addEventListener('seeked', onSeeked);
      this.audioElement.currentTime = timeSeconds;
    });
  }

  /**
   * Pause with fade out
   */
  async pause() {
    if (!this.isPlaying || !this.audioElement) return;

    await this.fadeOut();
    this.audioElement.pause();
    this.isPaused = true;
    this.isPlaying = false;
    this.notifyStatus();
  }

  /**
   * Stop with fade out
   */
  async stop(immediate = false) {
    if (!this.audioElement) return;

    if (!immediate && this.isPlaying) {
      await this.fadeOut();
    }

    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = false;

    // Reset gain
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    }

    this.notifyStatus();
  }

  /**
   * Fade in effect
   */
  fadeIn() {
    if (!this.gainNode || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(1, now + this.fadeInDuration);
  }

  /**
   * Fade out effect
   */
  fadeOut() {
    return new Promise((resolve) => {
      if (!this.gainNode || !this.audioContext) {
        resolve();
        return;
      }

      const now = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(0, now + this.fadeOutDuration);

      setTimeout(resolve, this.fadeOutDuration * 1000);
    });
  }

  /**
   * Get current playback time
   */
  getCurrentTime() {
    if (!this.audioElement) return 0;
    return this.audioElement.currentTime;
  }

  /**
   * Get duration
   */
  getDuration() {
    if (!this.audioElement) return 0;
    return this.audioElement.duration || 0;
  }

  /**
   * Notify status change
   */
  notifyStatus() {
    if (this.onStatusChange) {
      this.onStatusChange({
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        currentTime: this.getCurrentTime(),
        duration: this.getDuration()
      });
    }
  }

  /**
   * Format time as mm:ss
   */
  static formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop(true);
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioElement = null;
    this.sourceNode = null;
    this.gainNode = null;
  }
}
