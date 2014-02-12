//Plug in code
var addEvent;
if (typeof addEvent != 'function') {
    addEvent = function (o, t, f, l) {
        var d = 'addEventListener', n = 'on' + t, rO = o, rT = t, rF = f, rL = l;
        if (o[d] && !l) {
            return o[d](t, f, false);
        }
        if (!o._evts) {
            o._evts = {};
        }
        if (!o._evts[t]) {
            o._evts[t] = o[n] ? { b: o[n]} : {};
            o[n] = new Function('e', 'var r=true,o=this,a=o._evts["' + t + '"],i;for(i in a){o._f=a[i];r=o._f(e||window.event)!=false&&r;o._f=null}return r');
            if (t != 'unload') {
                addEvent(window, 'unload', function () { removeEvent(rO, rT, rF, rL) });
            }
        }
        if (!f._i) {
            f._i = addEvent._i++;
            o._evts[t][f._i] = f;
        }
    };
    addEvent._i = 1;
    removeEvent = function (o, t, f, l) {
        var d = 'removeEventListener';
        if (o[d] && !l) {
            return o[d](t, f, false);
        }
        if (o._evts && o._evts[t] && f._i) {
            delete o._evts[t][f._i];
        }
    };
}

function cancelEvent(e, c) {
    e.returnValue = false;
    if (e.preventDefault) {
        e.preventDefault();
    }
    if (c) {
        e.cancelBubble = true;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }
}

function DragResize(myName, config) {
    var props = { myName: myName, enabled: true,
        handles: ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'], isElement: null, isHandle: null, element: null, handle: null, minWidth: 10, minHeight: 10, minLeft: 0, maxLeft: 9999, minTop: 0, maxTop: 9999, zIndex: 1, mouseX: 0, mouseY: 0, lastMouseX: 0, lastMouseY: 0, mOffX: 0, mOffY: 0, elmX: 0, elmY: 0, elmW: 0, elmH: 0, allowBlur: true, ondragfocus: null, ondragstart: null, ondragmove: null, ondragend: null, ondragblur: null
    };
    for (var p in props) {
        if (p) {
            this[p] = (typeof config[p] == 'undefined') ? props[p] : config[p];
        }
    }
}

DragResize.prototype.apply = function (node) {
    var obj = this;
    addEvent(node, 'mousedown', function (e) { obj.mouseDown(e); });
    addEvent(node, 'mousemove', function (e) { obj.mouseMove(e); });
    addEvent(node, 'mouseup', function (e) { obj.mouseUp(e); });
};

DragResize.prototype.select = function (newElement) {
    with (this) {
        if (!document.getElementById || !enabled) {
            return;
        }
        if (newElement && (newElement != element) && enabled) {
            element = newElement; 

            if (this.resizeHandleSet) this.resizeHandleSet(element, true);
            elmX = parseInt(element.style.left);
            elmY = parseInt(element.style.top);
            elmW = element.clientWidth; //offsetWidth
            elmH = element.clientHeight; //offsetHeight

            if (ondragfocus) this.ondragfocus()
        }
    }
};

DragResize.prototype.deselect = function (delHandles) {
    with (this) {
        if (!document.getElementById || !enabled) return;
        if (element && element.style) {
            elmX = parseInt(element.style.left);
            elmY = parseInt(element.style.top);
            elmW = element.clientWidth; //offsetWidth
            elmH = element.clientHeight; //offsetHeight
        }
        if (delHandles) {
            if (ondragblur) this.ondragblur();
            if (this.resizeHandleSet) this.resizeHandleSet(element, false);
            element = null
        }
        handle = null;
        mOffX = 0;
        mOffY = 0;
    }
};

DragResize.prototype.mouseDown = function (e) {
    with (this) {
        if (!document.getElementById || !enabled) return true;
        var elm = e.target || e.srcElement, newElement = null, newHandle = null, hRE = new RegExp(myName + '-([trmbl]{2})', '');
        while (elm) {
            if (elm.className) {
                if (!newHandle && (hRE.test(elm.className) || isHandle(elm))) newHandle = elm;
                if (isElement(elm)) { newElement = elm; break }
            } elm = elm.parentNode
        }
        if (element && (element != newElement) && allowBlur) deselect(true);
        if (newElement && (!element || (newElement == element))) {
            if (newHandle) cancelEvent(e);
            select(newElement, newHandle); handle = newHandle;
            if (handle && ondragstart) this.ondragstart(hRE.test(handle.className))
        }
    }
};

DragResize.prototype.mouseMove = function (e) {
    with (this) {
        if (!document.getElementById || !enabled) return true;
        mouseX = e.pageX || e.clientX + document.documentElement.scrollLeft;
        mouseY = e.pageY || e.clientY + document.documentElement.scrollTop;
        var diffX = mouseX - lastMouseX + mOffX;
        var diffY = mouseY - lastMouseY + mOffY; mOffX = mOffY = 0; lastMouseX = mouseX; lastMouseY = mouseY;
        if (!handle) return true;
        var isResize = false;
        if (this.resizeHandleDrag && this.resizeHandleDrag(diffX, diffY)) {
            isResize = true
        } else {
            var dX = diffX, dY = diffY;
            if (elmX + dX < minLeft) mOffX = (dX - (diffX = minLeft - elmX));
            else if (elmX + elmW + dX > maxLeft) mOffX = (dX - (diffX = maxLeft - elmX - elmW));
            if (elmY + dY < minTop) mOffY = (dY - (diffY = minTop - elmY));
            else if (elmY + elmH + dY > maxTop) mOffY = (dY - (diffY = maxTop - elmY - elmH)); elmX += diffX; elmY += diffY
        }
        with (element.style) { left = elmX + 'px'; width = elmW + 'px'; top = elmY < 0 ? 0 : elmY + 'px'; height = elmH + 'px' }
        if (window.opera && document.documentElement) {
            var oDF = document.getElementById('op-drag-fix');
            if (!oDF) {
                var oDF = document.createElement('input');
                oDF.id = 'op-drag-fix'; oDF.style.display = 'none';
                document.body.appendChild(oDF)
            } oDF.focus()
        }
        if (ondragmove) this.ondragmove(isResize); cancelEvent(e)
    }
};

DragResize.prototype.mouseUp = function (e) {
    with (this) {
        if (!document.getElementById || !enabled) return;
        var hRE = new RegExp(myName + '-([trmbl]{2})', '');
        if (handle && ondragend) this.ondragend(hRE.test(handle.className));
        deselect(false)
    }
};

DragResize.prototype.resizeHandleSet = function (elm, show) {
    with (this) {
        if (!elm._handle_tr) {
            for (var h = 0; h < handles.length; h++) {
                var hDiv = document.createElement('div');
                hDiv.className = myName + ' ' + myName + '-' + handles[h]; elm['_handle_' + handles[h]] = elm.appendChild(hDiv)
            }
        }
        for (var h = 0; h < handles.length; h++) { elm['_handle_' + handles[h]].style.visibility = show ? 'inherit' : 'hidden' }
    }
};

DragResize.prototype.resizeHandleDrag = function (diffX, diffY) {
    with (this) {
        var hClass = handle && handle.className && handle.className.match(new RegExp(myName + '-([tmblr]{2})')) ? RegExp.$1 : '';
        var dY = diffY, dX = diffX, processed = false;
        if (hClass.indexOf('t') >= 0) {
            rs = 1;
            if (elmH - dY < minHeight) mOffY = (dY - (diffY = elmH - minHeight));
            else if (elmY + dY < minTop) mOffY = (dY - (diffY = minTop - elmY)); elmY += diffY; elmH -= diffY; processed = true
        }
        if (hClass.indexOf('b') >= 0) {
            rs = 1;
            if (elmH + dY < minHeight) mOffY = (dY - (diffY = minHeight - elmH));
            else if (elmY + elmH + dY > maxTop) mOffY = (dY - (diffY = maxTop - elmY - elmH)); elmH += diffY; processed = true
        }
        if (hClass.indexOf('l') >= 0) {
            rs = 1; if (elmW - dX < minWidth) mOffX = (dX - (diffX = elmW - minWidth));
            else if (elmX + dX < minLeft) mOffX = (dX - (diffX = minLeft - elmX)); elmX += diffX; elmW -= diffX; processed = true
        }
        if (hClass.indexOf('r') >= 0) {
            rs = 1;
            if (elmW + dX < minWidth) mOffX = (dX - (diffX = minWidth - elmW));
            else if (elmX + elmW + dX > maxLeft) mOffX = (dX - (diffX = maxLeft - elmX - elmW));
            elmW += diffX;
            processed = true
        }
        return processed
    }
};

//check page scroll
var __dragresize_maxLeftScroll = 5;
var __dragresize_maxTopScroll = 6;

var __dragresize_hasVScroll = document.body ? document.body.scrollHeight > document.body.clientHeight : false;
if (__dragresize_hasVScroll) {
    __dragresize_maxLeftScroll = 22;
}

//End plug in code
var dragresize = new DragResize('dragresize',
    { minWidth: 50, minHeight: 50, minLeft: 0, minTop: 0, maxLeft: window.innerWidth - __dragresize_maxLeftScroll, maxTop: window.innerHeight - __dragresize_maxTopScroll });

dragresize.isElement = function (elm) {
    if (elm.className && elm.className.indexOf('drsElement') > -1) return true;
};

dragresize.isHandle = function (elm) {
    if (elm.className && elm.className.indexOf('drsMoveHandle') > -1) return true;
};

dragresize.apply(document);

if (window === window.top) {
    // Recalculating maxLeft and maxTop on window resize.
    var resizeHandler = function (event) {
        dragresize.maxLeft = window.innerWidth - __dragresize_maxLeftScroll;
        dragresize.maxTop = window.innerHeight - __dragresize_maxTopScroll;
    };


    if (window.addEventListener) {
        window.addEventListener("resize", resizeHandler, false);
    }
    else {
        window.attachEvent("onresize", resizeHandler);
    }
}
//****  Filename: queryString.js
//****  FilePath: main/js/utils
//****
//****  Author: Tomerr & Uriw
//****  Date: 14.02.11
//****  Class Name: QueryString
//****  Type: Singleton
//****  Description: Query String to JSON object.
//****  Inherits from: No one. <LINK HERE IF NEEDED>
//****
//****  Usage: Include the QueryString.js file in the combined files. If query string is: www.google.com?search="whatwhat"
//****  the queryString object will look like this: {"search" : "whatwhat"} and you'll be able to
//****  access a 'queryString.keys.search' object.
//****
//****  Copyright: Realcommerce & Conduit.
//****

