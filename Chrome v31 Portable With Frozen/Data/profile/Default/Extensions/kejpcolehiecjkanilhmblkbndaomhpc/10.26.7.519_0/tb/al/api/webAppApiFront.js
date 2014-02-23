//
// Copyright © Conduit Ltd. All rights reserved.
// This software is subject to the Conduit license (http://hosting.conduit.com/EULA/).
//
// This code and information are provided 'AS IS' without warranties of any kind, either expressed or implied, including, without limitation, // to the implied warranties of merchantability and/or fitness for a particular purpose.
//
//

﻿//
// Copyright © Conduit Ltd. All rights reserved.
// This software is subject to the Conduit license (http://hosting.conduit.com/EULA/).
//
// This code and information are provided 'AS IS' without warranties of any kind, either expressed or implied, including, without limitation, // to the implied warranties of merchantability and/or fitness for a particular purpose.
//
//

conduit.register("webappApi.commons", (function () {
    var appCoreModelLogicalName = "applicationLayer.appManager.model.webappApiRequest",
        messaging = conduit.abstractionlayer.commons.messages;

    var currentTab,
        webAppApiReady = false,
        webappApiQueue = [];

    var waitForTabInfo = false;
    var currentTabQueue = [];

    var deleteOnCallListeners = { "app.popup.onClosed.addListener": true, "app.menu.onClose.addListener": true, "app.menu.onCommand.addListener": true, "network.sockets.onConnectionClosed.addListener": true }

    function onWebAppApiReady() {
        webAppApiReady = true;
        if (webappApiQueue.length) {
            for (var i = 0, count = webappApiQueue.length; i < count; i++) {
                sendRequestToWebappApi.apply(this, webappApiQueue[i])
            }
        }

        delete webappApiQueue;
    }

    function sendRequestToWebappApi(dest, sender, data, callback) {
        if (webAppApiReady) {
            messaging.sendSysReq(dest, sender, data, callback || function () { });
        }
        else {
            webappApiQueue.push([dest, sender, data, callback]);
        }
    }

    function findMethod(root, path) {
        var obj = root,
		currentMember = 0,
		pathMembers = path.split(".");
        while (currentMember < pathMembers.length && (obj = obj[pathMembers[currentMember++]]));
        return obj;
    }

    function currentTabUpdated() {
        for (var i = 0; i < currentTabQueue.length; i++) {
            currentTabQueue[i]();
        }
        currentTabQueue = [];
    }

    function setCurrentTab(windowId, callback) {
        waitForTabInfo = true;
        var winId = windowId;
        sendRequestToWebappApi("webappApi", JSON.stringify({ appId: "webappApiFront" }), JSON.stringify({ method: "tabs.getSelected", params: [windowId] }), function (tabInfo) {
            if (/url/.test(tabInfo)) { // make sure we have url
                if (!winId) { //save tab info only if it is current window
                    currentTab = tabInfo;
                }
                if (callback) {
                    callback(tabInfo);
                }
            }
            waitForTabInfo = false;
            currentTabUpdated();
        });
    }

    function getCurrentTab(apiPermissions, callback) {

        function getTab() {
            var tabInfo = JSON.parse(currentTab);
            if (!apiPermissions || !apiPermissions[conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_TITLE]) {
                if (tabInfo && (tabInfo.title || tabInfo.title == "")) {
                    delete tabInfo.title;
                }
            }
            if (!apiPermissions || !apiPermissions[conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_URL]) {
                if (tabInfo && (tabInfo.url || tabInfo.url == "")) {
                    delete tabInfo.url;
                }
            }
            callback(JSON.stringify(tabInfo));
        }

        if (!currentTab) {
            callback(null);
        } else {
            if (waitForTabInfo) {
                currentTabQueue.push(getTab);
            } else {
                getTab();
            }
        }


    }

    function getCurrentTabObj() {
        if (!currentTab) {
            return {};
        }
        return JSON.parse(currentTab);
    }

    function handleTabApiPermissions(tabInfo, apiPermissions) {
        if (!apiPermissions || !apiPermissions[conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_TITLE]) {
            if (tabInfo && (tabInfo.title || tabInfo.title == "")) {
                delete tabInfo.title;
            }
        }
        if (!apiPermissions || !apiPermissions[conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_URL]) {
            if (tabInfo && (tabInfo.url || tabInfo.url == "")) {
                delete tabInfo.url;
            }

        }
    }

    function handleEventData(thisTab, eventType, data, apiPermissions) {
        eventType = eventType.match(/tabs\.(.*)\.addListener/);
        eventType = eventType ? eventType[1] : null;
        if (eventType) {
            var allData = JSON.parse(data) // get the tabInfo
            var tabInfo = allData.data[0];
            switch (eventType) {
                case "onNavigateComplete":
                    var isHttps = tabInfo.url && tabInfo.url.indexOf('https') == 0; //should be location.protocol

                    if (isHttps && (!apiPermissions || !apiPermissions[conduit.utils.apiPermissions.consts.TYPE.SSL_GRANTED])) {
                        allData.data = allData.data.splice(0, 2);
                    } //DO NOT ADD BREAK;
                case "onBeforeNavigate":
                case "onDocumentComplete":
                    if (tabInfo && thisTab && thisTab != tabInfo.tabId) {
                        return { isNotAllowed: true };
                    }
                    handleTabApiPermissions(tabInfo, apiPermissions);
                    break;
                case "onSelectionChanged":
                    setCurrentTab();
                    break;
            }
            allData.data[0] = tabInfo;
            return JSON.stringify(allData);
        }
        else {
            return data;
        }
    }
    var listenersMap = {};


    var localMessaging = (function () {
        var callbackMap = {};

        var generateCallbackId = function () {
            var callbackId = (+new Date()) + "_" + Math.ceil(Math.random() * 5000);
            return (callbackMap[callbackId]) ? generateCallbackId() : callbackId;
        };

        var messageResponseHandler = function (event) {
            if (typeof event.data === 'string') {
                var data = JSON.parse(event.data);
                if (data && data.origin && data.origin !== "main") {
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
                origin: "webappApiFront"
            };

            if (target) {
                target.postMessage(JSON.stringify(message), "*");
            }
            else if (window.top) {
                window.top.postMessage(JSON.stringify(message), "*");
            }
        };
        return {
            onLocalRequest: { addListener: onLocalRequest },
            sendLocalRequest: sendLocalRequest
        };

    })();

    // Single-point entry into the webapp API:
    // Messages to the webapp API should look like this:
    // { appId: "1231232", context: "popup", method: "app.icon.setBadgeText", params: [ "34" ] }
    function init(viewId) {
        var topicName = "webappApiFront_" + viewId + "_" + Math.ceil(Math.random() * 1111);
        messaging.onTopicMsg.addListener("onWebAppApiReady", onWebAppApiReady);
        messaging.sendSysReq("webappApi", JSON.stringify({ sender: "webappApiFront" }), JSON.stringify({ method: "commons.isReady", params: [] }), function (result) {
            result = JSON.parse(result);
            if (!result.status)
                onWebAppApiReady();
        });
        setCurrentTab();
        localMessaging.onLocalRequest.addListener("webappApiFront", true, function (data, source) {
            var dataObj = data,
				senderData = JSON.parse(dataObj.sender),
				responseId = dataObj.responseId,
				method = findMethod(conduit.webappApi, dataObj.method);

            if (method) {
                var params = dataObj.params;
                //Some publisers override JSON so that the array is still string after first parse.
                if (!(params instanceof Array)) {
                    try {
                        params = JSON.parse(params);
                    } catch (e) {
                        params = [];
                    }
                }
                params.push({ responseId: responseId, source: source });

                try {
                    method.apply(senderData, params);
                } catch (e) {
                    localMessaging.sendLocalRequest(responseId, JSON.stringify({ errorMessage: e.message || e.toString() }), source);
                }
            } else if (/\.addListener$/.test(dataObj.method)) {
                if (/onDocumentComplete/.test(dataObj.method)) {
                    conduit.abstractionlayer.frontstage.tabs.onDocumentComplete.addListener(function (tab, mainFrame, extraData) {
                        handleTabApiPermissions(tab, senderData.apiPermissions);
                        handleResponse([tab, mainFrame, extraData], { responseId: responseId, source: source });
                    });
                } else {
                    if (!listenersMap[dataObj.method] || dataObj.params.length > 0) {
                        if (dataObj.params.length == 0) {
                            senderData.originalAppId = senderData.appId;
                            senderData.appId = "webappApiFront";
                            dataObj.sender = JSON.stringify(senderData);
                        }
                        listenersMap[dataObj.method] = [];
                        sendRequestToWebappApi("onWebappApiFront", topicName, JSON.stringify(data), function () { });
                    }
                    listenersMap[dataObj.method].push({ responseId: responseId, source: source, deleteOnCall: deleteOnCallListeners[dataObj.method], apiPermissions: senderData.apiPermissions });
                }
            }
        });

        messaging.onSysReq.addListener(topicName, function (data, sender, callback) {
            data = JSON.parse(data);
            if (listenersMap[data.eventType] && listenersMap[data.eventType].length !== 0) {
                conduit.abstractionlayer.frontstage.environment.getToolbarInstanceId(function (response) {
                    for (var i = 0; i < listenersMap[data.eventType].length; i++) {
                        var appEventData = handleEventData(response.result, data.eventType, data.eventData, (listenersMap[data.eventType][i] ? listenersMap[data.eventType][i].apiPermissions : null));

                        if (typeof (appEventData) !== 'object' && !appEventData.isNotAllowed) {
                            handleResponse(appEventData, listenersMap[data.eventType][i]);
                        }
                        if (listenersMap[data.eventType][i] && listenersMap[data.eventType][i].deleteOnCall) {
                            delete listenersMap[data.eventType][i];
                        }
                    }
                });
            }
        });
    }


    function handleResponse(response, responseObj, handleArray) {
        try {
            if (responseObj) {
                var responseIsObject = typeof (response) === "object";

                if (responseIsObject && response.status) {
                    var errorJson = { errorMessage: response.description, errorCode: response.status, status: response.status };
                    localMessaging.sendLocalRequest(responseObj.responseId, JSON.stringify(errorJson), responseObj.source);
                }
                else {
                    if (responseIsObject && response._callbackType && response._callbackType == 'cbSuccess') {
                        // in case we Succeeded to add a listener
                        //callback(response);
                        localMessaging.sendLocalRequest(responseObj.responseId, (responseIsObject ? JSON.stringify(response) : response || ""), responseObj.source);
                    }
                    else {
                        if (response instanceof Array)
                            response = { "_responseType": handleArray === false ? "object" : "array", data: response };
                        localMessaging.sendLocalRequest(responseObj.responseId, (responseIsObject ? JSON.stringify(response.result || response) : response || ""), responseObj.source);
                    }
                }
            }
        } catch (e) { }
    }

    function handleException(exception, responseObj) {
        if (responseObj) {
            var errorJson = { errorMessage: exception.message, errorCode: 100 };
            localMessaging.sendLocalRequest(responseObj.responseId, JSON.stringify(errorJson), responseObj.source);
        }
        else {
            throw new TypeError(exception.message);
        }
    }



    return {
        handleResponse: handleResponse,
        getCurrentTab: getCurrentTab,
        setCurrentTab: setCurrentTab,
        getCurrentTabObj: getCurrentTabObj,
        init: init
    };
})());


// PLATFORM:
(function (abs) {
    var commons = conduit.webappApi.commons,
            handleResponse = commons.handleResponse;
    conduit.register("webappApi.platform", (function () {
        var cache = {};

        var apiMethods = {
            getToolbarVersion: function (responseObj) {
                handleResponse(conduit.abstractionlayer.commons.environment.getEngineVersion().result || "", responseObj);
            }
        };

        return apiMethods;

    })());
})(conduit.abstractionlayer);

// STORAGE:
(function (abs) {
    var ctid = abs.commons.context.getCTID().result,
        repository = abs.commons.repository,
		handleResponse = conduit.webappApi.commons.handleResponse;
    handleException = conduit.webappApi.commons.handleException;

    function getKeyPrefix(appId, isGlobal) {
        return ctid + "." + (!isGlobal ? appId + "." : "");
    }

    function registerStorage(isGlobal) {
        function registerStorageTypes(typeNamespace, typeAbsSuffix) {
            conduit.register("webappApi.storage." + (isGlobal ? "global" : "app") + "." + typeNamespace, (function (abs, undefined) {
                return {
                    exists: function (key, responseObj) {
                       var response;
                       if (typeAbsSuffix == "Data"){
                            if (key){
                              repository["get" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key,false,function(res){
                                 response = res.result;
                                  handleResponse(response, responseObj);

                              });
                            }else{
                             response=false;
                              handleResponse(response, responseObj);
                            }
                       }else{
                        var response = key
                            ? repository["get" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key).result
                            : false
                        handleResponse(response, responseObj);
                       }
                    },
                    get: function (key, responseObj) {
                        if (typeof (key) != "string") {
                            var exception = new TypeError("The key is not a string.");
                            return handleException(exception, responseObj);
                        }
                        var data;
                        if (typeAbsSuffix=="Data"){
                          repository["get" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key,false,function(res){
                             data=res;
                             continueGetFlow();
                          });
                        }else{
                        var data = repository["get" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key);
                          continueGetFlow();
                        }
                        function continueGetFlow(){
                        // if there is no status (no error code), extract the result from data object.
                        // the result is the wanted value
                        if (!data.status) {
                            data = data.result;
                        }
                        handleResponse(data, responseObj);
                        }
                    }
                }
            })(conduit.abstractionlayer));
        }

        for (var types = [{ name: "items", suffix: "Data" }, { name: "keys", suffix: "Key"}], i = 0; i < types.length; i++) {
            registerStorageTypes(types[i].name, types[i].suffix);
        }
    }

    registerStorage(false);
    registerStorage(true);
})(conduit.abstractionlayer);


// APP.EMBEDDED:
conduit.register("webappApi.app.embedded", (function (abs, undefined) {
    var commons = conduit.webappApi.commons,
            handleResponse = commons.handleResponse,
            handleException = commons.handleException,
			invokeQueue = [],
			viewReady = false;


    function init() {

        try {
            viewReady = true;
            for (var i = invokeQueue.length - 1; i >= 0; i--) {
                var queueObj = invokeQueue[i];
                var method = queueObj.method;
                methods[method].apply(queueObj.context, queueObj.parameters);
                invokeQueue.pop();
            }
        }
        catch (e) {
            conduit.abstractionlayer.commons.logging.logError({ errorMessage: 'Failed in conduit.webappApi.app.embedded.init', errorObject: e });
        }
    }

    var validateParams = function (paramsArr) {

        for (var i in paramsArr) {
            var paramsObject = paramsArr[i];
            var paramName = paramsObject.name;
            var paramValue = paramsObject.value;
            if (typeof (paramValue) !== "string") {
                return new TypeError("Parameter: <" + paramName + "> is invalid, expected a string.");
            }
            if (paramValue.length == 0) {
                return new TypeError("Parameter: <" + paramName + "> is invalid, expected non empty string.");
            }
        }
    };

    var methods = {
        setEmbedded: function (info, responseObj) {
            try {
                if (viewReady) {
                    conduit.applicationLayer.appManager.view.onAppChange(JSON.stringify({ "method": "setEmbedded", "data": info, "appId": this.appId }));
                    var res = { '_callbackType': "cbSuccess" };
                    handleResponse(res, responseObj);
                }
                else {
                    invokeQueue.push({ method: "setEmbedded", parameters: [info, responseObj], context: this });
                }
            }
            catch (e) {
                var exception = new TypeError(e.message);
                handleException(exception, responseObj);
                conduit.abstractionlayer.commons.logging.logError({ errorMessage: 'Failed in conduit.webappApi.app.embedded.setEmbedded', errorObject: e });
            }
        },
        collapse: function (responseObj) {
            try {
                if (viewReady) {
                    var view = conduit.applicationLayer.appManager.view.getViewByAppId(this.appId);
                    view.collapse(function (data) {
                        var res = { '_callbackType': "cbSuccess" };
                        handleResponse(res, responseObj);
                    });
                }
                else {
                    invokeQueue.push({ method: this, parameters: [responseObj] });
                }
            }
            catch (e) {
                var exception = new TypeError(e.message);
                handleException(exception, responseObj);
                conduit.abstractionlayer.commons.logging.logError({ errorMessage: 'Failed in conduit.webappApi.app.embedded.collapse', errorObject: e });
            }
        },
        expand: function (responseObj) {
            try {
                if (viewReady) {
                    var view = conduit.applicationLayer.appManager.view.getViewByAppId(this.appId);
                    view.expand(function (data) {
                        var res = { '_callbackType': "cbSuccess" };
                        handleResponse(res, responseObj);
                    });
                }
                else {
                    invokeQueue.push({ method: this, parameters: [responseObj] });
                }
            }
            catch (e) {
                var exception = new TypeError(e.message);
                handleException(exception, responseObj);
                conduit.abstractionlayer.commons.logging.logError({ errorMessage: 'Failed in conduit.webappApi.app.embedded.expand', errorObject: e });
            }
        },
        /*params - frameId, nestedFrameContext*/
        createNestedContext: function (params, responseObj) {
            // use the nested iframe id and give it a context based on its parent.
            var frameId = params.frameId;
            var nestedFrameContext = params.nestedFrameContext;
            var data = conduit.abstractionlayer.commons.appMethods.setContext(frameId, JSON.stringify(nestedFrameContext));
            handleResponse(data, responseObj);
        },
        executeScriptInFrame: function (params, responseObj) {
            var parentFrameId = params.parentFrameId;
            var frameId = params.frameId;
            var script = params.script;

            var paramsArr = [{ name: 'parentFrameId', value: parentFrameId }, { name: 'frameId', value: frameId }, { name: 'script', value: script}];
            var exception = validateParams(paramsArr);
            if (exception) {
                return handleException(exception, responseObj);
            }

            conduit.abstractionlayer.frontstage.appMethods.executeScriptInFrame(parentFrameId, frameId, script, function (response) {
                if (response && !response.status) {
                    // if we did not fail, we will not return value in the response.
                    response = "";
                }
                handleResponse(response, responseObj);
            });
        }
    }




    return {
        init: init,
        setEmbedded: methods.setEmbedded,
        collapse: methods.collapse,
        expand: methods.expand,
        createNestedContext: methods.createNestedContext,
        executeScriptInFrame: methods.executeScriptInFrame
    }
})(conduit.abstractionlayer));

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.webappApi.app.embedded,
    dependencies: ["applicationLayer.appManager.view"],
    onLoad: conduit.webappApi.app.embedded.init
});

