require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = (process.env.TARGET_URL || 'https://cbtravel.enjoymydeals.com').replace(/\/$/, '');

console.log('[Config] TARGET_URL:', TARGET_URL);
console.log('[Config] PORT:', PORT);

// Additional domains to proxy
const PROXY_DOMAINS = {
  'booking': 'https://booking.accessdevelopment.com',
  'static': 'https://static.accessdevelopment.com',
  'api': 'https://api.accessdevelopment.com'
};

// Branding configuration
const BRANDING = {
  name: process.env.BRAND_NAME || 'Serenity Travel',
  logoUrl: process.env.BRAND_LOGO_URL || '/assets/logo.png',
  primaryColor: process.env.BRAND_PRIMARY_COLOR || '#6366f1',
  secondaryColor: process.env.BRAND_SECONDARY_COLOR || '#4f46e5',
  faviconUrl: process.env.BRAND_FAVICON_URL || '/assets/favicon.ico',
  registrationCode: process.env.REGISTRATION_CODE || 'accessvip25'
};

// Middleware
app.use(compression());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets (for custom branding)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Store cookies from target site
let targetCookies = {};

// Helper function to get cookies string
function getCookiesString() {
  return Object.entries(targetCookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

// Helper function to parse and store cookies from response
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

// Rewrite HTML content with custom branding
function rewriteHtml(html, baseUrl) {
  const $ = cheerio.load(html);

  // Inject custom CSS for branding
  const customCSS = `
    <style id="serenity-branding">
      :root {
        --brand-primary: ${BRANDING.primaryColor};
        --brand-secondary: ${BRANDING.secondaryColor};
      }

      /* Override primary colors */
      .btn-primary, .bg-primary, [class*="btn-primary"] {
        background-color: var(--brand-primary) !important;
        border-color: var(--brand-primary) !important;
      }

      .text-primary, a.text-primary {
        color: var(--brand-primary) !important;
      }

      /* Auto-fill registration code styling */
      .registration-helper {
        background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        margin-bottom: 15px;
        font-size: 14px;
      }
    </style>
  `;

  $('head').append(customCSS);

  // Replace favicon
  $('link[rel="icon"], link[rel="shortcut icon"]').attr('href', BRANDING.faviconUrl);

  // Add favicon if not present
  if ($('link[rel="icon"]').length === 0) {
    $('head').append(`<link rel="icon" href="${BRANDING.faviconUrl}" type="image/x-icon">`);
  }

  // Update title with brand name
  const originalTitle = $('title').text();
  if (originalTitle && !originalTitle.includes(BRANDING.name)) {
    $('title').text(`${BRANDING.name} - ${originalTitle}`);
  }

  // Inject script for branding and auto-fill (handles SPA/dynamic content)
  const brandingScript = `
    <script id="serenity-branding-script">
      (function() {
        console.log('[Serenity] Branding script loaded');

        const BRANDING = {
          logoUrl: '${BRANDING.logoUrl}',
          brandName: '${BRANDING.name}',
          registrationCode: '${BRANDING.registrationCode}'
        };

        // List of known merchant/brand names to skip
        const MERCHANT_BRANDS = ['disney', 'amazon', 'walmart', 'target', 'costco', 'samsung',
          'ford', 'universal', 'six flags', 'knott', 'seaworld', 'legoland', 'papa john',
          'applebee', 'chuck e', 'auntie anne', 'kennedy space', 'kohl', 'dicks sporting',
          'san diego zoo', 'aquatica', 'bali bra', 'temu', 'take 5', 'aamco', 'lg partner'];

        // Check if image is a merchant logo (should not be replaced)
        function isMerchantLogo(img) {
          const alt = (img.alt || '').toLowerCase();
          const src = (img.src || '').toLowerCase();
          const parentText = (img.parentElement?.textContent || '').toLowerCase();

          return MERCHANT_BRANDS.some(brand =>
            alt.includes(brand) || src.includes(brand) || parentText.includes(brand + ' logo')
          );
        }

        // Replace ONLY the site header logo (not merchant/brand logos in content)
        function replaceLogo() {
          console.log('[Serenity] replaceLogo running');

          // ONLY target the specific header logo class used by this site
          const headerLogos = document.querySelectorAll('img.Header-main_logo');
          console.log('[Serenity] Found ' + headerLogos.length + ' header logos by class');

          headerLogos.forEach(img => {
            console.log('[Serenity] Header logo found:', img.className, img.src);
            if (img.dataset.serenityReplaced || img.src.includes('/assets/')) return;
            img.src = BRANDING.logoUrl;
            img.dataset.serenityReplaced = 'true';
            if (img.srcset) img.srcset = BRANDING.logoUrl;
            console.log('[Serenity] Replaced with:', BRANDING.logoUrl);
          });

          // On redirect pages, replace the Access platform logo (first box)
          if (window.location.pathname.includes('redirect')) {
            const pageText = document.body?.textContent?.toLowerCase() || '';
            if (pageText.includes('on your way to saving')) {
              // Find the Access logo specifically by looking for accessdevelopment.com in src
              document.querySelectorAll('img').forEach(img => {
                if (img.dataset.serenityReplaced || img.src.includes('/assets/')) return;
                const src = (img.src || '').toLowerCase();
                // Only replace if it's from accessdevelopment.com (the platform CDN)
                if (src.includes('accessdevelopment.com/program/logo') || src.includes('access') && !isMerchantLogo(img)) {
                  img.src = BRANDING.logoUrl;
                  img.dataset.serenityReplaced = 'true';
                }
              });
            }
          }

          // Update page title
          if (document.title && !document.title.includes(BRANDING.brandName)) {
            document.title = BRANDING.brandName + ' - ' + document.title;
          }
        }

        // Auto-fill registration code
        function autoFillRegistration() {
          const codeInputs = document.querySelectorAll('input[name*="code"], input[name*="Code"], input[name*="registration"], input[placeholder*="code"], input[placeholder*="Code"], input[id*="code"], input[id*="Code"]');
          codeInputs.forEach(input => {
            if (!input.value && !input.dataset.serenityFilled) {
              input.value = BRANDING.registrationCode;
              input.dataset.serenityFilled = 'true';
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });

          document.querySelectorAll('label').forEach(label => {
            const text = label.textContent.toLowerCase();
            if (text.includes('code') || text.includes('registration')) {
              const input = label.querySelector('input') ||
                           document.getElementById(label.getAttribute('for')) ||
                           label.nextElementSibling;
              if (input && input.tagName === 'INPUT' && !input.value && !input.dataset.serenityFilled) {
                input.value = BRANDING.registrationCode;
                input.dataset.serenityFilled = 'true';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          });
        }

        function applyBranding() {
          replaceLogo();
          autoFillRegistration();
        }

        // Initial run
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', applyBranding);
        } else {
          applyBranding();
        }

        // Multiple timeouts for SPA content
        [100, 300, 500, 1000, 2000, 3000, 5000].forEach(t => setTimeout(applyBranding, t));

        // MutationObserver for dynamic content
        function startObserver() {
          if (document.body) {
            const observer = new MutationObserver(applyBranding);
            observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['src', 'srcset']
            });
          } else {
            setTimeout(startObserver, 50);
          }
        }
        startObserver();
      })();
    </script>
  `;

  $('head').append(brandingScript);

  // Rewrite all absolute URLs to go through proxy
  $('a[href]').each((_, el) => {
    let href = $(el).attr('href');
    if (href) {
      if (href.startsWith(TARGET_URL)) {
        $(el).attr('href', href.replace(TARGET_URL, ''));
      }
      // Rewrite accessdevelopment.com URLs to go through our proxy
      if (href.includes('booking.accessdevelopment.com')) {
        $(el).attr('href', href.replace('https://booking.accessdevelopment.com', '/_proxy/booking'));
      }
      if (href.includes('static.accessdevelopment.com')) {
        $(el).attr('href', href.replace('https://static.accessdevelopment.com', '/_proxy/static'));
      }
    }
  });

  $('form[action]').each((_, el) => {
    let action = $(el).attr('action');
    if (action) {
      if (action.startsWith(TARGET_URL)) {
        $(el).attr('action', action.replace(TARGET_URL, ''));
      }
      if (action.includes('booking.accessdevelopment.com')) {
        $(el).attr('action', action.replace('https://booking.accessdevelopment.com', '/_proxy/booking'));
      }
    }
  });

  // Rewrite image and resource URLs
  $('img[src], script[src], link[href], iframe[src]').each((_, el) => {
    const attr = el.tagName === 'link' ? 'href' : 'src';
    let value = $(el).attr(attr);
    if (value) {
      if (value.startsWith(TARGET_URL)) {
        $(el).attr(attr, value.replace(TARGET_URL, ''));
      }
      if (value.includes('booking.accessdevelopment.com')) {
        $(el).attr(attr, value.replace('https://booking.accessdevelopment.com', '/_proxy/booking'));
      }
      if (value.includes('static.accessdevelopment.com')) {
        $(el).attr(attr, value.replace('https://static.accessdevelopment.com', '/_proxy/static'));
      }
    }
  });

  return $.html();
}

// Rewrite CSS content
function rewriteCss(css) {
  let result = css.replace(new RegExp(TARGET_URL, 'g'), '');
  result = result.replace(/https:\/\/booking\.accessdevelopment\.com/g, '/_proxy/booking');
  result = result.replace(/https:\/\/static\.accessdevelopment\.com/g, '/_proxy/static');
  return result;
}

// Rewrite JavaScript content
function rewriteJs(js) {
  let result = js.replace(new RegExp(TARGET_URL, 'g'), '');
  result = result.replace(/https:\/\/booking\.accessdevelopment\.com/g, '/_proxy/booking');
  result = result.replace(/https:\/\/static\.accessdevelopment\.com/g, '/_proxy/static');
  return result;
}

// Proxy handler for accessdevelopment.com subdomains
async function proxySubdomain(req, res, targetBase) {
  const targetPath = req.originalUrl.replace(/^\/_proxy\/[^\/]+/, '');
  const targetFullUrl = `${targetBase}${targetPath}`;

  try {
    const axiosConfig = {
      method: req.method,
      url: targetFullUrl,
      headers: {
        ...req.headers,
        host: new URL(targetBase).host,
        origin: targetBase,
        referer: targetBase,
        cookie: getCookiesString()
      },
      data: req.method !== 'GET' ? req.body : undefined,
      responseType: 'arraybuffer',
      maxRedirects: 5,
      validateStatus: status => status < 500
    };

    delete axiosConfig.headers['accept-encoding'];
    delete axiosConfig.headers['content-length'];

    const response = await axios(axiosConfig);

    // Handle cookies
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

    // Handle redirects within the subdomain
    if (response.status === 301 || response.status === 302) {
      let location = response.headers.location;
      if (location) {
        // Rewrite redirect URLs
        if (location.includes('booking.accessdevelopment.com')) {
          location = location.replace('https://booking.accessdevelopment.com', '/_proxy/booking');
        }
        if (location.includes('static.accessdevelopment.com')) {
          location = location.replace('https://static.accessdevelopment.com', '/_proxy/static');
        }
      }
      return res.redirect(response.status, location);
    }

    const contentType = response.headers['content-type'] || '';
    let content = response.data;

    // Rewrite URLs in HTML/JS/CSS responses
    if (contentType.includes('text/html') || contentType.includes('javascript') || contentType.includes('text/css')) {
      content = content.toString('utf-8');
      content = content.replace(/https:\/\/booking\.accessdevelopment\.com/g, '/_proxy/booking');
      content = content.replace(/https:\/\/static\.accessdevelopment\.com/g, '/_proxy/static');
    }

    res.set('Content-Type', contentType);
    if (response.headers['cache-control']) {
      res.set('Cache-Control', response.headers['cache-control']);
    }

    res.status(response.status).send(content);
  } catch (error) {
    console.error('Subdomain proxy error:', error.message);
    res.status(500).json({ error: 'Proxy Error', message: error.message });
  }
}

// Route for booking subdomain
app.all('/_proxy/booking/*', (req, res) => {
  proxySubdomain(req, res, PROXY_DOMAINS.booking);
});
app.all('/_proxy/booking', (req, res) => {
  proxySubdomain(req, res, PROXY_DOMAINS.booking);
});

// Route for static subdomain
app.all('/_proxy/static/*', (req, res) => {
  proxySubdomain(req, res, PROXY_DOMAINS.static);
});
app.all('/_proxy/static', (req, res) => {
  proxySubdomain(req, res, PROXY_DOMAINS.static);
});

// Main proxy handler
app.all('*', async (req, res) => {
  const targetPath = req.originalUrl;
  const targetFullUrl = `${TARGET_URL}${targetPath}`;

  console.log(`[Proxy] ${req.method} ${targetFullUrl}`);

  try {
    // Build clean headers - only forward safe headers
    const proxyHeaders = {
      'host': new URL(TARGET_URL).host,
      'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'accept': req.headers['accept'] || '*/*',
      'accept-language': req.headers['accept-language'] || 'en-US,en;q=0.9',
      'cookie': getCookiesString() || req.headers['cookie'] || '',
      'origin': TARGET_URL,
      'referer': TARGET_URL
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
      validateStatus: status => status < 400 || status === 302 || status === 301
    };

    const response = await axios(axiosConfig);

    // Handle cookies from response
    parseCookies(response.headers['set-cookie']);

    // Forward cookies to client
    if (response.headers['set-cookie']) {
      const cookies = Array.isArray(response.headers['set-cookie'])
        ? response.headers['set-cookie']
        : [response.headers['set-cookie']];

      cookies.forEach(cookie => {
        // Modify cookie domain and path for our proxy
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
      if (location && location.startsWith(TARGET_URL)) {
        location = location.replace(TARGET_URL, '');
      }
      return res.redirect(response.status, location);
    }

    // Get content type
    const contentType = response.headers['content-type'] || '';

    // Convert buffer to string for text content
    let content = response.data;

    if (contentType.includes('text/html')) {
      content = rewriteHtml(content.toString('utf-8'), TARGET_URL);
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

    // Set other headers
    if (response.headers['cache-control']) {
      res.set('Cache-Control', response.headers['cache-control']);
    }

    res.status(response.status).send(content);

  } catch (error) {
    console.error(`[Proxy Error] ${targetPath}:`, error.message);
    if (error.code) console.error(`[Proxy Error] Code:`, error.code);

    if (error.response) {
      // Forward error response from target
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
});

// Start server - bind to 0.0.0.0 for Railway compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CBTravel Proxy Server running on port ${PORT}`);
  console.log(`📍 Proxying: ${TARGET_URL}`);
  console.log(`🏷️  Brand: ${BRANDING.name}`);
  console.log(`🔑 Registration Code: ${BRANDING.registrationCode}`);
});
