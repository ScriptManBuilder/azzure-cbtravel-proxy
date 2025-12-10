/**
 * Branding module index
 * Exports all branding functions
 */

const { generateBrandingStyles } = require('./styles');
const { generateBrandingScript } = require('./script');
const { getPhoneReplacementCode } = require('./phone');

module.exports = {
  generateBrandingStyles,
  generateBrandingScript,
  getPhoneReplacementCode
};
