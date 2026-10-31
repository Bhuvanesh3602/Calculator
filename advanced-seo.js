/**
 * advanced-seo.js — Advanced SEO injection for Calculator clone.
 * Adds breadcrumbs (HTML + JSON-LD), FAQ schema, internal linking,
 * preconnect/preload, hreflang, and performance meta to all pages.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const SITE_URL = (process.env.SITE_URL || 'https://calculator.bhuvanesh-s3602.workers.dev').replace(/\/$/, '');

const SKIP = new Set(['sitemap.html', 'about-us.html', 'robots.txt']);

function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function stripTags(s) { return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

// Category -> parent hub mapping
const HUB_OF = {
  'mortgage-calculator':'financial-calculator','loan-calculator':'financial-calculator','auto-loan-calculator':'financial-calculator',
  'interest-calculator':'financial-calculator','payment-calculator':'financial-calculator','retirement-calculator':'financial-calculator',
  'amortization-calculator':'financial-calculator','investment-calculator':'financial-calculator','currency-calculator':'financial-calculator',
  'inflation-calculator':'financial-calculator','finance-calculator':'financial-calculator','mortgage-payoff-calculator':'financial-calculator',
  'tax-calculator':'financial-calculator','compound-interest-calculator':'financial-calculator','salary-calculator':'financial-calculator',
  '401k-calculator':'financial-calculator','interest-rate-calculator':'financial-calculator','sales-tax-calculator':'financial-calculator',
  'apr-calculator':'financial-calculator','fha-loan-calculator':'financial-calculator','va-mortgage-calculator':'financial-calculator',
  'heloc-calculator':'financial-calculator','refinance-calculator':'financial-calculator','business-loan-calculator':'financial-calculator',
  'personal-loan-calculator':'financial-calculator','student-loan-calculator':'financial-calculator','home-equity-loan-calculator':'financial-calculator',
  'bmi-calculator':'fitness-and-health-calculator','calorie-calculator':'fitness-and-health-calculator','body-fat-calculator':'fitness-and-health-calculator',
  'bmr-calculator':'fitness-and-health-calculator','macro-calculator':'fitness-and-health-calculator','ideal-weight-calculator':'fitness-and-health-calculator',
  'pace-calculator':'fitness-and-health-calculator','pregnancy-calculator':'fitness-and-health-calculator','pregnancy-conception-calculator':'fitness-and-health-calculator',
  'due-date-calculator':'fitness-and-health-calculator','tdee-calculator':'fitness-and-health-calculator','healthy-weight-calculator':'fitness-and-health-calculator',
  'overweight-calculator':'fitness-and-health-calculator','army-body-fat-calculator':'fitness-and-health-calculator','bac-calculator':'fitness-and-health-calculator',
  'sleep-calculator':'fitness-and-health-calculator','ovulation-calculator':'fitness-and-health-calculator','conception-calculator':'fitness-and-health-calculator',
  'scientific-calculator':'math-calculator','fraction-calculator':'math-calculator','percent-calculator':'math-calculator',
  'triangle-calculator':'math-calculator','volume-calculator':'math-calculator','standard-deviation-calculator':'math-calculator',
  'random-number-generator':'math-calculator','basic-calculator':'math-calculator','big-number-calculator':'math-calculator',
  'binary-calculator':'math-calculator','hex-calculator':'math-calculator','quadratic-formula-calculator':'math-calculator',
  'slope-calculator':'math-calculator','log-calculator':'math-calculator','area-calculator':'math-calculator','probability-calculator':'math-calculator',
  'statistics-calculator':'math-calculator','matrix-calculator':'math-calculator','pythagorean-theorem-calculator':'math-calculator',
  'exponent-calculator':'math-calculator','factor-calculator':'math-calculator','gcf-calculator':'math-calculator','lcm-calculator':'math-calculator',
  'rounding-calculator':'math-calculator','root-calculator':'math-calculator','prime-factorization-calculator':'math-calculator',
  'permutation-and-combination-calculator':'math-calculator','roman-numeral-converter':'math-calculator','scientific-notation-calculator':'math-calculator',
  'z-score-calculator':'math-calculator','average-calculator':'math-calculator','molarity-calculator':'math-calculator','molecular-weight-calculator':'math-calculator',
  'confidence-interval-calculator':'math-calculator','ratio-calculator':'math-calculator','distance-calculator':'math-calculator','circle-calculator':'math-calculator',
  'surface-area-calculator':'math-calculator','right-triangle-calculator':'math-calculator','p-value-calculator':'math-calculator',
  'long-division-calculator':'math-calculator','simple-interest-calculator':'math-calculator','bond-calculator':'math-calculator',
  'speed-calculator':'other-calculator','age-calculator':'other-calculator','date-calculator':'other-calculator','time-calculator':'other-calculator',
  'hours-calculator':'other-calculator','gpa-calculator':'other-calculator','grade-calculator':'other-calculator','height-calculator':'other-calculator',
  'concrete-calculator':'other-calculator','ip-subnet-calculator':'other-calculator','password-generator':'other-calculator','conversion-calculator':'other-calculator',
  'fuel-cost-calculator':'other-calculator','voltage-drop-calculator':'other-calculator','square-footage-calculator':'other-calculator','time-zone-calculator':'other-calculator',
  'dice-roller':'other-calculator','shoe-size-conversion':'other-calculator','tip-calculator':'other-calculator','love-calculator':'other-calculator',
  'resistor-calculator':'other-calculator','ohms-law-calculator':'other-calculator','electricity-calculator':'other-calculator','mileage-calculator':'other-calculator',
  'gas-mileage-calculator':'other-calculator','horsepower-calculator':'other-calculator','engine-horsepower-calculator':'other-calculator',
  'golf-handicap-calculator':'other-calculator','half-life-calculator':'other-calculator','bandwidth-calculator':'other-calculator',
  'base64-encode-decode':'other-calculator','url-encode-decode':'other-calculator','color-calculator':'other-calculator',
  'cd-calculator':'financial-calculator','ira-calculator':'financial-calculator','roth-ira-calculator':'financial-calculator',
  'vat-calculator':'financial-calculator','credit-card-calculator':'financial-calculator','rent-calculator':'financial-calculator',
  'rent-vs-buy-calculator':'financial-calculator','rental-property-calculator':'financial-calculator','roi-calculator':'financial-calculator',
  'depreciation-calculator':'financial-calculator','budget-calculator':'financial-calculator','take-home-pay-calculator':'financial-calculator',
  'social-security-calculator':'financial-calculator','pension-calculator':'financial-calculator','estate-tax-calculator':'financial-calculator',
  'annuity-calculator':'financial-calculator','annuity-payout-calculator':'financial-calculator','credit-card-payoff-calculator':'financial-calculator',
  'debt-payoff-calculator':'financial-calculator','debt-consolidation-calculator':'financial-calculator','repayment-calculator':'financial-calculator',
  'business-loan-calculator':'financial-calculator','auto-lease-calculator':'financial-calculator','lease-calculator':'financial-calculator',
  'boat-loan-calculator':'financial-calculator','canadian-mortgage-calculator':'financial-calculator','mortgage-calculator-uk':'financial-calculator',
  'mortgage-amortization-calculator':'financial-calculator','house-affordability-calculator':'financial-calculator','down-payment-calculator':'financial-calculator',
  'payback-period-calculator':'financial-calculator','present-value-calculator':'financial-calculator','future-value-calculator':'financial-calculator',
  'rmd-calculator':'financial-calculator','gdp-calculator':'financial-calculator','margin-calculator':'financial-calculator',
  'average-return-calculator':'financial-calculator','discount-calculator':'percent-calculator','percent-off-calculator':'percent-calculator',
  'discount-calculator':'percent-calculator','irr-calculator':'financial-calculator','cash-back-or-low-interest-calculator':'financial-calculator',
  'commission-calculator':'financial-calculator','college-cost-calculator':'financial-calculator','gfr-calculator':'fitness-and-health-calculator',
  'body-type-calculator':'fitness-and-health-calculator','body-surface-area-calculator':'fitness-and-health-calculator','carbohydrate-calculator':'fitness-and-health-calculator',
  'lean-body-mass-calculator':'fitness-and-health-calculator','calories-burned-calculator':'fitness-and-health-calculator','protein-calculator':'fitness-and-health-calculator',
  'fat-intake-calculator':'fitness-and-health-calculator','anorexic-bmi-calculator':'fitness-and-health-calculator','target-heart-rate-calculator':'fitness-and-health-calculator',
  'pregnancy-weight-gain-calculator':'fitness-and-health-calculator','one-rep-max-calculator':'fitness-and-health-calculator',
  'resistor-calculator':'other-calculator','btu-calculator':'other-calculator','heat-index-calculator':'other-calculator','dew-point-calculator':'other-calculator',
  'wind-chill-calculator':'other-calculator','stair-calculator':'other-calculator','roofing-calculator':'other-calculator','tile-calculator':'other-calculator',
  'mulch-calculator':'other-calculator','gravel-calculator':'other-calculator','tire-size-calculator':'other-calculator',
};

function categorize(slug) {
  if (/mortgage|loan|tax|investment|credit|rent|salary|401k|ira|apr|refinance|business|debt|annuity|vat|payback|margin|irr/.test(slug)) return 'Financial';
  if (/bmi|calorie|body-fat|bmr|macro|ideal-weight|pace|pregnancy|due-date|tdee|healthy-weight|overweight|army-body-fat|bac|sleep|ovulation|conception|gfr|body-type|body-surface-area|carbohydrate|lean-body-mass|calories-burned|protein|fat-intake|anorexic-bmi|target-heart-rate|pregnancy-weight-gain|one-rep-max/.test(slug)) return 'Fitness & Health';
  if (/scientific|fraction|percent|triangle|volume|standard-deviation|random-number|basic-calculator|big-number|binary|hex|quadratic|slope|log|area|probability|statistics|matrix|pythagorean|exponent|factor|gcf|lcm|rounding|root|prime-factorization|permutation|roman-numeral|scientific-notation|z-score|average|molarity|molecular-weight|confidence-interval|ratio|distance|circle|surface-area|right-triangle|p-value|long-division|simple-interest|bond/.test(slug)) return 'Math';
  return 'Other';
}

function titleCase(s) {
  return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html') && !SKIP.has(f)).sort();

let processed = 0;
for (const file of files) {
  const fp = path.join(PUBLIC_DIR, file);
  let html = fs.readFileSync(fp, 'utf8');
  const orig = html;

  const slug = file.replace(/\.html$/, '');
  const category = categorize(slug);
  const hub = HUB_OF[slug] || (category === 'Financial' ? 'financial-calculator' : category === 'Fitness & Health' ? 'fitness-and-health-calculator' : category === 'Math' ? 'math-calculator' : 'other-calculator');

  // Title
  let title = '';
  const mt = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (mt) title = stripTags(mt[1]);
  if (!title) {
    const mh = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (mh) title = stripTags(mh[1]);
  }
  if (!title) title = titleCase(slug);

  // Description
  let desc = '';
  const md = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (md) desc = md[1];
  if (!desc) desc = title + ' - Free online calculator.';

  const url = SITE_URL + '/' + file;

  // --- Breadcrumb HTML ---
  let breadcrumbHtml = '';
  if (!/<nav id="breadcrumbs"/i.test(html) && !/<div id="breadcrumbs"/i.test(html)) {
    breadcrumbHtml = '\n<nav id="breadcrumbs" aria-label="Breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">\n'
      + '  <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">\n'
      + '    <a href="/" itemprop="item"><span itemprop="name">Home</span></a><meta itemprop="position" content="1" />\n'
      + '  </span> / \n'
      + '  <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">\n'
      + '    <a href="/' + hub + '.html" itemprop="item"><span itemprop="name">' + category + '</span></a><meta itemprop="position" content="2" />\n'
      + '  </span> / \n'
      + '  <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">\n'
      + '    <span itemprop="name">' + esc(title) + '</span><meta itemprop="position" content="3" />\n'
      + '  </span>\n'
      + '</nav>\n';
  }

  // --- JSON-LD WebApplication ---
  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': title,
    'url': url,
    'description': desc,
    'applicationCategory': 'UtilitiesApplication',
    'applicationSubCategory': 'Calculator',
    'operatingSystem': 'Any (web browser)',
    'browserRequirements': 'Requires JavaScript',
    'inLanguage': 'en',
    'isAccessibleForFree': true,
    'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
    'publisher': { '@type': 'Organization', 'name': 'Calculator', 'url': SITE_URL },
    'category': category
  };

  // --- JSON-LD BreadcrumbList ---
  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_URL + '/' },
      { '@type': 'ListItem', 'position': 2, 'name': category, 'item': SITE_URL + '/' + hub + '.html' },
      { '@type': 'ListItem', 'position': 3, 'name': title, 'item': url }
    ]
  };

  // Remove existing JSON-LD WebApplication/BreadcrumbList to avoid duplicates
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?"@type"\s*:\s*"WebApplication"[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?"@type"\s*:\s*"BreadcrumbList"[\s\S]*?<\/script>/gi, '');

  // Insert breadcrumb HTML after <h1> if present
  if (breadcrumbHtml) {
    const h1m = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
    if (h1m) {
      html = html.split(h1m[0]).join(h1m[0] + breadcrumbHtml);
    }
  }

  // Insert JSON-LD before </head>
  const jsonld = '\n<script type="application/ld+json">' + JSON.stringify(webApp) + '</script>\n'
    + '<script type="application/ld+json">' + JSON.stringify(breadcrumbJson) + '</script>';
  html = html.replace(/<\/head>/i, jsonld + '</head>');

  // --- hreflang alternates ---
  if (!/<link rel="alternate" hreflang/i.test(html)) {
    const hreflang = '\n<link rel="alternate" hreflang="en" href="' + escAttr(url) + '">\n'
      + '<link rel="alternate" hreflang="x-default" href="' + escAttr(url) + '">';
    html = html.replace(/<\/head>/i, hreflang + '</head>');
  }

  // --- theme-color ---
  if (!/<meta name="theme-color"/i.test(html)) {
    html = html.replace(/<\/head>/i, '<meta name="theme-color" content="#1a5fb4">\n</head>');
  }

  // --- preload critical CSS ---
  if (!/<link rel="preload" href="\/style\.css"/i.test(html)) {
    html = html.replace(/<link rel="stylesheet" href="\/style\.css"/i, '<link rel="preload" href="/style.css" as="style">\n<link rel="stylesheet" href="/style.css">');
  }

  // --- preconnect for assets ---
  if (!/<link rel="preconnect"/i.test(html)) {
    html = html.replace(/<\/head>/i, '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n</head>');
  }

  if (html !== orig) {
    fs.writeFileSync(fp, html, 'utf8');
    processed++;
  }
}

console.log('Advanced SEO injected into ' + processed + ' of ' + files.length + ' pages.');
