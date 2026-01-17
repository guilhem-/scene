const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateId } = require('../utils/idGenerator');
const {
  readPerformances,
  writePerformances,
  deletePerformanceDir,
  getStoredPath,
  DATA_DIR
} = require('../utils/fileManager');
const { upload, saveUploadedFile } = require('./upload');

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
 */
router.post('/performances', upload.single('musicFile'), async (req, res) => {
  try {
    const { title, performerName, performerPseudo, startOffsetMinutes, startOffsetSeconds } = req.body;

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
      musicFile: null,
      startOffset: {
        minutes: parseInt(startOffsetMinutes, 10) || 0,
        seconds: parseInt(startOffsetSeconds, 10) || 0
      },
      isOver: false,
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
    }

    // Save to data file
    const data = await readPerformances();
    data.performances.push(performance);
    await writePerformances(data);

    res.status(201).json(performance);
  } catch (error) {
    console.error('Error creating performance:', error);
    res.status(500).json({ error: 'Failed to create performance' });
  }
});

/**
 * PUT /api/performances/reorder
 * Reorder performances
 * NOTE: This route must be defined before /performances/:id routes
 */
router.put('/performances/reorder', express.json(), async (req, res) => {
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

    res.json(data.performances);
  } catch (error) {
    console.error('Error reordering performances:', error);
    res.status(500).json({ error: 'Failed to reorder performances' });
  }
});

/**
 * PUT /api/performances/:id
 * Update an existing performance
 */
router.put('/performances/:id', upload.single('musicFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, performerName, performerPseudo, startOffsetMinutes, startOffsetSeconds, isOver } = req.body;

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
    if (startOffsetMinutes !== undefined || startOffsetSeconds !== undefined) {
      performance.startOffset = {
        minutes: parseInt(startOffsetMinutes, 10) || performance.startOffset.minutes,
        seconds: parseInt(startOffsetSeconds, 10) || performance.startOffset.seconds
      };
    }
    if (isOver !== undefined) {
      performance.isOver = isOver === 'true' || isOver === true;
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
    }

    performance.updatedAt = new Date().toISOString();
    data.performances[index] = performance;
    await writePerformances(data);

    res.json(performance);
  } catch (error) {
    console.error('Error updating performance:', error);
    res.status(500).json({ error: 'Failed to update performance' });
  }
});

/**
 * DELETE /api/performances/:id
 * Delete a performance
 */
router.delete('/performances/:id', async (req, res) => {
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

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting performance:', error);
    res.status(500).json({ error: 'Failed to delete performance' });
  }
});

/**
 * GET /api/performances/:id/music
 * Stream music file
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

    const filePath = path.join(__dirname, '../..', performance.musicFile.storedPath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Music file not found on disk' });
    }

    // Set content type
    res.setHeader('Content-Type', performance.musicFile.mimeType);

    // Stream the file
    const stat = fs.statSync(filePath);
    res.setHeader('Content-Length', stat.size);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error('Error streaming music:', error);
    res.status(500).json({ error: 'Failed to stream music file' });
  }
});

module.exports = router;
