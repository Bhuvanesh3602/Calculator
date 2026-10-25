/*
(C) calculator.net all right reserved.
*/
function gObj(obj) {return document.getElementById(obj);}
function trimAll(sString){return sString.trim();}
function isNumber(val){val=val+"";if (val.length<1) return false;if (isNaN(val)){return false;}else{return true;}}
function isInteger(val){if (isNumber(val)){return val % 1 === 0;}else{return false;}}
function formatAsMoney(num){return formatAsMoneyFull(num, 1);}
function formatAsMoneyFull(num, hascents) {
	num = num.toString().replace(/\$|\,/g, '');
	if (isNaN(num)) num = "0";
	sign = (num == (num = Math.abs(num)));
	cents = '';
	if (hascents==1){
		num = Math.floor(num * 100 + 0.50000000001);
		cents = num % 100;
		num = Math.floor(num / 100).toString();
		if (cents < 10) cents = "0" + cents;
		cents = "." + cents;
	}else{
		num = Math.floor(num + 0.50000000001).toString();
	}
	for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
	return (((sign) ? '' : '-') + '$' + num + cents);
}
function clearForm(formObj){var allElements = formObj.elements; for (i = 0; i < allElements.length; i++){if ( allElements[i].type == 'text'||allElements[i].type == 'number'||allElements[i].type == 'date'||allElements[i].type == 'textarea' ) allElements[i].value= '';}}
function formatNum(inNum){outStr = ""+inNum;inNum = parseFloat(outStr);if ((outStr.length)>10){outStr = "" + inNum.toPrecision(10);}if (outStr.indexOf(".")>-1){while (outStr.charAt(outStr.length-1) == "0"){outStr = outStr.substr(0,(outStr.length-1));}if (outStr.charAt(outStr.length-1) == ".")outStr = outStr.substr(0,(outStr.length-1));return outStr;}else{return outStr;}}
function showquickmsg(inStr, isError){if (isError){inStr = "<font color=red>" + inStr + "</font>";}gObj("coutput").innerHTML = inStr;}
var tooltip=function(){var id = 'tt';var top = 3;var left = 3;var maxw = 300;var speed = 10;var timer = 20;var endalpha = 95;var alpha = 0;var tt,t,c,b,h;var isvisible = 1;var ismobile = false;var ie = document.all ? true : false;var htmlV = '<div onclick="tooltip.hide(); return false;" style="text-align:right;color:#fff;"><u><b>CLOSE</b></u></div>';return{show:function(v,ism){if (ism=='m'){ismobile = true;}else{ismobile = false;}if(tt == null){tt = document.createElement('div');tt.setAttribute('id',id);document.body.appendChild(tt);tt.style.opacity = 0;tt.style.filter = 'alpha(opacity=0)';document.onmousemove = this.pos;}isvisible = 0;tt.style.display = 'block';tt.innerHTML = v;if (ismobile) tt.innerHTML = v + htmlV;if(ie){tt.style.width = tt.offsetWidth;}if(tt.offsetWidth > maxw){tt.style.width = maxw + 'px'}if (ismobile) tt.style.width = '';h = parseInt(tt.offsetHeight) + top;clearInterval(tt.timer);tt.timer = setInterval(function(){tooltip.fade(1)},timer);},pos:function(e){if (isvisible==0){var x=0, y=0;if (document.all) {x = (document.documentElement && document.documentElement.scrollLeft) ? document.documentElement.scrollLeft : document.body.scrollLeft;y = (document.documentElement && document.documentElement.scrollTop) ? document.documentElement.scrollTop : document.body.scrollTop;x += window.event.clientX;y += window.event.clientY;} else {x = e.pageX;y = e.pageY;}if (ismobile){tt.style.left = "0px";}else{tt.style.left = (x+5) + "px";}tt.style.top = (y+10) + "px";}isvisible = 1;},fade:function(d){var a = alpha;if((a != endalpha && d == 1) || (a != 0 && d == -1)){var i = speed;if(endalpha - a < speed && d == 1){i = endalpha - a;}else if(alpha < speed && d == -1){i = a;}alpha = a + (i * d);tt.style.opacity = alpha * .01;tt.style.filter = 'alpha(opacity=' + alpha + ')';}else{clearInterval(tt.timer);if(d == -1){tt.style.display = 'none'}}},hide:function(){clearInterval(tt.timer);isvisible = 0;tt.style.display = 'none';}};}();
function iptErrmsg(iptInputObj, iptMsg){
	var iptFName = iptInputObj.name+'ifcErr';
	var iptErrObj = document.getElementById(iptFName);
	if (iptMsg.length<1){
		iptInputObj.style.borderColor = "#417516";
		if (iptErrObj !== null) iptErrObj.style.visibility = 'hidden';
	}else{
		if (iptErrObj !== null){
			iptErrObj.innerHTML = iptMsg;
		}else{
			iptErrObj = document.createElement("div");
			iptErrObj.setAttribute("class", "inputErrMsg");
			iptErrObj.setAttribute("id", iptFName);
			iptErrObj.innerHTML = iptMsg;
			iptInputObj.parentNode.insertBefore(iptErrObj, iptInputObj.nextSibling);
		}
		iptErrObj.style.visibility = 'visible';
		iptInputObj.style.borderColor = "red";
	}
}
function iptfieldCheck(ifcInput, ifcRequired, ifcType){
	var ifcIVal = trimAll("" + ifcInput.value);
	var ifcErrMsg = "";
	if ("r"==ifcRequired.toLowerCase()){
		if (ifcIVal.length<1){
			ifcInput.addEventListener("blur", function(){
				var ifcrIVal = trimAll("" + ifcInput.value);
				if (ifcrIVal.length<1) iptErrmsg(ifcInput, "required field");
			});
		}
	}
	if (ifcIVal.length>0){
		var ifcTemp = ifcType.toLowerCase();
		ifcIVal = ifcIVal.replace(/	/g, "").replace(/ /g, "").replace(/,/g, "");
		if (ifcTemp=="n"){
			if ((!isNumber(ifcIVal))&&(ifcIVal!="-")&&(ifcIVal!=".")) ifcErrMsg = "numbers only";
		}else if (ifcTemp=="pn"){
			if (!(isNumber(ifcIVal)&&(Number(ifcIVal)>0))) ifcErrMsg = "positive numbers only";
		}else if (ifcTemp=="pzn"){
			if (!(isNumber(ifcIVal)&&(Number(ifcIVal)>=0))) ifcErrMsg = "non negative numbers only";
		}else if (ifcTemp=="i"){
			if ((!isInteger(ifcIVal))&&(ifcIVal!="-")&&(ifcIVal!=".")) ifcErrMsg = "integers only";
		}else if (ifcTemp=="pi"){
			if (!(isInteger(ifcIVal)&&(Number(ifcIVal)>0))) ifcErrMsg = "positive integers only";
		}else if (ifcTemp=="pzi"){
			if (!(isNumber(ifcIVal)&&(Number(ifcIVal)>=0))) ifcErrMsg = "non negative integers only";
		}
	}
	iptErrmsg(ifcInput, ifcErrMsg);
}
function insertComma(e,l){let t=document.getElementById(e),d=t.value.toString().replaceAll(",",""),a="";if("i"==l)a=(d=d.replace(/[^\d.-]/g,"")).toString().split(".")[0].replace(/\B(?=(\d{3})+(?!\d))/g,",");else if("d"==l){let g=(d=d.replace(/[^\d.-]/g,"")).toString().split(".");a=g[0].replace(/\B(?=(\d{3})+(?!\d))/g,","),g.length>1&&(a+="."+g[1])}else"c"==l&&(a=d.replace(/\B(?=(\d{3})+(?!\d))/g,","));t.value=a}
function calcSearch(){var a="financial-calculator|Financial Calculators|mortgage-calculator|Mortgage Calculator|loan-calculator|Loan Calculator|auto-loan-calculator|Auto Loan Calculator|interest-calculator|Interest Calculator|payment-calculator|Payment Calculator|retirement-calculator|Retirement Calculator|amortization-calculator|Amortization Calculator|investment-calculator|Investment Calculator|currency-calculator|Currency Calculator|inflation-calculator|Inflation Calculator|finance-calculator|Finance Calculator|mortgage-payoff-calculator|Mortgage Payoff Calculator|tax-calculator|Income Tax Calculator|compound-interest-calculator|Compound Interest Calculator|salary-calculator|Salary Calculator|401k-calculator|401K Calculator|interest-rate-calculator|Interest Rate Calculator|sales-tax-calculator|Sales Tax Calculator|fitness-and-health-calculator|Fitness and Health Calculators|bmi-calculator|Body Mass Index (BMI) Calculator|calorie-calculator|Calorie Calculator|body-fat-calculator|Body Fat Calculator|bmr-calculator|Basal Metabolic Rate (BMR) Calculator|macro-calculator|Macro Calculator|ideal-weight-calculator|Ideal Weight Calculator|pregnancy-calculator|Pregnancy Calculator|pregnancy-weight-gain-calculator|Pregnancy Weight Gain Calculator|pregnancy-conception-calculator|Pregnancy Conception Calculator|due-date-calculator|Due Date Calculator|pace-calculator|Pace Calculator|math-calculator|Math Calculators|scientific-calculator|Scientific Calculator|fraction-calculator|Fraction Calculator|percent-calculator|Percentage Calculator|triangle-calculator|Triangle Calculator|volume-calculator|Volume Calculator|standard-deviation-calculator|Standard Deviation Calculator|random-number-generator|Random Number Generator|other-calculator|Other Calculators|age-calculator|Age Calculator|date-calculator|Date Calculator|time-calculator|Time Calculator|hours-calculator|Hours Calculator|gpa-calculator|GPA Calculator|grade-calculator|Grade Calculator|height-calculator|Height Calculator|concrete-calculator|Concrete Calculator|ip-subnet-calculator|IP Subnet Calculator|bra-size-calculator|Bra Size Calculator|password-generator|Password Generator|dice-roller|Dice Roller|conversion-calculator|Conversion Calculator|house-affordability-calculator|House Affordability Calculator|savings-calculator|Savings Calculator|rent-calculator|Rent Calculator|marriage-calculator|Marriage Tax Calculator|estate-tax-calculator|Estate Tax Calculator|pension-calculator|Pension Calculator|social-security-calculator|Social Security Calculator|annuity-calculator|Annuity Calculator|annuity-payout-calculator|Annuity Payout Calculator|credit-card-calculator|Credit Card Calculator|credit-card-payoff-calculator|Credit Cards Payoff Calculator|debt-payoff-calculator|Debt Payoff Calculator|debt-consolidation-calculator|Debt Consolidation Calculator|repayment-calculator|Repayment Calculator|student-loan-calculator|Student Loan Calculator|college-cost-calculator|College Cost Calculator|cd-calculator|CD Calculator|roth-ira-calculator|Roth IRA Calculator|ira-calculator|IRA Calculator|vat-calculator|VAT Calculator|cash-back-or-low-interest-calculator|Cash Back or Low Interest Calculator|auto-lease-calculator|Auto Lease Calculator|depreciation-calculator|Depreciation Calculator|average-return-calculator|Average Return Calculator|margin-calculator|Margin Calculator|discount-calculator|Discount Calculator|business-loan-calculator|Business Loan Calculator|debt-ratio-calculator|Debt-to-Income Ratio Calculator|real-estate-calculator|Real Estate Calculator|take-home-pay-calculator|Take-Home-Paycheck Calculator|personal-loan-calculator|Personal Loan Calculator|lease-calculator|Lease Calculator|refinance-calculator|Refinance Calculator|budget-calculator|Budget Calculator|rental-property-calculator|Rental Property Calculator|roi-calculator|Return on Investment (ROI) Calculator|apr-calculator|APR Calculator|fha-loan-calculator|FHA Loan Calculator|va-mortgage-calculator|VA Mortgage Calculator|down-payment-calculator|Down Payment Calculator|rent-vs-buy-calculator|Rent vs. Buy Calculator|payback-period-calculator|Payback Period Calculator|present-value-calculator|Present Value Calculator|future-value-calculator|Future Value Calculator|army-body-fat-calculator|Army Body Fat Calculator|weight-watchers-points-calculator|Weight Watcher Points Calculator|carbohydrate-calculator|Carbohydrate Calculator|lean-body-mass-calculator|Lean Body Mass Calculator|healthy-weight-calculator|Healthy Weight Calculator|calories-burned-calculator|Calories Burned Calculator|protein-calculator|Protein Calculator|fat-intake-calculator|Fat Intake Calculator|tdee-calculator|Total Daily Energy Expenditure (TDEE) Calculator|ovulation-calculator|Ovulation Calculator|conception-calculator|Conception Calculator|period-calculator|Period Calculator|gfr-calculator|Glomerular Filtration Rate (GFR) Calculator|body-type-calculator|Body Type Calculator|body-surface-area-calculator|Body Surface Area Calculator|bac-calculator|Blood Alcohol Content (BAC) Calculator|number-sequence-calculator|Number Sequence Calculator|percent-error-calculator|Percent Error Calculator|exponent-calculator|Exponent Calculator|binary-calculator|Binary Calculator|hex-calculator|Hex Calculator|half-life-calculator|Half-Life Calculator|quadratic-formula-calculator|Quadratic Formula Calculator|slope-calculator|Slope Calculator|log-calculator|Log Calculator|area-calculator|Area Calculator|sample-size-calculator|Sample Size Calculator|probability-calculator|Probability Calculator|statistics-calculator|Statistics Calculator|mean-median-mode-range-calculator|Mean, Median, Mode, Range Calculator|permutation-and-combination-calculator|Permutation and Combination Calculator|z-score-calculator|Z-score Calculator|confidence-interval-calculator|Confidence Interval Calculator|ratio-calculator|Ratio Calculator|distance-calculator|Distance Calculator|circle-calculator|Circle Calculator|surface-area-calculator|Surface Area Calculator|pythagorean-theorem-calculator|Pythagorean Theorem Calculator|right-triangle-calculator|Right Triangle Calculator|root-calculator|Root Calculator|lcm-calculator|Least Common Multiple (LCM) Calculator|gcf-calculator|Greatest Common Factor (GCF) Calculator|factor-calculator|Factor Calculator|rounding-calculator|Rounding Calculator|matrix-calculator|Matrix Calculator|scientific-notation-calculator|Scientific Notation Calculator|big-number-calculator|Big Number Calculator|fuel-cost-calculator|Fuel Cost Calculator|voltage-drop-calculator|Voltage Drop Calculator|btu-calculator|BTU Calculator|square-footage-calculator|Square Footage Calculator|time-card-calculator|Time Card Calculator|time-zone-calculator|Time Zone Calculator|love-calculator|Love Calculator|gdp-calculator|Gross Domestic Product (GDP) Calculator|gas-mileage-calculator|Gas Mileage Calculator|horsepower-calculator|Horsepower Calculator|engine-horsepower-calculator|Engine Horsepower Calculator|stair-calculator|Stair Calculator|resistor-calculator|Resistor Calculator|ohms-law-calculator|Ohms Law Calculator|electricity-calculator|Electricity Calculator|tip-calculator|Tip Calculator|mileage-calculator|Mileage Calculator|density-calculator|Density Calculator|mass-calculator|Mass Calculator|weight-calculator|Weight Calculator|golf-handicap-calculator|Golf Handicap Calculator|sleep-calculator|Sleep Calculator|tire-size-calculator|Tire Size Calculator|roofing-calculator|Roofing Calculator|tile-calculator|Tile Calculator|mulch-calculator|Mulch Calculator|gravel-calculator|Gravel Calculator|wind-chill-calculator|Wind Chill Calculator|heat-index-calculator|Heat Index Calculator|dew-point-calculator|Dew Point Calculator|bandwidth-calculator|Bandwidth Calculator|time-duration-calculator|Time Duration Calculator|day-counter|Day Counter|day-of-the-week-calculator|Day of the Week Calculator|mortgage-calculator-uk|Mortgage Calculator UK|canadian-mortgage-calculator|Canadian Mortgage Calculator|mortgage-amortization-calculator|Mortgage Amortization Calculator|percent-off-calculator|Percent Off Calculator|anorexic-bmi-calculator|Anorexic BMI Calculator|overweight-calculator|Overweight Calculator|prime-factorization-calculator|Prime Factorization Calculator|common-factor-calculator|Common Factor Calculator|basic-calculator|Basic Calculator|average-calculator|Average Calculator|p-value-calculator|P-value Calculator|commission-calculator|Commission Calculator|long-division-calculator|Long Division Calculator|simple-interest-calculator|Simple Interest Calculator|rmd-calculator|RMD Calculator|bond-calculator|Bond Calculator|speed-calculator|Speed Calculator|molarity-calculator|Molarity Calculator|molecular-weight-calculator|Molecular Weight Calculator|one-rep-max-calculator|One Rep Max Calculator|irr-calculator|Internal Rate of Return (IRR) Calculator|roman-numeral-converter|Roman Numeral Converter|boat-loan-calculator|Boat Loan Calculator|home-equity-loan-calculator|Home Equity Loan Calculator|heloc-calculator|Home Equity Line of Credit (HELOC) Calculator|target-heart-rate-calculator|Target Heart Rate Calculator|shoe-size-conversion|Shoe Size Conversion".split("|"),l=trimAll(gObj("calcSearchTerm").value+"").replace("-"," ").replace("  "," ").replace("  "," ").toLowerCase(),c="",t=[],r=[],o=[];if(0<l.length){var u=a.length/2;for(i=0;i<u;i++){var e="  "+a[2*i+1].replace("-"," ").toLowerCase();0<e.indexOf(" "+l)&&e.indexOf(" "+l)<2?t.push('<div><a href="/'+a[2*i]+'.html">'+a[2*i+1]+"</a></div>"):0<e.indexOf(" "+l)?r.push('<div><a href="/'+a[2*i]+'.html">'+a[2*i+1]+"</a></div>"):0<e.indexOf(l)&&o.push('<div><a href="/'+a[2*i]+'.html">'+a[2*i+1]+"</a></div>")}var n=t.concat(r).concat(o),C=n.length;if(0<C)if(6<C){for(i=0;i<6;i++)c+=n[i];c+="<div>...</div>"}else for(i=0;i<C;i++)c+=n[i];else c='No calculator matches "'+gObj("calcSearchTerm").value+'".'}return gObj("calcSearchOut").innerHTML=c,!1}

