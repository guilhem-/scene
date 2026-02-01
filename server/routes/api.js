const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateId } = require('../utils/idGenerator');
const {
  readPerformances,
  writePerformances,
  deletePerformanceDir,
  getStoredPath,
  getDataDir
} = require('../utils/fileManager');
const { upload, saveUploadedFile } = require('./upload');
const { requireAuth } = require('./auth');
const { performanceEvents } = require('../utils/events');

const router = express.Router();

/**
 * GET /api/performances
 * List all performances
 */
router.get('/performances', async (req, res) => {
  try {
    const data = await readPerformances();
    res.json(data.performances);
  } catch (error) {
    console.error('Error fetching performances:', error);
    res.status(500).json({ error: 'Failed to fetch performances' });
  }
});

/**
 * POST /api/performances
 * Create a new performance (with optional file upload)
 * Requires authentication
 */
router.post('/performances', requireAuth, upload.single('musicFile'), async (req, res) => {
  try {
    const { title, performerName, performerPseudo, category, isConfirmed, instructions, startOffsetMinutes, startOffsetSeconds, endTimeMinutes, endTimeSeconds, fadeIn, fadeOut, duration } = req.body;

    // Validate required fields
    if (!title || !performerName) {
      return res.status(400).json({ error: 'Title and performer name are required' });
    }

    const id = generateId();
    const now = new Date().toISOString();

    const performance = {
      id,
      title,
      performerName,
      performerPseudo: performerPseudo || '',
      category: category || 'solo',
      instructions: instructions || '',
      musicFile: null,
      startOffset: {
        minutes: parseInt(startOffsetMinutes, 10) || 0,
        seconds: parseInt(startOffsetSeconds, 10) || 0
      },
      endTime: {
        minutes: parseInt(endTimeMinutes, 10) || 0,
        seconds: parseInt(endTimeSeconds, 10) || 0
      },
      fadeIn: fadeIn !== 'false',
      fadeOut: fadeOut !== 'false',
      duration: parseFloat(duration) || 0,
      isConfirmed: isConfirmed !== 'false',
      isOver: false,
      isCancelled: false,
      createdAt: now,
      updatedAt: now
    };

    // Handle file upload if present
    if (req.file) {
      const fileInfo = await saveUploadedFile(req.file, id);
      performance.musicFile = {
        originalName: fileInfo.originalName,
        storedPath: getStoredPath(id, fileInfo.filename),
        mimeType: fileInfo.mimeType
      };
      // Store duration from audio file
      if (fileInfo.duration > 0) {
        performance.duration = fileInfo.duration;
      }
    }

    // Save to data file
    const data = await readPerformances();
    data.performances.push(performance);
    await writePerformances(data);

    // Broadcast event
    performanceEvents.performanceCreated(performance);

    res.status(201).json(performance);
  } catch (error) {
    console.error('Error creating performance:', error);
    res.status(500).json({ error: 'Failed to create performance' });
  }
});

/**
 * PUT /api/performances/reorder
 * Reorder performances
 * Requires authentication
 * NOTE: This route must be defined before /performances/:id routes
 */
router.put('/performances/reorder', requireAuth, express.json(), async (req, res) => {
  try {
    const { order } = req.body; // Array of IDs in new order

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be an array of IDs' });
    }

    const data = await readPerformances();

    // Create a map for quick lookup
    const performanceMap = new Map(data.performances.map(p => [p.id, p]));

    // Reorder based on provided order
    const reordered = [];
    for (const id of order) {
      const performance = performanceMap.get(id);
      if (performance) {
        reordered.push(performance);
        performanceMap.delete(id);
      }
    }

    // Append any performances not in the order array (shouldn't happen, but safety)
    for (const performance of performanceMap.values()) {
      reordered.push(performance);
    }

    data.performances = reordered;
    await writePerformances(data);

    // Broadcast event
    performanceEvents.performancesReordered(data.performances);

    res.json(data.performances);
  } catch (error) {
    console.error('Error reordering performances:', error);
    res.status(500).json({ error: 'Failed to reorder performances' });
  }
});

/**
 * PUT /api/performances/:id
 * Update an existing performance
 * Requires authentication
 */
