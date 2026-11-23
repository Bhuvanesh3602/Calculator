/**
 * Submit every URL in the live sitemap to IndexNow (Bing, Yandex, Seznam, Naver…).
 * Run AFTER deploying:  npm run indexnow
 */
import { readFileSync } from 'node:fs';

const cfg = readFileSync(new URL('../src/site.config.ts', import.meta.url), 'utf8');
const url = /url:\s*'([^']+)'/.exec(cfg)[1];
const key = /indexNowKey:\s*'([^']+)'/.exec(cfg)[1];
const host = new URL(url).host;

const index = await (await fetch(`${url}/sitemap-index.xml`)).text();
const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const urls = [];
for (const m of maps) {
  const xml = await (await fetch(m)).text();
  urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]));
}
console.log(`Submitting ${urls.length} URLs for ${host}…`);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `${url}/${key}.txt`, urlList: urls }),
});
console.log(`IndexNow response: ${res.status} ${res.statusText} (200/202 = accepted)`);
