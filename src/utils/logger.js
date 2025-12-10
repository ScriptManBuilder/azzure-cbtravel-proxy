/**
 * Simple logging utilities
 */

/**
 * Log with timestamp prefix
 * @param {string} level - Log level (INFO, ERROR, etc.)
 * @param {string} message - Message to log
 * @param  {...any} args - Additional arguments
 */
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`, ...args);
}

const logger = {
  info: (message, ...args) => log('INFO', message, ...args),
  error: (message, ...args) => log('ERROR', message, ...args),
  warn: (message, ...args) => log('WARN', message, ...args),
  debug: (message, ...args) => {
    if (process.env.DEBUG) {
      log('DEBUG', message, ...args);
    }
  }
};

module.exports = logger;
