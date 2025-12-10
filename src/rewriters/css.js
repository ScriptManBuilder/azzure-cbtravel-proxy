/**
 * CSS content rewriter
 * Rewrites URLs in CSS to go through proxy
 */

const config = require('../config');

/**
 * Rewrite CSS content, replacing target URLs with proxy paths
 * @param {string} css - Original CSS content
 * @returns {string} Rewritten CSS
 */
function rewriteCss(css) {
  return css.replace(new RegExp(config.targetUrl, 'g'), '');
}

module.exports = { rewriteCss };
