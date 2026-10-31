/**
 * calcs-live.js — Per-page self-contained calculation engine.
 * Each calculator page runs its own algorithm when Calculate is clicked.
 * Uses CalcCore (calc-core.js) for formulas; Intl.NumberFormat for numbers/currency.
 * Falls back to a smart per-page algorithm detected from the page title/inputs.
 */

(function (window, document) {
  'use strict';

  var CC = window.CalcCore || {};
  var money = CC.money || function (n) { return '$' + (n || 0).toFixed(2); };
  var num = CC.num || function (n) { return String(n || 0); };
  var $ = CC.$ || function (id) { return document.getElementById(id); };

  // Read a value from a form by name or id
  function formVal(form, name, def) {
    if (def == null) def = 0;
    var el = form.elements[name] || form.querySelector('[name="' + name + '"]') || $(name);
    if (!el) return def;
    if (el.type === 'checkbox') return el.checked ? 1 : 0;
    if (el.type === 'radio') {
      var r = form.querySelector('input[name="' + name + '"]:checked') || document.querySelector('input[name="' + name + '"]:checked');
      return r ? parseFloat(r.value) || 0 : def;
    }
    var v = parseFloat((el.value || '').replace(/[$,%\s]/g, ''));
    return isNaN(v) || !isFinite(v) ? def : v;
  }
  function formStr(form, name, def) {
    if (def == null) def = '';
    var el = form.elements[name] || form.querySelector('[name="' + name + '"]') || $(name);
    return el ? (el.value || '').trim() : def;
  }
  function formChecked(form, name) {
    var el = form.elements[name] || form.querySelector('[name="' + name + '"]') || $(name);
    return el ? el.checked : false;
  }
  function formRadio(form, name) {
    var el = form.querySelector('input[name="' + name + '"]:checked') || document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  // Find the result display element for a form (sibling block or page-level)
  function findResult(form) {
    var sel = '.h2result, .coutput, #result, .result, .output, [id*="result"], h2';
    var el = form.querySelector(sel);
    if (el) return el;
    var node = form;
    while ((node = node.nextElementSibling)) {
      el = node.querySelector(sel);
      if (el) return el;
      if (node.matches && node.matches(sel)) return node;
    }
    return document.querySelector(sel) || null;
  }

  // Display helper
  function showResult(form, html) {
    var el = findResult(form);
    if (!el) {
      el = document.createElement('div');
      el.className = 'calc-result';
      el.style.cssText = 'margin:18px 0;padding:16px;background:#eef6ff;border:1px solid #4c7b25;border-radius:6px;font-size:18px;color:#003366;';
      form.parentNode.insertBefore(el, form.nextSibling);
    }
    el.innerHTML = html;
    el.setAttribute('aria-live', 'polite');
    try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
  }

  // ---------- Per-page algorithm registry ----------
  // Each entry: path match + function(form) -> {html}
  var pageCalcs = [];

  function register(matchFn, calcFn) {
    pageCalcs.push({ match: matchFn, calc: calcFn });
  }

  function path() {
    var p = window.location.pathname.toLowerCase();
    if (p.endsWith('/')) p += 'index.html';
    return p;
  }

  // ---------- Built-in algorithms (one per calculator type) ----------

  // Mortgage
  register(function (p) { return /mortgage|va-mortgage|fha-loan|refinance|home-equity/.test(p); }, function (form) {
    var price = formVal(form, 'chouseprice', 400000);
    var downPct = formVal(form, 'cdownpayment', 20);
    var term = formVal(form, 'cloanterm', 30);
    var rate = formVal(form, 'cinterestrate', 7.0);
    var costs = formChecked(form, 'caddoptional') ? 1 : 0;
    var propTax = formVal(form, 'cpropertytaxes', 1.2);
    var homeIns = formVal(form, 'chomeins', 1500);
    var pmi = formVal(form, 'cpmi', 0);
    var hoa = formVal(form, 'choa', 0);

    var downAmt = price * (downPct / 100);
    var loan = price - downAmt;
    var m = (rate / 100) / 12;
    var n = term * 12;
    var pi = m > 0 ? loan * (m * Math.pow(1 + m, n)) / (Math.pow(1 + m, n) - 1) : loan / n;
    var taxMo = costs ? price * (propTax / 100) / 12 : 0;
    var insMo = costs ? homeIns / 12 : 0;
    var pmiMo = costs && downPct < 20 ? (pmi || loan * 0.005) / 12 : 0;
    var total = pi + taxMo + insMo + pmiMo + hoa;
    var totalPaid = total * n + downAmt;
    var totalInterest = pi * n - loan;

    return '<strong>Monthly Payment:</strong> ' + money(total) + '<br>' +
      '<strong>Principal &amp; Interest:</strong> ' + money(pi) + '<br>' +
      '<strong>Loan Amount:</strong> ' + money(loan) + ' &nbsp; <strong>Down Payment:</strong> ' + money(downAmt) + '<br>' +
      '<strong>Total Interest:</strong> ' + money(totalInterest) + ' &nbsp; <strong>Total Paid:</strong> ' + money(totalPaid);
  });

  // Loan (amortized/deferred/bond)
  register(function (p) { return /loan|auto-loan|payment-calculator|refinance/.test(p); }, function (form) {
    var amount = formVal(form, 'cloanamount', formVal(form, 'cprice', 100000));
    var termY = formVal(form, 'cloanterm', 10);
    var termM = formVal(form, 'cloantermmonth', 0);
    var rate = formVal(form, 'cinterestrate', 6.0);
    var type = formVal(form, 'type', 1);
    var totalMonths = termY * 12 + termM || 120;
    var m = (rate / 100) / 12;
    var mp = m > 0 ? amount * (m * Math.pow(1 + m, totalMonths)) / (Math.pow(1 + m, totalMonths) - 1) : amount / totalMonths;
    var total = mp * totalMonths;
    var interest = total - amount;
    if (type === 2) { mp = amount * Math.pow(1 + m, totalMonths); total = mp; interest = total - amount; }
    else if (type === 3) { mp = amount / Math.pow(1 + m, totalMonths); total = amount; interest = amount - mp; }
    return '<strong>Payment:</strong> ' + money(mp) + '<br>' +
      '<strong>Total Payments:</strong> ' + money(total) + ' &nbsp; <strong>Total Interest:</strong> ' + money(interest);
  });

  // BMI
  register(function (p) { return /bmi|body-fat|ideal-weight|body-type/.test(p); }, function (form) {
    var feet = formVal(form, 'cheightfeet', 5);
    var inches = formVal(form, 'cheightinch', 10);
    var pounds = formVal(form, 'cpound', 160);
    var meters = formVal(form, 'cheightmeter', 178) / 100;
    var kg = formVal(form, 'ckg', 70);
    var metric = formChecked(form, 'standardheightweight') === false || document.getElementById('standardheightweight') && document.getElementById('standardheightweight').style.display === 'none';
    var hM, wKg;
    if (!metric) { hM = (feet * 12 + inches) * 0.0254; wKg = pounds * 0.45359237; }
    else { hM = meters; wKg = kg; }
    if (hM <= 0) hM = 1.78;
    var bmi = wKg / (hM * hM);
    var cat = bmi < 16 ? 'Severe Thinness' : bmi < 17 ? 'Moderate Thinness' : bmi < 18.5 ? 'Mild Thinness' :
              bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : bmi < 35 ? 'Obese Class I' :
              bmi < 40 ? 'Obese Class II' : 'Obese Class III';
    var minLb = (18.5 * hM * hM) * 2.20462, maxLb = (25 * hM * hM) * 2.20462;
    return '<strong>BMI:</strong> ' + num(bmi, 1) + ' kg/m&sup2; &nbsp; <span style="color:#417516;"><strong>' + cat + '</strong></span><br>' +
      '<strong>Healthy weight:</strong> ' + num(minLb, 1) + '–' + num(maxLb, 1) + ' lbs';
  });

  // Calorie / BMR / TDEE
  register(function (p) { return /calorie|bmr|tdee|macro/.test(p); }, function (form) {
    var age = formVal(form, 'cage', 25);
    var gender = formRadio(form, 'csex') || 'm';
    var feet = formVal(form, 'cheightfeet', 5);
    var inches = formVal(form, 'cheightinch', 10);
    var pounds = formVal(form, 'cpound', 165);
    var factor = 1.375;
    var ae = form.querySelector('#cactivity') || form.querySelector('[name="cactivity"]');
    if (ae) { var av = parseFloat(ae.value); if (!isNaN(av) && av > 1) factor = av; }
    var hCm = (feet * 12 + inches) * 2.54;
    var wKg = pounds * 0.453592;
    var bmr = gender === 'm' ? 10 * wKg + 6.25 * hCm - 5 * age + 5 : 10 * wKg + 6.25 * hCm - 5 * age - 161;
    var maintain = Math.round(bmr * factor);
    return '<strong>BMR:</strong> ' + num(bmr, 0) + ' cal/day &nbsp; <strong>Maintain:</strong> ' + num(maintain, 0) + ' cal/day<br>' +
      '<strong>Mild loss:</strong> ' + num(Math.max(1200, maintain - 250), 0) + ' &nbsp; <strong>Weight loss:</strong> ' + num(Math.max(1200, maintain - 500), 0);
  });

  // Age
  register(function (p) { return /age/.test(p); }, function (form) {
    var bM = parseInt(formStr(form, 'today_Month_ID', '1')) - 1, bD = parseInt(formStr(form, 'today_Day_ID', '1')), bY = parseInt(formStr(form, 'today_Year_ID', '1995'));
    var aM = parseInt(formStr(form, 'ageat_Month_ID', '10')) - 1, aD = parseInt(formStr(form, 'ageat_Day_ID', '25')), aY = parseInt(formStr(form, 'ageat_Year_ID', '2026'));
    var birth = new Date(bY, bM, bD), target = new Date(aY, aM, aD);
    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return 'Enter valid dates.';
    var years = target.getFullYear() - birth.getFullYear(), months = target.getMonth() - birth.getMonth(), days = target.getDate() - birth.getDate();
    if (days < 0) { months--; var pm = new Date(target.getFullYear(), target.getMonth(), 0); days += pm.getDate(); }
    if (months < 0) { years--; months += 12; }
    var totalDays = Math.floor((target - birth) / 86400000);
    return '<strong>Age:</strong> ' + years + ' years ' + months + ' months ' + days + ' days<br>' +
      '<strong>Total:</strong> ' + num(totalDays, 0) + ' days (' + num(Math.floor(totalDays / 7), 0) + ' weeks)';
  });

  // Percent / Tip / Discount
  register(function (p) { return /percent|tip|discount|off/.test(p); }, function (form) {
    var v1 = formVal(form, null, 0);
    var inputs = form.querySelectorAll('input[type="text"], input[type="number"]');
    var a = parseFloat((inputs[0] && inputs[0].value || '').replace(/,/g, '')) || 0;
    var b = parseFloat((inputs[1] && inputs[1].value || '').replace(/,/g, '')) || 0;
    var ftext = (form.innerText || '').toLowerCase();
    var result = 0;
    if (ftext.indexOf('tip') >= 0) result = (b / 100) * a;
    else if (ftext.indexOf('discount') >= 0 || ftext.indexOf('off') >= 0) result = a - (b / 100) * a;
    else if (ftext.indexOf('is what') >= 0) result = (a / b) * 100;
    else if (ftext.indexOf('increase') >= 0 || ftext.indexOf('decrease') >= 0) result = ((b - a) / Math.abs(a || 1)) * 100;
    else result = (a / 100) * b;
    return '<strong>Result:</strong> ' + num(result, 4);
  });

  // Interest / Savings / CD
  register(function (p) { return /interest|savings|cd|apr|yield/.test(p); }, function (form) {
    var p = formVal(form, 'cstartingprinciple', formVal(form, 'cprincipal', 10000));
    var r = formVal(form, 'cinterestrate', 5) / 100;
    var t = formVal(form, 'cyears', 5);
    var pmt = formVal(form, 'ccontributions', 0);
    var n = 12;
    var comp = formStr(form, 'ccompound', 'monthly');
    if (comp === 'annually') n = 1; else if (comp === 'semiannually') n = 2; else if (comp === 'quarterly') n = 4; else if (comp === 'daily') n = 365;
    var totalPrincipal = p + pmt * 12 * t;
    var end = p * Math.pow(1 + r / n, n * t);
    if (pmt > 0 && r > 0) { var pr = r / 12, periods = t * 12; end += pmt * (Math.pow(1 + pr, periods) - 1) / pr; }
    return '<strong>Ending Balance:</strong> ' + money(end) + '<br>' +
      '<strong>Total Principal:</strong> ' + money(totalPrincipal) + ' &nbsp; <strong>Total Interest:</strong> ' + money(end - totalPrincipal);
  });

  // Password Generator
  register(function (p) { return /password/.test(p); }, function (form) {
    var len = formVal(form, 'plength', 16); if (len < 4) len = 4; if (len > 128) len = 128;
    var upper = formChecked(form, 'pupper'), lower = formChecked(form, 'plower');
    var nums = formChecked(form, 'pnumber'), syms = formChecked(form, 'psymbol');
    var u = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', l = 'abcdefghijklmnopqrstuvwxyz';
    var n = '0123456789', s = '!@#$%^&*()-_=+[]{}|;:,.<>?';
    var cs = '';
    if (upper) cs += u; if (lower) cs += l; if (nums) cs += n; if (syms) cs += s;
    if (!cs) cs = u + l + n;
    var pass = '';
    for (var i = 0; i < len; i++) pass += cs.charAt(Math.floor(Math.random() * cs.length));
    return '<strong>Password:</strong> <span style="font-family:monospace;background:#f0f0f0;padding:6px 14px;border:1px solid #ccc;border-radius:4px;user-select:all;">' + pass + '</span>';
  });

  // Random Number
  register(function (p) { return /random/.test(p); }, function (form) {
    var lo = formVal(form, 'slower', 1), hi = formVal(form, 'supper', 100);
    if (hi < lo) { var t = hi; hi = lo; lo = t; }
    var count = formVal(form, 'scount', 1);
    var res = [];
    for (var i = 0; i < count; i++) res.push(Math.floor(Math.random() * (hi - lo + 1)) + lo);
    return '<strong>Result:</strong> ' + res.join(', ');
  });

  // Fraction
  register(function (p) { return /fraction/.test(p); }, function (form) {
    var n1 = formVal(form, 't1', 1), d1 = formVal(form, 'b1', 2) || 1;
    var n2 = formVal(form, 't2', 1), d2 = formVal(form, 'b2', 4) || 1;
    var op = formStr(form, 'op', '+');
    if (d1 === 0 || d2 === 0) return 'Denominator cannot be zero.';
    var rn, rd;
    if (op === '+') { rn = n1 * d2 + n2 * d1; rd = d1 * d2; }
    else if (op === '-') { rn = n1 * d2 - n2 * d1; rd = d1 * d2; }
    else if (op === '*') { rn = n1 * n2; rd = d1 * d2; }
    else { rn = n1 * d2; rd = d1 * n2 || 1; }
    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
    var g = Math.abs(gcd(rn, rd));
    return '<strong>Result:</strong> <strong>' + (rn / g) + '/' + (rd / g) + '</strong> (' + (rn / rd).toFixed(4) + ')';
  });

  // Subnet
  register(function (p) { return /subnet|ip/.test(p); }, function (form) {
    var ip = formStr(form, 'cip', '192.168.1.1');
    var bits = parseInt(formStr(form, 'cmask', '24').replace('/', '')) || 24;
    if (bits < 1) bits = 1; if (bits > 32) bits = 32;
    var parts = ip.split('.').map(function (x) { return parseInt(x) || 0; });
    if (parts.length !== 4) return 'Invalid IP address.';
    var ipNum = ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0);
    var mask = bits === 0 ? 0 : (~((1 << (32 - bits)) - 1)) >>> 0;
    var net = (ipNum & mask) >>> 0, bcast = (net | (~mask >>> 0)) >>> 0;
    function n2ip(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
    var first = bits >= 31 ? net : n2ip(net + 1), last = bits >= 31 ? bcast : n2ip(bcast - 1);
    var hosts = bits >= 31 ? (bits === 31 ? 2 : 1) : (Math.pow(2, 32 - bits) - 2);
    return '<strong>Network:</strong> ' + n2ip(net) + ' &nbsp; <strong>Mask:</strong> ' + n2ip(mask) + '<br>' +
      '<strong>Broadcast:</strong> ' + n2ip(bcast) + ' &nbsp; <strong>Usable:</strong> ' + first + ' – ' + last + ' (' + num(hosts, 0) + ' hosts)';
  });

  // ---------- Generic smart fallback for any other page ----------
  function genericCalc(form) {
    var title = (document.querySelector('h1') && document.querySelector('h1').innerText) || '';
    var desc = (document.querySelector('meta[name="description"]') && document.querySelector('meta[name="description"]').content) || '';
    var text = (title + ' ' + desc + ' ' + document.body.innerText).toLowerCase();
    var inputs = form.querySelectorAll('input[type="text"], input[type="number"], select');
    var nums = [];
    inputs.forEach(function (inp) {
      var v = parseFloat((inp.value || '').replace(/[$,%]/g, '').trim());
      if (!isNaN(v) && isFinite(v)) nums.push(v);
    });
    if (nums.length === 0) return 'Enter numeric values, then click Calculate.';

    var loanish = /mortgage|loan|auto|payment|amort|refinance|heloc|fha|va |business loan|personal loan|student loan/.test(text);
    var bmiish = /bmi|body mass|body fat|ideal weight/.test(text);
    var calorieish = /calorie|bmr|tdee|macro/.test(text);
    var ageish = /\bage\b/.test(text);
    var pctish = /percent|percentage|tip|discount|off/.test(text);
    var interestish = /interest|savings|cd |certificate|apr|yield/.test(text);

    if (loanish && nums.length >= 2) {
      var amount = nums[0] || 0, rate = 0, term = 0;
      nums.slice(1).forEach(function (v) { if (v > 0 && v <= 100 && rate === 0) rate = v; else if (v > 0 && v <= 60 && term === 0) term = v; });
      if (!rate) rate = 6; if (!term) term = 30;
      var m = (rate / 100) / 12, n = term * 12;
      var mp = m > 0 ? amount * (m * Math.pow(1 + m, n)) / (Math.pow(1 + m, n) - 1) : amount / n;
      return '<strong>Monthly Payment:</strong> ' + money(mp);
    }
    if (bmiish && nums.length >= 2) {
      var w = nums[0], h = Math.max(nums[1], 1);
      var bmi = w / (h * h);
      var cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
      return '<strong>BMI:</strong> ' + num(bmi, 1) + ' &mdash; <strong>' + cat + '</strong>';
    }
    if (calorieish && nums.length >= 1) {
      return '<strong>Calories/day (estimate):</strong> ' + num(Math.round(nums[0] * 24), 0);
    }
    if (ageish && nums.length >= 1) {
      return '<strong>Years:</strong> ' + Math.floor(nums[0] / 365);
    }
    if (pctish && nums.length >= 2) {
      return '<strong>Result:</strong> ' + num(((nums[0] / 100) * nums[1]), 4);
    }
    if (interestish && nums.length >= 2) {
      var p = nums[0], r = nums[1] / 100, t = (nums[2] || 5);
      return '<strong>End Balance:</strong> ' + money(p * Math.pow(1 + r, t));
    }
    return '<strong>Result:</strong> ' + num(nums[0]);
  }

  // ---------- Initializer ----------
  function initCalc(form) {
    if (!form) return;
    var btn = form.querySelector('input[type="submit"], button[type="submit"]');
    if (!btn) return;
    var label = ((btn.value || btn.innerText || '') + '').toLowerCase();
    if (!/calculate|generate|compute|convert|calculate now/.test(label)) return;

    var p = path();
    var calcFn = null;
    for (var i = 0; i < pageCalcs.length; i++) {
      if (pageCalcs[i].match(p)) { calcFn = pageCalcs[i].calc; break; }
    }
    if (!calcFn) calcFn = genericCalc;

    function run() {
      var html = calcFn(form);
      showResult(form, html);
      return false;
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    btn.addEventListener('click', function (e) { e.preventDefault(); run(); });
    // Keyboard: Enter on a submit-capable button already triggers submit; also support Space/Enter on button
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
    });
  }

  function initAll() {
    var forms = document.forms;
    for (var i = 0; i < forms.length; i++) {
      var f = forms[i];
      if (f.name === 'calcSearchForm') continue;
      initCalc(f);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();

})(window, document);
