/**
 * Modal component for forms and confirmations
 */

export class Modal {
  constructor(overlayId) {
    this.overlay = document.getElementById(overlayId);
    this.onClose = null;

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
        this.hide();
      }
    });
  }

  show() {
    this.overlay.classList.remove('hidden');
  }

  hide() {
    this.overlay.classList.add('hidden');
    if (this.onClose) {
      this.onClose();
    }
  }
}

/**
 * Confirmation modal
 */
export class ConfirmModal extends Modal {
  constructor() {
    super('confirm-overlay');

    this.messageEl = document.getElementById('confirm-message');
    this.cancelBtn = document.getElementById('confirm-cancel');
    this.okBtn = document.getElementById('confirm-ok');

    this.resolvePromise = null;

    this.cancelBtn.addEventListener('click', () => {
      this.hide();
      if (this.resolvePromise) this.resolvePromise(false);
    });

    this.okBtn.addEventListener('click', () => {
      this.hide();
      if (this.resolvePromise) this.resolvePromise(true);
    });
  }

  confirm(message) {
    this.messageEl.textContent = message;
    this.show();

    return new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }
}
