/**
 * Express middleware setup
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');

/**
 * Apply all middleware to Express app
 * @param {import('express').Application} app - Express application
 */
function setupMiddleware(app) {
  // Compression
  app.use(compression());

  // Cookie parsing
  app.use(cookieParser());

  // Body parsing
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Serve static assets (for custom branding)
  app.use('/assets', express.static(path.join(__dirname, '../../assets')));

  // Return 404 for missing assets instead of falling through to proxy
  app.use('/assets/*', (req, res) => {
    console.log(`[ASSETS] 404 - Asset not found: ${req.originalUrl}`);
    res.status(404).send('Asset not found');
  });
}

module.exports = { setupMiddleware };
