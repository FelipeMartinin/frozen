// ContentScript: Runs per tab
// Note: Inject this content_script at document_start time(see manifest.json), when we start download of the DOM, so that we can track download complete event to enable the toolbar button.
function EnableToolBarButton() {
	//Toolbar button is disabled by default(see manifest.json)
	//Enable the toolbar button for this tab on document_idle time, when the DOM is ready
	chrome.extension.sendMessage({type:"InvokeCall", call:"EnableToolbarButton"}, function(response) {
		if(response == null) {
			//If for some reason we failed to connect to the backgound port, like when it is not yet initialized
			//retry sending the message after 100 milliseconds
			setTimeout(function() {
				EnableToolBarButton();
			}, 100);		
		}
	});
}
window.addEventListener("load", function() {
	EnableToolBarButton();
});
window.document.addEventListener("readystatechange", function() {
	if(window.document.readyState == "complete") {
		EnableToolBarButton();
	}
});
if(window.document.readyState == "complete") {
	EnableToolBarButton();
}
document.addEventListener("readystatechange", function() {
	if(document.readyState == "complete") {
		EnableToolBarButton();
	}
});
if(document.readyState == "complete") {
	EnableToolBarButton();
}

const MAX_NUM_IMAGES_HTTPS = 20;

function EnlistHTTPSResourceURLs(aHtmlDocument, httpsImgSrcArray, httpsCSSHrefArray) {
	if(aHtmlDocument) {
	    //Populate HTTPS Image Src Array
		var imageList = aHtmlDocument.images;
		if(imageList) {
			var numImages = imageList.length;
			var numHttpsImages = 0;
			for(var index = 0; index < numImages; index++) {
				var imageElement = imageList[index];
				if(imageElement) {
					var imgSrc = imageElement.src;
					if(imgSrc && imgSrc.length > 0 && imgSrc.search(/https:\/\//i) != -1) {
						numHttpsImages++;
						if(numHttpsImages > MAX_NUM_IMAGES_HTTPS)
							break;
						httpsImgSrcArray.push(new String(imgSrc));						
					}
				}
			}			
		}
		//Now populate HTTPS CSS Href Array
		var styleSheetList = aHtmlDocument.styleSheets;
		if(styleSheetList) {
			var numStyleSheets = styleSheetList.length;
			for(var index = 0; index < numStyleSheets; index++) {
				var styleSheet = styleSheetList.item(index);
				if(styleSheet) {
					var href = styleSheet.href;
					if(href && href.length > 0 && href.search(/https:\/\//i) !== -1) {
						httpsCSSHrefArray.push(new String(href));	
					}
				}
			}
		}		
	}
}

function GetCompatModeStr(aDomDocument){
	var compatModeStr = "";
	if(aDomDocument)
	{
		var compatStr = aDomDocument.compatMode;
		if( compatStr.toLowerCase() == "css1compat") {
			var docType = aDomDocument.doctype;
			if(docType != null)
			{
				compatModeStr += "<!DOCTYPE ";
				if(docType.name != null && docType.name != undefined) {
					compatModeStr += docType.name;
					if(docType.publicId != null && docType.publicId != undefined) {
						compatModeStr += " PUBLIC \"" + docType.publicId + "\"";
					}
					if(docType.systemId != null && docType.systemId != undefined) {
						compatModeStr += " \"" + docType.systemId + "\"";
					}
					if(docType.internalSubset != null && docType.internalsubset != undefined) {
						compatModeStr += "\n[\n" + docType.internalsubset + "\n]";
					}
				}
				compatModeStr += ">\n";
			}
		}
	}
	return compatModeStr;
}

function GetDOMContentString(aDomDocument){
	var domData = GetCompatModeStr(aDomDocument) + aDomDocument.documentElement.outerHTML;
	return domData;
}

function ParseDOMContent(domWindow, httpsImgSrcArray, httpsCSSHrefArray) {
	//Recursive function that traverses and poputales https resources as well.
	var domDocument = domWindow.document;
	var domContentString = "";
	var domData = "";
	
	if(domDocument) {
		domData = GetDOMContentString(domDocument);
		var docURL = domDocument.baseURI;
		var downloadString = "<AcroexchangeDownloadSeprator AcroexchangeDownloadUrl=";
		downloadString += docURL;
		downloadString += ">";
		downloadString += domData;
		downloadString += "</AcroexchangeDownloadSeprator>";
		
		domContentString += downloadString;
		
		// Get HTTPS resources.
		if(docURL.search(/https:\/\//i) != -1) {
			EnlistHTTPSResourceURLs(domDocument, httpsImgSrcArray, httpsCSSHrefArray);
		}
		
		// Find frames and insert them recursively
		var frameList = domWindow.frames;
		if(!(frameList === undefined)) {
			var numFrames = frameList.length;
			for(var frameIndex = 0; frameIndex < numFrames; frameIndex++) {
				var frameWindow = frameList[frameIndex];
				if(!(frameWindow === undefined)) {
					var frameContentString = ParseDOMContent(frameWindow);
					domContentString += frameContentString;
				}
			}
		}
	}
	return domContentString;
}

function SanitizeFileNameString(fileNameString) {
	var sanitizedFileName;
	var len = fileNameString.length;
	var indx = 0;
	var count = 0;
	var prevChar = "";
	var ch = "";
	if(len > 0)
		sanitizedFileName = "";
	while( indx < len && count < 80 ) {
		ch = fileNameString.charAt(indx);
		if( ch != "<" && ch != ">" && ch != ":" && ch != '"' && ch != "/" && ch != "\\" && ch != "|" && ch != "?" && ch != "*" ) {
			prevChar = ch;
			sanitizedFileName = sanitizedFileName + ch;
			count = count + 1;		    
		} else {
			if(prevChar != "_") {
		    	sanitizedFileName = sanitizedFileName + "_";
		    	prevChar = "_";
		    	count = count + 1;
		   	}
		}
		indx = indx + 1;
	}
	return sanitizedFileName;
}

chrome.extension.onConnect.addListener(function(port) {
	if(port.name == "GetDOMData") {
		port.onMessage.addListener(function(msg) {
			if(msg.request == "GetPageData"){
				//The whole page needs to be converted, build the dom content by extracting data from the window.
				var httpsImgSrcList = new Array();
				var httpsCSSHrefList = new Array();
				var domData = ParseDOMContent(window, httpsImgSrcList, httpsCSSHrefList);
				var charSet = "unicode";
				if(document.characterSet != null && document.characterSet != undefined)
					charSet = document.characterSet;
				var baseURL = document.baseURI;
				var domTitle = new String(document.title);
				var sanitizedDomTitle = SanitizeFileNameString(domTitle);
				// Post response back to the extension's background page
				port.postMessage({response:"PageData", domdata: domData, charset: charSet, domtitle: sanitizedDomTitle, url: baseURL, httpsimglist: httpsImgSrcList, httpscsslist: httpsCSSHrefList});
			} else if(msg.request == "GetLinkData") {
				//A link needs to be converted, there is no need to gather any domData.
				//We pass domData initialised to 0.
				var domData = "";
				var charSet = "unicode";
				if(document.characterSet != null && document.characterSet != undefined)
					charSet = document.characterSet;
				var baseURL = msg.url;
				var domTitle = new String(document.title);
				var sanitizedDomTitle = SanitizeFileNameString(domTitle);
				// Post response back to the extension's background page
				port.postMessage({response:"LinkData", domdata: domData, charset: charSet, domtitle: sanitizedDomTitle, url: baseURL});		
			}
		});
	}
});
