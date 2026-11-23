/**
 * Technical SEO audit of the built site (dist/). Run after `npm run build`:
 *   npm run seo-check
 * Exits with code 1 if any ERROR is found.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const cfg = readFileSync(new URL('../src/site.config.ts', import.meta.url), 'utf8');
const SITE_URL = /url:\s*'([^']+)'/.exec(cfg)[1];

const errors = [];
const warnings = [];
const err = (p, m) => errors.push(`${p}  ${m}`);
const warn = (p, m) => warnings.push(`${p}  ${m}`);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const pathOf = (file) => {
  const r = '/' + relative(DIST, file).replace(/\\/g, '/');
  return r.endsWith('/index.html') ? r.slice(0, -'index.html'.length) : r;
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (html, re) => {
  const m = re.exec(html);
  return m ? decode(m[1]) : null;
};

const titles = new Map();
const descs = new Map();
const indexable = new Set();
let linksChecked = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const p = pathOf(file);
  const head = html.slice(0, html.indexOf('</head>'));
  const noindex = /<meta name="robots" content="noindex/.test(head);
  if (!noindex) indexable.add(p);
  if (noindex && p !== '/404.html') err(p, 'is noindex but is not the 404 page');

  if (!/<html lang="en/.test(html)) err(p, 'missing <html lang>');
  if (!/<meta name="viewport"/.test(head)) err(p, 'missing viewport meta');

  const title = attr(head, /<title>([^<]*)<\/title>/);
  if (!title) err(p, 'missing <title>');
  else {
    if (title.length > 65) warn(p, `title is ${title.length} chars (Google shows ~60): "${title}"`);
    if (title.length < 15) err(p, `title too short: "${title}"`);
    if (!noindex) titles.set(title, [...(titles.get(title) || []), p]);
  }
  const desc = attr(head, /<meta name="description" content="([^"]*)"/);
  if (!desc) err(p, 'missing meta description');
  else {
    if (desc.length > 165) warn(p, `description is ${desc.length} chars (>160 gets cut)`);
    if (desc.length < 70) warn(p, `description short (${desc.length} chars)`);
    if (!noindex) descs.set(desc, [...(descs.get(desc) || []), p]);
  }

  const canonical = attr(head, /<link rel="canonical" href="([^"]+)"/);
  if (!canonical) err(p, 'missing canonical');
  else if (!noindex && canonical !== SITE_URL + p) err(p, `canonical mismatch: ${canonical}`);
  if (!/property="og:title"/.test(head) || !/property="og:description"/.test(head)) err(p, 'missing Open Graph tags');

  const ogImg = attr(head, /<meta property="og:image" content="([^"]+)"/);
  if (ogImg) {
    if (!ogImg.startsWith(SITE_URL + '/')) err(p, 'og:image is not an absolute URL on this site: ' + ogImg);
    else if (!existsSync(join(DIST, new URL(ogImg).pathname))) err(p, 'og:image file missing: ' + ogImg);
    if (!/<meta property="og:image:alt"/.test(head)) warn(p, 'og:image without og:image:alt');
  }
  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) err(p, `has ${h1s.length} <h1> tags (want exactly 1)`);

  // JSON-LD must parse
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      if (j['@type'] === 'FAQPage' && !(j.mainEntity?.length > 0)) err(p, 'FAQPage schema with no questions');
    } catch (e) {
      err(p, 'invalid JSON-LD: ' + e.message);
    }
  }
  if (p.endsWith('-calculator/')) {
    for (const t of ['WebApplication', 'FAQPage', 'BreadcrumbList']) if (!html.includes(`"@type":"${t}"`)) err(p, `missing ${t} schema`);
  }

  // images need alt text; SVG charts need an accessible name
  // alt="" (or bare `alt`) is correct for decorative images next to their own text label
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt(="|[\s>/])/.test(m[0])) err(p, 'image without alt attribute: ' + m[0].slice(0, 80));
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\swidth="\d+"/.test(m[0]) || !/\sheight="\d+"/.test(m[0])) err(p, 'image without width/height (causes layout shift)');
  for (const m of html.matchAll(/<svg\b[^>]*role="img"[^>]*>/g)) if (!/aria-label="[^"]+"/.test(m[0])) err(p, 'chart SVG without aria-label');

  // internal links must resolve
  for (const m of html.matchAll(/<a\b[^>]*href="([^"#?]+)[^"]*"/g)) {
    const href = m[1];
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    linksChecked++;
    const target = href.endsWith('/') ? join(DIST, href, 'index.html') : join(DIST, href);
    if (!existsSync(target)) err(p, `broken internal link: ${href}`);
    else if (!href.endsWith('/') && !/\.\w+$/.test(href)) warn(p, `link without trailing slash: ${href}`);
  }

  const kb = Buffer.byteLength(html) / 1024;
  if (kb > 300) warn(p, `HTML is ${kb.toFixed(0)} KB`);
}

for (const [t, ps] of titles) if (ps.length > 1) err(ps.join(', '), `duplicate title "${t}"`);
for (const [d, ps] of descs) if (ps.length > 1) err(ps.join(', '), `duplicate description`);

// sitemap ↔ pages
const smIndex = join(DIST, 'sitemap-index.xml');
if (!existsSync(smIndex)) err('/sitemap-index.xml', 'missing');
else {
  const subs = [...readFileSync(smIndex, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const inMap = new Set();
  for (const s of subs) {
    const f = join(DIST, new URL(s).pathname);
    if (!existsSync(f)) {
      err(s, 'sitemap file referenced but missing');
      continue;
    }
    const xml = readFileSync(f, 'utf8');
    for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>(.*?)<\/url>/g)) {
      inMap.add(new URL(m[1]).pathname);
      if (!m[2].includes('<lastmod>')) warn(m[1], 'no <lastmod> in sitemap');
    }
  }
  for (const p of indexable) if (!inMap.has(p)) err(p, 'indexable page missing from sitemap');
  for (const p of inMap) if (!indexable.has(p)) err(p, 'in sitemap but missing or noindex');
}

// robots.txt
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (!robots) err('/robots.txt', 'missing');
else {
  if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap-index.xml`)) err('/robots.txt', 'does not point to the sitemap');
  if (/^Disallow:\s*\/\s*$/m.test(robots)) err('/robots.txt', 'blocks the whole site');
}
const key = /indexNowKey:\s*'([^']+)'/.exec(cfg)?.[1];
if (key && (!existsSync(join(DIST, key + '.txt')) || readFileSync(join(DIST, key + '.txt'), 'utf8').trim() !== key)) err(`/${key}.txt`, 'IndexNow key file missing or wrong');

console.log(`\nSEO check: ${htmlFiles.length} HTML pages, ${indexable.size} indexable, ${linksChecked} internal links checked`);
if (warnings.length) console.log(`\nWarnings (${warnings.length}):\n  ` + warnings.join('\n  '));
if (errors.length) {
  console.log(`\nERRORS (${errors.length}):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('\n✓ No SEO errors found.');
