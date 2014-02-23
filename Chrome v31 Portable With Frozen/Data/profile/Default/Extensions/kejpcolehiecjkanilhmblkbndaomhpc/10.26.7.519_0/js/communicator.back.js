var communicatorBack = (function communicatorBack() {
    var connections = {};

    var innerScopeListeners = {};
    var frontStageListeners = {};

    var innerScopeTopics = {};

    var logicalNamesConnection = {};

    var outerScopeTopics = {};

    var globalViewId = {};

    // These are messages received from windows in the backstage
    var commands = {
        "addTopic": function (event) {
            if (!innerScopeTopics[event.data.topicName]) {
                innerScopeTopics[event.data.topicName] = [];
            }

            innerScopeTopics[event.data.topicName][event.data.cbId] = { cbId: [event.data.cbId], origin: event.origin, targetWindow: event.source };
        },
        "postTopic": function (event) {
            var message = {
                cbId: null,
                data: event.data.data,
                senderName: event.data.senderName,
                origin: "main"
            };

            var subscriberObject = null;

            if (innerScopeTopics && innerScopeTopics[event.data.topicName]) {
                for (var subcriber in innerScopeTopics[event.data.topicName]) {
                    subscriberObject = innerScopeTopics[event.data.topicName][subcriber];
                    message.type = "sendRequest";
                    message.cbId = subscriberObject.cbId;

                    if (subscriberObject.targetWindow) {
                        subscriberObject.targetWindow.postMessage(message, subscriberObject.origin);
                    }
                }
            }

            message.type = "postTopic";
            message.topicName = event.data.topicName;


            if (outerScopeTopics[message.topicName]) {
                for (var cName in outerScopeTopics[message.topicName]) {
                    var subscriber = outerScopeTopics[message.topicName][cName];
                    var connection = connections[subscriber.tabId][subscriber.connectionName];
                    try {
                        connection.postMessage(message);
                    } catch (e) {
                        if (!connection.reportedNotWorking) {
                            console.error('failed sending to connection, possibly already closed. check why not removed by onDisconnectHandler', connection, e);
                            connection.reportedNotWorking = true;
                        }
                    }
                }
            }


            return true;
        },
        "addListener": function (event) {

            if (!event.data || !event.data.logicalName || !event.data.cbId) return;

            innerScopeListeners[event.data.logicalName] = { cbId: event.data.cbId, targetWindow: event.source, origin: event.origin }
        },
        "sendRequest": function (event) {
            if (!event.data) return false;

            if (event.data.cbId) { // meaning we expecting response
                innerScopeListeners[event.data.cbId] = { cbId: event.data.cbId, targetWindow: event.source, origin: event.origin }
            }

            var dataToSend = null;

            var message = {
                origin: "main",
                userData: {
                    senderName: event.data.senderName,
                    data: event.data.data,
                    viewId: null
                },
                sendercbId: (event.data.cbId || null),
                type: "sendRequest"
            };

            var windowToSend = null;
            var senderTabId = null;
            var connectionName = null;

            if (event.data.senderName == "getScreenWidth") {
                //logs
                var errorData = {
                    namespace: 'communicator back stage',
                    functionName: 'sendRequest',
                    errorMessage: 'is in innerScopeListeners: ' + innerScopeListeners[event.data.logicalName]
                };
                Logger.internal.logDebug(errorData);
            }

            var strLogicalName = event.data.logicalName;
            if (event.data.extraData && event.data.extraData.replaceIn) {
                switch (event.data.extraData.replaceIn) {
                    case 'logicalName':
                        var tabId = event.data.extraData.tabId;
                        strLogicalName = strLogicalName.replace('replaceToViewId', globalViewId[tabId]);
                        message.extraData = event.data.extraData;
                        message.extraData.viewId = globalViewId[tabId];
                        break;
                    default: break;
                }
            }

            if (innerScopeListeners[strLogicalName]) { // in scope messaging
                message.cbId = innerScopeListeners[strLogicalName].cbId || null;

                if (event.data.extraData && event.data.extraData.tabId) {
                    if (globalViewId[event.data.extraData.tabId]) {
                        message.userData.viewId = globalViewId[event.data.extraData.tabId];
                    }

                    var windowToSend = innerScopeListeners[message.logicalName].targetWindow;
                    windowToSend.postMessage(message, innerScopeListeners[message.logicalName].origin);
                } else {
                    chrome.tabs.getSelected(null, function (tab) {
                        if (tab && tab.id && globalViewId[tab.id]) {
                            message.userData.viewId = globalViewId[tab.id];
                        } else {
                            message.userData.viewId = null;
                        }

                        var windowToSend = innerScopeListeners[strLogicalName].targetWindow;
                        windowToSend.postMessage(message, innerScopeListeners[strLogicalName].origin);
                    });
                }
            }
            else {
                //message.origin = "backstage";   

                if (event.data.senderName == "getScreenWidth") {
                    //logs
                    var errorData = {
                        namespace: 'communicator back stage',
                        functionName: 'sendRequest',
                        errorMessage: 'in outter scope'
                    };
                    Logger.internal.logDebug(errorData);
                }
                // we send this in order to know where  (in which logical name) to look the cbId on the other scope 
                message.logicalName = strLogicalName;


                var connectionInfo = logicalNamesConnection[strLogicalName];

                if (event.data.senderName == "getScreenWidth") {
                    //logs
                    var errorData = {
                        namespace: 'communicator back stage',
                        functionName: 'sendRequest',
                        errorMessage: 'connectionInfo: ' + connectionInfo.size
                    };
                    Logger.internal.logDebug(errorData);
                }

                if (!connectionInfo) {
                    //console.warn('unknown strLogicalName', strLogicalName, event);
                    return;
                }

                if (connectionInfo.size !== 0) {
                    for (var connectionItem in connectionInfo.connections) {
                        if (event.data.senderName == "getScreenWidth") {
                            //logs
                            var errorData = {
                                namespace: 'communicator back stage',
                                functionName: 'sendRequest',
                                errorMessage: 'connectionItem: ' + connectionItem
                            };
                            Logger.internal.logDebug(errorData);
                        }

                        var connectionData = connectionInfo.connections[connectionItem];

                        if (globalViewId[connectionData.tabId]) {
                            message.userData.viewId = globalViewId[connectionData.tabId];
                        }

                        if (event.data.senderName == "getScreenWidth") {
                            //logs
                            var errorData = {
                                namespace: 'communicator back stage',
                                functionName: 'sendRequest',
                                errorMessage: 'connectionData: ' + JSON.stringify(connectionData) + " send to: " + connectionData.tabId
                            };
                            Logger.internal.logDebug(errorData);
                        }

                        if (frontStageListeners[connectionData.tabId] && frontStageListeners[connectionData.tabId][connectionData.connectionName] && frontStageListeners[connectionData.tabId][connectionData.connectionName][strLogicalName]) {
                            message.cbId = frontStageListeners[connectionData.tabId][connectionData.connectionName][strLogicalName].cbId;
                            connections[connectionData.tabId][connectionData.connectionName].postMessage(message);
                            if (event.data.senderName == "getScreenWidth") {
                                //logs
                                var errorData = {
                                    namespace: 'communicator back stage',
                                    functionName: 'sendRequest',
                                    errorMessage: 'message sent'
                                };
                                Logger.internal.logDebug(errorData);
                            }
                        }
                    }
                }

            } //else
        }
    };

    // These are messages from fronts
    var outerMessagingCommands = {
        "addTopic": function (message) {
            if (message.msgExtraData && message.msgExtraData.viewId) {
                globalViewId[message.sender.tab.id] = message.msgExtraData.viewId;
            }

            if (!outerScopeTopics[message.topicName]) {
                outerScopeTopics[message.topicName] = {};
                outerScopeTopics[message.topicName][message.connectionName] = { connectionName: message.connectionName, tabId: message.sender.tab.id };
            } else {
                outerScopeTopics[message.topicName][message.connectionName] = { connectionName: message.connectionName, tabId: message.sender.tab.id };
            }
        },
        "addListener": function (message) {
            if (message.connectionName) {
                if (message.msgExtraData && message.msgExtraData.viewId) {
                    globalViewId[message.sender.tab.id] = message.msgExtraData.viewId;
                }

                if (!frontStageListeners[message.sender.tab.id]) {
                    frontStageListeners[message.sender.tab.id] = {};
                }

                if (!frontStageListeners[message.sender.tab.id][message.connectionName]) {
                    frontStageListeners[message.sender.tab.id][message.connectionName] = {};
                }

                if (logicalNamesConnection[message.logicalName] && logicalNamesConnection[message.logicalName].size !== 0) {
                    for (var cName in logicalNamesConnection[message.logicalName].connections) {
                        if (logicalNamesConnection[message.logicalName].connections[cName].connectionName.toLowerCase().indexOf("bcview") === -1) {
                            delete logicalNamesConnection[message.logicalName].connections[cName];
                            --logicalNamesConnection[message.logicalName].size;
                        }
                    }
                }

                frontStageListeners[message.sender.tab.id][message.connectionName][message.logicalName] = { cbId: message.cbId };

                if (!logicalNamesConnection[message.logicalName]) {
                    logicalNamesConnection[message.logicalName] = { size: 1, connections: {} };
                    logicalNamesConnection[message.logicalName].connections[message.connectionName] = { tabId: message.sender.tab.id, connectionName: message.connectionName }
                } else {
                    if (!logicalNamesConnection[message.logicalName].connections[message.connectionName]) {
                        logicalNamesConnection[message.logicalName].connections[message.connectionName] = { tabId: message.sender.tab.id, connectionName: message.connectionName };
                        ++logicalNamesConnection[message.logicalName].size;
                    } else {
                        logicalNamesConnection[message.logicalName].connections[message.connectionName] = { tabId: message.sender.tab.id, connectionName: message.connectionName };
                    }
                }
            }
        },
        "sendRequest": function (message) {
            if (message.userData && message.userData.viewId) {
                globalViewId[message.sender.tab.id] = message.userData.viewId;
            }

            if (message.sendercbId && message.connectionName) { // meaning we expecting response
                if (!frontStageListeners[message.sender.tab.id]) {
                    frontStageListeners[message.sender.tab.id] = {}
                }

                if (!frontStageListeners[message.sender.tab.id][message.connectionName]) {
                    frontStageListeners[message.sender.tab.id][message.connectionName] = {};
                }


                frontStageListeners[message.sender.tab.id][message.connectionName][message.sendercbId] = { cbId: message.sendercbId };

                if (!logicalNamesConnection[message.sendercbId]) {
                    logicalNamesConnection[message.sendercbId] = { size: 0, connections: {} };
                }

                logicalNamesConnection[message.sendercbId].connections[message.connectionName] = { tabId: message.sender.tab.id, connectionName: message.connectionName, size: 0 };
                ++logicalNamesConnection[message.sendercbId].size;
            }

            if (innerScopeListeners[message.logicalName]) {
                message.cbId = innerScopeListeners[message.logicalName].cbId;
                message.tabId = message.sender.tab.id;

                // If message already has a tabId use it, otherwise get current
                if (message.tabId) {
                    if (globalViewId[message.tabId]) {
                        message.userData.viewId = globalViewId[message.tabId];
                    }

                    var windowToSend = innerScopeListeners[message.logicalName].targetWindow;
                    windowToSend.postMessage(message, innerScopeListeners[message.logicalName].origin);
                } else {
                    chrome.tabs.getSelected(null, function (tab) {
                        if (globalViewId[tab.id]) {
                            message.userData.viewId = globalViewId[tab.id];
                        }

                        var windowToSend = innerScopeListeners[message.logicalName].targetWindow;
                        windowToSend.postMessage(message, innerScopeListeners[message.logicalName].origin);
                    });
                }
            } else {
                var connectionInfo = logicalNamesConnection[message.logicalName];

                if (connectionInfo.size !== 0) {
                    for (var connectionItem in connectionInfo.connections) {
                        var connectionData = connectionInfo.connections[connectionItem];
                        if (frontStageListeners[connectionData.tabId] && frontStageListeners[connectionData.tabId][connectionData.connectionName] && frontStageListeners[connectionData.tabId][connectionData.connectionName][message.logicalName]) {

                            message.cbId = frontStageListeners[connectionData.tabId][connectionData.connectionName][message.logicalName].cbId;

                            if (connections[connectionData.tabId] && connections[connectionData.tabId][connectionData.connectionName]) {
                                connections[connectionData.tabId][connectionData.connectionName].postMessage(message);
                            }
                        }
                    }
                }
            }
        },
        "postTopic": function (message) {
            var topicMessage = {
                cbId: null,
                data: message.data,
                senderName: message.senderName,
                type: "sendRequest",
                origin: "main",
                tabId: message.sender.tab.id
            };


            if (innerScopeTopics[message.topicName]) {
                for (var subcriber in innerScopeTopics[message.topicName]) {
                    var subscriberObject = innerScopeTopics[message.topicName][subcriber];

                    topicMessage.cbId = subscriberObject.cbId;

                    if (subscriberObject.targetWindow) {
                        subscriberObject.targetWindow.postMessage(topicMessage, subscriberObject.origin);
                    }
                }
            }

            if (outerScopeTopics[message.topicName]) {
                topicMessage.type = "postTopic";
                topicMessage.topicName = message.topicName;

                for (var cName in outerScopeTopics[message.topicName]) {
                    var subscriber = outerScopeTopics[message.topicName][cName];

                    if (connections[subscriber.tabId] && connections[subscriber.tabId][subscriber.connectionName]) {
                        connections[subscriber.tabId][subscriber.connectionName].postMessage(topicMessage);
                    }
                }

            }

        }
    };

    function onMessageRecieve(message) {
        if (!message || !message.type || !outerMessagingCommands[message.type]) {
            return false;
        }

        try {
            outerMessagingCommands[message.type](message);
        } catch (e) {
            return false;
        }

        return true;
    };

    function onDisconnectHandler(port) {
        var tabId = port.sender && port.sender.tab && port.sender && port.sender.tab.id;
        if (tabId) {
            //TODO: delete the map, but only the correct connection (need to add new dim' to map)

            for (var lName in logicalNamesConnection) {
                if (logicalNamesConnection[lName].size !== 0 && logicalNamesConnection[lName].connections[port.name]) {
                    delete logicalNamesConnection[lName].connections[port.name];
                    --logicalNamesConnection[lName].size;

                    if (logicalNamesConnection[lName].size === 0) {
                        delete logicalNamesConnection[lName];
                    }
                }
            }

            for (var topicName in outerScopeTopics) {
                if (outerScopeTopics[topicName][port.name]) {
                    delete outerScopeTopics[topicName][port.name];
                }
            }

            if (frontStageListeners[tabId] && frontStageListeners[tabId][port.name]) {
                try {
                    chrome.tabs.getSelected(null, function (tab) {
                        if (!tab) {
                            delete frontStageListeners[tabId];

                            if (globalViewId[port.tab.id]) {
                                delete globalViewId[tabId];
                            }
                        } else {
                            delete frontStageListeners[tabId][port.name];
                        }
                    });
                } catch (e) {
                    delete frontStageListeners[tabId];
                }
            }

        }
    };

    function onMessageRecieve_Tab_Wrapper(tab) {
        return function (message) {
            if (!message.sender) {
                message.sender = {};
            }

            message.sender.tab = tab;

            onMessageRecieve(message);
        };
    }

    function onConnect_Handler(connection, tab) {
        if (!connection) {
            return;
        }
        if (connection.sender) { // meaning front initiated connection
            connection.postMessage({ type: "connection_established" });
        }

        if ((!connection.sender || !connection.sender.tab) && tab) {
            connection.sender = { tab: tab };
        } else if ((!connection.sender || !connection.sender.tab) && !tab) {
            return false;
        }

        if (!connections[connection.sender.tab.id]) {
            connections[connection.sender.tab.id] = {};
        }

        connections[connection.sender.tab.id][connection.name] = connection;
        connections[connection.sender.tab.id][connection.name].onDisconnect.addListener(onDisconnectHandler);
        connections[connection.sender.tab.id][connection.name].onMessage.addListener(onMessageRecieve_Tab_Wrapper(connection.sender.tab));
    };

    function handleInnerMessaging(event) {
        if (event.data && event.data.type) {
            if (event.data.senderName == "getScreenWidth") {
                //logs
                var errorData = {
                    namespace: 'communicator back stage',
                    functionName: 'handleInnerMessaging',
                    errorMessage: 'start'
                };
                Logger.internal.logDebug(errorData);
            }

            if (commands[event.data.type]) {
                try {
                    commands[event.data.type](event);
                } catch (e) {
                    return false;
                }
            }
        }
    };

    function messageBridge(msg) {
        var type = msg && msg.data && msg.data.type;
        if (typeof commands[type] === 'function') {
            try {
                commands[type](msg);
            } catch (e) { }
        }
    }

    function init() {

        window.addEventListener("message", handleInnerMessaging);
        window.communicatorBridge = messageBridge;

        chrome.extension.onConnect.addListener(onConnect_Handler);
        chrome.windows.getAll({ populate: true }, function (windows) {
            if (!windows) return;

            for (var item in windows) {
                for (var tab in windows[item].tabs) {
                    onConnect_Handler.call(null, chrome.tabs.connect(windows[item].tabs[tab].id, { name: "unknown_" + windows[item].tabs[tab].id }), windows[item].tabs[tab]);
                }
            }
        });


    };

    init();

    return {
        setViewIdForTabId: function (tabId, viewId) {
            if (tabId && viewId) {
                globalViewId[tabId] = viewId;
            }
        },
        getViewIdByTabId: function (tabId) {
            return globalViewId[tabId];
        },
        getTabIdByViewId: function (viewId) {
            if (viewId) {
                for (var tabID in globalViewId) {
                    if (globalViewId[tabID] == viewId) {
                        return tabID;
                    }
                }
            }
        }
    }
} ());


