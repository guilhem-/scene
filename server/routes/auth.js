const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const AUTH_CONFIG_PATH = process.env.CONFIG_DIR
  ? path.join(process.env.CONFIG_DIR, 'auth.json')
  : path.join(__dirname, '../config/auth.json');

/**
 * Load auth configuration
 */
function loadAuthConfig() {
  try {
    const data = fs.readFileSync(AUTH_CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load auth config:', error.message);
    return null;
  }
}

/**
 * Hash a password using SHA256
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generate auth token from password hash
 */
function generateToken(passwordHash) {
  const timestamp = Date.now().toString();
  const data = passwordHash + timestamp;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * POST /api/auth/login
 * Authenticate with password
 */
router.post('/login', express.json(), (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const config = loadAuthConfig();
  if (!config) {
    return res.status(500).json({ error: 'Auth configuration not available' });
  }

  const inputHash = hashPassword(password);

  if (inputHash === config.passwordHash) {
    // Return the hash as the token (will be stored client-side)
    res.json({
      success: true,
      token: inputHash
    });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

/**
 * POST /api/auth/verify
 * Verify if a token is valid
 */
router.post('/verify', express.json(), (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const config = loadAuthConfig();
  if (!config) {
    return res.status(500).json({ error: 'Auth configuration not available' });
  }

  if (token === config.passwordHash) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

/**
 * Middleware to check authentication
 * Expects token in Authorization header: Bearer <token>
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  const config = loadAuthConfig();

  if (!config) {
    return res.status(500).json({ error: 'Auth configuration not available' });
  }

  if (token !== config.passwordHash) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
}

module.exports = { router, requireAuth };
