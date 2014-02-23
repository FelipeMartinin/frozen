/**
 * This file is a place holder for all conversion functions and their interaction with the npplugin, npWCChromeExtn.dll
 */ 
 
function web2pdf_Conversion()
{
	//enums for conversion settings
	//if any change is made in these, then the enum in the C++ code must also be changed.
	this.UNSET = 0;
	this.OPEN_IN_ACROBAT = 1;
	this.APPEND = 1<<1;
	this.CONVERT_PAGE = 1<<2;
	this.CONVERT_LINK = 1<<3;
	this.CONVERT_SELECTION = 1<<4;
	this.PRINT = 1<<5;
	this.EMAIL = 1<<6;
	this.CALLER_TOOLBAR = 1<<7;
	this.CLEAN_FILE_ON_FAILURE = 1<<8;

	//enums for reporting conversion status
	//if any change is made in these, then the enum in the C++ code must also be changed.
	this.STATUS_WAITING = 10000;
	this.STATUS_DOWNLOADING = 10001;
	this.STATUS_CONVERTING = 10002;
	this.STATUS_SUCCESS = 10003;
	this.STATUS_ERROR = 10004;
	this.STATUS_NOINSTANCE = 10005;
	this.STATUS_FILELOCKED = 10006;
	this.STATUS_MISSINGLIB = 10007;
	
	//member variables
	this.m_conversionID = 0;
	this.m_conversionSettings = this.UNSET;
	this.m_currentState = this.STATUS_DOWNLOADING;
	this.m_url = null;
	this.m_domData = null;
	this.m_charSet = null;
	this.m_outFilePath = "";
	this.m_platformSpecific = null;
}

web2pdf_Conversion.prototype.Done = function(state){
	this.m_currentState = state;
	gStatusCache[this.m_conversionID].done = true;
};

// Callbacks
web2pdf_Conversion.prototype.SetState = function(entry, state)
{
	if(this.m_conversionID == entry)
		this.m_currentState = state;
}

web2pdf_Conversion.prototype.ConversionDone = function(entry, state)
{
	var plugin = document.getElementById("pluginId");
	try{
		if(this.m_conversionID == entry)
		{	
			var refCount = plugin.invokeWebCaptureAPI("ReleasePlatformSpecificData", this.m_platformSpecific);
			if(refCount <= 0)
				this.m_platformSpecific = null;
			this.Done(state);
		}
	} catch(err)
	{
		alert(err);
	}
}

web2pdf_Conversion.prototype.InitPlatformSpecificData = function(){
	
	var plugin = document.getElementById("pluginId");
	try{
		
		this.m_platformSpecific = plugin.invokeWebCaptureAPI("InitPlatformSpecificData");
		
		if(!this.m_platformSpecific)
			this.m_platformSpecific = null;
	}
	catch(err)
	{
		this.m_platformSpecific = null;
		alert(err);
	}
};

web2pdf_Conversion.prototype.SendForConversion = function(){

	this.m_currentState = this.STATUS_CONVERTING;
	var plugin = document.getElementById("pluginId");
	try{
	
		var ConversionCall;
		if(this.m_conversionSettings & this.APPEND)
		{
			ConversionCall = "AppendToExistingPDF";
		}
		else
		{
			ConversionCall = "ConvertToNewPDF";
		}		
		
		var result = plugin.invokeWebCaptureAPI(ConversionCall, this.m_platformSpecific, this.m_conversionID, this.m_domData, this.m_conversionSettings, this.m_charSet, this.m_url, this.m_outFilePath);
		if(!result)
		{
			var refCount = plugin.invokeWebCaptureAPI("ReleasePlatformSpecificData", this.m_platformSpecific);
			if(refCount <=0)
				this.m_platformSpecific = null;
			
			this.Done(this.STATUS_ERROR);
		}
	}
	catch(err)
	{
		var refCount = plugin.invokeWebCaptureAPI("ReleasePlatformSpecificData", this.m_platformSpecific);
		if(refCount <=0)
			this.m_platformSpecific = null;
		
		this.Done(this.STATUS_ERROR);
	}
};