(function backstageMessaging() {
    // To support using the messaging system in chromeBackStage.html this can code can now run as part of the abstractionLayerBack.js,
    // or in the chromeBackStage.html next to the communicator. we are using a context object to maintain a genetic code
    function createContext(handlersGetter) {
        // Decide on context based on where we are
        var context;
        if (window.top === window) {
            context = {
                errors: { get: function () { } },
                postToCommunicator: function (msg) {
                    var fakeMsgEvent = {
                        data: msg,
                        origin: "sameWindowFakeMsgEvent",
                        source: {
                            postMessage: function (msg) {
                                var fakeEvent = {
                                    data: msg
                                }

                                var handlers = handlersGetter();
                                if (handlers && handlers[msg.type]) {
                                    handlers[msg.type](fakeEvent);
                                }
                            }
                        }
                    }
                    window.communicatorBridge(fakeMsgEvent);
                },
                register: function (obj) {
                    window.sameWindowMessaging = obj;
                },
                sendRawData: true
            };
        } else {
            context = {
                errors: conduit.abstractionlayer.utils.errors,
                logging: conduit.abstractionlayer.commons.logging,
                postToCommunicator: function (msg) {
                    window.top.postMessage(msg, "*");
                },
                register: function (obj) {
                    conduit.register("abstractionlayer.commons.messages", obj);
                }
            };
        }

        return context;
    }

    (function createBackMessaging() {
        var context = createContext(function () {
            return handlers;
        });

        var Errors = context.errors;
        var logging = context.logging;
        var postToCommunicator = context.postToCommunicator;
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
                                type: "sendRequest",
                                tabId: event.data.tabId
                            };

                            postToCommunicator(message, "*");
                        }
                        // Raw data is added in same window context as a hack, since we do need some extra info like sender tab
                        callbackParams = [event.data.userData.data, event.data.userData.senderName, listenerCallback, event.data.userData.viewId || null, context.sendRawData && event.data];
                    }
                    else {
                        callbackParams = [event.data.userData.data, event.data.userData.senderName || null, function () { }, event.data.userData.viewId || null, context.sendRawData && event.data];
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

        window.addEventListener("message", messageResponseHandler);



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


            if (window.top) {
                postToCommunicator(message, "*");
            }

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
                type: "addTopic"
            };


            if (window.top) {
                postToCommunicator(message, "*");
            }

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
            if (strDestSenderName && strDestSenderName.indexOf('getScreenWidth') == 0) {
                //logs
                var errorData = {
                    namespace: 'sendSysReq',
                    functionName: 'backstage.messages',
                    errorMessage: 'start'
                };

                if (logging) { logging.internal.logDebug(errorData); }
            }

            if (typeof strDestLogicalName !== 'string' || !strDestLogicalName || strDestLogicalName === '') {
                return Errors.get(1900);
            }

            if (typeof strDestSenderName !== 'string' || !strDestSenderName || strDestSenderName === '') {
                return Errors.get(1904);
            }

            if (strDestSenderName && strDestSenderName.indexOf('getScreenWidth') == 0) {
                //logs
                var errorData = {
                    namespace: 'sendSysReq',
                    functionName: 'backstage.messages',
                    errorMessage: 'after validations'
                };
                if (logging) { logging.internal.logDebug(errorData); }
            }

            var cbId = generateCallbackId();
            var message = {
                type: "sendRequest",
                logicalName: strDestLogicalName,
                senderName: strDestSenderName,
                data: data,
                cbId: null
            };

            if (strDestLogicalName.indexOf("replaceToViewId") > -1) {
                var objData = typeof data == 'string' ? JSON.parse(data) : data;
                message.extraData = {
                    replaceIn: 'logicalName',
                    tabId: objData && objData.msgExtraData && objData.msgExtraData.tabId ? objData.msgExtraData.tabId : ''
                };
            }

            if (typeof (callback) === "function") {
                message.cbId = cbId;
                callbackMap[message.cbId] = { callback: callback, deleteOnCall: true };

                if (strDestSenderName && strDestSenderName.indexOf('getScreenWidth') == 0) {
                    //logs
                    var errorData = {
                        namespace: 'sendSysReq',
                        functionName: 'backstage.messages',
                        errorMessage: 'callback is func: ' + message.cbId + " callback: " + callback
                    };
                    if (logging) { logging.internal.logDebug(errorData); }
                }
            }

            if (window.top) {
                postToCommunicator(message, "*");

                if (strDestSenderName && strDestSenderName.indexOf('getScreenWidth') == 0) {
                    //logs
                    var errorData = {
                        namespace: 'sendSysReq',
                        functionName: 'backstage.messages',
                        errorMessage: 'send to top'
                    };
                    if (logging) { logging.internal.logDebug(errorData); }
                }
            }

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

            postToCommunicator(message, "*");

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

        context.register({
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
        });
    } ());
} ());

/**
fileName: readyWrapperBack.js
description: backstage part of the readyWrapper
example usage: messages.setReady("abstractionLayerBack.js");
*/

(function readyWrapperBack() {
    var msgingObj = (window.top === window && window.sameWindowMessaging) ||
                    (typeof conduit !== "undfined" && conduit.abstractionlayer && conduit.abstractionlayer.commons && conduit.abstractionlayer.commons.messages) ||
                    {};

    function setReady(name) {
        if (typeof name !== "string") { return; }

        msgingObj.onSysReq.addListener('is_' + name + '_ready?', function (data, sender, callback) {
            if (callback) {
                callback(true);
            }
        });
        msgingObj.postTopicMsg(name + '_ready', 'readyWrapperBack_' + name);
    }

    msgingObj.setReady = setReady;
} ());
