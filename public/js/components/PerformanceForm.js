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

    this.setupEvents();
  }

  setupEvents() {
    this.closeBtn.addEventListener('click', () => this.hide());
    this.cancelBtn.addEventListener('click', () => this.hide());

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  /**
   * Show form for creating new performance
   */
  showCreate() {
    this.editingPerformance = null;
    this.titleEl.textContent = 'Add Performance';
    this.resetForm();
    this.currentFileEl.textContent = '';
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
    this.fields.offsetMin.value = '0';
    this.fields.offsetSec.value = '0';
    this.currentFileEl.textContent = '';
  }

  /**
   * Populate form with performance data
   */
  populateForm(performance) {
    this.fields.id.value = performance.id;
    this.fields.title.value = performance.title;
    this.fields.performerName.value = performance.performerName;
    this.fields.performerPseudo.value = performance.performerPseudo || '';
    this.fields.offsetMin.value = performance.startOffset?.minutes || 0;
    this.fields.offsetSec.value = performance.startOffset?.seconds || 0;

    // Show current file name if exists
    if (performance.musicFile) {
      this.currentFileEl.textContent = `Current: ${performance.musicFile.originalName}`;
    } else {
      this.currentFileEl.textContent = '';
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
