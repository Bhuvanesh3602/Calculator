const fs = require('fs');
const path = require('path');

const DOMAIN = (process.env.DOMAIN || 'https://calculator.bhuvanesh-s3602.workers.dev').replace(/\/$/, '');
const PUBLIC_DIR = path.join(__dirname, 'public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const ROBOTS_PATH = path.join(PUBLIC_DIR, 'robots.txt');

const today = new Date().toISOString().split('T')[0];

const HIGH_PRIORITY = new Set([
  'index.html', 'mortgage-calculator.html', 'loan-calculator.html', 'bmi-calculator.html',
  'calorie-calculator.html', 'scientific-calculator.html', 'tdee-calculator.html',
  'percent-calculator.html', 'age-calculator.html', 'interest-calculator.html',
  'fraction-calculator.html', 'basic-calculator.html', 'auto-loan-calculator.html',
  'credit-card-calculator.html', 'retirement-calculator.html', 'savings-calculator.html'
]);

const MEDIUM_PRIORITY = new Set([
  'financial-calculator.html', 'fitness-and-health-calculator.html', 'math-calculator.html',
  'other-calculator.html', 'amortization-calculator.html', 'investment-calculator.html',
  'currency-calculator.html', 'inflation-calculator.html', 'finance-calculator.html',
  'tax-calculator.html', 'compound-interest-calculator.html', 'salary-calculator.html',
  '401k-calculator.html', 'apr-calculator.html', 'fha-loan-calculator.html',
  'va-mortgage-calculator.html', 'heloc-calculator.html', 'refinance-calculator.html',
  'body-fat-calculator.html', 'bmr-calculator.html', 'macro-calculator.html',
  'ideal-weight-calculator.html', 'pace-calculator.html', 'pregnancy-calculator.html',
  'due-date-calculator.html', 'triangle-calculator.html', 'volume-calculator.html',
  'standard-deviation-calculator.html', 'random-number-generator.html', 'password-generator.html',
  'ip-subnet-calculator.html', 'conversion-calculator.html'
]);

const LOW_PRIORITY = new Set([
  'about-us.html', 'sitemap.html', 'calculators-for-your-site.html'
]);

// Read all html files in public
const files = fs.readdirSync(PUBLIC_DIR)
  .filter(f => f.endsWith('.html'))
  .sort();

function getLastmod(file) {
  try {
    const stat = fs.statSync(path.join(PUBLIC_DIR, file));
    return stat.mtime.toISOString().split('T')[0];
  } catch (e) {
    return today;
  }
}

function priorityFor(file) {
  if (file === 'index.html') return '1.0';
  if (HIGH_PRIORITY.has(file)) return '0.9';
  if (MEDIUM_PRIORITY.has(file)) return '0.7';
  if (LOW_PRIORITY.has(file)) return '0.3';
  return '0.6';
}

function changefreqFor(file) {
  if (file === 'index.html') return 'daily';
  if (HIGH_PRIORITY.has(file)) return 'weekly';
  if (MEDIUM_PRIORITY.has(file)) return 'monthly';
  return 'monthly';
}

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

for (const file of files) {
  const loc = `${DOMAIN}/${file}`;
  const lastmod = getLastmod(file);
  const changefreq = changefreqFor(file);
  const priority = priorityFor(file);

  xml += `  <url>\n`;
  xml += `    <loc>${loc}</loc>\n`;
  xml += `    <lastmod>${lastmod}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += `  </url>\n`;
}

xml += `</urlset>\n`;

fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
console.log(`Successfully generated ${SITEMAP_PATH} with ${files.length} URLs.`);

// robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml
`;
fs.writeFileSync(ROBOTS_PATH, robotsTxt, 'utf8');
console.log(`Successfully created ${ROBOTS_PATH}`);
