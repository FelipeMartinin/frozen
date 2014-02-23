
if (window.location.hash.indexOf('conduitupgradedatamigration') !== -1) {
	var storage;
	try {
		storage = window.localStorage;
	} catch (e) {
		console.error('no migration: no localStorage');
	}
	
	chrome.storage.local.set({ "pricegong-migration": storage || false});

	// abort script load
	return;
}

// Manager for name spaces and events
// by Yossi K.

var conduit = conduit || (function () {
    var registeredEvents = {},
		objIndex = 0;

    function triggerEvent(eventName, eventData) {
        var registeredEventHandlers = registeredEvents[eventName];

        if (registeredEventHandlers) {
            for (var i = registeredEventHandlers.length - 1; i >= 0; i--) {
                try {
                    registeredEventHandlers[i].handler.call(this, eventData);
                }
                catch (error) {
                }
            }
        }
    }

    function subscribe(subscriber, eventName, eventHandler) {
        var subscribeData = {},
			registeredEvent;

        if (arguments.length === 3 && typeof (arguments[0]) === "object") {
            subscribeData.name = subscriber.name;
            subscribeData.subscriber = subscriber.ID;
        }
        else {
            eventHandler = arguments[1];
            eventName = arguments[0];
        }

        registeredEvent = registeredEvents[eventName];
        subscribeData.handler = eventHandler;

        if (!registeredEvent)
            registeredEvent = registeredEvents[eventName] = [];

        registeredEvent.push(subscribeData);

        triggerEvent("onConduitSubscribe", { eventName: eventName });
    }
    function unsubscribe(eventName, obj) {
        var eventHandlers = registeredEvents[eventName];
        if (eventHandlers) {
            var eventHandlerIndex = null;
            for (var i = 0; i < eventHandlers.length && eventHandlerIndex === null; i++) {
                if (eventHandlers[i].subscriber === obj.ID) {
                    eventHandlerIndex = i;
                }
            }
            if (eventHandlerIndex !== null) {
                eventHandlers.splice(eventHandlerIndex, 1);
            }
        }
    }

    return {
        triggerEvent: triggerEvent,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        register: function (name, o) {
            var pathMembers = name.split("."),
                currentPathMember = 0;

            // Returns the namespace specified in the path. If the ns doesn't exists, creates it.
            // If an object exists with the same name, but it isn't an object, an error is thrown.
            function getNamespace(parent) {
                if (pathMembers.length === 1) {
                    if (conduit[name])
                        throw new Error("Specified name already exists: " + name);

                    return conduit;
                }

                var nsName = pathMembers[currentPathMember],
                    returnNs,
                    existingNs;

                parent = parent || conduit;
                existingNs = parent[nsName];

                if (!existingNs) {
                    returnNs = parent[nsName] = {};
                }
                else if (typeof existingNs === "object")
                    returnNs = existingNs;
                else
                    throw new Error("Specified namespace exists and is not an object: " + name);

                if (++currentPathMember < pathMembers.length - 1) {
                    returnNs = getNamespace(returnNs);
                }

                return returnNs;
            }

            if (typeof (o) === "object") {
                o.ID = ++objIndex;

                if (o.subscribes) {
                    for (eventName in o.subscribes) {
                        subscribe(o, eventName, o.subscribes[eventName]);
                    }
                }
            }

            getNamespace()[pathMembers[currentPathMember]] = o;
        }
    };
})();


