/**
 * Preload script for Electron security bridge
 * Runs in renderer context with Node.js access before page loads
 * Currently minimal as the app uses standard web APIs
 */

// Context isolation is enabled, so we use contextBridge if needed
// For now, no APIs need to be exposed to the renderer
