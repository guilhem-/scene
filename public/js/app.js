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
import { isAuthenticated, login, logout, verifySession } from './auth/authManager.js';

class App {
  constructor() {
    this.performanceList = null;
    this.performanceForm = null;
    this.dragDropManager = null;
    this.confirmModal = null;

    // History modal elements
    this.historyOverlay = null;
    this.historyContent = null;
    this.historyText = null;
    this.historyEmpty = null;
    this.historyCopyBtn = null;

    // End time badge
    this.endTimeBadge = null;
    this.endTimeInterval = null;

    // Auth elements
    this.loginBtn = null;
    this.logoutBtn = null;
    this.loginOverlay = null;
    this.loginForm = null;
    this.loginError = null;
    this.addBtn = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    // Initialize theme
    this.initTheme();

    // Initialize components
    this.performanceList = new PerformanceList('#performance-list');
    this.performanceForm = new PerformanceForm();
    this.dragDropManager = new DragDropManager('#performance-list');
    this.confirmModal = new ConfirmModal();

    // Setup callbacks
    this.setupCallbacks();

    // Subscribe to store changes
    store.subscribe((state) => {
      this.performanceList.render(state.performances, state.loading, isAuthenticated());
    });

    // Setup UI events
    this.setupUIEvents();

    // Setup auth events
    this.setupAuthEvents();

    // Setup end time badge update
    this.setupEndTimeBadge();

    // Check auth status and update UI
    await this.checkAuthStatus();

    // Load initial data
    await this.loadPerformances();
  }

