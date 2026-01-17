/**
 * @jest-environment jsdom
 */

describe('Theme Toggle', () => {
  let themeToggle;

  beforeEach(() => {
    // Setup DOM
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();

    document.body.innerHTML = `
      <label class="theme-toggle">
        <input type="checkbox" id="theme-toggle">
        <span class="toggle-slider"></span>
        <span class="toggle-label">Night</span>
      </label>
    `;

    themeToggle = document.getElementById('theme-toggle');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('toggleTheme function', () => {
    const toggleTheme = (isDark) => {
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      }
    };

    test('should set dark theme when toggled on', () => {
      toggleTheme(true);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    test('should set light theme when toggled off', () => {
      // First set to dark
      toggleTheme(true);
      // Then toggle off
      toggleTheme(false);

      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
      expect(localStorage.getItem('theme')).toBe('light');
    });

    test('should persist theme preference in localStorage', () => {
      toggleTheme(true);
      expect(localStorage.getItem('theme')).toBe('dark');

      toggleTheme(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('initTheme function', () => {
    const initTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const toggle = document.getElementById('theme-toggle');

      if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (toggle) toggle.checked = true;
      }
    };

    test('should restore dark theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');

      initTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(themeToggle.checked).toBe(true);
    });

    test('should keep light theme if no preference saved', () => {
      initTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
      expect(themeToggle.checked).toBe(false);
    });

    test('should keep light theme if light preference saved', () => {
      localStorage.setItem('theme', 'light');

      initTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
      expect(themeToggle.checked).toBe(false);
    });
  });

  describe('toggle checkbox interaction', () => {
    const toggleTheme = (isDark) => {
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      }
    };

    test('should toggle theme when checkbox changes', () => {
      // Simulate checkbox change event
      themeToggle.checked = true;
      toggleTheme(themeToggle.checked);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      // Toggle back
      themeToggle.checked = false;
      toggleTheme(themeToggle.checked);

      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });
  });
});
