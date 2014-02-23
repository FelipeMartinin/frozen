setTimeout(function () {
    if (document.body && document.location.href !== "about:blank") {
        function getContext(id) {
            var context = {};
            if (navigator.userAgent.indexOf("Firefox") != -1 && typeof (abstractionlayer) !== "undefined") {
                var windowName = abstractionlayer.commons.appMethods.getTopParentWindowName(this).result;
                context = JSON.parse(abstractionlayer.commons.appMethods.getContext(windowName || id).result);
            } else if (typeof (window.chrome) !== "undefined") {
                try {
                    context = JSON.parse(id); // for embedded apps
                    return context;
                }
                catch (e) { }
                var windowName = id;
                var prePopup = 'popup_inner_iframe';
                var keyName = 'gadgetsContextHash_';

                if (windowName && typeof windowName == 'string' && windowName.indexOf(prePopup) == 0) {
                    windowName = windowName.substr(prePopup.length);
                }

                var existingValue = localStorage.getItem(keyName + windowName);
                if (existingValue) {
                    context = JSON.parse(existingValue);
                }
            } 
            return context;
        }

        var messaging = (function () {
            var absMessaging = (navigator.userAgent.indexOf("Firefox") != -1 && typeof (abstractionlayer) !== "undefined") ? abstractionlayer.commons.messages : typeof (window.chrome) !== "undefined" ? (function () {
                var callbackMap = {};
                var topics = {};
                var connection = null;
                var extensionId = window.name.split("___")[1];

                var generateCallbackId = function () {
                    var callbackId = (+new Date()) + "_" + Math.ceil(Math.random() * 5000);

                    return (callbackMap[callbackId]) ? generateCallbackId() : callbackId;
                };

                function sendToCommunicator(message) {
                    if (connection) {
                        message.connectionName = connection.name;
                        connection.postMessage(message);
                    }
                }

                connection = chrome.extension.connect(extensionId, {
                    name: "connection_popup_injected_code_" + conduit.currentApp.appId + "_" + Math.random() * 5000
                });

                var sendSysReq = function (strDestLogicalName, strDestSenderName, data, callback) {
                    var message = {
                        userData: {
                            senderName: strDestSenderName,
                            data: data
                        },
                        sendercbId: null,
                        sender: {
                            tab: {
                                id: contextData.info.tabInfo.tabId
                            }
                        },
                        type: "sendRequest",
                        logicalName: strDestLogicalName,
                        origin: "main"
                    };

                    sendToCommunicator(message);
                };
                return {
                    sendSysReq: sendSysReq
                };
            })() :

           (navigator.userAgent.indexOf("Safari") != -1) ?

               abstractionlayer.commons.messages

            :

            (function () {
                var actionsEnum = {
                    sendSysReq: 1

                };

                function sendSysReq(strDestLogicalName, strSenderName, data, callbackFunc) {
                    strSenderName = strSenderName || "1";
                    data = data || "1";
                    callbackFunc = callbackFunc || (function (res) { });
                    window.external.invokePlatformActionSync(8, actionsEnum.sendSysReq, window, "onMessageRecieved", 0, strDestLogicalName, strSenderName, data);
                }
                return {
                    sendSysReq: sendSysReq
                };
            })();
            return absMessaging;
        } ());

        var contextData = getContext(window.name);
        var appContext = JSON.stringify({
            appId: contextData.appId,
            context: contextData.context,
            viewId: contextData.viewId,
            popupId: contextData.popupId,
            menuId: contextData.menuId,
            isMenu: contextData.menuId
        });

        function sendToWebappApi(method, params) {
            var sender = appContext;
            var data = {
                method: method,
                params: params
            };
            try {
                messaging.sendSysReq("webappApi", sender, JSON.stringify(data), function () { });
            }
            catch (e) {
            }
        }


        if ((window.chrome && window.parent.parent == window.top) || window == window.top) {
            /*
            var originalDisplay = document.body.style.display;
            var height = 0;
            var width = 0;
            if (window.getComputedStyle) {
            height = window.getComputedStyle(document.body, null).height;
            document.body.style.display = "inline-block";
            width = window.getComputedStyle(document.body, null).width;
            }
            else {
            function getElemHeight(element, height, forceSum) {
            var currentHeight = (element.currentStyle.position != "absolute" ? element.clientHeight : 0);
            if (currentHeight && !forceSum) {
            return height + currentHeight;
            }
            else {
            var children = element.children;
            for (var i = 0; i < children.length; i++) {
            if (children[i].currentStyle.display == "block" || children[i].tagName.toUpperCase() == "OBJECT" || children[i].tagName.toUpperCase() == "TABLE") {
            height = getElemHeight(children[i], height, false);
            }
            }
            return height;
            }
            }
            height = getElemHeight(document.body, 0, true);

            function getElemWidth(element, width, forceSum) {
            var currentWidth = (element.currentStyle.position != "absolute" ? element.clientWidth : 0);
            if (currentWidth && !forceSum) {
            var elementWidth = parseInt(element.style.width);
            return Math.max(width, currentWidth, isNaN(elementWidth) ? 0 : elementWidth);
            }
            else {
            var children = element.children;
            for (var i = 0; i < children.length; i++) {
            width = getElemWidth(children[i], width, false);
            }
            return width;
            }
            }
            width = getElemWidth(document.body, 0, true)
            }
            
            sendToWebappApi("app.popup.handlePopupSize", [{
            height: height,
            width: width
            }]);
            
            document.body.style.display = originalDisplay;
            */
            sendToWebappApi("app.popup.handlePopupTitle", [document.title]);
        }
    }
}, 500);