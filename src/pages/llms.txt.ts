import { SITE } from '../site.config';
import { categoryList } from '../lib/registry';
export function GET() {
  let body = `# ${SITE.name}\n\n> ${SITE.tagline}. Each page has one calculator, its formula, worked examples, original chart-based analysis and an FAQ.\n\n`;
  for (const c of categoryList.filter((c) => c.items.length)) {
    body += `## ${c.name}\n\n`;
    for (const i of c.items) body += `- [${i.name}](${SITE.url}/${i.slug}/): ${i.description}\n`;
    body += '\n';
  }
  body += `## About\n\n`;
  body += `- [About](${SITE.url}/about/): who builds ${SITE.name} (${SITE.founder}, operated by ${SITE.operator})\n`;
  body += `- [Methodology](${SITE.url}/methodology/): how formulas are sourced and tested\n`;
  body += `- [Contact](${SITE.url}/contact/): report an error or request a calculator\n`;
  body += `- [Privacy](${SITE.url}/privacy/): calculations run in the browser\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
