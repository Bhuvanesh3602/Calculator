<!DOCTYPE html>
<html lang="en">
<head>
	<title>Sign In</title>
	<meta name="description" content="" />
	<link rel="stylesheet" href="/style.css" /><script src="/js/common.js" async></script><meta name="viewport" content="width=device-width, initial-scale=1.0">	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
	<link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png">
	<link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png">
	<link rel="manifest" href="/manifest.json"></head>
<body>
<div id="headerout">
	<div id="header">
		<div id="logo"><a href="/"><img src="/img/svg/calculator-white.svg" width="208" height="22" alt="adxcal.com"></a></div>
		<div id="login"><a href="/my-account/sign-in.php">sign in</a></div>	</div>
</div>
<div id="clear"></div><div id="contentout"><div id="content">
<div class="smalltext"><a href="/">home</a> / <a href="/my-account/sign-in.php">sign in</a></div>
<h1>Sign In</h1>
<div class="clefthalf">
	<div class="panel"><form name="signinForm" method="post" action="sign-in.php">
		<table>
			<tr>
				<td>Email: </td>
				<td><input name="email" type="text" maxlength="100" style="width: 220px" value=""></td>
			</tr>
			<tr>
				<td>Password: </td>
				<td><input name="password" type="password" maxlength="100" style="width: 220px"></td>
			</tr>
			<tr>
				<td>&nbsp;</td>
				<td><label for="rememberme"><input name="rememberme" id="rememberme" type="checkbox" value="1" checked> stay signed in</label></td>
			</tr>
			<tr>
				<td colspan="2" align="center"><input type="submit" name="submit" value="&nbsp; Sign In &nbsp; "> <input type="reset" name="reset" value="Clear"><p><a href="forget.php">Forget password?</a><br>New user? <a href="create-account.php">Create a free account</a></p></td>
			</tr>
		</table>
	</form></div>
</div>
<div class="crighthalf">
<style>
.oauth-btn {display: flex;margin:3px 0px;align-items: center;text-decoration: none;font-size: 16px;overflow: hidden;border: 1px solid #044284;border-radius: 5px;background-color: #fff;cursor: pointer;}
.oauth-btn .oauth-icon {display: inline-flex;height: 100%;padding: 8px 8px;align-items: center;justify-content: center;background-color: #ddd;margin-right: 12px;}
.oauth-btn:hover {background-color: #eee;}
.oauth-btn:hover .oauth-icon {background-color: #ccc;}
.oauth-or {
   text-align: center;
   border-bottom: 1px solid #ddd;
   line-height: 0.1em;
   margin: 16px 0 16px 0;
}
.oauth-or span {
	font-size: 25px;
    background:#fff;
    padding:0 16px;
}
</style>
<div class="oauth-or"><span>or</span></div>
<a href="/my-account/google-signup.php" class="oauth-btn">
	<span class="oauth-icon"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" width="20px" height="20px"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg></span>
	Sign in with Google
</a>
</div>
<div id="clear"></div>

</div>
	<div id="right">
		<div style="padding-top:10px;  min-height:280px; text-align:center;">




</div>
<form name="calcSearchForm" onsubmit="calcSearch(); return false;" autocomplete="off"><table align="center" id="searchbox"><tr><td><input type="text" name="calcSearchTerm" id="calcSearchTerm" class="inlongest" onkeyup="return calcSearch();"></td><td><span id="bluebtn" onClick="return calcSearch();">Search</span></td></tr><tr><td colspan="2"><div id="calcSearchOut"></div></td></tr></table></form>	</div>
</div>
<div id="clear"></div>
<div id="footer"><div id="footerin"><div id="footernav"><a href="/about-us.html">about us</a> | <a href="/sitemap.html">sitemap</a> | <a href="/about-us.html#terms">terms of use</a> | <a href="/about-us.html#privacy">privacy policy</a> &nbsp;  &copy; 2008 - 2026 <a href="//www.adxcal.com">adxcal.com</a></div></div></div>
<div class="topNavAbs">
<a href="/financial-calculator.html">Financial</a>
<a href="/fitness-and-health-calculator.html">Fitness &amp; Health</a>
<a href="/math-calculator.html">Math</a>
<a href="/other-calculator.html">Other</a>
</div>
<script src="/js/calcs-live.js"></script>
</body>
</html>