/**
 * HTML content rewriter
 * Rewrites URLs and injects branding into HTML
 */

const cheerio = require('cheerio');
const config = require('../config');
const { generateBrandingStyles } = require('../branding/styles');
const { generateBrandingScript } = require('../branding/script');

/**
 * Rewrite HTML content with custom branding and URL rewrites
 * @param {string} html - Original HTML content
 * @returns {string} Rewritten HTML
 */
function rewriteHtml(html, requestUrl = '') {
  const $ = cheerio.load(html);

  // Inject branding CSS
  const customCSS = generateBrandingStyles();
  $('head').append(`<style id="serenity-branding">${customCSS}</style>`);

  // Create SVG favicon data URI
  let svgFavicon = config.brandFavicon;
  if (config.brandLogoSvg) {
    let svg = config.brandLogoSvg;
    // Replace all currentColor with brand color
    svg = svg.replace(/currentColor/g, config.brandColor);
    // Add xmlns if missing
    if (!svg.includes('xmlns=')) {
      svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    svgFavicon = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  // Replace favicon with SVG
  $('link[rel="icon"], link[rel="shortcut icon"], link[rel*="icon"]').remove();
  $('head').prepend(`<link rel="icon" href="${svgFavicon}" type="image/svg+xml">`);
  $('head').prepend(`<link rel="shortcut icon" href="${svgFavicon}" type="image/svg+xml">`);

  // Update title to brand name only
  $('title').text(config.siteName);

  // CRITICAL: Replace phone numbers in HTML before sending to client
  // Get entire HTML as string and replace phone patterns
  let htmlString = $.html();
  
  const phoneReplacements = [
    [/\+1-XXX-XXX-XXXX/g, config.brandPhone],
    [/\+1\s*\(XXX\)\s*XXX-XXXX/g, config.brandPhone],
    [/XXX-XXX-XXXX/g, config.brandPhone]
  ];

  phoneReplacements.forEach(([pattern, replacement]) => {
    htmlString = htmlString.replace(pattern, replacement);
  });

  // Reload the modified HTML back into Cheerio
  const $modified = cheerio.load(htmlString);

  // Inject branding script
  const brandingScript = generateBrandingScript();
  $modified('head').append(`<script id="serenity-branding-script">${brandingScript}</script>`);

  // Rewrite all absolute URLs to go through proxy
  $modified('a[href]').each((_, el) => {
    let href = $modified(el).attr('href');
    if (href && href.startsWith(config.targetUrl)) {
      $modified(el).attr('href', href.replace(config.targetUrl, ''));
    }
  });

  $modified('form[action]').each((_, el) => {
    let action = $modified(el).attr('action');
    if (action && action.startsWith(config.targetUrl)) {
      $modified(el).attr('action', action.replace(config.targetUrl, ''));
    }
  });

  // Rewrite image and resource URLs
  $modified('img[src], script[src], link[href], iframe[src]').each((_, el) => {
    const attr = el.tagName === 'link' ? 'href' : 'src';
    let value = $modified(el).attr(attr);
    if (value && value.startsWith(config.targetUrl)) {
      $modified(el).attr(attr, value.replace(config.targetUrl, ''));
    }
  });

  return $modified.html();
}

module.exports = { rewriteHtml };