/**

file name: frontSmartPort.js
description: exposes function smartPriorityPortInit(msgingName);
when called, it initializes and returns the smartPriorityPort (this is basically a simple lazy init)

the smartPriorityPort is a singleton (ignores additional init calls), it extends the basic chrome port to support our needs:
1. actions wait for connection to be confirmed as established
2. connectionName is added to all outgoing messages
3. actions that wait for connection can be sorted by priority of execution once connection is established

*/
var smartPriorityPortInit = (function () {

    // SmartPort encapsulates a port that is confirmed to be connected by getting data from backstage
    var smartPortInit = (function () {
        var reconnect_delay = 5000;
        var isEstablished;
        var connection;
        var callbacks = []; // Waiting for connection

        function onEstablished() {
            if (isEstablished) { return; }

            isEstablished = true;
            connection.onMessage.removeListener(onMessageRecieve);
            callbacks.forEach(function (curr) {
                try {
                    curr(connection);
                } catch (e) { console.error(e); }
            });
            callbacks = [];
        }

        function onMessageRecieve(message) {
            if (message.type === "connection_established") {
                // backstage let me know it is alive and connection is now established
                onEstablished();
            }
        }

        function connect(name) {
            try {
                connection = chrome.extension.connect({
                    name: name + Math.random() * 5000
                });
                connection.onMessage.addListener(onMessageRecieve);
            } catch (ex) {
                //console.warn(+new Date(), 'smartPriorityPortInit/smartPortInit/innerInit/reconnect', 'EXCEPTION', ex, name);
            }
        }

        function innerInit(msgingName, callback) {
            // Always put in waiting queue
            if (typeof callback === "function") {
                callbacks.push(callback);
            }

            // If connection is set, we have already run init once and can't run it again
            if (connection) { return; }

            function onConnect_Handler(portConnection) {
                if (isEstablished) { return; }
                connection = portConnection;
                connection.onMessage.addListener(onMessageRecieve);
                // We know connection is established since BS initiated the connection.
                onEstablished();
            }


            // If we load before backstage, backstage will connect to us
            chrome.extension.onConnect.addListener(onConnect_Handler);

            // If we load after backstage, we connect
            connect(msgingName);

            setTimeout(function reconnect() {
                //console.log(+new Date(), 'smartPriorityPortInit/smartPortInit/innerInit/reconnect', 'is connected?', msgingName);
                if (!connection) {
                    //console.warn(+new Date(), 'smartPriorityPortInit/smartPortInit/innerInit/reconnect', 'not connected', msgingName);
                    connect(msgingName);
                    setTimeout(reconnect, reconnect_delay);
                    return;
                }
                //console.log(+new Date(), 'smartPriorityPortInit/smartPortInit/innerInit/reconnect', 'connected', msgingName);
            }, reconnect_delay);
        }

        var runner = function (msgingName, callback) {
            if (typeof msgingName !== 'string' || typeof callback !== "function") { return false; }

            if (isEstablished) {
                setTimeout(function () {
                    callback(connection);
                }, 0);
            } else {
                innerInit.apply(this, arguments);
            }
        };
        return runner;
    } ());


    // PriorityPort will wait for the smartPort and save all actions in a queue. when the smartPort connects, it will 
    // perform all cached actions by priority. once smartPort connects, all new actions are executed immediately
    var priorityPortInit = (function () {
        var cached;

        function init(msgingName) {
            var connection = null;
            var sendQueues = [];
            var onConnectAddLisQueue = [];
            var releaseQueue;
            var onMessageRecieve;

            // Init connection (async)
            smartPortInit(msgingName, function (conn) {
                connection = conn;

                // add pending onMessage.addListeners
                onConnectAddLisQueue.forEach(function (curr) {
                    try {
                        connection.onMessage.addListener.apply(connection.onMessage, curr);
                    } catch (e) { console.error(e); }
                });

                // Release send message queues by priority
                sendQueues.forEach(releaseQueue);
            });

            releaseQueue = function (queue) {
                queue.forEach(function (curr) {
                    try {
                        curr.connectionName = connection.name;
                        connection.postMessage(curr);
                    } catch (e) { console.error(e); }
                });
            };

            return {
                onMessage: {
                    addListener: function () {
                        if (connection) {
                            connection.onMessage.addListener.apply(connection.onMessage, arguments);
                        } else {
                            onConnectAddLisQueue.push(arguments);
                        }
                    }
                },
                postPriorityMessage: function (prio, msg) {
                    if (!msg) { return; }

                    if (connection) {
                        if (typeof msg === "object") {
                            msg.connectionName = connection.name;
                        }
                        connection.postMessage(msg);
                    } else {
                        prio = isNaN(prio) ? 0 : Math.max(Math.floor(prio), 10);
                        sendQueues[prio] = sendQueues[prio] || [];
                        sendQueues[prio].push(msg);
                    }
                },
                postMessage: function (msg) {
                    this.postPriorityMessage(0, msg);
                }
            }
        }

        return function (msgingName) {
            if (typeof msgingName !== 'string') { return false; }

            cached = cached || init(msgingName);
            return cached;
        };
    } ());


    return priorityPortInit;
} ());



