function showAmo(jcloanamount, jinterestRatePerPeriod, jtotalloantermtimes, jpaymentPerperiod, jcpayback, jdivid){
	var outputStrBuilder = [];
	outputStrBuilder.push("<table width='100%' class='cinfoT'>");
	outputStrBuilder.push("<tr align='right'><th>&nbsp;</th><th>Beginning Balance</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr>");

	var saBeginningBalance = jcloanamount;
	var intTerm = Math.floor(jtotalloantermtimes);
	var remainingTerm = jtotalloantermtimes - intTerm;
	for (i=0;i<intTerm;i++){
		var thisInterest = saBeginningBalance * jinterestRatePerPeriod;
		var thisPrincipal = jpaymentPerperiod - thisInterest;
		var thisEndingBalance = saBeginningBalance - thisPrincipal;
		if ((i%2)==1){
			outputStrBuilder.push("<tr align='right'><td>" + (i + 1));
		}else{
			outputStrBuilder.push("<tr align='right'><td>" + (i + 1));
		}
		if (jcpayback=="halfyear"){
			var thisYear = Math.floor((i+2)/2);
				outputStrBuilder.push(". Year #"+thisYear);
		}
		outputStrBuilder.push("</td><td>" + formatAsMoney(saBeginningBalance));
		outputStrBuilder.push("</td><td>" + formatAsMoney(thisInterest));
		outputStrBuilder.push("</td><td>" + formatAsMoney(thisPrincipal));
		outputStrBuilder.push("</td><td>" + formatAsMoney(thisEndingBalance) + "</td></tr>");
		saBeginningBalance = thisEndingBalance;
		if (i>0){
			if (jcpayback=="halfmonth"){
				if (((i+1)%24)==0){
					var thisYear = Math.floor((i+1)/24);
					outputStrBuilder.push("<tr align='center'><td colspan='5'><b>Year #" + thisYear + " End</b></td></tr>");
				}
			}else if (jcpayback=="month"){
				if (((i+1)%12)==0){
					var thisYear = Math.floor((i+1)/12);
					outputStrBuilder.push("<tr align='center'><td colspan='5'><b>Year #" + thisYear + " End</b></td></tr>");
				}
			}else if (jcpayback=="quarter"){
				if (((i+1)%4)==0){
					var thisYear = Math.floor((i+1)/4);
					outputStrBuilder.push("<tr align='center'><td colspan='5'><b>Year #" + thisYear + " End</b></td></tr>");
				}
			}
		}
	}
	if (remainingTerm > 0.0001){
		var thisInterest = saBeginningBalance * jinterestRatePerPeriod;
		outputStrBuilder.push("<tr align=right><td>" + (intTerm+1));
		outputStrBuilder.push(" (Partial)</td><td>" + formatAsMoney(saBeginningBalance) + "</td><td>" + formatAsMoney(thisInterest) + "</td><td>" + formatAsMoney(saBeginningBalance) + "</td><td>" + formatAsMoney(0) + "</td></tr>");
	}
	outputStrBuilder.push("</table>");
	var outPutString = outputStrBuilder.join("");
	gObj(jdivid).innerHTML = "<h3>Amortization Schedule</h3><div style=\"text-align:right;margin-top:-20px;\"><a href=\"#\" onClick=\"gObj('"+jdivid+"').innerHTML='';return false;\"><img src=\"/img/svg/close.svg\" width=\"18\" height=\"18\" border=\"0\"></a></div>"+outPutString;
	return false;
}

function showSch(jcloanamount, jinterestRatePerPeriod, jtotalloantermtimes, jcpayback, jdivid){
	jinterestRatePerPeriod = jinterestRatePerPeriod - 1;
	var outputStrBuilder = [];
	outputStrBuilder.push("<table width='100%' class='cinfoT'>");
	outputStrBuilder.push("<tr align='right'><th>&nbsp;</th><th>Beginning Balance</th><th>Interest</th><th>Ending Balance</th></tr>");
	var saBeginningBalance = jcloanamount;
	var intTerm = Math.floor(jtotalloantermtimes);
	var remainingTerm = jtotalloantermtimes - intTerm;
	if (remainingTerm>0.9999){
		intTerm = intTerm + 1;
		remainingTerm = 0;
	}
	for (i=0;i<intTerm;i++){
		var thisInterest = saBeginningBalance * jinterestRatePerPeriod;
		var thisEndingBalance = saBeginningBalance + thisInterest;
		if ((i%2)==1){
			outputStrBuilder.push("<tr align='right'><td>" + (i + 1));
		}else{
			outputStrBuilder.push("<tr align='right'><td>" + (i + 1));
		}
		outputStrBuilder.push("</td><td>" + formatAsMoney(saBeginningBalance));
		outputStrBuilder.push("</td><td>" + formatAsMoney(thisInterest));
		outputStrBuilder.push("</td><td>" + formatAsMoney(thisEndingBalance) + "</td></tr>");
		saBeginningBalance = thisEndingBalance;
		if (i>0){
			if (jcpayback=="month"){
				if (((i+1)%12)==0){
					var thisYear = Math.floor((i+1)/12);
					outputStrBuilder.push("<tr align='center'><td colspan='5'><b>Year #" + thisYear + " End</b></td></tr>");
				}
			}
		}
	}
	if (remainingTerm > 0.0001){
		var thisInterest = Math.pow((jinterestRatePerPeriod+1), remainingTerm) * saBeginningBalance - saBeginningBalance;
		outputStrBuilder.push("<tr align='right'><td>" + (intTerm+1));
		outputStrBuilder.push(" (Partial)</td><td>" + formatAsMoney(saBeginningBalance) + "</td><td>" + formatAsMoney(thisInterest) + "</td><td>" + formatAsMoney(thisInterest+saBeginningBalance) + "</td></tr>");
	}
	outputStrBuilder.push("</table>");

	h2value = "";
	menuvalue = '<div><b>';
	if (jcpayback=='year'){
		h2value = "Annual Schedule";
		jinterestRatePerPeriod = Math.pow((jinterestRatePerPeriod+1), 1/12);
		menuvalue += "Annual Schedule &nbsp; &nbsp; <a href='#' onclick=\"return showSch("+jcloanamount+", "+jinterestRatePerPeriod+", "+(jtotalloantermtimes*12)+", 'month', '"+jdivid+"');\">Monthly Schedule</a>";
	}else{
		h2value = "Monthly Schedule";
		jinterestRatePerPeriod = Math.pow((1 + jinterestRatePerPeriod), 12);
		menuvalue += "<a href='#' onclick=\"return showSch("+jcloanamount+", "+jinterestRatePerPeriod+", "+(jtotalloantermtimes/12)+", 'year', '"+jdivid+"');\">Annual Schedule</a> &nbsp; &nbsp; Monthly Schedule";
	}
	menuvalue += "</b></div>";
	var outPutString = outputStrBuilder.join("");
	gObj(jdivid).innerHTML = "<h3>"+h2value+"</h3><div style=\"text-align:right;margin-top:-20px;\"><a href=\"#\" onClick=\"gObj('"+jdivid+"').innerHTML='';return false;\"><img src=\"/img/svg/close.svg\" width=\"18\" height=\"18\" border=\"0\"></a></div>"+menuvalue+outPutString;
	return false;
}

