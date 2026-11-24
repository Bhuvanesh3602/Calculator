// Generates raster brand assets in public/ from the SVG logo:
// logo-512.png (schema logo), apple-touch-icon.png, favicon.ico, og-default.png (1200x630 share image).
// Run: node scripts/make-brand-images.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url));
const out = (f) => new URL(`../public/${f}`, import.meta.url);

await sharp(svg, { density: 1024 }).resize(512, 512).png().toFile(out('logo-512.png').pathname.replace(/^\/(\w:)/, '$1'));
await sharp(svg, { density: 512 }).resize(180, 180).png().toFile(out('apple-touch-icon.png').pathname.replace(/^\/(\w:)/, '$1'));

// favicon.ico: an ICO container holding one 48x48 PNG (supported by all current browsers).
const png48 = await sharp(svg, { density: 256 }).resize(48, 48).png().toBuffer();
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
head.writeUInt8(48, 6); head.writeUInt8(48, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(png48.length, 14); head.writeUInt32LE(22, 18);
await writeFile(out('favicon.ico'), Buffer.concat([head, png48]));

// Default Open Graph image for pages without their own picture.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <g transform="translate(96 150)">
    <circle cx="70" cy="70" r="62" fill="#F97316"/><circle cx="190" cy="70" r="50" fill="#EC4899"/>
    <circle cx="70" cy="190" r="50" fill="#2563EB"/><circle cx="190" cy="190" r="62" fill="#22C55E"/>
  </g>
  <text x="420" y="270" font-family="Arial, Helvetica, sans-serif" font-size="104" font-weight="700" fill="#ffffff">ilovecalx</text>
  <text x="424" y="350" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#d4d4d4">Free calculators that show their working</text>
  <text x="424" y="420" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#a3a3a3">50 tools · formulas · worked examples · charts</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile(out('og-default.png').pathname.replace(/^\/(\w:)/, '$1'));
console.log('brand images written');
