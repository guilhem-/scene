/**
 * Performance API client
 */

import { getAuthToken } from '../auth/authManager.js';

const API_BASE = '/api';

/**
 * Get authorization headers if authenticated
 */
function getAuthHeaders() {
  const token = getAuthToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

/**
 * Fetch all performances
 */
export async function getPerformances() {
  const response = await fetch(`${API_BASE}/performances`);
  if (!response.ok) {
    throw new Error('Failed to fetch performances');
  }
  return response.json();
}

/**
 * Create a new performance
 * Requires authentication
 */
export async function createPerformance(formData) {
  const response = await fetch(`${API_BASE}/performances`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create performance');
  }
  return response.json();
}

/**
 * Update an existing performance
 * Requires authentication
 */
export async function updatePerformance(id, formData) {
  const response = await fetch(`${API_BASE}/performances/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: formData
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update performance');
  }
  return response.json();
}

/**
 * Delete a performance
 * Requires authentication
 */
export async function deletePerformance(id) {
  const response = await fetch(`${API_BASE}/performances/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete performance');
  }
  return response.json();
}

/**
 * Reorder performances
 * Requires authentication
 */
export async function reorderPerformances(order) {
  const response = await fetch(`${API_BASE}/performances/reorder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ order })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reorder performances');
  }
  return response.json();
}

/**
 * Get music file URL for a performance
 */
export function getMusicUrl(id) {
  return `${API_BASE}/performances/${id}/music`;
}
