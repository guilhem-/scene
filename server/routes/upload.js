const express = require('express');
const multer = require('multer');
const path = require('path');
const { createPerformanceDir, getMusicFilePath } = require('../utils/fileManager');

const router = express.Router();

// Allowed MIME types
const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Configure multer for memory storage (we'll save manually to custom path)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP3, WAV, and OGG files are allowed.'));
    }
  }
});

/**
 * Save uploaded file to the performance directory
 */
async function saveUploadedFile(file, performanceId) {
  const fs = require('fs').promises;

  // Create the performance directory
  await createPerformanceDir(performanceId);

  // Get file extension from original name
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `music_file${ext}`;
  const filePath = getMusicFilePath(performanceId, filename);

  // Write the file
  await fs.writeFile(filePath, file.buffer);

  // Extract duration from audio metadata (dynamic import for ESM module)
  let duration = 0;
  try {
    const { parseBuffer } = await import('music-metadata');
    const metadata = await parseBuffer(file.buffer, { mimeType: file.mimetype });
    duration = metadata.format.duration || 0;
  } catch (err) {
    console.error('Failed to extract audio duration:', err.message);
  }

  return {
    originalName: file.originalname,
    filename,
    mimeType: file.mimetype,
    size: file.size,
    duration
  };
}

module.exports = { router, upload, saveUploadedFile };