router.put('/performances/:id', requireAuth, upload.single('musicFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, performerName, performerPseudo, category, isConfirmed, instructions, startOffsetMinutes, startOffsetSeconds, endTimeMinutes, endTimeSeconds, fadeIn, fadeOut, duration, isOver, isCancelled } = req.body;

    const data = await readPerformances();
    const index = data.performances.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Performance not found' });
    }

    const performance = data.performances[index];

    // Update fields if provided
    if (title !== undefined) performance.title = title;
    if (performerName !== undefined) performance.performerName = performerName;
    if (performerPseudo !== undefined) performance.performerPseudo = performerPseudo;
    if (category !== undefined) performance.category = category;
    if (instructions !== undefined) performance.instructions = instructions;
    if (isConfirmed !== undefined) {
      performance.isConfirmed = isConfirmed === 'true' || isConfirmed === true;
    }
    if (startOffsetMinutes !== undefined || startOffsetSeconds !== undefined) {
      const parsedOffsetMin = parseInt(startOffsetMinutes, 10);
      const parsedOffsetSec = parseInt(startOffsetSeconds, 10);
      performance.startOffset = {
        minutes: isNaN(parsedOffsetMin) ? (performance.startOffset?.minutes || 0) : parsedOffsetMin,
        seconds: isNaN(parsedOffsetSec) ? (performance.startOffset?.seconds || 0) : parsedOffsetSec
      };
    }
    if (endTimeMinutes !== undefined || endTimeSeconds !== undefined) {
      const parsedEndMin = parseInt(endTimeMinutes, 10);
      const parsedEndSec = parseInt(endTimeSeconds, 10);
      performance.endTime = {
        minutes: isNaN(parsedEndMin) ? (performance.endTime?.minutes || 0) : parsedEndMin,
        seconds: isNaN(parsedEndSec) ? (performance.endTime?.seconds || 0) : parsedEndSec
      };
    }
    if (fadeIn !== undefined) {
      performance.fadeIn = fadeIn === 'true' || fadeIn === true;
    }
    if (fadeOut !== undefined) {
      performance.fadeOut = fadeOut === 'true' || fadeOut === true;
    }
    if (isOver !== undefined) {
      performance.isOver = isOver === 'true' || isOver === true;
    }
    if (isCancelled !== undefined) {
      performance.isCancelled = isCancelled === 'true' || isCancelled === true;
    }
    if (duration !== undefined) {
      performance.duration = parseFloat(duration) || 0;
    }

    // Handle file upload if present
    if (req.file) {
      // Delete old music file directory contents if exists
      if (performance.musicFile) {
        await deletePerformanceDir(id);
      }

      const fileInfo = await saveUploadedFile(req.file, id);
      performance.musicFile = {
        originalName: fileInfo.originalName,
        storedPath: getStoredPath(id, fileInfo.filename),
        mimeType: fileInfo.mimeType
      };
      // Store duration from audio file
      if (fileInfo.duration > 0) {
        performance.duration = fileInfo.duration;
      }
    }

    performance.updatedAt = new Date().toISOString();
    data.performances[index] = performance;
    await writePerformances(data);

    // Broadcast event
    performanceEvents.performanceUpdated(performance);

    res.json(performance);
  } catch (error) {
    console.error('Error updating performance:', error);
    res.status(500).json({ error: 'Failed to update performance' });
  }
});

/**
 * DELETE /api/performances/:id
 * Delete a performance
 * Requires authentication
 */
router.delete('/performances/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const data = await readPerformances();
    const index = data.performances.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Performance not found' });
    }

    // Delete the performance directory (music files)
    await deletePerformanceDir(id);

    // Remove from data
    data.performances.splice(index, 1);
    await writePerformances(data);

    // Broadcast event
    performanceEvents.performanceDeleted(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting performance:', error);
    res.status(500).json({ error: 'Failed to delete performance' });
  }
});

/**
 * GET /api/performances/:id/music
 * Stream music file with Range request support for seeking
 */
router.get('/performances/:id/music', async (req, res) => {
  try {
    const { id } = req.params;

    const data = await readPerformances();
    const performance = data.performances.find(p => p.id === id);

    if (!performance) {
      return res.status(404).json({ error: 'Performance not found' });
    }

    if (!performance.musicFile) {
      return res.status(404).json({ error: 'No music file for this performance' });
    }

    // storedPath is like "data/perf_xxx/file.mp3", strip "data/" prefix and use DATA_DIR
    const dataDir = getDataDir();
    const relativePath = performance.musicFile.storedPath.replace(/^data\//, '');
    const filePath = path.join(dataDir, relativePath);
    const fileExists = fs.existsSync(filePath);

    // Always include debug info in response headers for troubleshooting
    res.setHeader('X-Debug-DataDir', dataDir);
    res.setHeader('X-Debug-FilePath', filePath);
    res.setHeader('X-Debug-Exists', String(fileExists));

    if (!fileExists) {
      return res.status(404).json({
        error: 'Music file not found on disk',
        debug: {
          storedPath: performance.musicFile.storedPath,
          dataDir,
          filePath,
          relativePath
        }
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const mimeType = performance.musicFile.mimeType;

    // Handle Range requests for seeking support
    const range = req.headers.range;

    if (range) {
      // Parse Range header (e.g., "bytes=32324-")
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType
      });

      const readStream = fs.createReadStream(filePath, { start, end });
      readStream.pipe(res);
    } else {
      // No Range header - send full file with Accept-Ranges header
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes'
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    }
  } catch (error) {
    console.error('Error streaming music:', error);
    res.status(500).json({ error: 'Failed to stream music file' });
  }
});

module.exports = router;