web2pdf_Conversion.prototype.FeatConvertToPDF = function() {
  //alert("web2pdf_FeatConvertToPDF called");
  this.m_currentState = this.STATUS_CONVERTING;
  var plugin = document.getElementById("pluginId");
	try{
		var ConversionCall = "FeatConvertToPDF";
		var result = plugin.invokeWebCaptureAPI(ConversionCall, this.m_platformSpecific, this.m_conversionID, this.m_domData, this.m_conversionSettings, this.m_charSet, this.m_url, this.m_docTitle);
		if(!result)
		{
			var refCount = plugin.invokeWebCaptureAPI("ReleasePlatformSpecificData", this.m_platformSpecific);
				if(refCount <=0)
					this.m_platformSpecific = null;
			this.Done(this.STATUS_ERROR);
		}
	}
	catch(err)
	{
		var refCount = plugin.invokeWebCaptureAPI("ReleasePlatformSpecificData", this.m_platformSpecific);
			if(refCount <=0)
				this.m_platformSpecific = null;
		this.Done(this.STATUS_ERROR);
	}
}

function web2pdf_ShowConversionSettingsDialog() {
  //alert("web2pdf_ShowConversionSettingsDialog called");
  var plugin = document.getElementById("pluginId");
  var result = plugin.invokeWebCaptureAPI("ShowConversionSettingsDialog");
}

function web2pdf_alert(msg)
{
	alert(msg);
}

function web2pdf_WriteImageToTempFile(b64ImageData) {
	var tempFilePath = "";
	var plugin = document.getElementById("pluginId");
	tempFilePath = plugin.invokeWebCaptureAPI("WriteImageToTempFile", b64ImageData);
	if(!tempFilePath)
		tempFilePath = "";
	return tempFilePath;
}

function FileOpenSaveDialog(request) {
	var filePath = null;
	var plugin = document.getElementById("pluginId");
	if(request.action == web2pdfAction.APPEND) {
		filePath = plugin.invokeWebCaptureAPI("ShowFileOpenDialog");	
	} else {
	    var confirmDialogTitle = chrome.i18n.getMessage("web2pdfExtnName");
		var fileReplaceWarning = chrome.i18n.getMessage("web2pdfReplaceWarning");
		filePath = plugin.invokeWebCaptureAPI("ShowFileSaveDialog", request.domtitle, confirmDialogTitle, fileReplaceWarning);	
	}
	if(!filePath)
		filePath = null;
	return filePath;
}

function GetFileNameFromFilePath(filePath)
{
	var fileName = filePath;
	try
	{
		var startIndexOfFileName = filePath.lastIndexOf("\\");
		fileName = filePath.slice(startIndexOfFileName + 1);
		//alert(fileName);	
	} catch(err) {}
	return fileName;
}

function ConvertToPDF(request) {
	var filePath = null;
	if(request.domtitle == undefined)
		request.domtitle = chrome.i18n.getMessage("web2pdfUntitledFileName");

	filePath = FileOpenSaveDialog(request);
	var fileName = GetFileNameFromFilePath(filePath);
		
	var newConversion = new web2pdf_Conversion();
		
	// Set conversion Settings
	var openDocAfterConversion = getViewResultsPreferenceState();
	if(openDocAfterConversion == true)
		newConversion.m_conversionSettings |= newConversion.OPEN_IN_ACROBAT;
		
	if(request.action == web2pdfAction.APPEND)
		newConversion.m_conversionSettings |= newConversion.APPEND;
	else	
		newConversion.m_conversionSettings |= newConversion.CLEAN_FILE_ON_FAILURE;
	
	if(request.context == web2pdfContext.PAGE)
		newConversion.m_conversionSettings |= newConversion.CONVERT_PAGE;
	
	if(request.caller == web2pdfCaller.TOOLBAR)
		newConversion.m_conversionSettings |= newConversion.CALLER_TOOLBAR;
	else {
		if(request.context == web2pdfContext.LINK)
			newConversion.m_conversionSettings |= newConversion.CONVERT_LINK;
	}

	AddConversionToStatusDialog(newConversion, fileName, false);
		
	newConversion.m_domData = request.domdata;	
	newConversion.m_charSet = request.charset;	
	newConversion.m_url = request.url;
	newConversion.m_outFilePath = filePath;
	
	if(filePath == null) {
		newConversion.Done(newConversion.STATUS_MISSINGLIB);
		return null;	
	}
	
	// Initialize Platform Specific Data
	newConversion.InitPlatformSpecificData();
	if(newConversion.m_platformSpecific === null)
	{
		newConversion.Done(newConversion.STATUS_MISSINGLIB);
		return null;
	}
	
	if(GetNumberOfConversionsPreceding(newConversion.m_conversionID) <= 0)
		newConversion.SendForConversion();
	else
		newConversion.m_currentState = newConversion.STATUS_WAITING;
}

