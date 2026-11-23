import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/site.config.ts';

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
  ],
});
