//
// Copyright © Conduit Ltd. All rights reserved.
// This software is subject to the Conduit license (http://hosting.conduit.com/EULA/).
//
// This code and information are provided 'AS IS' without warranties of any kind, either expressed or implied, including, without limitation, // to the implied warranties of merchantability and/or fitness for a particular purpose.
//
//

//#ifdef DBG
try {
//#endif 
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


/******

Serves 2 purposes:
1. A wrapper around chrome port for passing messages to the backstage, used by messages.front.js(same window) and frontMessagingBus.js(iframes inside the toolbar) 
2. Does not send to backstage actions that can be completed within the frontStage (a sendSysReq between 2 entities within the toolbar itself)
*/



var Communicator = (function () {
    var innerScopeListeners = {}; //listeners added in same scope
    var innerScopeTopics = {};
    var smartPrioPort;
    var globalViewId;

    // commands are handling of action requests by entities in this front
    var commands = {
        "addTopic": function (event) {
            if (!event.data || !event.data.topicName) {
                return;
            }

            if (!innerScopeTopics[event.data.topicName]) {
                innerScopeTopics[event.data.topicName] = [];
            }

            innerScopeTopics[event.data.topicName][event.data.cbId] = { cbId: [event.data.cbId], origin: event.origin, targetWindow: event.source, sameWindowCallback: event.data.sameWindowCallback };

            var message = { type: "addTopic", topicName: event.data.topicName };
            smartPrioPort.postPriorityMessage(0, message);
        },
        "postTopic": function (event) {
            var message = {
                cbId: null,
                data: event.data.data,
                senderName: event.data.senderName,
                type: "sendRequest",
                origin: "main"
            };

            var subscriberObject = null;


            message.topicName = event.data.topicName;
            message.type = "postTopic";
            smartPrioPort.postPriorityMessage(1, message);
                
            return true;
        },
        "addListener": function (event) {
            if (!event.data || !event.data.logicalName || !event.data.cbId) return;

            innerScopeListeners[event.data.logicalName] = { cbId: event.data.cbId, targetWindow: event.source, origin: event.origin, sameWindowCallback: event.data.sameWindowCallback }

            var message = {
                cbId: event.data.cbId,
                logicalName: event.data.logicalName,
                type: "addListener",
            };

            smartPrioPort.postPriorityMessage(0, message);
        },
        "sendRequest": function (event) {
            if (!event.data) return;

            if (event.data.cbId) { // meaning we expecting response
                innerScopeListeners[event.data.cbId] = { cbId: event.data.cbId, targetWindow: event.source, origin: event.origin, sameWindowCallback: event.data.sameWindowCallback }
            }

            var data;
            var senderName;



            if (event.data.userData && event.data.userData.data) {
                data = event.data.userData.data;
            } else if (event.data.data) {
                data = event.data.data;
            } else {
                data = "";
            }

            if (event.data.userData && event.data.userData.senderName) {
                senderName = event.data.userData.senderName;
            } else if (event.data.senderName) {
                senderName = event.data.senderName;
            } else {
                senderName = "";
            }


            var message = {
                origin: "main",
                userData: {
                    senderName: senderName,
                    data: data,
                    viewId: globalViewId
                },
                sendercbId: (event.data.cbId || null),
                type: "sendRequest"
            };

            var windowToSend = null;
            var sameWindowCallback = null;
            // Attempt to find the target inside this front. if we find it, we don't have to send it to the backstage
            if (innerScopeListeners[event.data.logicalName]) { 
                message.cbId = innerScopeListeners[event.data.logicalName].cbId || null;

                if (message.cbId) {
                    windowToSend = innerScopeListeners[event.data.logicalName].targetWindow || null;
                    sameWindowCallback = innerScopeListeners[event.data.logicalName].sameWindowCallback || null;
                    if (windowToSend) {
                        windowToSend.postMessage(message, innerScopeListeners[event.data.logicalName].origin);
                    }
                    if (sameWindowCallback) {
                        sameWindowCallback({ data: message });
                    }
                }
            }
            else {
                // we don't know the target, let the backstage communicator handle it
                message.logicalName = event.data.logicalName;
                smartPrioPort.postPriorityMessage(1, message);
            }
        }
    };

    // outerMessagingCommands are handlers for messages(requests/topics, listeners are not applicable) received from the backstage
    var outerMessagingCommands = {
        "sendRequest": function (message) {
            if (!message) return;

            var windowToSend = null;
            var sameWindowCallback = null;

            message.userData.viewId = globalViewId;

            if (message.logicalName && innerScopeListeners[message.logicalName]) { //logicalName must be exists
                message.cbId = innerScopeListeners[message.logicalName].cbId || null;

                windowToSend = innerScopeListeners[message.logicalName].targetWindow || null;
                sameWindowCallback = innerScopeListeners[message.logicalName].sameWindowCallback || null;
                if (windowToSend) {
                    windowToSend.postMessage(message, innerScopeListeners[message.logicalName].origin);
                }
                if (sameWindowCallback) {
                    sameWindowCallback({ data: message });
                }
            }

            return true;
        },
        "postTopic": function (message) {
            var topicMessage = {
                cbId: null,
                data: message.data,
                senderName: message.senderName,
                type: "sendRequest",
                origin: "main"
            };

            var subscriberObject = null;

            if (innerScopeTopics && innerScopeTopics[message.topicName]) {
                for (var subcriber in innerScopeTopics[message.topicName]) {
                    subscriberObject = innerScopeTopics[message.topicName][subcriber];

                    topicMessage.cbId = subscriberObject.cbId || null;

                    if (topicMessage.cbId && subscriberObject.targetWindow) {
                        subscriberObject.targetWindow.postMessage(topicMessage, subscriberObject.origin);
                    }
                    if (topicMessage.cbId && subscriberObject.sameWindowCallback) {
                        subscriberObject.sameWindowCallback({ data: topicMessage });
                    }
                }

                delete subscriberObject, topicMessage;
            }

            return true;
        }
    };

    function onMessageRecieve(message) {
        if (!message || !message.type || !outerMessagingCommands[message.type]) {
            return false;
        }

        return outerMessagingCommands[message.type](message);
    };

    function handleInnerMessaging(event) {
        if (!event.data && !event.data.type || !commands[event.data.type]) {
            return false;
        }

        return commands[event.data.type](event);
    };

    function handleSameWindowMessaging(data, callback) {
        if (!data && !data.type || !commands[data.type]) {
            return false;
        }

        data.sameWindowCallback = callback;
        return commands[data.type]({ data: data });
    };

    
    // Init
    globalViewId = window.parent.globalViewId;
    smartPrioPort = smartPriorityPortInit("communicator.front.js_" + Math.random() * 5000);
    smartPrioPort.onMessage.addListener(onMessageRecieve);
    window.addEventListener("message", handleInnerMessaging);

    return {
        handleSameWindowMessaging: handleSameWindowMessaging 
    };
}());

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


conduit.register("abstractionlayer.utils.errors", new function () {
    var errorsList = [];

    var init = function () {
        errorsList._1101 = { result: '', status: 1101, description: 'Requested file does not exist' };
        errorsList._1107 = { result: '', status: 1107, description: 'Type parameter is not valid' };
        errorsList._1110 = { result: '', status: 1110, description: 'There are invalid characters in input parameters' };
        errorsList._1111 = { result: '', status: 1111, description: 'The given path is not a directory' };
        errorsList._1112 = { result: '', status: 1112, description: 'The given path directory already exist' };
        errorsList._1113 = { result: '', status: 1113, description: 'The path is a directory and not a file' };
        errorsList._1114 = { result: '', status: 1114, description: 'Directory not exists' };
        errorsList._1115 = { result: '', status: 1115, description: 'The destination file already exist' };
        errorsList._1116 = { result: '', status: 1116, description: 'Source directory and destination  Directory dose not exists.' };
        errorsList._1117 = { result: '', status: 1117, description: 'Access denied' };
        errorsList._1118 = { result: '', status: 1118, description: 'Access denined for writing' };
        errorsList._1119 = { result: '', status: 1119, description: 'action failed, please check validity of destination path and disk space' };
        errorsList._1120 = { result: '', status: 1120, description: 'Failed Path Regex Test' };

        errorsList._1200 = { result: '', status: 1200, description: 'the requested key doesn\'t exist' };
        errorsList._1201 = { result: '', status: 1201, description: 'Unsupported function for this platform' };
        errorsList._1202 = { result: '', status: 1202, description: 'Root path is invalid' };
        errorsList._1203 = { result: '', status: 1203, description: 'Root path doesn\'t exist' };
        errorsList._1204 = { result: '', status: 1204, description: 'Illegal sub path name' };
        errorsList._1205 = { result: '', status: 1205, description: 'Illegal type' };
        errorsList._1206 = { result: '', status: 1206, description: 'Illegal key name' };
        errorsList._1207 = { result: '', status: 1207, description: 'Insufficient permission to act' };
        errorsList._1208 = { result: '', status: 1208, description: 'Value doesn\'t match type' };
        errorsList._1209 = { result: '', status: 1209, description: 'Key doesn\'t exist' };
        /*****************************duplicated error codes******************************/
        errorsList._1203 = { result: '', status: 1203, description: 'Root path doesn\'t exist' }; //'Illgeal postparams data'
        errorsList._1204 = { result: '', status: 1204, description: 'Illegal sub path name' }; //'Illegal headers data'
        /*****************************duplicated error codes******************************/

        errorsList._1301 = { result: '', status: 1301, description: 'URI is not in proper format' };
        errorsList._1302 = { result: '', status: 1302, description: 'Paramter must be GET / POST' };
        errorsList._1303 = { result: '', status: 1303, description: 'Illegal postParams data' };
        errorsList._1304 = { result: '', status: 1304, description: 'Illegal headers data' };
        errorsList._1305 = { result: '', status: 1305, description: 'Missing Post data' };


        errorsList._1500 = { result: '', status: 1500, description: 'No permissions to create new window' };
        errorsList._1501 = { result: '', status: 1501, description: 'No permissions to close window' };
        errorsList._1502 = { result: '', status: 1502, description: 'Window does not exist' };
        errorsList._1505 = { result: '', status: 1505, description: 'Bad Integer Value for window' };
        errorsList._1506 = { result: '', status: 1506, description: 'Bad URI format' };
        errorsList._1507 = { result: '', status: 1507, description: 'Must be positive value' };
        errorsList._1508 = { result: '', status: 1507, description: 'If differs from -1, must be screen max size' };
        	
        errorsList._1550 = { result: '', status: 1550, description: 'Tab does not exist' };
        errorsList._1555 = { result: '', status: 1555, description: 'Callback function is empty' };
        
        errorsList._1900 = { result: '', status: 1900, description: 'Listener name must contain a value before trying to add a listener' };
        errorsList._1901 = { result: '', status: 1901, description: 'Listener must be registered with a callback function' };
        errorsList._1902 = { result: '', status: 1902, description: 'There is already a listener with the same name registered in the message bus' };
        errorsList._1903 = { result: '', status: 1903, description: 'Listener id dose not exists in the message bus.' };
        errorsList._1904 = { result: '', status: 1904, description: 'sender name is null or empty' };
        
        errorsList._2100 = { result: '', status: 2100, description: 'Illegal Browser URI' };
        errorsList._2101 = { result: '', status: 2101, description: 'BrowserID already exists' };
        errorsList._2102 = { result: '', status: 2102, description: 'API Permissions object incorrect' };
        errorsList._2103 = { result: '', status: 2103, description: 'BrowserID doesn\'t exist' };
        errorsList._2103 = { result: '', status: 2103, description: 'BrowserID doesn\'t exist' };

        //idle
        errorsList._2600 = { result: '', status: 2600, description: 'invalid integer' };

        // Popups
        errorsList._2800 = { result: '', status: 2800, description: 'URI is invalid' };
        errorsList._2801 = { result: '', status: 2801, description: 'Popup doesn\'t exist' };
        errorsList._2802 = { result: '', status: 2802, description: 'Invalid width' };
        errorsList._2803 = { result: '', status: 2803, description: 'Invalid height' };
        errorsList._2804 = { result: '', status: 2804, description: 'Invalid top' };
        errorsList._2805 = { result: '', status: 2805, description: 'Invalid left' };

        errorsList._2200 = { result: '', status: 2200, description: 'Dedicated Key doesn’t exist' };

        //repository
        errorsList._2400 = { result: '', status: 2400, description: 'Key doesn\'t exist' };
        errorsList._2401 = { result: '', status: 2401, description: 'Key doesn\'t exist' };

        errorsList._4200 = { result: '', status: 4200, description: 'Cookie doesn\'t exist' };
        errorsList._4201 = { result: '', status: 4201, description: 'Insufficient permissions to write/remove cookie' };
        errorsList._4202 = { result: '', status: 4202, description: 'Invalid domain Uri' };

        errorsList._4301 = { result: '', status: 4301, description: 'Hash encryption applies check' };
        errorsList._4300 = { result: '', status: 4300, description: 'Decryption applies check' };
        errorsList._4302 = { result: '', status: 4302, description: 'Legit type' };
        errorsList._4303 = { result: '', status: 4303, description: 'Legit charset' };

        //socket  
        errorsList._4700 = { result: '', status: 4700, description: 'Invalid server path' };
        errorsList._4701 = { result: '', status: 4701, description: 'Invalid port' };
        errorsList._4702 = { result: '', status: 4702, description: 'Connection doesn\'t exist' };

        errorsList._9000 = { result: '', status: 9000, description: 'Parameter is null' };
        errorsList._9001 = { result: '', status: 9001, description: 'Async callback is null' };
        errorsList._9999 = { result: '', status: 9999, description: 'unknown error' };

        //on success
        errorsList._0 = { result: false, status: 0, description: '' };
        errorsList._1 = { result: true, status: 0, description: '' };

    };

    var get = function (errorCode) {
        var errorCodeStr = "_" + errorCode;

        if (!errorsList[errorCodeStr]) {
            return errorsList._9999;6
        } else {
            return errorsList[errorCodeStr];
        }
    };

    init();

    return {
        get: get
    };
});
var Errors = conduit.abstractionlayer.utils.errors;
    

//****  Filename: general.js
//****  FilePath: main/js/utils
//****
//****  Author: Everybody
//****  Date: 20.2.11
//****  Class Name: General Utils
//****  Description: Various general common utilities
//****
//****  Copyright: Realcommerce & Conduit.
//****

conduit.register("abstractionlayer.utils.general", new function () {

    // Description: the uri method check if it's a valid url external (WWW) or internal (chrome-extension) (PUBLIC)
    // it can get 'full' for both and network just WWW
    // Param : Url a string of the question url
    //         type the type of the validations
    // Example : chrome-extension://nnogjnbecgcgekeobeaeoffiejbhckdj/js/items/multiRssitem/view/multiRssitem.html
    //              http://www.test.com

    var isBackstage = false;

    var init = function () {
        try {
            chrome.tabs.sendRequest;
            isBackstage = true;
        } catch (FrontstageException) {
        }
    };

    var uri = function (strUrl) {
        if (strUrl.indexOf("javascript:") == 0 || strUrl.indexOf("chrome-extension://") == 0 || strUrl == "about:blank" || strUrl.indexOf("mms://") == 0 || (strUrl && strUrl.toLowerCase().indexOf("xfire://") == 0)) {
            return true;
        }


        // trim left space
        strUrl = strUrl.replace(/^\s+|\s+$/g, "");
        //if checking a url of a popup with query string - check only the url that the publisher gave and not the query string we add
        strUrl = strUrl.replace(/#appData(.*)/, "");
        //strUrl = decodeURI(strUrl);
        strUrl = strUrl.replace('://localhost', '://127.0.0.1');

        var networkRegx = /(^https?|chrome\-extension|ftp):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

        var networkRegxUrl = new RegExp(networkRegx);

        if (strUrl.indexOf(".") == -1) {
            return false;
        }
        if (networkRegxUrl.test(strUrl.split('?')[0])) {
            return true;
        } else {
            var err = "abstractionlayer.utils.general.uri(strUrl): The URL: " + strUrl + " - failed RegExp testing!";
            return false;
        }
    };

    // Description: the checkStringParams method check validation of query string parameters (PUBLIC)
    // Param : strParams a string of the question query string
    //Example : name=value&something=123
    var checkStringParams = function (strParams) {

        try {
            strParams = decodeURI(strParams);
        } catch (e) {

        }
        
        // trim left space
        strParams = strParams.replace(/^\s+|\s+$/g, "");

        var keyValueRegx = "^([0-9a-zA-Z]+=[-0-9a-zA-Z_:@&?=+,.!/~+$%]*&{0,1})*"; //"[^(\&)](\w*)+(\=)[\w\d ]*"

        var keyValueRegxUrl = new RegExp(keyValueRegx);

        if (keyValueRegxUrl.test(strParams)) {
            return true;
        } else {
            var err = "abstractionlayer.utils.general.checkStringParams(strParams): The params: " + strParams + " - failed RegExp testing!";
            return false;
        }
    };

    // Description: Adds http:// to a url if it doesn't exist at the begining of the url (to conform with FF, IE, and users which forget http...) + (PUBLIC)
    // Trims trailing and leading whitespaces from a url.
    // if https, ftp or chrome-extension exist, leaves them.
    // Param : url to add http:// to 
    // Example : addHTTPToUrl('www.yahoo.com') will return 'http://www.yahooo.com'
    var addHTTPToUrl = function (url) {
        var urlStartRegx = "(^https?|chrome\-extension|ftp)\\://";
        var myRegxUrl = new RegExp(urlStartRegx);

        // Trimming url leading and trailing spaces.
        var finalUrl = url.replace(/^\s+|\s+$/g, "");

        // If no http, https, ftp etc. exists in url
        if (!myRegxUrl.test(url)) {
            finalUrl = 'http://' + finalUrl;
        }

        return finalUrl;
    }

    // Description: the diractory name of the extension for repository usage;
    var dirName = function(){ return chrome.i18n.getMessage("@@extension_id");};


    init();


    return {
        uri: uri,
        checkStringParams: checkStringParams,
        addHTTPToUrl: addHTTPToUrl,
        dirName: dirName,
        isBackstage: isBackstage
    };
});

var General = conduit.abstractionlayer.utils.general;

//****  Filename: JSONStringify.js
//****  FilePath: main/js/utils
//****
//****  Author: Thomas Frank
//****  Date: 20.2.11
//****  Class Name: JSONStringify
//****  Description: Creates a JSON object from a string and vice versa.
//****
//****  Example: var myNewJSONObject = JSONString.toObject(myString);
//****  Example2: var myNewString = JSONString.toJsonStringArray(myObject);
//****
//****  Copyright: Realcommerce & Conduit.
//****

/*
JSONstring v 1.02
copyright 2006-2010 Thomas Frank
(Small sanitizer added to the toObject-method, May 2008)
(Scrungus fix to some problems with quotes in strings added in July 2010)

This EULA grants you the following rights:

Installation and Use. You may install and use an unlimited number of copies of the SOFTWARE PRODUCT.

Reproduction and Distribution. You may reproduce and distribute an unlimited number of copies of the SOFTWARE PRODUCT either in whole or in part; each copy should include all copyright and trademark notices, and shall be accompanied by a copy of this EULA. Copies of the SOFTWARE PRODUCT may be distributed as a standalone product or included with your own product.

Commercial Use. You may sell for profit and freely distribute scripts and/or compiled scripts that were created with the SOFTWARE PRODUCT.

http://www.thomasfrank.se/json_stringify_revisited.html

Based on Steve Yen's implementation:
http://trimpath.com/project/wiki/JsonLibrary

Sanitizer regExp:
Andrea Giammarchi 2007
*/

JSONstring = {
        compactOutput: false,
        includeProtos: false,
        includeFunctions: false,
        detectCirculars: true,
        restoreCirculars: true,
        make: function (arg, restore) {
            this.restore = restore;
            this.mem = []; this.pathMem = [];
            return this.toJsonStringArray(arg).join('');
        },
        toObject: function (x) {
            if (!this.cleaner) {
                try { this.cleaner = new RegExp('^("(\\\\.|[^"\\\\\\n\\r])*?"|[,:{}\\[\\]0-9.\\-+Eaeflnr-u \\n\\r\\t])+?$') }
                catch (a) { this.cleaner = /^(true|false|null|\[.*\]|\{.*\}|".*"|\d+|\d+\.\d+)$/ }
            };
            try {
                if (!this.cleaner.test(x)) { return {} };
            } catch (e) { console.error('JSONstring error: RegExp to big, ', e); }
            eval("this.myObj=" + x);
            if (!this.restoreCirculars || !alert) { return this.myObj };
            if (this.includeFunctions) {
                var x = this.myObj;
                for (var i in x) {
                    if (typeof x[i] == "string" && !x[i].indexOf("JSONincludedFunc:")) {
                        x[i] = x[i].substring(17);
                        eval("x[i]=" + x[i])
                    }
                }
            };
            this.restoreCode = [];
            this.make(this.myObj, true);
            var r = this.restoreCode.join(";") + ";";
            eval('r=r.replace(/\\W([0-9]{1,})(\\W)/g,"[$1]$2").replace(/\\.\\;/g,";")');
            eval(r);
            return this.myObj
        },
        toJsonStringArray: function (arg, out) {
            if (!out) { this.path = [] };
            out = out || [];
            var u; // undefined
            switch (typeof arg) {
                case 'object':
                    this.lastObj = arg;
                    if (this.detectCirculars) {
                        var m = this.mem; var n = this.pathMem;
                        for (var i = 0; i < m.length; i++) {
                            if (arg === m[i]) {
                                out.push('"JSONcircRef:' + n[i] + '"'); return out
                            }
                        };
                        m.push(arg); n.push(this.path.join("."));
                    };
                    if (arg) {
                        if (arg.constructor == Array) {
                            out.push('[');
                            for (var i = 0; i < arg.length; ++i) {
                                this.path.push(i);
                                if (i > 0)
                                    out.push(',\n');
                                this.toJsonStringArray(arg[i], out);
                                this.path.pop();
                            }
                            out.push(']');
                            return out;
                        } else if (typeof arg.toString != 'undefined') {
                            out.push('{');
                            var first = true;
                            for (var i in arg) {
                                if (!this.includeProtos && arg[i] === arg.constructor.prototype[i]) { continue };
                                this.path.push(i);
                                var curr = out.length;
                                if (!first)
                                    out.push(this.compactOutput ? ',' : ',\n');
                                this.toJsonStringArray(i, out);
                                out.push(':');
                                this.toJsonStringArray(arg[i], out);
                                if (out[out.length - 1] == u)
                                    out.splice(curr, out.length - curr);
                                else
                                    first = false;
                                this.path.pop();
                            }
                            out.push('}');
                            return out;
                        }
                        return out;
                    }
                    out.push('null');
                    return out;
                case 'unknown':
                case 'undefined':
                case 'function':
                    if (!this.includeFunctions) { out.push(u); return out };
                    arg = "JSONincludedFunc:" + arg;
                    out.push('"');
                    var a = ['\\', '\\\\', '\n', '\\n', '\r', '\\r', '"', '\\"']; arg += "";
                    for (var i = 0; i < 8; i += 2) { arg = arg.split(a[i]).join(a[i + 1]) };
                    out.push(arg);
                    out.push('"');
                    return out;
                case 'string':
                    if (this.restore && arg.indexOf("JSONcircRef:") == 0) {
                        this.restoreCode.push('this.myObj.' + this.path.join(".") + "=" + arg.split("JSONcircRef:").join("this.myObj."));
                    };
                    out.push('"');
                    var a = ['\n', '\\n', '\r', '\\r', '"', '\\"'];
                    arg += ""; for (var i = 0; i < 6; i += 2) { arg = arg.split(a[i]).join(a[i + 1]) };
                    out.push(arg);
                    out.push('"');
                    return out;
                default:
                    out.push(String(arg));
                    return out;
            }
        }
    };
   

 
//****  Filename: strings.js
//****  FilePath: main/js/utils
//****
//****  Author: Everybody
//****  Date: 20.2.11
//****  Class Name: Strings
//****  Description: Various general string manipulations. Also contains additions to Javascript's String base type.
//****  Inherits from: No one (Singleton)
//****
//****  Example: var str = Strings.stringTrim("abc     "); --> str == "abc".
//****  Example2: String abc = "<root><link>www.google.com</link></root>"; abc.replaceReservedKeywords(); ---> abc == "<root><linkk>www.google.com</linkk></root>"
//****
//****  Copyright: Realcommerce & Conduit.
//****

conduit.register("abstractionlayer.utils.strings", new function () {

    // stringTrim - trims a string's white spaces from the start and end of the string
    // Scope: Public
    // Param.: stringToTrim
    // Example: var str = Strings.stringTrim("abc     "); --> str == "abc".
    var stringTrim = function (str) {
        if (!str || !str.replace) {
            return null;
        }

        str = str.replace(/^\s+/, '');
        str = str.replace(/\s+$/, '');

        return str;
    };

    // stringFormat: same as C#'s stringFormat.
    // Scope: Public
    // Param.: string text.
    // Example: stringFormat(‘Hello {0} & {1} ‘, ‘John’, ‘Jane’)
    // boundaries:  you can't repeat the placeholder more then once-
    // wrong usage: stringFormat(‘Hello {0} & {0} ‘, ‘John’)
    // right usage: stringFormat(‘Hello {0} & {1} ‘, ‘John’,'John')
    var stringFormat = function (strText) {
        if (strText) {
            if (arguments.length <= 1) { return strText; }
            var replaceString = "";
            for (var i = 0; i < arguments.length - 1; i++) {
                replaceString = "{" + i.toString() + "}";
                strText = strText.replace(replaceString, arguments[i + 1]);
            }
        }

        return strText;
    };
    // replaceReservedKeywords - replace a reserved word in an XML to different words.
    // Scope: Public
    // Param.: none. Prototype of Javascript's String.
    // Example: String abc = "<root><link>www.google.com</link></root>"; abc.replaceReservedKeywords(); ---> abc == "<root><linkk>www.google.com</linkk></root>"
    var initReservedKeywords = function () {
        /// <summary>Init reserved keywords</summary>

        var reservedKeywords = [
            'link',
            'caption',
            'source',
            'command',
            'default'
        ];

        var reservedKeywordsPartInRegex = reservedKeywords[0];
        for (var i = 1; i < reservedKeywords.length; i++) {
            reservedKeywordsPartInRegex += '|' + reservedKeywords[i];
        }

        var reservedKeywordsPattern = stringFormat('(</?)({0})(\\s*/?>)', reservedKeywordsPartInRegex);
        var modifiers = 'ig'; // case insensitive and global

        return new RegExp(reservedKeywordsPattern, modifiers);
    };

    var reservedKeywordsRegex = initReservedKeywords();
    var reservedKeywordsFix = '$1$2__$3';

    String.prototype.replaceReservedKeywords = function () {
        /// <summary>replace reserved keywords in html/xml that interrupt parsing</summary>
        /// <param name="str" type="string">The str to replace the keywords in</param>

        return this.replace(reservedKeywordsRegex, reservedKeywordsFix);
        // Meantime we use this
    };


    return {
        stringTrim: stringTrim,
        stringFormat: stringFormat
    };
});


//(function () {
//    
//    
//})();


//****
//****  filename: date.js
//****  author: guys
//****  date: 10/5/2010 5:37:36 PM
//****  description:
//****  realcommerce & conduit (c)
//****


    /*
    * Date Format 1.2.3
    * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
    * MIT license
    *
    * Includes enhancements by Scott Trenda <scott.trenda.net>
    * and Kris Kowal <cixar.com/~kris.kowal/>
    *
    * Accepts a date, a mask, or a date and a mask.
    * Returns a formatted version of the given date.
    * The date defaults to the current date/time.
    * The mask defaults to dateFormat.masks.default.
    */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
		    val = String(val);
		    len = len || 2;
		    while (val.length < len) {
		        val = "0" + val;
		    }
		    return val;
		};

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) {
            throw SyntaxError("invalid date");
        }

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
			    d: d,
			    dd: pad(d),
			    ddd: dF.i18n.dayNames[D],
			    dddd: dF.i18n.dayNames[D + 7],
			    m: m + 1,
			    mm: pad(m + 1),
			    mmm: dF.i18n.monthNames[m],
			    mmmm: dF.i18n.monthNames[m + 12],
			    yy: String(y).slice(2),
			    yyyy: y,
			    h: H % 12 || 12,
			    hh: pad(H % 12 || 12),
			    H: H,
			    HH: pad(H),
			    M: M,
			    MM: pad(M),
			    s: s,
			    ss: pad(s),
			    l: pad(L, 3),
			    L: pad(L > 99 ? Math.round(L / 10) : L),
			    t: H < 12 ? "a" : "p",
			    tt: H < 12 ? "am" : "pm",
			    T: H < 12 ? "A" : "P",
			    TT: H < 12 ? "AM" : "PM",
			    Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
			    o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
			    S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
} ();

    // Some common format strings
    dateFormat.masks = {
        "default": "ddd mmm dd yyyy HH:MM:ss",
        shortDate: "m/d/yy",
        mediumDate: "mmm d, yyyy",
        longDate: "mmmm d, yyyy",
        fullDate: "dddd, mmmm d, yyyy",
        shortTime: "h:MM TT",
        mediumTime: "h:MM:ss TT",
        longTime: "h:MM:ss TT Z",
        isoDate: "yyyy-mm-dd",
        isoTime: "HH:MM:ss",
        isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
        isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    };

    // Internationalization strings
    dateFormat.i18n = {
        dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
        monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
    };

    // For convenience...
    Date.prototype.format = function (mask, utc) {
        return dateFormat(this, mask, utc);
    };

