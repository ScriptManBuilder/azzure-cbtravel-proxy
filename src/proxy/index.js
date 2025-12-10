/**
 * Main proxy handler
 * Forwards requests to target URL and processes responses
 */

const axios = require('axios');
const https = require('https');
const config = require('../config');
const { getCookiesString, parseCookies } = require('./cookies');
const { rewriteHtml, rewriteCss, rewriteJs } = require('../rewriters');

// Create HTTPS agent with larger max header size (target has ~32KB headers)
const httpsAgent = new https.Agent({
  maxHeaderSize: 81920
});

/**
 * Main proxy request handler
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
async function handleProxy(req, res) {
  const targetPath = req.originalUrl;
  const targetFullUrl = `${config.targetUrl}${targetPath}`;

  console.log(`[PROXY] ${req.method} ${targetPath}`);

  try {
    // Build clean headers - only forward safe headers
    const proxyHeaders = {
      'host': new URL(config.targetUrl).host,
      'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'accept': req.headers['accept'] || '*/*',
      'accept-language': req.headers['accept-language'] || 'en-US,en;q=0.9',
      'cookie': getCookiesString() || req.headers['cookie'] || '',
      'origin': config.targetUrl,
      'referer': config.targetUrl
    };

    // Forward the request to target
    const axiosConfig = {
      method: req.method,
      url: targetFullUrl,
      headers: proxyHeaders,
      data: req.method !== 'GET' ? req.body : undefined,
      responseType: 'arraybuffer',
      maxRedirects: 0,
      timeout: 30000,
      validateStatus: status => status < 400 || status === 302 || status === 301,
      httpsAgent: httpsAgent
    };

    const response = await axios(axiosConfig);

    console.log(`[PROXY] Response: ${response.status} ${response.headers['content-type']} (${response.data?.length || 0} bytes)`);

    // Handle cookies from response
    parseCookies(response.headers['set-cookie']);

    // Forward cookies to client
    if (response.headers['set-cookie']) {
      const cookies = Array.isArray(response.headers['set-cookie'])
        ? response.headers['set-cookie']
        : [response.headers['set-cookie']];

      cookies.forEach(cookie => {
        const modifiedCookie = cookie
          .replace(/domain=[^;]+;?/gi, '')
          .replace(/secure;?/gi, '')
          .replace(/samesite=[^;]+;?/gi, 'SameSite=Lax;');
        res.append('Set-Cookie', modifiedCookie);
      });
    }

    // Handle redirects
    if (response.status === 301 || response.status === 302) {
      let location = response.headers.location;
      if (location && location.startsWith(config.targetUrl)) {
        location = location.replace(config.targetUrl, '');
      }
      return res.redirect(response.status, location);
    }

    // Get content type
    const contentType = response.headers['content-type'] || '';

    // Convert buffer to string for text content
    let content = response.data;

    if (contentType.includes('text/html')) {
      content = rewriteHtml(content.toString('utf-8'), targetPath);
      res.set('Content-Type', 'text/html; charset=utf-8');
    } else if (contentType.includes('text/css')) {
      content = rewriteCss(content.toString('utf-8'));
      res.set('Content-Type', 'text/css; charset=utf-8');
    } else if (contentType.includes('javascript')) {
      content = rewriteJs(content.toString('utf-8'));
      res.set('Content-Type', contentType);
    } else {
      // For binary content, pass through as-is
      res.set('Content-Type', contentType);
    }

    // Set other headers (but NOT Content-Security-Policy which breaks proxy)
    if (response.headers['cache-control']) {
      res.set('Cache-Control', response.headers['cache-control']);
    }

    // Remove CSP header - it blocks resources when accessed through proxy
    // Do NOT forward: content-security-policy, x-frame-options

    res.status(response.status).send(content);

  } catch (error) {
    console.error(`[Proxy Error] ${targetPath}:`, error.message);
    if (error.code) console.error(`[Proxy Error] Code:`, error.code);

    if (error.response) {
      console.error(`[Proxy Error] Status:`, error.response.status);
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(502).json({
        error: 'Proxy Error',
        message: 'Failed to fetch from target server',
        details: error.message,
        code: error.code,
        target: targetFullUrl
      });
    }
  }
}

module.exports = { handleProxy };