var messagingBusInit = (function () {
    var inited;
    var messagingObj;

    function initMessaging(msgingName, viewId) {
        if (inited) { return; }
        inited = true;

        msgingName = typeof (msgingName) === 'string' ? msgingName : "front_";
        viewId = (typeof (viewId) === 'string' || typeof (viewId) === 'number') ? viewId : undefined;

        var smartPrioPort = smartPriorityPortInit(msgingName);
        var callbackMap = {};
        var topics = {};
        var handlers;

        smartPrioPort.onMessage.addListener(function (message) {
            if (message.type && handlers[message.type]) {
                message = {
                    data: message
                };
                handlers[message.data.type](message);
            }
        });

        // These are handler functions for messages received from the backstage
        var handlers = {
            "sendRequest": function (event) {
                // somebody sent me a sys request
                var callbackParams;

                // if event.data.sendercbId exists, the sender if expecting a response
                if (event.data && event.data.sendercbId) {
                    var cbId = event.data.sendercbId;

                    var listenerCallback = function (result) {
                        var message = {
                            userData: {
                                data: result
                            },
                            logicalName: cbId, // using the event.data.sendercbId as a logicalName for the response
                            type: "sendRequest",
                            origin: "main"
                        };
                        if (event.data.extraData) {
                            message.extraData = event.data.extraData;
                        }

                        smartPrioPort.postMessage(message);
                    };
                    callbackParams = [event.data.userData.data, event.data.userData.senderName, listenerCallback, event.data.userData.viewId || null];
                } else {
                    callbackParams = [event.data.userData.data, event.data.userData.senderName || null, function () { },
                        event.data.userData.viewId || null
                    ];
                }

                if (callbackMap[event.data.cbId]) {
                    callbackMap[event.data.cbId].callback.apply(this, callbackParams);

                    if (callbackMap[event.data.cbId].deleteOnCall) {
                        delete callbackMap[event.data.cbId];
                    }
                }
            },
            "postTopic": function (event) {
                var item;
                // somebody sent me a postTopic, call my matching postTopic listeners
                if (topics[event.data.topicName]) {
                    for (item in topics[event.data.topicName]) {
                        if (topics[event.data.topicName][item].callback) {
                            topics[event.data.topicName][item].callback.call(null, event.data.data, event.data.senderName);
                        }
                    }
                }
            }
        };


        var generateCallbackId = function () {
            var callbackId = (+new Date()) + "_" + Math.ceil(Math.random() * 5000);

            return (callbackMap[callbackId]) ? generateCallbackId() : callbackId;
        };

        // These are the API functions, perform the actions. eveything waits for connectionEstablished, puts in queue before it is ready
        var doOnTopicMsgAddListener = function (topicName, callback) {
            if (typeof topicName !== 'string' || (callback && typeof callback !== 'function')) {
                return false;
            }

            var cbId = generateCallbackId();

            if (!topics[topicName]) {
                topics[topicName] = {};
            }

            topics[topicName][cbId] = {
                callback: callback,
                deleteOnCall: false
            };

            var message = {
                topicName: topicName,
                cbId: cbId,
                type: "addTopic",
                msgExtraData: {
                    viewId: viewId
                }
            };

            smartPrioPort.postPriorityMessage(0, message);
        };

        var doOnSysReqAddListener = function (strMyLogicalName, callback) {
            if (typeof strMyLogicalName !== 'string' || (callback && typeof callback !== 'function')) {
                return false;
            }

            var message = {
                type: "addListener",
                logicalName: strMyLogicalName,
                cbId: generateCallbackId(),
                msgExtraData: {
                    viewId: viewId
                }
            };

            callbackMap[message.cbId] = {
                callback: callback,
                deleteOnCall: false
            };

            smartPrioPort.postPriorityMessage(0, message);
        };

        var doPostTopicMsg = function (strTopicName, senderLogicalName, data) {
            if (typeof strTopicName !== 'string' || typeof senderLogicalName !== 'string') {
                return false;
            }

            var message = {
                topicName: strTopicName,
                senderName: senderLogicalName,
                data: data,
                type: "postTopic"
            };

            smartPrioPort.postPriorityMessage(1, message);
        };

        var doSendSysReq = function (strDestLogicalName, strDestSenderName, data, callback) {
            if (typeof strDestLogicalName !== 'string' || typeof strDestSenderName !== 'string' || (callback && typeof callback !== 'function')) {
                return false;
            }

            var cbId = generateCallbackId();
            var message = {
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
                callbackMap[message.cbId] = {
                    callback: callback,
                    deleteOnCall: true
                };
            }

            smartPrioPort.postPriorityMessage(1, message);
        };

        return {
            onTopicMsg: {
                addListener: doOnTopicMsgAddListener
            },
            onSysReq: {
                addListener: doOnSysReqAddListener
            },
            postTopicMsg: doPostTopicMsg,
            sendSysReq: doSendSysReq
        };
    }

    return function () {
        messagingObj = messagingObj || initMessaging.apply(this, arguments);
        return messagingObj;
    };
} ());



/***

fileName: readyWrapper.js
description: wraps around a messagingBug (addListerner/postTopic etc) and encapsulates the onReady mechanism:
onReady is a handshake between a frontstage entity and a backstage entity. for example: content script to abstractionLayerBack.js

example usage:
var msgBus = ....
var msgs = new MessagingReadyWrapper(msgBug, 'abslayerback');
msgs.sendSysReq(....);


*/
function MessagingReadyWrapper(messagingBus, name) {
    if (!(this instanceof MessagingReadyWrapper)) {
        return new MessagingReadyWrapper(name);
    }

    // This private proxy encapsulates the onReady mechanism
    var proxy = (function () {
        var queue = [];

        var isReady;
        function onGotReady() {
            if (isReady) { return; }
            isReady = true;

            // Release queue
            queue.forEach(function (item) {
                try {
                    item();
                } catch (e) { console.error(e); }
            });
            queue = [];
        }

        messagingBus.onTopicMsg.addListener(name + '_ready', onGotReady);
        messagingBus.sendSysReq('is_' + name + '_ready?', 'MessagingReadyWrapper:' + name, {}, onGotReady);

        setTimeout(function () {
            if (!isReady) {
                console.warn('MessagingReadyWrapper did not get ready. name: ', name, ', location:', window.location.href);
            }
        }, 8000);

        return {
            // whenReady will callback when ready is established. if already established, calls immediately (synchronous) for convenience reasons
            whenReady: function (callback) {
                if (isReady) {
                    callback();
                } else {
                    queue.push(callback);
                }
            }
        };
    } ());

    this.postTopicMsg = function () {
        var args = arguments;
        proxy.whenReady(function forwardCall() {
            messagingBus.postTopicMsg.apply(messagingBus, args);
        });
    };

    this.sendSysReq = function () {
        var args = arguments;
        proxy.whenReady(function forwardCall() {
            messagingBus.sendSysReq.apply(messagingBus, args);
        });
    };

    // AddListeners are simple forwards, as they don't require ready
    this.onTopicMsg = {
        addListener: messagingBus.onTopicMsg.addListener
    };

    this.onSysReq = {
        addListener: messagingBus.onSysReq.addListener
    };
}


