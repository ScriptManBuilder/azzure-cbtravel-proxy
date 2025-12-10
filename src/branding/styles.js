/**
 * Generate CSS styles for branding
 */

const config = require('../config');

/**
 * Generate branding CSS string
 * @returns {string} CSS content
 */
function generateBrandingStyles() {
  const color = config.brandColor;

  return `
    :root {
      --brand-primary: ${color};
      --brand-color: ${color};
      --program_color: ${color} !important;
    }

    /* Force override program_color everywhere */
    html, body, *, *::before, *::after {
      --program_color: ${color} !important;
    }

    /* Override elements that use program_color in their background gradient */
    [style*="program_color"][style*="radial-gradient"] {
      background: radial-gradient(circle, ${color} 40%, color-mix(in srgb, ${color} 80%, white) 100%) !important;
    }

    /* Override any blue colors directly */
    [style*="#0066cc"], [style*="#0077cc"], [style*="#0088cc"],
    [style*="rgb(0, 102, 204)"], [style*="rgb(0, 119, 204)"] {
      background-color: ${color} !important;
    }

    /* Override primary colors */
    .btn-primary, .bg-primary, [class*="btn-primary"] {
      background-color: ${color} !important;
      border-color: ${color} !important;
    }

    .text-primary, a.text-primary {
      color: ${color} !important;
    }

    /* Links and accents */
    a:not([class]) {
      color: ${color};
    }

    /* Auto-fill registration code styling */
    .registration-helper {
      background: ${color};
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      font-size: 14px;
    }
  `;
}

module.exports = { generateBrandingStyles };
