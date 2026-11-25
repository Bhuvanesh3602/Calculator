import { num } from '../lib/format';
import type { Calculator, Values } from '../lib/types';
import { WORDS } from '../lib/wordlist';
import { randBelow, shuffle } from './random-number-generator';

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/~',
};
const AMBIGUOUS = /[Il1O0o|`'"]/g;

export function charPools(v: Values): string[] {
  const strip = (s: string) => (v.ambiguous === 'exclude' ? s.replace(AMBIGUOUS, '') : s);
  const pools: string[] = [];
  if (v.lower !== 'no') pools.push(strip(SETS.lower));
  if (v.upper !== 'no') pools.push(strip(SETS.upper));
  if (v.digits !== 'no') pools.push(strip(SETS.digits));
  if (v.symbols !== 'no') pools.push(strip(SETS.symbols));
  return pools.filter(Boolean);
}

/** Random password with at least one character from every chosen set, positions shuffled. */
export function makePassword(length: number, pools: string[]): string {
  const all = pools.join('');
  const chars = pools.map((p) => p[randBelow(p.length)]);
  while (chars.length < length) chars.push(all[randBelow(all.length)]);
  return shuffle(chars).slice(0, length).join('');
}
export function makePassphrase(words: number, sep: string, caps: boolean, addNum: boolean): string {
  const ws = Array.from({ length: words }, () => {
    const w = WORDS[randBelow(WORDS.length)];
    return caps ? w[0].toUpperCase() + w.slice(1) : w;
  });
  if (addNum) ws.push(String(randBelow(100)).padStart(2, '0'));
  return ws.join(sep);
}

/** Entropy in bits for a password drawn uniformly from an alphabet (or a word list). */
export const entropyBits = (symbols: number, count: number) => count * Math.log2(symbols);

/** Human-readable time to try half of all possibilities at a given guess rate. */
export function crackTime(bits: number, perSecond: number): string {
  const sec = Math.pow(2, bits - 1) / perSecond;
  const units: [number, string][] = [[3.15576e16, 'billion years'], [3.15576e13, 'million years'], [3.15576e10, 'thousand years'], [3.15576e7, 'years'], [86400, 'days'], [3600, 'hours'], [60, 'minutes'], [1, 'seconds']];
  if (sec < 1) return 'instantly';
  if (sec > 3.15576e19) return 'over a trillion years, far longer than the age of the universe';
  for (const [s, u] of units) if (sec >= s) return `about ${num(sec / s, sec / s < 10 ? 1 : 0)} ${u}`;
  return 'instantly';
}
export const strength = (bits: number) => (bits < 40 ? 'Very weak' : bits < 60 ? 'Weak' : bits < 80 ? 'Strong' : bits < 100 ? 'Very strong' : 'Excellent');

const isServer = typeof window === 'undefined';
const SEPS: Record<string, string> = { dash: '-', space: ' ', dot: '.', underscore: '_', none: '' };
const yesNo = (id: string, label: string, def = 'yes') => ({
  id,
  label,
  type: 'select' as const,
  default: def,
  options: [
    { value: 'yes', label: 'Include' },
    { value: 'no', label: 'Leave out' },
  ],
  showIf: { field: 'mode', in: ['random'] },
});

const calc: Calculator = {
  slug: 'password-generator',
  name: 'Password Generator',
  short: 'Password',
  category: 'everyday',
  keyword: 'password generator',
  volume: 450000,
  variants: ['random password generator', 'strong password generator', 'passphrase generator', 'secure password generator', 'password strength checker'],
  title: 'Password Generator – Strong Random Passwords & Passphrases',
  description:
    'Create strong random passwords or memorable passphrases in your browser. Shows entropy in bits and how long cracking would take. Nothing is sent or stored.',
  accent: 'made on your device',
  icon: '✱',
  liveOnLoad: true,
  actionLabel: 'Generate',
  inputs: [
    {
      id: 'mode',
      label: 'Type',
      type: 'select',
      default: 'random',
      options: [
        { value: 'random', label: 'Random characters' },
        { value: 'phrase', label: 'Passphrase (random words)' },
      ],
    },
    { id: 'length', label: 'Length', type: 'number', default: 18, min: 4, max: 128, step: 1, suffix: 'characters', showIf: { field: 'mode', in: ['random'] } },
    yesNo('lower', 'Lowercase a–z'),
    yesNo('upper', 'Uppercase A–Z'),
    yesNo('digits', 'Numbers 0–9'),
    yesNo('symbols', 'Symbols !@#$…'),
    {
      id: 'ambiguous',
      label: 'Look-alike characters (I l 1 O 0)',
      type: 'select',
      default: 'exclude',
      options: [
        { value: 'exclude', label: 'Leave out' },
        { value: 'include', label: 'Include' },
      ],
      showIf: { field: 'mode', in: ['random'] },
    },
    { id: 'words', label: 'Number of words', type: 'number', default: 7, min: 3, max: 12, step: 1, suffix: 'words', showIf: { field: 'mode', in: ['phrase'] } },
    {
      id: 'sep',
      label: 'Separator',
      type: 'select',
      default: 'dash',
      options: [
        { value: 'dash', label: 'Hyphen (-)' },
        { value: 'space', label: 'Space' },
        { value: 'dot', label: 'Dot (.)' },
        { value: 'underscore', label: 'Underscore (_)' },
        { value: 'none', label: 'None' },
      ],
      showIf: { field: 'mode', in: ['phrase'] },
    },
    {
      id: 'caps',
      label: 'Capitalise words',
      type: 'select',
      default: 'yes',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      showIf: { field: 'mode', in: ['phrase'] },
    },
    {
      id: 'addNum',
      label: 'Add a 2-digit number',
      type: 'select',
      default: 'yes',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      showIf: { field: 'mode', in: ['phrase'] },
    },
    { id: 'count', label: 'How many to generate', type: 'number', default: 5, min: 1, max: 50, step: 1 },
  ],
  compute(v) {
    const count = Math.min(50, Math.max(1, Math.round(+v.count || 1)));
    let bits: number, label: string;
    let make: () => string;
    if (v.mode === 'phrase') {
      const n = Math.min(12, Math.max(3, Math.round(+v.words || 7)));
      bits = entropyBits(WORDS.length, n) + (v.addNum === 'yes' ? Math.log2(100) : 0);
      label = `${n}-word passphrase`;
      make = () => makePassphrase(n, SEPS[v.sep] ?? '-', v.caps === 'yes', v.addNum === 'yes');
    } else {
      const pools = charPools(v);
      if (!pools.length) return { primary: { label: '', value: '' }, error: 'Choose at least one character type.' };
      const len = Math.min(128, Math.max(4, Math.round(+v.length || 16)));
      if (len < pools.length) return { primary: { label: '', value: '' }, error: `Use a length of at least ${pools.length} to include every character type.` };
      const alphabet = pools.join('').length;
      bits = entropyBits(alphabet, len);
      label = `${len}-character password from ${alphabet} symbols`;
      make = () => makePassword(len, pools);
    }
    const rows = [
      { label: 'Strength', value: `${strength(bits)} – ${num(bits, 1)} bits of entropy` },
      { label: 'Online attack (1,000 guesses/s)', value: crackTime(bits, 1e3) },
      { label: 'Offline fast-hash attack (100 billion guesses/s)', value: crackTime(bits, 1e11) },
    ];
    if (isServer) return { primary: { label, value: 'Press Generate' }, rows, note: 'Passwords are generated only in your browser, using its secure random generator. They are never sent to our server.' };
    const list = Array.from({ length: count }, make);
    return {
      primary: { label, value: list[0] },
      rows: [...rows, ...(count > 1 ? [{ label: 'More options', value: `${count - 1} more in the table below` }] : [])],
      note: 'Generated on your device with crypto.getRandomValues. Nothing is sent, logged or stored. Copy a password into your password manager before leaving the page.',
      table: count > 1 ? { head: ['#', 'Password'], rows: list.map((p, i) => [i + 1, p]) } : undefined,
    };
  },
  answer: {
    text: () =>
      `A strong password is <strong>long and random</strong>. This generator’s default, 18 characters from upper and lower case letters, numbers and symbols, has about <strong>${num(entropyBits(charPools({ ambiguous: 'exclude' }).join('').length, 18), 0)} bits of entropy</strong>. Even at 100 billion guesses a second, cracking it would take ${crackTime(entropyBits(charPools({ ambiguous: 'exclude' }).join('').length, 18), 1e11)}. Store it in a password manager.`,
  },
  intro: [
    'A password generator creates passwords that a person or a computer cannot guess. Strength comes from two things: length, and how many different characters each position can hold. Together they set the <strong>entropy</strong>, the number of bits an attacker must guess.',
    'This generator runs entirely in your browser with the Web Crypto API. It uses rejection sampling so every character is equally likely, and makes sure every character type you pick appears at least once. For passwords you have to type or remember, switch to a <strong>passphrase</strong> of random words, which is easier to remember at the same strength. Each result shows its entropy and how long an online or offline attack would take.',
  ],
  formula: {
    expr: 'Entropy (bits) = length × log₂(alphabet size)\nPassphrase: words × log₂(word-list size)\nTime to crack (average) = 2^(bits − 1) ÷ guesses per second',
    vars: [
      ['alphabet', '26 lowercase + 26 uppercase + 10 digits + 25 symbols, minus look-alikes if excluded'],
      ['word list', `${WORDS.length} short common words, so each word adds ${num(Math.log2(WORDS.length), 2)} bits`],
    ],
    notes: ['Entropy assumes the password was generated randomly, as here. A password you invent yourself has far less entropy than its length suggests, because people choose predictable patterns.'],
  },
  examples: [
    { title: 'Wi-Fi password, letters and numbers only', inputs: { length: 20, symbols: 'no', count: 1 }, explain: (r) => `${r.rows![0].value}.` },
    { title: '8-word passphrase', inputs: { mode: 'phrase', words: 8, count: 1 }, explain: (r) => `${r.rows![0].value}; offline attack ${r.rows![2].value}.` },
    { title: 'PIN-style 8 digits', inputs: { length: 8, lower: 'no', upper: 'no', symbols: 'no', count: 1 }, explain: (r) => `${r.rows![0].value}. Fine behind a lockout, never as an account password.` },
  ],
  analysis() {
    const lens = [8, 10, 12, 14, 16, 20, 24];
    return [
      {
        title: 'Length beats complexity',
        insight: `Adding symbols to an 8-character password raises its entropy from ${num(entropyBits(62, 8), 0)} to ${num(entropyBits(87, 8), 0)} bits. Adding four more letters and numbers instead (12 characters, no symbols) reaches <strong>${num(entropyBits(62, 12), 0)} bits</strong>. Each extra character multiplies the work for an attacker, so length is the cheapest way to gain strength.`,
        chart: {
          type: 'line',
          title: 'Entropy by length and character set (bits)',
          x: lens,
          series: [
            { name: 'Lowercase only (26)', values: lens.map((l) => entropyBits(26, l)) },
            { name: 'Letters + digits (62)', values: lens.map((l) => entropyBits(62, l)) },
            { name: 'All four sets (87)', values: lens.map((l) => entropyBits(87, l)) },
          ],
          y: 'int',
          xTitle: 'Length',
        },
      },
      {
        title: 'How long would an offline attack take?',
        insight: 'These times assume an attacker stole a database of fast, unsalted hashes and can test 100 billion guesses a second on GPUs. Sites that use slow hashes such as bcrypt or Argon2 make every guess thousands of times more expensive.',
        table: {
          head: ['Password', 'Entropy', 'Average time to crack'],
          rows: [
            ['8 lowercase letters', 26, 8],
            ['8 mixed characters', 87, 8],
            ['12 mixed characters', 87, 12],
            ['16 mixed characters', 87, 16],
            ['4 random words', WORDS.length, 4],
            ['8 random words', WORDS.length, 8],
          ].map(([l, a, n]) => [l as string, `${num(entropyBits(a as number, n as number), 0)} bits`, crackTime(entropyBits(a as number, n as number), 1e11)]),
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a passphrase generator?', a: `Yes. Choose “Passphrase” to string random words together, such as Maple-Otter-Prism-Radio-Quilt-42. With ${WORDS.length} words, each adds ${num(Math.log2(WORDS.length), 1)} bits, so 7 words plus a number give about ${num(7 * Math.log2(WORDS.length) + Math.log2(100), 0)} bits. Use more words for accounts that matter most.` },
    { q: 'Is it safe to use an online password generator?', a: 'Only if the password is created on your own device. This page generates everything in your browser with crypto.getRandomValues. Nothing is sent to a server, and the settings in the page link never include the password.' },
    { q: 'How strong is my password?', a: 'For a randomly generated password, strength is its entropy in bits: 60+ is strong, 80+ very strong. Passwords people invent are weaker than their length suggests, because attackers try common words and patterns first.' },
  ],
  tips: [
    'Use a different password for every account. A password manager makes this painless.',
    'Turn on two-factor authentication or a passkey wherever it is offered. It protects you even if a password leaks.',
    'NIST guidance favours length over forced complexity rules, and no longer recommends regular forced changes without evidence of compromise.',
  ],
  faqs: [
    { q: 'How long should a password be?', a: 'At least 15 characters for important accounts, or a passphrase of 7 or more random words from this generator’s list. NIST requires sites to accept passwords of at least 64 characters.' },
    { q: 'What is password entropy?', a: 'A measure of unpredictability in bits. Each bit doubles the number of guesses needed. A random 16-character password from 87 symbols has about 103 bits.' },
    { q: 'Are passphrases as secure as random passwords?', a: `Yes, if the words are chosen randomly, not by you, and there are enough of them. Each word from this ${WORDS.length}-word list adds ${num(Math.log2(WORDS.length), 1)} bits, so 9 words (${num(9 * Math.log2(WORDS.length), 0)} bits) match a random 12-character password and are easier to type. Larger Diceware lists of 7,776 words add 12.9 bits per word.` },
    { q: 'Why leave out look-alike characters?', a: 'Characters such as I, l and 1, or O and 0, are easy to misread when you copy a password by hand. Leaving them out reduces entropy only slightly.' },
  ],
  sources: [
    { label: 'NIST SP 800-63B – Digital identity guidelines: authentication', url: 'https://pages.nist.gov/800-63-4/sp800-63b.html' },
    { label: 'MDN – Crypto.getRandomValues()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues' },
    { label: 'CISA – Use strong passwords', url: 'https://www.cisa.gov/secure-our-world/use-strong-passwords' },
  ],
  related: ['random-number-generator', 'subnet-calculator', 'conversion-calculator', 'percentage-calculator', 'scientific-calculator'],
};
export default calc;
