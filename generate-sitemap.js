const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://calculator.bhuvanesh-s3602.workers.dev';
const PUBLIC_DIR = path.join(__dirname, 'public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const ROBOTS_PATH = path.join(PUBLIC_DIR, 'robots.txt');

const today = new Date().toISOString().split('T')[0];

const HUB_PAGES = new Set([
  'financial-calculator.html',
  'fitness-and-health-calculator.html',
  'math-calculator.html',
  'other-calculator.html',
  'calculators-for-your-site.html'
]);

const LOW_PRIORITY = new Set([
  'about-us.html',
  'sitemap.html'
]);

// Read all html files in public
const files = fs.readdirSync(PUBLIC_DIR)
  .filter(f => f.endsWith('.html'))
  .sort();

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// 1. Root / homepage
xml += `  <url>\n`;
xml += `    <loc>${DOMAIN}/</loc>\n`;
xml += `    <lastmod>${today}</lastmod>\n`;
xml += `    <changefreq>daily</changefreq>\n`;
xml += `    <priority>1.0</priority>\n`;
xml += `  </url>\n`;

// 2. All other HTML files
for (const file of files) {
  if (file === 'index.html') continue; // already added as root

  let priority = '0.8';
  let changefreq = 'monthly';

  if (HUB_PAGES.has(file)) {
    priority = '0.9';
    changefreq = 'weekly';
  } else if (LOW_PRIORITY.has(file)) {
    priority = '0.5';
    changefreq = 'monthly';
  }

  xml += `  <url>\n`;
  xml += `    <loc>${DOMAIN}/${file}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += `  </url>\n`;
}

xml += `</urlset>\n`;

fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
console.log(`Successfully generated ${SITEMAP_PATH} with ${files.length} URLs (including homepage).`);

// Also create/update robots.txt to point to sitemap.xml
const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}/sitemap.xml\n`;
fs.writeFileSync(ROBOTS_PATH, robotsTxt, 'utf8');
console.log(`Successfully created ${ROBOTS_PATH}`);
