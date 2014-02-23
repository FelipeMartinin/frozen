//   function RecentlyChanged() {
//      alert('Recently was changed');
//   }

//   function OnMoved(id, movedInfo) {
//      alert(movedInfo.oldIndex + " " + movedInfo.index);
//   }

//   function OnCreated(id, bookmark) {
//      alert(id);
//   }

function getBackgroundPage() {
	var bg = chrome.extension.getBackgroundPage();

	var SearchBackground = bg &&
	        		bg.document &&
		        		bg.document.getElementById("SearchBackgroundIframe") &&
			        		bg.document.getElementById("SearchBackgroundIframe").contentWindow
        			? bg.document.getElementById("SearchBackgroundIframe").contentWindow : null;

	var NewTabBackground = SearchBackground &&
	        		SearchBackground.document &&
		        		SearchBackground.document.getElementById("NewTabBackgroundIframe") &&
			        		SearchBackground.document.getElementById("NewTabBackgroundIframe").contentWindow
        			? SearchBackground.document.getElementById("NewTabBackgroundIframe").contentWindow : null;
	return NewTabBackground;
}


var conduit;

try {
    conduit = getBackgroundPage().conduit;

    if (!conduit.newtab.toolbar.isNewTabEnabled()) {
        console.log("newTab not enabled - disabled");
        conduit.newtab.redirectToDefaultNewTab();
    }
    
    if (conduit.newtab.cntRedirect.isCNTRedirect) {
        document.location = conduit.newtab.cntRedirect.redirectUrl;
    }

}
catch (e) {
	//chrome.extension.sendRequest({ type: "RedirectAllNewTabs" });
	window.setTimeout('document.location.reload()', 10);
}
