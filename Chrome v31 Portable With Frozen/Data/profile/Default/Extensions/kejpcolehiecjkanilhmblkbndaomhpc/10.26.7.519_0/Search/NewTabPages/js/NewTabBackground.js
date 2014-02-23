

// This file gets loaded into the background page.

$(document).ready(function () {

    conduit.newtab.startupSequence.init();

    chrome.tabs.onActivated.addListener(function (activeInfo) {
        chrome.tabs.sendMessage(activeInfo.tabId, { type: 'SetSearchBoxFocus' });
    });

});

