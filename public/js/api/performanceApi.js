/**
 * Performance API client
 */

const API_BASE = '/api';

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
 */
export async function createPerformance(formData) {
  const response = await fetch(`${API_BASE}/performances`, {
    method: 'POST',
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
 */
export async function updatePerformance(id, formData) {
  const response = await fetch(`${API_BASE}/performances/${id}`, {
    method: 'PUT',
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
 */
export async function deletePerformance(id) {
  const response = await fetch(`${API_BASE}/performances/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete performance');
  }
  return response.json();
}

/**
 * Reorder performances
 */
export async function reorderPerformances(order) {
  const response = await fetch(`${API_BASE}/performances/reorder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
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
