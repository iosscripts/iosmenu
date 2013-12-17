$(document).ready(function() {
	
	$('.menu').iosMenu();
	
	$('.button').bind('click', function() {
	
		$('.menu').iosMenu('toggle');	
	
	});
	
});