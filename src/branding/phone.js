/**
 * Phone number replacement logic
 */

/**
 * Generate script code to replace phone number in header
 * @param {string} newPhone - New phone number to display
 * @returns {string} JavaScript code
 */
function getPhoneReplacementCode(newPhone) {
  return `
    function replacePhoneNumber() {
      // Multiple selectors for different site structures
      const selectors = [
        '.Header-navMenu_left',        // Original selector
        '.header-phone',               // Generic header phone
        '.Header-phone',               // Capitalized version
        '.phone-number',               // Generic phone number
        '[class*="phone"]',            // Any class containing "phone"
        '[class*="Phone"]',            // Capitalized version
        'header a[href^="tel:"]',      // Phone links in header
        '.Header a[href^="tel:"]'      // Phone links in Header
      ];

      // Try each selector
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
          // Skip if already replaced
          if (element.dataset?.serenityPhoneReplaced) continue;

          // Check for phone links
          if (element.tagName === 'A' && element.href.startsWith('tel:')) {
            element.href = 'tel:' + '${newPhone}'.replace(/[^0-9+]/g, '');
            element.textContent = '${newPhone}';
            element.dataset.serenityPhoneReplaced = 'true';
            console.log('[Serenity] Phone link replaced:', selector);
            return true;
          }

          // Check text nodes for phone patterns
          const childNodes = element.childNodes;
          for (let i = 0; i < childNodes.length; i++) {
            const node = childNodes[i];
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().match(/^\\+?[\\d\\s\\(\\)\\-]+$/)) {
              node.textContent = '${newPhone}';
              element.dataset.serenityPhoneReplaced = 'true';
              console.log('[Serenity] Phone text replaced:', selector);
              return true;
            }
          }

          // Check element text content directly
          const text = element.textContent.trim();
          if (text.match(/^\\+?[\\d\\s\\(\\)\\-]+$/)) {
            element.textContent = '${newPhone}';
            element.dataset.serenityPhoneReplaced = 'true';
            console.log('[Serenity] Phone element replaced:', selector);
            return true;
          }
        }
      }

      // Fallback: search entire header for phone patterns
      const header = document.querySelector('header') || document.querySelector('.Header') || document.querySelector('[class*="header"]');
      if (header && !header.dataset?.serenityPhoneScanned) {
        header.dataset.serenityPhoneScanned = 'true';
        
        // Find all text nodes in header
        const walker = document.createTreeWalker(header, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
          const text = node.textContent.trim();
          if (text.match(/^\\+?[\\d\\s\\(\\)\\-]+$/) && text.length > 7) {
            node.textContent = '${newPhone}';
            console.log('[Serenity] Phone replaced (fallback)');
            return true;
          }
        }
      }

      return false;
    }
  `;
}

module.exports = { getPhoneReplacementCode };
