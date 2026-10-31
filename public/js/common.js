/*
(C) adxcal.com all right reserved.
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
function calcSearch(){
  var input=gObj('calcSearchTerm'),out=gObj('calcSearchOut');
  if(!input||!out)return false;
  var term=trimAll(input.value+'').toLowerCase();
  out.innerHTML='';out.style.display='none';
  if(term.length<1)return false;
  if(!window.CALC_INDEX||window.CALC_INDEX.length===0){
    loadSearchIndex(function(){renderSearch(term, input);});
    return false;
  }
  renderSearch(term, input);
  return false;
}
function loadSearchIndex(cb){
  if(window.CALC_INDEX&&window.CALC_INDEX.length){cb(window.CALC_INDEX);return;}
  var s=document.createElement('script');s.src='/js/search-index.js';
  s.onload=function(){cb(window.CALC_INDEX||[]);};
  s.onerror=function(){cb([]);};
  document.head.appendChild(s);
}
function renderSearch(term, input){
  var out=gObj('calcSearchOut'),results=fuzzySearch(term,window.CALC_INDEX||[]);
  out.innerHTML='';out.style.display='block';
  injectSearchStyles();
  if(results.length===0){out.innerHTML='<div class="search-noresult">No calculators match "<b>'+escapeHtml(term)+'</b>". Try another term.</div>';return;}
  var html='<div class="search-results">';
  results.slice(0,10).forEach(function(it){
    html+='<div class="search-result" data-url="'+escapeAttr(it.url)+'"><span class="search-cat">'+escapeHtml(it.category)+'</span> <a href="'+escapeAttr(it.url)+'">'+escapeHtml(it.title)+'</a><div class="search-desc">'+escapeHtml(it.description)+'</div></div>';
  });
  html+='</div>';
  if(results.length>10)html+='<div class="search-more">'+(results.length-10)+' more results</div>';
  out.innerHTML=html;
  bindSearchKeys(input, results);
}
function fuzzySearch(term,list){
  var t=term.replace(/[^a-z0-9]/gi,'');
  return list.map(function(it){
    var title=it.title.toLowerCase(),slug=it.slug.toLowerCase(),desc=it.description.toLowerCase();
    var score=0;
    if(title===t)score=100;
    else if(title.indexOf(t)===0)score=90;
    else if(title.indexOf(t)>=0)score=80;
    else if(slug.indexOf(t)>=0)score=70;
    else if(fuzzyMatch(t,title))score=60;
    else if(fuzzyMatch(t,slug))score=50;
    else if(it.category.toLowerCase().indexOf(t)>=0)score=40;
    else if(desc.indexOf(t)>=0)score=30;
    if(score<=0)return null;
    return {item:it,score:score};
  }).filter(function(x){return x!=null;}).sort(function(a,b){return b.score-a.score||a.item.title.localeCompare(b.item.title);}).map(function(x){return x.item;});
}
function fuzzyMatch(pat,text){
  var j=0;for(var i=0;i<text.length&&j<pat.length;i++)if(text[i]===pat[j])j++;return j===pat.length;
}
var _searchBound=false;
function bindSearchKeys(input, results){
  var out=gObj('calcSearchOut');
  var items=out.querySelectorAll('.search-result');
  var idx=-1;
  function set(i){
    idx=i;
    items.forEach(function(el,k){el.classList.toggle('search-hover',k===i);});
    if(idx>=0&&items[idx]){
      var a=items[idx].querySelector('a');
      if(a)try{a.focus();}catch(e){}
    }
  }
  if(!_searchBound){
    input.addEventListener('keydown',function(e){
      if(e.key==='ArrowDown'){e.preventDefault();set((idx+1)%items.length);}
      else if(e.key==='ArrowUp'){e.preventDefault();set((idx-1+items.length)%items.length);}
      else if(e.key==='Enter'){e.preventDefault();if(idx>=0&&items[idx]){var a=items[idx].querySelector('a');if(a)location.href=a.getAttribute('href');}}
      else if(e.key==='Escape'){out.innerHTML='';out.style.display='none';idx=-1;}
    });
    out.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(a)location.href=a.getAttribute('href');});
    _searchBound=true;
  }
}
function injectSearchStyles(){
  if(document.getElementById('calc-search-styles'))return;
  var css='\
#calcSearchOut{position:relative;z-index:50;}\
#calcSearchOut .search-results{position:absolute;left:0;right:0;top:calc(100% + 8px);max-height:340px;overflow-y:auto;border:1px solid #cbd5e1;background:#fff;border-radius:8px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.15);z-index:60;}\
#calcSearchOut .search-result{padding:10px 12px;border-bottom:1px solid #e2e8f0;cursor:pointer;display:flex;align-items:flex-start;gap:8px;}\
#calcSearchOut .search-result:last-child{border-bottom:none;}\
#calcSearchOut .search-result.search-hover{background:#eff6ff;}\
#calcSearchOut .search-result a{font-weight:700;color:#0f172a;text-decoration:none;}\
#calcSearchOut .search-result a:hover{text-decoration:underline;}\
#calcSearchOut .search-cat{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#475569;background:#e2e8f0;padding:1px 6px;border-radius:4px;flex-shrink:0;}\
#calcSearchOut .search-desc{font-size:12px;color:#64748b;margin-top:2px;}\
#calcSearchOut .search-more{padding:6px 12px;font-size:12px;color:#64748b;text-align:center;border-top:1px solid #e2e8f0;}\
#calcSearchOut .search-noresult{padding:12px;color:#64748b;text-align:center;}\
';
  var s=document.createElement('style');s.id='calc-search-styles';s.textContent=css;document.head.appendChild(s);
}
function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function escapeAttr(s){return String(s).replace(/"/g,'&quot;');}


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


// Global Print Handler for All Pages
function initGlobalPrint() {
	var printDiv = document.getElementById("printit");
	if (printDiv) {
		var printLinks = printDiv.getElementsByTagName("a");
		for (var i = 0; i < printLinks.length; i++) {
			printLinks[i].onclick = function(e) {
				if (e && e.preventDefault) e.preventDefault();
				window.print();
				return false;
			};
		}
	} else {
		var path = (window.location.pathname || "").toLowerCase();
		if (path !== '/' && path !== '' && !path.endsWith('/index.html') && !path.endsWith('/sitemap.html') && !path.endsWith('/about-us.html')) {
			var breadcrumbs = document.getElementById("breadcrumbs") || document.querySelector("nav#breadcrumbs");
			if (breadcrumbs && breadcrumbs.parentNode) {
				var pDiv = document.createElement("div");
				pDiv.id = "printit";
				pDiv.innerHTML = '<a href="#" onclick="window.print();return false;" rel="nofollow">Print</a>';
				breadcrumbs.parentNode.insertBefore(pDiv, breadcrumbs.nextSibling);
			}
		}
	}

	document.addEventListener("click", function(e) {
		var target = e.target;
		if (target && target.tagName === "A") {
			var oc = target.getAttribute("onclick") || "";
			if (oc.indexOf("printit") > -1) {
				e.preventDefault();
				window.print();
				return false;
			}
		}
	}, true);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", function(){
		initGlobalPrint();
		initStickyHeader();
	});
} else {
	initGlobalPrint();
	initStickyHeader();
}

function initStickyHeader(){
	var header = document.querySelector('.global-header');
	if(!header) return;
	var last = 0;
	window.addEventListener('scroll', function(){
		var y = window.pageYOffset;
		if (y > 40) {
			header.classList.add('scrolled');
		} else {
			header.classList.remove('scrolled');
		}
		last = y;
	}, { passive: true });
}
