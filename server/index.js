const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
const { router: authRoutes } = require('./routes/auth');
const { ensureDataStructure } = require('./utils/fileManager');

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Initialize data structure and start server
async function start() {
  try {
    await ensureDataStructure();
    const server = app.listen(PORT, () => {
      console.log(`Scene Performance Manager running at http://localhost:${PORT}`);
    });
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start if this file is run directly (not imported)
if (require.main === module) {
  start();
}

module.exports = { app, start };
