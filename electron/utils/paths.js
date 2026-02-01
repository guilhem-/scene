const { app } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Get the appropriate paths for data and config based on environment
 * Development: uses project directories
 * Production: uses %APPDATA%/Scene Performance Manager/
 */
function getPaths() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // Development: use project directories
    const projectRoot = path.join(__dirname, '../..');
    return {
      dataDir: path.join(projectRoot, 'data'),
      configDir: path.join(projectRoot, 'server/config')
    };
  } else {
    // Production: use AppData
    const appDataPath = app.getPath('userData');
    return {
      dataDir: path.join(appDataPath, 'data'),
      configDir: path.join(appDataPath, 'config')
    };
  }
}

/**
 * Initialize directories and default files on first run
 */
function initializeDirectories(paths) {
  // Create data directory
  if (!fs.existsSync(paths.dataDir)) {
    fs.mkdirSync(paths.dataDir, { recursive: true });
    console.log('Created data directory:', paths.dataDir);
  }

  // Create config directory
  if (!fs.existsSync(paths.configDir)) {
    fs.mkdirSync(paths.configDir, { recursive: true });
    console.log('Created config directory:', paths.configDir);
  }

  // Create default performances.json if missing
  const performancesFile = path.join(paths.dataDir, 'performances.json');
  if (!fs.existsSync(performancesFile)) {
    const initialData = {
      version: '1.0',
      performances: []
    };
    fs.writeFileSync(performancesFile, JSON.stringify(initialData, null, 2));
    console.log('Created default performances.json');
  }

  // Copy auth.json.example to auth.json if missing
  const authConfigPath = path.join(paths.configDir, 'auth.json');
  if (!fs.existsSync(authConfigPath)) {
    // Try to copy from example file (works with asar via __dirname)
    const examplePath = path.join(__dirname, '../../server/config/auth.json.example');

    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, authConfigPath);
      console.log('Created auth.json from example');
    } else {
      // Create a default auth config (user should change this)
      const defaultAuth = {
        passwordHash: 'please-configure-auth'
      };
      fs.writeFileSync(authConfigPath, JSON.stringify(defaultAuth, null, 2));
      console.log('Created default auth.json - please configure');
    }
  }
}

module.exports = {
  getPaths,
  initializeDirectories
};
