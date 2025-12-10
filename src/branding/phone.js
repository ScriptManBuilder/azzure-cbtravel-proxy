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
      // Target the header phone container
      const phoneContainer = document.querySelector('.Header-navMenu_left');
      if (phoneContainer) {
        // The phone number is a text node before the button
        const childNodes = phoneContainer.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
          const node = childNodes[i];
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().match(/^\\+?[\\d\\s\\(\\)\\-]+$/)) {
            node.textContent = '${newPhone}';
            console.log('[Serenity] Phone number replaced');
            return true;
          }
        }
      }
      return false;
    }
  `;
}

module.exports = { getPhoneReplacementCode };
