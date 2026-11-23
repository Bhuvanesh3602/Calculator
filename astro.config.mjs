import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SITE } from './src/site.config.ts';

/**
 * Also publish the sitemap at the conventional /sitemap.xml address.
 * One chunk (sitemap-0.xml) → copy the full URL list; several chunks → copy the index.
 */
function sitemapXmlAlias() {
  return {
    name: 'sitemap-xml-alias',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const out = fileURLToPath(dir);
        const chunks = (await readdir(out)).filter((f) => /^sitemap-\d+\.xml$/.test(f));
        const source = chunks.length === 1 ? chunks[0] : 'sitemap-index.xml';
        await copyFile(`${out}/${source}`, `${out}/sitemap.xml`);
      },
    },
  };
}

/** Priority hints for the XML sitemap (search engines treat these as hints only). */
function priorityFor(url) {
  const path = new URL(url).pathname;
  if (path === '/') return 1.0;
  if (path.endsWith('-calculator/')) return 0.9;
  if (path.endsWith('-calculators/')) return 0.7;
  if (['/about/', '/methodology/', '/contact/', '/sitemap/'].includes(path)) return 0.4;
  return 0.3;
}

export default defineConfig({
  site: SITE.url,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [
    sitemap({
      filter: (p) => !p.includes('/404'),
      serialize(item) {
        item.lastmod = new Date(SITE.lastReviewed + 'T00:00:00Z').toISOString();
        item.changefreq = item.url.endsWith('-calculator/') ? 'monthly' : 'yearly';
        item.priority = priorityFor(item.url);
        return item;
      },
    }),
    sitemapXmlAlias(),
  ],
});
