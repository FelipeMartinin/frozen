//
// Copyright © Conduit Ltd. All rights reserved.
// This software is subject to the Conduit license (http://hosting.conduit.com/EULA/).
//
// This code and information are provided 'AS IS' without warranties of any kind, either expressed or implied, including, without limitation, // to the implied warranties of merchantability and/or fitness for a particular purpose.
//
//

var JSON;JSON||(JSON={});
(function(){function k(a){return a<10?"0"+a:a}function o(a){p.lastIndex=0;return p.test(a)?'"'+a.replace(p,function(a){var c=r[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function l(a,j){var c,d,h,m,g=e,f,b=j[a];b&&typeof b==="object"&&typeof b.toJSON==="function"&&(b=b.toJSON(a));typeof i==="function"&&(b=i.call(j,a,b));switch(typeof b){case "string":return o(b);case "number":return isFinite(b)?String(b):"null";case "boolean":case "null":return String(b);case "object":if(!b)return"null";
e+=n;f=[];if(Object.prototype.toString.apply(b)==="[object Array]"){m=b.length;for(c=0;c<m;c+=1)f[c]=l(c,b)||"null";h=f.length===0?"[]":e?"[\n"+e+f.join(",\n"+e)+"\n"+g+"]":"["+f.join(",")+"]";e=g;return h}if(i&&typeof i==="object"){m=i.length;for(c=0;c<m;c+=1)typeof i[c]==="string"&&(d=i[c],(h=l(d,b))&&f.push(o(d)+(e?": ":":")+h))}else for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(h=l(d,b))&&f.push(o(d)+(e?": ":":")+h);h=f.length===0?"{}":e?"{\n"+e+f.join(",\n"+e)+"\n"+g+"}":"{"+f.join(",")+
"}";e=g;return h}}if(typeof Date.prototype.toJSON!=="function")Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+k(this.getUTCMonth()+1)+"-"+k(this.getUTCDate())+"T"+k(this.getUTCHours())+":"+k(this.getUTCMinutes())+":"+k(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()};var q=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
p=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,e,n,r={"\u0008":"\\b","\t":"\\t","\n":"\\n","\u000c":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},i;if(typeof JSON.stringify!=="function")JSON.stringify=function(a,j,c){var d;n=e="";if(typeof c==="number")for(d=0;d<c;d+=1)n+=" ";else typeof c==="string"&&(n=c);if((i=j)&&typeof j!=="function"&&(typeof j!=="object"||typeof j.length!=="number"))throw Error("JSON.stringify");return l("",
{"":a})};if(typeof JSON.parse!=="function")JSON.parse=function(a,e){function c(a,d){var g,f,b=a[d];if(b&&typeof b==="object")for(g in b)Object.prototype.hasOwnProperty.call(b,g)&&(f=c(b,g),f!==void 0?b[g]=f:delete b[g]);return e.call(a,d,b)}var d,a=String(a);q.lastIndex=0;q.test(a)&&(a=a.replace(q,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return d=eval("("+a+")"),typeof e==="function"?c({"":d},""):d;else throw new SyntaxError("JSON.parse");}})();
﻿var conduit;

(function () {
    var webappApiInterface = {
        "app": {
            "getSettingsData": "",
            "getCurrentContext": "",
            "embedded": {
                "executeScriptInFrame": "params",
                "createNestedContext": "params",
                "setOnBeforeLoadData": "data",
                "setEmbedded": "info",
                "collapse": "",
                "expand": "",
                "getState": ""
            },
            "popup": {
                "getInfo": "popupId",
                "set": "url, options",
                "open": "url, options",
                "close": "popupId",
                "resize": "popupId, dimensions",
                "onClosed": {
                    "addListener": "popupId, eventHandler"
                },
                "onNavigate": {
                    "addListener": "popupId, eventHandler"
                },
                "onShow": {
                    "addListener": "popupId, eventHandler"
                },
                "onHide": {
                    "addListener": "popupId, eventHandler"
                },
                "show": "popupId",
                "hide": "popupId",
                "setFocus": "popupId",
                "changePosition": "popupId,top,left"
            },
            "icon": {
                "setBadgeBackgroundColor": "color",
                "setBadgeText": "text",
                "setIcon": "details",
                "setIconText": "text",
                "setTooltip": "text",
                "onClicked": {
                    "addListener": "eventHandler"
                }
            },
            "menu": {
                "onShow": {
                    "addListener": "eventHandler"
                },
                "getPosition": "",
                "resize": "dimensions",
                "create": "data",
                "close": "",
                "open": "data, options",
                "getData": "menuId",
                "onCommand": {
                    "addListener": "menuId, eventHandler"
                },
                "onClose": {
                    "addListener": "menuId, eventHandler"
                }
            }
        },
        "idle": {
            "onStateChanged": {
                "addListener": "threshold, eventHandler"
            }
        },
        "logging": {
            "usage": {
                "log": "actionType, additionalUsageInfo"
            },
            "logError": "message,loggerInfo",
            "logDebug": "message,loggerInfo",
            "logInfo": "message,loggerInfo"
        },
        "messaging": {
            "sendRequest": "destination, logicalName, data, eventHandler",
            "postTopicMessage": "topic, data",
            "onRequest": {
                "addListener": "logicalName, eventHandler"
            },
            "onExternalRequest": {
                "addListener": "logicalName, eventHandler"
            },
            "onTopicMessage": {
                "addListener": "topic, eventHandler"
            }
        },
        "network": {
            "httpRequest": "e",
            "sockets": {
                "connect": "options",
                "send": "connectionToken, data, dataIdentity",
                "close": "connectionToken",
                "onMessage": {
                    "addListener": "connectionToken, eventHandler"
                },
                "onConnectionEstablished": {
                    "addListener": "eventHandler"
                },
                "onConnectionClosed": {
                    "addListener": "connectionToken, eventHandler"
                }
            }
        },
        "platform": {
            "isToolbarVisible": "",
            "getToolbarBornDate": "",
            "getInstallDate": "",
            "onChangeViewState": {
                "addListener": "eventHandler"
            },
            "getToolbarVersion": "",
            "getLocation": "",
            "executeExternalProgram": "registeredName, parameters",
            "getAppsList": "",
            "onToolbarReady": {
                "addListener": "eventHandler"
            },
            "getInfo": "",
            "isAppInstalled": "appId",
            "refresh": "forceRefresh",
            "refreshApp": "appId",
            "setSkin": "settings",
            "search": {
                "getTerm": "",
                "setSearchEngineValue": "value",
                "onExecuted": {
                    "addListener": "eventHandler"
                },
                "onTextChanged": {
                    "addListener": "eventHandler"
                }
            },
            "getScreenHeight": "",
            "getScreenWidth": "",
            "openApp": "guid"
        },
        "tabs": {
            "create": "e",
            "executeScript": "tabId, details",
            "get": "tabId",
            "getTabId": "",
            "getAllInWindow": "windowId",
            "getSelected": "windowId",
            "insertCss": "tabId, cssData",
            "remove": "tabId",
            "sendRequest": "tabId, topic, data",
            "onRequest": {
                "addListener": "topic,eventHandler"
            },
            "update": "tabId, updateProperties",
            "updateWithPost": "tabId, updateProperties, postParams",
            "onBeforeNavigate": {
                "addListener": "eventHandler"
            },
            "onCreated": {
                "addListener": "eventHandler"
            },
            "onDocumentComplete": {
                "addListener": "eventHandler"
            },
            "onRemoved": {
                "addListener": "eventHandler"
            },
            "onSelectionChanged": {
                "addListener": "eventHandler"
            },
            "onNavigateComplete": {
                "addListener": "eventHandler"
            },
            "onNavigateError": {
                "addListener": "eventHandler"
            }
        },
        "windows": {
            "create": "e",
            "get": "windowId",
            "getAll": "options",
            "getLastFocused": "",
            "remove": "windowId",
            "update": "windowId, updateProperties",
            "onCreated": {
                "addListener": "eventHandler"
            },
            "onFocusChanged": {
                "addListener": "eventHandler"
            },
            "onRemoved": {
                "addListener": "eventHandler"
            }
        },
        "notifications": {
            "showNotification": "notificationData",
            "register": "data"
        },
        "advanced": {
            "services": {
                "addService": {
                    "addListener": "serviceData, eventHandler"
                },
                "invokeService": "serviceName",
                "updateService": "serviceName, updateData",
                "searchAPI": {
                    "getData": "",
                    "onChange": {
                        "addListener": "eventHandler"
                    }
                }
            },
            "getGlobalUserId": "",
            "formatUrl": "url",
            "getUserId": "",
            "getSearchUserMode": "",
            "getMachineId": "",
            "getToolbarGeneralData": "",
            "hideApp": "appId",
            "showApp": "appId",
            "showToolbar": "",
            "hideToolbar": "",
            "isExtensionInstalled": "extenstionId",
            "sendNativeMessage": "data",
            "sendNativeMessageFront": "data",
            "lab": {
                "getNavHistory": "requestObj",
                "getBookmarkList": "requestObj",
                "getBookmark": "requestObj"
            },
            "messaging": {
                "postTopicMessage": "topic, data",
                "onTopicMessage": {
                    "addListener": "topic, eventHandler"
                },
                "getSyncStorage": "",
                "sendRequest": "logicalName, data, eventHandler",
                "onRequest": {
                    "addListener": "logicalName, eventHandler"
                },
                "sendRequestToModel": "method, data"
            },
            "localization": {
                "getKey": "keyName",
                "getLocale": ""
            },
            "notifications": {
                "onShow": {
                    "addListener": "eventHandler"
                },
                "onRegister": {
                    "addListener": "eventHandler"
                }
            },
            "studio": {
                "apps": {
                    "load": "path",
                    "reload": "appId",
                    "disable": "appId",
                    "enable": "appId",
                    "remove": "appId",
                    "getList": ""
                }
            },
            "managed": {
                "apps": {
                    "add": "guid, info",
                    "remove": "guid",
                    "triggerEvent": "guid, info"
                }
            },
            "app": {
                "add": "guid, appName"
            },
            "branching": {
                "replaceActiveCT": "activeCTID"
            },
            "radio": {
             "addListener": "eventHandler",
			  "removeListener":"callbackId"
         }
        },
        "storage": {
            "app": {
                "items": {
                    "exists": "key",
                    "get": "key",
                    "set": "key, value",
                    "remove": "key"
                },
                "keys": {
                    "exists": "key",
                    "get": "key",
                    "set": "key, value",
                    "remove": "key"
                }
            },
            "global": {
                "items": {
                    "get": "key",
                    "set": "key, value",
                    "remove": "key"
                },
                "keys": {
                    "get": "key",
                    "set": "key, value",
                    "remove": "key"
                }
            }
        },
        "encryption": {
            "encrypt": "data",
            "decrypt": "data",
            "hash": "data",
            "decodeCharset": "text,inCharset"
        },
        "browser": {
            "getNavHistory": "queryObj",
            "getBookmarks": "",
            "getExtensions": ""
        }
    },
     webAppApiFront = {
         "platform.getToolbarVersion": true,
         "storage.app.keys.exists": true,
         "storage.app.keys.get": true,
         "app.embedded.createNestedContext": true,
         "app.embedded.executeScriptInFrame": true,
         "app.embedded.setEmbedded": true,
         "app.embedded.collapse": true,
         "app.embedded.expand": true,
         "tabs.getSelected": true,
         "tabs.getTabId": true,
         "advanced.sendNativeMessageFront": true
     },
     msgSender;
    var noContextQueue = [];
    function getContext(id) {
        try {
            var context;
            if (typeof (abstractionlayer) !== 'undefined') {
                var appMethods = abstractionlayer.commons.appMethods;
                var windowName = appMethods.getTopParentWindowName(this).result;
                context = JSON.parse(appMethods.getContext(id).result || appMethods.getContext(windowName).result);
            }
            else if (typeof (window.chrome) !== "undefined") {
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
                context = JSON.parse(existingValue);
            }
            else if (typeof (window.safari) !== "undefined") {
                var backHash = top.conduit.abstractionlayer.commons.appMethods;
                context = JSON.parse(backHash.getContext(id).result);
            }
            else {//IE
                //TODO make sure you get the context the same way you do in FF (for the nested task...)
                context = JSON.parse(window.external.invokePlatformActionSync(23, 0, id));
                if (context.result)
                    context = JSON.parse(context.result);
            }
            if (context === undefined || context.appId === undefined) {
                //Failed in browserAppApi.getContext(). context is undefined. find a way to log this!
            }
            return context;
        }
        catch (e) {
            //Failed in browserAppApi.getContext(). find a way to log this!
        }
    }
    function getAppData() {
        conduit.currentApp = getContext(window.name);
        if (conduit.currentApp)
            msgSender = JSON.stringify({ appId: conduit.currentApp.appId,
                context: conduit.currentApp.context,
                viewId: conduit.currentApp.viewId,
                popupId: conduit.currentApp.popupId,
                menuId: conduit.currentApp.menuId,
                isMenu: conduit.currentApp.menuId,
                apiPermissions: conduit.currentApp.apiPermissions || (conduit.currentApp.info && conduit.currentApp.info.apiPermissions),
                frameId: window.name
            });
    }
    function hasContext() {
        return !!conduit.currentApp;
    }

    conduit = convertToFunctions(webappApiInterface);
    getAppData();
    if (!conduit.currentApp) {
        window.onload = function () {
            getAppData();
            if (conduit.currentApp && noContextQueue.length) {
                for (var i = 0, count = noContextQueue.length; i < count; i++) {
                    messaging.sendRequest.apply(this, noContextQueue[i]);
                }
            }

            noContextQueue = [];
            if (conduit.currentApp && conduit.currentApp.menuId) {
                // this is relevant only for menus, to replace context when shown
                conduit.app.menu.onShow.addListener(getAppData);
            };
        }
    }
    conduit.app.getData = function () {
        if (conduit.currentApp && conduit.currentApp.info) {
            var appData = { system: { viewId: conduit.currentApp.viewId }, user: conduit.currentApp.info.onBeforeLoadData };
            return appData;
        }
        else {
            return null;
        }
    }

    var localMessaging = (function () {
        var callbackMap = {};

        var generateCallbackId = function () {
            var callbackId = (+new Date()) + "_" + Math.ceil(Math.random() * 5000);
            return (callbackMap[callbackId]) ? generateCallbackId() : callbackId;
        };

        var messageResponseHandler = function (event) {
            if (typeof event.data === "string") {
                var data = JSON.parse(event.data);
                if (data && data.origin && data.origin === "webappApiFront") {
                    if (callbackMap[data.logicalName]) {
                        callbackMap[data.logicalName].callback(data.data, event.source);
                        if (!callbackMap[data.logicalName].persist) {
                            delete callbackMap[data.logicalName];
                        }
                    }
                }
            }
        };
        if (window.addEventListener) {
            window.addEventListener("message", messageResponseHandler, false);
        }
        else {
            window.attachEvent('onmessage', messageResponseHandler);
        }

        var onLocalRequest = function (logicalName, persist, callback) {
            callbackMap[logicalName] = { callback: callback, persist: persist };
        };

        var sendLocalRequest = function (logicalName, data, target) {
            var message = {
                logicalName: logicalName,
                data: data,
                origin: window.name
            };

            if (target) {
                target.postMessage(JSON.stringify(message), "*");
            }
            else if (window.chrome) {
                var currentWindow = window;
                while (currentWindow.parent.parent !== window.top) {
                    currentWindow = currentWindow.parent;
                }
                currentWindow.postMessage(JSON.stringify(message), "*");
            }
            else if (window.top) {
                window.top.postMessage(JSON.stringify(message), "*");
            }
        };
        return {
            onLocalRequest: { addListener: onLocalRequest },
            sendLocalRequest: sendLocalRequest,
            generateCallbackId: generateCallbackId
        };

    })();

    var messaging = (function () {
        var hasListener = false,
			listeners = {},
            webAppApiReady,
            webappApiQueue = [],
			absMessaging = typeof (abstractionlayer) !== "undefined" ? abstractionlayer.commons.messages :
                typeof (window.chrome) !== "undefined" ?
                    (function () {
                        var callbackMap = {};
                        var topics = {};
                        var connection = null;
                        var extensionId = chrome.i18n.getMessage("@@extension_id");

                        var generateCallbackId = function () {
                            var callbackId = (+new Date()) + "_" + Math.ceil(Math.random() * 5000);

                            return (callbackMap[callbackId]) ? generateCallbackId() : callbackId;
                        };

                        function sendToCommunicator(message) {
                            try {
                                if (conduit.currentApp.context == 'embedded') {
                                    var currentWindow = window;
                                    while (currentWindow.parent.parent !== window.top) {
                                        currentWindow = currentWindow.parent;
                                    }
                                    currentWindow.postMessage(message, "*");
                                } else if (conduit.currentApp.context == 'popup') {
                                    if (connection) {
                                        message.connectionName = connection.name;
                                        connection.postMessage(message);
                                    }
                                } else {
                                    window.top.postMessage(message, "*");
                                }
                                return { result: true, status: 0, description: "" };
                            }
                            catch (e) {
                                return { result: "", status: 100, description: e.message };
                            }

                        }

                        if (conduit.currentApp.context === "popup") {
                            connection = chrome.extension.connect(extensionId, { name: "connection_popup_" + conduit.currentApp.appId + "_" + Math.random() * 5000 });
                            connection.onMessage.addListener(function (message) {
                                if (message && message.type && handlers[message.type]) {
                                    handlers[message.type]({ data: message });
                                }
                            });
                        }


                        var handlers = {
                            // execute callback, if sender cbId exist we will pass function to user.
                            "sendRequest": function (event) {
                                var callbackParams;

                                if (event.data && event.data.cbId && event.data.cbId instanceof Array) {
                                    for (var item in event.data.cbId) {
                                        if (callbackMap[event.data.cbId[item]]) {
                                            callbackParams = [event.data.data, event.data.senderName];

                                            callbackMap[event.data.cbId[item]].callback.apply(null, callbackParams);

                                            if (callbackMap[event.data.cbId[item]].deleteOnCall) {
                                                delete callbackMap[event.data.cbId[item]];
                                            }
                                        }
                                    }
                                } else {
                                    if (event.data && event.data.sendercbId) {
                                        var cbId = event.data.sendercbId;
                                        var origin = event.data.origin;

                                        function listenerCallback(result) {
                                            var userData = { 'data': result }; //incase sendRequest from BS to FS the callback didn't have user data and origin - it only affects popups since it has a direct connection to BS 
                                            var message = {
                                                data: result,
                                                logicalName: cbId, //sender callback id
                                                type: "sendRequest",
                                                origin: origin, //sender origin
                                                userData: userData
                                            };

                                            return sendToCommunicator(message);
                                        }
                                        callbackParams = [event.data.userData.data, event.data.userData.senderName, listenerCallback];
                                    }
                                    else {
                                        callbackParams = [event.data.userData.data];
                                    }

                                    if (callbackMap[event.data.cbId]) {
                                        callbackMap[event.data.cbId].callback.apply(this, callbackParams);

                                        if (callbackMap[event.data.cbId].deleteOnCall) {
                                            delete callbackMap[event.data.cbId];
                                        }
                                    }
                                }
                            },
                            "postTopic": function (event) {
                                if (topics[event.data.topicName]) {
                                    for (var item in topics[event.data.topicName]) {
                                        topics[event.data.topicName][item].callback(event.data.data, event.data.senderName);
                                    }
                                }
                            }

                        };

                        var messageResponseHandler = function (messageEvent) {
                            if (typeof (messageEvent.data) !== "string") {
                                if (messageEvent.data && messageEvent.data.origin && messageEvent.data.origin === "main") {
                                    if (messageEvent.data.type && handlers[messageEvent.data.type]) {
                                        handlers[messageEvent.data.type](messageEvent);
                                    }
                                }
                            }
                        };

                        window.addEventListener("message", messageResponseHandler);

                        var onSysReqAddListener = function (strMyLogicalName, callback) {
                            var message = {
                                type: "addListener",
                                logicalName: strMyLogicalName,
                                cbId: generateCallbackId()
                            };
                            callbackMap[message.cbId] = { callback: callback, deleteOnCall: false };
                            return sendToCommunicator(message);
                        };


                        var onTopicMsgAddListener = function (strTopicName, callback) {
                            var cbId = generateCallbackId();

                            if (conduit.currentApp.context === 'popup') {
                                if (!topics[strTopicName]) {
                                    topics[strTopicName] = {};
                                }


                                topics[strTopicName][cbId] = { callback: callback, deleteOnCall: false };
                            } else {
                                callbackMap[cbId] = { callback: callback, deleteOnCall: false };
                            }

                            var message = {
                                topicName: strTopicName,
                                cbId: cbId,
                                type: "addTopic"
                            };

                            return sendToCommunicator(message);
                        };

                        var sendSysReq = function (strDestLogicalName, strDestSenderName, data, callback) {
                            var cbId = generateCallbackId();

                            var message = (conduit.currentApp.context == 'popup') ?
							{
							    userData: {
							        senderName: strDestSenderName,
							        data: data
							    },
							    sendercbId: cbId,
							    sender: { tab: { id: conduit.currentApp.info.tabInfo.tabId} },
							    type: "sendRequest",
							    logicalName: strDestLogicalName,
							    origin: "main"
							}
							:
                            {
                                type: "sendRequest",
                                logicalName: strDestLogicalName,
                                senderName: strDestSenderName,
                                data: data,
                                cbId: null
                            };


                            if (typeof (callback) === "function") {
                                message.cbId = cbId;
                                var deleteOnCall = (/addListener/.test(data)) ? false : true;
                                callbackMap[message.cbId] = { callback: callback, deleteOnCall: deleteOnCall };
                            }

                            return sendToCommunicator(message);
                        };

                        var postTopicMsg = function (strTopicName, senderLogicalName, data) {
                            var message = {
                                topicName: strTopicName,
                                senderName: senderLogicalName,
                                data: data,
                                type: "postTopic",
                                origin: "main"

                            };

                            return sendToCommunicator(message);
                        };

                        //msg sent to abstraction backstage - nofity on click event from webapps
                        var popupGuidFormat = new RegExp("^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}");
                        var popupIdFromWindowName = popupGuidFormat.test(window.name) && window.name.split('___')[0];
                        this.onmousedown = function () {
                            sendSysReq("popups.events", "BAAPI", { type: "closeOnExternalClick", windowName: window.name });
                            sendSysReq("externalClickOtherToolbars", "BAAPI", { type: "closeOnExternalClick", windowName: window.name });
                            if (popupIdFromWindowName) {
                                sendSysReq("popups.events", "BAAPI", { type: "setPopupFocus", popupId: popupIdFromWindowName });
                            }
                        }

                        var handleContextMenu = function (e) {
                            var appContext = getContext(window.name);
                            var nodeName = e.target ? e.target.nodeName : e.srcElement && e.srcElement.nodeName;
                            if (nodeName != "INPUT") {
                                absMessaging.sendSysReq("webappApi", JSON.stringify({ sender: "BAAPI" }), JSON.stringify({ method: "app.handleClickEvent", params: [{ button: 2, left: e.x, top: e.y, appId: appContext.appId, viewId: appContext.viewId}] }), function () { });
                                return false;
                            }
                        }
                        if (document.body) {
                            /*run the default oncontext menu in order to open the custom toolbar context menu*/
                            document.body.oncontextmenu = handleContextMenu;
                        }

                        /* 
                        I am commenting out this code because it is bugged, and we don't know what it is actually supposed to do. this should be removed after we are sure nothing was broken
                         
                        //for menus - the mouse down is too late - msg sent to abstraction backstage - nofity on click event from webapps
                        if(document && document.location && document.location.href && document.location.href.indexOf('al/ui/menu/popup.html')){ // this is bugged, shoud be !== -1
                        sendSysReq("popups.events", "BAAPI", { type: "closeOnExternalClick", windowName: window.name });
                        }*/

                        return {
                            onSysReq: {
                                addListener: onSysReqAddListener
                            },
                            onTopicMsg: {
                                addListener: onTopicMsgAddListener
                            },
                            postTopicMsg: postTopicMsg,
                            sendSysReq: sendSysReq
                        };
                    })() :
    typeof (window.safari) !== "undefined" ?
       (function () {
           var getDefaultProxy = function () {
               var args = [].slice.call(arguments);
               var methodCall = { msgObj: null, msgMethod: null };
               var getMethodCallInfo = function () {
                   if (methodCall.msgObj && methodCall.msgMethod) {
                       return methodCall;
                   }
                   methodCall.msgObj = safari.extension.globalPage.contentWindow.conduit.abstractionlayer.commons.messages;
                   methodCall.msgMethod = null;
                   for (var i = 0; i < args.length; i++) {
                       if (methodCall.msgMethod) {
                           methodCall.msgObj = methodCall.msgMethod;
                           methodCall.msgMethod = methodCall.msgObj[args[i]];
                       } else {
                           methodCall.msgMethod = methodCall.msgObj[args[i]];
                       }
                   }
                   return methodCall;
               };
               return function () {
                   var methodCallInfo = getMethodCallInfo();
                   return methodCallInfo.msgMethod.apply(methodCallInfo.msgObj, arguments);
               };
           };

           return {
               onSysReq: {
                   addListener: getDefaultProxy('onSysReq', 'addListener')
               },
               sendSysReq: getDefaultProxy('sendSysReq'),
               isSysReqExists: getDefaultProxy('isSysReqExists'),
               postTopicMsg: getDefaultProxy('postTopicMsg'),
               onTopicMsg: {
                   addListener: getDefaultProxy('onTopicMsg', 'addListener')
               }
           };
       })()
                : (function () {
                    var actionsEnum = {
                        sendSysReq: 1,
                        postTopicMessage: 2,
                        subscribeTopicMsg: 3,
                        onSysReq: 0
                    },
					conduitMessagesProxy = (function () {
					    var messagesMapHashKeyToCallback = [],
							index = 0; // hashId

					    return {
					        /*
					        *	register a send message to map
					        *  callback - callback function
					        */
					        registerMessage: function (callbackFunc) {
					            if (typeof (callbackFunc) != 'function') {
					                return -1;
					            }
					            var hashKey = parseInt(Math.random() * 100000, 10);
					            messagesMapHashKeyToCallback[hashKey] = callbackFunc;
					            return hashKey;
					        },
					        getMessageCallbackById: function (hashId) {
					            return messagesMapHashKeyToCallback[hashId];
					        }
					    };
					})();

                    window.onMessageRecieved = function (hashId, data, sender, responseLogicalName) {
                        onMessageRecieved(hashId, data, sender, responseLogicalName);
                    };

                    /*
                    *Received when callbackFunc return to the sender
                    */
                    function onMessageRecieved(callbackHashId, data, sender, responseLogicalName) {
                        var callbackFunc = conduitMessagesProxy.getMessageCallbackById(callbackHashId);

                        var cbReturn = null;
                        if (responseLogicalName != '') {
                            cbReturn = function (dataToReturn) {
                                var dataToReturnStr = "";
                                if (dataToReturn) {
                                    dataToReturnStr = dataToReturn.toString();
                                }

                                window.external.invokePlatformActionSync(8, 6, null, null, null, responseLogicalName, dataToReturn);
                            }
                        }
                        if (callbackFunc != null) {
                            callbackFunc(data, sender, cbReturn);
                        }
                    }

                    /*
                    // Sends a point to point message 
                    // strDestLogicalName - the name of the receiver of the message
                    // strSenderName - the name of the sender of the message
                    // data - the data to send (can be null)
                    // callbackFunc - a callbackFunc function to invoke upon destination receiving of the message (can be null)
                    */
                    function sendSysReq(strDestLogicalName, strSenderName, data, callbackFunc, targetMethod, params) {
                        if ((targetMethod) && /\.addListener$/.test(targetMethod)) {
                            var context = conduit.currentApp.context ? conduit.currentApp.context : "backgroundPage";
                            var listenerInnerName = (conduit.currentApp.appId + "_" + context + "_" + targetMethod).replace(/\./g, "_");
                            absMessaging.onTopicMsg.addListener(listenerInnerName, callbackFunc);
                            data = JSON.parse(data);
                            data.listenerTopic = listenerInnerName;
                            data = JSON.stringify(data);
                        }

                        // insert the  the proxy map
                        strSenderName = strSenderName || "1";
                        data = data || "1";
                        callbackFunc = callbackFunc || (function (res) { });

                        var callbackHashId = conduitMessagesProxy.registerMessage(callbackFunc);

                        window.external.invokePlatformActionSync(8, actionsEnum.sendSysReq, window, "onMessageRecieved", callbackHashId, strDestLogicalName, strSenderName, data);
                    }

                    function postTopicMsg(topicName, sender, data) {
                        if (typeof (data) !== "string")
                            data = JSON.stringify(data);

                        if (!data)
                            data = "";

                        return JSON.parse(window.external.invokePlatformActionSync(8, actionsEnum.postTopicMessage, topicName, sender, data));
                    };

                    return {
                        sendSysReq: sendSysReq,
                        onSysReq: {
                            addListener: function (logicalName, callback) {
                                var callbackHashId = conduitMessagesProxy.registerMessage(callback);
                                return JSON.parse(window.external.invokePlatformActionSync(8, actionsEnum.onSysReq, window, "onMessageRecieved", callbackHashId, logicalName));
                            }
                        },
                        onTopicMsg: {
                            addListener: function (strTopicName, callbackFunc) {
                                var callbackHashId = conduitMessagesProxy.registerMessage(callbackFunc);
                                return JSON.parse(window.external.invokePlatformActionSync(8, 3, window, "onMessageRecieved", callbackHashId, strTopicName));
                            }
                        },
                        postTopicMsg: postTopicMsg
                    };
                })();

        function getAppDestinationName(appId, logicalName) {
            var externalAppId = logicalName ? logicalName.match(/^app:(.*)$/) : null;
            externalAppId = externalAppId ? externalAppId[1] : null;

            var dest = ["webapp", externalAppId || appId, externalAppId || !logicalName ? "backgroundPage" : logicalName];
            return dest.join("_");
        }

        function getTopicName(appId, topicName, targetMethod) {
            var finalTopicName = '';

            if (targetMethod === "advanced.messaging.postTopicMessage" || targetMethod === "advanced.messaging.onTopicMessage.addListener") {
                finalTopicName = "adv:" + topicName;
            } else if (topicName.indexOf("BC_API_") == 0) {
                finalTopicName = ":" + topicName.split("BC_API_")[1];
            } else {
                finalTopicName = appId + ":" + topicName;
            }
            return finalTopicName;
        }

        /**
        * reutrn true if the method is one that require only string as the parameter given by her
        * (currently only the storage's get function)
        */
        function testMethodForStringOnly(method) {
            return (/storage\.(app|global)\.(keys|items)\.get/.test(method));
        }

        // Wrap the callback, to handle general operations before the data is passed on to the actual data.
        // isStringOnly is for cases when the response is string and should stay a string
        function getWrappedCallback(callback, isStringOnly) {
            return function (response) {
                if (callback) {
                    var resp;
                    try {
                        resp = response && (typeof (response) == "string" && (/^\{.*\}$/.test(response) || /^\[.*\]$/.test(response))) ? JSON.parse(response) : response;
                    } catch (e) {
                        // we try to parse the responce anyway because it can be error message obj.
                        // if the parsing fails we set it to empty object and the response will be the original string
                        resp = {};
                    }
                    if (isStringOnly && resp && !resp.errorMessage) {
                        callback(response);
                    }
                    else {
                        callback(resp);
                    }
                }
            }
        }

        function onWebAppApiReady() {
            webAppApiReady = true;
            if (webappApiQueue.length) {
                for (var i = 0, count = webappApiQueue.length; i < count; i++) {
                    Function.prototype.apply.call(absMessaging.sendSysReq, this, webappApiQueue[i]);
                }
            }
            webappApiQueue = [];
        }

        absMessaging.onTopicMsg.addListener("onWebAppApiReady", onWebAppApiReady);

        absMessaging.sendSysReq("webappApi", JSON.stringify({ sender: "BAAPI" }), JSON.stringify({ method: "commons.isReady", params: [] }), function (result) {
            result = JSON.parse(result);
            if (!result.status)
                onWebAppApiReady();
        });



        return {
            // Sends the request to the webapp API:
            sendRequest: function (targetMethod, params, onSuccess, onError) {
                var paramCallback;
                var isFront = false;

                // Check if function is in WebAppApiFront
                if (params && params.length > 0 && params[params.length - 1] && (params[params.length - 1].isFront === true)) {
                    if (conduit.currentApp.context == "embedded") {
                        isFront = true;
                    }
                    params.pop();
                }

                if (params && params.length > 0 && typeof (params[params.length - 1]) === "function") {
                    // we assume that only addListener functions contains a callback function (as the last parameter)
                    // we will call this callback function when a response from an addListener function in the webAppApi is returned.
                    paramCallback = params.pop();
                    // if it is not messaging, send all listeners to front
                    if (!/messaging/.test(targetMethod) && !/tabs\.onRequest/.test(targetMethod) && conduit.currentApp.context == "embedded") {
                        isFront = true;
                    }

                }

                var callback = function (response, sender, callback) {
                    if (response && typeof (response) === "object" && response.status) {
                        if (onError)
                            onError(response);
                    }
                    else {
                        // callback is defined when an OnRequest was fired directly (without the webAppApi)
                        // response.type is cbSuccess when a listener was added successfuly using the webAppApi
                        // when sendRequest is sent (without the webAppApi) we have a paramCallback but the reponse does not contain a type.
                        if (paramCallback && (callback !== undefined || (response === undefined || response._callbackType === undefined))) {
                            if (typeof (response) === "object" && response._responseType) {
                                Function.prototype.apply.call(paramCallback, this, response.data);
                            }
                            else {
                                paramCallback(response, sender, callback);
                            }
                        }
                        else if (onSuccess) {
                            if (response._callbackType) {
                                response = undefined;
                            }
                            if (typeof (response) === "object" && response._responseType)
                                if (response._responseType === "array")
                                    onSuccess.apply(this, response.data);
                                else
                                    onSuccess.call(this, response.data);
                            else
                                onSuccess(response);
                        }
                    }
                };

                var dest, data, isStringOnly = false;

                /**
                * validate that the given parameter is string
                */
                function validateParamString(param, pName) {
                    if (typeof (param) !== 'string') {
                        return new TypeError("invalid " + pName + ". expected a string");
                    }
                }

                /**
                * validate that paramCallback is defined
                */
                function validateParamCallback() {
                    if (!paramCallback) {
                        return new TypeError("invalid event handler. expected a function");
                    }
                }

                /**
                * ensure that the params and context of messaging API is valid
                * topic - the topic parameter (should be string)
                * checkParamCallback - if true, validate the paramCallback is defined
                * (relevant for onRequest/onTopicMessage)
                * checkContext - if true, validate that the context is not embedded
                * (relevant only for onRequest)
                */
                function validateMessaging(topic, checkParamCallback, checkContext) {
                    if (typeof (topic) !== 'string') {
                        return new TypeError("invalid topic. expected a string");
                    }
                    if (checkParamCallback && !paramCallback) {
                        return new TypeError("invalid event handler. expected a function");
                    }
                    if (checkContext && (conduit.currentApp.context == "embedded")) {
                        return new TypeError("onRequest is forbidden from embedded");
                    }
                }

                // If messaging between the app parts is required, just do it (but make sure it's internal):
                if (/messaging\.sendRequest$/.test(targetMethod)) {
                    isStringOnly = true;
                    var res;
                    var exception = validateMessaging(params[1]);
                    if (exception) {
                        res = { 'errorMessage': exception.message, 'errorCode': 100 };
                    }
                    else {
                        if (targetMethod === "advanced.messaging.sendRequest") {
                            dest = "adv:" + params[0];
                            data = params[1];
                        }
                        else {
                            dest = getAppDestinationName(conduit.currentApp.appId, params[0]);
                            data = JSON.stringify({ method: params[1], data: params[2] });
                        }
                        res = { '_callbackType': "cbSuccess" };
                    }

                    callback(res);
                }
                else if (/messaging\.onRequest/.test(targetMethod) || /messaging\.onExternalRequest/.test(targetMethod)) {
                    var res;
                    var topicException = validateParamString(params[0], "topic");
                    var callbackException = validateParamCallback();
                    var contextException;
                    if (conduit.currentApp.context == "embedded") {
                        contextException = new TypeError("onRequest is forbidden from embedded");
                    }
                    var exception = topicException || callbackException; // || contextException; TODO blocks onRequest in embedded. update all apps using it
                    if (exception) {
                        res = { 'errorMessage': exception.message, 'errorCode': 100 };
                    }
                    else {
                        if (targetMethod === "advanced.messaging.onRequest.addListener") {
                            res = absMessaging.onSysReq.addListener("adv:" + params[0], callback);
                        }
                        else {
                            if (!hasListener) {
                                // Set a single-point listener for all requests send to this specific part of the web app:
                                res = absMessaging.onSysReq.addListener(
								    getAppDestinationName(conduit.currentApp.appId, conduit.currentApp.context),
								    function (data, sender, requestCallback) {
								        if (listeners) {
								            var dataObj = JSON.parse(data),
											    eventHandlers = listeners[dataObj.method];

								            if (!dataObj.data) {
								                dataObj.data = "";
								            }

								            if (eventHandlers) {
								                // sender here received as object or string representation of object
								                // the object contains a 'context' or 'appId' which is the real sender
								                // needed to be passed on
								                if (sender) {
								                    if (typeof (sender) === 'string') {
								                        sender = JSON.parse(sender);
								                    }
								                    if (sender.context) {
								                        sender = sender.context;
								                    }
								                    else {
								                        sender = sender.appId;
								                        if (sender === conduit.currentApp.appId) {
								                            sender = "background";
								                        }
								                    }
								                }
								                for (var i = 0; i < eventHandlers.length; i++) {
								                    eventHandlers[i](dataObj.data, sender, function (data) {
								                        requestCallback(data);
								                    });
								                }
								            }
								        }
								    }
							    );

                                hasListener = true;
                            }

                            var logicalName = params[0],
							    listener = listeners[logicalName];
                            if (!listener)
                                listener = listeners[logicalName] = [];

                            listener.push(callback); // Add the event handler
                        }
                        if (res) {
                            res._callbackType = 'cbSuccess';
                        }
                        else {
                            res = { '_callbackType': "cbSuccess" };
                        }
                    }
                    callback(res);
                }
                else if (/tabs\.onRequest/.test(targetMethod)) {
                    var res = absMessaging.onTopicMsg.addListener((conduit.currentApp.ctid || conduit.currentApp.info.toolbar.id) + "_" + conduit.currentApp.appId + "_tabs_" + params, function (data) {
                        data = JSON.parse(data);
                        var cb = function (uresData) {
                            var contextData = { topic: data.topic, userData: uresData, tabId: data.tabId };
                            absMessaging.sendSysReq("webAppApiInjectManager", "BAAPI", JSON.stringify(contextData));
                        }
                        paramCallback(data.userData, data.tabId, cb);
                    });
                    res._callbackType = 'cbSuccess';
                    callback(res);
                }
                else if (/messaging\.postTopicMessage/.test(targetMethod)) {
                    var postData = params[1];
                    var res;
                    if (!postData)
                        postData = "";

                    var exception = validateParamString(params[0], "topic") || validateParamString(postData, "data");
                    if (exception) {
                        res = { 'errorMessage': exception.message, 'errorCode': 100 };
                    }
                    else {
                        res = absMessaging.postTopicMsg(
						    getTopicName(conduit.currentApp.appId, params[0], targetMethod),
						    JSON.stringify(conduit.currentApp),
						    postData);
                        res._callbackType = 'cbSuccess';
                    }
                    callback(res);
                }
                else if (/messaging\.onTopicMessage/.test(targetMethod)) {
                    isStringOnly = true;
                    var res;
                    var exception = validateParamString(params[0], "topic") || validateParamCallback();
                    if (exception) {
                        res = { 'errorMessage': exception.message, 'errorCode': 100 };
                    }
                    else {
                        res = absMessaging.onTopicMsg.addListener(
						    getTopicName(conduit.currentApp.appId, params[0], targetMethod),
						    getWrappedCallback(callback, isStringOnly)
					    );
                        res._callbackType = 'cbSuccess';
                    }
                    callback(res);
                }
                else {
                    isStringOnly = testMethodForStringOnly(targetMethod);
                    dest = isFront ? "webappApiFront" : "webappApi";
                    data = isFront ? { method: targetMethod, params: params, sender: msgSender, responseId: localMessaging.generateCallbackId() }
								   : JSON.stringify({ method: targetMethod, params: params });
                }

                if (dest) {
                    if (isFront) {
                        if (typeof (paramCallback) === 'function') {
                            localMessaging.onLocalRequest.addListener(data.responseId, true, getWrappedCallback(callback, isStringOnly));
                        }
                        else {
                            localMessaging.onLocalRequest.addListener(data.responseId, false, getWrappedCallback(callback, isStringOnly));
                        }
                        localMessaging.sendLocalRequest(dest, data);
                    }
                    else {
                        var sendParams = [dest, msgSender, data, getWrappedCallback(callback, isStringOnly), targetMethod, params];
                        if (webAppApiReady)
                            Function.prototype.apply.call(absMessaging.sendSysReq, this, sendParams);
                        else
                            webappApiQueue.push(sendParams);
                    }
                }
            }
        };
    })();

    if (conduit.currentApp && conduit.currentApp.menuId) {
        // this is relevant only for menus, to replace context when shown
        conduit.app.menu.onShow.addListener(getAppData);
    }

    function getFunction(path, params) {
        var isFront = webAppApiFront[path];
        var paramsLength = params ? params.replace(/\s/g, "").split(",").length : 0,
		    tempFunc = function () {
		        var requestParams = new Array(paramsLength + 2);
		        for (var i = 0; i < paramsLength + 2; i++) {
		            requestParams[i] = typeof (arguments[i]) !== 'undefined' ? arguments[i] : null;
		        }
		        var onError = requestParams.pop(),
				    onSuccess = requestParams.pop();
		        if (isFront) {
		            requestParams.push({ isFront: true });
		        }

		        if (/app.popup.open/.test(path) || /app.menu.open/.test(path)) {
		            var options = requestParams[1]
		            options.timeData = {
		                from: conduit.currentApp.appId,
		                action: path,
		                startTime: +new Date(),
		                isApi: true
		            }
		        }

		        if (hasContext()) {
		            messaging.sendRequest(path, requestParams, onSuccess, onError);
		        } else {
		            noContextQueue.push([path, requestParams, onSuccess, onError]);
		        }
		    }
        return tempFunc;
    }

    function convertToFunctions(root, path) {
        var obj = {};

        for (var pName in root) {
            var pPath = (path ? path + "." : "") + pName,
                pValue = root[pName];

            if (typeof (pValue) === "string") {
                obj[pName] = getFunction(pPath, pValue);
            }
            else if (typeof (pValue) === "object")
                obj[pName] = convertToFunctions(pValue, pPath);
        }

        return obj;
    }

    //******************* TODO Remove this code when this is fixed in the abstraction layer!!!********************
    /* See bug 17330. currently only in IE, all browser events such as F5, mouse in/out using ctrl+weel CTRL + <key> are triggered on the toolbar apps (like embedded).
    this affects the toolbar and corrupts it.
    this hack must be removed when this is fixed in a more generic way.
    */
    var disableKey = function (event) {
        if (!event) event = window.event;
        if (!event) return;
        var keyCode = event.keyCode ? event.keyCode : event.charCode;
        // 116 == F5
        if (keyCode == 116) {

            // Standard DOM (Mozilla):
            if (event.preventDefault) event.preventDefault();
            //IE (exclude Opera with !event.preventDefault):
            if (document.all && window.event && !event.preventDefault) {
                event.cancelBubble = true;
                event.returnValue = false;
                event.keyCode = 0;
            }
            return false;
        }
    };

    var disableWindowEvents = function () {

        if (document && document.attachEvent) {
            document.attachEvent('onkeydown', disableKey);
        }
    };

    disableWindowEvents();
    //**************************************************************************************************************
})();

