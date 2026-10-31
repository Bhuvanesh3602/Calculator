const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const OUT_PATH = path.join(PUBLIC_DIR, 'js', 'search-index.js');

const CAT_KEYWORDS = [
  { cat: 'Financial', keys: ['mortgage','loan','auto-loan','interest','payment','retirement','amortization','investment','currency','inflation','finance','tax','compound-interest','salary','401k','interest-rate','sales-tax','apr','fha-loan','va-mortgage','heloc','refinance','business-loan','personal-loan','student-loan','home-equity','debt','credit-card','rent','mortgage-payoff'] },
  { cat: 'Fitness & Health', keys: ['bmi','calorie','body-fat','bmr','macro','ideal-weight','pregnancy','due-date','pace','army-body-fat','carbohydrate','lean-body-mass','calories-burned','target-heart-rate','protein','tdee','anorexic-bmi','body-type','body-surface-area','body','height','weight','fat-intake','bac','sleep','ovulation','conception','healthy-weight','overweight','bra-size'] },
  { cat: 'Math', keys: ['scientific','fraction','percent','triangle','volume','standard-deviation','random-number-generator','binary','hex','quadratic-formula','slope','log','area','probability','statistics','matrix','pythagorean-theorem','basic-calculator','big-number','exponent','factor','gcf','lcm','log-calculator','root','square','cube','prime-factorization','permutation-and-combination','roman-numeral','rounding','scientific-notation','z-score','average','molarity','molecular-weight','density','heat-index','dew-point','wind-chill','bandwidth','base64','url-encode','grade','gpa'] },
  { cat: 'Other', keys: ['age','date','time','hours','concrete','subnet','password','conversion','fuel-cost','voltage-drop','square-footage','time-zone','dice','shoe-size','tip','love','concrete','resistor','ohms','tip','mileage','gas-mileage','electricity','btu','horsepower','engine-horsepower','golf-handicap','half-life','resistor','color','pixel','ascii'] }
];

function categorize(slug, title) {
  const t = (slug + ' ' + title).toLowerCase();
  for (const { cat, keys } of CAT_KEYWORDS) {
    if (keys.some(k => t.includes(k))) return cat;
  }
  return 'Other';
}

function titleCase(s) {
  return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const files = fs.readdirSync(PUBLIC_DIR)
  .filter(f => f.endsWith('.html') && f !== 'sitemap.html' && f !== 'about-us.html')
  .sort();

const index = [];
for (const file of files) {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf8');
  const slug = file.replace(/\.html$/, '');
  let title = '';
  const mTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (mTitle) title = mTitle[1].trim().replace(/\s+/g, ' ');
  else {
    const mH1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (mH1) title = mH1[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    else title = titleCase(slug);
  }
  // strip site brand suffix if present
  title = title.replace(/\s*\|\s*.*$/,'').trim();
  let desc = '';
  const mDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (mDesc) desc = mDesc[1].trim();
  if (!desc) desc = title + ' calculator - free online tool.';
  index.push({
    slug,
    url: '/' + file,
    title,
    description: desc,
    category: categorize(slug, title)
  });
}

const homepage = {
  slug: 'home',
  url: '/',
  title: 'Free Online Calculators',
  description: 'Online calculator for quick calculations across math, finance, fitness, and science.',
  category: 'Other'
};
index.unshift(homepage);

const js = '// Auto-generated search index. Rebuild with: node build-search-index.js\nwindow.CALC_INDEX = ' + JSON.stringify(index, null, 2) + ';\n';
fs.writeFileSync(OUT_PATH, js, 'utf8');
fs.writeFileSync(path.join(PUBLIC_DIR, 'js', 'search-index.json'), JSON.stringify(index, null, 2), 'utf8');
console.log('Generated search index with ' + index.length + ' entries -> ' + OUT_PATH);