conduit.register("abstractionlayer.utils.anchorString", new function () {

    // JSDOC function: parsing Logic - Takes the anchorString and splits the values into 'this.keyX'
    // Scope: Public (mainly for Jasmine testing).
    // Example: parseAnchorString('http://www.google.com?a=b&c=d'); should create this.keys.a = b and this.keys.c = d.
    // Param.: classPtr - the anchorstring class to add the key value as objects to.
    // Param.: anchorString - the string to parse.
    var keys = {}; // Json object which will contain anchor string keys and values.
    var parseAnchorString = function (anchorstring) {
        if (isValidAnchorString(anchorstring)) {
            anchorstring = anchorstring.substr(anchorstring.indexOf('#') + 1);

            // Splitting all key=value pairs between & after first '?'.
            if (anchorstring.length > 1) {
                var anchorStringParams = anchorstring.split('&');
                for (var i = 0; i < anchorStringParams.length; i++) {
                    var keyValue = anchorStringParams[i].split('=');
                    keys[keyValue[0]] = keyValue[1];
                }
            }
        }
        else {
            //console.log("Anchorstring " + anchorstring + " didn't match regexp...");
        }
    };

    var isValidAnchorString = function (str) {
        var isValid = false;

        if (str && str != '') {
            var RegexUrl = /([^?=&]+)(=([^&]*))/;
            isValid = RegexUrl.test(str);
        }

        return isValid;
    };

    // Initializing anchor string parsing...
    parseAnchorString(window.location.hash);

    return {
        keys: keys
    };

});

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

conduit.register("abstractionlayer.commons.messages", (function () {
    var Errors = conduit.abstractionlayer.utils.errors;

    var extensionId = chrome.extension.getURL("").replace("chrome-extension://", "").replace("/", "");

    var listeners = {};
    var callbackMap = {};

    var generateCallbackId = function () {
        var callbackId = (+new Date()) + "_" + Math.ceil(Math.random() * 5000);

        return (callbackMap[callbackId]) ? generateCallbackId() : callbackId;
    };

    var successResult = { result: true, status: 0, description: '' };


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

                    function listenerCallback(result) {
                        var message = {
                            data: result,
                            logicalName: cbId, //sender callback id
                            type: "sendRequest"
                        };
                        Communicator.handleSameWindowMessaging(message, messageResponseHandler);
                        //window.postMessage(message, "*");
                    }
                    callbackParams = [event.data.userData.data, event.data.userData.senderName, listenerCallback, event.data.userData.viewId];
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
        }
    };

    var messageResponseHandler = function (messageEvent) {
        if (messageEvent.data && messageEvent.data.origin && messageEvent.data.origin === "main") {
            if (messageEvent.data.type && handlers[messageEvent.data.type]) {
                handlers[messageEvent.data.type](messageEvent);
            }
        }
    };

    //window.addEventListener("message", messageResponseHandler);

    /**
    @description - add sys req
    @function - onSysReqAddListener
    @arg - strMyLogicalName - logical name 
    @arg - callback - callback
    */
    var onSysReqAddListener = function (strMyLogicalName, callback) {
        //if we won't define callback need to define default callback that trigger the request
        if (!callback || typeof callback !== 'function') {
            return Errors.get(1901);
        }

        //check the listener logical name validation
        if (typeof strMyLogicalName !== 'string' || !strMyLogicalName) {
            return Errors.get(1900);
        }




        var message = {
            type: "addListener",
            logicalName: strMyLogicalName,
            cbId: generateCallbackId()
        };

        callbackMap[message.cbId] = { callback: callback, deleteOnCall: false };

        Communicator.handleSameWindowMessaging(message, messageResponseHandler);
        //window.postMessage(message, "*");


        return successResult;
    };


    /**
    @description - add post topic listener to this extension
    @function - onTopicMsgAddListener
    @arg - strTopicName - topic name 
    @arg - callback - callback
    */
    var onTopicMsgAddListener = function (strTopicName, callback) {
        if (!callback || typeof callback !== 'function') {
            return Errors.get(1901);
        }

        if (!strTopicName || strTopicName === '') {
            return Errors.get(9000);
        }

        var cbId = generateCallbackId();

        callbackMap[cbId] = { callback: callback, deleteOnCall: false };

        var message = {
            topicName: strTopicName,
            cbId: cbId,
            type: "addTopic",
            windowId: window.name
        };
        Communicator.handleSameWindowMessaging(message, messageResponseHandler);
        //window.postMessage(message, "*");

        return successResult;
    };



    /**
    @description - send post topic to another extension
    @function - onXtbTopicMsgAddListener
    @arg - strTopicName - topic name 
    @arg - callback - callback
    */
    var onXtbTopicMsgAddListener = function (strTopicName, callback) {
        //validations
        if (!callback || typeof callback !== 'function') {
            return Errors.get(1901);
        }

        if (!strTopicName || strTopicName === '') {
            callback(Errors.get(9000));
            return Errors.get(9000);
        }


    };



    /**
    @description - send sys req (to single destention)
    @function - sendSysReq
    @arg - strDestLogicalName - logical name 
    @arg - strDestSenderName - sender
    @arg - data - data sent
    @arg - callback - callback
    */
    var sendSysReq = function (strDestLogicalName, strDestSenderName, data, callback) {
        if (typeof strDestLogicalName !== 'string' || !strDestLogicalName || strDestLogicalName === '') {
            return Errors.get(1900);
        }

        if (typeof strDestSenderName !== 'string' || !strDestSenderName || strDestSenderName === '') {
            return Errors.get(1904);
        }

        var cbId = generateCallbackId();
        var message = {
            type: "sendRequest",
            logicalName: strDestLogicalName,
            senderName: strDestSenderName,
            data: data,
            cbId: null
        };


        if (typeof (callback) === "function") {
            message.cbId = cbId;
            callbackMap[message.cbId] = { callback: callback, deleteOnCall: true };
        }
        Communicator.handleSameWindowMessaging(message, messageResponseHandler);
        //window.postMessage(message, "*");

        return successResult;
    };


    /**
    @description - send post msg inside the extension
    @function - postTopicMsg
    @arg - strTopicName - topic name
    @arg - senderLogicalName - sender
    @arg - data - data sent
    */
    var postTopicMsg = function (strTopicName, senderLogicalName, data) {
        if (typeof strTopicName !== 'string' || strTopicName === '') {
            return Errors.get(9000);
        }

        var message = {
            topicName: strTopicName,
            senderName: senderLogicalName,
            data: data,
            type: "postTopic"
        };
        Communicator.handleSameWindowMessaging(message, messageResponseHandler);
        //window.postMessage(message, "*");

        return successResult;
    };


    /**
    @description - send post msg to another extension
    @function - postXtbTopicMsg
    @arg - strTopicName - topic name
    @arg - data sent to the other extension
    */
    var postXtbTopicMsg = function (strTopicName, data) {
        if (typeof strTopicName !== 'string' || strTopicName === '') {
            return Errors.get(9000);
        }


    }

    var isSysReqExists = function (strDestLogicalName, callback) {
        if (!strDestLogicalName) {
            return Errors.get(1900);
        }



    };

    var removeTopicListener = function (strTopicName, topicId) {

    };

    var removeTopicMsgListenerValidations = function (strTopicName, topicId) {

    };


    /***************************************************END PRIVATE FUNCTIONS******************************************************/

    return {
        onSysReq: {
            addListener: onSysReqAddListener
        },
        onTopicMsg: {
            addListener: onTopicMsgAddListener
        },
        onXtbTopicMsg: onXtbTopicMsgAddListener,
        postXtbTopicMsg: postXtbTopicMsg,
        postTopicMsg: postTopicMsg,
        sendSysReq: sendSysReq,
        isSysReqExists: isSysReqExists,
        removeTopicListener: removeTopicListener
    };
})());

var cbsMessages = new MessagingReadyWrapper(conduit.abstractionlayer.commons.messages, conduit.utils.consts.READY_WRAPPER.CHROME_BACKSTAGE);
var albMessages = new MessagingReadyWrapper(conduit.abstractionlayer.commons.messages, conduit.utils.consts.READY_WRAPPER.ABS_LAYER_BACK);
/*
 *	
 */
conduit.register("abstractionlayer.frontstage.nmWrapper", new function () {

    var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages : conduit.abstractionlayer.commons.messages;

    var sendMessage = function (data, callback) {
        cbsMessagesBus.sendSysReq("frontNativeMessageCall", "nmWrapper", data, callback);
    }

    return {                
        sendMessage: sendMessage
    };
});
/**
* @fileOverview this class wraps the files, registry, prefs and HTML storage basic capabilities to the Local Storage
* FileName : repository.front
* FilePath : src/main/js/repository/repository.back.js
* Date : 27/6/2011
* Copyright: Realcommerce & Conduit.
* @author taisiya borisov
*/

