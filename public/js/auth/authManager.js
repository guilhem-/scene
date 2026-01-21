/**
 * Authentication Manager
 * Handles authentication state with localStorage and automatic expiration
 */

const AUTH_KEY = 'scene_auth';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

/**
 * Get stored auth data from localStorage
 */
function getStoredAuth() {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Check if stored session has expired
 */
function isSessionExpired(authData) {
  if (!authData || !authData.timestamp) return true;
  const now = Date.now();
  return now - authData.timestamp > SESSION_DURATION;
}

/**
 * Get auth token if valid session exists
 */
export function getAuthToken() {
  const authData = getStoredAuth();
  if (!authData || isSessionExpired(authData)) {
    clearAuth();
    return null;
  }
  return authData.token;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return getAuthToken() !== null;
}

/**
 * Store authentication data
 */
export function setAuth(token) {
  const authData = {
    token,
    timestamp: Date.now()
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

/**
 * Clear authentication data
 */
export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Login with password
 */
export async function login(password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();
  setAuth(data.token);
  return true;
}

/**
 * Logout - clear local auth data
 */
export function logout() {
  clearAuth();
}

/**
 * Verify current session with server
 */
export async function verifySession() {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data.valid) {
      clearAuth();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
