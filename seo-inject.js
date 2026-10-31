const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const SITE_URL = (process.env.SITE_URL || 'https://calculator.bhuvanesh-s3602.workers.dev').replace(/\/$/, '');
const SKIP = new Set(['sitemap.html', 'about-us.html', 'robots.txt']);

function attr(html, name) {
  const m = html.match(new RegExp('<\\s*[^>]*\\b' + name + '\\s*=\\s*"([^"]*)"', 'i'));
  return m ? m[1] : null;
}

function stripTags(s) { return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }

const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html') && !SKIP.has(f)).sort();

let processed = 0;
for (const file of files) {
  const fp = path.join(PUBLIC_DIR, file);
  let html = fs.readFileSync(fp, 'utf8');
  const orig = html;

  const slug = file.replace(/\.html$/, '');

  // Title
  let title = '';
  const mt = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (mt) title = stripTags(mt[1]);
  if (!title) {
    const mh = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (mh) title = stripTags(mh[1]);
  }
  if (!title) title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Description
  let desc = '';
  const md = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (md) desc = md[1];
  if (!desc) desc = title + ' - Free online calculator.';

  // H1
  let h1 = title;
  const mh = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (mh) h1 = stripTags(mh[1]);

  const url = SITE_URL + '/' + file;
  const canonical = url;

  // Breadcrumb list from path / existing microdata
  let crumbs = [];
  const mb = html.match(/<span itemprop="itemListElement"[\s\S]*?<\/span>/gi);
  if (mb) {
    for (const b of mb) {
      const nameM = b.match(/<span itemprop="name">([\s\S]*?)<\/span>/i);
      const itemM = b.match(/<a itemprop="item" href="([^"]*)"/i);
      const posM = b.match(/<meta itemprop="position" content="(\d+)"/i);
      if (nameM && itemM) {
        crumbs.push({ name: stripTags(nameM[1]), item: SITE_URL + itemM[1].replace(/^\//, '/'), position: posM ? parseInt(posM[1]) : crumbs.length + 1 });
      }
    }
  }
  if (crumbs.length === 0) {
    crumbs.push({ name: 'Home', item: SITE_URL + '/', position: 1 });
    crumbs.push({ name: h1, item: url, position: 2 });
  }

  // --- Inject into <head> ---
  // Ensure <html lang="en">
  html = html.replace(/<html([^>]*)>/i, function (m, attrs) {
    if (!/lang\s*=/i.test(attrs)) return '<html lang="en"' + attrs + '>';
    return m;
  });

  // Insert <meta charset> right after <head>
  if (!/<meta[^>]+charset/i.test(html)) {
    html = html.replace(/<head>/i, '<head>\n<meta charset="utf-8">');
  }
  // Viewport
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
    html = html.replace(/<meta charset="utf-8">/i, '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    if (!/<meta charset="utf-8">/i.test(html)) {
      html = html.replace(/<head>/i, '<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }
  }

  // Canonical (avoid duplicates)
  html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
  const canonicalTag = '\n<link rel="canonical" href="' + escAttr(canonical) + '">';
  html = html.replace(/<\/head>/i, canonicalTag + '\n</head>');

  // Open Graph + Twitter (avoid duplicates)
  html = html.replace(/<meta[^>]+property=["']og:title["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+property=["']og:description["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+property=["']og:url["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+property=["']og:type["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+property=["']og:site_name["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+property=["']og:locale["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+name=["']twitter:card["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+name=["']twitter:title["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+name=["']twitter:description["'][^>]*>/gi, '');

  const ogBlock = '\n<meta property="og:title" content="' + escAttr(title) + '">\n'
    + '<meta property="og:description" content="' + escAttr(desc) + '">\n'
    + '<meta property="og:type" content="website">\n'
    + '<meta property="og:url" content="' + escAttr(canonical) + '">\n'
    + '<meta property="og:site_name" content="Calculator">\n'
    + '<meta property="og:locale" content="en_US">\n'
    + '<meta name="twitter:card" content="summary">\n'
    + '<meta name="twitter:title" content="' + escAttr(title) + '">\n'
    + '<meta name="twitter:description" content="' + escAttr(desc) + '">';
  html = html.replace(/<\/head>/i, ogBlock + '\n</head>');

  // JSON-LD WebApplication
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
    'publisher': { '@type': 'Organization', 'name': 'Calculator', 'url': SITE_URL }
  };

  // JSON-LD BreadcrumbList
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': crumbs.map(function (c) {
      return { '@type': 'ListItem', 'position': c.position, 'name': c.name, 'item': c.item };
    })
  };

  const jsonld = '\n<script type="application/ld+json">' + JSON.stringify(webApp) + '</script>\n'
    + '<script type="application/ld+json">' + JSON.stringify(breadcrumb) + '</script>';
  html = html.replace(/<\/head>/i, jsonld + '</head>');

  if (html !== orig) {
    fs.writeFileSync(fp, html, 'utf8');
    processed++;
  }
}

console.log('SEO meta injected into ' + processed + ' of ' + files.length + ' pages. Domain: ' + SITE_URL);