  /**
   * Initialize theme from localStorage
   */
  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggle = document.getElementById('theme-toggle');

    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (toggle) toggle.checked = true;
    }
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(isDark) {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
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
        `Supprimer "${performance.title}" ? Cette action est irréversible.`
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

    // Duration loaded callback
    this.performanceList.onDurationLoaded = async (id, duration) => {
      await this.handleDurationLoaded(id, duration);
    };
  }

  /**
   * Setup authentication event listeners
   */
  setupAuthEvents() {
    this.loginBtn = document.getElementById('login-btn');
    this.logoutBtn = document.getElementById('logout-btn');
    this.loginOverlay = document.getElementById('login-overlay');
    this.loginForm = document.getElementById('login-form');
    this.loginError = document.getElementById('login-error');
    this.addBtn = document.getElementById('add-performance-btn');

    // Login button
    this.loginBtn.addEventListener('click', () => this.showLoginModal());

    // Logout button
    this.logoutBtn.addEventListener('click', () => this.handleLogout());

    // Login form
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

    // Login modal close
    const loginClose = document.getElementById('login-close');
    const loginCancel = document.getElementById('login-cancel');
    loginClose.addEventListener('click', () => this.hideLoginModal());
    loginCancel.addEventListener('click', () => this.hideLoginModal());

    // Close on overlay click
    this.loginOverlay.addEventListener('click', (e) => {
      if (e.target === this.loginOverlay) {
        this.hideLoginModal();
      }
    });
  }

  /**
   * Check authentication status and update UI
   */
  async checkAuthStatus() {
    if (isAuthenticated()) {
      // Verify session is still valid on server
      const valid = await verifySession();
      this.updateAuthUI(valid);
    } else {
      this.updateAuthUI(false);
    }
  }

  /**
   * Update UI based on authentication state
   */
  updateAuthUI(authenticated) {
    if (authenticated) {
      this.loginBtn.classList.add('hidden');
      this.logoutBtn.classList.remove('hidden');
      this.addBtn.classList.remove('hidden');
      this.dragDropManager.enable();
    } else {
      this.loginBtn.classList.remove('hidden');
      this.logoutBtn.classList.add('hidden');
      this.addBtn.classList.add('hidden');
      this.dragDropManager.disable();
    }
    // Re-render performance list with current auth state
    const state = store.getState();
    this.performanceList.render(state.performances, state.loading, authenticated);
  }

  /**
   * Show login modal
   */
  showLoginModal() {
    this.loginError.classList.add('hidden');
    this.loginForm.reset();
    this.loginOverlay.classList.remove('hidden');
    document.getElementById('login-password').focus();
  }

  /**
   * Hide login modal
   */
  hideLoginModal() {
    this.loginOverlay.classList.add('hidden');
    this.loginError.classList.add('hidden');
  }

  /**
   * Handle login form submission
   */
  async handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('login-password').value;

    try {
      await login(password);
      this.hideLoginModal();
      this.updateAuthUI(true);
    } catch (error) {
      this.loginError.textContent = error.message;
      this.loginError.classList.remove('hidden');
    }
  }

  /**
   * Handle logout
   */
  handleLogout() {
    logout();
    this.updateAuthUI(false);
  }

  /**
   * Setup UI event listeners
   */
  setupUIEvents() {
    this.addBtn = document.getElementById('add-performance-btn');
    this.addBtn.addEventListener('click', () => {
      this.performanceForm.showCreate();
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('change', (e) => {
        this.toggleTheme(e.target.checked);
      });
    }

    // History modal
    this.historyOverlay = document.getElementById('history-overlay');
    this.historyContent = document.getElementById('history-content');
    this.historyText = document.getElementById('history-text');
    this.historyEmpty = document.getElementById('history-empty');
    this.historyCopyBtn = document.getElementById('history-copy');

    const historyBtn = document.getElementById('show-history-btn');
    const historyClose = document.getElementById('history-close');

    if (historyBtn) {
      historyBtn.addEventListener('click', () => this.showHistory());
    }

    if (historyClose) {
      historyClose.addEventListener('click', () => this.hideHistory());
    }

    if (this.historyCopyBtn) {
      this.historyCopyBtn.addEventListener('click', () => this.copyHistory());
    }

    if (this.historyOverlay) {
      this.historyOverlay.addEventListener('click', (e) => {
        if (e.target === this.historyOverlay) {
          this.hideHistory();
        }
      });
    }
  }

  /**
   * Format today's date in French
   */
  formatDateFr() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('fr-FR', options);
  }

  /**
   * Show history modal with passed performances
   */
  showHistory() {
    const performances = store.getState().performances;
    const passedPerformances = performances.filter(p => p.isOver);

    if (passedPerformances.length === 0) {
      this.historyContent.classList.add('hidden');
      this.historyEmpty.classList.remove('hidden');
    } else {
      this.historyContent.classList.remove('hidden');
      this.historyEmpty.classList.add('hidden');

      // Build text content
      const dateStr = this.formatDateFr();
      let text = `Les performances suivantes ont été réalisées le ${dateStr} dans l'ordre suivant :\n\n`;

      passedPerformances.forEach((perf, index) => {
        const performer = perf.performerPseudo
          ? `${perf.performerName} (${perf.performerPseudo})`
          : perf.performerName;
        text += `${index + 1}. "${perf.title}" par ${performer}\n`;
      });

      this.historyText.textContent = text;
    }

    this.historyOverlay.classList.remove('hidden');
  }

  /**
   * Copy history text to clipboard
   */
  async copyHistory() {
    const text = this.historyText.textContent;
    try {
      await navigator.clipboard.writeText(text);
      // Visual feedback
      const originalText = this.historyCopyBtn.textContent;
      this.historyCopyBtn.textContent = 'Copié !';
      this.historyCopyBtn.classList.add('btn-success');
      setTimeout(() => {
        this.historyCopyBtn.textContent = originalText;
        this.historyCopyBtn.classList.remove('btn-success');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Impossible de copier le texte');
    }
  }

  /**
   * Hide history modal
   */
  hideHistory() {
    this.historyOverlay.classList.add('hidden');
  }

  /**
   * Setup end time badge with 5-second update interval
   */
  setupEndTimeBadge() {
    this.endTimeBadge = document.getElementById('end-time-badge');
    this.updateEndTimeBadge();

    // Update every 5 seconds
    this.endTimeInterval = setInterval(() => {
      this.updateEndTimeBadge();
    }, 5000);
  }

  /**
   * Calculate and update end time badge
   */
  updateEndTimeBadge() {
    const performances = store.getState().performances;
    const pendingPerformances = performances.filter(p => !p.isOver);

    if (pendingPerformances.length === 0) {
      this.endTimeBadge.textContent = 'Fin --:--';
      return;
    }

    // Get current playback info if any
    const playbackInfo = this.performanceList.getCurrentPlaybackInfo();

    let totalSeconds = 0;

    for (const perf of pendingPerformances) {
      // Add 25 seconds per performance
      totalSeconds += 25;

      // Calculate performance duration
      const startOffset = (perf.startOffset?.minutes || 0) * 60 + (perf.startOffset?.seconds || 0);
      const endTimeSeconds = (perf.endTime?.minutes || 0) * 60 + (perf.endTime?.seconds || 0);

      // Use endTime if set, otherwise stored duration, otherwise skip
      let effectiveDuration = 0;
      if (endTimeSeconds > 0) {
        effectiveDuration = endTimeSeconds - startOffset;
      } else if (perf.duration > 0) {
        effectiveDuration = perf.duration - startOffset;
      }

      // If this is the currently playing performance, use remaining time
      if (playbackInfo && playbackInfo.id === perf.id) {
        totalSeconds += playbackInfo.remaining;
      } else {
        totalSeconds += effectiveDuration;
      }
    }

    // Calculate end time
    const now = new Date();
    const endTime = new Date(now.getTime() + totalSeconds * 1000);

    // Format as HH:MM
    const hours = endTime.getHours().toString().padStart(2, '0');
    const minutes = endTime.getMinutes().toString().padStart(2, '0');

    this.endTimeBadge.textContent = `Fin ${hours}:${minutes}`;
  }

  /**
   * Handle duration loaded from audio player
   */
  async handleDurationLoaded(id, duration) {
    try {
      // Save duration to server (don't update store to avoid re-render during playback)
      const formData = new FormData();
      formData.append('duration', duration);
      await updatePerformance(id, formData);

      // Update local performance data without triggering re-render
      const performances = store.getState().performances;
      const perf = performances.find(p => p.id === id);
      if (perf) {
        perf.duration = duration;
      }

      // Update badge
      this.updateEndTimeBadge();
    } catch (error) {
      console.error('Failed to save duration:', error);
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
      alert(`Erreur : ${error.message}`);
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
      alert(`Erreur : ${error.message}`);
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
      alert(`Erreur : ${error.message}`);
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
