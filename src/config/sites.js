/**
 * Site type definitions
 * Each site type maps to a specific category on the target website
 *
 * Site types (matching brand table):
 * 1 = VIP Perks (Lifestyle/Premium)
 * 2 = Cruises & Tours
 * 3 = Shopping (Retail)
 * 4 = Health & Wellness
 * 5 = Home & Garden (Family)
 */

module.exports = {
  1: {
    name: 'VIP Perks',
    defaultPath: '/',
    filter: null,
    defaultColor: '#6366f1'
  },
  2: {
    name: 'Cruises & Tours',
    defaultPath: '/deals',
    filter: {
      categoryName: 'Cruises & Tours'
    },
    defaultColor: '#3b82f6'
  },
  3: {
    name: 'Shopping',
    defaultPath: '/deals',
    filter: {
      categoryName: 'Shopping'
    },
    defaultColor: '#10b981'
  },
  4: {
    name: 'Health & Wellness',
    defaultPath: '/deals',
    filter: {
      categoryName: 'Health & Beauty'
    },
    defaultColor: '#ef4444'
  },
  5: {
    name: 'Home & Garden',
    defaultPath: '/deals',
    filter: {
      categoryName: 'Home & Garden'
    },
    defaultColor: '#f59e0b'
  }
};
