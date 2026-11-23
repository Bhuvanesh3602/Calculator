/**
 * Calculator images, matched to calculators by FILE NAME.
 * Drop a file named after the calculator's slug into src/assets/calculators/,
 * e.g. bmi-calculator.jpg, gpa-calculator.png — any case, jpg/jpeg/png/webp/avif.
 * It is then used automatically on cards, on the calculator page and as the
 * social-share (Open Graph) image. Astro converts and resizes it at build time.
 */
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/calculators/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
});

export const calcImages: Record<string, ImageMetadata> = {};
for (const [path, mod] of Object.entries(files)) {
  const slug = path
    .split('/')
    .pop()!
    .replace(/\.\w+$/, '')
    .toLowerCase();
  calcImages[slug] = mod.default;
}

/** Descriptive alt text (written per image; generic fallback for new ones). */
const ALT: Record<string, string> = {
  'mortgage-calculator': 'Hand passing house keys over an orange brick house with a fan of dollar bills behind it',
  'compound-interest-calculator': 'Stacks of gold coins and a money bag beside a rising green arrow, showing savings growing',
  'loan-calculator': 'Rolled-up dollar bills on wooden blocks spelling LOAN',
  'auto-loan-calculator': 'Approved car loan application beside a white SUV, cash and coins',
};
export const imageAlt = (slug: string, name: string) => ALT[slug] ?? `Illustration for the ${name}`;