var Consts = (function consts() {
    var apiPermissions =  (function () {
        var TYPE = {
            CROOS_DOMAIN_AJAX: "crossDomainAjax",
            GET_MAIN_FRAME_TITLE: "getMainFrameTitle",
            GET_MAIN_FRAME_URL: "getMainFrameUrl",
            GET_SEARCH_TERM: "getSearchTerm",
            INSTANT_ALERT: "instantAlert",
            JS_INJECTION: "jsInjection",
            SSL_GRANTED: "sslGranted"
        };

        return {
            TYPE: TYPE
        };
    }());

    var consts = (function () {

        var CONTENT_SCRIPT = {
            TOOLBAR_HEIGHT: 320, // 280px for ABST_ATP_TESTER
            BORDER_RADIUS: '5px',
            WRAPPER_DIV_SELECTOR: '#main-iframe-wrapper'
        };

        //#ifndef NPAPI_TESTER
        CONTENT_SCRIPT.TOOLBAR_HEIGHT = 750;
        //#endif 

        //#ifndef ABST_ATP_TESTER
        CONTENT_SCRIPT.TOOLBAR_HEIGHT = 35;
        //#endif

        var POPUPS = {
            POPUP_IFRAME_PARENT_DIV: 'popup_iframe_parent_div_',
            POPUP_INNER_IFRAME: 'popup_inner_iframe',
            VALUE_UNCHANGED: -1,
            GADGET_FRAME_HEADER_HEIGHT: 31,
            GADGET_FRAME_FOOTER_HEIGHT: 5,
            SIDE_SPACE: 2,
            MAXIMUM_POPUP_SIZE: 836,
            IFRAME_HEADER_RIGHT_SECTION_WIDTH: 65,
            OPEN: 'openPopup',
            CLOSE: 'close',
            RESIZE: 'resizePopup',
            CHANGE_POSITION: 'changePosition',
            HIDE: 'hide',
            SHOW: 'show',
            NAVIGATE: 'navigate',
            SET_POPUP_POSITION: 'setPopupsPositionInBg',
            SET_POPUP_SIZE: 'setPopupSize',
            SET_POPUP_FOCUS: 'setPopupFocus',
            WINDOW_CLOSE_FROM_BS: 'windowClose',
            RESET: 'resetPopups',
            CLOSE_ON_EXTERNAL: 'closeOnExternalClick',
            ON_CLOSE_EVENT: 'sendOnCloseEvent'
        };
        var POPUPS_EVENTS = {
            runOldPopupHandlers: true
        };


        //Sockets constants
        var SOCKETS = {
            PORTMAXNUMBER: 65535,
            LISTENER_CONNECTION_ESTABLISHED: "socketRegisterConnect",
            LISTENER_CONNECTION_CLOSED: "socketRegisterClose",
            LISTENER_DATA_RECIEVED: "socketRegisterRecieve",
            LISTENER_SEND_OPERATION: "socketRegisterSend",
            LISTENER_FUNCTION_PREFIX: "__Conduit_Sockets_Listener__"
        };

        var COMPRESSION = {
            CALLBACK_FUNCTION_PREFIX: '__Conduit_Compression_Callback__'
        };

        var TRUE_STRING = 'true';
        var FALSE_STRING = 'false';

        //Window Object constants
        var WINDOWS = {
            INC_SCREEN_HEIGHT: 300,
            DEFAULT_WINDOW_URL: 'about:blank',
            DEFAULT_WINDOW_LEFT: 0,
            DEFAULT_WINDOW_TOP: 0,
            DEFAULT_WINDOW_WIDTH: 800,
            DEFAULT_WINDOW_HEIGHT: 600,
            DEFAULT_WINDOW_TYPE: 'normal',
            DEFAULT_WINDOW_CALLBACK: function (DOMWindow) { },
            CREATE: "createWindow",
            CLOSE: "removeWindow",
            SET_FOCUS: "setWindowFocus",
            CHANGE_POSITION: "changeWindowPosition",
            GET: "getWindowInfo",
            GET_ALL: "getAllWindows",
            GET_SELECTED_WINDOWID: "getSelectedWindowId",
            EVENTS: {
                ONREMOVE: "onRemoveWindow",
                ONCHANGEFOCUS: "onChangeFocusWindow",
                ONCREATED: "onCreateWindow"
            }
        };

        var BROWSER_CONTAINER = {
            BROWSER_CONTAINER_ID_PREFIX: "BrowserContainerIFrameContainer_",
            BCID: "bcId",
            IS_BROWSER_CONTAINER_HASH_MARKER: "CisBrowserContainer",
            DOM_CONTENT_LOADED: "DOMContentLoaded",
            WINDOW_LOAD_EVENT: "load",
            REQUESTS: {
                BC_WINDOW_LOADED: "BCWindowLoaded",
                BC_DOCUMENT_COMPLETE: "BCDocumentComplete",
                FRONT:
                {
                    CHANGE_SIZE: "changeSizeBrowserContainerFront",
                    CHANGE_HEIGHT: "changeBrowserContainerHeightFront",
                    CHANGE_WIDTH: "changeBrowserContainerWidthFront",
                    GET_WIDTH: "getBrowserContainerWidthFront",
                    GET_HEIGHT: "getBrowserContainerHeightFront",
                    REMOVE: "removeBrowserContainerFront",
                    GET_ALL_BROWSERS: "getAllBrowsersContainerFront"
                }
            }
        };

        var MESSAGES = {
            SEND_SYS_REQUEST: "sendSystemRequest",
            ADD_SYS_LISTENER: "addSysReqListener",
            LISTENER_GET_MESSAGE: "listenerGetMessage",
            IS_SYS_REQ_EXIST: "isSysReqExist",
            TYPES: {
                FRONT: "addListenerFront",
                BACK: "addListenerBack"
            },
            SUBSCRIBE_TOPIC: "subscribeForTopic",
            REMOVE_TOPIC_LISTENER: "removeTopicListener",
            POST_TOPIC_MESSAGE: "postTopicMessage",
            TOPIC_GET_MESSAGE: "topicGetMessage",
            X_TB_SUBSCRIBE_TOPIC: "xTbSubscribeForTopic",
            X_TB_POST_TOPIC_MESSAGE: "xTbPostTopicMessage",
            X_TB_TOPIC_GET_MESSAGE: "xTbTopicGetMessage",
            X_TB_IS_SUBSCRIBE_TOPIC: "xTbIsSubscribeForTopic",
            X_TB_TOPIC_GET_MESSAGE_TO_FRONT: "xTbIsSubscribeForTopicToFront",
            X_TB_GET_TAB_ID: "getMyTabId"
        };

        var DIALOGS = {
            ADDED_APP_DIALOG: "addedApp",
            DETECTED_APP_DIALOG: "detectedApp",
            ENGINE_FIRST_TIME_DIALOG: "engineFirstTime",
            SEARCH_PROTECTOR_DIALOG: "searchProtector",
            TOOLBAR_FIRST_TIME_DIALOG: "toolbarFirstTime",
            TOOLBAR_UNTRUSTED_APP_APPROVE_DIALOG: "toolbarUntrustedAppApprove",
            UNTRUSTED_APP_ADDED_DIALOG: "untrustedAppAdded",
            UNTRUSTED_APP_APPROVAL_DIALOG: "UntrustedAppApproval",
            UNTRUSTED_APP_PENDING_DIALOG: "UntrustedAppPending"
        };

        //Tabs Object constants
        var TABS = {
            DEFAULT_TABS_CALLBACK: function () { },
            CREATE: "createTab",
            REMOVE: "removeTab",
            GET_ALL_IN_WINDOW: "getAllInWindow",
            GET_SELECTED: "getSelectedTab",
            NAVIGATE: "navigateTab",
            SETSELECTED: "setSelectedTab",
            EXECUTESCRIPT: "executeScriptOnTab",
            INJECTCSS: "injectCssToTab",
            GET: "getTab",

            EVENTS: {
                ONCREATED: "onCreateTab",
                ONCLOSED: "onCloseTab",
                ONBEFORENAVIGATE: "onBeforeTabNavigate",
                ONTABACTIVATED: "onTabActivated",
                ONDOCUMENTCOMPLETE: "onTabDocumentComplete",
                ONNAVIGATECOMPLETE: "onTabNavigateComplete"
            }
        };

        var STORAGE = {
            ITEM_DATA: 'itemData',
            ITEM_PRIORITY: 'itemPriority',
            PRIORITY: {
                HIGH: 1, // Will never delete objects tagged with this priority
                DISPOSABLE: 2, // Will dispose of these objects when max storage level is reached.
                UNKNOWN: 3 // Default if no priority set. Will not dispose of objects with this priority when max storage level is reached. TBD.
            },
            QUOTA_EXCEEDED_DOM_EXCEPTION: 'QUOTA_EXCEEDED_ERR'
        };

        var REPOSITORY = {
            SET_KEY: 'setKey',
            SET_DATA: 'setData',
            REMOVE_KEY: 'removeKey',
            REMOVE_DATA: 'removeData',
            GET_KEY: 'getKey',
            GET_DATA: 'getData',
            HAS_KEY: 'hasKey',
            HAS_DATA: 'hasData'
        };

        var REGISTRY = {
            UNKNOWN: 0,
            STRING: 1,
            EXPANDSTRING: 2,
            BINARY: 3,
            DWORD: 4,
            MULTISTRING: 7,
            QWORD: 11
        };

        var READY_WRAPPER = {
            CHROME_BACKSTAGE: 'chromeBackstage.js',
            ABS_LAYER_BACK: 'abstractionLayerBack.js'
        };

        return {
            STORAGE: STORAGE,
            REPOSITORY: REPOSITORY,
            TABS: TABS,
            MESSAGES: MESSAGES,
            DIALOGS: DIALOGS,
            BROWSER_CONTAINER: BROWSER_CONTAINER,
            WINDOWS: WINDOWS,
            CONTENT_SCRIPT: CONTENT_SCRIPT,
            POPUPS: POPUPS,
            REGISTRY: REGISTRY,
            TRUE_STRING: TRUE_STRING,
            FALSE_STRING: FALSE_STRING,
            // Defines an empty function, object & array - Use in order to save memory.
            EMPTY_FUNCTION: function () { },
            EMPTY_OBJECT: {},
            EMPTY_ARRAY: [],
            SOCKETS: SOCKETS,
            COMPRESSION: COMPRESSION,
            READY_WRAPPER: READY_WRAPPER
        };
    }());

    if (typeof conduit !== 'undefined') {
        conduit.register("utils.apiPermissions.consts", apiPermissions);
        conduit.register("utils.consts", consts);
    }

    return consts;

} ());

