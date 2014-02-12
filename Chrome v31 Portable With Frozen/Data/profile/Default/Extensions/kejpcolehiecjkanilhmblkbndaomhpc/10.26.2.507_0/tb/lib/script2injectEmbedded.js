(function () {
    if (document.body && document.location.href !== "about:blank") {
        function getContext(id) {
            var context = {};
            if (navigator.userAgent.indexOf("Firefox") != -1 && typeof (abstractionlayer) !== "undefined") {
                var windowName = abstractionlayer.commons.appMethods.getTopParentWindowName(this).result;
                context = JSON.parse(abstractionlayer.commons.appMethods.getContext(windowName || id).result);
            } else if (typeof (window.chrome) !== "undefined") {
                try {
                    context = JSON.parse(id); // for embedded apps
                    localStorage.setItem("appContext" + context.name, JSON.stringify(context));
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
                try{
                context = JSON.parse(localStorage.getItem("appContext" + window.name));
                }catch(e){}
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
                    name: "connection_embedded_injected_code_" + Math.random() * 5000
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


           (navigator.userAgent.indexOf("Safari") != -1) ? (function () {
               var sendSysReq = function (strDestLogicalName, strDestSenderName, data, callback) {
                   safari.extension.globalPage.contentWindow.conduit.abstractionlayer.commons.messages.sendSysReq(strDestLogicalName, strDestSenderName, data, callback);
               };
               return {
                   sendSysReq: sendSysReq
               };
           })() :

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

        function handleClick(e) {
            if (e.button != 2) {
                sendToWebappApi("app.handleClickEvent", [{ button: e.button, left: e.screenX, top: e.screenY}]);
            }
        }
        function handleContextMenu(e) {
            var nodeName = e.target ? e.target.nodeName : e.srcElement && e.srcElement.nodeName;
            if (nodeName != "INPUT") {
                if (window.chrome) {
                    //in chrome case the x and y that are sent are reletive to the app
                    sendToWebappApi("app.handleClickEvent", [{ button: 2, left: e.x, top: e.y, appId: contextData.appId, viewId: contextData.viewId}]);
                } else {
                    sendToWebappApi("app.handleClickEvent", [{ button: 2, left: e.screenX, top: e.screenY}]);
                }
                return false;
            }
        }

        function initInjectedFunctions() {
            if (document.body.attachEvent) {
                document.body.attachEvent("onmousedown", handleClick);
            }
            else {
                document.body.onmousedown = handleClick;
            }

            function isTransparent() {
                var color;
                if (window.getComputedStyle) {
                    color = window.getComputedStyle(document.body, null).getPropertyValue("background-color");
                }
                else {
                    color = document.body.currentStyle.backgroundColor;
                }
                return color && (color == "rgb(212, 208, 200)" ||
                                 color == "rgb(255, 255, 255)" ||
                                 color == "rgb(240, 240, 240)" ||
                                 color == "buttonFaceRGB" || /* take system buttonFace color*/
                                 color == "rgb(-1, -1, -1)" ||
                                 color.toLowerCase() == "#ffffff" ||
                                 color.toLowerCase() == "buttonface" ||
                                 document.body.style.backgroundColor.toLowerCase() == "threedface");
            }

            if (isTransparent()) {
                document.body.style.backgroundColor = "transparent";
            }

            if (navigator.userAgent.indexOf("Firefox") != -1 && !window.isHeightChangedByUser) {
                document.body.style.marginTop = (28 - contextData.info.originalHeight) / 2 + "px";
            }
            else if ((window.chrome || window.safari) && !window.isHeightChangedByUser) {
                document.body.style.marginTop = (26 - contextData.info.originalHeight) / 2 + "px";
            }

            var embArr = document.getElementsByTagName("embed");
            for (var i = 0; i < embArr.length; i++) {
                embArr[i].wmod = "tansparent";
            }
            var objArr = document.getElementsByTagName("object");
            for (var i = 0; i < objArr.length; i++) {
                objArr[i].wmod = "tansparent";
            }
        }
        /* originalHeight is to seperate browser comp apps from new web apps */
        if (document.body.attachEvent) {
            document.body.attachEvent("oncontextmenu", handleContextMenu);
        }
        else {
            document.body.oncontextmenu = handleContextMenu;
        }

        if (contextData.info && contextData.info.originalHeight) {
            initInjectedFunctions();
        }
    }
})();