//#ifdef DBG
try {
    //#endif

    conduit.register("abstractionlayer.commons.repository", (function () {
        //Initializing the class and assign it to the namespace
        //alias
        var Consts = conduit.utils.consts;
        var Errors = conduit.abstractionlayer.utils.errors;
        var dirName = conduit.abstractionlayer.utils.general.dirName();

        var osName = function () {
            var strUserAgent = window.navigator.userAgent;
            var iStart = strUserAgent.indexOf('(');
            var iEnd = strUserAgent.indexOf(')');
            var strPlatformData = strUserAgent.substring(iStart, iEnd);
            var arrData = strPlatformData.split(';');
            return arrData[0].replace(/\(/g, "");
        } ();
        var repositoryPath = (function () {
            var repositoryPath = "Software\\AppDataLow\\Software\\Conduit\\ChromeExtData\\";
            if (~["NT 5.1", "Windows NT 5.1"].indexOf(osName)) { //fox XP               
                repositoryPath = "Software\\Conduit\\ChromeExtData\\";
            }
            return repositoryPath;
        } ());

        var externalKeysPath = (function () {
            var repositoryPath = "Software\\AppDataLow\\Software\\SmartBar\\CR\\";
            if (~["NT 5.1", "Windows NT 5.1"].indexOf(osName)) { //fox XP               
                repositoryPath = "Software\\SmartBar\\CR";
            }
            return repositoryPath;
        } ());

        var intalltionKeysPath = (function () {
            var repositoryPath = "Software\\AppDataLow\\Software\\SmartBar\\";
            if (~["NT 5.1", "Windows NT 5.1"].indexOf(osName)) { //fox XP               
                repositoryPath = "Software\\SmartBar\\";
            }
            return repositoryPath;
        } ());

        /**************************************************************PRIVATE FUNCTIONS************************************************/
        var getNmHostWrapper = function () {
            var nmWrapper = "";
            if (conduit.abstractionlayer.utils.general.isBackstage) {
                nmWrapper = conduit.abstractionlayer.backstage.nmWrapper
            } else {
                nmWrapper = conduit.abstractionlayer.frontstage.nmWrapper;
            }
            return nmWrapper;
        }

        /**
        @description Check is key exists in the Local Storage (PUBLIC).
        @function hasKey
        @property {String} key  
        @example repository.hasKey(key) - will return an object.
        */
        var hasKey = function (key, func_type) {
            try {
                var tmpFuncType = func_type;
                if (!key) {
                    return Errors.get(9000);
                }
                else {
                    var keyValue = localStorage.getItem(key);
                    if (keyValue) {
                        return { result: true, status: 0, description: "" };
                    }
                    else {
                        return { result: false, status: 0, description: "" };
                    }
                }
            }
            catch (e) {
                console.error("Repository: hasKey Exception: " + e + " " + (e.stack ? e.stack.toString() : ""));
            }

            return Errors.get(0);
        };

        /********************************************************PUBLIC FUNCTIONS*********************************************************/

        var saveStateFile = function (html, callback) {
            try {
                if (!conduit.abstractionlayer.backstage.browser.getChangingShowStateProcess()) {
                    if (html && html.toLowerCase().indexOf('<html') == -1) {
                        if (callback) {
                            callback({ result: false, status: 1, description: "corrupted html" });
                        }
                        return;
                    }
                    var saveStateMsg = { namespace: "State", funcName: "saveStateFile", parameters: [globalProfileName, html] };
                    var nmWrapper = getNmHostWrapper();
                    nmWrapper.sendMessage(saveStateMsg, function (res) {
                        if (callback) {
                            callback(res);
                        }
                    });
                }
            } catch (generalException) {
                console.error("Save State File Exception: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : ""));

            }
        };

        var saveMatchFile = function (matchFile, globalProfileName, callback) {
            var saveMatchMsg = { namespace: "State", funcName: "saveMatchFile", parameters: [matchFile, globalProfileName] };
            var nmWrapper = getNmHostWrapper();
            nmWrapper.sendMessage(saveMatchMsg, function (res) {
                if (callback) {
                    callback(res);
                }
            });
        }

        var deleteStateFile = function (callback) {
            try {
                var delStateMsg = { namespace: "State", funcName: "deleteStateFile", parameters: [globalProfileName] };
                var nmWrapper = getNmHostWrapper();
                nmWrapper.sendMessage(delStateMsg, function (res) {
                    if (callback) {
                        callback(res);
                    }
                });
            } catch (generalException) {
                console.error("Delete State File Exception: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : ""));
            }
        };


        /**
        Wrappers for Data (File) related functions.
        */
        var setKey = function (key, value, encrypt) {
            return { result: localStorage.setItem(key, escape(value)), status: 0 };
        };

        var getKey = function (key, decrypt) {

            var value = localStorage.getItem(key);
            if (value) {
                value = unescape(value)
            }
            return { result: value || "",
                status: value ? 0 : 1101,
                description: value ? "" : "Key not found"
            };
        };

        var removeKey = function (key) {
            return { result: localStorage.removeItem(key), status: 0 };
        };

        var setData = function (key, value, binary, type, callback) {
            var returnCallback = callback;
            if (arguments.length == 3 && typeof (binary) === 'function') {
                returnCallback = binary;
                binary = false;
            }
            if (arguments.length == 4 && typeof (type) === 'function') {
                returnCallback = type;
            }
            if (!type) {
                type = "overwrite"
            }
            var nmWrapper = getNmHostWrapper();
            //setData params : isGlobal , fileName,value, isBinary, type
            var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, key, escape(value), binary, type] };
            nmWrapper.sendMessage(setDataMsg, function (response) {
                if (returnCallback) {
                    returnCallback(response);
                }
            });
            return Errors.get(1);
        };

        var getData = function (key, binary, callback) {
            var returnCallback = callback;
            if (arguments.length == 2 && typeof (binary) === 'function') {
                returnCallback = binary;
            }
            var nmWrapper = getNmHostWrapper();
            //getData params : isGlobal , fileName, isBinary
            var getDataMsg = { namespace: "Repository", funcName: "getData", parameters: [false, key, binary] };
            nmWrapper.sendMessage(getDataMsg, function (response) {
                if (returnCallback) {
                    if (response && response.result !== null && response.result !== undefined) {
                        response.result = unescape(response.result);
                        if (response.status !== 0 && typeof response.result == 'string' && response.result == 'false') {
                            response.result = false;
                        }
                        else if (response.status !== 0 && typeof response.result == 'string' && response.result == 'true') {
                            response.result = true;
                        }
                    }
                    returnCallback(response);
                }
            });
        };

        var removeData = function (key, callback) {
            var nmWrapper = getNmHostWrapper();
            //removeData params : isGlobal , fileName
            var removeDataMsg = { namespace: "Repository", funcName: "removeData", parameters: [false, key] };
            nmWrapper.sendMessage(removeDataMsg, function (response) {
                if (callback) {
                    callback(response);
                }
            });
            return Errors.get(1);
        };

        var hasData = function (key, callback) {
            var nmWrapper = getNmHostWrapper();
            //hasData params : isGlobal , fileName
            var hasDataMsg = { namespace: "Repository", funcName: "hasData", parameters: [false, key] };
            nmWrapper.sendMessage(hasDataMsg, function (response) {
                if (callback) {
                    callback(response);
                }
            });
            return Errors.get(1);
        };

        var setGlobalData = function (key, value, callback) {
            var nmWrapper = getNmHostWrapper();
            //setData params : isGlobal , fileName,value, isBinary, type
            var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [true, key, escape(value), false, "overwrite"] };
            nmWrapper.sendMessage(setDataMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);
        };

        var getGlobalData = function (key, callback) {
            var nmWrapper = getNmHostWrapper();
            //getData params : isGlobal , fileName, isBinary
            var getDataMsg = { namespace: "Repository", funcName: "getData", parameters: [true, key, false] };
            nmWrapper.sendMessage(getDataMsg, function (response) {
                if (callback) {
                    if (response && response.result !== null && response.result !== undefined) {
                        response.result = unescape(response.result);
                        if (response.status !== 0 && typeof response.result == 'string' && response.result == 'false') {
                            response.result = false;
                        }
                        else if (response.status !== 0 && typeof response.result == 'string' && response.result == 'true') {
                            response.result = true;
                        }
                    }
                    callback(response);
                };
            });
            return Errors.get(1);
        };

        var removeGlobalData = function (key, callback) {
            var nmWrapper = getNmHostWrapper();
            //removeData params : isGlobal , fileName
            var removeDataMsg = { namespace: "Repository", funcName: "removeData", parameters: [true, key] };
            nmWrapper.sendMessage(removeDataMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);
        };

        var hasGlobalData = function (key, callback) {

            var nmWrapper = getNmHostWrapper();
            //hasData params : isGlobal , fileName
            var hasDataMsg = { namespace: "Repository", funcName: "hasData", parameters: [true, key] };
            nmWrapper.sendMessage(hasDataMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);
        };

        var setGlobalKey = function (key, value, callback) {
            var nmWrapper = getNmHostWrapper();
            //set params : root, registryPath, type, key, value
            var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", 1, key, value] };
            nmWrapper.sendMessage(setKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);

        };

        var getGlobalKey = function (key, callback) {
            var nmWrapper = getNmHostWrapper();
            //get params : root, registryPath,key
            var getKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", key] };
            nmWrapper.sendMessage(getKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);
        };

        var removeGlobalKey = function (key, callback) {
            var nmWrapper = getNmHostWrapper();
            //removeKey params : root, registryPath,key
            var removeKeyMsg = { namespace: "Repository", funcName: "removeKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", key] };
            nmWrapper.sendMessage(removeKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);

        };

        var hasGlobalKey = function (key, callback) {
            var nmWrapper = getNmHostWrapper();
            //hasKey params : root, registryPath, type, key, value
            var hasKeyMsg = { namespace: "Repository", funcName: "hasKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", key] };
            nmWrapper.sendMessage(hasKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);
        };

        var setExternalKey = function (key, value, callback) {
            var nmWrapper = getNmHostWrapper();
            //set params : root, registryPath, type, key, value
            var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", externalKeysPath, 1, key, value] };
            nmWrapper.sendMessage(setKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);
        };


        var removeExternalKey = function (key, callback) {
            var nmWrapper = getNmHostWrapper();
            //removeKey params : root, registryPath,key
            var removeKeyMsg = { namespace: "Repository", funcName: "removeKey", parameters: ["HKEY_CURRENT_USER", externalKeysPath, key] };
            nmWrapper.sendMessage(removeKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);
        };

        var getExternalKey = function (key, callback) {
            var nmWrapper = getNmHostWrapper();
            //get params : root, registryPath,key
            var getKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", externalKeysPath, key] };
            nmWrapper.sendMessage(getKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);
        };

        var hasExternalKey = function (key, callback) {
            var nmWrapper = getNmHostWrapper();
            //hasKey params : root, registryPath, type, key, value
            var hasKeyMsg = { namespace: "Repository", funcName: "hasKey", parameters: ["HKEY_CURRENT_USER", externalKeysPath, key] };
            nmWrapper.sendMessage(hasKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);
        };

        var saveAllKeys = function () {
            //force host to backup local storage
            var nmWrapper = getNmHostWrapper();
            var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, "localStorageBackup", escape(JSON.stringify(localStorage)), false, "overwrite"] };
            nmWrapper.sendMessage(setDataMsg, function (response) { });
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var getInstallationKey = function (keyName, callback) {
            var nmWrapper = getNmHostWrapper();
            //get params : root, registryPath,key
            var getKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", intalltionKeysPath, keyName] };
            nmWrapper.sendMessage(getKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                };
            });
            return Errors.get(1);
        };

        var getRegistrykey = function (area, keyName) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };
        // PRIVATE FUNCTIONS 

        var setRegKeyAsync = function (keyName, value, callback) {
            var nmWrapper = getNmHostWrapper();
            var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + dirName + "\\Repository", 1, keyName, value] };
            nmWrapper.sendMessage(setKeyMsg, function (response) {
                if (response) {
                    callback(response)
                }

            });
        }

        var getRegKeyAsync = function (keyName, callback) {
            var nmWrapper = getNmHostWrapper();
            var getKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + dirName + "\\Repository", keyName] };
            nmWrapper.sendMessage(getKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                }
            });
        }

        var removeKeyAsync = function (keyName, callback) {
            var nmWrapper = getNmHostWrapper();
            var removeKeyMsg = { namespace: "Repository", funcName: "removeKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + dirName + "\\Repository", keyName] };
            nmWrapper.sendMessage(removeKeyMsg, function (response) {
                if (callback) {
                    callback(response);
                }
            });
        }

        var getFiles = function (isGlobal, filesArr, callback) {
            var nmWrapper = conduit.abstractionlayer.frontstage.nmWrapper;

            if (conduit.abstractionlayer.utils.general.isBackstage) {
                nmWrapper = conduit.abstractionlayer.backstage.nmWrapper
            }
            var getFilesMsg = { namespace: "Repository", funcName: "getFiles", parameters: [false, filesArr] };
            nmWrapper.sendMessage(getFilesMsg, function (response) {
                callback(response);
            });
        }
        //return the class to Singleton object
        return {
            setData: setData,
            setKey: setKey,
            removeKey: removeKey,
            removeData: removeData,
            getData: getData,
            getKey: getKey,
            hasData: hasData,
            hasKey: hasKey,
            setGlobalData: setGlobalData,
            setGlobalKey: setGlobalKey,
            removeGlobalKey: removeGlobalKey,
            removeGlobalData: removeGlobalData,
            getGlobalData: getGlobalData,
            getGlobalKey: getGlobalKey,
            hasGlobalData: hasGlobalData,
            hasGlobalKey: hasGlobalKey,
            saveStateFile: saveStateFile,
            deleteStateFile: deleteStateFile,
            setExternalKey: setExternalKey,
            removeExternalKey: removeExternalKey,
            getExternalKey: getExternalKey,
            hasExternalKey: hasExternalKey,
            getInstallationKey: getInstallationKey,
            getRegistrykey: getRegistrykey,
            saveAllKeys: saveAllKeys,
            setRegKeyAsync: setRegKeyAsync,
            getFiles: getFiles,
            saveMatchFile: saveMatchFile,
            getRegKeyAsync: getRegKeyAsync,
            removeKeyAsync: removeKeyAsync
        };

        //#endregion
    } ()));
    //#ifdef DBG
} catch (e) {
    console.error('Exception in ' + 'conduit.abstractionLayer.commons.repository', e.stack ? e.stack.toString() : e.toString());
}

//#endif



try {
    //#endif

    conduit.register("abstractionlayer.commons.registry", (function () {

       

        /**
        @description Sets a key value in the registry
        @function setKey
        @property {String} rootPath  
        @property {String} path 
        @property {Int} type
        @property {String} key
        @property {String} value
        */
        var setKey = function (rootPath, path, type, key, value) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };


        /**
        @description Removes a key from the registry
        @function removeKey
        @property {String} rootPath  
        @property {String} path 
        @property {String} key
        */
        var removeKey = function (rootPath, path, key) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /**
        @description gets a key from the registry
        @function getKey
        @property {String} rootPath  
        @property {String} path 
        @property {String} key
        */
        var getKey = function (rootPath, path, key) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };


        /**
        @description Checks if key exists in the registry
        @function isKeyExists
        @property {String} rootPath  
        @property {String} path 
        @property {String} key
        */
        var isKeyExists = function (rootPath, path, key) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };


        /**
        @description Checks if path exists in the registry
        @function isPathExists
        @property {String} rootPath  
        @property {String} path 
        */
        var isPathExists = function (rootPath, path) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /**
        @description Gets sub paths
        @function getSubPaths
        @property {String} rootPath  
        @property {String} path 
        */
        var getSubPaths = function (rootPath, path) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /**
        @description Removes a path from registry
        @function removePath
        @property {String} rootPath  
        @property {String} path 
        */
        var removePath = function (rootPath, path) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /**
        @description Reads the value of a key
        @function getInstallationKey
        @property {String} key 
        */
        var getInstallationKey = function (key) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /**
        @description Sets key and value
        @function setExternalKey
        @property {String} key 
        @property {String} value 
        */
        var setExternalKey = function (key, value) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /**
        @description Removes key
        @function removeExternalKey
        @property {String} key 
        */
        var removeExternalKey = function (key) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /**
        @description Reads a key
        @function getExternalKey
        @property {String} key 
        */
        var getExternalKey = function (key) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /**
        @description Checks if external key exists
        @function hasExternalKey
        @property {String} key 
        */
        var hasExternalKey = function (key) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };


        /* PUBLIC INTERFACE */
        return {
            setKey: setKey,
            removeKey: removeKey,
            getKey: getKey,
            isKeyExists: isKeyExists,
            isPathExists: isPathExists,
            getSubPaths: getSubPaths,
            removePath: removePath,
            getInstallationKey: getInstallationKey,
            setExternalKey: setExternalKey,
            removeExternalKey: removeExternalKey,
            getExternalKey: getExternalKey,
            hasExternalKey: hasExternalKey
        };

        //#endregion
    } ())); 
    //#ifdef DBG
} catch (e) {
    log.error('Exception in ' + 'conduit.abstractionlayer.commons.registry', e.stack ? e.stack.toString() : e.toString());
}
//#endif
conduit.register("abstractionlayer.commons.logging", new function () {

    //Keys names
    var Consts = {
        keys: {
            SmartBarLog_Trace: "SmartBarLogTrace",
            SmartBarLog_Error: "SmartBarLogError",
            SmartBarLog_Info: "SmartBarLogInfo",
            SmartBarLog_Debug: "SmartBarLogDebug"
        },
        registry: {
            path: "Software\\AppDataLow\\Software\\SmartBar\\CH",
            machine: "HKEY_CURRENT_USER"
        }
    };

    //Registry default/Dynamic flags value
    var repValue = {
        SmartBar_Log_Trace: false,
        SmartBar_Log_Error: false,
        SmartBar_Log_Info: false,
        SmartBar_Log_Debug: false
    };

    var Errors = conduit.abstractionlayer.utils.errors;

    //Start save file Parameteres
    var loggerPath = "/logs/";
    var fileData = null;
    var isBinary = false;
    var overwrite = true;
    var appendToFile = true;
    var extensionId = chrome.i18n.getMessage("@@extension_id");
    var callbackFunctionName = "onFinishLog";
    var winPointer = window;
    var threadID = 0;
    var level = 0;
    var nameSpace = "NameSpace";
    var anonymous = "Anonymous";
    var noFunctionParams = "No Function Params";
    var noErrorObject = "No Error Object";

    //End save file parameteres

    var repository = conduit.abstractionlayer.commons.repository;

    var isDebugLog_ErrorEnabled = repository.getExternalKey(Consts.keys.SmartBarLog_Error);
    var isDebugLog_InfoEnabled = repository.getExternalKey(Consts.keys.SmartBarLog_Info);
    var isDebugLog_TraceEnabled = repository.getExternalKey(Consts.keys.SmartBarLog_Trace);
    var isDebugLog_DebugEnabled = repository.getExternalKey(Consts.keys.SmartBarLog_Debug);


    //Init logging flags
    var initSettings = function () {
        //read keys 
        winPointer[callbackFunctionName] = function () { };
        repValue.SmartBar_Log_Error = isDebugLog_ErrorEnabled && isDebugLog_ErrorEnabled.result ? true : false;
        repValue.SmartBar_Log_Info = isDebugLog_InfoEnabled && isDebugLog_InfoEnabled.result ? true : false;
        repValue.SmartBar_Log_Trace = isDebugLog_TraceEnabled && isDebugLog_TraceEnabled.result ? true : false;
        repValue.SmartBar_Log_Debug = isDebugLog_DebugEnabled && isDebugLog_DebugEnabled.result ? true : false;
    };


    //Get formatted message
    var getMessageFormatted = function (errorData) {
        if (!errorData) return;

        var dateObject = new Date();
        var exceptionMessage = (errorData.errorObject && errorData.errorObject.message && errorData.errorObject.stack) ? errorData.errorObject.message + "|" + errorData.errorObject.stack : "";
        var data = ["[" + dateObject.getMonth() + 1 + "/" + dateObject.getDate() + "/" + dateObject.getFullYear() + "]",
                    "[" + dateObject.getHours() + ":" + dateObject.getMinutes() + ":" + dateObject.getSeconds() + "]",
                    "[" + threadID + "]",
                    "[" + level + "]",
                    "[" + (errorData.namespace ? errorData.namespace : nameSpace) + "]",
                    "[" + (errorData.functionName ? errorData.functionName : anonymous) + "]",
                    "[" + (errorData.functionParams && JSON.stringify(errorData.functionParams) ? JSON.stringify(errorData.functionParams) : noFunctionParams) + "]",
                    errorData.returnValue ? "[" + errorData.returnValue + "]" : "[]",
                    "[" + (errorData.errorMessage ? errorData.errorMessage : "") + "]",
                    "[" + (errorData.errorObject && JSON.stringify(errorData.errorObject) ? JSON.stringify(errorData.errorObject) : noErrorObject) + "]"
                   ];

        if (exceptionMessage) {
            data.push(exceptionMessage);
        }

        return data.join(" ") + "\n";
    };

    var getNmHostWrapper = function () {
        var nmWrapper = "";
        if (conduit.abstractionlayer.utils.general.isBackstage) {
            nmWrapper = conduit.abstractionlayer.backstage.nmWrapper
        } else {
            nmWrapper = conduit.abstractionlayer.frontstage.nmWrapper;
        }
        return nmWrapper;
    }


    //Save log to file
    var save = function (absFlag) {
        return;
        var dateObject = new Date();
        var fileNameLog = "Log_" + (dateObject.getDate() < 10 ? "0" : "") + dateObject.getDate() + "-" +
                          (dateObject.getMonth() < 10 ? "0" : "") + dateObject.getMonth() + "-" +
                          dateObject.getFullYear() + (absFlag ? "_Abs.txt" : "_App.txt");

        var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, fileNameLog, fileData, false, "append"] };
        var nmWrapper = getNmHostWrapper();
        nmWrapper.sendMessage(setDataMsg, function (response) { });


    };


    var doFunction = function (errorData, key, type, absFlag) {
        return;
        if (!errorData || !key || key == "false") {
            return Errors.get(9000);
        }

        fileData = getMessageFormatted(errorData, type);
        if (absFlag) {
            switch (type) {
                case 'Info':
                    console.warn("Information", fileData);
                    break;
                case 'Error':
                    console.error("Error", fileData);
                    break;
                case 'Debug':
                    console.debug("Debug", fileData);
                    break;
                case 'Trace':
                    console.log("Trace Logs", fileData);
                    break;
                default: break;
            }
        }
        save(absFlag);
        return Errors.get(1);
    };

    var trace = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Trace, "Trace"); };
    var info = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Info, "Info"); };
    var error = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Error, "Error"); };
    var debug = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Debug, "Debug"); };
    var internalTrace = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Trace, "Trace", true); };
    var internalInfo = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Info, "Info", true); };
    var internalError = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Error, "Error", true); };
    var internalDebug = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Debug, "Debug", true); };

    initSettings();

    return {
        logTrace: trace,
        logInfo: info,
        logError: error,
        logDebug: debug,
        internal: {
            logTrace: internalTrace,
            logInfo: internalInfo,
            logError: internalError,
            logDebug: internalDebug
        }
    };
});


