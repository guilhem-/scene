const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const PERFORMANCES_FILE = path.join(DATA_DIR, 'performances.json');

/**
 * Ensure data directory and performances.json exist
 */
async function ensureDataStructure() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    if (!fsSync.existsSync(PERFORMANCES_FILE)) {
      const initialData = {
        version: '1.0',
        performances: []
      };
      await fs.writeFile(PERFORMANCES_FILE, JSON.stringify(initialData, null, 2));
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
  const data = await fs.readFile(PERFORMANCES_FILE, 'utf-8');
  return JSON.parse(data);
}

/**
 * Write performances data
 */
async function writePerformances(data) {
  await ensureDataStructure();
  await fs.writeFile(PERFORMANCES_FILE, JSON.stringify(data, null, 2));
}

/**
 * Create directory for a performance's music file
 */
async function createPerformanceDir(performanceId) {
  const dir = path.join(DATA_DIR, performanceId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Delete a performance's directory and all its contents
 */
async function deletePerformanceDir(performanceId) {
  const dir = path.join(DATA_DIR, performanceId);
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
  return path.join(DATA_DIR, performanceId, filename);
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
  DATA_DIR
};
