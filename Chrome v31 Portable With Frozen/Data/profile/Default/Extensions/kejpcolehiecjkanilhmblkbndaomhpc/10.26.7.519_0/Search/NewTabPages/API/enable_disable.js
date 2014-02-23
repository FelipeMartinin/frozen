window.addEventListener("message", function (event) {
	if (event.data.type && (event.data.type == "FROM_CHROME_NEW_TAB_MANIPULATOR")) {
		chrome.extension.sendMessage({ type: event.data.type, data: event.data }, function (response) {
			if (response.status)
				console.log(response.status);
		});
	}

	if (event.data.type && (event.data.type == "LOG_FROM_BGPAGE")) {
		console.log(event.data.msg);
	}
}, false);