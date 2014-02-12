// TODO: remove this when ABS will be ready
if (conduit.abstractionlayer.frontstage && conduit.abstractionlayer.frontstage.system && conduit.abstractionlayer.frontstage.system.getViewId && conduit.abstractionlayer.frontstage.system.getViewId() && conduit.abstractionlayer.frontstage.system.getViewId().result) {
    window.viewId = conduit.abstractionlayer.frontstage.system.getViewId().result;
}
else {
    window.viewId = +new Date() + Math.floor(Math.random() * 1111);
}
var isFF = (conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type == "Firefox");
if (isFF) {
    var buttonFaceRGB = conduit.abstractionlayer.commons.repository.getRegistrykey("systemColors", "ButtonFace");
    buttonFaceRGB = buttonFaceRGB.status ? "rgb(240,240,240)" : 'rgb(' + buttonFaceRGB.result.replace(/[ ]/gi, ', ') + ')';
    conduit.abstractionlayer.frontstage.appMethods.setInjectScriptEmbedded('(function () {if (document.body && document.location.href !== "about:blank") {function getContext(id) {var context;if (navigator.userAgent.indexOf("Firefox") != -1 && typeof (abstractionlayer) !== "undefined") {var windowName = abstractionlayer.commons.appMethods.getTopParentWindowName(this).result;context = JSON.parse(abstractionlayer.commons.appMethods.getContext(windowName || id).result);} else if (typeof (window.chrome) !== "undefined") { try { context = JSON.parse(id); /* for embedded apps*/ return context;} catch (e) { } var windowName = id;var prePopup = "popup_inner_iframe"; var keyName = "gadgetsContextHash_"; if (windowName && typeof windowName == "string" && windowName.indexOf(prePopup) == 0) {                    windowName = windowName.substr(prePopup.length); } var existingValue = localStorage.getItem(keyName + windowName); context = JSON.parse(existingValue);}else if (navigator.userAgent.indexOf("Safari") != -1) {if (id) {context = JSON.parse(top.conduit.abstractionlayer.commons.appMethods.getContext(id).result);}}else {context = JSON.parse(window.external.invokePlatformActionSync(23, 0, id));if (context.result) {context = JSON.parse(context.result);}}return context;}var messaging = (function () {var absMessaging = (navigator.userAgent.indexOf("Firefox") != -1 && typeof (abstractionlayer) !== "undefined") ? abstractionlayer.commons.messages : typeof (window.chrome) !== "undefined" ? (function () {var callbackMap = {};var topics = {};var connection = null;var extensionId = window.name.split("___")[1];var generateCallbackId = function () {var callbackId = (+new Date()) + "_" + Math.ceil(Math.random() * 5000);return (callbackMap[callbackId]) ? generateCallbackId() : callbackId;};function sendToCommunicator(message) {if (connection) {message.connectionName = connection.name;connection.postMessage(message);}}connection = chrome.extension.connect(extensionId, {name: "connection_embedded_injected_code_" + Math.random() * 5000});var sendSysReq = function (strDestLogicalName, strDestSenderName, data, callback) {var message = {userData: {senderName: strDestSenderName,data: data},sendercbId: null,sender: {tab: {id: contextData.info.tabInfo.tabId}},type: "sendRequest",logicalName: strDestLogicalName,origin: "main"};sendToCommunicator(message);};return {sendSysReq: sendSysReq};})() : (navigator.userAgent.indexOf("Safari") != -1) ?(function () { var sendSysReq = function (strDestLogicalName, strDestSenderName, data, callback) { safari.extension.globalPage.contentWindow.conduit.abstractionlayer.commons.messages.sendSysReq(strDestLogicalName, strDestSenderName, data, callback); };return {sendSysReq: sendSysReq};})(): (function () {var actionsEnum = {sendSysReq: 1};function sendSysReq(strDestLogicalName, strSenderName, data, callbackFunc) {strSenderName = strSenderName || "1";data = data || "1";callbackFunc = callbackFunc || (function (res) { });window.external.invokePlatformActionSync(8, actionsEnum.sendSysReq, window, "onMessageRecieved", 0, strDestLogicalName, strSenderName, data);}return {sendSysReq: sendSysReq};})();return absMessaging;} ());var contextData = getContext(window.name);var appContext = JSON.stringify({appId: contextData.appId,context: contextData.context,viewId: contextData.viewId,popupId: contextData.popupId,menuId: contextData.menuId,isMenu: contextData.menuId});function sendToWebappApi(method, params) {var sender = appContext;var data = {method: method,params: params};try {messaging.sendSysReq("webappApi", sender, JSON.stringify(data), function () { });}catch (e) {}}function handleClick(e) {if (e.button != 2) {sendToWebappApi("app.handleClickEvent", [{ button: e.button, left: e.screenX, top: e.screenY}]);}}function handleContextMenu(e) {var nodeName = e.target ? e.target.nodeName : e.srcElement && e.srcElement.nodeName;if (!window.chrome && nodeName != "INPUT") {sendToWebappApi("app.handleClickEvent", [{ button: 2, left: e.screenX, top: e.screenY}]);return false;}}function initInjectedFunctions() {if (document.body.attachEvent) {document.body.attachEvent("onmousedown", handleClick);}else {document.body.onmousedown = handleClick;}function isTransparent() {var color;if (window.getComputedStyle) {color = window.getComputedStyle(document.body, null).getPropertyValue("background-color");}else {color = document.body.currentStyle.backgroundColor;}return color && (color == "rgb(212, 208, 200)" || color == "rgb(255, 255, 255)" || color == "' + buttonFaceRGB + '" || color == "rgb(-1, -1, -1)" ||color.toLowerCase() == "#ffffff" || color.toLowerCase() == "buttonface" || document.body.style.backgroundColor.toLowerCase() == "threedface");}if (isTransparent()) {document.body.style.backgroundColor = "transparent";}if (navigator.userAgent.indexOf("Firefox") != -1 && !window.isHeightChangedByUser) {document.body.style.marginTop = (28 - contextData.info.originalHeight) / 2 + "px";}else if ((window.chrome || window.safari) && !window.isHeightChangedByUser) {document.body.style.marginTop = (26 - contextData.info.originalHeight) / 2 + "px";} var embArr = document.getElementsByTagName("embed");for (var i = 0; i < embArr.length; i++) {embArr[i].wmod = "tansparent";}var objArr = document.getElementsByTagName("object");for (var i = 0; i < objArr.length; i++) {objArr[i].wmod = "tansparent";}}/* originalHeight is to seperate browser comp apps from new web apps */if (document.body.attachEvent) {document.body.attachEvent("oncontextmenu", handleContextMenu);}else {document.body.oncontextmenu = handleContextMenu;}if (contextData.info && contextData.info.originalHeight) {initInjectedFunctions();}}})();');
}
if (typeof conduit.abstractionlayer.frontstage.system.setViewId === 'function')//TODO: remove if when stabs ready
    conduit.abstractionlayer.frontstage.system.setViewId(window.viewId);
