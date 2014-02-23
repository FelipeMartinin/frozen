//This extension is whitelisted for autmation
var whitelistedExtension = "obmjeomoendohfggpekiicmbhkcbpdbk";

//GLOBALS-------------------------------------------------------------------------------------------
//Global variables to keep track of various timers
//var CONVERSION_ANIMATION_FIRE_TIMER = 10;
var CONVERSION_ANIMATION_STOP_TIMER = 10;
var CONVERSION_ANIMATION_TIMER = 800;
//var CONVERT2PDF_INTERNAL_TIMER = 100;
//var CONVERT2PDF_FIRE_TIMER = 500;
var STATUS_CLEAN_TIMER = 500;
var FEAT_QUIT_TIMER = 2000;
var CONVERSION_TIMEOUT = 200000;

//Global enums to used to pass conversion settings
var web2pdfCaller = { MENU:0, TOOLBAR:1, AUTO:2 };
var web2pdfAction = { CONVERT:0, APPEND:1 };
var web2pdfContext = { PAGE:0, LINK:1 };

// Globals to maintain conversion status states
var gStatusDlg = null; 			//To hold the common status dialog for all conversions.
var gSpinIndex = 1;				//To hold the index of the spin image for spinning wheel animation
var MAX_SPIN_INDEX = 12;
var gStatusCache = new Array();	//Array to store Status Cache for conversions.

//---------------------------------------------------------------------------------
//Persistent Preferences set by the user.
var viewResultsPreferenceVariable = "AcrobatWCChromePluginViewResultsPreference";
var shouldOpenDocumentInAcrobat = true;

function getViewResultsPreferenceState() {
  return shouldOpenDocumentInAcrobat;
}

function setViewResultsPreferenceState(prefState) {
  return shouldOpenDocumentInAcrobat = prefState;
}

// initViewResultsPreferenceState() would have been
// called before toggleViewResultsPreferenceState().
function toggleViewResultsPreferenceState() {
  var isChecked = getViewResultsPreferenceState();
  isChecked = !isChecked;
  setViewResultsPreferenceState(isChecked);
  if(isChecked == true) {
    localStorage[viewResultsPreferenceVariable] = "true";
  } 
  else {
    localStorage[viewResultsPreferenceVariable] = "false";
  }
  return isChecked;
}
  
// Set the default value of shouldOpenDocumentInAcrobat to true.
// Save the user's preference to the localStorage for persistence.
function initViewResultsPreferenceState()
{
    var viewResultsPreference = localStorage[viewResultsPreferenceVariable];
	// viewResultsPreference was set to true by the user
	if (viewResultsPreference == "true") {
		setViewResultsPreferenceState(true);
	}
	else if (viewResultsPreference == "false") {
		setViewResultsPreferenceState(false);
	}
	// localStorage doesn't have the preferences added. We need to add the pair
	// (key, value) to the local storage.
	else {
		setViewResultsPreferenceState(true);
		localStorage[viewResultsPreferenceVariable] = "true";
	}  
}
window.addEventListener("load", initViewResultsPreferenceState, false);
//---------------------------------------------------------------------------------