try {
    //HANDLER FOR MULTI TOOLBARS
    conduit.register("abstractionlayer.frontstage.multiToolbarsHandler", (function () {
        var Repsitory = conduit.abstractionlayer.commons.repository;
        var Environment = conduit.abstractionlayer.commons.environment;
        var Messages = conduit.abstractionlayer.commons.messages;
        var localJsonKey = {};
        var isFirstTime = true;

        var Consts = {
            extensionsList: 'extensionsList', //[{key: extId, ctid: CTXXX, state: shown/hidden, generation: old/sb, enabled: true/false}, {}]
            webToolbarNameIdentifier: 'Delivers all our best apps to your browser.',
            webToolbarsCounterKey: 'webToolbarsCounter',
            notImportant: 'notImportant',
            shownToolbarsOrder: 'shownToolbarsOrder',
            stateShown: 'shown',
            generationOld: 'old'
        };

        // Fixed to remove closure for performance.
        var checkDelay = 120000;
        var getExtensionsListKeyFunc = function () {
            Messages.sendSysReq('getExtensionsListKey', 'multiTBFront', 'multiTBFront', function (jsonKey) {
                if (jsonKey) {
                    localJsonKey = jsonKey;
                }
            });

            setTimeout(getExtensionsListKeyFunc, checkDelay);
        };

        setTimeout(getExtensionsListKeyFunc, checkDelay);

        Messages.onSysReq.addListener('getExtensionsListKeyFirstTime', function (data, sender, callback) {
            if (data) {
                localJsonKey = data;
            }
        });

        var extensionObjConstractor = function (extId, ctid, state, generation, enabled) {
            return { key: extId, ctid: ctid, state: state, generation: generation ? generation : 'sb', enabled: enabled.length > 0 && enabled != null ? enabled : true };
        };

        var getArrayFromKey = function () {
            try {
                var arrExtensions = new Array();

                var getFallbackKey = function () {
                    //conduit.abstractionlayer.commons.logging.internal.logError({ namespace: "abstractionlayer.frontstage.multiToolbarsHandler", functionName: "getFallbackKey", functionParams: "", returnValue: "", errorMessage: JSON.stringify(localJsonKey), errorObject: localJsonKey });
                    return localJsonKey;
                };

                var handleKey = function () {
                    try {

                        var strCurrentKey = localStorage.getItem("extensionsList");
                        if (!strCurrentKey) {
                            var strCurrentKey = getFallbackKey();
                        }
                        if (!strCurrentKey) {
                            return arrExtensions;
                        }
                        if (strCurrentKey) {
                            var arrExtsJsons = strCurrentKey.split(",");
                            for (var i = 0; i < arrExtsJsons.length; i++) {
                                var objCurrExt = JSONstring.toObject(unescape(arrExtsJsons[i]));
                                if (objCurrExt) {
                                    arrExtensions.push(objCurrExt);
                                }
                            }
                            return arrExtensions;
                        }
                    } catch (e) {
                        return "";
                    }
                };


                try {
                    return handleKey();

                } catch (e) {
                }

            } catch (e) { console.error('Error in multi toolbars handler parsing key ', e) };

        };

        var getExtPlacementInShownTBList = function (extensionId) {
            extensionId = extensionId ? extensionId : chrome.i18n.getMessage("@@extension_id");
            var arrExtensions = getArrayFromKey();
            var counterOfShownToolbars = 0;
            for (var counter = 0; counter < arrExtensions.length; counter++) {
                if (arrExtensions[counter] && arrExtensions[counter].key && arrExtensions[counter].key == extensionId) {
                    return counterOfShownToolbars;
                }
                if (arrExtensions[counter] && arrExtensions[counter].key && arrExtensions[counter].state == Consts.stateShown && arrExtensions[counter].enabled) {
                    counterOfShownToolbars++;
                }
            }
            return counterOfShownToolbars;
        };

        var getNumberOfOldToolbars = function () {
            var arrExtensions = getArrayFromKey();
            var counterOfOldToolbars = 0;
            for (var counter = 0; counter < arrExtensions.length; counter++) {
                if (arrExtensions[counter] && arrExtensions[counter].key && arrExtensions[counter].generation == Consts.generationOld && /*arrExtensions[counter].state == Consts.stateShown &&*/arrExtensions[counter].enabled) {
                    counterOfOldToolbars++;
                }
            }
            return counterOfOldToolbars;
        };

        var getNumOfShownTB = function () {
            var arrExtensions = getArrayFromKey();
            var counterOfShownToolbars = 0;
            for (var counter = 0; counter < arrExtensions.length; counter++) {
                if (arrExtensions[counter] && arrExtensions[counter].key && arrExtensions[counter].state == "shown" && arrExtensions[counter].generation == "sb" && arrExtensions[counter].enabled) {
                    counterOfShownToolbars++;
                }
            }
            return counterOfShownToolbars;
        }
        return {
            getExtPlacementInShownTBList: getExtPlacementInShownTBList,
            getNumberOfOldToolbars: getNumberOfOldToolbars,
            getNumOfShownTB: getNumOfShownTB
        }
    } ()));
} catch (e) {
    console.error('Exception in frontStage' + 'multi toolbar' + ' class: ', e.stack ? e.stack.toString() : e.toString());
}


var multiToolbarsEventHandler =
{
    init: function () {
        var multiToolbarsHandler = conduit.abstractionlayer.frontstage.multiToolbarsHandler;

        var getPlacementAndNumberOfOldToolbars = function () {
            return { result: {
                placement: multiToolbarsHandler.getExtPlacementInShownTBList(),
                numberOfOldToolbars: multiToolbarsHandler.getNumberOfOldToolbars(),
                numberOfShownToolbars: multiToolbarsHandler.getNumOfShownTB()
            }, status: 0, description: ''
            };
        };

        //for first time the page loads (backstage loads later)
        conduit.abstractionlayer.commons.messages.sendSysReq('injectTBReadyFirstTime', 'injectTBReadyFirstTime', getPlacementAndNumberOfOldToolbars(), function () { });
        //for every time the page loads but not the first time (backstage loads later)
        conduit.abstractionlayer.commons.messages.onSysReq.addListener('injectTBReady', function (data, sender, callback) {
            try {
                //maybe cases the front reloaded and still ref to deleted callback
                if (callback)
                    callback(getPlacementAndNumberOfOldToolbars());
            } catch (e) { console.log('Error in multiToolbarsEventHandler: ', e); }
        });
    }
}
multiToolbarsEventHandler.init();

/**
* @fileOverview set and get basic info such as CTID and more.. <br/>
* FileName : context.common.js <br/>
* FilePath : [ENTER FILE PATH] <br/>
* Date : 16.3.2011 <br/>
* Copyright: Realcommerce & Conduit.
* @author <strong> Yoav SHafir </strong>
* Last update 30.6.2011 by Taisiya Borisov
*/

/**
*this class sets basic info such as CTID... to the repository and also gets this info when needed.
*@class set and get basic info to repository (SINGLETON)
*@property {[ENTER THE TYPE OF THE PROPERTY e.g. String Int or Boolean inside the curled brackets]} [NAME OF THE PARAMETER] - [DESCRIPTION]
*/


