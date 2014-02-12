(function () {
    conduit.jasmine = {};
    conduit.jasmine.helpers = {};
})();
//****  Filename: navigationHandler.js
//****  FilePath: main/js/navigation
//****
//****  Author: Uri Weiler
//****  Date: 03.10.11
//****  Type:
//****  Description: Handles navigation from gadgets / embedded apps based on '#_tab/_parent etc.' target directives in href and based on user interaction
//****
//****  Usage: Runs in every iframe - searches appData to see if it's inside a gadget / embedded app.
//****
//****  Copyright: Realcommerce & Conduit.
//****

(function navigationHandler() {
    try {

        //@description - Goes over all links inside publisher pages (inside embedded apps & gadgets) and changes links so they open
        //               based on '#_main/_parent/_new/_search/_top/_tab/_blank/_self' target directives in href.
        //@function setTargetsLinksForHashes
        var setTargetsLinksForHashes = function (appType) {
            //handle dynamic links
            document.addEventListener("DOMNodeInserted", function (e) {
                if (e.target.tagName && typeof e.target.tagName == 'string') {
                    if (e.target.tagName.toLowerCase() == "a") {
                        setTargetLinkForALinkWithAHashChar(e.target, appType);
                    }
                    else {
                        var arrA = e.target.getElementsByTagName("a");
                        if (arrA.length > 0) {
                            for (var i = 0; i < arrA.length; i++) {
                                setTargetLinkForALinkWithAHashChar(arrA[i], appType);
                            }
                        }
                    }
                }
            }, false);

            if (document.location.href.indexOf("http://d.foxadd.com") !== -1) {
                var elWrapper = document.getElementById("toolbarwidget");
                if (elWrapper) {
                    elWrapper.onclick = function () {
                        var getChilds = elWrapper.childNodes;

                        for (var i = 0; i < getChilds.length; ++i) {
                            if (getChilds[i].nodeName === "A") {
                                getChilds[i].target = "_top";
                            }
                        }
                    }
                }
            }

            //handle static links
            var allHREFTags = document.getElementsByTagName('a');


            var getAllTags = document.getElementsByTagName("*");

            // Who put this here?
            for (var i = 0; i < getAllTags.length; ++i) {
                if (getAllTags[i].nodeName === "A") {
                    if (appType == "embedded") {
                        getAllTags[i].target = "_top";
                    }
                    else {
                        if (!getAllTags[i].target)
                            getAllTags[i].target = "_self";
                    }
                }
            }


            for (var i = 0; i < allHREFTags.length; i++) {
                setTargetLinkForALinkWithAHashChar(allHREFTags[i], appType);
            }
        };

        //@description - Sets the target for a link which contains a target after a hash symbol in it's href.
        //@function setTargetLinkForALinkWithAHashChar
        var setTargetLinkForALinkWithAHashChar = function (link, appType) {

            var href = (link && link.getAttribute ? link.getAttribute('href') : '');
            if (href) {
                if (href == '#') {
                    link.removeAttribute('href', '');
                    if (link.style && !link.style.cursor) {
                        link.style.cursor = "pointer";
                    }
                    return;
                }
                // Finding the string at the end, after the hash char, which should contain the target (i.e., _top etc.).
                var reggie = /\#.*$/;
                var reggieRes = href.match(reggie);

                var afterHashString = reggieRes ? reggieRes.toString() : null;
                if (afterHashString && afterHashString != '') {

                    // Removing the hash char. and anything trailing a '?' char.
                    var target = afterHashString.replace(/^\#/, "").replace(/\?.*/, "");

                    if (target && target !== '') {
                        setLinkAttribute(link, target, appType);
                    }
                }
                // For links without a hash inside an embedded app - should open outside if user clicked
                else if (appType === "embedded") {
                    setLinkAttribute(link, "_blank", appType);
                }
            }
        };

        //@description - Sets one HTML link's onclick / target attribute so that it opens inside the same tab / a new tab / a new window etc.
        //@function setLinkAttribute
        var setLinkAttribute = function (link, target, appType) {
            if (link && link.setAttribute) {
                switch (target) {
                    case ('_new'):
                        setLinkToOpenInNewWindow(link);
                        break;
                    case ('_search'):
                        // Search is irelevant in Chrome
                        //setLinkToOpenSearch(link);
                        break;
                    case ('_parent'):
                    case ('_main'):
                    case ('_top'):
                        removeOnClickEventHandlerIfExists(link);
                        link.setAttribute('target', '_top');
                        break;
                    // _top = open in current tab. _self = open inside current iframe _blank = open inside new tab.                                                                                          
                    case ('_tab'):
                    case ('_blank'):
                    case ('_tab1'):
                    case ('_blank1'):
                        removeOnClickEventHandlerIfExists(link);
                        var linkHref = link.getAttribute('href');
                        // Added because of strange '_tab' behavior inside embedded app. has no effect
                        linkHref = linkHref.replace("#_tab", "#_tab1").replace("#_blank", "#_blank1");
                        link.setAttribute('href', linkHref);
                        link.setAttribute('target', '_blank');
                        break;
                    case ('_self'):
                        removeOnClickEventHandlerIfExists(link);
                        link.setAttribute('target', '_self');
                        break;
                    default:
                        // If link had a simple anchor - not a special reserved keyword anchor, and inside an embedded app - opening in a new tab.
                        if (appType === "embedded") {
                            removeOnClickEventHandlerIfExists(link);
                            link.setAttribute('target', '_blank');
                        }
                        break;
                }
            }
            else {
                if (window && window.console) {
                    console.error("SetTargetsLink: Can not set attribute for link : ", link);
                }
            }
        };

        //@description - Removes any window.open made by the publisher and appends a window open of our own 
        //@function removeOnClickEventHandlerIfExists
        var removeOnClickEventHandlerIfExists = function (link) {
            var onclickRegExp = /window.open\(.*\)/;
            var linkOnClickAttr = link.getAttribute ? link.getAttribute('onclick') : '';
            linkOnClickAttr = linkOnClickAttr ? linkOnClickAttr : '';
            var onclickStr = linkOnClickAttr.match(onclickRegExp);
            if (linkOnClickAttr && onclickStr) {
                linkOnClickAttr.replace(onclickStr, "");
                link.setAttribute('onclick', linkOnClickAttr);
            }
        };

        //@description - Appends window.open call to current 'onclick' handler's code.
        //@function setLinkToOpenInNewWindow
        var setLinkToOpenInNewWindow = function (link) {
            var windowOpenStr = "window.open('";
            windowOpenStr += link.getAttribute('href') + "', '', 'location=0,fullscreen=1,menubar=0,resizable=1,status=no,toolbar=0'); return !1;";
            var onClickStr = link.getAttribute('onclick');
            link.setAttribute('onclick', (onClickStr ? onClickStr : "") + windowOpenStr);
        };


        //@description - Goes over all links inside publisher pages (inside embedded apps & gadgets) and changes links so they open
        //based on '#_main/_parent/_new/_search/_top/_tab/_blank/_self' directives in href.               
        //@function init
        var init = function (appType) {
            // This is a dreadfully ugly hack because we currently don't recognize where we are running, and a part of the code breaks this specific page (bug 34301)
            if (window !== window.top && /^https?:\/\/(([^\/]+\.)*rr\.com)|(www\.bankrate\.com)/i.test(window.location && window.location.href || '')) {
                return;
            }

            // Setting targetLinks for hashes in gadgets and embeded alike.
            setTargetsLinksForHashes(appType);
        };

        (function () {
            if (window !== window.top) {
                var extensionId = chrome.i18n.getMessage("@@extension_id");

                var iframeLoadHandler = function (event) {
                    if (window.name && window.name.indexOf(extensionId) != -1) {
                        var isPopup = false;
                        var popupGuidFormat = new RegExp("^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}");
                        if (popupGuidFormat.test(window.name)) {
                            isPopup = true; //for popup
                        }

                        var url = chrome.extension.getURL(isPopup ? "tb/lib/script2injectPopup.js" : "tb/lib/script2injectEmbedded.js");
                        //read file
                        var ajaxResponse = new XMLHttpRequest();
                        ajaxResponse.open('GET', url, false);
                        ajaxResponse.onreadystatechange = function () {
                            if (ajaxResponse.readyState === 4 && ajaxResponse.status !== 200) {
                                console.error("Error getting injected files data!", ajaxResponse.status);
                            }
                        };
                        ajaxResponse.send();
                        //handle window.close from bcapi
                        if (isPopup) {
                            //first scope - injected and have abstraction + chrome
                            window.addEventListener("message", function (objMsg) {
                                if (objMsg && typeof (objMsg.data) === 'string' && objMsg.data.indexOf('windowClose') > -1) {
                                    var popupId = window.name && window.name.split('___').length > 0 ? window.name.split('___')[0] : '';
                                    cbsMessages.sendSysReq("popups.events", "windowClose", { type: "windowClose", popupId: popupId }, function () { });
                                }
                            }, false);
                            //second scope - injected and don't have abstraction + chrome - send msg to first scope
                            var srcChangeBar = document.createElement("script");
                            srcChangeBar.setAttribute("type", "text/javascript");
                            srcChangeBar.innerHTML = "window.close = function() { var sendMessageEvent = {'name': 'windowClose'}; window.postMessage(JSON.stringify(sendMessageEvent), '*'); }";
                            if (document.getElementsByTagName("head") && document.getElementsByTagName("head")[0]) {
                                document.getElementsByTagName("head")[0].appendChild(srcChangeBar);
                            }
                        }

                        try {
                            eval("this.onfocus=function(){ var popupId = (window.name).substr(0, 36); cbsMessages.sendSysReq('setFocusOnPopup', 'contentScript.js', { popupId: popupId }, function (response) { });}");
                            if (ajaxResponse && ajaxResponse.responseText) {
                                var getSystemColorsMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", "Control Panel\\Colors", "ButtonFace"] };
                                cbsMessages.sendSysReq("frontNativeMessageCall", "nmWrapper", getSystemColorsMsg, function (buttonFaceRGB) {
                                    // replace buttonFaceRGB with actual data
                                    var responseText = ajaxResponse.responseText;
                                    if (buttonFaceRGB) {
                                        try {
                                            buttonFaceRGB = buttonFaceRGB;
                                            buttonFaceRGB = buttonFaceRGB.status ? "rgb(240,240,240)" : 'rgb(' + buttonFaceRGB.result.replace(/[ ]/gi, ', ') + ')';
                                            responseText = ajaxResponse.responseText.replace("buttonFaceRGB", buttonFaceRGB);
                                        }
                                        catch (e) {
                                            console.log('failed to handle button face RGB in navigation handler. error:', e);
                                        }
                                    }
                                    eval(responseText);
                                });
                            }

                        } catch (e) {
                            console.error(e);
                        }
                    }
                };

                if (window.addEventListener) {
                    window.addEventListener("load", setTimeout(iframeLoadHandler, 1), false);
                }
                else {
                    window.attachEvent("onload", setTimeout(iframeLoadHandler, 1));
                }


                var dirName = chrome.i18n.getMessage("@@extension_id");
                var keyName = 'gadgetsContextHash_';
                var windowName = window.name;
                var prePopup = 'popup_inner_iframe';
                var context = null;
                var appOnToolbar = false;

                if (window.name && window.name.indexOf(extensionId) != -1) {
                    var popupGuidFormat = new RegExp("^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}");

                    if (!popupGuidFormat.test(windowName)) {
                        appOnToolbar = 'embedded';
                    }
                }

                if (windowName && typeof windowName == 'string' && windowName.indexOf(prePopup) == 0) {
                    windowName = windowName.substr(prePopup.length);
                }

                if (windowName.indexOf("___" + dirName) == -1) {
                    windowName += "___" + dirName;
                }
                var existingValue = unescape(localStorage.getItem(keyName + windowName));
                context = JSON.parse(existingValue) && JSON.parse(existingValue).result ? unescape(JSON.parse(existingValue).result) : '';
                if (context) {
                    context = JSON.parse(context);
                }

                // init will get popup / embedded or undefined.
                init(context && context.context ? context.context : (appOnToolbar ? appOnToolbar : ''));
            }
        } ());

        return {
            //Class has no public methods.
        };
    } catch (e) { console.log('navigation handler exeption from: ', document.location.href, ', error:', e); }
} ());
