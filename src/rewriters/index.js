/**
 * Content rewriters index
 * Exports all rewriter functions
 */

const { rewriteHtml } = require('./html');
const { rewriteCss } = require('./css');
const { rewriteJs } = require('./js');

module.exports = {
  rewriteHtml,
  rewriteCss,
  rewriteJs
};
