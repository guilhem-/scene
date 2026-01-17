/**
 * Scene - Performance Manager
 * Main application bootstrap
 */

import { store } from './state/store.js';
import {
  getPerformances,
  createPerformance,
  updatePerformance,
  deletePerformance,
  reorderPerformances
} from './api/performanceApi.js';
import { PerformanceList } from './components/PerformanceList.js';
import { PerformanceForm } from './components/PerformanceForm.js';
import { DragDropManager } from './components/DragDropManager.js';
import { ConfirmModal } from './components/Modal.js';

class App {
  constructor() {
    this.performanceList = null;
    this.performanceForm = null;
    this.dragDropManager = null;
    this.confirmModal = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    // Initialize components
    this.performanceList = new PerformanceList('#performance-list');
    this.performanceForm = new PerformanceForm();
    this.dragDropManager = new DragDropManager('#performance-list');
    this.confirmModal = new ConfirmModal();

    // Setup callbacks
    this.setupCallbacks();

    // Subscribe to store changes
    store.subscribe((state) => {
      this.performanceList.render(state.performances, state.loading);
    });

    // Setup UI events
    this.setupUIEvents();

    // Load initial data
    await this.loadPerformances();
  }

  /**
   * Setup component callbacks
   */
  setupCallbacks() {
    // Performance list callbacks
    this.performanceList.onEdit = (performance) => {
      this.performanceForm.showEdit(performance);
    };

    this.performanceList.onDelete = async (performance) => {
      const confirmed = await this.confirmModal.confirm(
        `Delete "${performance.title}"? This action cannot be undone.`
      );

      if (confirmed) {
        await this.handleDelete(performance.id);
      }
    };

    this.performanceList.onToggleOver = async (performance, isOver) => {
      await this.handleToggleOver(performance.id, isOver);
    };

    // Form submit callback
    this.performanceForm.onSubmit = async (formData, id) => {
      if (id) {
        await this.handleUpdate(id, formData);
      } else {
        await this.handleCreate(formData);
      }
    };

    // Drag drop callback
    this.dragDropManager.onReorder = async (newOrder) => {
      await this.handleReorder(newOrder);
    };
  }

  /**
   * Setup UI event listeners
   */
  setupUIEvents() {
    const addBtn = document.getElementById('add-performance-btn');
    addBtn.addEventListener('click', () => {
      this.performanceForm.showCreate();
    });
  }

  /**
   * Load performances from API
   */
  async loadPerformances() {
    try {
      store.setLoading(true);
      const performances = await getPerformances();
      store.setPerformances(performances);
    } catch (error) {
      console.error('Failed to load performances:', error);
      store.setError(error.message);
    }
  }

  /**
   * Handle create performance
   */
  async handleCreate(formData) {
    try {
      const performance = await createPerformance(formData);
      store.addPerformance(performance);
    } catch (error) {
      console.error('Failed to create performance:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Handle update performance
   */
  async handleUpdate(id, formData) {
    try {
      const performance = await updatePerformance(id, formData);
      store.updatePerformance(id, performance);

      // Reload to reflect changes (especially if music file changed)
      await this.loadPerformances();
    } catch (error) {
      console.error('Failed to update performance:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Handle delete performance
   */
  async handleDelete(id) {
    try {
      await deletePerformance(id);
      store.removePerformance(id);
    } catch (error) {
      console.error('Failed to delete performance:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Handle toggle over state
   */
  async handleToggleOver(id, isOver) {
    try {
      const formData = new FormData();
      formData.append('isOver', isOver);
      const performance = await updatePerformance(id, formData);
      store.updatePerformance(id, performance);
    } catch (error) {
      console.error('Failed to toggle over state:', error);
      // Reload to restore correct state
      await this.loadPerformances();
    }
  }

  /**
   * Handle reorder performances
   */
  async handleReorder(newOrder) {
    try {
      const performances = await reorderPerformances(newOrder);
      store.reorderPerformances(performances);
    } catch (error) {
      console.error('Failed to reorder performances:', error);
      // Reload to restore correct order
      await this.loadPerformances();
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
