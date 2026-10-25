/**
 * Live Client-Side Calculation Engine for Calculator.net Clone
 * Accurately reproduces interactive calculations for top calculators with instant updates.
 */

(function () {
  'use strict';

  function fmtMoney(num) {
    if (isNaN(num) || !isFinite(num)) return '$0.00';
    return '$' + Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtNum(num, dec = 2) {
    if (isNaN(num) || !isFinite(num)) return '0';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dec });
  }

  function val(nameOrId, defaultVal = 0) {
    var el = document.getElementById(nameOrId) || document.querySelector('[name="' + nameOrId + '"]');
    if (!el) return defaultVal;
    var v = (el.value || '').toString().replace(/[$,%]/g, '').trim();
    var n = parseFloat(v);
    return isNaN(n) ? defaultVal : n;
  }

  function strVal(nameOrId, defaultVal = '') {
    var el = document.getElementById(nameOrId) || document.querySelector('[name="' + nameOrId + '"]');
    return el ? (el.value || '').trim() : defaultVal;
  }

  function checked(nameOrId) {
    var el = document.getElementById(nameOrId) || document.querySelector('[name="' + nameOrId + '"]');
    return el ? el.checked : false;
  }

  function getRadio(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function getPath() {
    var p = window.location.pathname.toLowerCase();
    if (p.endsWith('/')) p += 'index.html';
    return p;
  }

  // Populate form fields from URL params if present
  function loadQueryParams() {
    var params = new URLSearchParams(window.location.search);
    params.forEach(function (value, key) {
      var el = document.getElementById(key) || document.querySelector('[name="' + key + '"]');
      if (el) {
        if (el.type === 'checkbox') {
          el.checked = (value === '1' || value === 'true' || value === 'on');
        } else if (el.type === 'radio') {
          var r = document.querySelector('input[name="' + key + '"][value="' + value + '"]');
          if (r) r.checked = true;
        } else {
          el.value = value;
        }
      }
    });
  }

  // ==========================================
  // 1. MORTGAGE CALCULATOR
  // ==========================================
  function initMortgage() {
    var form = document.forms['calform'];
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calcMortgage();
    });

    var submitBtn = form.querySelector('input[type="submit"]') || form.querySelector('input[value="Calculate"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        calcMortgage();
      });
    }

    function calcMortgage() {
      var price = val('chouseprice', 400000);
      var downPct = val('cdownpayment', 20);
      var downAmount = price * (downPct / 100);
      var loanAmount = price - downAmount;
      var termYears = val('cloanterm', 30);
      var annualRate = val('cinterestrate', 7.0);
      var monthlyRate = (annualRate / 100) / 12;
      var n = termYears * 12;

      var monthlyPI = 0;
      if (monthlyRate > 0) {
        monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
      } else {
        monthlyPI = loanAmount / n;
      }

      var incTaxes = checked('caddoptional');
      var propTaxAnnual = incTaxes ? (price * (val('cpropertytaxes', 1.2) / 100)) : 0;
      var homeInsAnnual = incTaxes ? val('chomeins', 1500) : 0;
      var pmiAnnual = incTaxes ? (downPct < 20 ? (val('cpmi', 0) || (loanAmount * 0.005)) : 0) : 0;
      var hoaMonthly = incTaxes ? val('choa', 0) : 0;

      var monthlyTax = propTaxAnnual / 12;
      var monthlyIns = homeInsAnnual / 12;
      var monthlyPMI = pmiAnnual / 12;
      var totalMonthly = monthlyPI + monthlyTax + monthlyIns + monthlyPMI + hoaMonthly;

      var totalPIPaid = monthlyPI * n;
      var totalInterest = totalPIPaid - loanAmount;
      var totalCost = totalMonthly * n + downAmount;

      // Update H2 header
      var h2 = document.querySelector('#content h2');
      if (h2) {
        h2.innerHTML = 'Monthly Pay: &nbsp; ' + fmtMoney(totalMonthly);
      }

      // Update summary table if exists
      var summaryRows = document.querySelectorAll('#content table.cinfoT tr');
      summaryRows.forEach(function (tr) {
        var text = tr.innerText || '';
        var td = tr.querySelectorAll('td');
        if (td.length >= 2) {
          if (text.includes('Loan Amount')) td[1].innerText = fmtMoney(loanAmount);
          if (text.includes('Total Interest')) td[1].innerText = fmtMoney(totalInterest);
          if (text.includes('Total of') && text.includes('Payments')) td[1].innerText = fmtMoney(totalMonthly * n);
          if (text.includes('Total All Payments')) td[1].innerText = fmtMoney(totalCost);
        }
      });

      // Update pie chart SVG if present
      var svgText = document.querySelector('#content svg text');
      if (svgText) svgText.textContent = fmtMoney(totalMonthly);
    }
  }

  // ==========================================
  // 2. LOAN CALCULATOR & AUTO LOAN
  // ==========================================
  function initLoan() {
    var form = document.forms['calform'];
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calcLoan();
    });

    var submitBtn = form.querySelector('input[type="submit"]') || form.querySelector('input[value="Calculate"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        calcLoan();
      });
    }

    function calcLoan() {
      var amount = val('cloanamount', val('cprice', 20000));
      var termYears = val('cloanterm', 5);
      var termMonths = val('cloantermmonth', 0);
      var totalMonths = (termYears * 12) + termMonths;
      if (totalMonths <= 0) totalMonths = 60;

      var rate = val('cinterestrate', 6.0);
      var monthlyRate = (rate / 100) / 12;

      var monthlyPay = 0;
      if (monthlyRate > 0) {
        monthlyPay = amount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      } else {
        monthlyPay = amount / totalMonths;
      }

      var totalPayments = monthlyPay * totalMonths;
      var totalInterest = totalPayments - amount;

      var h2 = document.querySelector('#content h2');
      if (h2) {
        if (h2.innerText.includes('Monthly Pay')) {
          h2.innerHTML = 'Monthly Pay: &nbsp; ' + fmtMoney(monthlyPay);
        } else {
          h2.innerHTML = 'Payment Every Month: ' + fmtMoney(monthlyPay);
        }
      }

      // Update summary table
      var summaryRows = document.querySelectorAll('#content table.cinfoT tr');
      summaryRows.forEach(function (tr) {
        var text = tr.innerText || '';
        var td = tr.querySelectorAll('td');
        if (td.length >= 2) {
          if (text.includes('Total of') && text.includes('Payments')) td[1].innerText = fmtMoney(totalPayments);
          if (text.includes('Total Interest')) td[1].innerText = fmtMoney(totalInterest);
        }
      });
    }
  }

  // ==========================================
  // 3. BMI CALCULATOR
  // ==========================================
  function initBMI() {
    var form = document.forms['calform'];
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calcBMI();
    });

    var submitBtn = form.querySelector('input[type="submit"]') || form.querySelector('input[value="Calculate"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        calcBMI();
      });
    }

    function calcBMI() {
      var isMetric = document.getElementById('standardheightweight') &&
                     document.getElementById('standardheightweight').style.display === 'none';

      var heightM = 0;
      var weightKg = 0;

      if (!isMetric) {
        var feet = val('cheightfeet', 5);
        var inches = val('cheightinch', 10);
        var totalInches = (feet * 12) + inches;
        heightM = totalInches * 0.0254;
        var lbs = val('cpound', 160);
        weightKg = lbs * 0.45359237;
      } else {
        heightM = val('cheightmeter', 178) / 100;
        weightKg = val('ckg', 70);
      }

      if (heightM <= 0) heightM = 1.78;
      var bmi = weightKg / (heightM * heightM);

      var category = '';
      var color = '#333';
      if (bmi < 16) { category = 'Severe Thinness'; color = '#d9534f'; }
      else if (bmi < 17) { category = 'Moderate Thinness'; color = '#f0ad4e'; }
      else if (bmi < 18.5) { category = 'Mild Thinness'; color = '#f0ad4e'; }
      else if (bmi < 25) { category = 'Normal'; color = '#5cb85c'; }
      else if (bmi < 30) { category = 'Overweight'; color = '#f0ad4e'; }
      else if (bmi < 35) { category = 'Obese Class I'; color = '#d9534f'; }
      else if (bmi < 40) { category = 'Obese Class II'; color = '#d9534f'; }
      else { category = 'Obese Class III'; color = '#d9534f'; }

      var minHealthyKg = 18.5 * (heightM * heightM);
      var maxHealthyKg = 25 * (heightM * heightM);
      var minHealthyLb = minHealthyKg * 2.20462;
      var maxHealthyLb = maxHealthyKg * 2.20462;

      // Update BMI display
      var bigtext = document.querySelector('.verybigtext') || document.querySelector('.bigtext');
      if (bigtext) {
        bigtext.innerHTML = 'BMI = ' + fmtNum(bmi, 1) + ' kg/m<sup>2</sup> &nbsp; (<font color="' + color + '"><b>' + category + '</b></font>)';
      }

      // Update healthy weight line
      var contentP = document.querySelectorAll('#content p');
      contentP.forEach(function (p) {
        if (p.innerText.includes('Healthy BMI range:')) {
          p.innerHTML = 'Healthy BMI range: <b>18.5 kg/m<sup>2</sup> - 25 kg/m<sup>2</sup></b><br>' +
            'Healthy weight for the height: <b>' + fmtNum(minHealthyLb, 1) + ' lbs - ' + fmtNum(maxHealthyLb, 1) + ' lbs</b> (' +
            fmtNum(minHealthyKg, 1) + ' kg - ' + fmtNum(maxHealthyKg, 1) + ' kg)';
        }
      });
    }
  }

  // ==========================================
  // 4. CALORIE & BMR CALCULATOR
  // ==========================================
  function initCalorie() {
    var form = document.forms['calform'];
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calcCalories();
    });

    var submitBtn = form.querySelector('input[type="submit"]') || form.querySelector('input[value="Calculate"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        calcCalories();
      });
    }

    function calcCalories() {
      var age = val('cage', 25);
      var gender = getRadio('csex') || 'm';
      var feet = val('cheightfeet', 5);
      var inches = val('cheightinch', 10);
      var heightCm = (feet * 12 + inches) * 2.54;
      var weightKg = val('cpound', 165) * 0.453592;

      var bmr = 0;
      if (gender === 'm') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
      } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      }

      var activityEl = document.getElementById('cactivity') || document.querySelector('[name="cactivity"]');
      var factor = 1.375;
      if (activityEl) {
        var actVal = parseFloat(activityEl.value);
        if (!isNaN(actVal) && actVal > 1) factor = actVal;
      }

      var maintain = Math.round(bmr * factor);
      var mildLoss = Math.max(1200, maintain - 250);
      var loss = Math.max(1200, maintain - 500);
      var extremeLoss = Math.max(1000, maintain - 1000);

      // Update results table if present
      var bigNums = document.querySelectorAll('#content .cinfoT td.bigtext, #content .cinfoT b');
      bigNums.forEach(function (el) {
        var parentText = (el.parentElement.parentElement ? el.parentElement.parentElement.innerText : '');
        if (parentText.includes('Maintain weight')) el.innerText = maintain.toLocaleString() + ' Calories/day';
        if (parentText.includes('Mild weight loss')) el.innerText = mildLoss.toLocaleString() + ' Calories/day';
        if (parentText.includes('Weight loss')) el.innerText = loss.toLocaleString() + ' Calories/day';
        if (parentText.includes('Extreme weight loss')) el.innerText = extremeLoss.toLocaleString() + ' Calories/day';
      });
    }
  }

  // ==========================================
  // 5. AGE CALCULATOR
  // ==========================================
  function initAge() {
    var form = document.forms['calcf'] || document.forms['calform'];
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calcAge();
    });

    var submitBtn = form.querySelector('input[type="submit"]') || form.querySelector('input[value="Calculate"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        calcAge();
      });
    }

    function calcAge() {
      var bMonth = parseInt(strVal('today_Month_ID', '1')) - 1;
      var bDay = parseInt(strVal('today_Day_ID', '1'));
      var bYear = parseInt(strVal('today_Year_ID', '1995'));

      var aMonth = parseInt(strVal('ageat_Month_ID', '10')) - 1;
      var aDay = parseInt(strVal('ageat_Day_ID', '25'));
      var aYear = parseInt(strVal('ageat_Year_ID', '2026'));

      var birth = new Date(bYear, bMonth, bDay);
      var target = new Date(aYear, aMonth, aDay);

      if (isNaN(birth.getTime()) || isNaN(target.getTime())) return;

      var years = target.getFullYear() - birth.getFullYear();
      var months = target.getMonth() - birth.getMonth();
      var days = target.getDate() - birth.getDate();

      if (days < 0) {
        months--;
        var prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      var diffMs = target - birth;
      var totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      var totalWeeks = Math.floor(totalDays / 7);
      var remDays = totalDays % 7;
      var totalHours = totalDays * 24;
      var totalMinutes = totalHours * 60;
      var totalSeconds = totalMinutes * 60;

      // Find or create result container
      var resDiv = document.getElementById('age-result-box');
      if (!resDiv) {
        resDiv = document.createElement('div');
        resDiv.id = 'age-result-box';
        resDiv.style.margin = '20px 0';
        resDiv.style.padding = '15px';
        resDiv.style.backgroundColor = '#f7fdf4';
        resDiv.style.border = '1px solid #417516';
        resDiv.style.borderRadius = '4px';
        form.parentNode.insertBefore(resDiv, form);
      }

      resDiv.innerHTML = '<h2 style="color:#417516;margin-top:0;">Result</h2>' +
        '<p style="font-size:22px;margin:10px 0;"><b>Age:</b> ' + years + ' years ' + months + ' months ' + days + ' days</p>' +
        '<p style="margin:5px 0;">or ' + (years * 12 + months) + ' months ' + days + ' days</p>' +
        '<p style="margin:5px 0;">or ' + totalWeeks.toLocaleString() + ' weeks ' + remDays + ' days</p>' +
        '<p style="margin:5px 0;">or ' + totalDays.toLocaleString() + ' days</p>' +
        '<p style="margin:5px 0;">or ' + totalHours.toLocaleString() + ' hours</p>' +
        '<p style="margin:5px 0;">or ' + totalMinutes.toLocaleString() + ' minutes</p>' +
        '<p style="margin:5px 0;">or ' + totalSeconds.toLocaleString() + ' seconds</p>';

      resDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ==========================================
  // 6. PERCENTAGE CALCULATOR
  // ==========================================
  function initPercent() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function (f) {
      if (f.name === 'calcSearchForm') return;
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        calcAnyPercent(f);
      });
      var btn = f.querySelector('input[type="submit"]') || f.querySelector('input[value="Calculate"]');
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          calcAnyPercent(f);
        });
      }
    });

    function calcAnyPercent(f) {
      var inputs = f.querySelectorAll('input[type="text"], input[type="number"]');
      if (inputs.length >= 2) {
        var v1 = parseFloat(inputs[0].value.replace(/,/g, ''));
        var v2 = parseFloat(inputs[1].value.replace(/,/g, ''));
        if (isNaN(v1) || isNaN(v2)) return;

        var result = 0;
        var fText = f.innerText || '';

        if (fText.includes('what is') && fText.includes('of')) {
          result = (v1 / 100) * v2;
        } else if (fText.includes('is what % of')) {
          result = (v1 / v2) * 100;
        } else if (fText.includes('increase') || fText.includes('decrease') || fText.includes('difference')) {
          result = ((v2 - v1) / Math.abs(v1)) * 100;
        } else {
          result = (v1 / 100) * v2;
        }

        var outEl = f.querySelector('.coutput') || f.querySelector('input[readonly]');
        if (outEl) {
          outEl.value = fmtNum(result, 4);
        } else {
          var p = f.querySelector('p.result-text');
          if (!p) {
            p = document.createElement('p');
            p.className = 'result-text';
            p.style.fontSize = '18px';
            p.style.fontWeight = 'bold';
            p.style.color = '#417516';
            f.appendChild(p);
          }
          p.innerHTML = 'Result: ' + fmtNum(result, 4);
        }
      }
    }
  }

  // ==========================================
  // 7. INTEREST & COMPOUND INTEREST
  // ==========================================
  function initInterest() {
    var form = document.forms['calform'];
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calcInterest();
    });

    var submitBtn = form.querySelector('input[type="submit"]') || form.querySelector('input[value="Calculate"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        calcInterest();
      });
    }

    function calcInterest() {
      var p = val('cstartingprinciple', val('cprincipal', 10000));
      var r = val('cinterestrate', 5) / 100;
      var t = val('cyears', 5);
      var pmt = val('ccontributions', 0);

      var n = 12; // monthly default
      var compound = strVal('ccompound', 'monthly');
      if (compound === 'annually') n = 1;
      else if (compound === 'semiannually') n = 2;
      else if (compound === 'quarterly') n = 4;
      else if (compound === 'daily') n = 365;

      var totalPrincipal = p + (pmt * 12 * t);
      var endBalance = p * Math.pow(1 + r / n, n * t);
      if (pmt > 0 && r > 0) {
        var periodicRate = r / 12;
        var periods = t * 12;
        endBalance += pmt * (Math.pow(1 + periodicRate, periods) - 1) / periodicRate;
      }

      var totalInterest = endBalance - totalPrincipal;

      var h2 = document.querySelector('#content h2');
      if (h2) {
        h2.innerHTML = 'Ending Balance: ' + fmtMoney(endBalance);
      }

      var rows = document.querySelectorAll('#content table.cinfoT tr');
      rows.forEach(function (tr) {
        var text = tr.innerText || '';
        var td = tr.querySelectorAll('td');
        if (td.length >= 2) {
          if (text.includes('Total Principal')) td[1].innerText = fmtMoney(totalPrincipal);
          if (text.includes('Total Interest')) td[1].innerText = fmtMoney(totalInterest);
          if (text.includes('End Balance')) td[1].innerText = fmtMoney(endBalance);
        }
      });
    }
  }

  // ==========================================
  // 8. PASSWORD GENERATOR
  // ==========================================
  function initPassword() {
    var form = document.forms['calform'];
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      generatePassword();
    });

    var submitBtn = form.querySelector('input[type="submit"]') || form.querySelector('input[value="Generate"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        generatePassword();
      });
    }

    function generatePassword() {
      var len = parseInt(val('plength', 16));
      if (len < 4) len = 4;
      if (len > 128) len = 128;

      var useUpper = checked('pupper');
      var useLower = checked('plower');
      var useNumbers = checked('pnumber');
      var useSymbols = checked('psymbol');

      var uChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var lChars = 'abcdefghijklmnopqrstuvwxyz';
      var nChars = '0123456789';
      var sChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';

      var charset = '';
      if (useUpper) charset += uChars;
      if (useLower) charset += lChars;
      if (useNumbers) charset += nChars;
      if (useSymbols) charset += sChars;
      if (charset.length === 0) charset = uChars + lChars + nChars;

      var pass = '';
      for (var i = 0; i < len; i++) {
        var idx = Math.floor(Math.random() * charset.length);
        pass += charset.charAt(idx);
      }

      var out = document.querySelector('.verybigtext') || document.getElementById('passoutput') || document.querySelector('#content h2');
      if (out) {
        out.innerHTML = '<span style="font-family:monospace;background:#f0f0f0;padding:6px 14px;border:1px solid #ccc;border-radius:4px;user-select:all;display:inline-block;margin:10px 0;">' + pass + '</span>';
      }
    }
  }

  // ==========================================
  // 9. RANDOM NUMBER GENERATOR
  // ==========================================
  function initRandom() {
    var form = document.forms['calform'] || document.querySelector('form');
    if (!form || form.name === 'calcSearchForm') return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      genRand();
    });

    function genRand() {
      var lower = val('slower', 1);
      var upper = val('supper', 100);
      if (upper < lower) { var t = upper; upper = lower; lower = t; }
      var count = val('scount', 1);
      var results = [];
      for (var i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * (upper - lower + 1)) + lower);
      }
      var out = document.querySelector('.verybigtext') || document.querySelector('#content h2');
      if (out) {
        out.innerHTML = 'Result: ' + results.join(', ');
      }
    }
  }

  // ==========================================
  // 10. FRACTION CALCULATOR
  // ==========================================
  function initFraction() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function (f) {
      if (f.name === 'calcSearchForm') return;
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        calcFraction(f);
      });
    });

    function gcd(a, b) {
      return b === 0 ? a : gcd(b, a % b);
    }

    function calcFraction(f) {
      var n1 = val('t1', 1);
      var d1 = val('b1', 2);
      var n2 = val('t2', 1);
      var d2 = val('b2', 4);
      var op = strVal('op', '+');

      if (d1 === 0 || d2 === 0) return alert('Denominator cannot be zero.');

      var resNum = 0;
      var resDen = d1 * d2;

      if (op === '+') {
        resNum = (n1 * d2) + (n2 * d1);
      } else if (op === '-') {
        resNum = (n1 * d2) - (n2 * d1);
      } else if (op === '*') {
        resNum = n1 * n2;
        resDen = d1 * d2;
      } else if (op === '/') {
        resNum = n1 * d2;
        resDen = d1 * n2;
      }

      var g = Math.abs(gcd(resNum, resDen));
      var simpNum = resNum / g;
      var simpDen = resDen / g;
      var decimal = (simpNum / simpDen).toFixed(4);

      var out = f.querySelector('.coutput') || document.querySelector('#content h2');
      if (out) {
        out.innerHTML = 'Result: <b>' + simpNum + '/' + simpDen + '</b> (' + decimal + ')';
      }
    }
  }

  // ==========================================
  // 11. IP SUBNET CALCULATOR
  // ==========================================
  function initSubnet() {
    var form = document.forms['calform'];
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calcSubnet();
    });

    function calcSubnet() {
      var ip = strVal('cip', '192.168.1.1');
      var maskBits = parseInt(strVal('cmask', '24').replace('/', ''));
      if (isNaN(maskBits) || maskBits < 1 || maskBits > 32) maskBits = 24;

      var parts = ip.split('.').map(function (x) { return parseInt(x) || 0; });
      if (parts.length !== 4) return;

      var ipNum = ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0);
      var maskNum = maskBits === 0 ? 0 : (~((1 << (32 - maskBits)) - 1)) >>> 0;
      var netNum = (ipNum & maskNum) >>> 0;
      var bcastNum = (netNum | (~maskNum >>> 0)) >>> 0;

      function numToIp(n) {
        return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
      }

      var netIp = numToIp(netNum);
      var maskIp = numToIp(maskNum);
      var bcastIp = numToIp(bcastNum);
      var firstIp = maskBits >= 31 ? netIp : numToIp(netNum + 1);
      var lastIp = maskBits >= 31 ? bcastIp : numToIp(bcastNum - 1);
      var usableHosts = maskBits >= 31 ? (maskBits === 31 ? 2 : 1) : (Math.pow(2, 32 - maskBits) - 2);

      var rows = document.querySelectorAll('#content table.cinfoT tr');
      rows.forEach(function (tr) {
        var text = tr.innerText || '';
        var td = tr.querySelectorAll('td');
        if (td.length >= 2) {
          if (text.includes('Network Address')) td[1].innerText = netIp;
          if (text.includes('Subnet Mask')) td[1].innerText = maskIp;
          if (text.includes('Broadcast')) td[1].innerText = bcastIp;
          if (text.includes('Usable Host Range')) td[1].innerText = firstIp + ' - ' + lastIp;
          if (text.includes('Number of Usable Hosts')) td[1].innerText = usableHosts.toLocaleString();
        }
      });
    }
  }

  // ==========================================
  // Router / Initializer
  // ==========================================
  function init() {
    loadQueryParams();

    var path = getPath();
    if (path.includes('mortgage') || path.includes('va-mortgage') || path.includes('fha-loan')) {
      initMortgage();
    } else if (path.includes('loan') || path.includes('auto-loan') || path.includes('payment-calculator')) {
      initLoan();
    } else if (path.includes('bmi')) {
      initBMI();
    } else if (path.includes('calorie') || path.includes('bmr') || path.includes('tdee')) {
      initCalorie();
    } else if (path.includes('age-calculator')) {
      initAge();
    } else if (path.includes('percent') || path.includes('tip-calculator') || path.includes('discount')) {
      initPercent();
    } else if (path.includes('interest') || path.includes('savings') || path.includes('cd-calculator')) {
      initInterest();
    } else if (path.includes('password')) {
      initPassword();
    } else if (path.includes('random')) {
      initRandom();
    } else if (path.includes('fraction')) {
      initFraction();
    } else if (path.includes('subnet')) {
      initSubnet();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
