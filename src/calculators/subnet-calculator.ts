import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

/** Parse dotted IPv4 to an unsigned 32-bit number, or NaN. */
export function ipToInt(s: string): number {
  const p = String(s).trim().split('.');
  if (p.length !== 4 || p.some((x) => !/^\d{1,3}$/.test(x) || +x > 255)) return NaN;
  return ((+p[0] << 24) >>> 0) + (+p[1] << 16) + (+p[2] << 8) + +p[3];
}
export const intToIp = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
export const maskOf = (prefix: number) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);
const bin = (n: number) => [24, 16, 8, 0].map((s) => ((n >>> s) & 255).toString(2).padStart(8, '0')).join('.');

export function subnet(ip: number, prefix: number) {
  const mask = maskOf(prefix);
  const network = (ip & mask) >>> 0;
  const size = 2 ** (32 - prefix);
  const broadcast = (network + size - 1) >>> 0;
  const usable = prefix >= 31 ? size : size - 2; // RFC 3021: /31 point-to-point links use both addresses
  const first = prefix >= 31 ? network : network + 1;
  const last = prefix >= 31 ? broadcast : broadcast - 1;
  return { mask, network, broadcast, size, usable, first, last, wildcard: ~mask >>> 0 };
}

export function ipKind(ip: number): string {
  const inR = (base: string, bits: number) => (ip & maskOf(bits)) >>> 0 === ipToInt(base);
  if (inR('10.0.0.0', 8) || inR('172.16.0.0', 12) || inR('192.168.0.0', 16)) return 'Private (RFC 1918)';
  if (inR('100.64.0.0', 10)) return 'Carrier-grade NAT (RFC 6598)';
  if (inR('127.0.0.0', 8)) return 'Loopback';
  if (inR('169.254.0.0', 16)) return 'Link-local (APIPA)';
  if (inR('224.0.0.0', 4)) return 'Multicast';
  if (inR('240.0.0.0', 4)) return 'Reserved';
  if (inR('0.0.0.0', 8)) return '“This network” (reserved)';
  return 'Public';
}
const ipClass = (ip: number) => {
  const a = ip >>> 24;
  return a < 128 ? 'A' : a < 192 ? 'B' : a < 224 ? 'C' : a < 240 ? 'D (multicast)' : 'E (reserved)';
};

const prefixOpts = Array.from({ length: 33 }, (_, p) => ({ value: String(p), label: `/${p} – ${intToIp(maskOf(p))} (${num(p >= 31 ? 2 ** (32 - p) : Math.max(0, 2 ** (32 - p) - 2), 0)} hosts)` })).reverse();