function saveCalResult(scrName, scrNum, scrSubName, scrRName, scrRVal){
	let scrUrl = window.location.pathname + "";
	let scrParam = window.location.search + "" + window.location.hash;
	let scrItems = [['surl', btoa(scrUrl)],['sparam', btoa(scrParam)],['sname', scrName],['snum', scrNum],['ssubnum', scrSubName],['srname', scrRName],['srval', scrRVal]];
	let scrForm = document.createElement("form");
	scrForm.setAttribute("method", "post");
	scrForm.setAttribute("action", "/my-account/save.php");
	for (let i = 0; i < scrItems.length; i++) {
		let scrfInput = document.createElement("input");
		scrfInput.type = "hidden";
		scrfInput.name = scrItems[i][0];
		scrfInput.value = scrItems[i][1];
		scrForm.appendChild(scrfInput);
	}
	document.body.appendChild(scrForm);
	scrForm.submit();
}
function srDeleteRow(e,t){return fetch("/my-account/save-delete.php?srid="+e).then(e=>e.text()).then(n=>{if("deleted"==n.trim()){var a=gObj("savedlist"+e);a&&(a.style.display="none");var l=gObj("sclUl"+t);if(l){var s=l.getElementsByTagName("li"),r=0;for(let i=0;i<s.length;i++)"none"!=s[i].style.display&&(r=1);if(0==r){var o=gObj("sclWrapper"+t);o&&(o.style.display="none")}}}else alert("Something went wrong. Please try again!")}).catch(e=>{alert("Something went wrong. Please try again!")}),!0}
function shSavedResults(l){return"+ Saved Calculations"==gObj("sclTitle"+l).innerHTML?(gObj("sclTitle"+l).innerHTML="Close",gObj("sclList"+l).style.display="block",gObj("sclWrapper"+l).classList.add("panel")):(gObj("sclTitle"+l).innerHTML="+ Saved Calculations",gObj("sclList"+l).style.display="none",gObj("sclWrapper"+l).classList.remove("panel")),!0}