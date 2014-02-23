/**
 * This file is a place holder to create all the context menus and define their handlers.
 */
function ConvertToPDFContextMenu(info, tab) {
	var url = info.pageUrl;
	if (url == undefined) 
		url = tab.url;
	HandleConversionRequest({tab:tab.id, caller:web2pdfCaller.MENU, action:web2pdfAction.CONVERT, context:web2pdfContext.PAGE, url:url});
}

function AppendToExistingPDFContextMenu(info, tab) {
    var url = info.pageUrl;
	if (url == undefined) 
		url = tab.url;
	HandleConversionRequest({tab:tab.id, caller:web2pdfCaller.MENU, action:web2pdfAction.APPEND, context:web2pdfContext.PAGE, url:url});
}

function ConvertLinkTargetToPDFContextMenu(info, tab) {
	var url = info.linkUrl;
	HandleConversionRequest({tab:tab.id, caller:web2pdfCaller.MENU, action:web2pdfAction.CONVERT, context:web2pdfContext.LINK, url:url});
}

function AppendLinkTargetToExistingPDFContextMenu(info, tab) {
	var url = info.linkUrl;
	HandleConversionRequest({tab:tab.id, caller:web2pdfCaller.MENU, action:web2pdfAction.APPEND, context:web2pdfContext.LINK, url:url});
}
 
/**
 * Create a context menus which will show up for page content.
 */
chrome.contextMenus.create({"title": chrome.i18n.getMessage("web2pdfConvertPageContextMenu"), "contexts": ["page"], "onclick": ConvertToPDFContextMenu});
chrome.contextMenus.create({"title": chrome.i18n.getMessage("web2pdfAppendPageContextMenu"), "contexts": ["page"], "onclick": AppendToExistingPDFContextMenu});

/**
 * Create a context menus which will show up for links.
 */
chrome.contextMenus.create({"title": chrome.i18n.getMessage("web2pdfConvertLinkContextMenu"), "contexts": ["link"], "onclick": ConvertLinkTargetToPDFContextMenu});
chrome.contextMenus.create({"title": chrome.i18n.getMessage("web2pdfAppendLinkContextMenu"), "contexts": ["link"], "onclick": AppendLinkTargetToExistingPDFContextMenu});