//****  Filename: bcApi.view.js
//****  FilePath: main/js/bcApiComm
//****
//****  Author: Uri Weiler
//****  Date: 6.9.11
//****  Class Name: bcApiView
//****  Type:
//****  Description: Injected into BCAPI pages and handles communication with the publisher page using a hidden DIV.
//****
//****  Copyright: Realcommerce & Conduit.
//****

(function bcApiView() {

    var commandSeperatorChar = "_BCAPI_CMD_SEP_";
    var extensionId = chrome.i18n.getMessage("@@extension_id");

    var oldWindowName; 
    try {
        var context = JSON.parse(window.name);
        oldWindowName = context.name;
    }catch(e){
    	oldWindowName = window.name;
    }
    var loc = window.location.hostname.slice(-15) + '...' + window.location.pathname.slice(-30);
    var messaging = messagingBusInit('bcview_' + loc);
    var cbsMessages = window.cbsMessages = new MessagingReadyWrapper(messaging, Consts.READY_WRAPPER.CHROME_BACKSTAGE);

    // Taken from jQuery impl
    var isPlainObj = function (obj) {
        if (typeof obj !== 'object' || !obj.nodeType) { return false; }
        if (obj.constructor && !hasOwnProperty.call(obj, "constructor") && !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) { return false; }
        var key; for (key in obj) { }
        return key === undefined || hasOwn.call(obj, key);
    }
    // Taken from jQuery impl
    var extend = function extend() {
        var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
        if (typeof target === "boolean") { deep = target; target = arguments[1] || {}; i = 2; }
        if (typeof target !== "object" && typeof (target) !== 'function') { target = {}; }
        for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name]; copy = options[name]; if (target === copy) { continue; }
                    if (deep && copy && (isPlainObj(copy) || (copyIsArray = Array.isArray(copy)))) {
                        if (copyIsArray) { copyIsArray = false; clone = src && Array.isArray(src) ? src : []; } else { clone = src && isPlainObj(src) ? src : {}; }
                        target[name] = extend(deep, clone, copy);
                    } else if (copy !== undefined) { target[name] = copy; }
                }
            }
        } return target;
    };

    // Sends events to BCAPI with event data inside the hidden div.
    var sendEventData = function (hiddenDiv, eventName, eventData, msgSender) {
        var customEvent = document.createEvent('Event');
        customEvent.initEvent(eventName, true, true);

        extend(eventData, msgSender);
        eventData.fromBCView = true;


        if (eventData && eventData.data && (typeof eventData.data.result === 'string' && eventData.data.result.indexOf("_callbackType") !== -1) ||
            ((typeof eventData.data === "string") && eventData.data.indexOf('_callbackType') !== -1)) {
            //console.log("Not sending addSysReqListener response: ", JSON.stringify(eventData), " to hidden div");
        }
        else {
            var eData = JSON.stringify(eventData);
            if (eData) {
                hiddenDiv.innerText = eData + commandSeperatorChar;
                //console.log("BCAPIView: Sending BCAPI data through hidden div: ", eventData); //, " at ", document.location.href);
                hiddenDiv.dispatchEvent(customEvent);
            }
        }
    };

    // Adds a listener for events sent from BCAPI. Event data is found inside hidden div.
    var addEventListener = function (hiddenDiv, eventName, responseEventName, runCallback) {
        hiddenDiv.addEventListener(eventName, function () {
            if (hiddenDiv && hiddenDiv.innerText) {
                traverseHiddenDivContent(hiddenDiv, eventName, responseEventName, runCallback);
            }
        });
    };

    var traverseHiddenDivContent = function (hiddenDiv, eventName, responseEventName, runCallback) {
        try {
            var hiddenDivContent = hiddenDiv.innerText;
            if (hiddenDivContent) {
                var msgsArray = hiddenDivContent.split(commandSeperatorChar);
                //console.log("BCAPIView: Got data from bcapi via hidden div: ", msgsArray);
                hiddenDiv.innerText = "";
                for (var i = 0; i < msgsArray.length; i++) {
                    if (msgsArray[i]) {
                        var __sendMessage = JSON.parse(msgsArray[i]);
                        if (__sendMessage && !__sendMessage.fromBCView) {
                            //console.log("Running callback: ", __sendMessage);
                            runCallback(hiddenDiv, responseEventName, __sendMessage);
                        }
                    }
                }
            }
        }
        catch (generalException) {
            console.error("General Exception in BCAPIVIewComm: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
            console.error(hiddenDiv.innerText);
        }
    };


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

                    // BCAPI expects the raw data for topics. we used to have a modified msging system here that sent it, but we removed it and now we
                    // are just recreating the data as if it was received from the messaging system
                    if (__sendMessage && __sendMessage.data && __sendMessage.data.topicName) {
                        // Wrap a postTopic msg to the BCAPI to mimic how the BCAPI expects it
                        var resp = response;
                        response = {
                            data: resp,
                            origin: "main",
                            senderName: "unknown",
                            topicName: __sendMessage.data.topicName,
                            type: "postTopic"
                        };
                    }
                }

                if (sender && sender !== "nonExistent" && ((typeof sender === 'object') && sender.msgSender !== "nonExistentTopic" || typeof sender === "string")) {
                    sendEventData(hiddenDiv, responseEventName, { data: response, uniqueID: __sendMessage.data.uniqueID }, sender);
                }
            }
            catch (generalException) {
                console.error("General Exception in BCAPIVIewComm: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                console.error(response, __sendMessage);
            }
        };


        if (__sendMessage.action === "sendSystemRequest") {
            var myData = JSON.parse(__sendMessage.data.data);
            var targetMethod = myData && myData.method ? myData.method : "";

            // 29.1.12 - As agreed with Erez, Topic listeners won't work on pages without context (e.g., newly opened windows opened via window.open).
            if (targetMethod && /\.addListener$/.test(targetMethod) && conduit && conduit.currentApp) {
                var context = conduit.currentApp.context ? conduit.currentApp.context : "backgroundPage";
                var listenerInnerName = (conduit.currentApp.appId + "_" + conduit.currentApp.viewId + "_" + context + "_" + targetMethod).replace(/\./g, "_");
                messaging.onTopicMsg.addListener(listenerInnerName, myCallback);
                myData.listenerTopic = listenerInnerName;
                __sendMessage.data.data = JSON.stringify(myData);
            }
        }


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
                case "postTopicMessage":
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


    // Adding global listener for all extension messages. TODO: Performance
    var addExtensionMsgListener = function (hiddenDiv, responseEventName, __sendMessage) {
        if (__sendMessage && (__sendMessage.action === "addSysReqListener" || __sendMessage.action === "subscribeForTopic")) {
            var myCallback = function (request) {
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
                    console.error("General Exception in BCAPIVIewComm: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                    console.error(request, __sendMessage);
                }
            };

            // topicName = Topic Listeners / logicalName = SysReq listeners
            var listenerName = __sendMessage && __sendMessage.data && __sendMessage.data.topicName ? __sendMessage.data.topicName : __sendMessage && __sendMessage.data ? __sendMessage.data.logicalName : "";

            if (listenerName) {
                if (__sendMessage.action === "subscribeForTopic") {
                    messaging.onTopicMsg.addListener(listenerName, myCallback);
                } else if (__sendMessage.action === "addSysReqListener") {
                    messaging.onSysReq.addListener(listenerName, myCallback);
                }
            } else {
                console.error("BCAPIVIew ERROR: no listenerName for message: ", __sendMessage);
            }
        }
        else {
            //console.log("BCAPIVIew: got message in add listener event which isn't to add a listener - ", __sendMessage);
        }
    };

    // Create custom hidden div for chrome comm.
    var createHiddenDiv = function (ctid) {
        var CUSTOM_DIV_ID = "__conduitCustomDiv" + ctid;
        var myCustomDiv = document.getElementById(CUSTOM_DIV_ID);

        // If hidden DIV doesn't exist, creating it.
        if (!myCustomDiv) {
            myCustomDiv = window.document.createElement("div");

            myCustomDiv.setAttribute("id", CUSTOM_DIV_ID);
            myCustomDiv.setAttribute("style", "display:none");
            if (document.head) {
                document.head.appendChild(myCustomDiv);
            }
        } else {
            // Checking if hiddenDiv contains any pending commands on startup...
            traverseHiddenDivContent(myCustomDiv, 'sendSysReqEvent', 'sysReqReceivedEvent', sysReqCallback);
        }

        return myCustomDiv;
    };

    /**
    @description Initializes event listener for BCAPI hidden div changes
    @function init
    */
    var init = function () {
        if (window === window.top && document.location.href.indexOf("facebook/login.html") === -1) {
            return;
        }

        var ranOnce;
        var onHazWindowName = function (windowName) {
            if (ranOnce) { return; }
            ranOnce = true;

            cbsMessages.sendSysReq("getContextAndCTID", "bcApi.view.js", { windowName: windowName || oldWindowName }, function (response) {
                conduit.currentApp = response && response.context ? response.context : '';

                var addEBGlobalKeyChangedHandler = function () {
                    messaging.onTopicMsg.addListener("adv:EBGlobalKeyWasChanged", function (data) {
                        if (typeof data === 'string') {
                            try {
                                data = JSON.parse(data);
                            }
                            catch (e) {
                                console.error("ERROR Parsing data in: ", data, " inside EBGlobalKeyWasChanged message", e);
                                return;
                            }
                        }

                        var keyName = data.keyName;
                        var keyValue = data.keyValue;

                        var checkEBGlobalKeyChangedScript = document.createElement('SCRIPT');
                        if (checkEBGlobalKeyChangedScript) {
                            checkEBGlobalKeyChangedScript.text = "if (typeof EBGlobalKeyChanged === 'function') {var EBGlobalKeyChangedWrapper = function(myKey, myValue) {EBGlobalKeyChanged(unescape(myKey), unescape(myValue))}; EBGlobalKeyChangedWrapper('" + escape(keyName) + "', '" + escape(keyValue) + "');}";
                            document.documentElement.appendChild(checkEBGlobalKeyChangedScript);
                        }
                    });
                };

                // Running BCAPI View injected script only inside iframes (i.e. publisher pages), not inside main page (- that's Toolbar API).
                var initListeners = function () {
                    data = response && response.ctid ? response.ctid : '';
                    var myCustomDiv = createHiddenDiv(data ? data : "_NOAPPID");

                    // Listening for sendSysRequests
                    addEventListener(myCustomDiv, 'sendSysReqEvent', 'sysReqReceivedEvent', sysReqCallback);

                    // Listening for add listener request.
                    addEventListener(myCustomDiv, 'addListenerEvent', 'listenerAddedEvent', addExtensionMsgListener);

                    // Speical listener for EBGlobalKeyChanged
                    addEBGlobalKeyChangedHandler();
                };

                var inited;
                var initIfDivExists = function initIfDivExists() {
                    if (inited) { return; }
                    if (document.getElementById("__conduitCustomDiv" + (response && response.ctid || ''))) {
                        initListeners();
                        inited = true;
                        return true;
                    }
                };

                if (!initIfDivExists()) {
                    document.addEventListener('BCApiHiddenDivReady', initIfDivExists, false);
                    document.addEventListener('DOMContentLoaded', initIfDivExists, false);
                }
            });
        };

        // Try to get popupId from window name
        var indicator = "___" + extensionId;
        var popupId = oldWindowName.indexOf(indicator) !== -1 && oldWindowName.split(indicator)[0];

        // If found, init
        if (popupId) {
            onHazWindowName();
        }

        // If not found, get it from parent
        else {
            // Listen for a response that gives us our popupId from parent
            // (This code runs in the child iframe that needs to get window name from parent)
            window.addEventListener('message', function updatePopupId(msg) {
                if (msg.data.yourPopupId && msg.data.name) {
                    // Update content script context
                    popupId = msg.data.name ? msg.data.name.replace("___" + extensionId, "") : popupId;
                    window.removeEventListener('message', updatePopupId);
                    msg.stopImmediatePropagation();

                    // Update page context (BCAPI)
                    var script = document.createElement('script');
                    script.innerHTML = '(function() { window.conduitWindowName = "' + msg.data.name + '"; }());';
                    document.documentElement.appendChild(script);
                    document.documentElement.removeChild(script);

                    // I can haz window name (init)
                    onHazWindowName(msg.data.name);
                }
            });
        }

        // (Injected) Give child iframes our popupId, and ask our parent for the popupId if needed. also set smartbar indicator for BCAPI (to identify we're SB)
        // This code runs in both the parent that has the window name and the child iframe that needs the window name from the parent
        // (This is because the messaging must be between 2 page contexts)
        function injUpdatePopupId() {
            window.conduitSmartBarIndicator = 1;

            if (window.parent !== window.top) {
                window.addEventListener('message', function (msg) {
                    // This code runs inside the parent, sends its window name to the child iframe
                    if (msg.data.whatsMyPopupId && msg.source) {
                        msg.source.postMessage({ yourPopupId: true, name: window.conduitWindowName || oldWindowName }, '*');
                        msg.stopImmediatePropagation();
                    }
                });
            }

            if (window.parent.parent !== window.top && UPDATEPOPUPID) {
                // This code runs inside the child iframe if it needs to update the window name
                // Gets name directly if same origin, or sends message if not from same origin
                var nameOfParent = window.parent.conduitWindowName || window.parent.name;
                if (nameOfParent && nameOfParent.indexOf('INDICATOR') !== -1) {
                    // Update page context (BCAPI)
                    window.conduitWindowName = nameOfParent;

                    // Update content script context (it will grab the value of this attribute, this happens synchronously)
                    document.documentElement.setAttribute('data-conduitWindowName', nameOfParent);
                } else {
                    window.parent.postMessage({ whatsMyPopupId: true }, '*');
                }
            }
        }

        var script = document.createElement('script');
        script.innerHTML = '(' + injUpdatePopupId.toString().replace('UPDATEPOPUPID', !popupId).replace('INDICATOR', indicator) + '());';
        document.documentElement.appendChild(script);
        document.documentElement.removeChild(script);

        // If we got window name from parent on same origin, the window name will be present on this attribute
        var windowNameFromInjectedScript = document.documentElement.getAttribute('data-conduitWindowName') || '';
        if (windowNameFromInjectedScript) {
            popupId = windowNameFromInjectedScript.split(indicator)[0];
            document.documentElement.removeAttribute('data-conduitWindowName');
            onHazWindowName(windowNameFromInjectedScript);
        }

        // Run inside popup iframes only   
        // Handle all the clicks in the document

        var onClick = function () {
            if (popupId) {
                var message = {
                    method: 'focusPopup',
                    popupID: popupId
                };
                messaging.sendSysReq(extensionId, 'bcApi.view.js', message, function (result) { });
            }
        };
        document.addEventListener('click', onClick, false);

        // Adding close on external click handlers to all iframes...
        document.addEventListener('DOMContentLoaded', function () {
            document.body.addEventListener('mousedown', function () {
                messaging.sendSysReq('popups.events', 'contentScript_closeExternalPopus', { type: "closeOnExternalClick", data: { 'popupId': popupId} }, function () { });
            }, false);
        }, false);
    };

    init();

    return {};
} ());