// TABS:
conduit.register("webappApi.tabs", (function (abs, undefined) {
    var commons = conduit.webappApi.commons,
            handleResponse = commons.handleResponse;


    return {
        getSelected: function (windowId, responseObj) {
            if (windowId && windowId.responseId) { //meaning no nwindowId
                responseObj = arguments[0];
                windowId = undefined;
            }

            if (!windowId) { //meaning we need current window and we have the data
                commons.getCurrentTab(this.apiPermissions, function (tab) {
                    if (tab) {
                        handleResponse(tab, responseObj);
                    } else {
                        commons.setCurrentTab(windowId, function (tabInfo) {
                            handleResponse(tabInfo, responseObj);
                        });
                    }
                })

            }
            else {
                commons.setCurrentTab(windowId, function (tabInfo) {
                    handleResponse(tabInfo, responseObj);
                });
            }
        },
        getTabId: function (responseObj) {
            conduit.abstractionlayer.frontstage.environment.getToolbarInstanceId(function (response) {
                // IE && CH returns the tab id. FF and SF returns false
                handleResponse(response.result || commons.getCurrentTabObj().tabId, responseObj);
            });
        }
    }
})(conduit.abstractionlayer));

// Advanced:
conduit.register("webappApi.advanced", (function (abs, undefined) {
    var commons = conduit.webappApi.commons,
            handleResponse = commons.handleResponse;


    return {

        sendNativeMessageFront: function (data, callback) {
            conduit.abstractionlayer.frontstage.nmWrapper.sendMessage(data,function (response) {
		 alert(JSON.stringify(response));
                handleResponse(response);
            });
        }
    }
})(conduit.abstractionlayer));





