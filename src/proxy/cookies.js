/**
 * Cookie management for proxy requests
 * Stores and forwards cookies between client and target
 */

// In-memory cookie storage
let targetCookies = {};

/**
 * Get cookies as a string for request headers
 * @returns {string} Cookie string in "key=value; key2=value2" format
 */
function getCookiesString() {
  return Object.entries(targetCookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

/**
 * Parse and store cookies from response Set-Cookie headers
 * @param {string|string[]} setCookieHeaders - Set-Cookie header(s) from response
 */
function parseCookies(setCookieHeaders) {
  if (!setCookieHeaders) return;

  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  cookies.forEach(cookie => {
    const [cookiePair] = cookie.split(';');
    const [key, value] = cookiePair.split('=');
    if (key && value) {
      targetCookies[key.trim()] = value.trim();
    }
  });
}

/**
 * Clear all stored cookies
 */
function clearCookies() {
  targetCookies = {};
}

/**
 * Get current cookie count
 * @returns {number}
 */
function getCookieCount() {
  return Object.keys(targetCookies).length;
}

module.exports = {
  getCookiesString,
  parseCookies,
  clearCookies,
  getCookieCount
};
