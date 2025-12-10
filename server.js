/**
 * CBTravel Multi-Tenant Proxy Server
 * Entry point - loads environment and starts server
 */

require('dotenv').config();

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

// Load app and config
const { app, config } = require('./src');

// Start server - bind to 0.0.0.0 for Railway compatibility
const server = app.listen(config.port, '0.0.0.0', () => {
  const addr = server.address();
  console.log(`\n========================================`);
  console.log(`  CBTravel Proxy Server`);
  console.log(`========================================`);
  console.log(`  Address:    ${addr.address}:${addr.port}`);
  console.log(`  Site Type:  ${config.siteType}`);
  console.log(`  Site Name:  ${config.siteName}`);
  console.log(`  Target:     ${config.targetUrl}`);
  console.log(`  Color:      ${config.brandColor}`);
  console.log(`  Phone:      ${config.brandPhone}`);
  console.log(`========================================\n`);
});

server.on('error', (err) => {
  console.error('[Server Error]', err);
});
