function showAmo(jcloanamount, jinterestRatePerPeriod, jtotalloantermtimes, jpaymentPerperiod, jcpayback, jdivid){
	var outputStrBuilder = [];
	outputStrBuilder.push('<table border="0" cellpadding="3" align="center">');
	outputStrBuilder.push('<tr align="right" bgcolor="#E0F0FE"><td>&nbsp;</td><td><b>Beginning Balance</b></td><td><b>Interest</b></td><td><b>Principal</b></td><td><b>Ending Balance</b></td></tr>');

	var saBeginningBalance = jcloanamount;
	var intTerm = Math.floor(jtotalloantermtimes);
	var remainingTerm = jtotalloantermtimes - intTerm;
	for (i=0;i<intTerm;i++){
		var thisInterest = saBeginningBalance * jinterestRatePerPeriod;
		var thisPrincipal = jpaymentPerperiod - thisInterest;
		var thisEndingBalance = saBeginningBalance - thisPrincipal;
		if ((i%2)==1){
			outputStrBuilder.push('<tr align="right"><td>' + (i + 1));
		}else{
			outputStrBuilder.push('<tr align="right" bgcolor="#dddddd"><td>' + (i + 1));
		}
		if (jcpayback=="halfyear"){
			var thisYear = Math.floor((i+2)/2);
				outputStrBuilder.push(". Year #"+thisYear);
		}
		outputStrBuilder.push("</td><td>" + formatAsMoney(saBeginningBalance));
		outputStrBuilder.push("</td><td>" + formatAsMoney(thisInterest));
		outputStrBuilder.push("</td><td>" + formatAsMoney(-1*thisPrincipal));
		outputStrBuilder.push("</td><td>" + formatAsMoney(thisEndingBalance) + "</td></tr>");
		saBeginningBalance = thisEndingBalance;
		if (i>0){
			if (jcpayback=="halfmonth"){
				if (((i+1)%24)==0){
					var thisYear = Math.floor((i+1)/24);
					outputStrBuilder.push('<tr align="center" bgcolor="#E0F0FE"><td colspan="5"><b>Year #' + thisYear + " End</b></td></tr>");
				}
			}else if (jcpayback=="month"){
				if (((i+1)%12)==0){
					var thisYear = Math.floor((i+1)/12);
					outputStrBuilder.push('<tr align="center" bgcolor="#E0F0FE"><td colspan="5"><b>Year #' + thisYear + " End</b></td></tr>");
				}
			}else if (jcpayback=="quarter"){
				if (((i+1)%4)==0){
					var thisYear = Math.floor((i+1)/4);
					outputStrBuilder.push('<tr align="center" bgcolor="#E0F0FE"><td colspan="5"><b>Year #' + thisYear + " End</b></td></tr>");
				}
			}
		}
	}
	if (remainingTerm > 0.0001){
		var thisInterest = saBeginningBalance * jinterestRatePerPeriod;
		outputStrBuilder.push('<tr align="right" bgcolor="#E0F0FE"><td>' + (intTerm+1));
		outputStrBuilder.push(" (Partial)</td><td>" + formatAsMoney(saBeginningBalance) + "</td><td>" + formatAsMoney(thisInterest) + "</td><td>" + formatAsMoney(saBeginningBalance) + "</td><td>" + formatAsMoney(0) + "</td></tr>");
	}
	outputStrBuilder.push("</table>");

	var outPutString = outputStrBuilder.join("");
	gObj(jdivid).innerHTML = "<br><h2>Amortization Schedule</h2><div style=\"text-align:right;margin-top:-10px;\"><a href=\"#\" onClick=\"gObj('lcamotable1').innerHTML='';return false;\"><img src=\"/img/svg/close.svg\" width=\"18\" height=\"18\" border=\"0\"></a></div>"+outPutString;
	return false;
}