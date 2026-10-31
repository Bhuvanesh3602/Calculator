/**
 * calc-core.js — Shared calculation engine (self-contained, zero deps).
 * Every calculator page can include this and call the formula for its type.
 * Numbers/currency use Intl.NumberFormat (guideline: no hardcoded formats).
 */

(function (window) {
  'use strict';

  var currencyFmt = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  var numberFmt = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0, maximumFractionDigits: 4
  });
  var percentFmt = new Intl.NumberFormat('en-US', {
    style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2
  });

  function $ (id) { return document.getElementById(id); }
  function valNum(id, def) {
    if (def == null) def = 0;
    var el = $(id);
    if (!el) return def;
    var v = parseFloat((el.value || '').replace(/[$,%\s]/g, ''));
    return isNaN(v) || !isFinite(v) ? def : v;
  }
  function valStr(id, def) {
    if (def == null) def = '';
    var el = $(id);
    return el ? (el.value || '').trim() : def;
  }
  function valChecked(id) {
    var el = $(id);
    return el ? el.checked : false;
  }
  function valRadio(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function money(n) {
    if (n == null || isNaN(n) || !isFinite(n)) return '$0.00';
    return currencyFmt.format(n);
  }
  function num(n, dec) {
    if (n == null || isNaN(n) || !isFinite(n)) return '0';
    if (dec == null) dec = 2;
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dec });
  }

  // ---- Mortgage (fixed) ----
  function calcMortgage(inputs) {
    var price = valNumFrom(inputs, 'price', 400000);
    var downPct = valNumFrom(inputs, 'downPct', 20);
    var termYears = valNumFrom(inputs, 'termYears', 30);
    var rate = valNumFrom(inputs, 'rate', 7.0);
    var includeCosts = valNumFrom(inputs, 'includeCosts', 1) ? 1 : 0;
    var propTax = valNumFrom(inputs, 'propTax', 1.2);
    var homeIns = valNumFrom(inputs, 'homeIns', 1500);
    var pmi = valNumFrom(inputs, 'pmi', 0);
    var hoa = valNumFrom(inputs, 'hoa', 0);

    var downAmount = price * (downPct / 100);
    var loan = price - downAmount;
    var monthlyRate = (rate / 100) / 12;
    var n = termYears * 12;
    var pi = monthlyRate > 0 ? loan * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1) : loan / n;

    var taxAnnual = includeCosts ? price * (propTax / 100) : 0;
    var insAnnual = includeCosts ? homeIns : 0;
    var pmiAnnual = includeCosts && downPct < 20 ? (pmi || loan * 0.005) : 0;
    var totalMonthly = pi + taxAnnual / 12 + insAnnual / 12 + pmiAnnual / 12 + hoa;
    var totalPaid = totalMonthly * n + downAmount;
    var totalInterest = pi * n - loan;

    return {
      monthly: totalMonthly, principalInterest: pi, loan: loan, down: downAmount,
      totalInterest: totalInterest, totalPaid: totalPaid, monthlyPI: pi,
      taxMonthly: taxAnnual / 12, insMonthly: insAnnual / 12, pmiMonthly: pmiAnnual / 12, hoa: hoa
    };
  }

  // ---- Loan (amortized / deferred / bond) ----
  function calcLoan(inputs) {
    var amount = valNumFrom(inputs, 'amount', 100000);
    var termYears = valNumFrom(inputs, 'termYears', 10);
    var termMonths = valNumFrom(inputs, 'termMonths', 0);
    var rate = valNumFrom(inputs, 'rate', 6.0);
    var type = valNumFrom(inputs, 'type', 1); // 1 amortized, 2 deferred, 3 bond
    var totalMonths = termYears * 12 + termMonths || 120;
    var monthlyRate = (rate / 100) / 12;
    var monthlyPay = monthlyRate > 0 ? amount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1) : amount / totalMonths;
    var totalPayments = monthlyPay * totalMonths;
    var totalInterest = totalPayments - amount;
    if (type === 2) { // deferred: lump sum at maturity
      monthlyPay = amount * Math.pow(1 + monthlyRate, totalMonths);
      totalPayments = monthlyPay;
      totalInterest = totalPayments - amount;
    } else if (type === 3) { // bond: amount received at start
      monthlyPay = amount / Math.pow(1 + monthlyRate, totalMonths);
      totalPayments = amount;
      totalInterest = amount - monthlyPay;
    }
    return { monthlyPay: monthlyPay, totalPayments: totalPayments, totalInterest: totalInterest, amount: amount };
  }

  // ---- BMI ----
  function calcBMI(inputs) {
    var feet = valNumFrom(inputs, 'feet', 5);
    var inches = valNumFrom(inputs, 'inches', 10);
    var pounds = valNumFrom(inputs, 'pounds', 160);
    var meters = valNumFrom(inputs, 'meters', 178) / 100;
    var kg = valNumFrom(inputs, 'kg', 70);
    var metric = valNumFrom(inputs, 'metric', 0) ? 1 : 0;
    var hM, wKg;
    if (!metric) { hM = (feet * 12 + inches) * 0.0254; wKg = pounds * 0.45359237; }
    else { hM = meters; wKg = kg; }
    if (hM <= 0) hM = 1.78;
    var bmi = wKg / (hM * hM);
    var cat = bmi < 16 ? 'Severe Thinness' : bmi < 17 ? 'Moderate Thinness' : bmi < 18.5 ? 'Mild Thinness' :
              bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : bmi < 35 ? 'Obese Class I' :
              bmi < 40 ? 'Obese Class II' : 'Obese Class III';
    var minLb = (18.5 * hM * hM) * 2.20462;
    var maxLb = (25 * hM * hM) * 2.20462;
    return { bmi: bmi, category: cat, minLb: minLb, maxLb: maxLb, minKg: minLb / 2.20462, maxKg: maxLb / 2.20462 };
  }

  // ---- BMR / Calorie / TDEE ----
  function calcCalorie(inputs) {
    var age = valNumFrom(inputs, 'age', 25);
    var gender = valStrFrom(inputs, 'gender', 'm');
    var feet = valNumFrom(inputs, 'feet', 5);
    var inches = valNumFrom(inputs, 'inches', 10);
    var pounds = valNumFrom(inputs, 'pounds', 165);
    var factor = valNumFrom(inputs, 'factor', 1.375);
    var hCm = (feet * 12 + inches) * 2.54;
    var wKg = pounds * 0.453592;
    var bmr = gender === 'm' ? 10 * wKg + 6.25 * hCm - 5 * age + 5 : 10 * wKg + 6.25 * hCm - 5 * age - 161;
    var maintain = Math.round(bmr * factor);
    return { bmr: bmr, maintain: maintain, mild: Math.max(1200, maintain - 250),
             loss: Math.max(1200, maintain - 500), extreme: Math.max(1000, maintain - 1000) };
  }

  // ---- Age ----
  function calcAge(inputs) {
    var bY = valNumFrom(inputs, 'bYear', 1995), bM = valNumFrom(inputs, 'bMonth', 1) - 1, bD = valNumFrom(inputs, 'bDay', 1);
    var aY = valNumFrom(inputs, 'aYear', 2026), aM = valNumFrom(inputs, 'aMonth', 10) - 1, aD = valNumFrom(inputs, 'aDay', 25);
    var birth = new Date(bY, bM, bD), target = new Date(aY, aM, aD);
    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;
    var years = target.getFullYear() - birth.getFullYear();
    var months = target.getMonth() - birth.getMonth();
    var days = target.getDate() - birth.getDate();
    if (days < 0) { months--; var pm = new Date(target.getFullYear(), target.getMonth(), 0); days += pm.getDate(); }
    if (months < 0) { years--; months += 12; }
    var diffMs = target - birth;
    var totalDays = Math.floor(diffMs / 86400000);
    return { years: years, months: months, days: days, totalDays: totalDays,
             totalWeeks: Math.floor(totalDays / 7), remDays: totalDays % 7,
             totalHours: totalDays * 24, totalMinutes: totalDays * 1440, totalSeconds: totalDays * 86400 };
  }

  // ---- Percent / Tip / Discount ----
  function calcPercent(inputs) {
    var v1 = valNumFrom(inputs, 'v1', 0);
    var v2 = valNumFrom(inputs, 'v2', 0);
    var mode = valStrFrom(inputs, 'mode', 'of'); // of, iswhat, tip, discount, increase
    var result = 0;
    if (mode === 'tip') result = (v2 / 100) * v1;
    else if (mode === 'discount') result = v1 - (v2 / 100) * v1;
    else if (mode === 'iswhat') result = (v1 / v2) * 100;
    else if (mode === 'increase') result = ((v2 - v1) / Math.abs(v1 || 1)) * 100;
    else result = (v1 / 100) * v2;
    return { result: result };
  }

  // ---- Interest / Savings / CD ----
  function calcInterest(inputs) {
    var p = valNumFrom(inputs, 'principal', 10000);
    var r = valNumFrom(inputs, 'rate', 5) / 100;
    var t = valNumFrom(inputs, 'years', 5);
    var pmt = valNumFrom(inputs, 'contribution', 0);
    var n = valNumFrom(inputs, 'compoundN', 12);
    var totalPrincipal = p + pmt * 12 * t;
    var end = p * Math.pow(1 + r / n, n * t);
    if (pmt > 0 && r > 0) {
      var pr = r / 12, periods = t * 12;
      end += pmt * (Math.pow(1 + pr, periods) - 1) / pr;
    }
    return { endBalance: end, totalPrincipal: totalPrincipal, totalInterest: end - totalPrincipal };
  }

  // ---- Fraction ----
  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
  function calcFraction(inputs) {
    var n1 = valNumFrom(inputs, 'n1', 1), d1 = valNumFrom(inputs, 'd1', 2) || 1;
    var n2 = valNumFrom(inputs, 'n2', 1), d2 = valNumFrom(inputs, 'd2', 4) || 1;
    var op = valStrFrom(inputs, 'op', '+');
    var rn, rd;
    if (op === '+') { rn = n1 * d2 + n2 * d1; rd = d1 * d2; }
    else if (op === '-') { rn = n1 * d2 - n2 * d1; rd = d1 * d2; }
    else if (op === '*') { rn = n1 * n2; rd = d1 * d2; }
    else { rn = n1 * d2; rd = d1 * n2 || 1; }
    if (rd === 0) return { error: 'Denominator cannot be zero.' };
    var g = Math.abs(gcd(rn, rd));
    return { num: rn / g, den: rd / g, decimal: (rn / rd).toFixed(4) };
  }

  // ---- Subnet ----
  function calcSubnet(inputs) {
    var ip = valStrFrom(inputs, 'ip', '192.168.1.1');
    var bits = parseInt(valStrFrom(inputs, 'mask', '24').replace('/', '')) || 24;
    if (bits < 1) bits = 1; if (bits > 32) bits = 32;
    var parts = ip.split('.').map(function (x) { return parseInt(x) || 0; });
    if (parts.length !== 4) return { error: 'Invalid IP.' };
    var ipNum = ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0);
    var maskNum = bits === 0 ? 0 : (~((1 << (32 - bits)) - 1)) >>> 0;
    var net = (ipNum & maskNum) >>> 0;
    var bcast = (net | (~maskNum >>> 0)) >>> 0;
    function n2ip(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
    var first = bits >= 31 ? net : n2ip(net + 1);
    var last = bits >= 31 ? bcast : n2ip(bcast - 1);
    var hosts = bits >= 31 ? (bits === 31 ? 2 : 1) : (Math.pow(2, 32 - bits) - 2);
    return { network: n2ip(net), mask: n2ip(maskNum), broadcast: n2ip(bcast),
             first: first, last: last, hosts: hosts };
  }

  // ---- helpers to read from a named inputs map ----
  function valNumFrom(inputs, key, def) {
    var el = inputs[key];
    if (!el) return def;
    var v = parseFloat((el.value || '').replace(/[$,%\s]/g, ''));
    return isNaN(v) || !isFinite(v) ? def : v;
  }
  function valStrFrom(inputs, key, def) {
    var el = inputs[key];
    if (!el) return def;
    return (el.value || '').trim();
  }

  window.CalcCore = {
    money: money, num: num, percent: percentFmt.format,
    calcMortgage: calcMortgage, calcLoan: calcLoan, calcBMI: calcBMI,
    calcCalorie: calcCalorie, calcAge: calcAge, calcPercent: calcPercent,
    calcInterest: calcInterest, calcFraction: calcFraction, calcSubnet: calcSubnet,
    valNum: valNum, valStr: valStr, valChecked: valChecked, valRadio: valRadio,
    $: $
  };
})(window);
