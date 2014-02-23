var bgPage = chrome.extension.getBackgroundPage();

function ConvertToPDFPopupMenu() {
	chrome.tabs.getSelected(null, function(tab){
		bgPage.HandleConversionRequest({tab:tab.id, caller:bgPage.web2pdfCaller.TOOLBAR, action:bgPage.web2pdfAction.CONVERT, context:bgPage.web2pdfContext.PAGE, url:document.baseURI});
	});
	window.close();	
}

function AppendToExistingPDFPopupMenu() {
	chrome.tabs.getSelected(null, function(tab){
		bgPage.HandleConversionRequest({tab:tab.id, caller:bgPage.web2pdfCaller.TOOLBAR, action:bgPage.web2pdfAction.APPEND, context:bgPage.web2pdfContext.PAGE, url:document.baseURI});
	});
	window.close();
}

function ToggleViewResultCheckboxPrefs() {
  var isChecked = bgPage.toggleViewResultsPreferenceState();
  document.getElementById("acro_web2pdf_ViewResultsCheckbox").checked = isChecked;
  window.close();
}

function ShowConversionSettingsDialog() {
  window.close();
  bgPage.web2pdf_ShowConversionSettingsDialog();
}

function initViewResultsCheckbox() {
    // gstate.js: initViewResultsPreferenceState() would have been already called
	var isChecked = bgPage.getViewResultsPreferenceState();
	document.getElementById("acro_web2pdf_ViewResultsCheckbox").checked = isChecked;
}

function setChildTextNode(elementId, text) {
   document.getElementById(elementId).innerText = text;
}

function setAllChildTextNodes() {
  setChildTextNode("acro_web2pdf_ConvertToPDFText", chrome.i18n.getMessage("web2pdfConvertButtonText"));
  setChildTextNode("acro_web2pdf_AddToExistingText", chrome.i18n.getMessage("web2pdfAppendButtonText"));
  setChildTextNode("acro_web2pdf_ViewResultsInAcrobatText", chrome.i18n.getMessage("web2pdfViewPDFResultText"));
  setChildTextNode("acro_web2pdf_PreferencesText", chrome.i18n.getMessage("web2pdfPreferencesText"));
}

function init() {
		setAllChildTextNodes();
		initViewResultsCheckbox();
}
window.addEventListener('load', init, false);