conduit.webappApi.commons.init(viewId);

function appViewMenuHover(el) {
    if (!/appView_menu_hover/.test(el.className))
        el.className = el.className + ' appView_menu_hover';
}
function appViewMenuOut(el) {
    el.className = el.className.replace(' appView_menu_hover', '');
}

function getGeneralData() {

    var generalInfo = {};
    var absCommons = conduit.abstractionlayer.commons,
			browserInfo = absCommons.environment.getBrowserInfo().result,
			osInfo = absCommons.environment.getOSInfo().result;

    generalInfo.platform = {
        browser: browserInfo.type,
        browserVersion: browserInfo.version,
        locale: browserInfo.locale,
        OS: osInfo.type,
        OSVersion: osInfo.version
    };
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
    var activeCTID = conduit.coreLibs.config.getActiveCTID();

    with (absCommons.context) {
        generalInfo.toolbar = {
            id: activeCTID,
            oID: ctid,
            name: getToolbarName().result,
            downloadUrl: getDownloadUrl().result,
            version: absCommons.environment.getEngineVersion().result,
            cID: window.chrome && chrome.extension ? chrome.extension.getURL('').replace("chrome-extension://", "").replace("/undefined", "").replace("/", "") : ""
        };
    }
    generalInfo.tabData = {};
    if (conduit.abstractionlayer.frontstage.system.getTabData) {
        generalInfo.tabData = conduit.abstractionlayer.frontstage.system.getTabData().result;
    }

    return generalInfo;
}

function getAppData(appId, isUserAdded, apiPermissions, originalHeight, onBeforeLoadData, generalInfo) {
    var currentAppData = {
        "appId": appId,
        "context": "embedded",
        "apiPermissions": apiPermissions,
        "info": {
            "platform": generalInfo.platform,
            "toolbar": generalInfo.toolbar,
            "appId": appId,
            "isUserAdded": isUserAdded,
            "originalHeight": originalHeight,
            "onBeforeLoadData": onBeforeLoadData,
            "tabInfo": {
                "url": (apiPermissions && apiPermissions["getMainFrameUrl"] ? generalInfo.tabData.url : ""),  // no coreLibs - no consts
                "title": (apiPermissions && apiPermissions["getMainFrameTitle"] ? generalInfo.tabData.title : "")
            }
        },
        "viewId": window.viewId
    }
    return currentAppData
}

function setEmbeddedContexts() {
    var generalInfo = getGeneralData();
    var embeddedData = conduit.abstractionlayer.commons.repository.getKey(generalInfo.toolbar.oID + ".embeddedsData");
    if (!embeddedData.status) {
        embeddedData = JSON.parse(embeddedData.result);
        var currentContext;
        extId = (window.chrome) ? "___" + chrome.i18n.getMessage("@@extension_id") : "";
        for (var i in embeddedData) {
            currentContext = getAppData(embeddedData[i].appId,
                            embeddedData[i].isUserAdded,
                            embeddedData[i].apiPermissions,
                            embeddedData[i].originalHeight,
                            embeddedData[i].onBeforeLoadData,
                            generalInfo);
            conduit.abstractionlayer.commons.appMethods.setContext(currentContext.appId + extId, JSON.stringify(currentContext));
        }
    } else {//recovery when context data is unavailable
        if (!(/al\.view\.html/.test(document.location.href))) {
            document.location.href = document.location.href.replce = ("state.html", "al.view.html");
        }
    }
}

setEmbeddedContexts();