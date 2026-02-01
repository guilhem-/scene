/**
 * Performance form modal component
 */

import { Modal } from './Modal.js';

export class PerformanceForm {
  constructor() {
    this.modal = new Modal('modal-overlay', { closeOnOverlayClick: false });
    this.form = document.getElementById('performance-form');
    this.titleEl = document.getElementById('modal-title');
    this.closeBtn = document.getElementById('modal-close');
    this.cancelBtn = document.getElementById('form-cancel');
    this.currentFileEl = document.getElementById('current-file');
    this.timeSection = document.getElementById('time-section');

    // Existing file section elements
    this.existingFileSection = document.getElementById('existing-file-section');
    this.existingFileName = document.getElementById('existing-file-name');
    this.changeFileBtn = document.getElementById('change-file-btn');
    this.fileInputSection = document.getElementById('file-input-section');

    // Form fields
    this.fields = {
      id: document.getElementById('form-id'),
      title: document.getElementById('form-title'),
      performerName: document.getElementById('form-performer-name'),
      performerPseudo: document.getElementById('form-performer-pseudo'),
      category: document.getElementById('form-category'),
      confirmed: document.getElementById('form-confirmed'),
      instructions: document.getElementById('form-instructions'),
      musicFile: document.getElementById('form-music-file'),
      offsetMin: document.getElementById('form-offset-min'),
      offsetSec: document.getElementById('form-offset-sec'),
      endTimeMin: document.getElementById('form-end-time-min'),
      endTimeSec: document.getElementById('form-end-time-sec'),
      fadeIn: document.getElementById('form-fade-in'),
      fadeOut: document.getElementById('form-fade-out')
    };

    this.onSubmit = null;
    this.editingPerformance = null;
    this.audioDuration = 0; // Duration in seconds
    this.hasExistingFile = false; // Track if editing performance has a file

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

    // Change file button - show file input to replace existing file
    this.changeFileBtn.addEventListener('click', () => {
      this.showFileInput();
    });

    // Validate offset inputs on change
    this.fields.offsetMin.addEventListener('change', () => this.validateOffsets());
    this.fields.offsetSec.addEventListener('change', () => this.validateOffsets());

    // Validate end time inputs on change
    this.fields.endTimeMin.addEventListener('change', () => this.validateEndTime());
    this.fields.endTimeSec.addEventListener('change', () => this.validateEndTime());
  }

  /**
   * Show existing file section and hide file input
   */
  showExistingFile(fileName) {
    this.existingFileName.textContent = fileName;
    this.existingFileSection.classList.remove('hidden');
    this.fileInputSection.classList.add('hidden');
    this.hasExistingFile = true;
  }

  /**
   * Show file input section and hide existing file
   */
  showFileInput() {
    this.existingFileSection.classList.add('hidden');
    this.fileInputSection.classList.remove('hidden');
    this.fields.musicFile.value = '';
    this.currentFileEl.textContent = '';
  }

  /**
   * Hide both file sections (for create mode with no file)
   */
  resetFileSection() {
    this.existingFileSection.classList.add('hidden');
    this.fileInputSection.classList.remove('hidden');
    this.fields.musicFile.value = '';
    this.currentFileEl.textContent = '';
    this.hasExistingFile = false;
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
      this.currentFileEl.textContent = `Sélectionné : ${file.name} (${this.formatDuration(duration)})`;
    } catch (error) {
      console.error('Error reading audio file:', error);
      this.currentFileEl.textContent = `Sélectionné : ${file.name} (durée inconnue)`;
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
    // Enable all time-related inputs
    this.fields.offsetMin.disabled = false;
    this.fields.offsetSec.disabled = false;
    this.fields.endTimeMin.disabled = false;
    this.fields.endTimeSec.disabled = false;
    this.fields.fadeIn.disabled = false;
    this.fields.fadeOut.disabled = false;
    this.timeSection.classList.remove('disabled');

    if (duration > 0) {
      const maxMinutes = Math.floor(duration / 60);
      this.fields.offsetMin.max = maxMinutes;
      this.fields.endTimeMin.max = maxMinutes;
      this.updateMaxSeconds();
    } else {
      this.fields.offsetMin.removeAttribute('max');
      this.fields.endTimeMin.removeAttribute('max');
    }
  }