conduit.register("abstractionlayer.utils.queryString", new function () {

    // JSDOC function: parsing Logic - Takes the querystring and splits the values into 'this.keyX'
    // Scope: Public (mainly for Jasmine testing).
    // Example: parseQueryString('http://www.google.com?a=b&c=d'); should create this.keys.a = b and this.keys.c = d.
    // Param.: classPtr - the querystring class to add the key value as objects to.
    // Param.: queryString - the string to parse.
    var keys = {}; // Json object which will contain query string keys and values.
    var parseQueryString = function (querystring) {
        

        if (isValidQueryString(querystring)) {
            
            querystring = querystring.substr(querystring.indexOf('#') + 1);

            // Splitting all key=value pairs between & after first '?'.
            if (querystring.length > 1) {
                var queryStringParams = querystring.split('&');
                for (var i = 0; i < queryStringParams.length; i++) {
                    var keyValue = queryStringParams[i].split('=');
                    keys[keyValue[0]] = keyValue[1];
                }
            }
        }
        else {
            //console.log("Querystring " + querystring + " didn't match querystring regexp...");
        }
    };

    var isValidQueryString = function (str) {
        var isValid = false;

        if (str && str != '') {
            var RegexUrl = /([^?=&]+)(=([^&]*))/;
            isValid = RegexUrl.test(str);
        }

        return isValid;
    };

    // Initializing query string parsing...
    parseQueryString(window.location.search);

    return {
        keys: keys
    };

});
//****  Filename: ToolbarApi.view.js
//****  FilePath: main/js/bcApiComm
//****
//****  Author: Uri Weiler
//****  Date: 18.10.11
//****  Class Name: conduit.abstractionlayer.commons.ToolbarApiView
//****  Type:
//****  Description: Injected into ToolbarAPI pages and handles communication with the publisher page using a hidden DIV.
//****
//****  Copyright: Realcommerce & Conduit.
//****

