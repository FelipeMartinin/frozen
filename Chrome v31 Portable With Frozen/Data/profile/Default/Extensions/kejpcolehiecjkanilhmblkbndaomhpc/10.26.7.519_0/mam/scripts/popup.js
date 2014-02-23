
//NEVER TESTED WITH STANDALONE SOLUTION
var popupFrame;

function CreatePopup(url, width, height, features) {
    if (popupFrame) return;

    var left = (window.innerWidth - parseInt(width)) / 2;
    var top = (window.innerHeight - parseInt(height)) / 2;

    popupFrame = document.createElement("iframe");
    popupFrame.setAttribute("src", chrome.extension.getURL('mam/scripts/iframeHost.html'));
    popupFrame.width = width + "px";
    popupFrame.height = height + "px";
    popupFrame.setAttribute("id", "valueApps_popup_id");
    popupFrame.setAttribute("name", JSON.stringify({ url: url + "#mam_extension_gadget" }));
    popupFrame.setAttribute("style", "position:fixed;top:0;right:0;left:0;border:1px solid rgb(158,171,191); padding:0; margin:auto; background-color:White;z-index: 99999999999;");
    document.body.appendChild(popupFrame);
}

function ClosePopup() {
    popupFrame.parentNode.removeChild(popupFrame);
    popupFrame = null;
}