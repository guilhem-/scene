/**
 * Performance form modal component
 */

import { Modal } from './Modal.js';

export class PerformanceForm {
  constructor() {
    this.modal = new Modal('modal-overlay');
    this.form = document.getElementById('performance-form');
    this.titleEl = document.getElementById('modal-title');
    this.closeBtn = document.getElementById('modal-close');
    this.cancelBtn = document.getElementById('form-cancel');
    this.currentFileEl = document.getElementById('current-file');
    this.offsetSection = document.getElementById('offset-section');

    // Form fields
    this.fields = {
      id: document.getElementById('form-id'),
      title: document.getElementById('form-title'),
      performerName: document.getElementById('form-performer-name'),
      performerPseudo: document.getElementById('form-performer-pseudo'),
      musicFile: document.getElementById('form-music-file'),
      offsetMin: document.getElementById('form-offset-min'),
      offsetSec: document.getElementById('form-offset-sec')
    };

    this.onSubmit = null;
    this.editingPerformance = null;
    this.audioDuration = 0; // Duration in seconds

    this.setupEvents();
  }

  setupEvents() {
    this.closeBtn.addEventListener('click', () => this.hide());
    this.cancelBtn.addEventListener('click', () => this.hide());

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Listen for file changes
    this.fields.musicFile.addEventListener('change', (e) => {
      this.handleFileChange(e);
    });

    // Validate offset inputs on change
    this.fields.offsetMin.addEventListener('change', () => this.validateOffsets());
    this.fields.offsetSec.addEventListener('change', () => this.validateOffsets());
  }

  /**
   * Handle file input change - detect duration and enable offsets
   */
  async handleFileChange(e) {
    const file = e.target.files[0];

    if (!file) {
      this.disableOffsets();
      return;
    }

    // Reset offsets when file changes
    this.resetOffsets();

    try {
      const duration = await this.getAudioDuration(file);
      this.audioDuration = duration;
      this.enableOffsets(duration);
      this.currentFileEl.textContent = `Selected: ${file.name} (${this.formatDuration(duration)})`;
    } catch (error) {
      console.error('Error reading audio file:', error);
      this.currentFileEl.textContent = `Selected: ${file.name} (duration unknown)`;
      // Still enable offsets but without max limit
      this.audioDuration = 0;
      this.enableOffsets(0);
    }
  }

  /**
   * Get audio file duration using HTML5 Audio
   */
  getAudioDuration(file) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(Math.floor(audio.duration));
      });

      audio.addEventListener('error', (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      });

      audio.src = url;
    });
  }

  /**
   * Format duration in seconds to mm:ss
   */
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Enable offset inputs and set max values based on duration
   */
  enableOffsets(duration) {
    this.fields.offsetMin.disabled = false;
    this.fields.offsetSec.disabled = false;
    this.offsetSection.classList.remove('disabled');

    if (duration > 0) {
      const maxMinutes = Math.floor(duration / 60);
      this.fields.offsetMin.max = maxMinutes;
      // Max seconds depends on current minutes value
      this.updateMaxSeconds();
    } else {
      // No duration limit
      this.fields.offsetMin.removeAttribute('max');
    }
  }

  /**
   * Disable offset inputs
   */
  disableOffsets() {
    this.fields.offsetMin.disabled = true;
    this.fields.offsetSec.disabled = true;
    this.offsetSection.classList.add('disabled');
    this.resetOffsets();
  }

  /**
   * Reset offset values to 0
   */
  resetOffsets() {
    this.fields.offsetMin.value = '0';
    this.fields.offsetSec.value = '0';
  }

  /**
   * Update max seconds based on current minutes value
   */
  updateMaxSeconds() {
    if (this.audioDuration <= 0) return;

    const currentMinutes = parseInt(this.fields.offsetMin.value, 10) || 0;
    const maxMinutes = Math.floor(this.audioDuration / 60);

    if (currentMinutes >= maxMinutes) {
      // At max minutes, limit seconds to remaining
      const remainingSeconds = this.audioDuration - (maxMinutes * 60);
      this.fields.offsetSec.max = Math.min(59, remainingSeconds);
    } else {
      this.fields.offsetSec.max = 59;
    }
  }

  /**
   * Validate offset values don't exceed duration
   */
  validateOffsets() {
    if (this.audioDuration <= 0) return;

    const minutes = parseInt(this.fields.offsetMin.value, 10) || 0;
    const seconds = parseInt(this.fields.offsetSec.value, 10) || 0;
    const totalOffset = (minutes * 60) + seconds;

    if (totalOffset >= this.audioDuration) {
      // Clamp to max duration - 1 second
      const maxOffset = this.audioDuration - 1;
      this.fields.offsetMin.value = Math.floor(maxOffset / 60);
      this.fields.offsetSec.value = maxOffset % 60;
    }

    this.updateMaxSeconds();
  }

  /**
   * Show form for creating new performance
   */
  showCreate() {
    this.editingPerformance = null;
    this.titleEl.textContent = 'Add Performance';
    this.resetForm();
    this.currentFileEl.textContent = '';
    this.audioDuration = 0;
    this.disableOffsets();
    this.modal.show();
    this.fields.title.focus();
  }

  /**
   * Show form for editing existing performance
   */
  showEdit(performance) {
    this.editingPerformance = performance;
    this.titleEl.textContent = 'Edit Performance';
    this.populateForm(performance);
    this.modal.show();
    this.fields.title.focus();
  }

  /**
   * Hide the form
   */
  hide() {
    this.modal.hide();
    this.resetForm();
  }

  /**
   * Reset form to empty state
   */
  resetForm() {
    this.form.reset();
    this.fields.id.value = '';
    this.resetOffsets();
    this.currentFileEl.textContent = '';
    this.audioDuration = 0;
    this.disableOffsets();
  }

  /**
   * Populate form with performance data
   */
  populateForm(performance) {
    this.fields.id.value = performance.id;
    this.fields.title.value = performance.title;
    this.fields.performerName.value = performance.performerName;
    this.fields.performerPseudo.value = performance.performerPseudo || '';

    // Show current file name if exists and enable offsets
    if (performance.musicFile) {
      this.currentFileEl.textContent = `Current: ${performance.musicFile.originalName}`;
      // Enable offsets for existing file (without duration limit since we don't know it)
      this.audioDuration = 0;
      this.enableOffsets(0);
      this.fields.offsetMin.value = performance.startOffset?.minutes || 0;
      this.fields.offsetSec.value = performance.startOffset?.seconds || 0;
    } else {
      this.currentFileEl.textContent = '';
      this.disableOffsets();
    }
  }

  /**
   * Handle form submission
   */
  handleSubmit() {
    const formData = new FormData();

    formData.append('title', this.fields.title.value.trim());
    formData.append('performerName', this.fields.performerName.value.trim());
    formData.append('performerPseudo', this.fields.performerPseudo.value.trim());
    formData.append('startOffsetMinutes', this.fields.offsetMin.value);
    formData.append('startOffsetSeconds', this.fields.offsetSec.value);

    // Add file if selected
    if (this.fields.musicFile.files.length > 0) {
      formData.append('musicFile', this.fields.musicFile.files[0]);
    }

    if (this.onSubmit) {
      const id = this.editingPerformance?.id;
      this.onSubmit(formData, id);
    }

    this.hide();
  }
}
