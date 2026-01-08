/**
 * Generate client-side branding script
 */

const config = require('../config');
const { getPhoneReplacementCode } = require('./phone');

/**
 * Generate the full branding script for injection into HTML
 * @returns {string} JavaScript code
 */
function generateBrandingScript() {
  const phoneCode = getPhoneReplacementCode(config.brandPhone);

  return `
    (function() {
      console.log('[Serenity] Branding script loaded');

      const BRANDING = {
        logoUrl: '${config.brandLogo}',
        logoSvg: \`${config.brandLogoSvg.replace(/`/g, '\\`')}\`,
        brandName: '${config.siteName}',
        registrationCode: '${config.registrationCode}',
        brandColor: '${config.brandColor}',
        phone: '${config.brandPhone}',
        siteType: ${config.siteType},
        siteFilter: ${JSON.stringify(config.siteFilter)}
      };

      // Phone replacement function
      ${phoneCode}

      // Force override CSS variables
      function overrideColors() {
        document.documentElement.style.setProperty('--program_color', BRANDING.brandColor, 'important');
        document.body?.style.setProperty('--program_color', BRANDING.brandColor, 'important');

        // Find and override elements with program_color gradient
        document.querySelectorAll('[style]').forEach(el => {
          const style = el.getAttribute('style') || '';
          if (style.includes('program_color') && style.includes('radial-gradient')) {
            el.style.background = 'radial-gradient(circle, ' + BRANDING.brandColor + ' 40%, color-mix(in srgb, ' + BRANDING.brandColor + ' 80%, white) 100%)';
          }
        });
      }

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

      // Create branded logo element (SVG/PNG + name)
      function createBrandedLogo() {
        const container = document.createElement('div');
        container.className = 'serenity-logo';
        container.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;text-decoration:none;';

        // Logo icon (SVG or PNG)
        if (BRANDING.logoSvg) {
          // Inline SVG
          const svgWrapper = document.createElement('span');
          svgWrapper.innerHTML = BRANDING.logoSvg;
          const svg = svgWrapper.querySelector('svg');
          if (svg) {
            svg.style.cssText = 'width:32px;height:32px;color:' + BRANDING.brandColor + ';fill:' + BRANDING.brandColor + ';';
          }
          container.appendChild(svgWrapper);
        } else {
          // PNG/image fallback
          const img = document.createElement('img');
          img.src = BRANDING.logoUrl;
          img.alt = BRANDING.brandName;
          img.style.cssText = 'width:32px;height:32px;object-fit:contain;';
          container.appendChild(img);
        }

        // Brand name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = BRANDING.brandName;
        nameSpan.style.cssText = 'font-weight:700;font-size:18px;color:' + BRANDING.brandColor + ';white-space:nowrap;text-decoration:none;';

        container.appendChild(nameSpan);
        container.onclick = () => window.location.href = '/';

        return container;
      }

      // Replace ONLY the site header logo (not merchant/brand logos in content)
      function replaceLogo() {
        // Desktop header logo
        const headerLogos = document.querySelectorAll('img.Header-main_logo');
        headerLogos.forEach(img => {
          if (img.dataset.serenityReplaced) return;
          img.dataset.serenityReplaced = 'true';

          const brandedLogo = createBrandedLogo();
          img.parentElement.replaceChild(brandedLogo, img);
        });

        // Mobile header logo (inside MMRHeader button)
        const mobileLogos = document.querySelectorAll('.App-header .MMRHeader button img, .MMRHeader img');
        mobileLogos.forEach(img => {
          if (img.dataset.serenityReplaced) return;
          const src = (img.src || '').toLowerCase();
          if (src.includes('accessdevelopment.com') || src.includes('program/logo')) {
            img.dataset.serenityReplaced = 'true';

            const brandedLogo = createBrandedLogo();
            brandedLogo.querySelector('svg').style.width = '24px';
            brandedLogo.querySelector('svg').style.height = '24px';
            brandedLogo.querySelector('span:last-child').style.fontSize = '14px';
            img.parentElement.replaceChild(brandedLogo, img);
          }
        });

        // On redirect pages, replace the Access platform logo
        if (window.location.pathname.includes('redirect')) {
          const pageText = document.body?.textContent?.toLowerCase() || '';
          if (pageText.includes('on your way to saving')) {
            document.querySelectorAll('img').forEach(img => {
              if (img.dataset.serenityReplaced) return;
              const src = (img.src || '').toLowerCase();
              if ((src.includes('accessdevelopment.com/program/logo') || src.includes('access')) && !isMerchantLogo(img)) {
                img.dataset.serenityReplaced = 'true';

                const brandedLogo = createBrandedLogo();
                img.parentElement.replaceChild(brandedLogo, img);
              }
            });
          }
        }

        // Update page title
        document.title = BRANDING.brandName;
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

      // Apply category filter for site types 2-5
      function applyCategoryFilter() {
        if (!BRANDING.siteFilter || !BRANDING.siteFilter.categoryName) return;
        if (window.serenityCategoryApplied) return;

        const categoryName = BRANDING.siteFilter.categoryName;

        // Find checkbox by name attribute in sidebar filter
        const checkbox = document.querySelector('input[type="checkbox"][name="' + categoryName + '"]');

        if (checkbox && !checkbox.checked) {
          checkbox.click();
          window.serenityCategoryApplied = true;
          console.log('[Serenity] Category filter applied:', categoryName);
        } else if (checkbox && checkbox.checked) {
          window.serenityCategoryApplied = true;
          console.log('[Serenity] Category already selected:', categoryName);
        } else {
          console.log('[Serenity] Category checkbox not found:', categoryName);
        }
      }

      function applyBranding() {
        overrideColors();
        replaceLogo();
        replacePhoneNumber();
        autoFillRegistration();
        applyCategoryFilter();
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
          const observer = new MutationObserver(() => {
            applyBranding();
            // Extra aggressive phone replacement for dynamic content
            replacePhoneNumber();
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'srcset'],
            characterData: true  // Also watch for text changes
          });
        } else {
          setTimeout(startObserver, 50);
        }
      }
      startObserver();

      // Extra aggressive phone replacement - run every 2 seconds for first minute
      let phoneCheckCount = 0;
      const phoneInterval = setInterval(() => {
        replacePhoneNumber();
        phoneCheckCount++;
        if (phoneCheckCount > 30) {  // Stop after 60 seconds
          clearInterval(phoneInterval);
        }
      }, 2000);
    })();
  `;
}

module.exports = { generateBrandingScript };
