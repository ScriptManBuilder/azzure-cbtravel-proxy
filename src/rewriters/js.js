/**
 * JavaScript content rewriter
 * Rewrites URLs in JavaScript to go through proxy
 */

const config = require('../config');

/**
 * Rewrite JavaScript content, replacing target URLs with proxy paths
 * @param {string} js - Original JavaScript content
 * @returns {string} Rewritten JavaScript
 */
function rewriteJs(js) {
  return js.replace(new RegExp(config.targetUrl, 'g'), '');
}

module.exports = { rewriteJs };