function FeatConvertToPDF(request) {
	
	var newConversion = new web2pdf_Conversion();
		
	// Set conversion Settings		
	newConversion.m_conversionSettings |= newConversion.CONVERT_PAGE;
	newConversion.m_conversionSettings |= newConversion.CALLER_TOOLBAR;
	
	if(request.domtitle == undefined)
		request.domtitle = chrome.i18n.getMessage("web2pdfUntitledFileName");
	AddConversionToStatusDialog(newConversion, request.domtitle, true)
		
	newConversion.m_domData = request.domdata;	
	newConversion.m_charSet = request.charset;
	newConversion.m_url = request.url;
	newConversion.m_outFilePath = "";

	// Initialize Platform Specific Data
	newConversion.InitPlatformSpecificData();
	if(newConversion.m_platformSpecific === null)
	{
		newConversion.Done(newConversion.STATUS_MISSINGLIB);
		return null;
	}
	
	if(GetNumberOfConversionsPreceding(newConversion.m_conversionID) <= 0)
		newConversion.FeatConvertToPDF();
	//else
		//alert("An auto conversion is already in progress!");
}

function ServiceNewConversionRequest(request) {
	var port = chrome.tabs.connect(request.tab, {name: "GetDOMData"});
	if(request.context == web2pdfContext.PAGE) {
		port.postMessage({request:"GetPageData"});
		port.onMessage.addListener(function (msg) {
			if(msg.response == "PageData") {
				port.disconnect();
                var domData = msg.domdata + EmbedHTTPSResources(msg.httpsimglist, msg.httpscsslist);
				ConvertToPDF({caller:request.caller, action:request.action, context:request.context, domdata:domData, charset:msg.charset, domtitle:msg.domtitle, url:msg.url});
				}
			});
	} else if(request.context == web2pdfContext.LINK) {
		port.postMessage({request:"GetLinkData", url:request.url});
		port.onMessage.addListener(function (msg) {
			if(msg.response == "LinkData") {
				port.disconnect();
				ConvertToPDF({caller:request.caller, action:request.action, context:request.context, domdata:msg.domdata, charset:msg.charset, domtitle:msg.domtitle, url:msg.url});
			}
		});
	} else {
		web2pdf_alert(chrome.i18n.getMessage("web2pdfUnsupportedContextRequested"));
	}
}

function ServiceAutoConversionRequest(request) {
	var port = chrome.tabs.connect(request.tab, {name: "GetDOMData"});
	port.postMessage({request:"GetPageData"});
	port.onMessage.addListener(function (msg) {
		if(msg.response == "PageData") {
			port.disconnect();
			var domData = msg.domdata + EmbedHTTPSResources(msg.httpsimglist, msg.httpscsslist);	
			FeatConvertToPDF({caller:request.caller, action:request.action, context:request.context, domdata:msg.domdata, charset:msg.charset, domtitle:msg.domtitle, url:msg.url});
		}
	});
}

function HandleConversionRequest(request) {
	if(request.caller == web2pdfCaller.AUTO) {
		ServiceAutoConversionRequest(request);
	} else {
		ServiceNewConversionRequest(request);
	}
}

chrome.extension.onMessage.addListener( 
	function(request, sender, sendResponse) {
		if(request.type === "InvokeCall") {
			if(request.call === "EnableToolbarButton") {
			    EnableBrowserAction(sender.tab.id);
				sendResponse({state: "enabled"});
			}			
		}
	}
);

// For external requests
chrome.extension.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if(request.type === "Automation" && sender.id === whitelistedExtension) {
		HandleConversionRequest({tab:sender.tab.id, caller: web2pdfCaller.AUTO});
	}
  });