  /**
   * Disable offset inputs
   */
  disableOffsets() {
    // Disable all time-related inputs
    this.fields.offsetMin.disabled = true;
    this.fields.offsetSec.disabled = true;
    this.fields.endTimeMin.disabled = true;
    this.fields.endTimeSec.disabled = true;
    this.fields.fadeIn.disabled = true;
    this.fields.fadeOut.disabled = true;
    this.timeSection.classList.add('disabled');
    this.resetOffsets();
    this.resetEndTime();
    this.resetFadeOptions();
  }

  /**
   * Reset offset values to 0
   */
  resetOffsets() {
    this.fields.offsetMin.value = '0';
    this.fields.offsetSec.value = '0';
  }

  /**
   * Reset end time values to 0
   */
  resetEndTime() {
    this.fields.endTimeMin.value = '0';
    this.fields.endTimeSec.value = '0';
  }

  /**
   * Reset fade options to default (both checked)
   */
  resetFadeOptions() {
    this.fields.fadeIn.checked = true;
    this.fields.fadeOut.checked = true;
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
    // Re-validate end time after offset changes
    this.validateEndTime();
  }

  /**
   * Validate end time is greater than start offset (if not 0)
   */
  validateEndTime() {
    const endMinutes = parseInt(this.fields.endTimeMin.value, 10) || 0;
    const endSeconds = parseInt(this.fields.endTimeSec.value, 10) || 0;
    const totalEndTime = (endMinutes * 60) + endSeconds;

    // If end time is 0, it's disabled - no validation needed
    if (totalEndTime === 0) return;

    const offsetMinutes = parseInt(this.fields.offsetMin.value, 10) || 0;
    const offsetSeconds = parseInt(this.fields.offsetSec.value, 10) || 0;
    const totalOffset = (offsetMinutes * 60) + offsetSeconds;

    // End time must be greater than start offset
    if (totalEndTime <= totalOffset) {
      // Set end time to offset + 1 second
      const minEndTime = totalOffset + 1;
      this.fields.endTimeMin.value = Math.floor(minEndTime / 60);
      this.fields.endTimeSec.value = minEndTime % 60;
    }

    // Also validate against audio duration if known
    if (this.audioDuration > 0 && totalEndTime > this.audioDuration) {
      this.fields.endTimeMin.value = Math.floor(this.audioDuration / 60);
      this.fields.endTimeSec.value = Math.floor(this.audioDuration % 60);
    }
  }

  /**
   * Show form for creating new performance
   */
  showCreate() {
    this.editingPerformance = null;
    this.titleEl.textContent = 'Ajouter une performance';
    this.resetForm();
    this.resetFileSection();
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
    this.titleEl.textContent = 'Modifier la performance';
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
    this.resetFileSection();
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
    this.fields.category.value = performance.category || 'solo';
    this.fields.confirmed.checked = performance.isConfirmed !== false;
    this.fields.instructions.value = performance.instructions || '';

    // Show existing file section if file exists
    if (performance.musicFile) {
      this.showExistingFile(performance.musicFile.originalName);
      // Enable offsets for existing file (without duration limit since we don't know it)
      this.audioDuration = 0;
      this.enableOffsets(0);
      this.fields.offsetMin.value = performance.startOffset?.minutes || 0;
      this.fields.offsetSec.value = performance.startOffset?.seconds || 0;
      this.fields.endTimeMin.value = performance.endTime?.minutes || 0;
      this.fields.endTimeSec.value = performance.endTime?.seconds || 0;
      // Fade options default to true if not set
      this.fields.fadeIn.checked = performance.fadeIn !== false;
      this.fields.fadeOut.checked = performance.fadeOut !== false;
    } else {
      this.resetFileSection();
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
    formData.append('category', this.fields.category.value);
    formData.append('isConfirmed', this.fields.confirmed.checked);
    formData.append('instructions', this.fields.instructions.value.trim());
    formData.append('startOffsetMinutes', this.fields.offsetMin.value);
    formData.append('startOffsetSeconds', this.fields.offsetSec.value);
    formData.append('endTimeMinutes', this.fields.endTimeMin.value);
    formData.append('endTimeSeconds', this.fields.endTimeSec.value);
    formData.append('fadeIn', this.fields.fadeIn.checked);
    formData.append('fadeOut', this.fields.fadeOut.checked);

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