conduit.register("abstractionlayer.commons.ToolbarApiView", new function () {
    var myOwnCtid = null;
    if (window === window.top) {

        // Sends events to ToolbarAPI with event data inside the hidden div.
        var sendEventData = function (hiddenDiv, eventName, eventData, msgSender) {
            var customEvent = document.createEvent('Event');
            customEvent.initEvent(eventName, true, true);

            $.extend(eventData, msgSender);
            $.extend(eventData, { 'fromTPIView': true });

            if (eventData && eventData.data && (typeof eventData.data.result === 'string' && eventData.data.result.indexOf("_callbackType") !== -1) ||
            ((typeof eventData.data === "string") && eventData.data.indexOf('_callbackType') !== -1)) {
                //console.error("TPIVIEW Not sending addSysReqListener response: ", JSON.stringify(eventData), " to hidden div");
            }
            else {
                var eData = JSON.stringify(eventData);
                if (eData) {
                    hiddenDiv.innerText = eData;
                    //console.error("TPIView: Sending BCAPI data through hidden div: ", eventData, hiddenDiv, " at ", document.location.href);
                    hiddenDiv.dispatchEvent(customEvent);
                }
            }
        };

        // Adds a listener for events sent from ToolbarAPI. Event data is found inside hidden div.
        var addEventListener = function (hiddenDiv, eventName, responseEventName, runCallback) {
            hiddenDiv.addEventListener(eventName, function () {
                try {
                    if (hiddenDiv.innerText) {
                        var __sendMessage = JSON.parse(hiddenDiv.innerText);
                        //console.error("tpiView from tpi : ", __sendMessage);
                        runCallback(hiddenDiv, responseEventName, __sendMessage);
                    }
                }
                catch (generalException) {
                    //console.error("General Exception in TPIVIewComm: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                }
            });
        };
        var extensionId = chrome.i18n.getMessage("@@extension_id");
        var messaging = (function () {
            var connection = null;
            var callbackMap = {};
            var topics = {};

            var handlers = {
                "sendRequest": function (event) {
                    var callbackParams;

                    if (event.data && event.data.sendercbId) {
                        var cbId = event.data.sendercbId;

                        var listenerCallback = function (result) {
                            var message = {
                                data: result,
                                logicalName: cbId, //sender callback id
                                type: "sendRequest"
                            };

                            connection.postMessage(message);
                        };
                        callbackParams = [event.data.userData.data, event.data.userData.senderName, listenerCallback, event.data.userData.viewId || null];
                    }
                    else {
                        callbackParams = [event.data.userData.data, event.data.userData.senderName || null, function () { }, event.data.userData.viewId || null];
                    }

                    if (callbackMap[event.data.cbId]) {
                        callbackMap[event.data.cbId].callback.apply(this, callbackParams);

                        if (callbackMap[event.data.cbId].deleteOnCall) {
                            delete callbackMap[event.data.cbId];
                        }
                    }
                },
                "postTopic": function (event) {
                    if (topics[event.data.topicName]) {
                        for (var item in topics[event.data.topicName]) {
                            if (topics[event.data.topicName][item].callback) {
                                topics[event.data.topicName][item].callback.call(null, event.data);
                            }
                        }
                    }
                }
            };

            function onConnect_Handler(portConnection) {

                connection = portConnection;

                connection.onMessage.addListener(onMessageRecieved);

                //connection.onDisconnect.addListener(onDisconnect_Handler);
            }

            chrome.extension.onConnect.addListener(onConnect_Handler);

            if (!connection) {
                connection = chrome.extension.connect(extensionId, { name: "toolbarView.js_" + Math.random() * 5000 });
            }

            function onMessageRecieved(message) {
                if (message.type && handlers[message.type]) {
                    message = { data: message };
                    handlers[message.data.type](message);
                }
            }

            connection.onMessage.addListener(onMessageRecieved);

            var generateCallbackId = function () {
                var callbackId = (+new Date()) + "_" + Math.ceil(Math.random() * 5000);

                return (callbackMap[callbackId]) ? generateCallbackId() : callbackId;
            };

            return {
                onTopicMsg: {
                    addListener: function (topicName, callback) {
                        var cbId = generateCallbackId();

                        if (!topics[topicName]) {
                            topics[topicName] = {};
                        }

                        topics[topicName][cbId] = { callback: callback, deleteOnCall: false };

                        var message = {
                            connectionName: connection.name,
                            topicName: topicName,
                            cbId: cbId,
                            type: "addTopic"
                        };

                        connection.postMessage(message);
                    }
                },
                onSysReq: {
                    addListener: function (strMyLogicalName, callback) {
                        var message = {
                            connectionName: connection.name,
                            type: "addListener",
                            logicalName: strMyLogicalName,
                            cbId: generateCallbackId()
                        };

                        callbackMap[message.cbId] = { callback: callback, deleteOnCall: false };


                        connection.postMessage(message);
                    }
                },
                postTopicMsg: function (strTopicName, senderLogicalName, data) {
                    var message = {
                        connectionName: connection.name,
                        topicName: strTopicName,
                        senderName: senderLogicalName,
                        data: data,
                        type: "postTopic"
                    };

                    connection.postMessage(message);
                },
                sendSysReq: function (strDestLogicalName, strDestSenderName, data, callback) {
                    var cbId = generateCallbackId();
                    var message = {
                        connectionName: connection.name,
                        type: "sendRequest",
                        sendercbId: cbId,
                        logicalName: strDestLogicalName,
                        userData: {
                            data: data,
                            senderName: strDestSenderName
                        },
                        cbId: null,
                        origin: "main"
                    };


                    if (typeof (callback) === "function") {
                        message.cbId = cbId;
                        callbackMap[message.cbId] = { callback: callback, deleteOnCall: true };
                    }

                    connection.postMessage(message);
                }
            };
        })();


        // Sends the request forward to the listener_collection (i.e., the extension bus broker).
        var sysReqCallback = function (hiddenDiv, responseEventName, __sendMessage) {
            var myCallback = function (response) {
                try {
                    ///console.log("BCAPI-VIEW Injection - Got callback response call from WebAppAPI for: " + JSON.stringify(__sendMessage), " with data: ", response);
                    var sender = "";

                    try {
                        sender = __sendMessage && __sendMessage.data && __sendMessage.data.data && !__sendMessage.data.topicName ?
                    JSON.parse(__sendMessage.data.data) : "";
                    } catch (e) {
                        sender = {};
                        sender.method = __sendMessage && __sendMessage.data && __sendMessage.data.data ? __sendMessage.data.data : ""; // If data couldn't be parsed but isn't undefined, e.g., a string message, not in JSON form.
                    }

                    sender = sender.method ? { msgSender: sender.method} : { msgSender: "nonExistent" };

                    if (sender.msgSender === "nonExistent") {
                        // Trying to get it from topicName instead.
                        sender = __sendMessage && __sendMessage.data && __sendMessage.data.topicName ? { msgSender: __sendMessage.data.topicName} : { msgSender: "nonExistentTopic" };
                    }

                    if (sender && sender !== "nonExistent" && ((typeof sender === 'object') && sender.msgSender !== "nonExistentTopic" || typeof sender === "string")) {
                        sendEventData(hiddenDiv, responseEventName, { data: response }, sender);
                    }
                }
                catch (generalException) {
                    console.error("General Exception in BCAPIVIewComm: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                    console.error(response, __sendMessage);
                }
            };

            sendMessage_Wrapper(__sendMessage, myCallback);
        };

        function sendMessage_Wrapper(message, callback) {
            var action = null;

            if (message.action) {
                action = message.action;

                switch (action) {
                    case "subscribeForTopic":
                        messaging.onTopicMsg.addListener(message.data.topicName, callback);
                        break;
                    case "sendSystemRequest":
                        if (typeof message.data.sender == "undefined") {
                            message.data.sender = "";
                        }
                        messaging.sendSysReq(message.data.dest, message.data.sender, message.data.data, callback);
                        break;
                    case "postTopicMsg":
                        if (typeof message.data.sender == "undefined") {
                            message.data.sender = "";
                        }
                        messaging.postTopicMsg(message.data.topicName, message.data.sender, message.data.data);
                        break;
                    case "addSysReqListener":
                        messaging.onSysReq.addListener(message.data.logicalName, callback);
                        break;
                    default:
                        console.error("BCAPIVIEW ERRRRRROR");
                        break;

                }
            }
        }


        // Adds a general listener for extension messages.
        var addExtensionMsgListener = function (hiddenDiv, responseEventName, __sendMessage) {

            // Adding global listener for all extension messages. TODO: Performance
            chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
                if (request.action) {
                    if (request.action === "listenerGetMessage" || request.action === "topicGetMessage") {
                        try {
                            var mySender = "";

                            try {
                                mySender = __sendMessage && __sendMessage.data && __sendMessage.data.data && !__sendMessage.data.topicName ?
                    JSON.parse(__sendMessage.data.data) : "";
                            } catch (e) {
                                mySender = __sendMessage && __sendMessage.data && __sendMessage.data.data ? __sendMessage.data.data : ""; // If data couldn't be parsed but isn't undefined, e.g., a string message, not in JSON form.
                            }

                            mySender = mySender.method ? { msgSender: mySender.method} : { msgSender: "nonExistent" };

                            if (mySender.msgSender === "nonExistent") {
                                // Trying to get it from topicName instead.
                                mySender = __sendMessage && __sendMessage.data && __sendMessage.data.topicName ? { msgSender: __sendMessage.data.topicName} : { msgSender: "nonExistentTopic" };
                            }

                            if (mySender && mySender !== "nonExistent" && ((typeof mySender === 'object') && mySender.msgSender !== "nonExistentTopic" || typeof mySender === "string")) {
                                sendEventData(hiddenDiv, responseEventName, { data: request }, mySender);
                            }
                        }
                        catch (generalException) {
                            console.error("General Exception in TpiVIewComm: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                        }
                    }
                }
            });
        };


        // Create custom hidden div for chrome comm.
        // Create custom hidden div for chrome comm.
        var createHiddenDiv = function (ctid) {
            var CUSTOM_DIV_ID = "__conduitCustomDivForTPI" + ctid;
            var myCustomDiv = document.getElementById(CUSTOM_DIV_ID);

            // If hidden DIV doesn't exist, creating it.
            if (!myCustomDiv) {
                myCustomDiv = window.document.createElement("div");

                myCustomDiv.setAttribute("id", CUSTOM_DIV_ID);
                myCustomDiv.setAttribute("style", "display:none");
                if (document.head) {
                    document.head.appendChild(myCustomDiv);
                }
            }

            return myCustomDiv;
        };

        var init = function (myCtid) {
            var myCustomDiv = createHiddenDiv("");

            // Listening for sendSysRequests
            addEventListener(myCustomDiv, 'sendSysReqEvent', 'sysReqReceivedEvent', sysReqCallback);

            // Listening for add listener request.
            ////addEventListener(myCustomDiv, 'addListenerEvent', 'listenerAddedEvent', addExtensionMsgListener);

            if (myCtid) {
                myOwnCtid = myCtid;
                myCustomDiv = createHiddenDiv(myOwnCtid);

                // Listening for sendSysRequests
                addEventListener(myCustomDiv, 'sendSysReqEvent', 'sysReqReceivedEvent', sysReqCallback);

                // Listening for add listener request.
                ////addEventListener(myCustomDiv, 'addListenerEvent', 'listenerAddedEvent', addExtensionMsgListener);
            }
            else {
                console.error("TPI Error: NO CTID Recevied! ", myCtid);
            }
        };
    }

    return {
        init: init,
        ctid: myOwnCtid
    };
});

/**
* @fileOverview Content.js <br/>
* FileName : Content.js <br/>
* FilePath : js/tester <br/>
* Date : 4/5/2011 1:44:13 PM <br/>
* Updated: 6/7/2011 By Uri W. 
* Copyright: Realcommerce & Conduit.
* @author <strong> Yoav S </strong>
*/


(function contentScript() {
    if (!conduitEnv.stripInjected) {
        conduitEnv.onLoadSequenceMark(contentScript, 'stripAndDocument');
        return;
    }

    /*************************************************init params*****************************************************/
    var cbsMessages = conduitEnv.cbsMessages;
    var albMessages = conduitEnv.albMessages;
    var toolbarAPIInjected = false;
    var toolbarAPIRegistered = false;
    var extId = '___' + chrome.i18n.getMessage("@@extension_id");
    var currentTabId = "";
    var docCompleteSent = false;
    var numberOfToolbars = 1,
        numberOfWebToolbars = 0;

    var allToolbars = document.getElementsByClassName('TOOLBAR_IFRAME');
    for (var i = 0; i < allToolbars.length; i++) {
        if (allToolbars[i] && allToolbars[i].id && allToolbars[i].id.indexOf('0.') > -1) {
            if (window.getComputedStyle(allToolbars[i]).height == "35px") {
                numberOfToolbars++;
            }
            if (window.getComputedStyle(allToolbars[i]).height == "34px") {
                numberOfWebToolbars++;
            }
        }
    }
    var sendDocCompleteToBack = function () {
        if (!docCompleteSent) {
            docCompleteSent = true;
            albMessages.sendSysReq('onDocComplete', 'contentScript_getTabId', { tabId: currentTabId });
        }
    }
    albMessages.onTopicMsg.addListener("tabsBackstageLoaded", function () {
        if (currentTabId != "") {
            sendDocCompleteToBack();
        }
    });

    var getTabId = function () {
        cbsMessages.sendSysReq("getMyTabId", "contentScript.js", null, function (response) {
            //writen here, read from compatibility end
            if (response) {
                currentTabId = response.tabId;
                albMessages.sendSysReq("isTabBackstageLoaded", "contentScript_getTabId", {}, function () {
                    sendDocCompleteToBack();
                });
            }
            else {
                cbsMessages.sendSysReq("getMyTabId", "contentScript.js", null, function (response) {
                    if (response) {
                        currentTabId = response.tabId;
                        albMessages.sendSysReq("isTabBackstageLoaded", "contentScript_getTabId", {}, function () {
                            sendDocCompleteToBack();
                        });
                    }
                });
            }
        });
    };
    getTabId();
    /*************************************************init params*****************************************************/


    contentScript.startContentScript = function () { //<reference path="dev/jquery-vsdoc.js" />
        contentScript.wasInit = true;

        // Injecting extension internal toolbarAPI.js if api.conduit.com/toolbarApi.js is included by the publisher.
        var injectToolbarAPI = function (myCtid) {
            var scripts = document.getElementsByTagName('SCRIPT');
            var isToolbarAPIUsed = false;
            var toolbarAPIRegEx = /toolbarapi.js$/i;

            for (var i = 0; i < (scripts ? scripts.length : 0); i++) {
                if (scripts[i].src && toolbarAPIRegEx.test(scripts[i].src)) {
                    isToolbarAPIUsed = true;
                }
            }

            //Special temporary addition for accounts.conduit.com/toolbar/editor since they include the toolbarApi.js statically inside their code.
            var myHref = document && document.location && document.location.href ? document.location.href.toUpperCase() : "";
            if (!isToolbarAPIUsed && myHref.indexOf("\/TOOLBAR\/APPS") !== -1 && myHref.indexOf("CONDUIT") !== -1) {
                isToolbarAPIUsed = true;
            }

            var doInject = function () {
                var localId = window.early.uniqueLocalId || '';
                var toolbarAPIInjectedScript = document.createElement("SCRIPT");
                toolbarAPIInjectedScript.src = chrome.extension.getURL('js/toolbarAPI/toolbarAPI.js') + '?uniqueLocalId=' + localId;
                document.getElementsByTagName("head")[0].appendChild(toolbarAPIInjectedScript);

                cbsMessages.sendSysReq("getMyTabId", "contentScript.js", null, function (response) {
                    if (response) {
                        albMessages.onTopicMsg.addListener('context.setActingCTID', function (data, sender, sendResponse) {
                            if (data) {
                                var message = {
                                    objCTIDs: data,
                                    type: "context.setActingCTID"
                                };
                                window.postMessage(message, "*");
                            }
                        });
                    }
                });
            }

            if (isToolbarAPIUsed) {
                if (conduit.abstractionlayer.commons.ToolbarApiView && !conduit.abstractionlayer.commons.ToolbarApiView.ctid) {
                    conduit.abstractionlayer.commons.ToolbarApiView.init(myCtid);
                    doInject();
                } else {
                    console.error("CS TPI - NO TPIView!");
                }
            }
            else {
                //NOTE: it solve the problem where pages add the toolbar api dynamic, in api.conduit.com/toolbarapi.js send the msg
                var onMessageReceived = function (objMsg) {
                    if (!isToolbarAPIUsed && objMsg && objMsg.data && typeof (objMsg.data) == 'string' && objMsg.data.indexOf("toolbarAPIUsed")) {
                        if (conduit.abstractionlayer.commons.ToolbarApiView && !conduit.abstractionlayer.commons.ToolbarApiView.ctid && !isToolbarAPIUsed) {
                            isToolbarAPIUsed = true;
                            conduit.abstractionlayer.commons.ToolbarApiView.init(myCtid);
                            doInject();
                            window.removeEventListener("message", onMessageReceived);
                        } else {
                            console.error("CS TPI - NO TPIView!");
                        }
                    }
                };
                window.addEventListener("message", onMessageReceived);

                //NOTE: this is injected to FULL page scope, unlike the manifest which injects to protected erea 
                var scr = document.createElement('script');
                scr.text = 'try{if(_TPIHelper){var data = {type: "toolbarAPIUsed" }; window.top.postMessage(JSON.stringify(data), "*");}}catch(e){}';
                document.head.appendChild(scr);

                document.addEventListener("DOMNodeInserted", function (e) {
                    if (e.target.tagName && e.target.tagName.toLowerCase() == 'script' && e.target.src && e.target.src.toLowerCase() == "http://api.conduit.com/toolbarapi.js") {
                        var scr = document.createElement('script');
                        scr.text = 'try{if(_TPIHelper){ window.toolbarAPIUsed =true; var data = {type: "toolbarAPIUsed" }; window.top.postMessage(JSON.stringify(data), "*");}}catch(e){}';
                        document.head.appendChild(scr);

                        var scr = document.createElement('script');
                        scr.text = 'var toolbarapiTimer =  setInterval(function(){try{if(window.toolbarAPIUsed){clearInterval(toolbarapiTimer);} if(_TPIHelper){var data = {type: "toolbarAPIUsed" }; window.top.postMessage(JSON.stringify(data), "*"); clearInterval(toolbarapiTimer);}}catch(e){}},1000);';
                        document.head.appendChild(scr);
                    }
                });
            }
        };

        var checkIfToolbarApiShouldBeInjected = function (myCtid) {
            if (!toolbarAPIRegistered) {
                toolbarAPIRegistered = true;
                albMessages.onSysReq.addListener('toolbarApiReuestsFinishedLoading', function (request, sender, sendResponse) {
                    if (!toolbarAPIInjected) {
                        toolbarAPIInjected = true;
                        injectToolbarAPI(myCtid);
                    }
                });

                albMessages.sendSysReq('didToolbarApiReuestsFinishLoading', 'contentSctipt.js', '{}', function (response) {
                    try {
                        if (response && response.finishedLoading) {
                            if (!toolbarAPIInjected) {
                                toolbarAPIInjected = true;
                                injectToolbarAPI(myCtid);
                            }
                        }
                        else {
                            console.error("ERROR: toolbarApiReuestsFinishedLoading Response: ", response);
                        }
                    } catch (generalException) {
                        console.error("CS toolbarApiReuestsFinishedLoading Exception: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                    }
                });
            }
        };

        var ctid = "";
        if (window === window.top) {
            //aliases
            var Repository = conduit.abstractionlayer.commons.repository;
            var Consts = conduit.utils.consts;
            var isPopupsNotDragable = [];
            var modalPopupId = null;
            var extensionId = chrome.extension.getURL("").replace("chrome-extension://", "").replace("/", "");
            var mainIframeId;
            var mainIframe;
            var currentResizePopupId = '';
            var hashIsesizeStarted = [];
            var popupsPosition = [];
            var popupsSize = [];
            var popupsFrameObjects = [];
            var modalId = '';
            var priceGongInitState = {};

            var allTB = document.getElementsByClassName("TOOLBAR_IFRAME");
            for (var i = 0; i < allTB.length; i++) {
                if (allTB[i].getAttribute('extensionId') === extensionId) {
                    mainIframe = allTB[i];
                    mainIframeId = allTB[i].id;
                    ctid = allTB[i].getAttribute('ctid');

                    var sendReadyScript = function () {
                        var script = document.createElement('script');
                        script.innerHTML = 'try{ document.getElementById("' + mainIframeId + '").contentWindow.postMessage({ pageHostReady: true, viewId: ' + conduitEnv.viewId + '}, "*"); } catch(e) {}';
                        document.body.appendChild(script);
                        document.body.removeChild(script);
                    }

                    // Tell the iframeHost to inject the strip
                    mainIframe.addEventListener('load', sendReadyScript, false);
                    sendReadyScript();
                }
            }
            albMessages.sendSysReq("csGetCTIDToBg", "contentScript.js", null, function (ctid) {
                if (ctid) {
                    if (mainIframe) {
                        mainIframe.setAttribute('ctid', ctid);
                        // fixedid is a property used by automation
                        mainIframe.setAttribute('fixedid', 'TOOLBAR_IFRAME-' + ctid);
                    } else {
                        console.error("no mainIframe to set the CTID to");
                    }
                    showToolbarFirstTime(ctid);
                    var str = "showTB" + ctid;
                    document.addEventListener(str, function (data) {
                        albMessages.sendSysReq("showHiddenToolbar", "contentScript.js", {}, function () { });
                    });
                    var hideStr = "hideTB" + ctid;
                    document.addEventListener(hideStr, function (data) {
                        albMessages.sendSysReq("hideShownToolbar", "contentScript.js", {}, function () { });
                    });
                    checkIfToolbarApiShouldBeInjected(ctid);
                }
                else {
                    console.log("CS - NO CTID!");
                }
            });

            document.addEventListener("DOMNodeInserted", function (e) {
                if (e && e.target && e.target.id == 'InjectCommunicator') {
                    try {
                        var message = JSON.parse(e.target.getAttribute('data-communicator'));
                        chrome.extension.sendRequest(message);
                    } catch (e) { console.error('failed to parse InjectCommunicator msg: ', e); }
                }
            });



            /* Show/Hide toolbar animation function*/
            var showHideToolbar = function (data) {
                var toolbarFrame = $('iframe[ctid|="' + data.ctid + '"]');
                toolbarFrame.css("visibility", "");
                if (toolbarFrame) {
                    if (data.shouldShow) {
                        toolbarFrame.css("visibility", "visible");
                    } else {
                        toolbarFrame.css("visibility", "hidden");
                    }
                }
            };

            /* Show/Hide toolbar function */
            var showToolbarFirstTime = function (myCtid) {
                if (toolbarVisibilityState.toolbarShow != false) {
                    shouldShow = true;
                } else {
                    shouldShow = false;
                }
                if (shouldShow === null) {
                    showHideToolbar({ shouldShow: true, ctid: myCtid });

                }
                else {
                    showHideToolbar({ shouldShow: shouldShow, ctid: myCtid });
                }
            };

            if (toolbarVisibilityState.ctid) {
                showToolbarFirstTime(toolbarVisibilityState.ctid);
            }

            var hideExtenrnalClickPopups = function (objParams, ctid) {
                $('.hideOnExternalClick').each(function () {
                    if ($(this).is(":visible")) {
                        //Redirect the hidePopup to the relevant extension's domain. 
                        //See onHidePopup listener (openPopup function)
                        if (objParams && ctid) {

                            objParams.ctid = ctid;
                        } else {
                            objParams = {};
                        }
                        var extensionIndentifier = chrome.i18n.getMessage("@@extension_id");
                        objParams.extId = extensionIndentifier;
                        var evt = document.createEvent('CustomEvent');
                        evt.initCustomEvent('onHidePopup', true, true, objParams);
                        this.dispatchEvent(evt);
                    }
                });
            };



            /**
            @Close all popups on external clicks
            @function closeAllPopupsOnExternalClick
            */
            var closeAllPopupsOnExternalClick = function (objParams) {
                var ctidPrefix = ctid && ctid !== '' && ctid !== ' ' ? '.' + ctid : '';
                $('.closeOnExternalClick' + ctidPrefix).each(function () {
                    var popupId = $(this).attr('id');
                    if (popupId && $(this).attr('class').indexOf('closeOnExternalClick') > -1) {
                        popupId = popupId.replace(Consts.POPUPS.POPUP_IFRAME_PARENT_DIV, "");
                        if (currentResizePopupId != popupId) {
                            closePopup({ 'popupID': popupId }, function () { });
                        }
                    }
                });
                hideExtenrnalClickPopups(objParams, ctid);
            };


            /*hide the popup when a click was made on embedded of other toolbar*/
            albMessages.onSysReq.addListener("externalClickOtherToolbars", function (request, sender, sendResponse) {
                hideExtenrnalClickPopups();
            });
            document.addEventListener('mousedown', function (e) {
                var targetId = (e.target && e.target.parentNode && e.target.parentNode.id || '').split('popup_iframe_parent_div_')[1];
                albMessages.sendSysReq('popups.events', 'contentScript_closeExternalPopus', { type: "closeOnExternalClick", data: { popupId: targetId} });
                if (targetId) {
                    cbsMessages.sendSysReq("setFocusOnPopup", "contentScript.js", { popupId: targetId }, function (response) { });
                }
            }, false);

            /**************************************************Popups***********************************************/

            albMessages.sendSysReq("popups.events", "contentScript.js", { type: "resetPopups" }, function (response) { });

            albMessages.onSysReq.addListener('contentScript_events_Popup_' + mainIframeId, function (request, sender, sendResponse) {
                try {
                    //Convert string to object.
                    var data = JSON.parse(request);
                    switch (data.method) {
                        case "openPopup":
                            openPopup(data, sendResponse);
                            break;
                        case "closePopup":
                            closePopup(data, sendResponse);
                            break;
                        case "resizePopup":
                            data.force = true;
                            resizePopup(data, sendResponse);
                            break;
                        case "changePositionPopup":
                            changePositionPopup(data, sendResponse);
                            break;
                        case "hidePopup":
                            hidePopup(data, sendResponse);
                            break;
                        case "showPopup":
                            showPopup(data, sendResponse);
                            break;
                        case "isPopupIDExists":
                            notifyBackStage($('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).length > 0 ? 0 : 1, sendResponse);
                            break;
                        case "minimizePopup":
                            minimizePopup(data.popupID);
                            break;
                        case "fullScreenPopup":
                            fullScreenPopup(data.popupID);
                            break;
                        case "focusPopup":
                            focusPopup(data.popupID);
                            break;
                        case "dragStart":
                            dragStart(data.popupID, sendResponse);
                            break;
                        case "dragStop":
                            dragStop(data.popupID, sendResponse);
                            break;
                        case "setFocus":
                            setFocus(data.popupID, sendResponse);
                            break;
                        case "attach":
                            attach(data.popupID, sendResponse);
                            break;
                        case "detach":
                            detach(data.popupID, sendResponse);
                            break;
                        case "navigate":
                            navigate(data, sendResponse);
                            break;
                        case "hideAndCloseOnExternal":
                            albMessages.sendSysReq('popups.events', 'contentScript_closeExternalPopus', { type: "closeOnExternalClick", tabId: currentTabId }, function () {
                                closeAllPopupsOnExternalClick();
                            });
                            break;
                        default:
                            break;
                    }
                } catch (generalException) {
                    //console.trace();
                    console.error("CS Exception: ", generalException, " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                }
            });
            var checkLocalStorageAvailbility = function () {
                try {
                    if (typeof (localStorage) !== "undefined") {
                        return true;
                    }
                    return false;
                } catch (e) {
                    return false;
                }
            }
            var resizeStart = function (popupID, sendResponse) {
                document.body.style['-webkit-user-select'] = 'none';
                hashIsesizeStarted[popupID] = true;
                var $handle = $('#popupResizerContainer' + popupID);
                if (!$handle) return notifyBackStage(9999, sendResponse);
                $handle.css({
                    'height': '9999px',
                    'width': '9999px',
                    'left': '-2000px',
                    'top': '-2000px',
                    'cursor': 'nw-resize',
                    'z-index': 2147483647
                });
                currentResizePopupId = popupID;

                $handle.bind('mousemove', resizeEvent);

                if (sendResponse) {
                    notifyBackStage(0, sendResponse);
                }
            };

            var resizeStop = function (popupID, sendResponse) {
                document.body.style['-webkit-user-select'] = '';
                if (!hashIsesizeStarted[popupID]) return notifyBackStage(9999, sendResponse);
                hashIsesizeStarted[popupID] = false;

                var $handle = $('#popupResizerContainer' + popupID);
                if (!$handle) return notifyBackStage(9999, sendResponse);
                var outterIframe = document.getElementById(Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + popupID);
                var innerIframe = document.getElementById(Consts.POPUPS.POPUP_INNER_IFRAME + popupID);
                var outterIframeWidth = 0;
                var outterIframeHeight = 0;
                var innerIframeLeft = 0;
                if (outterIframe && outterIframe.style && innerIframe && innerIframe.style) {
                    outterIframeWidth = outterIframe.style.width.replace('px', '');
                    outterIframeHeight = outterIframe.style.height.replace('px', '');
                    innerIframeLeft = innerIframe.style.left.replace('px', '');
                }
                currentResizePopupId = '';
                $handle.unbind('mousemove', resizeEvent);
                $handle.css({
                    'position': 'absolute',
                    'left': parseInt(outterIframeWidth) + parseInt(innerIframeLeft) - 15,
                    'top': parseInt(outterIframeHeight) - 15,
                    'height': 15,
                    'width': 15
                });
            };

            var resizeEvent = function (e) {
                if (!hashIsesizeStarted[currentResizePopupId])
                    return;
                //When start scrolling then stop resizing - (add 10 so when moving the mouse fast the event will be caught) 
                if (e.pageY + 10 >= window.innerHeight + window.scrollY) {
                    resizeStop(currentResizePopupId);
                    return;
                }
                if (event.pageX >= 0 && event.pageY >= 0 && popupsPosition[currentResizePopupId]) {
                    var newHeight = 41; // frame min size
                    var newWidth = 54;
                    if (popupsPosition[currentResizePopupId].top >= 0) {
                        //if height is missing after scroll - add it
                        newHeight = (event.pageY - popupsPosition[currentResizePopupId].top) - window.scrollY > newHeight ?
                                    event.pageY - popupsPosition[currentResizePopupId].top : newHeight + window.scrollY;
                        // when scrolled the height should be calculated without the scroll
                        newHeight = newHeight - window.scrollY;
                    }
                    if (popupsPosition[currentResizePopupId].left >= 0) {
                        newWidth = (event.pageX - popupsPosition[currentResizePopupId].left) > newWidth ? event.pageX - popupsPosition[currentResizePopupId].left : newWidth;
                    }
                    resizePopup({ popupID: currentResizePopupId, height: newHeight, width: newWidth }, function () { });
                }
            };

            var dragStart = function (popupID, sendResponse) {
                //can't be dragged
                if (isPopupsNotDragable[popupID] && sendResponse) {
                    return notifyBackStage(9999, sendResponse);
                }
                var $handle = $('#popupHeaderContainer' + popupID);
                if ($handle.attr('isLTR') == "true") {
                    $handle.css({
                        'height': '9999px',
                        'width': '9999px',
                        'left': -$(window).width() + 'px',
                        'top': -$(window).height() + 'px',
                        'z-index': 2147483647
                    });
                }
                else {
                    $handle.css({
                        'height': '9999px',
                        'width': '9999px',
                        'right': '0px',
                        'top': -$(window).height() + 'px',
                        'z-index': 2147483647
                    });

                }
                if (sendResponse) {
                    notifyBackStage(0, sendResponse);
                }
            };

            var dragStop = function (popupID, sendResponse) {
                var $handle = $('#popupHeaderContainer' + popupID);
                if ($handle.attr('isLTR') == "true") {
                    $handle.css({
                        'height': '30px',
                        'width': $('#' + popupID).width() - 50 + 'px',
                        'left': '0px',
                        'top': '0px'
                    });
                }
                else {
                    $handle.css({
                        'height': '30px',
                        'width': $('#' + popupID).width() - 50 + 'px',
                        'rigth': '0px',
                        'top': '0px'
                    });
                }
                var leftPopup = $('#popupHeaderContainer' + popupID).parent().css("left");
                var topPopup = $('#popupHeaderContainer' + popupID).parent().css("top");

                var popupPositions = {
                    top: topPopup,
                    left: leftPopup
                };
                updatePopupPositionInBg(popupID);
                if (sendResponse) {
                    notifyBackStage(0, sendResponse, { 'result': popupPositions });
                }
            };

            var attach = function (popupID, sendResponse) {
                if (checkLocalStorageAvailbility()) {
                    try {
                        var openAt = localStorage.getItem(popupID + '_popup_openPosition');
                    } catch (e) {
                    }
                }
                if (!openAt) {
                    console.error('cant attach popup');
                }
                if (!isPopupsNotDragable[popupID]) {
                    isPopupsNotDragable[popupID] = true;
                }
                var openAtObj = JSON.parse(openAt);

                var data = {
                    popupID: popupID,
                    left: openAtObj.left,
                    top: openAtObj.top
                };
                changePositionPopup(data, function () { });
                if (sendResponse) {
                    notifyBackStage(0, sendResponse);
                }
            };

            var detach = function (popupID, sendResponse) {
                isPopupsNotDragable[popupID] = false;
                if (sendResponse) {
                    notifyBackStage(0, sendResponse);
                }
            };

            var setFocus = function (frontPopupID, sendResponse) {
                focusPopup(frontPopupID);
                if (sendResponse) {
                    notifyBackStage(0, sendResponse);
                }
            };

            var isCloseOnExternalClick = function (data) {
                var isExternalClick = "";
                if (data.hideOnExternalClick) {
                    isExternalClick = " hideOnExternalClick";
                }
                else if (data.closeOnExternalClick) {
                    isExternalClick = " closeOnExternalClick";
                }
                return isExternalClick;
            };

            var updatePopupPositionInBg = function (popupId, forceSync) {
                if (popupId) {
                    var popupFrame = $('#' + Consts.POPUPS.POPUP_INNER_IFRAME + popupId);
                    if (!popupFrame.length) { // For menus
                        popupFrame = $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + popupId);
                    }
                    if (popupId && popupFrame.length > 0) {
                        var popupFrame = $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + popupId);
                        var myTop = parseInt(popupFrame.css("top"), 10);
                        var myLeft = parseInt(popupFrame.css("left"), 10);

                        if (!popupsPosition[popupId]) {
                            popupsPosition[popupId] = { top: myTop, left: myLeft };
                        }
                        else {
                            if (popupsPosition[popupId].top == myTop && popupsPosition[popupId].left == myLeft) {
                                return;
                            }
                            popupsPosition[popupId] = { top: myTop, left: myLeft };
                        }

                        if (forceSync) {
                            return popupsPosition[popupId];
                        }
                        else {
                            albMessages.sendSysReq("popups.events", "contentScript.js", { type: Consts.POPUPS.SET_POPUP_POSITION, data: { top: myTop, left: myLeft, popupID: popupId} }, null);
                        }
                    }
                } else {
                    console.error("popupId : ", popupId, " is invalid...");
                    console.trace();
                }
            };

            var wrapResultBeforeSendToBS = function (ansObj, dataObj) {
                var resultObj = { appResult: ansObj };
                if (dataObj) { resultObj.dataResult = dataObj; }
                return resultObj;
            };

            var updatePopupSizeInBg = function (popupId, forceSync) {
                if (popupId) {
                    var popupFrame = $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + popupId);
                    if (popupId && popupFrame.length > 0 && popupFrame[0]) {
                        var myWidth = parseInt(popupFrame[0].style.width, 10);
                        var myHeight = parseInt(popupFrame[0].style.height, 10);

                        if (!popupsSize[popupId]) {
                            popupsSize[popupId] = { width: myWidth, height: myHeight };
                        }
                        else {
                            if (popupsSize[popupId].width == myWidth && popupsSize[popupId].height == myHeight) {
                                return;
                            }
                            popupsSize[popupId] = { width: myWidth, height: myHeight };
                        }
                        if (forceSync) {
                            return popupsSize[popupId];
                        }
                        else {
                            albMessages.sendSysReq("popups.events", "contentScript.js", { type: Consts.POPUPS.SET_POPUP_SIZE, data: { width: myWidth, height: myHeight, popupId: popupId} }, null);
                        }
                    }
                }
            };

            var openPopup = function (data, sendResponse) {
                var myPopupId = data.popupId;
                albMessages.sendSysReq('popups.events', 'contentScript_closeExternalPopus', { type: "closeOnExternalClick", data: { popupId: myPopupId} }, function () { });
                closeAllPopupsOnExternalClick({ isForceMsg: (data.isModal ? true : false), windowName: "test", popup: myPopupId });

                var ctid = data.ctid;
                //Modal popups
                if (data.isModal) {
                    modalPopupId = myPopupId;
                    document.getElementById('main-iframe-wrapper').style.zIndex = '2147483644';
                    var cw_overlay = $('<div></div>', {
                        'id': 'cw_overlay' + myPopupId,
                        'class': 'SkipThisFixedPosition drsMoveHandle sb-role-modal-overlay ' + ctid,
                        css: {
                            'position': 'fixed',
                            'display': 'block',
                            'height': $(document).height(),
                            'width': '100%',
                            'top': '0px',
                            'background-color': 'transparent',
                            'left': '0px',
                            'z-index': '2147483647',
                            'opacity': 0.8,
                            'filter': 'alpha(opacity = 80)'
                        }
                    });
                    $("#popupsFixedDiv .sb-role-modal-overlay ." + ctid).remove();
                    $("#popupsFixedDiv").prepend(cw_overlay);

                }
                if (checkLocalStorageAvailbility()) {
                    try {
                        var openAt = localStorage.getItem(myPopupId + '_popup_openPosition');
                    } catch (e) {
                    }
                }
                if (!openAt) {
                    var value = { top: data.top, left: data.left };
                    if (checkLocalStorageAvailbility()) {
                        try {
                            localStorage.setItem(myPopupId + '_popup_openPosition', JSON.stringify(value));
                        } catch (e) {
                        }
                    }
                }

                if (data.frameObject) {
                    popupsFrameObjects[myPopupId] = data.frameObject;
                }

                if (data.width > window.innerWidth) {
                    data.width = window.innerWidth;
                }
                /*  if (data.height > window.innerHeight) {
                data.height = window.innerHeight;
                }*/

                var screenWidth = $('#main-iframe-wrapper').width(); //window.innerWidth

                if (data.left + data.width > screenWidth) {
                    var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
                    var cStyle = document.body.currentStyle || window.getComputedStyle(document.body, "");
                    hasVScroll = cStyle.overflow == "visible" || cStyle.overflowY == "visible" || (hasVScroll && cStyle.overflow == "auto") || (hasVScroll && cStyle.overflowY == "auto");
                    //resetting left
                    data.left = screenWidth - data.width - (hasVScroll ? 16 : 0) > 0 ? screenWidth - data.width - (hasVScroll ? 16 : 0) : 0;
                }

                var contextData = null;
                try {
                    contextData = data.extraDataObject && data.extraDataObject.contextData ? JSON.parse(data.extraDataObject.contextData) : data.extraDataObject.contextData;
                } catch (e) { console.error('Error in parsing contextData:', e); }

                var zIndex = data.extraDataObject && data.extraDataObject.isFocused === false ? '2147483645' : '2147483646';
                if (data.isModal) {
                    zIndex = '2147483647';
                }
                var iframeDivWrapper = $('<div></div>', {
                    'id': Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + myPopupId,
                    'appId': data.extraDataObject && data.extraDataObject.menuItemId ? data.extraDataObject.menuItemId : (contextData && contextData.appId ? contextData.appId : ''),
                    'class': 'iframe-div-wrapper SkipThisFixedPosition' + isCloseOnExternalClick(data) + ' drsElement ' + ctid,
                    css: {
                        top: data.top,
                        left: data.left,
                        float: 'left',
                        position: 'absolute',
                        background: data.extraDataObject && data.extraDataObject.isInnerTransparent ? 'transparent' : 'white',
                        width: data.width,
                        height: data.height,
                        'z-index': zIndex
                    }
                });
                if (data.isModal) {
                    $("#popupsFixedDiv .sb-role-modal-popup ." + ctid).remove();
                    iframeDivWrapper.addClass('sb-role-modal-popup');
                }


                if (data.hideOnExternalClick) {
                    iframeDivWrapper[0].addEventListener("onHidePopup", function () {
                        //console.log("fire onHidePopup event:" + chrome.extension.getURL(""));
                        var isForceMsg = event && event.detail && event.detail.isForceMsg ? event.detail.isForceMsg : false;
                        var showedPopupId = event && event.detail && event.detail.popupID ? event.detail.popupID : '';
                        var popupId = $(this).attr('id');

                        if (popupId) {
                            popupId = popupId.replace(Consts.POPUPS.POPUP_IFRAME_PARENT_DIV, "");
                            if (popupId != currentResizePopupId && (!showedPopupId || showedPopupId && showedPopupId != popupId)) {
                                var data = {
                                    'popupID': popupId
                                };


                                var currExtId = chrome.i18n.getMessage("@@extension_id");
                                if (event && event.detail && event.detail.extId && currExtId && currExtId != event.detail.extId) {
                                    hidePopup(data, function () { });
                                    albMessages.sendSysReq('popups.events', 'contentScript_closeExternalPopus', { type: "closeOnExternalClick" }, function () { });
                                }
                            }
                        }
                    }, 0);
                }

                if (data.frameObject) {
                    iframeDivWrapper.css({
                        border: '1px solid #c1c9cf',
                        '-webkit-border-radius': Consts.CONTENT_SCRIPT.BORDER_RADIUS,
                        'border-radius': Consts.CONTENT_SCRIPT.BORDER_RADIUS,
                        '-webkit-box-shadow': '3px 3px 3px rgba(0, 0, 0, 0.5)',
                        'box-shadow': '3px 3px 3px rgba(0, 0, 0, 0.5)'
                    });
                }

                var url = data.url;
                var isFrameExists = data.frameObject && data.frameObject.url ? true : false;

                // This iframe is either the popup or the gadget frame. the url is passed to the iframeHost as parameter
                var urlForThisIframe = isFrameExists ? data.frameObject.url : url;
                var iframe = $('<iframe></iframe>', {
                    'id': myPopupId,
                    'name': JSON.stringify({ profileName: window.profileName, viewId: conduitEnv.viewId, name: myPopupId + extId, url: urlForThisIframe }),
                    'src': chrome.extension.getURL("js/iframeHost.html"),
                    'scrolling': !isFrameExists && data.extraDataObject && (data.extraDataObject.vScroll || data.extraDataObject.hScroll) ? 'yes' : 'no',
                    'marginheight': "0",
                    'marginwidth': "0",
                    'frameborder': '0',
                    css: {
                        height: data.height,
                        width: data.width,
                        'z-index': zIndex,
                        '-webkit-user-select': 'none',
                        'display': 'block'
                    }
                });

                var popupHeaderContainer;
                if (isFrameExists && data.extraDataObject && data.extraDataObject.draggable) {
                    //Popup draggable header container
                    if (!data.extraDataObject.isRTL) {
                        popupHeaderContainer = $('<div></div>', {
                            'id': 'popupHeaderContainer' + myPopupId,
                            'class': 'drsMoveHandle',
                            'isLTR': true,
                            css: {
                                'position': 'absolute',
                                'left': '0px',
                                'top': '0px',
                                'cursor': 'move',
                                'height': '30px',
                                'width': data.width - 50 + 'px'
                            }
                        });
                    }
                    else {
                        popupHeaderContainer = $('<div></div>', {
                            'id': 'popupHeaderContainer' + myPopupId,
                            'class': 'drsMoveHandle',
                            'isLTR': false,
                            css: {
                                'position': 'absolute',
                                'right': '0px',
                                'top': '0px',
                                'cursor': 'move',
                                'height': '30px',
                                'width': data.width - 50 + 'px'
                            }
                        });
                    }
                } else {
                    popupHeaderContainer = $('<div></div>', {
                        'id': 'popupHeaderContainer' + myPopupId,
                        css: {
                            'right': '0px',
                            'top': '0px',
                            'height': '0px',
                            'width': '0px'
                        }
                    });
                }



                var innerIframe = null;
                if (isFrameExists) {
                    if (data.extraDataObject && data.extraDataObject.resizable) {
                        var popupResizerContainer = $('<div></div>', {
                            'id': 'popupResizerContainer' + myPopupId,
                            css: {
                                'position': 'absolute',
                                'left': data.width + parseInt(data.frameObject.leftWidth) - 15,
                                'top': data.height - 15,
                                'cursor': 'nw-resize',
                                'height': 15,
                                'width': 15,
                                'z-index': '2147483647'
                            }
                        });
                    }

                    if (data.extraDataObject && contextData && url && url.indexOf('http://chat.loke.com/') > -1) {
                        innerIframe = document.createElement("IFRAME");
                        innerIframe.id = Consts.POPUPS.POPUP_INNER_IFRAME + myPopupId;
                        innerIframe.scrolling = data.extraDataObject && (data.extraDataObject.vScroll || data.extraDataObject.hScroll) ? 'yes' : 'no';
                        innerIframe.marginheight = "0";
                        innerIframe.marginwidth = "0";
                        innerIframe.style.border = "0px";
                        innerIframe.src = url;
                        innerIframe.style.position = 'absolute';
                        innerIframe.style.top = (data.frameObject.topHeight ? data.frameObject.topHeight : 44) + "px";
                        innerIframe.style.left = (data.frameObject.leftWidth ? data.frameObject.leftWidth : 0) + "px";
                        innerIframe.height = (data.height && data.frameObject.topHeight && data.frameObject.bottomHeight ? data.height - data.frameObject.topHeight - data.frameObject.bottomHeight - 3 : 500) + "px";
                        innerIframe.style.height = (data.height && data.frameObject.topHeight && data.frameObject.bottomHeight ? data.height - data.frameObject.topHeight - data.frameObject.bottomHeight - 3 : 500) + "px";
                        innerIframe.width = data.width && data.frameObject.leftWidth && data.frameObject.rightWidth ? data.width - data.frameObject.leftWidth - data.frameObject.rightWidth - 3 : 500;
                        innerIframe.style.zIndex = zIndex;


                        innerIframe.onload = function () {
                            innerIframe.height = (data.height && data.frameObject.topHeight && data.frameObject.bottomHeight ? data.height - data.frameObject.topHeight - data.frameObject.bottomHeight - 2 : 500) + "px";


                            innerIframe.style.setProperty("height", (data.height && data.frameObject.topHeight && data.frameObject.bottomHeight ? data.height - data.frameObject.topHeight - data.frameObject.bottomHeight - 2 : 500) + "px");

                            innerIframe.width = data.width && data.frameObject.leftWidth && data.frameObject.rightWidth ? data.width - data.frameObject.leftWidth - data.frameObject.rightWidth - 2 : 500;
                        };
                    }
                    else {
                        innerIframe = $('<iframe></iframe>', {
                            'id': Consts.POPUPS.POPUP_INNER_IFRAME + myPopupId,
                            'src': chrome.extension.getURL("js/iframeHost.html"),
                            'name': JSON.stringify({ profileName: window.profileName, name: myPopupId + extId, url: url }),
                            'scrolling': data.extraDataObject && (data.extraDataObject.vScroll || data.extraDataObject.hScroll) ? 'yes' : 'no',
                            //'marginheight': "0",
                            //'marginwidth': "0",
                            'frameborder': '0',
                            css: {
                                'position': 'absolute',
                                'top': data.frameObject.topHeight ? data.frameObject.topHeight : 44,
                                'left': data.frameObject.leftWidth ? data.frameObject.leftWidth : 0,
                                'height': data.height && data.frameObject.topHeight && data.frameObject.bottomHeight ? data.height - data.frameObject.topHeight - data.frameObject.bottomHeight : 500,
                                'width': data.width && data.frameObject.leftWidth && data.frameObject.rightWidth ? data.width - data.frameObject.leftWidth - data.frameObject.rightWidth : 500,
                                'z-index': zIndex,
                                '-webkit-user-select': 'none',
                                'display': 'block'
                            }
                        });
                    }
                }

                //bug fix with old toolbar
                if (data.isModal && document.getElementById('popupsFixedDiv').style.zIndex == '99997') {
                    document.getElementById('popupsFixedDiv').style.zIndex = '2147483646';
                    modalId = myPopupId;
                }

                if (contextData && contextData.appId == "price-gong") {
                    priceGongInitState = { id: Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + myPopupId, top: data.top, left: data.left };
                }

                // Appending draggable header only when popup has a frame.
                if (isFrameExists) {
                    if (data.extraDataObject && data.extraDataObject.resizable) {
                        $('#popupsFixedDiv')
                                .append(iframeDivWrapper
                                    .append(popupHeaderContainer)
                                    .append(popupResizerContainer)
                                    .append(iframe)
                                    .append(innerIframe));
                    }
                    else {
                        $('#popupsFixedDiv')
                                .append(iframeDivWrapper
                                    .append(popupHeaderContainer)
                                    .append(iframe)
                                    .append(innerIframe));
                    }
                }
                else {
                    $('#popupsFixedDiv')
                        .append(iframeDivWrapper
                            .append(iframe));
                }


                popupHeaderContainer.mouseup(function () { dragStop(myPopupId); });
                popupHeaderContainer.mousedown(function () { dragStart(myPopupId); });

                if (popupResizerContainer && popupResizerContainer.mouseover) {
                    popupResizerContainer.mousedown(function (e) {
                        resizeStart(myPopupId);
                    });
                    popupResizerContainer.mouseup(function (e) {
                        resizeStop(myPopupId);
                    });
                }


                focusPopup(myPopupId);

                var position = updatePopupPositionInBg(myPopupId, true);
                var size = updatePopupSizeInBg(myPopupId, true);
                //Check: if iframe created, and send response.
                if ($('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + myPopupId).length > 0) {
                    if (currentTabId && currentTabId > 0) {
                        sendResponse(wrapResultBeforeSendToBS({ result: myPopupId, status: 0, description: "" }, { tabId: currentTabId, position: position, size: size }));
                    }
                    else {
                        cbsMessages.sendSysReq("getMyTabId", "contentScript.js", null, function (response) {
                            if (response) {
                                currentTabId = response.tabId;
                                sendResponse(wrapResultBeforeSendToBS({ result: myPopupId, status: 0, description: "" }, { tabId: currentTabId, position: position, size: size }));
                            }
                        });
                    }
                }
                else {
                    sendResponse(wrapResultBeforeSendToBS({ result: '', status: '9999', description: "Iframe hasn't been created!" }));
                }

            };

            var closePopup = function (data, sendResponse) {
                var result = 0;
                if (data && data.externalClick) {
                    if (data.popupID == currentResizePopupId) {
                        notifyBackStage(result, sendResponse);
                        return;
                    }
                }


                //Remove the iframe wrapper and all dom inside.
                if ($('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).length > 0) {
                    $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).slideUp(0, function () {

                        //if popup is modal
                        if (modalPopupId == data.popupID) {
                            if ($(this).parent().next().css('display') == 'block') {
                                $(this).parent().next().css('display', 'none');
                            }
                            /*  $('#popupsFixedDiv').children().each(function () {
                            this.style.display = this.getAttribute('prevAppDisplay');
                            this.removeAttribute('prevAppDisplay');
                            });*/
                            document.getElementById('main-iframe-wrapper').style.zIndex = '2147483646';
                            modalPopupId = null;
                        }

                        $('#cw_overlay' + data.popupID).remove();
                        $(this).remove();

                        if (modalId == data.popupID && document.getElementById('popupsFixedDiv').style.zIndex == '2147483646') {
                            document.getElementById('popupsFixedDiv').style.zIndex = '99997';
                            modalId = '';
                        }

                        //Check if removed.
                        if ($('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).length > 0) {
                            result = 1;
                        }
                        //Send resposnse to backstage.
                        notifyBackStage(result, sendResponse);
                    });
                }
                else {
                    // Popup not found. let BS know it is already closed (this happens with close on external click popups that are sometimes closed without a msg from BS)
                    notifyBackStage(0, sendResponse);
                }
            };

            var resizePopup = function (data, sendResponse) {
                var innerIframeFrameHeight = popupsFrameObjects[data.popupID] && popupsFrameObjects[data.popupID].topHeight ? popupsFrameObjects[data.popupID].topHeight : 31;
                var innerIframeFrameBottomHeight = popupsFrameObjects[data.popupID] && popupsFrameObjects[data.popupID].bottomHeight ? popupsFrameObjects[data.popupID].bottomHeight : 0;
                var outterIframe = document.getElementById(Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID);


                if (data.width > window.innerWidth) {
                    data.width = window.innerWidth;
                }

                //Resize the iframe.
                var $parentDiv = $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID);
                $parentDiv.css({
                    height: data.height,
                    width: data.width
                });

                $('#' + data.popupID, $parentDiv).css({
                    height: data.height,
                    width: data.width
                });

                if (document.getElementById(Consts.POPUPS.POPUP_INNER_IFRAME + data.popupID)) {
                    $('#' + Consts.POPUPS.POPUP_INNER_IFRAME + data.popupID).css({
                        height: data.height - innerIframeFrameHeight - innerIframeFrameBottomHeight,
                        width: data.width - 2
                    });
                }

                if (data.force && document.getElementById('popupResizerContainer' + data.popupID)) {
                    $('#' + 'popupResizerContainer' + data.popupID).css({
                        top: data.height - 15,
                        left: data.width - 15
                    });
                }

                if (outterIframe && outterIframe.style) {
                    var gadgetTop = outterIframe.style.top.replace('px', '');
                    var screenWidth = $('#main-iframe-wrapper').width();
                    var gadgetLeft = outterIframe.style.left.replace('px', '');

                    if (parseInt(gadgetLeft) + data.width > screenWidth) {
                        var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
                        var cStyle = document.body.currentStyle || window.getComputedStyle(document.body, "");
                        hasVScroll = cStyle.overflow == "visible" || cStyle.overflowY == "visible" || (hasVScroll && cStyle.overflow == "auto") || (hasVScroll && cStyle.overflowY == "auto");

                        //resetting left
                        $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).css({
                            left: screenWidth - data.width - (hasVScroll ? 16 : 0) > 0 ? screenWidth - data.width - (hasVScroll ? 16 : 0) : 0
                        });
                    }


                    if (parseInt(gadgetTop) + data.height > window.innerHeight) {
                        //resetting top
                        $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).css({
                            top: window.innerHeight - data.height + Consts.CONTENT_SCRIPT.TOOLBAR_HEIGHT > 0 ? window.innerHeight - data.height + Consts.CONTENT_SCRIPT.TOOLBAR_HEIGHT : 0
                        });
                    }
                }

                //TODO: This handles cases with gadgetFrame.html. NOT DONE!!!
                //Set obj data to backstage.
                var objData = {
                    method: 'resizePopup',
                    width: data.width,
                    height: data.height,
                    popupID: data.popupID
                };
                //Convert object to string.
                strData = JSON.stringify(objData);
                notifyBackStage(0, sendResponse);
                //Send message to coreLibs with all relevant data to continue the resize process in the gadgetHtml part.
                //albMessages.sendSysReq('coreLibs.popups', 'contentScript.js', strData, function (response) { });
                // $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).fadeIn('fast', function () { });
                updatePopupPositionInBg(data.popupID);
                updatePopupSizeInBg(data.popupID);
            };

            var calculatePositionInScreenBorders = function (data) {
                var popupFrame = document.getElementById(data.popupID);

                if (popupFrame) {
                    if (popupFrame.clientWidth && popupFrame.clientWidth > 0 && data.left + popupFrame.clientWidth > window.innerWidth) {
                        var cStyle = document.body.currentStyle || window.getComputedStyle(document.body, "");

                        // Checking if page has a vertical scroll bar
                        hasVScroll = cStyle.overflow == "visible" || cStyle.overflowY == "visible" || (hasVScroll && cStyle.overflow == "auto") || (hasVScroll && cStyle.overflowY == "auto");

                        data.left = window.innerWidth - popupFrame.clientWidth - (hasVScroll ? 16 : 0) > 0 ?
                                                window.innerWidth - popupFrame.clientWidth - (hasVScroll ? 16 : 0) : 0;
                    }

                    // Calculating new top if popup top + height exceeds screen height.
                    if (data.top + popupFrame.clientHeight > window.innerHeight) {
                        data.top = window.innerHeight - popupFrame.clientHeight > 0 ? window.innerHeight - popupFrame.clientHeight : 0;
                    }
                }
            };

            var changePositionPopup = function (data, sendResponse) {
                var result = 0;
                var iframe = $('#' + data.popupID);
                if (!iframe || !iframe[0] || !iframe[0].style) {
                    return notifyBackStage(9999, sendResponse);
                }
                iframe = iframe[0].style;

                var width = parseInt(iframe.width.replace('px', ''), 10);
                var height = parseInt(iframe.height.replace('px', ''), 10);
                if (data.left + width > window.innerWidth) {
                    var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
                    var cStyle = document.body.currentStyle || window.getComputedStyle(document.body, "");
                    hasVScroll = cStyle.overflow == "visible" || cStyle.overflowY == "visible" || (hasVScroll && cStyle.overflow == "auto") || (hasVScroll && cStyle.overflowY == "auto");
                    //resetting left
                    data.left = window.innerWidth - width - (hasVScroll ? 16 : 0) > 0 ? window.innerWidth - width - (hasVScroll ? 16 : 0) : 0;
                }
                if (data.top + height > window.innerHeight) {
                    //resetting top
                    data.top = window.innerHeight - height > 0 ? window.innerHeight - height : 0;
                }
                //calculatePositionInScreenBorders(data);

                //Change top/left position.
                $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).css({
                    top: data.top,
                    left: data.left
                });

                var extraData = { top: data.top, left: data.left, popupId: data.popupID };
                //Send resposnse to backstage.
                notifyBackStage(result, sendResponse, extraData);
                //too late
                updatePopupPositionInBg(data.popupID);
            };

            var hidePopup = function (data, sendResponse) {
                if (!document.getElementById(Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID)) {
                    notifyBackStage(1, sendResponse);
                }
                else {
                    $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).css('display', 'none');
                    notifyBackStage(0, sendResponse);
                }
            };

            var showPopup = function (data, sendResponse) {
                var popup = document.getElementById(Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID);
                closeAllPopupsOnExternalClick({ popupID: data.popupID });
                if (popup && data.newContext) {
                    var contextData = null;
                    try {
                        contextData = data && data.newContext ? JSON.parse(data.newContext) : data.newContext;
                    } catch (e) { console.error('Error in parsing contextData:', e); }

                    popup.setAttribute('appId', contextData && contextData.appId ? contextData.appId : '');
                }
                var result = 0;

                $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).fadeIn('fast', function () {
                    if ($('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popupID).css('display') != 'block') {
                        var result = 1;
                    }
                });

                notifyBackStage(result, sendResponse);

                focusPopup(data.popupID);
            };

            var notifyBackStage = function (result, sendResponse, extraData) {
                if (result === 0) {
                    if (extraData && extraData.result) {
                        sendResponse(wrapResultBeforeSendToBS({ result: extraData.result, status: 0, description: extraData ? extraData : '' }));
                    }
                    else {
                        sendResponse(wrapResultBeforeSendToBS({ result: true, status: 0, description: extraData ? extraData : '' }));
                    }
                }
                else if (result == 1) {
                    sendResponse(wrapResultBeforeSendToBS({ result: '', status: 1, description: extraData ? extraData : '' }));
                }
            };

            var minimizePopup = function (popupID) {

                $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + popupID).css({
                    width: '0px',
                    height: '0px',
                    top: '0px',
                    left: '750px'
                });

                $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + popupID).hide();

                //Send message to webApp model to update isMinimized to true.
                albMessages.sendSysReq('webApp.model.urlGadget_setIsMinimized_' + popupID, 'contentScript.js', JSON.stringify({ isMinimized: true }), function (response) { });

            };

            var fullScreenPopup = function (popupID) {

                var popup = $('#' + popupID);

                $('#' + popupID).css({
                    width: 800 + Consts.POPUPS.SIDE_SPACE,
                    height: 600 + Consts.POPUPS.GADGET_FRAME_HEADER_HEIGHT + Consts.POPUPS.GADGET_FRAME_FOOTER_HEIGHT
                });

                var thisWidth = parseInt(popup.css('width'), 10);
                var thisHandleWidth = thisWidth - Consts.POPUPS.IFRAME_HEADER_RIGHT_SECTION_WIDTH + 'px';

                popup.parent().find('.handle').css('width', thisHandleWidth);

                //Store the width value in the element for later use.
                popup.parent().find('.handle').data('width', thisHandleWidth);


                $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + popupID).css({
                    top: 70,
                    left: ($(window).width() - Consts.POPUPS.MAXIMUM_POPUP_SIZE) / 2
                });

                var objData = {
                    method: 'resizePopup',
                    width: 800,
                    height: 600,
                    popupID: popupID
                };

                strData = JSON.stringify(objData);
                albMessages.sendSysReq('coreLibs.popups', 'contentScript.js', strData, function (response) { });

                updatePopupPositionInBg(popupID);
            };


            var locationPath = window.location.pathname;
            var locationOrigin = window.location.origin;
            var locationHostname = window.location.hostname;
            var injectJinjectJsMessage = { url: locationOrigin,
                path: locationPath
            };
            albMessages.sendSysReq('injectJs', 'contentScript.js', JSON.stringify(injectJinjectJsMessage), function (response) { });

            // Sending close popup to bg for each popup on page refresh so bg popups db is in sync.
            window.onunload = function () {
                $('.iframe-div-wrapper').each(function () {
                    var $this = $(this);
                    var popupID = this.id;
                    popupID = popupID.replace(Consts.POPUPS.POPUP_IFRAME_PARENT_DIV, "");
                    albMessages.sendSysReq('contentScript_closed_popup_to_back', 'contentScript.js', JSON.stringify({ popupId: popupID }), function (response) { });
                    albMessages.sendSysReq('popups.events', 'contentScript_closeExternalPopus', { type: "sendOnCloseEvent", pId: popupID }, function () { });
                    updatePopupPositionInBg(popupID);
                });
            };

        } // endif - window == window.top (code above runs in main HTML page only, doesn't run inside IFRAMES).


        var focusPopup = function (frontPopupID) {
            /// <summary>Brings the specified gadget to the foreground</summary>
            /// <param name="frontGadgetUid" type="Number">The uid of the front gadget</param>
            if (modalPopupId != null) {
                return;
            }
            $('.iframe-div-wrapper').each(function () {
                var popupID = this.id.replace(Consts.POPUPS.POPUP_IFRAME_PARENT_DIV, "");
                var me = document.getElementById(this.id);

                // Bring to front
                if (popupID === frontPopupID) {
                    me.style.zIndex = '2147483646';
                    if (me.style.display == 'none') {
                        me.style.display = '';
                    }
                }
                else { // Other gadgets
                    me.style.zIndex = '2147483645';
                }
            });
        };

        /*NAVIGATE POPUP*/
        var navigate = function (data, sendResponse) {
            var result = 0;
            var iframe = $('#' + data.popUpID);
            var extensionId = chrome.extension.getURL("").replace("chrome-extension://", "").replace("/", "");
            //must navigate first to another url - when just changing the query string - no navigation
            iframe[0].src = 'chrome-extension://' + extensionId + '/tb/al/ui/menu/popup.html';
            iframe[0].src = data.url;
            iframe.css({ 'width': data.width,
                'height': data.height,
                'z-index': '2147483646'
            });

            if (data.width > window.innerWidth) {
                data.width = window.innerWidth;
            }
            if (data.height > window.innerHeight) {
                data.height = window.innerHeight;
            }

            if (data.left + data.width > window.innerWidth) {
                var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
                var cStyle = document.body.currentStyle || window.getComputedStyle(document.body, "");
                hasVScroll = cStyle.overflow == "visible" || cStyle.overflowY == "visible" || (hasVScroll && cStyle.overflow == "auto") || (hasVScroll && cStyle.overflowY == "auto");
                //resetting left
                data.left = window.innerWidth - data.width - (hasVScroll ? 16 : 0) > 0 ? window.innerWidth - data.width - (hasVScroll ? 16 : 0) : 0;
            }
            if (data.top + data.height > window.innerHeight) {
                //resetting top
                data.top = window.innerHeight - data.height > 0 ? window.innerHeight - data.height : 0;
            }

            var iframeDivWrapper = $('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popUpID);
            iframeDivWrapper.addClass('iframe-div-wrapper SkipThisFixedPosition' + ((data.showFrame) ? "" : isCloseOnExternalClick(data)) + ' drsElement');
            iframeDivWrapper.css({ 'top': data.top,
                'left': data.left,
                'float': 'left',
                'position': 'absolute',
                'background': data.showFrame ? 'white' : 'transparent',
                'width': data.width,
                'height': data.height
            });


            if (data.showFrame) {
                iframeDivWrapper.css({
                    border: '1px solid #c1c9cf',
                    '-webkit-border-radius': Consts.CONTENT_SCRIPT.BORDER_RADIUS,
                    'border-radius': Consts.CONTENT_SCRIPT.BORDER_RADIUS,
                    '-webkit-box-shadow': '3px 3px 3px rgba(0, 0, 0, 0.5)',
                    'box-shadow': '3px 3px 3px rgba(0, 0, 0, 0.5)'
                });
            }
            if (checkLocalStorageAvailbility()) {
                try {
                    var openAt = localStorage.getItem(data.popUpID + '_popup_openPosition');
                } catch (e) {
                }
            }
            if (!openAt) {
                var value = { top: data.top, left: data.left };
                if (checkLocalStorageAvailbility()) {
                    try {
                        localStorage.setItem(data.popUpID + '_popup_openPosition', JSON.stringify(value));
                    } catch (e) {
                    }
                }
            }

            //Check if the new current top value equals the top value that was sent.
            if (parseInt($('#' + data.popUpID).css('top'), 10) !== data.top) {
                result = 1;
            }

            //Check: if iframe created, and send response.
            if ($('#' + Consts.POPUPS.POPUP_IFRAME_PARENT_DIV + data.popUpID).length > 0) {
                notifyBackStage(0, sendResponse);
                updatePopupPositionInBg(data.popupID);
            }
            else {
                notifyBackStage(9999, sendResponse);
            }
        };
        //}); // End of document ready function.

        var isListenerExist = false;

        function getWindowWidth() {
            var wWidth = window.innerWidth;
            /*
            var winHeight = $(window).height();
            var docHeight = $(document).height();
            if (docHeight > winHeight){
            wWidth -= 15;
            }
            */
            return wWidth;
        }

        function getWindowHeight() {
            var wHeight = window.innerHeight;
            var winWidth = $(window).width();
            var docWidth = $(document).width();
            if (docWidth > winWidth) {
                wHeight -= 15;
            }
            return wHeight;
        }

        var lastWindowHeight = getWindowHeight();
        var lastWindowWidth = getWindowWidth();

        var popupsResizeHandler = function (e) {
            var popupsClassName = $(".iframe-div-wrapper");

            popupsClassName.each(function () {
                var currentPopup = $(this);
                var currentPopupId = currentPopup.attr('id');

                if ($(this).css('display') === 'block') {
                    if (priceGongInitState && currentPopupId && priceGongInitState.id == currentPopupId) {
                        var children = $(this).children();
                        var agreementDialog = false;
                        var iframeInnerUrl;
                        for (var i = 0; i < children.length; i++) {
                            try {
                                iframeInnerUrl = JSON.parse(children[i].name).url;
                            } catch (e) { }

                            if (iframeInnerUrl && iframeInnerUrl.indexOf("agree.html") != -1) {
                                agreementDialog = true;
                            }
                        }
                        if (!agreementDialog) {
                            var getTopDiff = getWindowHeight() - parseInt(currentPopup.css('height')) >= 0 ? getWindowHeight() - parseInt(currentPopup.css('height')) : 0;
                            var getLeftDiff = getWindowWidth() - parseInt(currentPopup.css('width')) - 15 - 14 >= 0 ? getWindowWidth() - parseInt(currentPopup.css('width')) - 15 - 14 : getWindowWidth();

                            currentPopup.css("top", getTopDiff + "px");
                            currentPopup.css("left", getLeftDiff + "px");
                            currentPopupId = currentPopupId.substr(Consts.POPUPS.POPUP_IFRAME_PARENT_DIV.length, currentPopupId.length);
                            updatePopupPositionInBg(currentPopupId);
                        }

                    }
                }
            });

            lastWindowHeight = getWindowHeight();
            lastWindowWidth = getWindowWidth();
        };

        if (window === window.top) {
            var resizeHandler = function (event) {
                albMessages.sendSysReq('popups.events', 'contentScript_closeExternalPopus', { type: "closeOnExternalClick" }, function () {
                    closeAllPopupsOnExternalClick({ isForceMsg: true, windowName: "", popup: "" }); //close opened menus on window resize
                })
                popupsResizeHandler(event);
            }

            window.addEventListener("resize", resizeHandler, false);
        }

        if (!isListenerExist && document && (/BACKSTAGE\.HTML$/i.test(document.location.href) === false)) {
            isListenerExist = true;
            albMessages.onSysReq.addListener("getScreenHeight_" + mainIframeId, function (request, sender, sendResponse) {
                if (request.type == "getScreenHeight") {
                    sendResponse(getWindowHeight());
                }
            });
            albMessages.onSysReq.addListener("getScreenWidth_" + mainIframeId, function (request, sender, sendResponse) {
                if (request.type == "getScreenWidth") {
                    sendResponse(getWindowWidth());
                }
            });

            albMessages.onSysReq.addListener("getWindowHeight_" + mainIframeId, function (request, sender, sendResponse) {
                if (request.type == "getWindowHeight") {
                    sendResponse(window.outerHeight);
                }
            });
            albMessages.onSysReq.addListener("getWindowWidth_" + mainIframeId, function (request, sender, sendResponse) {
                if (request.type == "getWindowWidth") {
                    sendResponse(window.outerWidth);
                }
            });
        }

        chrome.extension.sendRequest({ __type: "onNavigate_ReleaseQueue", __from: document.location.href }, function (response) {
        });
    };

    if (early.wasInit === true) {
        contentScript.startContentScript();
    }
})();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              // End of anonymous function.