conduit.register("abstractionlayer.commons.context", new function () {
    /* PRIVATE VARIABLES */
    var configFileUrl;
    var configFileObject;
    var General = conduit.abstractionlayer.utils.general;
    var Repository = conduit.abstractionlayer.commons.repository;
    var multiToolbarsHandler = conduit && conduit.abstractionlayer && conduit.abstractionlayer.backstage ? conduit.abstractionlayer.backstage.multiToolbarsHandler : null;
    var fullUserIdKeyName = "ToolbarFullUserID";

    /* PRIVATE FUNCTIONs */
    /**
    @description - Runs on class init. The Singleton class instantiates itself (PRIVATE)
    @function init
    */
    var init = function () {

        // reference to the initData.json file.
        configFileUrl = chrome.extension.getURL('initData.json');
        configFileObject = fetchConfigFile(configFileUrl);
        var activeCTIDkey = configFileObject.Ctid + "." + "activeCTID";
        //Listen to getCTID message - only in backstage
        if (General.isBackstage) {
            //gets active ctid from key(sets by CRE) - this is used for tpi init 
            conduit.abstractionlayer.commons.messages.onSysReq.addListener('context.getActingCTID', function (data, sender, callback) {
                try {
                    var regKeyObj = Repository.getKey(activeCTIDkey);
                    var activeCTID = (regKeyObj && regKeyObj.status == 0 && regKeyObj.result) ? regKeyObj.result : '';
                    callback({ original: configFileObject.Ctid, active: activeCTID });
                } catch (generalException) {
                    console.error("context.getCTID Exception: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                }
            });

            if (document && /(\/|\\)BACKSTAGE\.HTML$/.test(document.location.href.toUpperCase())) {
                conduit.abstractionlayer.commons.messages.onSysReq.addListener("csGetCTIDToBg", function (data, sender, callback) {
                    callback(configFileObject.Ctid);
                });
            }
        }
        // check if data already exists in repository .
        var contextObj = Repository.getKey("contextInfo").result;
        var isBSInit = Repository.getKey("isBSinit").result;
        if (!contextObj || (contextObj && multiToolbarsHandler && !isBSInit)) {
            //if not, make an ajax call and set data in repository.
            setContextInfo();
        }
    };

    var generateUserID = function () {
        var UNIQUE_ID_LENGTH = 19;
        var strID = "UN" + Math.random().toString().substring(2);
        while (strID.length < UNIQUE_ID_LENGTH) {
            strID += Math.random().toString().substring(2);
        }
        return strID.substr(0, 19);
    };

    /**
    @description - set the data to the repository (PRIVATE).
    @function setContextInfo
    */
    var setContextInfo = function () {


        var contextInfo = Repository.getKey("contextInfo").result;

        //make the ajax call to initData.js.
        if (!configFileObject) {
            configFileObject = fetchConfigFile(configFileUrl);
        }

        var downloadUrlFromInit = configFileObject.downloadUrl ? configFileObject.downloadUrl : "";
        var myCtid = configFileObject.Ctid;

        //handle multi toolbars
        if (multiToolbarsHandler) {
            var toolbarShow = Repository.getKey("toolbarShow").result;
            var state = 'shown';
            if (toolbarShow == "false") {
                state = 'hidden'
            }
            multiToolbarsHandler.addExtObjToList(multiToolbarsHandler.extensionObjConstractor(chrome.i18n.getMessage("@@extension_id"), myCtid, state, 'sb', true));
        }

        //for serach in new tab
        var sspv = configFileObject.SSPV ? configFileObject.SSPV : "";
        if (!sspv) {
            Repository.removeKey('newTabSSPV');
        } else {
            Repository.setKey('newTabSSPV', sspv);
        }

        // prepare object for repository.
        var obj = {
            toolbarName: configFileObject.toolbarName,
            Ctid: myCtid,
            downloadUrl: downloadUrlFromInit,
            version: configFileObject.version
        }

        //set object to repository.
        Repository.setKey("contextInfo", JSON.stringify(obj));
        if (multiToolbarsHandler) {
            Repository.setKey("isBSinit", true);
        }
    }

    /**
    @description - ajax request to the initData.json file. (PRIVATE)
    @function fetchConfigFile
    @returns {Object} - Config file JSON
    */
    var fetchConfigFile = function (configFileUrl) {

        var configFileObject = {};
        var ajaxResponse = $.ajax({
            url: configFileUrl,
            type: 'GET',
            cache: false,
            async: false,
            error: function (jqXHR, textStatus, errorThrown) {
                throw errorThrown;
            }
        });
        try {
            configFileObject = JSONstring.toObject(ajaxResponse.responseText);
        } catch (e) {
            console.error(e);
        }


        return configFileObject;
    };

    /**
    @description - this function returns the data object from the repository with the spesific property requested. (PRIVATE)
    @function returnObj
    @property {String} param : can be one of the followings: userID, toolbarName, Ctid, downloadUrl
    */
    var returnObj = function (param) {
        // get data from repository.
        try {
            var contextObj = Repository.getKey("contextInfo").result;
            var contextInfo = JSONstring.toObject(contextObj);
            var obj = {};
            obj.result = contextInfo[param] ? contextInfo[param] : "";
            obj.status = contextInfo[param] ? 0 : 2200;
            obj.description = contextInfo[param] ? "" : "Dedicated Key doesn\'t exist";

            return obj;
        } catch (e) {
            console.error(e);
            return { 'result': false, 'status': 9999, 'description': e };
        }


    }

    /**
    @description Get a context item
    @function getContextItem
    @property {String} itemName - The name of the required item,  can be one of the followings: userID, toolbarName, Ctid, downloadUrl
    @returns {Object} - { result: X , status: XX, description: XXX}.
    @example getContextItem('downloadUrl')
    */
    var getContextItem = function (itemName) {
        // check if for some reason the data was not set on init().

        var contextObj = Repository.getKey("contextInfo").result;
        var isBSInit = Repository.getKey("isBSinit").result;
        if (!contextObj || (contextObj && multiToolbarsHandler && !isBSInit)) {
            //if not, make another ajax call to initData.js and set data to local storage.
            setContextInfo();
        }

        //then get it back with the relevant param.
        var objToReturn = returnObj(itemName);

        return objToReturn;
    };

    /* PUBLIC FUNCTION */
    /**
    @description get CTID - (PUBLIC)
    @function getCTID
    @returns {object} - returns the CTID.
    */
    var getCTID = function () {
        return getContextItem('Ctid');
    };

    /**
    @description returns the user ID - (PUBLIC)
    @function getUserID
    @returns {object} - unique ID.
    */
    var getUserID = function (callback) {
        var userId = "";
        var generateFullUserID = false;
        if (!callback || callback == undefined) {
            return { result: localStorage.getItem("ToolbarUserID"), status: 0, description: '' }
        }
        conduit.abstractionlayer.commons.storage.getTripleKey("ToolbarUserID", function (resp) {
            try {
            var trippleKeyUserID = resp.result;
            var isUserIDExist = trippleKeyUserID.file || trippleKeyUserID.registry || trippleKeyUserID.local;
            if (!isUserIDExist) {
                //fallback incase the updates manager was not able to write this value
                var contextInfo = localStorage.getItem('contextInfo') ? JSONstring.toObject(localStorage.getItem('contextInfo')) : null;
                if (contextInfo && contextInfo["userID"]) {
                    userId = contextInfo["userID"];
                }
                else {
                    if (localStorage.getItem('localUserId' + getCTID())) {
                        userId = JSONstring.toObject(localStorage.getItem('localUserId' + getCTID()));
                    }
                    else {
                        userId = generateUserID();
                        generateFullUserID = true;
                    }
                }

                setUserIDKeys(userId, generateFullUserID);
            }
            else {
                    userId = trippleKeyUserID.local ? trippleKeyUserID.local : trippleKeyUserID.registry ? trippleKeyUserID.registry : trippleKeyUserID.file;
                //if one of the user Id sources is missing set it again to all sources with the current user ID
                if ((!trippleKeyUserID.file || !trippleKeyUserID.registry || !trippleKeyUserID.local) ||
                !((trippleKeyUserID.file == trippleKeyUserID.registry) && (trippleKeyUserID.registry == trippleKeyUserID.local))) {
                    setUserIDKeys(userId);
                }
                getFullUserID(function (res) {
                    if (!res.result) {
                        setFullUserId(userId); //generate new one since it doesn't exist
                    }
                });
                }
            } catch (e) {
            }
            if (callback) {
                callback({ result: userId, status: 0, description: '' });
            }
        });
    }

    function setUserIDKeys(userID, generateFullUserID) {
        conduit.abstractionlayer.commons.storage.setTripleKey("ToolbarUserID", userID, function () {
            setFullUserId(userID, generateFullUserID);
        });
    }

    function setFullUserId(userID, generateFullUserID) {
        getFullUserID(function (response) {
            var fullUserID = response.result;
            if (generateFullUserID) {
                var d1 = new Date();
                var dateFormatted = String(d1.getFullYear()) + pad(d1.getMonth() + 1) + pad(d1.getDate()) + pad(d1.getHours()) + pad(d1.getMinutes()) + pad(d1.getSeconds());
                fullUserID = userID + ".TB." + dateFormatted;
            }
            else if (!fullUserID) { //if we shouldn't generate new full user ID but we don't found one, generate new one with type XX
                var d1 = new Date();
                var dateFormatted = String(d1.getFullYear()) + pad(d1.getMonth() + 1) + pad(d1.getDate()) + pad(d1.getHours()) + pad(d1.getMinutes()) + pad(d1.getSeconds());
                fullUserID = userID + ".XX." + dateFormatted;
            }
            conduit.abstractionlayer.commons.storage.setTripleKey(fullUserIdKeyName, fullUserID);
        });
    }

    function pad(num) { return num < 10 ? '0' + num : num }

    function getFullUserID(callback) {
        var fullUserID = ""
        conduit.abstractionlayer.commons.storage.getTripleKey(fullUserIdKeyName, function (resp) {
            var trippleKeyFullUserID = resp.result;
            var isFullUserIDExist = trippleKeyFullUserID.file || trippleKeyFullUserID.registry || trippleKeyFullUserID.local;
            if (isFullUserIDExist) {
                fullUserID = trippleKeyFullUserID.local ? trippleKeyFullUserID.local : trippleKeyFullUserID.registry ? trippleKeyFullUserID.registry : trippleKeyFullUserID.file;
            }
            if (callback) {
                callback({
                    result: fullUserID,
                    status: 0,
                    description: ''
                });
            }
        })
    }

    /**
    @description this function returns the toolbar name (PUBLIC).
    @function getToolbarName
    @returns {object} - toolbar name.
    */
    var getToolbarName = function () {
        return getContextItem('toolbarName');
    };

    /**
    @description Return the extension download url (PUBLIC).
    @function getDownloadUrl
    @returns {Object} - { result: X , status: XX, description: XXX}.
    @example abstractionlayer.commons.context.getDownloadUrl().result
    */
    var getDownloadUrl = function () {
        return getContextItem('downloadUrl');
    };

    var isPluginAvailable = function () {
        return true;
    }

    /**
    @description Return the extension version (PUBLIC).
    @function getVersion
    @returns {Object} - { toolbar version }.
    @example abstractionlayer.commons.context.getVersion()
    */
    var getVersion = function () {
        return getContextItem('version');
    };

    var getMachineId = function () {
        var machineId = localStorage.getItem("machineId");
        //sync machine ID key with registry (if exist and if doesn't exist)       
        syncMachineID();
        if (machineId) {
            return {
                'result': machineId,
                'status': 0,
                'description': ''
            };
        }
        return { result: '', status: 9999, description: "machine ID doesn't exist in local stoage" };
    };

    var syncMachineID = function () {
        var repositoryPath = "Software\\AppDataLow\\Software\\Conduit\\ChromeExtData\\";
        var osName = getOSName();
        if (~["NT 5.1", "Windows NT 5.1"].indexOf(osName)) { //fox XP               
            repositoryPath = "Software\\Conduit\\ChromeExtData\\";
        }
        var nativeMsgComm = getNmHostWrapper();
        var getGlobalKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", "machineId"] };
        nativeMsgComm.sendMessage(getGlobalKeyMsg, function (response) {
            if (!response.status) {
                localStorage.setItem("machineId", response.result); //if the global key of machine ID exist, set it again in local storage           
            } else { //generate it            
                var getMachineIDMsg = { namespace: "Context", funcName: "getMachineID", parameters: [] };
                nativeMsgComm.sendMessage(getMachineIDMsg, function (response) {
                    if (!response.status) {
                        localStorage.setItem("machineId", response.result); //set it again in local storage and global repository in registry
                        var setGlobalKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", "machineId", response.result] };
                        nativeMsgComm.sendMessage(setGlobalKeyMsg, function (response) { });
                    }
                });
            }
        });
    }

    function getOSName() {
        var strUserAgent = window.navigator.userAgent;
        var iStart = strUserAgent.indexOf('(');
        var iEnd = strUserAgent.indexOf(')');
        var strPlatformData = strUserAgent.substring(iStart, iEnd);
        var arrData = strPlatformData.split(';');
        return arrData[0].replace(/\(/g, "");
    }

    var getNmHostWrapper = function () {
        var nmWrapper = "";
        if (conduit.abstractionlayer.utils.general.isBackstage) {
            nmWrapper = conduit.abstractionlayer.backstage.nmWrapper
        } else {
            nmWrapper = conduit.abstractionlayer.frontstage.nmWrapper;
        }
        return nmWrapper;
    }

    //run init.
    init();

    /* PUBLIC API */
    return {
        getCTID: getCTID,
        getUserID: getUserID,
        getFullUserID: getFullUserID,
        getToolbarName: getToolbarName,
        getDownloadUrl: getDownloadUrl,
        getVersion: getVersion,
        setContextInfo: setContextInfo,
        getMachineId: getMachineId,
        isPluginAvailable: isPluginAvailable
    };

});

/**
* @fileOverview Contains abstraction layer environment singleton <br/>
* FileName : environment.common.js <br/>
* FilePath : SmartBar\AbstractionLayer\Chrome\Dev\AbstractionLayer\src\main\js\environment\environment.common.js <br/>
* Date : 2011-03-10 <br/>
* Copyright: Realcommerce & Conduit.
* @author <strong> Tomer Raz </strong>
*/

/**
The environment singleton of the abstraction layer wraps the core library environment singleton
@class environment (SINGLETON)
*/

//#ifdef DBG
try {
    //#endif
    var Environment = (function () {
        //Initializing the class and assign it to the namespace
        conduit.abstractionlayer.commons.environment = function () {
            // Private members
            var _osInfo;
            var _browserInfo;
            var _userDataPath;
            var _userTempPath;
            var _userAgent = navigator.userAgent;

            var General = conduit && conduit.abstractionlayer && conduit.abstractionlayer.utils && conduit.abstractionlayer.utils.general;
            var Generic = conduit && conduit.abstractionlayer && conduit.abstractionlayer.commons && conduit.abstractionlayer.commons.generic;
            var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages : conduit.abstractionlayer.commons.messages;
            var albMessagesBus = typeof albMessages != "undefined" ? albMessages : conduit.abstractionlayer.commons.messages;
            var currentWindowId = null;


            var _configFileUrl = chrome.extension.getURL('initData.json');
            var _configFileObject = null;
            var Errors = conduit.abstractionlayer.utils.errors;
            var Context = conduit.abstractionlayer.commons.context;
            var Repository = conduit.abstractionlayer.commons.repository;
            var extensionId = chrome.i18n.getMessage("@@extension_id");


            function initLogger() {
                if (General && General.isBackstage) {
                    cbsMessagesBus.onSysReq.addListener("toolbarInitializingLogger", writeLog);

                    var writeLog = function () {
                        chrome.storage.local.get(["toolbar_initializing_logger"], function (res) {
                            var data = res.toolbar_initializing_logger;
                            if (!data) {
                                return;
                            }
                            chrome.storage.local.set({ "toolbar_initializing_logger": "" });
                            Repository.setData('toolbar_initializing_logger.txt', data, false, "overwrite", function () { });
                        });
                    };
                    writeLog(); //for first time - others from listener
                }
                return true;
            };

            var getNmHostWrapper = function () {
                var nmWrapper = "";
                if (conduit.abstractionlayer.utils.general.isBackstage) {
                    nmWrapper = conduit.abstractionlayer.backstage.nmWrapper
                } else {
                    nmWrapper = conduit.abstractionlayer.frontstage.nmWrapper;
                }
                return nmWrapper;
            };

            this.getResourcesBasePathURI = function () {
                return { result: "chrome-extension://" + extensionId, status: 0, description: "" };
            };

            this.getResourcesBasePath = function (callback) {
                var nmWrapper = getNmHostWrapper();
                var getExtensionPathMsg = { namespace: "Environment", funcName: "getExtensionPath", parameters: [globalProfileName] };
                nmWrapper.sendMessage(getExtensionPathMsg, function (result) {
                    callback(result);
                });
            };

            var initCurrentWindowId = function () {
                //get current window if from the backstage message definition
                //send the request to the backstage listener
                cbsMessagesBus.sendSysReq("environment.getCurrentWindowId", "environment.common.js", {}, function (response) {
                    //set the return result to global variable
                    currentWindowId = response;
                });
            };


            this.getCurrentWindowId = function () {
                if (General && General.isBackstage) {
                    return Generic && Generic.unsupportedFunction() || false;
                }

                var result = null;

                if (currentWindowId) {
                    result = { result: currentWindowId, status: 0, description: '' };
                } else {
                    result = Errors.get(9000);
                }

                return result;
            };


            /* CONST */
            var TOOLBAR_HEIGHT = 320; // ABST_ATP_TESTER
            //#ifndef ABST_ATP_TESTER
            var TOOLBAR_HEIGHT = 35;
            //#endif
            /**
            @description - Runs on class init. The Singleton class instantiates itself (PRIVATE)
            @function
            @example run the init() function at the end, before returning the class instance.
            */
            var currentWindowId = -1;

            var init = function () {
                initLogger();
                // Fill private members
                _osInfo = initOsInfo();
                updateOSData(); //update the OS data async from the nmHost                   
                _browserInfo = initBrowserInfo();
                _configFileObject = fetchConfigFile(_configFileUrl);



                initCurrentWindowId();
            };

            function updateOSData() {
                var nmWrapper = getNmHostWrapper();
                var getOSLocaleMsg = { namespace: "Environment", funcName: "getOSLocale", parameters: [] };
                nmWrapper.sendMessage(getOSLocaleMsg, function (osLocalObj) {
                    if (osLocalObj.result) {
                        _osInfo.result.locale = osLocalObj.result;
                    }
                });

                var getOSEditionMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_LOCAL_MACHINE", "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", "EditionID"] };
                nmWrapper.sendMessage(getOSEditionMsg, function (osEditionObj) {
                    if (osEditionObj.result) {
                        _osInfo.result.edition = osEditionObj.result;
                    }
                });

                var getOSServicePackMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_LOCAL_MACHINE", "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", "CSDVersion"] };
                nmWrapper.sendMessage(getOSServicePackMsg, function (osServicePackObj) {
                    if (osServicePackObj.result) {
                        _osInfo.result.servicePack = osServicePackObj.result;
                    }
                });
            }

            // TODO: CHROME1 - Add support for multiple toolbars in next iteration.
            this.getToolbarPosition = function () {
                var index = multiToolbarsHandler.getExtPlacementInShownTBList();
                var oldToolbarFactor = multiToolbarsHandler.getNumberOfOldToolbars();
                var topStart = 0;
                if (index && oldToolbarFactor)
                    topStart = index * TOOLBAR_HEIGHT * oldToolbarFactor;
                if (index && !oldToolbarFactor)
                    topStart = index * TOOLBAR_HEIGHT;
                if (!index && oldToolbarFactor)
                    topStart = oldToolbarFactor * TOOLBAR_HEIGHT;

                return { result: { left: 0, top: topStart },
                    status: 0,
                    description: ''
                };
            };

            /**
            @description - Creates a standard conduit return object (PRIVATE)
            @property {Function} resultBuildFunction - A function that creates the result part of the conduit return object
            @function
            @example return createConduitReturnObject(function() { ... return result}).
            */
            var createConduitReturnObject = function (resultBuildFunction) {
                var returnObject = {
                    'result': null,
                    'status': 0,
                    'description': ''
                };

                try {
                    var result = resultBuildFunction();
                    returnObject.result = result;
                }
                catch (e) {
                    returnObject.status = 9999;
                    returnObject.description = e.toString();
                }

                return returnObject;
            };

            /**
            @description - Init operating system info member (PRIVATE)
            @function
            @returns {Object} - Operating system type, version, locale
            */
            var initOsInfo = function () {
                return createConduitReturnObject(function () {
                    var osServicePack;
                    var osBitType;
                    var osEdition;

                    var regexOsInfo = /.*?\((.*?)\s(.*?)\)/;
                    var osInfoArray = _userAgent.match(regexOsInfo);

                    var osFullVersion = osInfoArray[2].indexOf(";") != -1 ? osInfoArray[2].split(";")[0] : osInfoArray[2];
                    var arrorsFullVersion = osFullVersion.split(" ");
                    var osNumber = null;
                    for (var i = 0; i < arrorsFullVersion.length; i++) {
                        if (arrorsFullVersion[i].indexOf(".") != -1) {
                            osNumber = arrorsFullVersion[i];
                            break;
                        }
                    }

                    var osLocale = navigator.language;

                    // bit type
                    osBitType = "32Bit";
                    if (_userAgent && (/WOW64/ig.test(_userAgent) || /Win64/ig.test(_userAgent))) {
                        osBitType = "64Bit";
                    }

                    var osInfo = {
                        'type': osInfoArray[1],
                        'version': osNumber,
                        'locale': osLocale,
                        'servicePack': osServicePack,
                        'bitType': osBitType,
                        'edition': osEdition
                    };

                    return osInfo;
                });
            };


            /**
            @description - Init browser info member (PRIVATE)
            @function
            @returns {Object} - Browser type, version, locale
            */
            var initBrowserInfo = function () {
                return createConduitReturnObject(function () {
                    var regexBrowserInfo = /(Chrome)\/([0-9\.]+)/;
                    var browserInfoArray = _userAgent.match(regexBrowserInfo);
                    var browserInfo = {
                        'type': browserInfoArray[1],
                        'version': browserInfoArray[2],
                        'locale': navigator.language,
                        'direction': chrome.i18n.getMessage('@@bidi_dir') ? (chrome.i18n.getMessage('@@bidi_dir')).toUpperCase() : chrome.i18n.getMessage('@@bidi_dir'),
                        'bitType': '32Bit' // chrome only runs as 32 bit application
                    };

                    return browserInfo;
                });
            };

            /**
            @description - Fetch the specified config file (PRIVATE)
            @function
            @returns {Object} - Config file JSON
            */
            var fetchConfigFile = function (configFileUrl) {
                var ajaxResponse = $.ajax({
                    url: configFileUrl,
                    type: 'GET',
                    async: false,
                    error: function (jqXHR, textStatus, errorThrown) {
                        throw errorThrown;
                    }
                });

                var configFileObject = JSON.parse(ajaxResponse.responseText);

                return configFileObject;
            };

            // Public functions
            /**
            @description Get operating system information - PUBLIC
            @function
            @returns {Object} - Type, version, locale
            @example if (environment.getOSInfo().version === 'WindowsNT5.1')
            */
            this.getOSInfo = function () {
                return _osInfo;
            };

            /**
            @description Get browser information - PUBLIC
            @function
            @returns {Object} - Type, version, locale
            @example if (environment.getBrowserInfo().type === 'Chrome')
            */
            this.getBrowserInfo = function () {
                return _browserInfo;
            };

            /**
            @description - Get engine version - PUBLIC
            @function
            @returns {String} - engine version
            @comment this method must get the config.json resource on every call, because storage is not in this layer
            */
            this.getEngineVersion = function () {
                return createConduitReturnObject(function () {
                    // Read the config file from extension folder
                    var configFileUrl = chrome.extension.getURL('initData.json');
                    var configFileObject;

                    if (_configFileObject) {
                        configFileObject = _configFileObject;
                    } else {
                        configFileObject = fetchConfigFile(configFileUrl);
                    }

                    // Get the engine version from the config file object
                    var engineVersion = configFileObject.engineVersion;

                    return engineVersion;
                });
            };

            /**
            @description Get user data path - PUBLIC
            @function
            @returns {String} - user data path.
            */
            this.getUserDataPath = function () {
                return conduit.abstractionlayer.commons.generic.unsupportedFunction();
            };


            /**
            @description Get application path - PUBLIC
            @function
            @property {String} path - relative path
            @returns {String} - The full path in the chrome extension.
            @example conduit.backstage.environment.getApplicationPath().result + 'js/moodale.ataBomba.js'
            */
            this.getApplicationPath = function () {
                return {
                    'result': chrome.extension.getURL(''),
                    'status': 0,
                    'description': ''
                };
            };


            this.getApplicationDirName = function () {
                return {
                    'result': 'tb',
                    'status': 0,
                    'description': ''
                };
            };

            var sendCommonSysReqMsg = function sendCommonSysReqMsg(settings) {
                if (!settings || !settings.msgName) { return; }

                var errorData = {}, data = settings.data || {};
                if (document.location.href.toUpperCase().indexOf("/\BACKSTAGE.HTML") > -1 || document.location.href.toUpperCase().indexOf("/BACKSTAGE.HTML") > -1) {
                    chrome.tabs.getSelected(null, function (tab) {
                        //logs
                        if (settings.log) {
                            errorData.errorMessage = 'msg name: ' + setting.msgName + ',  tab.id: ' + tab.id;
                            conduit.abstractionlayer.commons.logging.internal.logDebug(errorData);
                        }

                        data.msgExtraData = data.msgExtraData || {};
                        data.msgExtraData.tabId = tab.id;

                        cbsMessagesBus.sendSysReq(settings.msgName + "_replaceToViewId", settings.msgName, data, settings.callback);
                    });
                }
                else {
                    cbsMessagesBus.sendSysReq("getMyViewId", "environment.common.js", {}, function (response) {
                        if (!response || !response.viewId) {
                            if (typeof (settings.error) === 'function') {
                                settings.error(response);
                            }
                            return;
                        }

                        //logs
                        if (settings.log) {
                            errorData.errorMessage = 'msg name: ' + setting.msgName + ', response.viewId: ' + response.viewId;
                            conduit.abstractionlayer.commons.logging.internal.logDebug(errorData);
                        }

                        albMessagesBus.sendSysReq(settings.msgName + "_" + response.viewId, settings.msgName, data, settings.callback);
                    });
                }
            }


            /*
            @description Get screen width - PUBLIC
            */
            this.getScreenWidth = function (callback) {
                var gotAnsScreenWidth = false;
                var counterAnsScreenWidth = 0;
                //logs
                var errorData = {
                    namespace: 'getScreenWidth',
                    functionName: 'commons.environment',
                    errorMessage: 'start'
                };
                conduit.abstractionlayer.commons.logging.internal.logDebug(errorData);

                setTimeout(function didGetAnsLoop() {
                    if (gotAnsScreenWidth || counterAnsScreenWidth >= 10) {
                        gotAnsScreenWidth = false;
                        counterAnsScreenWidth = 0;
                    }
                    else {
                        setTimeout(didGetAnsLoop, 4000);
                        sentMsgToGetScreenWidth(callback);
                        counterAnsScreenWidth++;
                        //logs
                        var errorData = {
                            namespace: 'getScreenWidth',
                            functionName: 'commons.environment',
                            errorMessage: 'second try: ' + counterAnsScreenWidth
                        };
                        conduit.abstractionlayer.commons.logging.internal.logDebug(errorData);
                    }
                }, 4000);


                var sentMsgToGetScreenWidth = function (callback) {
                    sendCommonSysReqMsg({
                        msgName: 'getScreenWidth',
                        data: {
                            type: 'getScreenWidth'
                        },
                        callback: function (response) {
                            gotAnsScreenWidth = true;
                            //logs
                            errorData.errorMessage = 'after msg from front stage, got width: ' + response;
                            conduit.abstractionlayer.commons.logging.internal.logDebug(errorData);
                            errorData.errorMessage = 'after msg from front stage, callback: ' + callback;
                            conduit.abstractionlayer.commons.logging.internal.logDebug(errorData);
                            if (callback) {
                                callback({ result: response, status: 0, description: '' });
                            }
                        }
                    });
                };

                sentMsgToGetScreenWidth(callback);
            };

            this.getScreenHeight = function (callback) {
                var gotAnsScreenHeight = false;
                var counterAnsScreenHeight = 0;
                //logs
                var errorData = {
                    namespace: 'getScreenHeight',
                    functionName: 'commons.environment',
                    errorMessage: 'start at: ' + new Date()
                };
                conduit.abstractionlayer.commons.logging.internal.logDebug(errorData);

                setTimeout(function didGetAnsLoop() {
                    if (gotAnsScreenHeight || counterAnsScreenHeight >= 10) {
                        gotAnsScreenHeight = false;
                        counterAnsScreenHeight = 0;
                    }
                    else {
                        setTimeout(didGetAnsLoop, 4000);
                        sentMsgToGetScreenHeight(callback);
                        counterAnsScreenHeight++;
                        //logs
                        var errorData = {
                            namespace: 'getScreenHeight',
                            functionName: 'commons.environment',
                            errorMessage: 'second try: ' + counterAnsScreenHeight
                        };
                        conduit.abstractionlayer.commons.logging.internal.logDebug(errorData);
                    }
                }, 4000);

                var sentMsgToGetScreenHeight = function (callback) {
                    sendCommonSysReqMsg({
                        msgName: 'getScreenHeight',
                        data: {
                            type: 'getScreenHeight'
                        },
                        callback: function (response) {
                            gotAnsScreenHeight = true;
                            // logs
                            errorData.errorMessage = 'after msg from front stage, got height: ' + response;
                            conduit.abstractionlayer.commons.logging.internal.logDebug(errorData);
                            errorData.errorMessage = 'after msg from front stage, callback: ' + callback;
                            conduit.abstractionlayer.commons.logging.internal.logDebug(errorData);

                            callback({ result: response, status: 0, description: '' });
                        },
                        error: function () {
                            callback({ result: false, status: 0, description: '' });
                        }
                    });
                };
                sentMsgToGetScreenHeight(callback);
            };

            /*
            @description Get window width - PUBLIC
            */
            this.getWindowWidth = function (callback) {
                sendCommonSysReqMsg({
                    msgName: 'getWindowWidth',
                    data: {
                        type: 'getWindowWidth'
                    },
                    callback: function (response) {
                        if (callback) {
                            callback({ result: response, status: 0, description: '' });
                        }
                    }
                });
            };

            this.getWindowHeight = function (callback) {
                sendCommonSysReqMsg({
                    msgName: 'getWindowHeight',
                    data: {
                        type: 'getWindowHeight'
                    },
                    callback: function (response) {
                        if (callback) {
                            callback({ result: response, status: 0, description: '' });
                        }
                    }
                });
            };

            this.getScreenOffset = function (callback) {
                if (callback) {
                    callback({ result: { top: 0, left: 0 }, status: 0, description: '' });
                }
            };


            this.getProfileData = function (callback) {
                try {

                    var nmWrapper = getNmHostWrapper();
                    var getLocalStateMsg = { namespace: "Context", funcName: "getLocalStateData", parameters: [] };
                    nmWrapper.sendMessage(getLocalStateMsg, function (resObj) {
                        if (resObj.status == 0 && resObj.result) {
                            var dataObj = JSON.parse(resObj.result);
                            var numberOfProfiles = Object.keys(dataObj.profile.info_cache).length;
                            var activeProfiles = dataObj.profile.last_active_profiles || [];
                            var activeProfileIsDefault = !!(activeProfiles.length === 1 && String(activeProfiles[0]).toLowerCase() === 'default');
                            var activeProfileToReport = activeProfiles.length === 0 ? 'Unknown' : (activeProfiles.length === 1 ? (activeProfileIsDefault ? 'Default' : 'Custom') : 'Multiple Profiles');
                            var isSignedIn = !!(activeProfiles.length === 1 && dataObj.profile.info_cache[activeProfiles[0]] && dataObj.profile.info_cache[activeProfiles[0]].user_name);

                            var obj = {
                                result: {
                                    "activeProfile": activeProfileToReport,
                                    "activeProfileIsDefault": activeProfileIsDefault,
                                    "numberOfProfiles": numberOfProfiles,
                                    "signedIn": isSignedIn
                                },
                                status: 0,
                                description: ""
                            };
                            callback(obj);
                            return;
                        }
                        else {
                            callback(resObj);
                        }
                    });
                }
                catch (err) {
                    if (callback) {
                        callback({ 'result': false, 'status': 9999, 'description': 'unknown error' });
                    }
                }
            };

            /*
            @description Get Global UserId - PUBLIC
            */
            this.getGlobalUserId = function (callback) {
                var nmWrapper = getNmHostWrapper();
                var getGlobalUserIdMsg = { namespace: "Environment", funcName: "getGlobalUserId", parameters: [] };
                nmWrapper.sendMessage(getGlobalUserIdMsg, function (objGlobalUserId) {
                    var response;
                    if (objGlobalUserId.result) {
                        response = {
                            'result': objGlobalUserId.result.replace("{", "").replace("}", ""),
                            'status': 0,
                            'description': ''
                        };
                    }
                    else {
                        response = objGlobalUserId;
                    }
                    if (callback) {
                        callback(response);
                    }
                });
            }

            //#ifdef JASMINE
            // Public functions for Jasmine specs to test private functions of this class
            this.testFetchConfigFile = fetchConfigFile;
            this.testCreateConduitReturnObject = createConduitReturnObject;
            //#endif                       

            this.setActiveCTIDChange = function () {
                var configFileObject;

                if (_configFileObject) {
                    configFileObject = _configFileObject;
                } else {
                    var configFileUrl = chrome.extension.getURL('initData.json');
                    configFileObject = fetchConfigFile(configFileUrl);
                }

                var activeCTIDkey = Repository.getKey(configFileObject.Ctid + "." + "activeCTID").result;
                cbsMessagesBus.postTopicMsg('context.setActingCTID', 'env', { original: configFileObject.Ctid, active: activeCTIDkey });
            };



            // Init the environment singleton
            init();
        };

        //return the class to Singleton object
        return new conduit.abstractionlayer.commons.environment;
    })();

    // Set the global aliases
    conduit.abstractionlayer.commons.environment = Environment;

    //#ifdef DBG
} catch (ErrorCreateObject) {
    console.error('Exception in ' + 'environment' + ' class: ', ErrorCreateObject.stack ? ErrorCreateObject.stack.toString() : ErrorCreateObject.toString());
}
//#endif

/**
* @fileOverview this class has generic data about the toolbar
* FileName :  generic.common
* FilePath : ../src/main/js/common/generic.common.js
* Date : 22/6/2011 11:18:00 PM 
* Copyright: Realcommerce & Conduit.
* @author michal naor
*/

conduit.register('abstractionlayer.commons.generic', new function () {
    var Errors = conduit.abstractionlayer.utils.errors;

    /************** PUBLIC FUNCTIONS **********************/
    /**
    @description return true for all the functions that chrome abs supports 
    @function isSupportedFunction
    @property {String} strFunctionName - the function name we want to check if the abs layer supports
    */
    var isSupportedFunction = function (strFunctionName) {
        if (!strFunctionName) {
            return Errors.get(9000);
        }

        var localPath = conduit;
        var arrPath = strFunctionName.split(".");
        for (var i = 0; i < arrPath.length; i++) {
            if (localPath[arrPath[i]]) {
                localPath = localPath[arrPath[i]];
            }
            else {
                return Errors.get(0);
            }
        }

        return Errors.get(1);
    };

    var unsupportedFunction = function (callback) {
        console.log("Traced function is unsupported in Chrome");

        if (callback && typeof callback === 'function') {
            callback(Errors.get(1201));
        }

        return Errors.get(1201);
    };

    /* PUBLIC INTERFACE */
    return {
        isSupportedFunction: isSupportedFunction,
        unsupportedFunction: unsupportedFunction
    };
});

//****  Filename: idle.front.js
//****  FilePath: main/js/idle
//****
//****  Author: Hezi.Abrass
//****  Date: 14.07.11
//****  Class Name: conduit.abstractionlayer.commons.idle
//****  conduit.abstractionlayer.commons.idle.onChangeState.addEventListener
//****  Type:
//****  Description: Used to determine whenever the user is leaving IDLE mode (no user input of any kind).
//****
//****  Inherits from:
//****
//****  Usage:
//****
//****  Copyright: Realcommerce & Conduit.
//****

conduit.register("abstractionlayer.commons.idle", new function () {
    var Errors = conduit.abstractionlayer.utils.errors;
    var Messages = conduit.abstractionlayer.commons.messages;


    //#region events 

    /**
    @description Adds a callback function listener that will receive events on idle state change.
    @function onChangeState.AddEventListsner
    @property {Int} threshold - Threshold in seconds
    @property {Function} callback - The response callback
    
    min threshold time is 15 sec.
    */

    var onChangeState = function (threshold, callback) {
        if (!callback) {
            return Errors.get(9001);
        }
        else if (!threshold) {
            callback(Errors.get(9000));
            return Errors.get(9000);
        }
        else if (isNaN(threshold)) {
            callback(Errors.get(2600));
            return Errors.get(2600);
        }

        else if (threshold < 15) {
            return Errors.get(1107);
        }
        else {
            try {
                var changeStateData = {
                    'threshold': threshold
                }
                changeStateData = JSON.stringify(changeStateData);
                Messages.sendSysReq('idle_onChangeState', 'abstractionlayer.idle.front.js', changeStateData, callback);
                return Errors.get(1);
            } catch (tabError) {
                callback(Errors.get(0));
            }

        }
    };
    //#endregion

    return {
        onChangeState: {
            addEventListener: onChangeState
        }
    };
}); 
//****  Filename: files.common.js
//****  FilePath: main/js/files
//****
//****  Author: Hezi.Abrass
//****  Date: 27.07.11
//****  Class Name: conduit.abstractionlayer.commons.files
//****  Type:
//****  Description: This library is used for writing and modifying local files and directories.
//****  It is implemented only in IE and FF. for chrome - we wrap the functions and use the repository.
//****
//****  Inherits from:
//****
//****  Usage:
//****
//****  Copyright: Realcommerce & Conduit.
//****
// the following functions are implemented - validation only.
//conduit.abstractionlayer.commons.files write
//conduit.abstractionlayer.commons.files read
//conduit.abstractionlayer.commons.files deleteFile
//conduit.abstractionlayer.commons.files isFileExists

conduit.register("abstractionlayer.commons.files", new function () {
    var Errors = conduit.abstractionlayer.utils.errors;
    var Repository = conduit.abstractionlayer.commons.repository;



    var getNmHostWrapper = function () {
        var nmWrapper = "";
        if (conduit.abstractionlayer.utils.general.isBackstage) {
            nmWrapper = conduit.abstractionlayer.backstage.nmWrapper
        } else {
            nmWrapper = conduit.abstractionlayer.frontstage.nmWrapper;
        }
        return nmWrapper;
    }
    /**
    @description Writes a file to a path.
    @function write(path, data, binaryFile, type);
    @property {string} path
    @property {Boolean} data
    @property {binaryFile} No validations (false) Binary encoding must be base64
    @property {string} type - default value (�overwrite�)"overwrite, append" (not case sensitive)
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    */
    var write = function (path, data, binaryFile, type, callback) {
        if (!type || typeof type !== 'string') {
            type = "overwrite";
        }

        if (binaryFile === undefined || binaryFile === null || typeof binaryFile !== 'boolean') {
            binaryFile = false;
        }

        if (!path || data != "" && !data) {
            if (callback) {
                callback(Errors.get(9000));
            }
            return;

        }
        else if (path.length > 255) {//Length of the path < 255
            if (callback) {
                callback(Errors.get(1108));
            }
            return;
        }

        else {
            conduit.abstractionlayer.commons.repository.setData(path, escape(data), binaryFile, type, function (res) {
                if (callback) {
                    callback(res)
                }
            });
        }

    };

    /**
    @description Reads a file from a path.
    @function read(path, binaryFile);
    @property {string} path
    @property {binaryFile} No validations (false) Binary encoding must be base64
    Returned JSON object:
    on success : { result:  �data from file�, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */

    var read = function (path, binaryFile, callback) {
        if (!path) {
            callback(Errors.get(9000));
            return;
        }

        if (binaryFile === undefined || binaryFile === null || typeof binaryFile !== 'boolean') {
            binaryFile = false;
        }

        else if (path.length > 255) {//Length of the path < 255
            callback(Errors.get(1108));
            return;
        }
        else {
            conduit.abstractionlayer.commons.repository.getData(path, binaryFile, function (fileReadResult) {
                if (fileReadResult && fileReadResult.result) {
                    fileReadResult.result = unescape(fileReadResult.result);
                }
                if (callback) {
                    callback(fileReadResult);
                }

            });
        }

    };

    /**
    @description Deletes a file from a path.
    @function deleteFile(path);
    @property {string} path
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */

    var deleteFile = function (path, callback) {
        if (!path) {
            if (callback) {
                callback(Errors.get(9000));
            }
            return;
        }
        else if (path.length > 255) {//Length of the path < 255
            if (callback) {
                callback(Errors.get(1108));
            }
            return;
        }

        else {
            conduit.abstractionlayer.commons.repository.removeData(path, function (res) {
                if (callback) {
                    callback(res);
                }
            });
        }

    };

    /**
    @description Deletes a file from a path.
    @function isFileExists(path);
    @property {string} path
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */
    var isFileExists = function (path, callback) {


        conduit.abstractionlayer.commons.repository.hasData(path, function (res) {
            if (callback) {
                callback(res);
            }
        });

    };

    //for functions not implemented we return: 
    //conduit.abstractionlayer.commons.generic.unsupportedFunction();

    /**
    @description Deletes a directory from the system.
    @function deleteDirectory(path);
    @property {string} path
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */
    var deleteDirectory = function (path) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    /**
    @description Check if the file is read only.
    @function isFileReadOnly(path);
    @property {string} path
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */
    var isFileReadOnly = function (path) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    /**
    @description Sets or unsets single file.
    @function setFileReadOnly(path);
    @property {string} path
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */
    var setFileReadOnly = function (path) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    /**
    @description Sets or unsets whole directory and it�s sub -files.
    @function setDirectoryReadOnly(path);
    @property {string} path
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */
    var setDirectoryReadOnly = function (path) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    /**
    @description Create new directory.
    @function createDirectory(path);
    @property {string} path
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */
    var createDirectory = function (path, callback) {
        //all validations are in the host
        var nmWrapper = getNmHostWrapper();
        //setData params : isGlobal , fileName,value, isBinary, type
        var createDirMsg = { namespace: "Files", funcName: "createDirectory", parameters: [path] };
        nmWrapper.sendMessage(createDirMsg, function (response) {
            if (callback) {
                callback(response);
            }
        });

    };

    /**
    @description Is directory exists.
    @function isDirectoryExists(path);
    @property {string} path
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */
    var isDirectoryExists = function (path, callback) {

        var nmWrapper = getNmHostWrapper();       
        var createDirMsg = { namespace: "Files", funcName: "isDirectoryExist", parameters: [path] };
        nmWrapper.sendMessage(createDirMsg, function (response) {
            if (callback) {
                callback(response);
            }
        });
    };

    /**    
    @description Returns a list of all the directories and files in specific directory.
    @function getAllFiles(path);
    @property {string} path
    @property {boolean} recursive
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */
    var getAllFiles = function (path, recursive, callback) {
        var nmWrapper = getNmHostWrapper();
        var getAllFilesMsg = { namespace: "Files", funcName: "getFilesInDir", parameters: [path, recursive] };
        nmWrapper.sendMessage(getAllFilesMsg, function (response) {
            if (callback) {
                callback(response);
            }
        });
    };

    /**
    @description copy File.
    @function copy(path);
    @property {string} path
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */
    var copy = function (path) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    /**
    @description Rename File.
    @function rename(path);
    @property {string} path
    Returned JSON object:
    on success : { result:  true, status: 0, description: ""}
    on error : { result: "", status: XXXX, description: "Error Description"}
    Function error codes: 
    */
    var rename = function (path) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    //#region helper functions 
    /******************************************************VALIDATIONS*********************************************/

    /**
    @description checks valid path using RegExp and returns true/false
    @function checkPath(pathString);
    @property {string} pathString
    */
    //        // trim left space
    //        strUrl = strUrl.replace(/^\s+|\s+$/g, "");
    var checkPath = function (pathString) {

        //        // trim left space
        //        strUrl = strUrl.replace(/^\s+|\s+$/g, "");

        var pathRegx = "([a-zA-Z]:(\\w+)*\\[a-zA-Z0_9]+)?.txt";

        var pathRegxString = new RegExp(pathRegx);
        if (pathRegxString.test(pathString)) {

            return true;
        } else {
            console.error("Files: failed path RegExp testing for path", pathString);
            return false;
        }
    };

    var checkPathWithFileName = function (pathString) {

        var file = sp[sp.length - 1];


        //var pathRegx = "[^\/\/:?<>|]+$";
        var pathRegx = "^([a-zA-Z]+[.]{1})+([a-zA-Z])+$";

        var pathRegxString = new RegExp(pathRegx);

        if (pathRegxString.test(file)) {
            return true;
        } else {
            console.error("Files: failed filenamepath RegExp testing for path", file);
            return false;
        }
    };

    var checkFileExist = function (path) {
        var checkFile = null;
        var isFileExist = null;
        $(checkFile).load(path, function () {
            //console.log(checkFile.length);
            if (checkFile.length() < 1) {
                isFileExist = false;
                return isFileExist;
            }
            else {
                isFileExist = true;
                return isFileExist;
            }
        });
    };
    
    /******************************************************VALIDATIONS*********************************************/

    //#endregion

    return {
        isFileExists: isFileExists,
        isDirectoryExists: isDirectoryExists,
        createDirectory: createDirectory,
        getAllFiles: getAllFiles
        /* write: write,
        read: read,
        deleteFile: deleteFile,
        deleteDirectory: deleteDirectory,
        isFileReadOnly: isFileReadOnly,
        setFileReadOnly: setFileReadOnly,
        setDirectoryReadOnly: setDirectoryReadOnly,       
        copy: copy,
        rename: rename*/
    };
});
/**
* @fileOverview This library is wrapping the repository class TMP IMPLIMENTION UNTIL WE WILL START TO USE THE NPAPI!!!
* FileName : storage.common.js <br/>
* FilePath : main/js/storage/storage.common.js <br/>
* Date : 26.06.11 <br/>
* Copyright: Realcommerce & Conduit.
* @author michal n
*/

//#ifdef DBG
try {
    //#endif

    conduit.register("abstractionlayer.commons.storage", (function () {
        //aliases
        var Consts = conduit.utils.consts;
        var Repository = conduit.abstractionlayer.commons.repository;
        var Errors = conduit.abstractionlayer.utils.errors;
        //prefix to all the key - every key which sets by this class will appear with a prefix (transparent to the user
        //makes the functions access only to keys that was set from storage)
        var constStoragePrefix = "Storage.";


        /************** PUBLIC FUNCTIONS **********************/
        /**
        @description sets Pref in local storage -later will be accessable only to Storage api functions
        @function setPref
        @property {String} key - key name that will be saved in local storage
        @property {String} value - value that will be saved in local storage
        */
        var setPref = function (key, value) {
            if (!key) {
                return Errors.get(9000);
            }

            var newKey = constStoragePrefix + key;
            if (!value) {
                value = "";
            }
            var result = Repository.setKey(newKey, value);
            return result;
        };

        /**
        @description gets Pref in local storage -can access keys that where set by setPref
        @function getPref
        @property {String} key - key name that will be saved in local storage
        */
        var getPref = function (key) {
            if (!key) {
                return Errors.get(9000);
            }

            return Repository.getKey(constStoragePrefix + key);
        };

        /**
        @description return if the key name exist in local storage -can access keys that where set by setPref
        @function hasUserValue
        @property {String} key - key name that we want to know if it exists in local storage
        */
        var hasUserValue = function (key) {
            if (!key) {
                return Errors.get(9000);
            }
            var newKey = constStoragePrefix + key;
            return Repository.hasKey(newKey);
        };

        var clearBranch = function () {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        // TODO - needs to be checked when tester is ok
        /**
        @description clear the value of the given key (value will be set to: value="") -can access keys that where set by setPref
        @function clear
        @property {String} key - key name that we want to clear
        */
        var clear = function (key) {
            if (!key) {
                return Errors.get(9000);
            }
            var newKey = constStoragePrefix + key;

            var hasKey = Repository.hasKey(newKey);

            if (hasKey.result === true) {
                return Repository.setKey(newKey, " "); // Setting key with empty string
            }
            else {
                return hasKey;
            }
        };

        // TODO - needs to be checked when tester is ok
        /**
        @description delete the value of the given key (deletes both value and key) -can access keys that where set by setPref
        @function removePref
        @property {String} key - key name that we want to delete
        */
        var removePref = function (key) {
            if (!key) {
                return Errors.get(9000);
            }
            var newKey = constStoragePrefix + key;
            return Repository.removeKey(newKey);
        };

        function setTripleKey(key, value, callback) {
            var localResult = localStorage.setItem(key, value);
            var fileResult = "";
            Repository.setData(key, value, function (resp) {
                fileResult = resp.result;
                Repository.setRegKeyAsync(key, value, function (response) {
                    regResult = response.result;
                    if (callback) {
                        callback({ result: { file: fileResult, registry: regResult, local: localResult }, status: 0, description: "" });
                    }
                });
            });



            
        }

        function getTripleKey(key, callback) {
            var localResult = localStorage.getItem(key);
            // backward compatibility code
            var oldItem;
            try {
                oldItem = JSON.parse(localResult);
                oldItem = oldItem && oldItem.itemData;
                if (oldItem) {
                    localResult = oldItem;
                }
            } catch (e) { }
            // BC end
            var fileResult;
            var regResult;
            Repository.getRegKeyAsync(key, function (resp) {
                regResult = resp.result;
                Repository.getData(key, false, function (response) {
                    fileResult = response.result;
                    if (callback) {
                        callback({ result: { file: fileResult, registry: regResult, local: localResult }, status: 0, description: "" });
                    }
                });
            });

        }
        /**************exposed methods******************/
        return {
            setPref: setPref,
            clear: clear,
            getPref: getPref,
            hasUserValue: hasUserValue,
            removePref: removePref,
            clearBranch: clearBranch,
            setTripleKey: setTripleKey,
            getTripleKey: getTripleKey
        };
    } ()));
    //#ifdef DBG
} catch (e) {
    console.error('Exception in ' + 'storage' + ' class: ', e.stack ? e.stack.toString() : e.toString());
}
//#endif
/**
* @fileOverview Abstraction layer common appFiles singletons <br/>
* FileName : appFiles.common.js <br/>
* FilePath : AbstractionLayer\src\main\js\appFiles\appFiles.common.js <br/>
* Date : 2011-12-01 14:45 <br/>
* Copyright: Conduit.
* @author <strong> michal </strong>
*/

/**
* This library is contains appFiles related functionality in both frontstage & backstage.
*/
try {
    conduit.register("abstractionlayer.commons.appFiles", (function () {
        var Errors = conduit.abstractionlayer.utils.errors;




        var deployBrowserAppApi = function (relativePath) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /*
        @description - Copies full directory content to a directory given in \tb relative path
        @function - deployApp
        @property {string} sourcePath - full path to directory which will be copied
        @property {string} destDirName - relative path  in tb which the directory will be copied to
        @property {boolean} overwrite - will it overwrite if there is existing dir at the dest. default - true
        */
        var deployApp = function (sourcePath, destDirName, overwrite) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };


        /*
        @description - Delete full directory content from a given path inside \tb relatively.
        @function - removeApp
        @property {string} destDirName - relative path  in tb which the directory will be copied to
        */
        var removeApp = function (destDirName) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /*
        @description - Gets the files in a specific directory under \tb
        @function - getWebAppFiles
        @property {string} relativePath - relative path in tb
        @property {boolean} recursive - will it overwrite if there is existing dir at the dest. default - false
        */
        var getWebAppFiles = function (relativePath, recursive) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /*
        @description - Reads a file from a path.- relative from \tb directory
        @function - readWebAppFile
        @property {string} filePath - relative path in tb
        @property {string} pathEnum - defualt = Extension Base Path
        */
        var readWebappFile = function (filePath, pathEnum) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /*********************************************************api********************************************************/
        return {
            deployApp: deployApp,
            removeApp: removeApp,
            getWebAppFiles: getWebAppFiles,
            readWebappFile: readWebappFile,
            deployBrowserAppApi: deployBrowserAppApi
        };
    } ()));
} catch (e) {
    console.error('Exception in ' + 'appFiles' + ' class: ', e.stack ? e.stack.toString() : e.toString());
}

try {
    conduit.register("abstractionlayer.commons.autoComplete", (function () {
        return {
            setConfiguration: function () { },
            getConfiguration: function () { },
            changeState: function () { }
        }
    })());
}
catch (e) {
    console.error('Exception in ' + 'autoComplete' + ' class: ', e.stack ? e.stack.toString() : e.toString());
}


/**
* @fileOverview this function handles ajax reequest <br/>
* FileName : http.front.js <br/>
* FilePath : AbstractionLayer/src/main/js/http/http.front.js <br/>
* Date : 04.07.2011 <br/>
* Copyright: Realcommerce & Conduit.
* @author <strong> Yoav Shafir </strong>
*/

/**
*simplae ajax request - calls back stage to execute
*@class simplae ajax request (SINGLETON).
*/

conduit.register('abstractionlayer.commons.http', new function () {
    var httpRequest = function (url, type, postParams, headers, username, password, timeout, Callback) {
        //Alias
        var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages :  conduit.abstractionlayer.commons.messages;
        var albMessagesBus = typeof albMessages  != "undefined" ? albMessages :  conduit.abstractionlayer.commons.messages;

        //put all arguments in an object for the send request.
        var objToHttpRequestBack = {
            url: url,
            type: type,
            postParams: postParams,
            headers: headers,
            username: username,
            password: password,
            timeout: timeout
        }

        var destLogicalName = "getHttpRequestFromBack";
        var destSenderName = "abstractionlayer.commons.http";

        //msg to back
        albMessagesBus.sendSysReq(destLogicalName, destSenderName, JSON.stringify(objToHttpRequestBack),
        function (result) {
            if ($.isFunction(Callback)) {
                //console.error('Result', result);
                Callback(result);
            }
        });

    }

    /**
    @description downloads a file from a remote server to a local path (any path. major security breach) on the computer.
    @function
    @property {string} url - URL to download.
    @property {string} path - Path to download to.
    @property {function} Callback - function to be executed on success or error.
    */
    var httpDownloadFile = function (url, path, pathEnum, callback) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

 
    /* PUBLIC API */
    return {
        httpRequest: httpRequest,
        httpDownloadFile: httpDownloadFile
    }
});

/**
* @fileOverview Abstraction layer common appMethods singletons <br/>
* FileName : appMethods.common.js <br/>
* FilePath : AbstractionLayer\src\main\js\appMethods\appMethods.common.js <br/>
* Date : 2011-12-04 14:45 <br/>
* Copyright: Conduit.
* @author <strong> michal </strong>
*/

/**
* This library is contains appMethods related functionality in both frontstage & backstage.
*/
try {
    conduit.register("abstractionlayer.commons.appMethods", (function () {
        var Errors = conduit.abstractionlayer.utils.errors;
        var Repository = conduit.abstractionlayer.commons.repository;
        var Context = conduit.abstractionlayer.commons.context;
        var dirName = conduit.abstractionlayer.utils.general.dirName();
        var keyName = 'gadgetsContextHash_';
        var prePopup = Consts.POPUPS.POPUP_INNER_IFRAME;

        /*********************************************************private********************************************************/
        /*
        @description - on every backstage load - it clears all the keys of the gadget context. the application layer writes them every time the bs && fs loads.
        */


        /*********************************************************public********************************************************/
        /*
        @description - Returns the relative context of the app
        @function - getContext
        @property {HTML} contentWindow 
        */
        var getContext = function (contentWindow) {
            if (!contentWindow) {
                return Errors.get(9000);
            }
            if (contentWindow && typeof contentWindow == 'string' && contentWindow.indexOf(prePopup) == 0) {
                contentWindow = contentWindow.substr(prePopup.length);
            }

            var existingValue = {};
            existingValue = localStorage.getItem(keyName + contentWindow);
            existingValue = existingValue ? { result: existingValue, status: 0, description: ''} : { result: '', status: 9999, description: '' };
            return existingValue;

        };

        /*
        @description - set’s the relevant context for embedded app
        @function - setContext
        @property {HTML} contentWindow 
        @property {string} contextData
        */
        var setContext = function (contentWindow, contextData) {
            if (!contentWindow || !contextData) {
                return Errors.get(9000);
            }
            // TODO: Remove the line below - sometimes the contentWindow already exists (from Browser Container Front?). Needs checking...
            contentWindow = (/___/.test(contentWindow)) ? contentWindow : contentWindow + "___" + dirName;
            localStorage.setItem(keyName + contentWindow, contextData);

            return Errors.get(1);
        };

        /*
        @description - Removes context data upon given contentWindow
        @function - clearContext
        @property {HTML} contentWindow 
        */
        var clearContext = function (contentWindow) {
            if (!contentWindow) {
                return Errors.get(9000);
            }
            localStorage.removeItem(keyName + contentWindow);
            return Errors.get(1);
        };

        var setNavigationAliases = function (JsonData) {
            if (window.SetNavigationAliases)
                window.SetNavigationAliases(JSON.parse(JsonData).list);
            return Errors.get(0);
        };

        //NOTE: this function is implimented in navigation handler - diffrent from other ABSs
        var getTopParentWindowName = function (DOMwindow) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /*********************************************************api********************************************************/
        return {
            getContext: getContext,
            setContext: setContext,
            clearContext: clearContext,
            setNavigationAliases: setNavigationAliases,
            getTopParentWindowName: getTopParentWindowName
        };

    } ()));
} catch (e) {
    console.error('Exception in ' + 'appMethods' + ' class: ', e.stack ? e.stack.toString() : e.toString());
}
/**
* @fileOverview Abstraction layer front appMethods singletons <br/>
* FileName : appMethods.common.js <br/>
* FilePath : AbstractionLayer\src\main\js\appMethods\appMethods.front.js <br/>
* Date : 2011-01-18 14:45 <br/>
* Copyright: Conduit.
* @author <strong> michal </strong>
*/

/**
* This library is contains appMethods related functionality in frontstage.
*/
try {
    conduit.register("abstractionlayer.frontstage.appMethods", (function () {
        var Errors = conduit.abstractionlayer.utils.errors;
        var key = 'injectScriptEmbedded';
        var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages :  conduit.abstractionlayer.commons.messages;
        var albMessagesBus = typeof albMessages  != "undefined" ? albMessages :  conduit.abstractionlayer.commons.messages;

        var setInjectScriptEmbedded = function (injectedScript) {
            return Errors.get(1);
        };

        var isSetInjectedScriptEmbedded = function () {
            return true;
        };

        var executeScriptInFrame = function (parentFrameId, nestedFrameId, script, callback) {
            //put all arguments in an object for the send request.
             cbsMessagesBus.sendSysReq("getMyTabId","appMethods.front",{}, function (response) {
                var objToExecuteScriptBack = {
                    tabId: response.tabId,
                    parentFrameId: parentFrameId,
                    nestedFrameId: nestedFrameId,
                    script: script,
                };
                var destLogicalName = "getExecuteScriptFromBack";
                var destSenderName = "abstractionlayer.frontstage.appMethods";
                albMessagesBus.sendSysReq(destLogicalName, destSenderName, JSON.stringify(objToExecuteScriptBack), function (res) {
                    callback(res);
                });
            });
        };

        return {
            setInjectScriptEmbedded: setInjectScriptEmbedded,
            isSetInjectedScriptEmbedded: isSetInjectedScriptEmbedded,
            executeScriptInFrame: executeScriptInFrame
        };

    } ()));
} catch (e) {
    console.error('Exception in frontStage' + 'appMethods' + ' class: ', e.stack ? e.stack.toString() : e.toString());
}
/**
* @fileOverview this class allow creating and destroying browser container and performing related actions.
* FileName :  browser_container.front
* FilePath : src/main/js/browser_container/browser_container.front.js
* Date :  16/02/11
* Last update:  27/6/2011 by taisiya borisov
* Copyright: Realcommerce & Conduit.
* @author Yochai.Akoka
*/

//#ifdef DBG

try {
    //#endif

    conduit.register("abstractionlayer.commons.browserContainer", (function () {

        //Aliases
        var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages : conduit.abstractionlayer.commons.messages;
        var albMessagesBus = typeof albMessages != "undefined" ? albMessages : conduit.abstractionlayer.commons.messages;
        var Consts = conduit.utils.consts;
        var Errors = conduit.abstractionlayer.utils.errors;
        var General = conduit.abstractionlayer.utils.general;
        var dirName = conduit.abstractionlayer.utils.general.dirName();
        //support gadget context
        var AppMethods = conduit.abstractionlayer.commons.appMethods;


        //Initializing the class and assign it to the namespace
        //#region methods
        var init = function () {
            initSysReqListeners();
        };

        /**
        @description Init system request listeners
        @function
        */
        //

        var initSysReqListeners = function () {
            /**replaceForTester1**/ //NOTE: DO NOT REMOVE IT
            cbsMessagesBus.sendSysReq(Consts.MESSAGES.X_TB_GET_TAB_ID, "browserContainer.front", {}, function (TabId) {
                // Listen to BC_DOCUMENT_COMPLETE message and call registered callback if one exists for bcId
                albMessagesBus.onSysReq.addListener(Consts.BROWSER_CONTAINER.REQUESTS.BC_DOCUMENT_COMPLETE, function (data, sender, sendResponse) {
                    var eventData = JSON.parse(data);
                    if (eventData.bcId) {
                        if (documentCompleteCallbacksArray[eventData.bcId] && documentCompleteCallbacksArray[eventData.bcId].callback) {
                            var frame = $('#' + Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX + eventData.bcId);
                            var url = frame.attr('src');
                            var indexOfAnchor = url.indexOf("&bcId");
                            indexOfAnchor = (indexOfAnchor != -1 && url.charAt(indexOfAnchor - 1) == "#") ? indexOfAnchor - 1 : indexOfAnchor;
                            var newUrl = indexOfAnchor != -1 ? url.substr(0, indexOfAnchor) : url;

                            documentCompleteCallbacksArray[eventData.bcId].callback(newUrl);
                        }
                    }
                });

                albMessagesBus.onSysReq.addListener('notifyBrowserContainerError_' + TabId, function (data, sender, sendResponse) {
                    $("iframe[id^=" + Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX + "]").each(function () {
                        if (this.src == data.url) {
                            var browserId = $(this).attr('id').replace(Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX, "");
                            navigationErrorCallbacksArray[browserId].callback(data.url);
                        }
                    });
                });
                // Listen to BC_WINDOW_LOADED message and call registered callback if one exists for bcId
                albMessagesBus.onSysReq.addListener(Consts.BROWSER_CONTAINER.REQUESTS.BC_WINDOW_LOADED, function (data, sender, sendResponse) {
                    var eventData = JSON.parse(data);

                    if (eventData.bcId) {
                        if (navigationCompleteCallbacksArray[eventData.bcId] && navigationCompleteCallbacksArray[eventData.bcId].callback) {
                            var frame = $('#' + Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX + eventData.bcId);
                            var url = frame.attr('src');
                            var indexOfAnchor = url.indexOf("&bcId");
                            indexOfAnchor = (indexOfAnchor != -1 && url.charAt(indexOfAnchor - 1) == "#") ? indexOfAnchor - 1 : indexOfAnchor;
                            var newUrl = indexOfAnchor != -1 ? url.substr(0, indexOfAnchor) : url;

                            navigationCompleteCallbacksArray[eventData.bcId].callback(newUrl);
                        }
                    }
                });
            });
        };

        /**
        @description remove the iframe (PUBLIC).
        @function remove
        @property {string} browId
        */
        var remove = function (browId) {
            browId = jQuery.trim(browId);
            if (!browId) {
                return Errors.get(9000);
            }
            else {
                var browserId = Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX + browId;
                //var browserContainer = $('#' + browserId);
                var browserContainer = document.getElementById(browserId);

                if (browserContainer === null) {//browserContainer.length === 0
                    return Errors.get(2103);
                }
                else {
                    //browserContainer.remove();
                    browserContainer.parentNode.removeChild(browserContainer);
                    return Errors.get(1);
                }
            }
        };

        /**
        @description adds isBrowserContainer=true key to a Browser Container url anchor (hash). (PRIVATE)
        @function addBCMarkerToUrl
        @property {string} url - the url to append the key + value pair to.
        @example - var myUrl = addBCMarkerToUrl.url('http://www.walla.co.il'); will return 'http://www.walla.co.il#isBrowserContainer=true'.
        */
        /*var addBCMarkerToUrl = function (url, browserContainerId) {
        // If no hash exists in URL - adding the hash symbol. Else - simply appending to the end of the url (assumption: hash is always at the end or a url)
        if (url.indexOf('#') == -1) {
        url += '#';
        }

        // If a bcId key doesn't exist in the anchor string yet - adding it. Else (e.g., when using Navigate) - not adding it
        if (browserContainerId && browserContainerId != '' && !conduit.abstractionlayer.utils.anchorString.keys[Consts.BROWSER_CONTAINER.BCID]) {
        url += '&' + Consts.BROWSER_CONTAINER.BCID + '=' + browserContainerId;
        }

        url += '&' + Consts.BROWSER_CONTAINER.IS_BROWSER_CONTAINER_HASH_MARKER + '=' + Consts.TRUE_STRING;
        return url;
        };
        */

        /**
        @description this function create iframe (PUBLIC).
        @function create
        @property {string} url - the source that the iframe is reference for
        @property {string} browserId - iframe id
        @property {Object} apiPermission - permissions for web apps - no use in Alfa!!
        @example - BrowserCotnainer.create('http://www.walla.co.il','someId', {permissions}); - return the iframe id
        */
        var create = function (url, browserId, apiPermission, extraDataObject) {
            browserId = jQuery.trim(browserId);
            if (!url || !browserId) {
                return Errors.get(9000);
            }

            // Adding http to the url if it doesn't exist.
            url = conduit.abstractionlayer.utils.general.addHTTPToUrl(url);

            if (chrome && chrome.extension && !chrome.extension.getURL(url) || !General.uri(url)) {
                return Errors.get(2100);
            }

            if ($("#" + Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX + browserId).length > 0) {
                return Errors.get(2101);
            }

            try {
                // Sometimes the body doesn't exist yet. if it doesn't exist yet the response might be broken.. so we do anything that can fail ahead
                var onload, id, name;

                //support gadget context
                if (browserId && extraDataObject && extraDataObject.contextData) {
                    name = browserId + "___" + dirName;
                    AppMethods.setContext(browserId, extraDataObject.contextData);
                }

                if (navigationCompleteCallbacksArray[browserId] && $.isFunction(navigationCompleteCallbacksArray[browserId].callback)) {
                    onload = navigationCompleteCallbacksArray[browserId].callback;
                }

                id = Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX + browserId;

                (function waitForBody() {
                    if (!document.body) { 
                        setTimeout(waitForBody, 50); 
                        return;
                    }

                    var iframe = document.createElement("IFRAME");
                    iframe.src = url;
                    iframe.onload = onload;
                    iframe.setAttribute('name', name);                    
                    iframe.id = id;
                    document.body.appendChild(iframe);
                }());

                return Errors.get(1);
            } catch (generalException) {
                console.error("BC General Exception: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
            }

            return Errors.get(0);
        };

        // Not implemented for now in Chrome.
        var changeSize = function () {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /**
        @description this function sendRequest to backStage to get all browsers (PUBLIC).
        @function getAllBrowsers
        */
        var getAllBrowsers = function () {
            var browserIds = [];
            var result = {};
            // ^= is a selector for tags who start with the prefix
            $("iframe[id^=" + Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX + "]").each(function () {
                var id = $(this).attr('id');
                // Replacing first occurance of BROWSER_CONTAINER_ID_PREFIX to empty string so id is what user meant.
                id = id.replace(Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX, "");
                browserIds.push(id);
            });

            if (browserIds.length > 0) {
                result = { result: browserIds, status: 0, description: "" };
            }
            else {
                result = Errors.get(0);
            }
            return result;

        };

        var refresh = function (browserId) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        // Callback container arrays
        var documentCompleteCallbacksArray = [];
        var navigationCompleteCallbacksArray = [];
        var navigationErrorCallbacksArray = [];

        /**
        @description contains an addListener function which gets a callback which will be run upon the browserContainer Id's Doc-Complete/Nav-complete/Nav-Error. (PUBLIC).
        @function
        */
        var onDocumentComplete = {};
        var onNavigateComplete = {};
        var onNavigateError = {}; // Not implemented for now in Chrome.

        onDocumentComplete.addListener = function (browserId, callback) {
            if (!browserId) {
                return Errors.get(9000);
            }
            else if (!callback || !$.isFunction(callback)) {
                return Errors.get(9001);
            }
            else {
                browserId = jQuery.trim(browserId);

                // Not checking for BC existance - always adding callback to internal callbacks array.
                // If a BC is removed on the other hand - removing it from the internal array.
                documentCompleteCallbacksArray[browserId] = {};
                documentCompleteCallbacksArray[browserId].callback = callback;
                return Errors.get(1);
            }

            return Errors.get(0);
        };

        onNavigateComplete.addListener = function (browserId, callback) {
            if (!browserId) {
                return Errors.get(9000);
            }
            else if (!callback || !$.isFunction(callback)) {
                return Errors.get(9001);
            }
            else {
                navigationCompleteCallbacksArray[browserId] = {};
                navigationCompleteCallbacksArray[browserId].callback = callback;
                return Errors.get(1);
            }

            return Errors.get(0);
        };

        onNavigateError.addListener = function (browserId, callback) {
            if (!browserId) {
                return Errors.get(9000);
            }
            else if (!callback || !$.isFunction(callback)) {
                return Errors.get(9001);
            }
            else {
                navigationErrorCallbacksArray[browserId] = {};
                navigationErrorCallbacksArray[browserId].callback = callback;
                return Errors.get(1);
            }

            return Errors.get(0);
        };

        init();

        //return the class to Singleton object
        return {
            create: create,
            remove: remove,
            changeSize: changeSize,
            getAllBrowsers: getAllBrowsers,
            onDocumentComplete: onDocumentComplete,
            onNavigateComplete: onNavigateComplete,
            onNavigateError: onNavigateError,
            refresh: refresh
        };
        //#endregion
    } ()));
    //#ifdef DBG
} catch (e) {
    console.error('Exception in ' + 'conduit.abstractionlayer.commons.browserContainer', e.stack ? e.stack.toString() : e.toString());
}
//#endif
/**
* @fileOverview Abstraction layer frontstage browser singleton <br/>
* FileName : browser.front.js <br/>
* FilePath : AbstractionLayer\src\main\js\browser\browser.front.js <br/>
* Date : 2011-04-26 11:15 <br/>
* Copyright: Realcommerce & Conduit.
* @author <strong> tomerr </strong>
* Last changes Date : 2011-06-30
* By: michal naor
*/

/**
* This library is contains browser related functionality in the frontstage.
*@class abstraction layer frontstage browser (SINGLETON)
*/
conduit.register("abstractionlayer.frontstage.browser", new function () {
    var Errors = conduit.abstractionlayer.utils.errors;
    var Messages = conduit.abstractionlayer.commons.messages;
    var albMessagesBus = typeof albMessages != "undefined" ? albMessages : conduit.abstractionlayer.commons.messages;
    var Context = conduit.abstractionlayer.commons.context;
    var lastWidth = -1;
    var lastHeight = -1;
    var arrCallbacksOnToolbarShow = [];
    var arrCallbacksOnEmbeddedError = [];
    var Repository = conduit.abstractionlayer.commons.repository;


    /*get the toolbar current visibility change*/
    var getCurrentState = function () {
        try {
            var request = new XMLHttpRequest();
            request.open('GET', chrome.extension.getURL("shouldShowTB.txt"), false);
            request.send();
            if (request.status == 200) {
                try {
                    var toolbarVisibilityStateText = request.responseText;
                    var toolbarVisibilityState = JSON.parse(toolbarVisibilityStateText);
                    if (toolbarVisibilityState && toolbarVisibilityState.toolbarShow != undefined) {
                        return toolbarVisibilityState.toolbarShow;
                    } else {
                        return true;
                    }
                } catch (e) {
                    return true;
                }
            } else {
                return true;
            }
        }
        catch (e) {
        }
        return true; // visible
    }

    var isHidden = function () {
        var state = getCurrentState();
        return { result: !state, status: 0, description: '' };
    }

    var init = function () {
        var CTID = conduit.abstractionlayer.commons.context.getCTID().result;

        /*This code is added to trigger the hidden login when hide was done from uninstaller*/
        var keyName = CTID + '.sendHiddenLoginAfterHideFromUninstaller';
        conduit.abstractionlayer.commons.repository.getRegKeyAsync(keyName, function (hideDoneByUninstaller) {
            //console.log("browser Front read sendHiddenLoginAfterHideFromUninstaller", JSON.stringify(hideDoneByUninstaller));
            if (hideDoneByUninstaller.status == 0 && hideDoneByUninstaller.result == "true") {
                var state = getCurrentState();
                //console.log("send Message to back to hide/send hidden login")
                conduit.abstractionlayer.commons.repository.removeKeyAsync(keyName, function () {
                    albMessagesBus.sendSysReq('activateOnChangeViewState', 'browserFront', { "state": state }, function () { });
                    conduit.abstractionlayer.commons.repository.removeKeyAsync("toolbarShow", function () { });
                });

            }
        });

        albMessagesBus.onSysReq.addListener("toolbarShowEvent" + CTID, function () {
            for (var i = 0; i < arrCallbacksOnToolbarShow.length; i++) {
                arrCallbacksOnToolbarShow[i]({ result: CTID, status: 0, description: '' });
            }
        });
        $(window).resize(function (e) {
            albMessagesBus.sendSysReq('windowResizeEvents', 'browserFront', { width: window.innerWidth }, function () { });
        });
    };
    /**
    @description Add a listener to the browser size change event
    @function onBrowserSizeChangedAddListener
    @property {Function} callback - Function to run when window size has changed. Has the form callbackName(width, height)
    @example conduit.abstractionlayer.frontstage.browser.onBrowserSizeChanged.addEventListener(function(width, height) { alert(width,height);}))
    */
    var onBrowserSizeChangedAddListener = function (callback) {
        // callback validation
        if (typeof callback !== 'function') {
            return Errors.get(1555);
        }
        else {
            // on window.resize call the callback
            $(window).resize(function (e) {
                //prevent double callback - incase there was no change
                if (lastWidth != window.outerWidth || lastHeight != window.outerHeight) {
                    lastWidth = window.outerWidth;
                    lastHeight = window.outerHeight;
                    callback(
                         { result: { width: window.outerWidth, height: window.outerHeight }, status: 0, description: '' }
                    );
                }
            })
            return Errors.get(1);
        }
    };

    var onToolbarShowAddEventListener = function (callback) {
        if (!callback || typeof callback != 'function') {
            return Errors.get(1555);
        }
        try {
            arrCallbacksOnToolbarShow.push(callback);
            return Errors.get(1);
        }
        catch (error) {
            return Errors.get(0);
        }
    };

    var onEmbeddedErrorAddEventListener = function (callback) {
        if (!callback || typeof callback != 'function') {
            return Errors.get(1555);
        }
        arrCallbacksOnEmbeddedError.push(callback);
    };

    init();

    return {
        onBrowserSizeChanged: {
            addEventListener: onBrowserSizeChangedAddListener,
            addListener: onBrowserSizeChangedAddListener
        },
        onToolbarShow: {
            addEventListener: onToolbarShowAddEventListener
        },
        onEmbeddedError: {
            addEventListener: onEmbeddedErrorAddEventListener
        },
        isHidden: isHidden
    };
});
/**
* @fileOverview Contains abstraction layer environment singleton <br/>
* FileName : environment.front.js <br/>
* FilePath : SmartBar\AbstractionLayer\Chrome\Dev\AbstractionLayer\src\main\js\environment\environment.front.js <br/>
* Date : 2011-08-29 <br/>
* Copyright: Realcommerce & Conduit.
* @author <strong> hezi abrass </strong>
*/

conduit.register("abstractionlayer.frontstage.environment", new function () {   
    var Errors = conduit.abstractionlayer.utils.errors;
    var General = conduit.abstractionlayer.utils.general;
    var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages : conduit.abstractionlayer.commons.messages;
    var albMessagesBus = typeof albMessages != "undefined" ? albMessages : conduit.abstractionlayer.commons.messages;
    var multiToolbarsHandler = conduit.abstractionlayer.frontstage.multiToolbarsHandler;
   
    var extensionId;

    /* CONST */
    var TOOLBAR_HEIGHT = 320; // ABST_ATP_TESTER
    //#ifndef ABST_ATP_TESTER
    var TOOLBAR_HEIGHT = 35;
    //#endif

    //var init = function () { };

    

    var getScreenHeight = function (callback) {
        cbsMessagesBus.sendSysReq("getMyViewId", "absFront.environment", {}, function (response) {
            albMessagesBus.sendSysReq("getScreenHeight_" + response.viewId, "getScreenHeight", { type: 'getScreenHeight' }, function (response) {
                callback(response);
            });
        });
    };

    var getToolbarPosition = function () {
        var index = multiToolbarsHandler.getExtPlacementInShownTBList();
        var oldToolbarFactor = multiToolbarsHandler.getNumberOfOldToolbars();
        var topStart = 0;
        if (index && oldToolbarFactor)
            topStart = index * TOOLBAR_HEIGHT * oldToolbarFactor;
        if (index && !oldToolbarFactor)
            topStart = index * TOOLBAR_HEIGHT;
        if (!index && oldToolbarFactor)
            topStart = oldToolbarFactor * TOOLBAR_HEIGHT;

        return { result: { left: 0, top: topStart },
            status: 0,
            description: ''
        };
    };

    var getNmHostWrapper = function () {
        var nmWrapper = "";
        if (conduit.abstractionlayer.utils.general.isBackstage) {
            nmWrapper = conduit.abstractionlayer.backstage.nmWrapper
        } else {
            nmWrapper = conduit.abstractionlayer.frontstage.nmWrapper;
        }
        return nmWrapper;
    }

    var getResourcesBasePath = function (callback) {
        var nmWrapper = getNmHostWrapper();
        var getExtensionPathMsg = { namespace: "Environment", funcName: "getExtensionPath", parameters: [globalProfileName] };
        nmWrapper.sendMessage(getExtensionPathMsg, function (result) {
            callback(result);
        });
    };

    var getResourcesBasePathURI = function () {
        return { result: "chrome-extension://" + extensionId, status: 0, description: "" };
    };

    var getToolbarInstanceId = function (callback) {
        if (!callback) {
            return Errors.get(1555);
        }

        cbsMessagesBus.sendSysReq("getMyTabId", "absFront.environment", {}, function (response) {
            if (response && response.tabId) {
                callback({ result: response.tabId, status: 0, description: "" });
            }
            else {
                callback(Errors.get(9999));
            }
        });
    };   

    return {
        getScreenHeight: getScreenHeight,
        getToolbarPosition: getToolbarPosition,
        getResourcesBasePath: getResourcesBasePath,
        getResourcesBasePathURI: getResourcesBasePathURI,        
        getToolbarInstanceId: getToolbarInstanceId
    };
});

/**
* @fileOverview this function handles system reequest <br/>
* FileName : http.frontstage.system.js <br/>
* FilePath : AbstractionLayer/src/main/js/system/system.frontstage.js <br/>
* Date : 08.01.2012 <br/>
* Copyright: Conduit.
* @author: michal
*/


conduit.register('abstractionlayer.frontstage.system', new function () {
    var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages : conduit.abstractionlayer.commons.messages;
    var createBackStage = function (callback) {
        cbsMessagesBus.sendSysReq("isBackStageUp", "abstractionlayer.frontstage.system", null, function () {
            if (callback && typeof callback == 'function') {
                callback(); //when messaging is ready, meaning chromeBackStage.js is loaded 
            }
        });
    };

    var getViewId = function () {
        // if we dont have viewId we return false, the usage of this function is if (getView()Id.result) { ... } else { ... }
        var viewId = window.parent && window.parent.globalViewId || false;
        return { result: viewId, status: 0, description: "" };
    };

    var setViewId = function () {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    var getTabData = function () {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    return {
        createBackStage: createBackStage,
        getViewId: getViewId,
        setViewId: setViewId,
        getTabData: getTabData
    }
});
//****  Filename: toolbarClicksHandler.js
//****  FilePath: main/js/clickHandlers
//****
//****  Author: Uri.Weiler	
//****  Date: 03.01.12
//****  Class Name: conduit.abstractionlayer.frontstage.toolbarClicksHandler
//****  Type:
//****  Description: Listens to clicks on the toolbar's surface. Runs only inside AL.VIEW.HTML
//****
//****  Copyright: Realcommerce & Conduit.
//****

conduit.register("conduit.abstractionlayer.frontstage.toolbarClicksHandler", new function () {
    var Messages = conduit.abstractionlayer.commons.messages; // alias

    var init = function () {

        if ((/AL\.VIEW\.HTML/i.test(document.location.href) === true) || (/STATE\.HTML/i.test(document.location.href) === true)) {
            
            document.addEventListener("mousedown", function (e) {
                var target = e.target;

                if (!(target.className == 'rightMenuButton')) {
                    Messages.sendSysReq('popups.events', 'contentScript_closeExternalPopus', { type: "closeOnExternalClick" }, function () { });
                }
            }, true);
        }
    };

    $(document).ready(function () {
        init();
    });

    return {
    // No public interface.
};
});

conduit.register("abstractionlayer.frontstage.tabs", (function () {
    var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages : conduit.abstractionlayer.commons.messages;
    var albMessagesBus = typeof albMessages != "undefined" ? albMessages : conduit.abstractionlayer.commons.messages;
    var thisTab;
    var thisRedirectHistory;

    function onDocumentComplete(callback) {
        // get redirect history
        var getTabObject = function (tab) {
            if (!tab) {
                return {};
            }
            var tabObject = {
                windowId: tab.windowId,
                tabId: tab.id,
                url: tab.url,
                title: tab.title,
                selected: tab.highlighted,
                tabIndex: tab.index
            };
            return tabObject;
        };

        function getRedirectHistory(tabId, url, callback) {
            if (thisRedirectHistory) {
                callback(thisRedirectHistory);
            } else {
                albMessagesBus.sendSysReq("getRedirectHistory", "frontstage.tabs", { tabId: tabId, url: url }, callback);
            }
        }

        function sendResponse() {
            getRedirectHistory(thisTab.id, thisTab.url, function (redirectHistory) {
                thisRedirectHistory = redirectHistory;
                var extData = {
                    redirectHistory: redirectHistory
                };
                callback(getTabObject(thisTab), true, extData);
            });
        }

        if (thisTab) {
            sendResponse();

        } else {
            cbsMessagesBus.sendSysReq("getTabInfo", "frontstage.tabs", null, function (tab) {
                thisTab = tab;
                sendResponse();
            });
        }
    }

    return {
        onDocumentComplete: {
            addListener: onDocumentComplete
        }
    };
} ()));


//#ifdef DBG
} catch (generalException) {
    if (conduit.abstractionlayer && conduit.abstractionlayer.commons && conduit.abstractionlayer.commons.logging && conduit.abstractionlayer.commons.logging.logError) {
        console.trace();
        conduit.abstractionlayer.commons.logging.logError('General Exception: ', generalException, ' at ', decodeURIComponent(document.location.href));
    }
    else if (window.console && console.error) {
        console.trace();
        console.error("General Exception: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
    }
}
//#endif
