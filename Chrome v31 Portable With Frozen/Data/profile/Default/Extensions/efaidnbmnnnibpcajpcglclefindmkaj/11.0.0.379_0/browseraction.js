function EnableBrowserAction(tabid) {
	chrome.browserAction.setIcon({path:"skin/AX_convertb_XI_N_19x19.png", tabId:tabid});	
	chrome.browserAction.setTitle({title:chrome.i18n.getMessage("web2pdfConvertButtonToolTip"),tabId:tabid});
	chrome.browserAction.setPopup({popup:"popup.html", tabId:tabid});
}

function DisableBrowserAction(tabid) {
	chrome.browserAction.setIcon({path:"skin/AX_convertb_XI_D_19x19.png", tabId:tabid});	
	chrome.browserAction.setTitle({title:chrome.i18n.getMessage("web2pdfConvertButtonDisabledToolTip"),tabId:tabid});
	chrome.browserAction.setPopup({popup:"", tabId:tabid});
}