const calc: Calculator = {
  slug: 'subnet-calculator',
  name: 'Subnet Calculator',
  short: 'Subnet (IPv4)',
  category: 'everyday',
  keyword: 'subnet calculator',
  volume: 74000,
  variants: ['ip subnet calculator', 'cidr calculator', 'ipv4 subnet calculator', 'subnet mask calculator', 'network address calculator', 'vlsm calculator'],
  title: 'Subnet Calculator – IPv4 CIDR, Mask, Hosts & Subnet Split',
  description:
    'Enter an IPv4 address and CIDR prefix to get the network and broadcast addresses, host range, mask, wildcard and binary view, and split it into subnets.',
  accent: 'CIDR, decoded',
  icon: '⌗',
  inputs: [
    { id: 'ip', label: 'IP address (or address/prefix)', type: 'text', default: '192.168.10.77', placeholder: '10.0.0.1 or 10.0.0.0/22', mono: true },
    { id: 'prefix', label: 'Prefix length / subnet mask', type: 'select', default: '24', options: prefixOpts, help: 'Ignored if you type a /prefix after the address.' },
    { id: 'split', label: 'Split into subnets of', type: 'select', default: 'none', options: [{ value: 'none', label: 'Don’t split' }, ...prefixOpts.filter((o) => +o.value >= 1).map((o) => ({ value: o.value, label: o.label }))] },
  ],
  compute(v) {
    const raw = String(v.ip).trim();
    const [addr, pfx] = raw.split('/');
    const ip = ipToInt(addr);
    if (!isFinite(ip)) return { primary: { label: '', value: '' }, error: 'Enter a valid IPv4 address, such as 192.168.1.10. Each of the four parts must be 0–255.' };
    const prefix = pfx !== undefined ? +pfx : +v.prefix;
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return { primary: { label: '', value: '' }, error: 'The prefix must be a whole number from 0 to 32.' };
    const s = subnet(ip, prefix);
    const rows = [
      { label: 'Network address', value: intToIp(s.network) },
      { label: 'Broadcast address', value: prefix >= 31 ? 'none (/31 and /32)' : intToIp(s.broadcast) },
      { label: 'Usable host range', value: `${intToIp(s.first)} – ${intToIp(s.last)}` },
      { label: 'Usable hosts', value: num(s.usable, 0) },
      { label: 'Total addresses', value: num(s.size, 0) },
      { label: 'Subnet mask', value: intToIp(s.mask) },
      { label: 'Wildcard mask (ACLs, OSPF)', value: intToIp(s.wildcard) },
      { label: 'Address type', value: ipKind(ip) },
      { label: 'Classful network (legacy)', value: ipClass(ip) },
      { label: 'Reverse DNS zone', value: prefix >= 24 ? `${intToIp(s.network).split('.').slice(0, 3).reverse().join('.')}.in-addr.arpa` : prefix >= 16 ? `${intToIp(s.network).split('.').slice(0, 2).reverse().join('.')}.in-addr.arpa` : `${intToIp(s.network).split('.')[0]}.in-addr.arpa` },
      { label: 'Hex', value: '0x' + ip.toString(16).toUpperCase().padStart(8, '0') },
    ];
    const steps = [`IP      ${bin(ip)}`, `Mask    ${bin(s.mask)}  (/${prefix})`, `AND  →  ${bin(s.network)}  = ${intToIp(s.network)}`, `Broadcast = network OR wildcard = ${intToIp(s.broadcast)}`];
    let table;
    const sp = v.split === 'none' ? NaN : +v.split;
    let note: string | undefined;
    if (isFinite(sp)) {
      if (sp <= prefix) note = `Choose a split prefix longer than /${prefix} to divide this network.`;
      else {
        const count = 2 ** (sp - prefix);
        const sz = 2 ** (32 - sp);
        const shown = Math.min(count, 256);
        table = {
          caption: `${num(count, 0)} subnets of /${sp}${count > shown ? ` (first ${shown} shown)` : ''}`,
          head: ['#', 'Network', 'Usable range', 'Broadcast'],
          rows: Array.from({ length: shown }, (_, i) => {
            const t = subnet((s.network + i * sz) >>> 0, sp);
            return [i + 1, `${intToIp(t.network)}/${sp}`, `${intToIp(t.first)} – ${intToIp(t.last)}`, sp >= 31 ? '—' : intToIp(t.broadcast)];
          }),
        };
        rows.push({ label: `Subnets of /${sp}`, value: `${num(count, 0)} × ${num(subnet(0, sp).usable, 0)} usable hosts` });
      }
    }
    return { primary: { label: 'Network (CIDR)', value: `${intToIp(s.network)}/${prefix}` }, rows, steps, table, note };
  },
  answer: {
    text: (r) =>
      `The address <strong>192.168.10.77/24</strong> belongs to the network <strong>${r.primary.value}</strong>. Its usable hosts run from <strong>${r.rows![2].value}</strong> (${r.rows![3].value} hosts), with ${r.rows![1].value} as the broadcast address. The subnet mask is ${r.rows![5].value}, and the address type is ${r.rows![7].value}.`,
  },
  intro: [
    'A subnet calculator takes an IPv4 address and a prefix length, such as /24, and works out the network it belongs to. It gives the network and broadcast addresses, the range of usable host addresses, the subnet mask and the wildcard mask. Network engineers use it to plan addressing, write firewall rules and check router configuration.',
    'You can type the address in CIDR form (10.0.0.0/22) or pick the mask from the list. The calculator shows the binary AND that produces the network address, so you can see how subnetting works. It also classifies the address (private, CGNAT, loopback and so on), handles /31 point-to-point links correctly under RFC 3021, and splits any network into smaller subnets.',
  ],
  formula: {
    expr: 'Network   = IP AND mask\nBroadcast = network OR NOT mask\nTotal addresses = 2^(32 − prefix)\nUsable hosts = 2^(32 − prefix) − 2   (/31: 2, /32: 1)',
    vars: [
      ['prefix', 'number of leading 1-bits in the mask: /24 = 255.255.255.0'],
      ['wildcard', 'the inverted mask, used in Cisco ACLs and OSPF'],
    ],
  },
  examples: [
    { title: 'Office LAN 10.20.30.40/22', inputs: { ip: '10.20.30.40/22' }, explain: (r) => `Network ${r.primary.value}, hosts ${r.rows![2].value}.` },
    { title: 'Point-to-point link /30', inputs: { ip: '203.0.113.9', prefix: '30' }, explain: (r) => `${r.rows![3].value} usable hosts: ${r.rows![2].value}.` },
    { title: 'Split 172.16.0.0/16 into /20s', inputs: { ip: '172.16.0.0/16', split: '20' }, explain: (r) => `${r.rows!.at(-1)!.value}.` },
  ],
  analysis() {
    const ps = [8, 16, 20, 22, 24, 26, 27, 28, 29, 30, 31, 32];
    return [
      {
        title: 'CIDR cheat sheet',
        insight: 'Each step down in prefix length doubles the size of the network. A /24 has 254 usable hosts and a /23 has 510. Subnets are always aligned: a /26 can only start at .0, .64, .128 or .192 in the last octet.',
        table: { head: ['Prefix', 'Subnet mask', 'Addresses', 'Usable hosts', 'Wildcard'], rows: ps.map((p) => { const s = subnet(0, p); return ['/' + p, intToIp(s.mask), num(s.size, 0), num(s.usable, 0), intToIp(s.wildcard)]; }) },
      },
      {
        title: 'Private ranges you can use inside any network',
        insight: 'RFC 1918 reserves three ranges for private networks. They are not routed on the public internet, so every home and office can reuse them behind NAT. The 100.64.0.0/10 range is used by ISPs for carrier-grade NAT.',
        table: {
          head: ['Range', 'CIDR', 'Addresses'],
          rows: [
            ['10.0.0.0 – 10.255.255.255', '10.0.0.0/8', num(2 ** 24, 0)],
            ['172.16.0.0 – 172.31.255.255', '172.16.0.0/12', num(2 ** 20, 0)],
            ['192.168.0.0 – 192.168.255.255', '192.168.0.0/16', num(2 ** 16, 0)],
            ['100.64.0.0 – 100.127.255.255 (CGNAT)', '100.64.0.0/10', num(2 ** 22, 0)],
          ],
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a CIDR calculator?', a: 'Yes. Type an address with a prefix, such as 10.0.0.0/22, and it shows the full range, mask and host count. It can also split the block into smaller CIDR subnets.' },
    { q: 'How do I find the subnet mask from a prefix?', a: 'Write the prefix length as that many 1-bits followed by 0-bits, then convert each group of 8 bits to a number. /26 is 11111111.11111111.11111111.11000000 = 255.255.255.192.' },
    { q: 'Does it support IPv6?', a: 'This calculator covers IPv4. IPv6 subnets are normally /64 for LANs, so host counts are not a practical constraint there.' },
  ],
  tips: [
    'Size subnets with room to grow: a /24 for 200 devices leaves little headroom.',
    'Use /31 for router-to-router links (RFC 3021) to save addresses, if your equipment supports it.',
    'Keep a plan: give each site or VLAN an aligned block, so routes can be summarised later.',
  ],
  faqs: [
    { q: 'Why are two addresses unusable in a subnet?', a: 'The first address identifies the network and the last is the broadcast address. Neither can be assigned to a host, except in /31 and /32 networks.' },
    { q: 'How many hosts are in a /24?', a: '256 addresses, of which 254 are usable for hosts.' },
    { q: 'What is a wildcard mask?', a: 'The bitwise inverse of the subnet mask. 255.255.255.0 becomes 0.0.0.255. Cisco access lists and OSPF use it to match address ranges.' },
    { q: 'Are IP classes still used?', a: 'No. Classful addressing (A, B, C) was replaced by CIDR in 1993. The class is shown only for reference, as some exams still ask about it.' },
  ],
  sources: [
    { label: 'RFC 4632 – Classless Inter-domain Routing (CIDR)', url: 'https://www.rfc-editor.org/rfc/rfc4632' },
    { label: 'RFC 1918 – Address allocation for private internets', url: 'https://www.rfc-editor.org/rfc/rfc1918' },
    { label: 'RFC 3021 – Using 31-bit prefixes on point-to-point links', url: 'https://www.rfc-editor.org/rfc/rfc3021' },
  ],
  related: ['password-generator', 'conversion-calculator', 'scientific-calculator', 'random-number-generator', 'percentage-calculator'],
};
export default calc;
