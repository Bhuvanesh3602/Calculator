# ilovecalx – 67 SEO-friendly calculators (Astro)

Static Astro site: one calculator per page, each with an answer block, live calculator,
result chart, formula, worked examples, original chart analysis, variant questions, FAQ
(with FAQPage schema), related links, sources and disclaimers. Design follows `DESIGN.md`.

## Run it

```bash
npm install          # first time only
npm run dev          # dev server with hot reload → http://localhost:4321
npm test             # 159 known-answer + content tests (Vitest)
npm run typecheck    # strict TypeScript check of all calculator code
npm run build        # production build → dist/
npm run preview      # serve the built dist/ → http://localhost:4321
```

Deploy `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages).

## Before launch

1. `src/site.config.ts` – brand, domain, operator, contact details and search-engine verification codes live here.
2. `src/pages/about.astro` – replace the [bracketed] note with the founder’s name and background.
3. Tax data `src/lib/data/tax2026.ts` and CPI `src/lib/data/cpi.ts` – verify each January.

## Calculator images

Put an image named after the calculator's page into `src/assets/calculators/`, e.g. `bmi-calculator.jpg`
(any case; jpg, png, webp or avif). On the next build it is used automatically as the card icon, the picture
on that calculator's page and the social-share (Open Graph) image. Astro converts it to WebP at the right sizes.
Best size: at least 1200 px wide for sharp share previews. Add a description for it in `src/lib/images.ts` (ALT).

## Get indexed (do these in order)

1. Deploy `dist/` (Netlify or Cloudflare Pages read `_headers` and `_redirects` automatically; www → ilovecalx.com redirect is included).
2. **Google Search Console** → add a *Domain* property for ilovecalx.com and verify with the DNS TXT record
   (or use the HTML-tag method: paste the code into `googleVerification` in site.config.ts and redeploy).
3. In Search Console → *Sitemaps* → submit `sitemap-index.xml`.
4. In Search Console → *URL Inspection* → request indexing for the home page, a few hub pages and your top calculators.
5. **Bing Webmaster Tools** → import the site from Google Search Console (one click), then submit the same sitemap.
6. Run `npm run indexnow` – pings Bing, Yandex and others with every URL (key file is already in `public/`).
7. After any big update: rebuild, redeploy, run `npm run indexnow` again.

## Quality checks

```bash
npm test            # formulas + every page's content
npm run typecheck   # TypeScript
npm run build && npm run seo-check   # titles, descriptions, canonicals, H1s, schema, links, sitemap, robots
```

## Structure

```
src/calculators/<slug>.ts   one file per calculator: inputs, compute(), SEO copy, FAQs, analysis()
src/lib/                    math, chart (SVG renderer), engine (browser), render, registry, tax/CPI data
src/components/             CalculatorPage, HubPage, CalcForm, FieldInput, TextPage
src/pages/                  index, [page] (calculators + hubs), about, contact, methodology, privacy, terms, sitemap, robots.txt, llms.txt
scripts/                    seo-check.mjs (audit of dist/), indexnow.mjs (submit URLs after deploy)
tests/calc.test.ts          known-answer tests + checks every page's defaults, examples, answers, links, meta lengths
```

### Add a calculator
Copy any file in `src/calculators/`, change the slug and content, run `npm test`. It is picked up
automatically by the home page, hub page, sitemap, llms.txt and the test suite.
