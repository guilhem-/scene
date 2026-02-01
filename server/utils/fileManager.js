const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Use getter to ensure DATA_DIR is read fresh each time (important for Electron)
function getDataDir() {
  return process.env.DATA_DIR || path.join(__dirname, '../../data');
}

/**
 * Ensure data directory and performances.json exist
 */
async function ensureDataStructure() {
  try {
    const dataDir = getDataDir();
    const performancesFile = path.join(dataDir, 'performances.json');

    await fs.mkdir(dataDir, { recursive: true });

    if (!fsSync.existsSync(performancesFile)) {
      const initialData = {
        version: '1.0',
        performances: []
      };
      await fs.writeFile(performancesFile, JSON.stringify(initialData, null, 2));
    }
  } catch (error) {
    console.error('Error ensuring data structure:', error);
    throw error;
  }
}

/**
 * Read performances data
 */
async function readPerformances() {
  await ensureDataStructure();
  const performancesFile = path.join(getDataDir(), 'performances.json');
  const data = await fs.readFile(performancesFile, 'utf-8');
  return JSON.parse(data);
}

/**
 * Write performances data
 */
async function writePerformances(data) {
  await ensureDataStructure();
  const performancesFile = path.join(getDataDir(), 'performances.json');
  await fs.writeFile(performancesFile, JSON.stringify(data, null, 2));
}

/**
 * Create directory for a performance's music file
 */
async function createPerformanceDir(performanceId) {
  const dir = path.join(getDataDir(), performanceId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Delete a performance's directory and all its contents
 */
async function deletePerformanceDir(performanceId) {
  const dir = path.join(getDataDir(), performanceId);
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Get the full path for a music file
 */
function getMusicFilePath(performanceId, filename) {
  return path.join(getDataDir(), performanceId, filename);
}

/**
 * Get the stored path (relative) for a music file
 */
function getStoredPath(performanceId, filename) {
  return `data/${performanceId}/${filename}`;
}

module.exports = {
  ensureDataStructure,
  readPerformances,
  writePerformances,
  createPerformanceDir,
  deletePerformanceDir,
  getMusicFilePath,
  getStoredPath,
  getDataDir
};
