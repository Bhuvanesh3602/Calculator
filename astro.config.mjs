import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { copyFile, readdir } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
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

/**
 * Hub pages with fewer than 2 calculators are noindexed (see HubPage.astro), so they are
 * left out of the sitemap too. Counted from the calculator files' `category:` lines.
 */
const HUB_SLUGS = {
  finance: 'finance-calculators', payroll: 'payroll-calculators', health: 'health-calculators', math: 'math-calculators',
  education: 'education-calculators', 'date-time': 'date-time-calculators', construction: 'construction-calculators', everyday: 'everyday-calculators',
};
const counts = {};
for (const f of readdirSync(new URL('./src/calculators/', import.meta.url))) {
  const m = readFileSync(new URL(`./src/calculators/${f}`, import.meta.url), 'utf8').match(/^\s*category: '([\w-]+)'/m);
  if (m) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
}
const thinHubs = Object.entries(HUB_SLUGS).filter(([k]) => (counts[k] ?? 0) < 2).map(([, slug]) => `/${slug}/`);

export default defineConfig({
  site: SITE.url,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [
    sitemap({
      filter: (p) => !p.includes('/404') && !thinHubs.some((h) => p.endsWith(h)),
      serialize(item) {
        // Google ignores changefreq and priority; lastmod is the date the content was last reviewed.
        item.lastmod = SITE.lastReviewed;
        delete item.changefreq;
        delete item.priority;
        return item;
      },
    }),
    sitemapXmlAlias(),
  ],
});
