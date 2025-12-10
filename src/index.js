/**
 * Application initialization
 * Sets up Express app, routes, and exports for server.js
 */

const express = require('express');
const config = require('./config');
const { setupMiddleware } = require('./middleware/setup');
const { handleProxy } = require('./proxy');

// Create Express app
const app = express();

// Setup middleware
setupMiddleware(app);

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    siteType: config.siteType,
    siteName: config.siteName,
    timestamp: new Date().toISOString()
  });
});

// Redirect root to site's default path
app.get('/', (req, res, next) => {
  if (config.sitePath && config.sitePath !== '/') {
    return res.redirect(302, config.sitePath);
  }
  next();
});

// Main proxy handler - catch all routes
app.all('*', handleProxy);

// Global Express error handler
app.use((err, req, res, next) => {
  console.error('[Express Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = { app, config };
