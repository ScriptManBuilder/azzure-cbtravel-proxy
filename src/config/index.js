/**
 * Main configuration loader
 * Loads brand config by BRAND_ID from env
 */

const fs = require('fs');
const path = require('path');
const sites = require('./sites');
const brands = require('./brands');
const defaults = require('./defaults');

// Get brand from env (default to 0 = Serenity)
const brandId = process.env.BRAND_ID !== undefined ? parseInt(process.env.BRAND_ID, 10) : 0;
const brand = brands[brandId] || brands[0];

// Get site type from brand config
const siteType = brand.siteType;
const siteConfig = sites[siteType] || sites[1];

// Load SVG content (only for .svg files)
let brandLogoSvg = '';
if (brand.logo && brand.logo.endsWith('.svg')) {
  try {
    const logoPath = path.join(__dirname, '../../assets', brand.logo);
    brandLogoSvg = fs.readFileSync(logoPath, 'utf-8').trim();
  } catch (err) {
    console.warn('[Config] Could not load SVG logo:', err.message);
  }
}

// Build configuration object
const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || defaults.port,
  targetUrl: (process.env.TARGET_URL || defaults.targetUrl).replace(/\/$/, ''),

  // Site type
  siteType,
  sitePath: siteConfig.defaultPath,
  siteFilter: siteConfig.filter,

  // Branding (from brand config)
  siteName: brand.name,
  brandColor: brand.color || siteConfig.defaultColor || defaults.brandColor,
  brandLogo: `/assets/${brand.logo}`,
  brandLogoSvg,
  brandFavicon: `/assets/${defaults.brandFavicon}`,
  brandPhone: brand.phone || defaults.brandPhone,
  brandUrl: brand.url,

  // Registration
  registrationCode: process.env.REGISTRATION_CODE || defaults.registrationCode,

  // Original phone to replace
  originalPhone: defaults.originalPhone
};

// Log configuration on load
console.log('[Config] Brand ID:', brandId);
console.log('[Config] Site Name:', config.siteName);
console.log('[Config] Site Type:', config.siteType);
console.log('[Config] Brand Color:', config.brandColor);
console.log('[Config] Brand Phone:', config.brandPhone);
console.log('[Config] Brand from brands.js:', brand.phone);

module.exports = config;
