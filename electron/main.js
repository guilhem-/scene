const { app, BrowserWindow } = require('electron');
const path = require('path');
const { getPaths, initializeDirectories } = require('./utils/paths');

const PORT = 3333;
let mainWindow = null;
let serverProcess = null;

/**
 * Start the Express server
 */
async function startServer(paths) {
  // Set environment variables for server paths
  process.env.DATA_DIR = paths.dataDir;
  process.env.CONFIG_DIR = paths.configDir;

  // Server path is relative to this file (works in both dev and production with asar)
  const serverPath = path.join(__dirname, '../server/index.js');

  console.log('Starting server from:', serverPath);
  console.log('Data directory:', paths.dataDir);
  console.log('Config directory:', paths.configDir);

  // Require the server module and call start()
  const server = require(serverPath);
  await server.start();
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../build/icon.ico'),
    title: 'Scene Performance Manager',
    autoHideMenuBar: true
  });

  // Load the app from the local server
  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Wait for server to be ready
 */
function waitForServer(retries = 30) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    let attempts = 0;

    const check = () => {
      attempts++;
      const req = http.get(`http://localhost:${PORT}/api/performances`, (res) => {
        resolve();
      });

      req.on('error', () => {
        if (attempts < retries) {
          setTimeout(check, 100);
        } else {
          reject(new Error('Server failed to start'));
        }
      });

      req.end();
    };

    check();
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    // Get paths and initialize directories
    const paths = getPaths();
    initializeDirectories(paths);

    // Start the server
    await startServer(paths);

    // Wait for server to be ready
    await waitForServer();

    // Create the window
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // On macOS, apps stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle app quit
app.on('before-quit', () => {
  // Server cleanup is handled automatically when process exits
  console.log('Application shutting down...');
});
