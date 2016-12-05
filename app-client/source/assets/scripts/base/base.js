(function () {
	var ua = navigator.userAgent;
	var isWebkit = !!ua.match(/\bapplewebkit\b/i);

	if (isWebkit) {
		$('body').addClass('webkit');
	}
})();
