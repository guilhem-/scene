/**
 * Drag and Drop manager for reordering performance cards
 */

export class DragDropManager {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.draggedElement = null;
    this.onReorder = null;
    this.enabled = false;

    this.setupEvents();
  }

  /**
   * Enable drag and drop
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable drag and drop
   */
  disable() {
    this.enabled = false;
  }

  setupEvents() {
    this.container.addEventListener('dragstart', this.handleDragStart.bind(this));
    this.container.addEventListener('dragend', this.handleDragEnd.bind(this));
    this.container.addEventListener('dragover', this.handleDragOver.bind(this));
    this.container.addEventListener('dragenter', this.handleDragEnter.bind(this));
    this.container.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.container.addEventListener('drop', this.handleDrop.bind(this));
  }

  handleDragStart(e) {
    if (!this.enabled) {
      e.preventDefault();
      return;
    }
    const card = e.target.closest('.performance-card');
    if (!card) return;

    this.draggedElement = card;
    card.classList.add('dragging');

    // Required for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.dataset.id);

    // Delay to allow visual feedback
    setTimeout(() => {
      card.style.opacity = '0.4';
    }, 0);
  }

  handleDragEnd(e) {
    const card = e.target.closest('.performance-card');
    if (!card) return;

    card.classList.remove('dragging');
    card.style.opacity = '';

    // Remove drag-over class from all cards
    this.container.querySelectorAll('.performance-card').forEach(c => {
      c.classList.remove('drag-over');
    });

    this.draggedElement = null;
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDragEnter(e) {
    const card = e.target.closest('.performance-card');
    if (!card || card === this.draggedElement) return;

    card.classList.add('drag-over');
  }

  handleDragLeave(e) {
    const card = e.target.closest('.performance-card');
    if (!card) return;

    // Check if we're leaving to a child element
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && card.contains(relatedTarget)) return;

    card.classList.remove('drag-over');
  }

  handleDrop(e) {
    e.preventDefault();

    const card = e.target.closest('.performance-card');
    if (!card || card === this.draggedElement || !this.draggedElement) return;

    card.classList.remove('drag-over');

    // Get all cards and determine new order
    const cards = Array.from(this.container.querySelectorAll('.performance-card'));
    const draggedIndex = cards.indexOf(this.draggedElement);
    const dropIndex = cards.indexOf(card);

    // Reorder in DOM
    if (draggedIndex < dropIndex) {
      card.parentNode.insertBefore(this.draggedElement, card.nextSibling);
    } else {
      card.parentNode.insertBefore(this.draggedElement, card);
    }

    // Get new order of IDs
    const newOrder = Array.from(this.container.querySelectorAll('.performance-card'))
      .map(c => c.dataset.id);

    // Notify callback
    if (this.onReorder) {
      this.onReorder(newOrder);
    }
  }
}
