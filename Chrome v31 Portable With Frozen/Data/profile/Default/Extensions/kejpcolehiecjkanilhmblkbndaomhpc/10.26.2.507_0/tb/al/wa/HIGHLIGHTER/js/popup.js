var Highlighter_Popup = new function () {
	var sendRequest = conduit.messaging.sendRequest,
		resizePopup = conduit.app.popup.resize;
	
	var init = function () {
		var message = {
			method: 'getCurrentHiglightsWords',
			params: ["1"]
		};


sendRequest('backgroundPage', 'Highlighter.Invoker', JSON.stringify(message), function (result) {
			var clickHandler = null;
			try {
			    result = JSON.parse(result);
			}
			catch (e) {
			    conduit.logging.logDebug('HIGHLIGHTER/popup.js - received wrong result: ' + result);
            }
			$.each(result, function (i,v) {
				clickHandler = (function (term) { 
										return function () {
											var requestMessage = {params: [term],method: 'execute' };
											sendRequest('backgroundPage', 'Highlighter.Invoker', JSON.stringify(requestMessage), function (response) { });
										};
									})(v);
				
				$("<li></li>").attr({'class': 'item', id: i}).click(clickHandler).text(v).appendTo('.higlight_words');
				
			});
			
			resizePopup(null, {height: $(".higlight_words").children().length * 22, width: 99}, function (response) {
				$('.higlight_words').slideDown(0);
			});
			
			conduit.app.popup.onClosed.addListener(null,function () {
				$('.higlight_words').slideUp(0);
			});
		});
	};
	
	$(document).ready(function () {
		init();
	});
};