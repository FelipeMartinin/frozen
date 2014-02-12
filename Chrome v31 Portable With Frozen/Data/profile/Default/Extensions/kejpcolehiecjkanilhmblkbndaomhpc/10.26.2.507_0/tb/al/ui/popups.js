/**
* @fileOverview:  [somedescription]
* FileName: popup.js
* FilePath: C:\smartbarRefactoring\SmartBar\BusinessLogic\ApplicationLayer\Dev-Performance\src\main\js\UI\popups\popup.js
* Date: 25/7/2011 
* Copyright: 
*/
(function () {
    var isIE = /IE/i.test(conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type);
    var JSONstr;
    JSONstr = !isIE ? "" : decodeURIComponent("var%20JSON%3B%20JSON%20%7C%7C%20(JSON%20%3D%20%7B%7D)%3B(function()%20%7Bfunction%20k(a)%20%7B%20return%20a%20%3C%2010%20%3F%20%220%22%20%2B%20a%20%3A%20a%20%7D%20function%20o(a)%20%7B%20p.lastIndex%20%3D%200%3B%20return%20p.test(a)%20%3F%20'%22'%20%2B%20a.replace(p%2C%20function(a)%20%7B%20var%20c%20%3D%20r%5Ba%5D%3B%20return%20typeof%20c%20%3D%3D%3D%20%22string%22%20%3F%20c%20%3A%20%22%5C%5Cu%22%20%2B%20(%220000%22%20%2B%20a.charCodeAt(0).toString(16)).slice(-4)%20%7D)%20%2B%20'%22'%20%3A%20'%22'%20%2B%20a%20%2B%20'%22'%20%7D%20function%20l(a%2C%20j)%20%7Bvar%20c%2C%20d%2C%20h%2C%20m%2C%20g%20%3D%20e%2C%20f%2C%20b%20%3D%20j%5Ba%5D%3B%20b%20%26%26%20typeof%20b%20%3D%3D%3D%20%22object%22%20%26%26%20typeof%20b.toJSON%20%3D%3D%3D%20%22function%22%20%26%26%20(b%20%3D%20b.toJSON(a))%3B%20typeof%20i%20%3D%3D%3D%20%22function%22%20%26%26%20(b%20%3D%20i.call(j%2C%20a%2C%20b))%3B%20switch%20(typeof%20b)%20%7Bcase%20%22string%22%3A%20return%20o(b)%3B%20case%20%22number%22%3A%20return%20isFinite(b)%20%3F%20String(b)%20%3A%20%22null%22%3B%20case%20%22boolean%22%3A%20case%20%22null%22%3A%20return%20String(b)%3B%20case%20%22object%22%3A%20if%20(!b)%20return%20%22null%22%3Be%20%2B%3D%20n%3B%20f%20%3D%20%5B%5D%3B%20if%20(Object.prototype.toString.apply(b)%20%3D%3D%3D%20%22%5Bobject%20Array%5D%22)%20%7B%20m%20%3D%20b.length%3B%20for%20(c%20%3D%200%3B%20c%20%3C%20m%3B%20c%20%2B%3D%201)%20f%5Bc%5D%20%3D%20l(c%2C%20b)%20%7C%7C%20%22null%22%3B%20h%20%3D%20f.length%20%3D%3D%3D%200%20%3F%20%22%5B%5D%22%20%3A%20e%20%3F%20%22%5B%5Cn%22%20%2B%20e%20%2B%20f.join(%22%2C%5Cn%22%20%2B%20e)%20%2B%20%22%5Cn%22%20%2B%20g%20%2B%20%22%5D%22%20%3A%20%22%5B%22%20%2B%20f.join(%22%2C%22)%20%2B%20%22%5D%22%3B%20e%20%3D%20g%3B%20return%20h%20%7D%20if%20(i%20%26%26%20typeof%20i%20%3D%3D%3D%20%22object%22)%20%7B%20m%20%3D%20i.length%3B%20for%20(c%20%3D%200%3B%20c%20%3C%20m%3B%20c%20%2B%3D%201)%20typeof%20i%5Bc%5D%20%3D%3D%3D%20%22string%22%20%26%26%20(d%20%3D%20i%5Bc%5D%2C%20(h%20%3D%20l(d%2C%20b))%20%26%26%20f.push(o(d)%20%2B%20(e%20%3F%20%22%3A%20%22%20%3A%20%22%3A%22)%20%2B%20h))%20%7D%20else%20for%20(d%20in%20b)%20Object.prototype.hasOwnProperty.call(b%2C%20d)%20%26%26%20(h%20%3D%20l(d%2C%20b))%20%26%26%20f.push(o(d)%20%2B%20(e%20%3F%20%22%3A%20%22%20%3A%20%22%3A%22)%20%2B%20h)%3B%20h%20%3D%20f.length%20%3D%3D%3D%200%20%3F%20%22%7B%7D%22%20%3A%20e%20%3F%20%22%7B%5Cn%22%20%2B%20e%20%2B%20f.join(%22%2C%5Cn%22%20%2B%20e)%20%2B%20%22%5Cn%22%20%2B%20g%20%2B%20%22%7D%22%20%3A%20%22%7B%22%20%2B%20f.join(%22%2C%22)%20%2B%22%7D%22%3B%20e%20%3D%20g%3B%20return%20h%7D%7D%20if%20(typeof%20Date.prototype.toJSON%20!%3D%3D%20%22function%22)%20Date.prototype.toJSON%20%3D%20function()%20%7B%20return%20isFinite(this.valueOf())%20%3F%20this.getUTCFullYear()%20%2B%20%22-%22%20%2B%20k(this.getUTCMonth()%20%2B%201)%20%2B%20%22-%22%20%2B%20k(this.getUTCDate())%20%2B%20%22T%22%20%2B%20k(this.getUTCHours())%20%2B%20%22%3A%22%20%2B%20k(this.getUTCMinutes())%20%2B%20%22%3A%22%20%2B%20k(this.getUTCSeconds())%20%2B%20%22Z%22%20%3A%20null%20%7D%2C%20String.prototype.toJSON%20%3D%20Number.prototype.toJSON%20%3D%20Boolean.prototype.toJSON%20%3D%20function()%20%7B%20return%20this.valueOf()%20%7D%3B%20var%20q%20%3D%20%2F%5B%5Cu0000%5Cu00ad%5Cu0600-%5Cu0604%5Cu070f%5Cu17b4%5Cu17b5%5Cu200c-%5Cu200f%5Cu2028-%5Cu202f%5Cu2060-%5Cu206f%5Cufeff%5Cufff0-%5Cuffff%5D%2Fg%2Cp%20%3D%20%2F%5B%5C%5C%5C%22%5Cx00-%5Cx1f%5Cx7f-%5Cx9f%5Cu00ad%5Cu0600-%5Cu0604%5Cu070f%5Cu17b4%5Cu17b5%5Cu200c-%5Cu200f%5Cu2028-%5Cu202f%5Cu2060-%5Cu206f%5Cufeff%5Cufff0-%5Cuffff%5D%2Fg%2C%20e%2C%20n%2C%20r%20%3D%20%7B%20%22%5Cu0008%22%3A%20%22%5C%5Cb%22%2C%20%22%5Ct%22%3A%20%22%5C%5Ct%22%2C%20%22%5Cn%22%3A%20%22%5C%5Cn%22%2C%20%22%5Cu000c%22%3A%20%22%5C%5Cf%22%2C%20%22%5Cr%22%3A%20%22%5C%5Cr%22%2C%20'%22'%3A%20'%5C%5C%22'%2C%20%22%5C%5C%22%3A%20%22%5C%5C%5C%5C%22%20%7D%2C%20i%3B%20if%20(typeof%20JSON.stringify%20!%3D%3D%20%22function%22)%20JSON.stringify%20%3D%20function(a%2C%20j%2C%20c)%20%7Bvar%20d%3B%20n%20%3D%20e%20%3D%20%22%22%3B%20if%20(typeof%20c%20%3D%3D%3D%20%22number%22)%20for%20(d%20%3D%200%3B%20d%20%3C%20c%3B%20d%20%2B%3D%201)%20n%20%2B%3D%20%22%20%22%3B%20else%20typeof%20c%20%3D%3D%3D%20%22string%22%20%26%26%20(n%20%3D%20c)%3B%20if%20((i%20%3D%20j)%20%26%26%20typeof%20j%20!%3D%3D%20%22function%22%20%26%26%20(typeof%20j%20!%3D%3D%20%22object%22%20%7C%7C%20typeof%20j.length%20!%3D%3D%20%22number%22))%20throw%20Error(%22JSON.stringify%22)%3B%20return%20l(%22%22%2C%7B%20%22%22%3A%20a%20%7D)%7D%3B%20if%20(typeof%20JSON.parse%20!%3D%3D%20%22function%22)%20JSON.parse%20%3D%20function(a%2C%20e)%20%7Bfunction%20c(a%2C%20d)%20%7B%20var%20g%2C%20f%2C%20b%20%3D%20a%5Bd%5D%3B%20if%20(b%20%26%26%20typeof%20b%20%3D%3D%3D%20%22object%22)%20for%20(g%20in%20b)%20Object.prototype.hasOwnProperty.call(b%2C%20g)%20%26%26%20(f%20%3D%20c(b%2C%20g)%2C%20f%20!%3D%3D%20void%200%20%3F%20b%5Bg%5D%20%3D%20f%20%3A%20delete%20b%5Bg%5D)%3B%20return%20e.call(a%2C%20d%2C%20b)%20%7D%20var%20d%2C%20a%20%3D%20String(a)%3B%20q.lastIndex%20%3D%200%3B%20q.test(a)%20%26%26%20(a%20%3D%20a.replace(q%2C%20function(a)%20%7B%20return%20%22%5C%5Cu%22%20%2B%20(%220000%22%20%2B%20a.charCodeAt(0).toString(16)).slice(-4)%20%7D))%3B%20if%20(%2F%5E%5B%5C%5D%2C%3A%7B%7D%5Cs%5D*%24%2F.test(a.replace(%2F%5C%5C(%3F%3A%5B%22%5C%5C%5C%2Fbfnrt%5D%7Cu%5B0-9a-fA-F%5D%7B4%7D)%2Fg%2C%20%22%40%22).replace(%2F%22%5B%5E%22%5C%5C%5Cn%5Cr%5D*%22%7Ctrue%7Cfalse%7Cnull%7C-%3F%5Cd%2B(%3F%3A%5C.%5Cd*)%3F(%3F%3A%5BeE%5D%5B%2B%5C-%5D%3F%5Cd%2B)%3F%2Fg%2C%22%5D%22).replace(%2F(%3F%3A%5E%7C%3A%7C%2C)(%3F%3A%5Cs*%5C%5B)%2B%2Fg%2C%20%22%22)))%20return%20d%20%3D%20eval(%22(%22%20%2B%20a%20%2B%20%22)%22)%2C%20typeof%20e%20%3D%3D%3D%20%22function%22%20%3F%20c(%7B%20%22%22%3A%20d%20%7D%2C%20%22%22)%20%3A%20d%3B%20throw%20new%20SyntaxError(%22JSON.parse%22)%3B%7D%7D)()%3B");
    conduit.abstractionlayer.backstage.appMethods.setInjectScriptPopup(JSONstr + 'setTimeout(function () {if (document.body && document.location.href !== "about:blank") {function getContext(id) {var context;if (navigator.userAgent.indexOf("Firefox") != -1 && typeof (abstractionlayer) !== "undefined") {var windowName = abstractionlayer.commons.appMethods.getTopParentWindowName(this).result;context = JSON.parse(abstractionlayer.commons.appMethods.getContext(windowName || id).result);} else if (typeof (window.chrome) !== "undefined") { try {context = JSON.parse(id); /* for embedded apps*/ return context;} catch (e) { } var windowName = id; var prePopup = "popup_inner_iframe"; var keyName = "gadgetsContextHash_"; if (windowName && typeof windowName == "string" && windowName.indexOf(prePopup) == 0) { windowName = windowName.substr(prePopup.length); } var existingValue = localStorage.getItem(keyName + windowName); context = JSON.parse(existingValue);} else if (navigator.userAgent.indexOf("Safari") != -1) {context = JSON.parse(abstractionlayer.commons.appMethods.getContext("contextData").result); }else {context = JSON.parse(window.external.invokePlatformActionSync(23, 0, id));if (context.result) {context = JSON.parse(context.result);}}return context;}var messaging = (function () {var absMessaging = (navigator.userAgent.indexOf("Firefox") != -1 && typeof (abstractionlayer) !== "undefined") ? abstractionlayer.commons.messages : typeof (window.chrome) !== "undefined" ? (function () {var callbackMap = {};var topics = {};var connection = null;var extensionId = window.name.split("___")[1];var generateCallbackId = function () {var callbackId = (+new Date()) + "_" + Math.ceil(Math.random() * 5000);return (callbackMap[callbackId]) ? generateCallbackId() : callbackId;};function sendToCommunicator(message) {if (connection) {message.connectionName = connection.name;connection.postMessage(message);}}connection = chrome.extension.connect(extensionId, {name: "connection_popup_injected_code_" + conduit.currentApp.appId + "_" + Math.random() * 5000});var sendSysReq = function (strDestLogicalName, strDestSenderName, data, callback) {var message = {userData: {senderName: strDestSenderName,data: data},sendercbId: null,sender: {tab: {id: contextData.info.tabInfo.tabId}},type: "sendRequest",logicalName: strDestLogicalName,origin: "main"};sendToCommunicator(message);};return {sendSysReq: sendSysReq};})() : (navigator.userAgent.indexOf("Safari") != -1) ? abstractionlayer.commons.messages:(function () {var actionsEnum = {sendSysReq: 1};function sendSysReq(strDestLogicalName, strSenderName, data, callbackFunc) {strSenderName = strSenderName || "1";data = data || "1";callbackFunc = callbackFunc || (function (res) { });window.external.invokePlatformActionSync(8, actionsEnum.sendSysReq, window, "onMessageRecieved", 0, strDestLogicalName, strSenderName, data);}return {sendSysReq: sendSysReq};})();return absMessaging;} ());var contextData = getContext(window.name);var appContext = JSON.stringify({appId: contextData.appId,context: contextData.context,viewId: contextData.viewId,popupId: contextData.popupId,menuId: contextData.menuId,isMenu: contextData.menuId});function sendToWebappApi(method, params) {var sender = appContext;var data = {method: method,params: params};try {messaging.sendSysReq("webappApi", sender, JSON.stringify(data), function () { });}catch (e) {}}if ((window.chrome && window.parent == window.top) || window == window.top) {sendToWebappApi("app.popup.handlePopupTitle", [document.title]);}}}, 500);');

    var serviceLayer = conduit.backstage.serviceLayer;


    var FRAME_WIDTH = 2;
    var FRAME_HEIGHT = 32;
    var LIGHT_FRAME_WIDTH = 2;
    var LIGHT_FRAME_HEIGHT = 2;
    var AUTO_RESIZE_MARGINS = 0;
    var pendingPopupUrl = "";

    //very ugly temp patch. 
    function getScreenWidth(callback) {
        conduit.coreLibs.UI.getScreenWidth(function (screenDimensions) {
            callback(screenDimensions.width + screenDimensions.offset);
        });
    }
    function buildPopupNotFoundHtml() {
        var data = serviceLayer.translation.getTranslation("CTLP_STR_ID_GADGETS_ERROR_ERROR_TEXT_CLOSE_WINDOW");
        if (!data) {
            data = "Sorry, this feature is experiencing temporary technical problems. Please try again soon.\r\n\r\n @Close@ this window";
        }
        var content = data.replace("\r", "").split("\n");
        var close = content[2].replace(/\@(.*)\@/, function (full, val) { return "<span onclick = 'window.close();' style ='color:blue; cursor:pointer'>" + val + "</span>" });
        var finalHtml = "<!DOCTYPE html><html><head></head><body style ='text-align: center; position:absolute; bottom: 5px;'><div>" + content[0] + "</div><div>" + close + "</div></body></html>";
        conduit.abstractionlayer.backstage.appMethods.setInjectScriptPopupError('document.write("' + finalHtml + '")');
    }

    //aliases
    var absPopup = conduit.abstractionlayer.backstage.popup,
        applicationPath = conduit.abstractionlayer.commons.environment.getApplicationPath().result,
		messages = conduit.abstractionlayer.commons.messages,
		appFolders = {};

    /**
    @listener
    @description: a listener which handles all popups requests and routes them to the appropriate function.
    */
    messages.onSysReq.addListener("applicationLayer.UI.popups", function (data, sender, callback) {
        conduit.coreLibs.logger.logDebug('applicationLayer.UI.popups: ' + data);
        var dataObj = JSON.parse(data),
            method = dataObj.method;

        //delete unnecessary properties
        delete dataObj.method;

        //we check if the method exists in the applicationLayer.UI.popupManager level (open, close...).
        //if not, we get the specific popup object which has the method in its prototype.
        var popupMgrMethod = conduit.applicationLayer.UI.popupManager[method];
        if (popupMgrMethod)
            popupMgrMethod(dataObj, dataObj.appData, callback);
        else {
            //get the popup instance
            var currentPopup = conduit.applicationLayer.UI.popupManager.getPopup(dataObj.appData);
            currentPopup[method](dataObj, dataObj.appData, callback);
        }
    });

    /**
    @function
    @description: checks if the popup is about to exceed the screen width.
    @param: {object} - holds the current left position of popup that is about to be displayed.
    @param: {object} - holds the width of the popup.
    @return: the fixed left position.
    */
    function fixExceedingPopup(oPosition, oPopup, callback) {
        var left = oPosition.left;
        getScreenWidth(function (screenWidth) {
            if (popupManager.getToolbarDir() === 'rtl') {
                left = oPosition.right - oPopup.width;
                if (oPosition.left < 10) {
                    left = 10;
                }
            }
            else {
                var popupOffset = oPosition.left + oPopup.width - screenWidth + 30;

                if (popupOffset > 0) {
                    left -= popupOffset;
                }
            }
            callback(left);
        });
    }

    /**
    @object: "applicationLayer.UI.popupManager" - singleton
    @description: responsible for opening and closing all popups and managing their data.
    @property: {object} popups - holds all popups instances.
    @property: {int} lastPopupId - represents the id of the popup in the popups object.
    @property: {function} open - open the popup. 
    @property: {function} close - close the popup.
    @property: {function} getPopup - add handlers for all webAppp types
    */
    conduit.register("applicationLayer.UI.popupManager", (function () {

        var self = this;
        var popups = {},
            toolbarDir,
			lastPopupId = 0;
        var onCloseListeners = {};
        var onHideListeners = {};
        var onShowListeners = {};
        var logger = conduit.coreLibs.logger;
        var savedPositions = {};
        /* private members */


        /*
        * Will search for popup in current view - chrome only. other platforms will use getPopup
        */
        function getPopupInCurrentViewId(appData) {
            if (window.chrome) {
                return popups[appData.popupId + "_" + appData.viewId];
            }
            else {
                return getPopup(appData);
            }
        }

        /**
        @function
        @description: retrieve the popup data/instance by passing an object or just the id as a string.
        @param: {object/string} appData: send this if you're sending an inner popupID (rather than the abstraction popup ID)
        */
        function getPopup(appData) {
            if (!appData) { return null; }

            if (typeof (appData) === "object") {
                if (window.chrome) {
                    /*
                    * in chome we manage popups per viewId. If popup is not in selected viewId we look for it in all popups
                    */
                    if (popups[appData.popupId + "_" + appData.viewId]) {
                        return popups[appData.popupId + "_" + appData.viewId];
                    } else {
                        for (var popupId in popups) {
                            if (popupId.match(appData.popupId + "_")) {
                                return popups[popupId];
                            }
                        }
                    }
                }
                // IE & FF
                return popups[appData.popupId];
            }
            else {
                for (var popupId in popups) {
                    var popupData = popups[popupId];
                    if (popupData.absId === appData) {
                        return popupData;
                    }
                }
            }
            return undefined;
        }

        function urlExists(url, viewId) {
            if (/http/.test(url)) { //meaning we have external page to open
                for (var popupId in popups) {
                    var popupData = popups[popupId];
                    if (window.chrome) {
                        if (popupData.url === url && popupData.viewId == viewId) {
                            return popupData;
                        }
                    }
                    else {
                        if (popupData.url === url) {
                            return popupData;
                        }
                    }
                }
            }
        }
        /**
        @function
        @description: this function takes the popup's last position and compare it with 
        the current position of the app icon to see if there were any movements.
        @param: {object} currentPposition - the current position of the popup that we got from the view.
        @param: {object} popupObject - the popup instance that holds its last position.
        */
        function checkPopupLastPosAndAdujst(currentPposition, popupObject) {
            var isNeedAdujstment = false;
            if (toolbarDir === 'rtl') {
                if (currentPposition.right !== popupObject.properties.position.right) {
                    isNeedAdujstment = true;
                }
            }
            else {
                if (popupObject.left != currentPposition.left || popupObject.top != (currentPposition.bottom || currentPposition.top)) {
                    isNeedAdujstment = true;
                }
            }

            /* var isNeedAdujstment = (popupObject.left != currentPposition.left || popupObject.top != currentPposition.bottom)
            ? true : false;*/
            //the popup has a different position.					
            if (isNeedAdujstment) {
                //before we call the changePosition from the abstractionLayer we make sure the popup
                //wont be opened outside of the screen.

                fixExceedingPopup(currentPposition, popupObject, function (left) {
                    currentPposition.left = left;
                    //change popup position.
                    absPopup.changePosition(popupObject.absId, (currentPposition.bottom || currentPposition.top), currentPposition.left, function () {
                        //update the popup object top and left properties for the next time comparison .					
                        popupObject.top = currentPposition.bottom;
                        popupObject.left = currentPposition.left;
                        //finally
                        popupShow();
                    });
                });

            }
            else {
                //the popup has the same position. we just show it.
                popupShow();
            }


            /**
            @function
            @description: shows the minimized popup and updates the model.
            */
            function popupShow() {
                absPopup.show(popupObject.absId, "", function () {
                    //updatethe instance property.
                    popupObject.isMinimized = false;
                    var objData = {
                        data: {
                            isMinimized: popupObject.isMinimized
                        },
                        appId: popupObject.appId,
                        method: 'onMinimizeToggleIcon'
                    };

                    messages.sendSysReq(
						"applicationLayer.appManager.model.webAppApiRequest",
							JSON.stringify({ appId: popupObject.appId }), JSON.stringify(objData), function () { });
                });
            }
        }

        function savePopupPosition(url, top, left) {
            if (!savedPositions[url]) {
                savedPositions[url] = {};
            }
            savedPositions[url].position = { top: top, left: left, isAbsolute: true };
            //save data
            conduit.abstractionlayer.commons.repository.setData(conduit.abstractionlayer.commons.context.getCTID().result + ".savedPositions", JSON.stringify(savedPositions), function () {});
        }

        function savePopupSize(url, height, width) {
            if (!savedPositions[url]) {
                savedPositions[url] = {};
            }
            savedPositions[url].size = { height: height, width: width };
            //save data
            conduit.abstractionlayer.commons.repository.setData(conduit.abstractionlayer.commons.context.getCTID().result + ".savedPositions", JSON.stringify(savedPositions), function () {});
        }

        function getSavedSize(url) {
            return savedPositions[url] && savedPositions[url].size;
        }

        function getSavedPosition(url) {
            return savedPositions[url] && savedPositions[url].position;
        }

        function initListeners() {
            conduit.subscribe("onTranslationChange", function () {
                buildPopupNotFoundHtml();
            });
            /**
            @listener
            @description: fired by abstractionLayer whenever a popup has been closed
            and passing to it the popupID.
            @param: {function} - callback which gets the popup id
            */
            absPopup.addCloseCallbackFunc.addListener(function (popupId, extraData) {
                function deleteCallback(popupId) {
                    if (onCloseListeners[popupId]) {
                        for (var i = 0; i < onCloseListeners[popupId].length; i++) {
                            onCloseListeners[popupId][i]();
                        }
                        delete onCloseListeners[popupId]
                    }
                }

                //we get the popup data from the popups object.
                var popupData = getPopup(popupId);


                if (popupData) {
                    if (popupData.properties && popupData.properties.saveLocation) {
                        var savePosition = extraData && extraData.position ? extraData.position : absPopup.getPosition(popupId).result;
                        if (savePosition && savePosition.top != undefined && savePosition.left != undefined && !popupData.isMinimized) { //Don't save minimized popups position
                            savePopupPosition(popupData.url, savePosition.top, savePosition.left);
                        }
                    }
                    if (popupData.properties && popupData.properties.saveSize) { //save the size without frame
                        var savedSize = absPopup.getSize(popupId).result;
                        if (savedSize && savedSize.height && savedSize.width) {
                            savePopupSize(popupData.url, savedSize.height, savedSize.width);
                        }
                    }
                    //sending message to the model to update its popups property.
                    messages.postTopicMsg(
                "onPopupClose", "applicationLayer.UI.popups",
                 JSON.stringify({
                     popupId: popupData.id,
                     appId: popupData.appId
                 }
                ));
                    delete popups[popupData.id];
                }

                //we delete this record from the popups object.

                if (window.chrome && popupData) {
                    logger.logDebug('deleting popup id: ' + popupData.id + ' absId: ' + popupId);
                    delete popups[popupData.id + "_" + popupData.viewId];
                }

                deleteCallback(popupId); //abs id
                if (popupData) { //if popup exist
                    deleteCallback(popupData.id); // application id
                }
                checkActivePopups();
            });

            conduit.subscribe("onSettingsReady", function (data) {
                // refresh settings occured, close all minimized popups
                for (var popupId in popups) {
                    var popupData = popups[popupId];
                    if (popupData.isMinimized || popupData.appIdManaged) {
                        popupData.close();
                    }
                }


            });

            conduit.abstractionlayer.backstage.browser.onChangeViewState.addEventListener(function (state) {
                if (state == "hidden") {
                    for (var popupId in popups) {
                        var popupData = popups[popupId];
                        popupData.close(function () { });
                    }
                }
            });

            absPopup.onHidePopup.addListener(function (absId) {
                var popupData = getPopup(absId);
                var popupId = popupData ? popupData.id : absId;
                if (popupId) {
                    if (onHideListeners[popupId]) {
                        for (var i = 0; i < onHideListeners[popupId].length; i++) {
                            onHideListeners[popupId][i]();
                        }
                    }
                    if (popupData) {
                        popupData.isHidden = true;
                    }
                }
                checkActivePopups();
            });

            absPopup.onPopupShown.addListener(function (absId) {
                /*
                var popupData = getPopup(absId);
                var popupId = popupData ? popupData.id : absId;
                if (popupId) {
                if (onShowListeners[popupId]) {
                for (var i = 0; i < onShowListeners[popupId].length; i++) {
                onShowListeners[popupId][i]();
                }
                }
                if (popupData) {
                popupData.isHidden = false;
                }
                }*/
                // notify active popup
                conduit.triggerEvent("onPopupManagerChange", true);
            });


        }

        function checkActivePopups() {
            for (var popupId in popups) {
                var popupData = popups[popupId];
                if (!popupData.isMinimized && !popupData.isHidden) {
                    return false;
                }
            }
            // if all popups are minimized, hidden or deleted notify no active popups
            conduit.triggerEvent("onPopupManagerChange", false);
        }

        function fixWrongPositions() {
            for (var item in savedPositions) {
                if (savedPositions[item].position) {
                    if (savedPositions[item].position.left < -5000 || savedPositions[item].position.top < -5000) {
                        delete savedPositions[item];
                    }
                }
            }
            conduit.abstractionlayer.commons.repository.setData(conduit.abstractionlayer.commons.context.getCTID().result + ".savedPositions", JSON.stringify(savedPositions), function () {});
        }

        function init() {
            conduit.coreLibs.logger.performanceLog({ from: "Popup Manager - init", action: "init : ", time: +new Date(), isWithState: "" });
            logger.logDebug('applicationLayer.UI.popupManager.init');
            initListeners();
            buildPopupNotFoundHtml();
            //get saved positions
            conduit.abstractionlayer.commons.repository.getData(conduit.abstractionlayer.commons.context.getCTID().result + ".savedPositions", false, function (savedData) {

                if (!savedData.status) {
                    savedPositions = JSON.parse(savedData.result);
                    fixWrongPositions(); // old versions may save wrong position (< -5000), if so, delete the wrong data
                }
                conduit.coreLibs.logger.performanceLog({ from: "Popup Manager - init", action: "trigger ready event: ", time: +new Date(), isWithState: "" });
                conduit.triggerEvent("onReady", { name: 'applicationLayer.UI.popupManager' });
            });
        }

        init();

        return {
            /**
            @function
            @description: create new instance of popup object. 
            @param: {object} popupProperties - holds popup info
            @param: {object} appData - holds popup info
            @param: {function} callback.
            */
            open: function (popupProperties, appData, callback) {
                logger.logDebug('open start', { className: "popups", functionName: "open" });
                var existingPopup;

                if (pendingPopupUrl == popupProperties.url) {
                    logger.logDebug('open: popup pending!', { className: "popups", functionName: "open" });
                    return;
                }


                popupProperties.showFrame = popupProperties.showFrame !== undefined ? popupProperties.showFrame : true; // default value must be true
                //the first time a popup is being open it has no popupId. so,
                //if we have an id, we know the popup already exists(minimized or opend).
                if (appData.popupId && (existingPopup = getPopupInCurrentViewId(appData))) {
                    logger.logDebug('open: popupId exist!', { className: "popups", functionName: "open" });
                    //we get the popup instance from the popups object.
                    if (existingPopup.isMinimized)
                    //we call the toggle function which is a prototype function of this instance.
                    //the toggle function will decide whether to minimize or show the popup
                        existingPopup.toggle();
                    else
                        existingPopup.setFocus();
                }
                else if (existingPopup = urlExists(popupProperties.url, appData.viewId)) {
                    logger.logDebug('open: url exist!', { className: "popups", functionName: "open" });
                    if (existingPopup.isMinimized)
                        existingPopup.toggle();
                    else
                        existingPopup.setFocus();
                }
                else {
                    //adding the popup to the popups object.
                    //this is the first time the popup is being open.
                    //next, we increment the lastPopupId and assign the new value to popupId.     
                    var popupId = String(++lastPopupId);


                    pendingPopupUrl = popupProperties.url;
                    //finally we create a new popup instance.
                    new conduit.applicationLayer.UI.popup(popupId, popupProperties, appData, function (popupObj) {
                        //after the instance has been made and the popup was opened,
                        //this code is running, its assigning the new instance at the
                        //right location in the popups object for later use.
                        if (window.chrome) {
                            popups[popupId + "_" + appData.viewId] = popupObj;
                        }

                        popups[popupId] = popupObj;
                        pendingPopupUrl = "";
                        logger.logDebug('open:  popup opened!', { className: "popups", functionName: "open" });
                        // notify active popup
                        conduit.triggerEvent("onPopupManagerChange", true);
                        //this callback will notify the model that the popup has been opened.
                        callback(popupId, popupObj);
                    });
                }
            },
            /**
            @function
            @description: close the popup and delete itself from the popups object.
            @param: {string} popupId
            @param: {object} appData 
            @param: {function} callback 
            */
            close: function (popupId, appData, callback) {
                //get the relevant popup instance from the popups object.
                var popup = getPopup(appData);
                if (popup) {
                    //use its prototype function
                    popup.close(callback);
                }
            },
            /**
            @function
            @description: retrieve the popup data by passing an object or just the id as a string.
            @param: {string} popupId - 
            @param: {object} appData - 
            @param: {function} callback - 
            */
            getPosition: function (popupObject) {
                if (popupObject.properties && popupObject.properties.saveLocation && savedPositions[popupObject.url] && savedPositions[popupObject.url].position) {
                    checkPopupLastPosAndAdujst({ left: savedPositions[popupObject.url].position.left, top: savedPositions[popupObject.url].position.top }, popupObject);
                    return;
                }

                //send message to view to get the current!! position of the app.
                if (popupObject.viewId)
                    messages.sendSysReq("applicationLayer.appManager.view_" + popupObject.viewId, "coreLibs.popups", JSON.stringify({ method: "getAppPosition", data: popupObject.appId }), function (data) {
                        var currentPposition = JSON.parse(data);

                        //we have the current position. now we need to compare the current position with the last position
                        //which is stored in the popup instance properties.
                        checkPopupLastPosAndAdujst(currentPposition, popupObject);
                    });
                else
                    checkPopupLastPosAndAdujst({ left: 0, top: 0 }, popupObject);
            },
            getPopup: getPopup,
            closeOpenPopups: function (appId) {
                for (var popupId in popups) {
                    var popupData = popups[popupId];
                    if (popupData) {
                        if (popupData.appId == appId) {
                            popupData.close();
                        }
                    }

                }
            },
            getSavedPosition: getSavedPosition,
            getSavedSize: getSavedSize,
            getSize: function (popupObject, appData, callback) {
                var popupData = getPopup(appData);
                var savedSize = absPopup.getSize(popupData.absId).result;
                callback(JSON.stringify({ width: savedSize.width, height: savedSize.height }));
            },
            setToolbarDir: function (dir) {
                toolbarDir = dir;
            },
            getToolbarDir: function () {
                return toolbarDir;
            },
            addCloseCallback: function (popupId, callback) {
                if (!onCloseListeners[popupId]) {
                    onCloseListeners[popupId] = []
                }
                onCloseListeners[popupId].push(callback);
            },
            addOnHideCallback: function (popupId, callback) {
                if (!onHideListeners[popupId]) {
                    onHideListeners[popupId] = []
                }
                onHideListeners[popupId].push(callback);
            },
            addOnShowCallback: function (popupId, callback) {
                if (!onShowListeners[popupId]) {
                    onShowListeners[popupId] = []
                }
                onShowListeners[popupId].push(callback);
            }
        };

    })());
    //alias
    var popupManager = conduit.applicationLayer.UI.popupManager;


    /**
    @object: "applicationLayer.UI.popup" - constructor
    @description: a constructor function to instantiate popups objects.
    //when instantiate, there are some private function that run in order to prepare the 
    data for the popup starting with 'withUrl()'.
    @param: {string} popupId -
    @param: {object} popupProperties - 
    @param: {object} appData
    @param: {function} onOpen - callback function
    */
    conduit.register("applicationLayer.UI.popup", function (popupId, popupProperties, appData, onOpen) {
        var logger = conduit.coreLibs.logger;
        var self = this;
        this.id = popupId;
        this.appId = appData.appId;
        this.appIdManaged = conduit.applicationLayer.appCore.appManager.model.getAppById(appData.appId);
        this.viewId = appData.viewId;
        this.url = String(popupProperties.url); // in oreder to get velue not referance
        this.frameUrl;
        if (popupProperties.position) {

            this.left = popupProperties.position.left;
            this.top = popupProperties.position.top;
        }
        this.width = popupProperties.width;
        this.height = popupProperties.height;

        appData.context = "popup";
        appData.popupId = popupId;

        /* private members */
        function isRelativeUrl(url) {
            var absoluteUrlRegexs = [
				/^[A-Z]:\\/, // absolute path in IE
				/^file:\/\//,
				/^https?:\/\//,
				/^chrome-extension:\/\//, // absolute path in Chrome
                /^safari-extension:\/\// // absolute path in safari
			],
			isAbsoluteUrl = false;

            for (var i = 0; i < absoluteUrlRegexs.length && !isAbsoluteUrl; i++) {
                isAbsoluteUrl = absoluteUrlRegexs[i].test(url);
            }

            return !isAbsoluteUrl;
        }

        /**
        @function
        @description: If the provided URL is relative, add the full path according to the appId.
        For example, if "popup.html" is provided as URL and the webapp that requested the open has an appType
        of "MULTI_RSS", the resulting url is: "C:\(application path)\js\al\wa\MULTI_RSS\popup.html".
        @param: {function} callback  
        */
        function withUrl(callback) {
            logger.logDebug('withUrl:', { className: "popups", functionName: "withUrl" });
            callback = setFrameData;
            if (isRelativeUrl(popupProperties.url)) {
                var applicationDirName = conduit.coreLibs.config.getApplicationDirName();

                if (!appFolders[appData.appId]) {

                    //get a reference to the appManagerModel.
                    var appManagerModel = conduit.applicationLayer.appCore.appManager.model;

                    //get the model.
                    modelsList = appManagerModel.getModelsList(),
						model = modelsList.GetByID(appData.appId);

                    //if the the model has a version property we know we have app of type WEBAPP
                    //so the popup.html path is inside the appGuid + version folder.
                    //otherwise we use the appFolder property - e.g RADIO_PLAYER.

                    var appFolderFromSettings = serviceLayer.config.toolbarSettings.getAppFolder(appData.appId);

                    var appFolder;
                    if (model) {
                        appFolder = model.version ? model.appGuid + "_" + model.version : model.appFolder;
                    }
                    else {
                        appFolder = appFolderFromSettings;
                    }

                    //build the full path.
                    var absoluteUrl = [applicationPath, (applicationDirName + "/al/wa/"), appFolder, "/", popupProperties.url].join("");
                    appFolders[appData.appId] = appFolder;

                    //update the popup data.
                    popupProperties.url = absoluteUrl;
                    callback();
                }
                else {
                    absoluteUrl = [applicationPath, (applicationDirName + "/al/wa/"), appFolders[appData.appId], "/", popupProperties.url].join("");
                    popupProperties.url = absoluteUrl;
                    callback();
                }
            }
            else {
                callback();
            }
        }

        /**
        @function
        @description: If the popup should be displayed inside a wrapper frame ("gadget frame"), set the URL of
        the popup to the wrapper's URL and adjust the width and height to take account of the extra space required.
        @param: {function} callback  
        */
        function setFrameData(callback) {
            logger.logDebug('setFrameData:', { className: "popups", functionName: "setFrameData" });
            callback = getPositionAndOpen;

            // take savedSize if exist
            var savedSize = popupManager.getSavedSize(popupProperties.url);
            if (savedSize) {
                popupProperties.width = savedSize.width > 100 ? savedSize.width : 100;
                popupProperties.height = savedSize.height > 100 ? savedSize.height : 100;
            }

            if (popupProperties.showFrame) {
                self.frameUrl = applicationPath + conduit.coreLibs.config.getApplicationDirName() + "/al/ui/gf/gf.html";
                if (!(savedSize && savedSize.height)) {// saved data came from the abs so we don't need to add frame
                    //adding extra width and height for the frame.
                    popupProperties.width += FRAME_WIDTH;
                    popupProperties.height += popupProperties.resizable ? FRAME_HEIGHT + 18 : FRAME_HEIGHT;
                }
            }
            //this popup has no frame and its not a menu,
            //so it gets a simple frame with border.

            //TODO: handle search history popup. 
            else if (popupProperties.isLightFrame) {
                //will pass this data as a query string
                //in the doOpen function.
                var data = {
                    width: popupProperties.width,
                    height: popupProperties.height,
                    resizable: popupProperties.resizable,
                    popupId: appData.popupId,
                    viewId: appData.viewId
                };
                //set this property to be accessible in the popup instance.
                //this is the path for the lightFrame.
                self.frameUrl = applicationPath +
					conduit.coreLibs.config.getApplicationDirName() +
						"/al/ui/gf/lgf.html#data=" + encodeURI(JSON.stringify(data));

                //adding extra width and height for the frame.
                popupProperties.width += LIGHT_FRAME_WIDTH;
                popupProperties.height += (popupProperties.resizable ? LIGHT_FRAME_HEIGHT + 18 : LIGHT_FRAME_HEIGHT);
            }
            else if (popupProperties.closeOnExternalClick == undefined) {
                popupProperties.closeOnExternalClick = true;
            }



            callback();
        }

        /**
        @function
        @description:  // Get the position of the popup relative to the button on the strip,
        if the requested position isn't absolute to the screen:
        @param: {function} callback  
        */
        function getPositionAndOpen(callback) {
            logger.logDebug('getPositionAndOpen:', { className: "popups", functionName: "getPositionAndOpen" });
            callback = fixExceedingPopup;
            if (popupProperties.saveLocation && popupManager.getSavedPosition(popupProperties.url)) {
                popupProperties.position = popupManager.getSavedPosition(popupProperties.url);
                callback();
                return;
            }
            if (!popupProperties.position || !popupProperties.position.isAbsolute && appData.viewId) {
                logger.logDebug(' getPositionAndOpen: before sendSysReq:', { className: "popups", functionName: "getPositionAndOpen" });
                messages.sendSysReq("applicationLayer.appManager.view_" + appData.viewId, "applicationLayer.UI.popup", JSON.stringify({ method: "getAppPosition", data: appData.appId }), function (data) {
                    logger.logDebug(' getPositionAndOpen: in sendSysReq callback!', { className: "popups", functionName: "getPositionAndOpen" });
                    var position = JSON.parse(data),
						offsetTop = parseInt(position.bottom),
						popupHeight = parseInt(popupProperties.height),
						scrHeight = parseInt(screen.height),
						originalToolBarTop = position.top;

                    position.top = parseInt(position.bottom); // Not a bug, for real.
                    if (parseInt(scrHeight) < parseInt(offsetTop + popupHeight)) {
                        var popupDelta = parseInt((offsetTop + popupHeight + 45)) - parseInt(scrHeight);
                        position.top = parseInt(position.top) - parseInt(popupDelta);
                    }


                    if (popupProperties.position) {

                        //position is in the format of --> alignment(T,L)
                        if (popupProperties.position.isAlignment) {

                            if (popupProperties.position.top === "T") {
                                //popup should be on top of the app.
                                position.top = originalToolBarTop;
                            }

                            if (popupProperties.position.left === "R") {
                                var popupWidth = popupProperties.width,
									appWidth = position.appWidth;

                                position.left -= (popupWidth - appWidth);
                            }

                        }
                        else if (popupProperties.position.isCenter) {
                            position.left = (position.screenWidth - popupProperties.width) * 0.5;
                            position.top = (position.screenHeight - popupProperties.height) * 0.5;
                        }
                        else {

                            if (popupProperties.position.left)
                                position.left += parseInt(popupProperties.position.left);

                            //for rtl
                            if (popupProperties.position.right)
                                position.right += parseInt(popupProperties.position.right);


                            if (popupProperties.position.top)
                                position.top += parseInt(popupProperties.position.top);

                        }
                    }

                    popupProperties.position = position;
                    callback();
                });
            }
            else {
                if (!popupProperties.position)
                    popupProperties.position = { left: 0, top: 0 };

                callback();
            }
        }

        /**
        @function
        @description: Checks whether the popup is partially or wholly outside the window.
        If yes, move it back inside.
        Note: Only checks horizontally.
        @param: {function} callback  
        */
        function fixExceedingPopup(callback) {
            logger.logDebug('fixExceedingPopup:', { className: "popups", functionName: "fixExceedingPopup" });
            callback = setInfo;
            logger.logDebug('fixExceedingPopup: before fix - popupProperties.position.left : ' + popupProperties.position.left, { className: "popups", functionName: "fixExceedingPopup" });
            getScreenWidth(function (screenWidth) {
                var popupOffset = parseInt(popupProperties.position.left) + parseInt(popupProperties.width - screenWidth) + 30;
                if (popupOffset > 0)
                    popupProperties.position.left -= popupOffset;

                logger.logDebug('fixExceedingPopup: after fix - popupProperties.position.left : ' + popupProperties.position.left, { className: "popups", functionName: "fixExceedingPopup" });
                callback();
            });


        }

        /**
        @function
        @description: 
        @param: {function} callback  
        */
        function setInfo(callback) {
            logger.logDebug('setInfo:', { className: "popups", functionName: "setInfo" });
            var aliasesManager = conduit.coreLibs.aliasesManager;

            callback = doOpen;
            logger.logDebug('setInfo: before aliasManager - popupProperties.url : ' + popupProperties.url, { className: "popups", functionName: "setInfo" });
            popupProperties.url = aliasesManager.replaceAliases(popupProperties.url, null, aliasesManager.constants.TYPE_MODES.NAVIGATION_URL);
            logger.logDebug('setInfo: after aliasManager - popupProperties.url : ' + popupProperties.url, { className: "popups", functionName: "setInfo" });
            conduit.webappApi.platform.getInfo.call({ appId: appData.appId }, function (infoData) {
                appData.info = JSON.parse(infoData);
                conduit.webappApi.tabs.getSelected.call(appData, function (tabInfo) {
                    appData.info.tabInfo = JSON.parse(tabInfo);
                    callback();
                });
            });
        }

        /**
        @function
        @description: this is the actuall function that takes the final data and use 
        the abstractionLayer to open the popup.
        */
        function doOpen() {
            logger.logDebug('doOpen:', { className: "popups", functionName: "doOpen" });
            popupProperties.position.top = Math.max(popupProperties.position.top, 0);
            logger.logDebug("doOpen: after fix - popupProperties.position : top : " + popupProperties.position.top + ", left : " + popupProperties.position.left, { className: "popups", functionName: "doOpen" });
            if (popupProperties.showFrame) {
                appData.isShowMininmizedIcon = popupProperties.isShowMininmizedIcon;
                appData.closebutton = popupProperties.closebutton;
            }

            if (popupProperties.extraData) {
                appData = $.extend(true, appData, { info: { onBeforeLoadData: popupProperties.extraData} });
            }

            appData.resizable = popupProperties.resizable;
            var extraDataObject = {
                isRTL: false,
                hScroll: popupProperties.allowScrollInFrame ? !!popupProperties.allowScrollInFrame.hScroll : false,
                vScroll: popupProperties.allowScrollInFrame ? !!popupProperties.allowScrollInFrame.vScroll : false,
                isInnerTransparent: !!popupProperties.transparent,
                contextData: JSON.stringify(appData),
                isDialog: false,
                isMenu: false,
                isFocused: typeof (popupProperties.isFocused) !== 'undefined' ? popupProperties.isFocused : true,
                isChild: typeof (popupProperties.isChild) !== 'undefined' ? popupProperties.isChild : false,
                draggable: popupProperties.showFrame ? true : false,
                resizable: typeof (popupProperties.resizable) !== 'undefined' ? popupProperties.resizable : false,
                menuItemId: popupProperties.itemappid !== 'undefined' ? popupProperties.itemappid : null,
                tabId: popupProperties.tabId
            };

            var frameObj;
            //all popups should have frames, could be the regular frame or the lightFrame. 
            if (popupProperties.showFrame || (popupProperties.isLightFrame)) {
                frameObj = {
                    //this is the relevant frame url, that was set erlier. 
                    url: self.frameUrl,
                    rightWidth: 1,
                    leftWidth: 1,
                    isTransparent: !!popupProperties.transparent
                }
                //the regular frame gets high value because of its header section.
                frameObj.topHeight = popupProperties.showFrame ? 31 : 1;
                if (popupProperties.resizable) {
                    frameObj.bottomHeight = 17;
                } else {
                    frameObj.bottomHeight = 1;
                }
            }
            //menus, no frame.
            else {
                frameObj = null;
            }

            //if toolbar is rtl we need to to recalculate the popup position.
            if (popupManager.getToolbarDir() == 'rtl') {
                extraDataObject.isRTL = true;
                //make the changes only if we have a position.right value.
                if (popupProperties.position.right && !popupProperties.position.isAbsolute) {
                    popupProperties.position.left = popupProperties.position.right - popupProperties.width;

                    if (parseInt(popupProperties.position.left) < 10) {
                        popupProperties.position.left = 10;
                    }
                }
            }
            logger.logDebug('doOpen: before absPopup.open!', { className: "popups", functionName: "doOpen" });
            absPopup.open(
					Math.round(popupProperties.position.top),
					Math.round(popupProperties.position.left),
					Math.round(popupProperties.width),
					Math.round(popupProperties.height),
					popupProperties.url,
					frameObj,
					!!popupProperties.isModal,
				    !!popupProperties.closeOnExternalClick,
					!!popupProperties.hideOnExternalClick, // hideOnExternalClick 
                    true, // isWebApp , true
                    extraDataObject,
					function (popupData) {
					    logger.logDebug('doOpen: in absPopup.open callback!', { className: "popups", functionName: "doOpen" });
					    //we add to this popup instance an absId property which is the new 
					    //generated popupId from the abstractionLayer. 
					    self.absId = popupData.result;
					    self.properties = popupProperties;
					    // these are use seperatlly...
					    self.height = popupProperties.height;
					    self.width = popupProperties.width;
					    onOpen(self);

					    if (popupProperties.loggerData) {
					        var popupOpen = +new Date();

					        var loggerData = popupProperties.loggerData;
					        loggerData.popupOpen = popupOpen;

					        //if (!loggerData.isApi) {
					        loggerData.endTime = popupOpen;
					        //}
					        loggerData.popupInit = "";
					        loggerData.isWithState = true;
					        conduit.coreLibs.logger.performanceLog(loggerData);
					    }
					}
				);
            /* }*/
        }

        //starting point.
        withUrl();
    });

    //shared function for all popups instances.
    conduit.applicationLayer.UI.popup.prototype = {
        /**
        @function
        @description: tell abstractionLayer to start dragging this popup.
        */
        dragStart: function () {
            absPopup.dragStart(this.absId, function (response) {
            });
        },

        /**
        @function
        @description: tell abstractionLayer to stop dragging this popup.
        */
        dragStop: function () {
            absPopup.dragStop(this.absId, function (response) {
            });
        },
        /**
        @function
        @description: 
        */
        resizeStart: function () {
            absPopup.resizeStart(this.absId, function (response) {
            });
        },

        /**
        @function
        @description: 
        */
        resizeStop: function () {
            absPopup.resizeStop(this.absId, function (response) {
            });
        },
        /**
        @function
        @description: close the popup.        
        */
        close: function (callback) {
            absPopup.close(this.absId, callback || function () { });
        },
        setFocus: function () {
            absPopup.setFocus(this.absId, function () { });
        },
        /**
        @function
        @description: handle the minimize and show actions.and notify the appManager.model
        which update the view.
        */
        toggle: function () {
            var self = this;
            var actionType;
            //each time the toggle function is being executed
            //we check its 'isMinimized' property.
            if (this.isMinimized) {
                //the popup is minimized and we about to show it.
                //but first we need to check if the current position is different from 
                //last position.
                popupManager.getPosition(self);
                actionType = "GADGET_MAXIMIZE";
                //item menu case.
                if (self.properties.itemappid && self.properties.menuId) {
                    var obj = {
                        appId: self.appId,
                        itemAppId: self.properties.itemappid,
                        menuId: self.properties.menuId,
                        viewId: self.viewId,
                        isMinimized: false
                    }
                    messages.postTopicMsg("updateMenuItem", "", JSON.stringify(obj));
                }
            }
            else {
                //the popup is currently displayed and we about to hide it.
                absPopup.hide(this.absId, function () {

                    //item menu case.
                    if (self.properties.itemappid && self.properties.menuId) {
                        var obj = {
                            appId: self.appId,
                            itemAppId: self.properties.itemappid,
                            menuId: self.properties.menuId,
                            isMinimized: true
                        }
                        messages.postTopicMsg("updateMenuItem", "", JSON.stringify(obj));
                    }
                    //we update the isMinimized property for the next time
                    //the toggle function will be executed. 
                    self.isMinimized = true;
                    var objData = {
                        data: {
                            isMinimized: self.isMinimized
                        },
                        appId: self.appId,
                        method: 'onMinimizeToggleIcon'
                    };

                    messages.sendSysReq("applicationLayer.appManager.model.webAppApiRequest",
                     JSON.stringify({ appId: self.appId }), JSON.stringify(objData), function () { });
                });
                actionType = "GADGET_MINIMIZE";
            }
            conduit.applicationLayer.appCore.appManager.model.sendUsage({
                type: "sendToolbarComponentUsage",
                appId: self.appId,
                actionType: actionType
            });
        },
        /**
        @function
        @description: resize the the parent window of the popup(browser/div).
        the popup itself has a listener for the resize event. it knows to calculate itself and change its width and height.
        @param: {object} newDimensions - json object, holds the new width and height.
        @param: {function} callback .
        */
        resize: function (newDimensions, callback) {
            conduit.coreLibs.logger.logDebug('resize:', { className: "popups", functionName: "resize" });
            var self = this;
            var position = absPopup.getPosition(this.absId).result;
            conduit.coreLibs.logger.logDebug('resize: update popup position from curent to abstraction: current: ' + JSON.stringify(this.properties.position) + 'abstraction: ' + JSON.stringify(position), { className: "popups", functionName: "resize" });
            this.properties.position.top = position.top || this.properties.position.top;
            var offset = position.left - this.properties.position.left;
            this.properties.position.left = position.left;
            this.properties.position.right = position.left + this.width;

            // this code  mess up all menus on rtl toolbars.
            // temp solution, only apply it on ltr toolbars.
            if (popupManager.getToolbarDir() !== 'rtl') {
                this.properties.position.right += offset;
            }

            var finalWidth = newDimensions.width || -1, // -1 means keep size
				finalHeight = newDimensions.height || -1;

            if (self.properties.showFrame) {
                //adding extra width and height for the frame.
                if (finalWidth != -1) finalWidth += FRAME_WIDTH;
                if (finalHeight != -1) {
                    finalHeight += (self.properties.resizable ? FRAME_HEIGHT + 18 : FRAME_HEIGHT);
                }
            }
            else if (self.properties.isLightFrame) {
                if (finalWidth != -1) finalWidth += LIGHT_FRAME_WIDTH;
                if (finalHeight != -1) finalHeight += (self.properties.resizable ? LIGHT_FRAME_HEIGHT + 18 : LIGHT_FRAME_HEIGHT);
            }
            //update popup instance properties with new value.
            if (finalWidth != -1) self.width = finalWidth;
            if (finalHeight != -1) self.height = finalHeight;

            //check direction and position the popup accordingly.
            if (popupManager.getToolbarDir() == 'rtl') {
                var left = self.properties.position.right - finalWidth;

                if (parseInt(left) < 10) {
                    left = 10;
                }
                conduit.coreLibs.logger.logDebug('resize abstraction callback /  toolbar is RTL', { className: "popups", functionName: "resize" });
                if (finalWidth != -1) {
                    absPopup.changePosition(self.absId, self.properties.position.top, left, function () { });
                }

            }
            conduit.coreLibs.logger.logDebug('resize: call abstraction popup resize', { className: "popups", functionName: "resize" });
            absPopup.resize(self.absId, finalWidth, finalHeight, function (response) {
                conduit.coreLibs.logger.logDebug('resize: abstraction call back response', { className: "popups", functionName: "resize" });
                if (popupManager.getToolbarDir() == 'rtl') {
                    callback(response);
                }
                else {
                    fixExceedingPopup(self.properties.position, { width: finalWidth }, function (fixedLeft) {
                        if (self.properties.position.left !== fixedLeft) {
                            conduit.coreLibs.logger.logDebug('resize abstraction callback / left offset need to be modified', { className: "popups", functionName: "resize" });
                            absPopup.changePosition(self.absId, self.properties.position.top, fixedLeft, function () { });
                            if (typeof (response) === "string")
                                response = JSON.parse(response);

                            conduit.coreLibs.logger.logDebug('resize abstraction callback : position fixed pass the offset value in callback', { className: "popups", functionName: "resize" });
                            response.offset = fixedLeft - self.properties.position.left;
                            response = JSON.stringify(response);
                        }
                        callback(response);
                    });
                }
            });
            //});
        },
        autoResize: function (innerDimensions) {
            var self = this;
            // make sure popup is not too large - and keep nice margine to avoid cut looking popups
            innerDimensions.height = parseInt(innerDimensions.height) + AUTO_RESIZE_MARGINS;
            innerDimensions.width = parseInt(innerDimensions.width) + AUTO_RESIZE_MARGINS;
            if (innerDimensions.height > screen.availHeight * 0.75) { innerDimensions.height = screen.availHeight * 0.75 }
            if (innerDimensions.width > screen.availWidth * 0.75) { innerDimensions.width = screen.availWidth * 0.75 }

            function partialResize(counter, currentHeight, currentWidth) {
                var currentCounter = counter;
                var heightGap = innerDimensions.height - currentHeight > 0 ? innerDimensions.height - currentHeight : 0,
					widthGap = innerDimensions.width - currentWidth > 0 ? innerDimensions.width - currentWidth : 0;
                tempHeight = currentHeight + Math.floor(heightGap / 4),
					tempWidth = currentWidth + Math.floor(widthGap / 4);
                self.resize({ height: tempHeight, width: tempWidth }, function (data) {
                    setTimeout(function () {
                        if (++currentCounter < 10) {
                            partialResize(currentCounter, tempHeight, tempWidth)
                        }
                        else {
                            innerDimensions.height = innerDimensions.height > currentHeight ? innerDimensions.height : currentHeight;
                            innerDimensions.width = innerDimensions.width > currentWidth ? innerDimensions.width : currentWidth;
                            self.resize(innerDimensions, function () { });
                        }
                    }, 40)// dealy 
                });

            }
            partialResize(0, parseInt(self.height) - (self.properties.resizable ? FRAME_HEIGHT + 18 : FRAME_HEIGHT), parseInt(self.width) - FRAME_WIDTH);
        },

        setTitle: function (title) {
            var self = this;
            var currentTitle = title;
            if (this.properties.showFrame) {
                var interval = setInterval(function () { // frame html listener is not always ready, we send request until we get an answer. this is better then intredocing handshake mechanisim for each popup
                    conduit.abstractionlayer.commons.messages.sendSysReq("gadgetFrame_" + self.id, "webappApi", currentTitle, function () {
                        clearInterval(interval);
                    });
                }, 100);
                setTimeout(function () { clearInterval(interval) }, 500);
            }
        },
        /**
        @function
        @description: 
        */
        onClose: function (callback, popupId) {
            if (!callback)
                return;

            popupManager.addCloseCallback(popupId || this.absId, callback);
        },
        onNavigate: function (callback, popupId) {
            if (!callback)
                return;
            var absPopupId;

            if (popupId) {
                var popup = popupManager.getPopup({ popupId: popupId, viewId: this.viewId });
                absPopupId = popup.absId
            }
            else {
                absPopupId = this.absId;
            }

            return absPopup.onBeforeNavigate.addListener(absPopupId, function (url) {
                callback(url);
            });
        },
        show: function (popupId, callback) {
            if (popupId) {
                var popup = popupManager.getPopup({ popupId: popupId, viewId: this.viewId });
                popupId = popup.absId;
            }
            else {
                popupId = this.absId
            }
            absPopup.show(popupId, "", callback);
        },
        toAbsolute: function (appData, popupProperties, callback) {
            if (!appData) { return; }
            if (!popupProperties) { return; }
            if (typeof (callback) != 'function') { return; }
            popupProperties.position = popupProperties.position || { left: 0, top: 0 };
            if (!popupProperties.position.isAbsolute && appData.viewId) {
                messages.sendSysReq("applicationLayer.appManager.view_" + appData.viewId
                                    , "applicationLayer.UI.popup"
                                    , JSON.stringify({ method: "getAppPosition", data: appData.appId })
                                    , function (data) {
                                        var position = JSON.parse(data),
                                        offsetTop = parseInt(position.bottom),
                                        popupHeight = parseInt(popupProperties.height),
                                        scrHeight = parseInt(screen.height);

                                        position.top = parseInt(position.bottom); // Not a bug, for real.
                                        if (parseInt(scrHeight) < parseInt(offsetTop + popupHeight)) {
                                            var popupDelta = parseInt((offsetTop + popupHeight + 45)) - parseInt(scrHeight);
                                            position.top = parseInt(position.top) - parseInt(popupDelta);
                                        }
                                        if (popupProperties.position.left)
                                            position.left += parseInt(popupProperties.position.left);

                                        //for rtl
                                        if (popupProperties.position.right)
                                            position.right += parseInt(popupProperties.position.right);

                                        if (popupProperties.position.top)
                                            position.top += parseInt(popupProperties.position.top);

                                        popupProperties.position = position;
                                        callback(popupProperties.position);
                                    });
            } else {
                callback(popupProperties.position);
            }
        },
        hide: function (popupId, callback) {
            if (popupId) {
                var popup = popupManager.getPopup({ popupId: popupId, viewId: this.viewId });
                popupId = popup.absId;
            }
            else {
                popupId = this.absId
            }
            absPopup.hide(popupId, callback);
        },
        changePosition: function (popupId, top, left, callback) {
            if (popupId) {
                var popup = popupManager.getPopup({ popupId: popupId, viewId: this.viewId });
                popupId = popup.absId;
            }
            else {
                popupId = this.absId
            }
            absPopup.changePosition(popupId, top, left, callback);
        }
        , onHide: function (callback, popupId) {
            if (!callback)
                return;

            popupManager.addOnHideCallback(popupId || this.absId, callback);
        },
        onShow: function (callback, popupId) {
            if (!callback)
                return;
            var absPopupId;

            if (popupId) {
                var popup = popupManager.getPopup({ popupId: popupId, viewId: this.viewId });
                absPopupId = popup.absId
            }
            else {
                absPopupId = this.absId;
            }

            return absPopup.onPopupShown.addListener(function (absid) {
                if (absid === absPopupId) {
                    callback(absid);
                }
            });
        } /*
        onShow: function (callback, popupId) {
            if (!callback)
                return;

            popupManager.addOnShowCallback(popupId || this.absId, callback);
        }*/
    };

})();


    


