//
// Copyright © Conduit Ltd. All rights reserved.
// This software is subject to the Conduit license (http://hosting.conduit.com/EULA/).
//
// This code and information are provided 'AS IS' without warranties of any kind, either expressed or implied, including, without limitation, // to the implied warranties of merchantability and/or fitness for a particular purpose.
//
//

﻿conduit.register("webappApi.commons", (function () {
    var appCoreModelLogicalName = "applicationLayer.appManager.model.webAppApiRequest",
        messaging = conduit.abstractionlayer.commons.messages,
        logger = conduit.coreLibs.logger;

    function findMethod(root, path) {
        var obj = root,
		currentMember = 0,
		pathMembers = path.split(".");

        while (currentMember < pathMembers.length && (obj = obj[pathMembers[currentMember++]]));

        return obj;
    }



    function sendReady() {
        messaging.postTopicMsg("onWebAppApiReady", "webappApi", "");
    }

    function createListenerCallback(topic, isSysReq, eventType) {
        var currentEventType = eventType;
        return function (data) {
            if (typeof (data) == 'undefined' || data === null) {
                data = ""; // for IE.
            }
            else {
                data = typeof (data) === "object" ? JSON.stringify(data) : data;
            }
            if (isSysReq) {
                messaging.sendSysReq(topic, "webappApi", JSON.stringify({ eventData: data, eventType: currentEventType }), function () { });
            } else {
                messaging.postTopicMsg(topic, "webappApi", data);
            }
        }
    }

    function handleResponse(response, callback, handleArray) {
        try {
            if (callback) {
                var responseIsObject = typeof (response) === "object";

                if (responseIsObject && response.status) {
                    var errorJson = { errorMessage: response.description, errorCode: response.status, status: response.status };
                    if (response.errorData) {
                        errorJson.errorData = response.errorData;
                    }
                    callback(JSON.stringify(errorJson));
                }
                else {
                    if (responseIsObject && response._callbackType && response._callbackType == 'cbSuccess') {
                        // in case we Succeeded to add a listener
                        //callback(response);
                        callback(responseIsObject ? JSON.stringify(response) : response || "");
                    }
                    else {
                        if (response instanceof Array)
                            response = { "_responseType": handleArray === false ? "object" : "array", data: response };

                        callback(responseIsObject ? JSON.stringify(response.result || response) : response || "");
                    }
                }
            }
        } catch (e) { }
    }


    function handleException(exception, callback) {
        if (callback && typeof (callback) === "function") {
            callback(JSON.stringify({ errorMessage: exception.message, errorCode: 100 }));
        }
        else {
            //in case we have an invalid callback
            throw new TypeError(exception.message);
        }

    }

    function sendMessageToModel(senderData, method, data, callback, withCallbackType) {
        messaging.sendSysReq(appCoreModelLogicalName, JSON.stringify(senderData), JSON.stringify({
            method: method,
            data: data
        }),
            function (response) {
                if (withCallbackType) {
                    if (response) {
                        if (typeof (response) === 'string') {
                            response = JSON.parse(response);
                        }
                        response._callbackType = 'cbSuccess';
                    }
                    else {
                        response = { '_callbackType': "cbSuccess" };
                    }
                }
                handleResponse(response, callback);
            })
    }

    function initListeners() {
        // Single-point entry into the webapp API:
        // Messages to the webapp API should look like this:
        // { appId: "1231232", context: "popup", method: "app.icon.setBadgeText", params: [ "34" ] }
        messaging.onSysReq.addListener("webappApi", function (data, sender, callback, viewId) {
            var dataObj = JSON.parse(data),
			senderData = JSON.parse(sender),
            methodName = dataObj.method,
            method = findMethod(conduit.webappApi, methodName);
            if (viewId) {// This is used for Chrome, we recieve sender viewId as parameter
                senderData.viewId = viewId;
            }
            // we check if the request come from the bg page so no viewid is sent
            // in this case we need to add the current viewid only for functions that need it 
            // these functions exist only in popup and menu namespaces and in the function handleClickEvent
            // so because the function getCurrentViewID is a-sync function we have  a bug if we get servel requests from the bg page
            if (!senderData.viewId && (/popup/.test(methodName) || /menu/.test(methodName) || /handleClickEvent/.test(methodName))) {
                conduit.abstractionlayer.backstage.system.getCurrentViewID(function (response) {
                    if (typeof (response) !== 'object') {
                        try {
                            response = JSON.parse(response);
                        } catch (e) {
                            logger.logError('Failed to parse response.', { className: "webappApi.commons", functionName: "initListeners" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e });
                        }
                    }
                    senderData.viewId = response.result; //TODO: add validations
                    applyMethod(method, dataObj, senderData, callback);
                });
            } else {
                applyMethod(method, dataObj, senderData, callback);
            }
        });

        function applyMethod(method, dataObj, senderData, callback) {
            if (typeof (method) == "function") {
                var params = dataObj.params;
                //Some publishers override JSON so that the array is still string after first parse.
                if (!(params instanceof Array)) {
                    try {
                        params = JSON.parse(params);
                    } catch (e) {
                        params = [];
                    }
                }
                params.push(callback);

                if (dataObj.listenerTopic) {
                    var listenerCallback = createListenerCallback(dataObj.listenerTopic);
                    params.push(listenerCallback);
                }
                else if (/\.addListener$/.test(dataObj.method))
                    params.push(callback);

                try {
                    method.apply(senderData, params);
                } catch (e) {
                    callback(JSON.stringify({ errorMessage: e.message || e.toString() }));
                }
            }
            else {
                handleResponse({ result: "", status: 101, description: "Unsupported API" }, callback);
            }
        }

        // this is used for front listeners
        messaging.onSysReq.addListener("onWebappApiFront", function (data, sender, callback, viewId) {
            var dataObj = JSON.parse(data),
			senderData = JSON.parse(dataObj.sender),
            method = findMethod(conduit.webappApi, dataObj.method);
            if (viewId) {// This is used for Chrome, we recieve sender viewId as parameter
                senderData.viewId = viewId;
            }
            //senderData.appId = "webappApiFront";
            if (method) {
                var params = dataObj.params;
                params.push(callback);


                if (/\.addListener$/.test(dataObj.method))
                    var listenerCallback = createListenerCallback(sender, true, dataObj.method);
                params.push(listenerCallback);

                try {
                    method.apply(senderData, params);
                } catch (e) {
                    callback(JSON.stringify({ errorMessage: e.message || e.toString() }));
                }
            }
        });
    }

    function replaceUrlAliases(url) {
        logger.logDebug('webappApi.commons.replaceUrlAliases');
        if (typeof url != 'string') {
            return url;
        }
        var aliasesManager = conduit.coreLibs.aliasesManager;
        var regexp1 = /^(ftp|http|https)/;
        var regexp2 = /^\w+:\w+/ // for url like xfire:launch?gameid=2 or javascript:
        url = aliasesManager.replaceAliases(url, null, aliasesManager.constants.TYPE_MODES.NAVIGATION_URL);
        url = regexp1.test(url) || regexp2.test(url) ? url : ("http://" + url);
        return url;
    }

    function init() {
        logger.logDebug('webappApi.commons.init');
        try {
            initListeners();
            sendReady();
            conduit.triggerEvent("onReady", { name: 'webappApi.commons' });
        }
        catch (e) {
            logger.logError('Failed to init webappApi', { className: "webappApi.commons", functionName: "init" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e });
        }
    }

    return {
        init: init,
        handleResponse: handleResponse,
        handleException: handleException,
        updateModel: sendMessageToModel,
        getInformationFromModel: sendMessageToModel,
        withCurrentWindow: conduit.coreLibs.UI.withCurrentWindow,
        withCurrentTab: conduit.coreLibs.UI.withCurrentTab,
        isReady: function (callback) { callback("true"); }
        , replaceUrlAliases: replaceUrlAliases
    };
})());



﻿// ADVANCED:
conduit.register("webappApi.advanced", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse;
    var searchManager = conduit.applicationLayer.appCore.searchManager;

    return {
        formatUrl: function (url, callback) {
            if (!callback) {
                return;
            };
            var formatedUrl = searchManager.formatUrl(url);
            handleResponse(formatedUrl, callback);
        },
        getGlobalUserId: function (callback) {
            abs.commons.environment.getGlobalUserId(function (response) {
                handleResponse(response, callback);
            });
        },

        getToolbarGeneralData: function (callback) {
            var self = this;
            if (!callback)
                return;

            if (typeof (callback) !== "function") {
                var exception = new TypeError("Invalid callback for app.getAppData, expected a function.");
                return conduit.webappApi.commons.handleException(exception, callback);
            }

            conduit.abstractionlayer.commons.messages.sendSysReq(
                "serviceLayer",
                "webappApi.app.getAppData",
                JSON.stringify({ service: "toolbarSettings", method: "getGeneralData", data: self.appId }),
                function (response) {
                    handleResponse(JSON.parse(response), callback)
                }
            );
        },

        getUserId: function (callback) {
            abs.commons.context.getUserID(function (response) {
            handleResponse(response.result, callback);
            });
        },

        getMachineId: function (callback) {
            var response = abs.commons.context.getMachineId();
            handleResponse(response.result, callback);
        },

        getSearchUserMode: function (callback) {
            var ctid = abs.commons.context.getCTID().result;
            abs.commons.storage.getTripleKey(ctid + ".searchUserMode", function (response) {
                var trippleKeySearchUserMode = response.result;
                var umValue = trippleKeySearchUserMode.registry || trippleKeySearchUserMode.file || trippleKeySearchUserMode.local || "";
                handleResponse(umValue, callback);
            });
        },
        showToolbar: function (callback) {

            var model = conduit.applicationLayer.appCore.appManager.model;
            if (!model || model.getAdvancedPermission(this.appId, conduit.utils.apiPermissions.consts.TYPE.TOOLBAR_VISIBILITY).autorized !== true) {
                var exception = new TypeError("Permission denied (" + conduit.utils.apiPermissions.consts.TYPE.TOOLBAR_VISIBILITY + ").");
                return handleException(exception, callback);
            }
            abs.backstage.browser.showToolbar(true, function (data) {
                handleResponse(data, callback);
            });
        },
        hideToolbar: function (callback) {

            var model = conduit.applicationLayer.appCore.appManager.model;
            if (!model || model.getAdvancedPermission(this.appId, conduit.utils.apiPermissions.consts.TYPE.TOOLBAR_VISIBILITY).autorized !== true) {
                var exception = new TypeError("Permission denied (" + conduit.utils.apiPermissions.consts.TYPE.TOOLBAR_VISIBILITY + ").");
                return handleException(exception, callback);
            }
            abs.backstage.browser.showToolbar(false, function (data) {
                handleResponse(data, callback);
            });
        },
        isExtensionInstalled: function (extenstionId, callback) { //TODO check app permissions (if needed)
            abs.backstage.browser.isExtensionInstalled(extenstionId, function (data) {
                //boolean cannot be sent to front. to overcome this we send it as array
                handleResponse([data], callback);
            });
        },

        sendNativeMessage: function (data, callback) {
            if (/Chrome/.test(navigator.userAgent)) {
                abs.backstage.nmWrapper.sendMessage(data, function (data) {
                    handleResponse(data, callback);
                });
            }

            else {
                handleResponse({ result: true, status: 0, description: "" }, callback);
            }
        }

    }
})(conduit.abstractionlayer));
﻿// ADVANCED.MANAGED.APPS :
conduit.register("webappApi.advanced.app", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse,
        handleException = conduit.webappApi.commons.handleException;

    var validateParams = function (param, paramName, callback) {

        if (typeof (callback) !== "function") {
            return new TypeError("Invalid callback function.");
        }
        if (typeof (param) !== "string") {
            return new TypeError("Parameter: <" + paramName + "> is invalid, expected a string.");
        }
        if (param.length == 0) {
            return new TypeError("Parameter: <" + paramName + "> is invalid, expected non empty string.");
        }

    }

    return {
        /*
        Adds a app to the toolbar.            
        */
        add: function (appGuid, appName, callback) {
            var exception = validateParams(appGuid, 'guid', callback);
            if (exception) {
                return handleException(exception, callback);
            }
            /*
            //TODO check app permissions
            var model = conduit.applicationLayer.appCore.appManager.model;         
            if (!model || model.getPermission(this.appId, conduit.utils.apiPermissions.consts.TYPE.ADVANCED_ACTIONS).autorized !== true) {
            var exception = new TypeError("Permission denied (" + conduit.utils.apiPermissions.consts.TYPE.ADVANCED_ACTIONS + ").");
            return handleException(exception, callback);
            }
            */
         
            var response = conduit.applicationLayer.appCore.appManager.model.addUserApp(appGuid, appGuid, "", { openLastPopup: false });
            conduit.webappApi.commons.handleResponse(response, callback, false);            
        }
    }
})(conduit.abstractionlayer));
﻿// ADVANCED.MESSAGING
conduit.register("webappApi.advanced.messaging", (function (abs, undefined) {
    var commandMethods = {
        "REFRESH_TOOLBAR_VIEW": function (data, callback) {
            conduit.webappApi.platform.refresh(false, callback);
        },
        "UNINSTALL": function (data, callback) {
            var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
            var trippleKeySearchUserMode = conduit.abstractionlayer.commons.storage.getTripleKey(ctid + ".searchUserMode", function (resp) {
                var trippleKeySearchUserMode = resp.result;
                var umValue = trippleKeySearchUserMode.registry || trippleKeySearchUserMode.file || trippleKeySearchUserMode.local || "";
                conduit.abstractionlayer.backstage.browser.uninstallToolbar(umValue, "Context_Menu");
            });
        }
    };

    return {
        /*
        Posts a topic message with prefix "adv:", which any number of listeners may receive.
        The "adv:" prefix is added automatically, there's no need to specify it!
        Params:
        topic: (string) The name of the topic to post.
        [data]: (string/object) The data to send with the message.
        */
        /* THIS FUNCTION IS IMPLEMENTED IN BROWSER_APP_API
        postTopicMessage: function (topic, data, callback) {
        if (typeof (topic) !== "string") {
        var exception = new TypeError("Invalid topic, expected a non-empty string.");
        return conduit.webappApi.commons.handleException(exception, callback);
        }

        var advTopic = /^adv:/.test(topic) ? topic : "adv:" + topic,
        dataValue = typeof (data) === "string" ? data
        : typeof (data) === "object" ? JSON.stringify(data) : data.toString();

        var response = abs.commons.messages.postTopicMsg(advTopic, "webappApi", dataValue);
        conduit.webappApi.commons.handleResponse(response, callback);
        },
        */
        /*
        Attaches the abstraction layer to a web app, for synchronous storage, etc.
        */
        getSyncStorage: function () {
            abs.commons.webappapi.attach(document.getElementById("contentFrame"));
        },
        /*
        Sends a request to a listener (not limited to an app)
        Params:
        logicalName: (string) The logical name of the request,
        data: (Any value) data to send for the request
        [callback]: (function) A function to be passed as parameter to the request's listener, which can be called as response.
        */
        sendRequest: function (logicalName, data, callback) {
            var dataValue = typeof (data) === "string" ? data
            : typeof (data) === "object" ? JSON.stringify(data) : data.toString();
            abs.commons.messages.sendSysReq(
            logicalName,
            JSON.stringify({ data: self.appId }),
            dataValue,
			function (response) {
			    conduit.webappApi.commons.handleResponse(response, callback)
			}
        );
        },
        sendRequestToModel: function (method, data, callback) {
            var commandMethod = commandMethods[method];

            if (commandMethod)
                commandMethod(data, callback);
            else
                conduit.webappApi.commons.updateModel(this, "cmd:" + method, data, callback);
        }
    };
})(conduit.abstractionlayer));
﻿// ADVANCED RADIO:
conduit.register("webappApi.advanced.radio", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse;
    return {

        addListener: function (callback) {
            abs.backstage.nmWrapper.addListener("radio", function (data) {
                handleResponse(data, callback);
            });
        },
        removeListener: function (id) {
            abs.backstage.nmWrapper.removeListner("radio", id);
        }
    }

})(conduit.abstractionlayer));
﻿// ADVANCED.NOTIFICATIONS :
conduit.register("webappApi.advanced.notifications", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse;

    return {
        onShow: { addListener: function (callback, listenerCallback) {
            var self = this;
            var response = abs.commons.messages.onTopicMsg.addListener("notificationsHandler_show", listenerCallback);
            response._callbackType = 'cbSuccess';
            handleResponse(response, callback);
        }
        },
        onRegister: { addListener: function (callback, listenerCallback) {
            var self = this;
            var response = abs.commons.messages.onTopicMsg.addListener("notificationsHandler_register", listenerCallback);
            response._callbackType = 'cbSuccess';
            handleResponse(response, callback);
        }
        }
    }


})(conduit.abstractionlayer));
﻿// LOCALIZATION:
conduit.register("webappApi.advanced.localization", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse,
		messaging = conduit.abstractionlayer.commons.messages,
		arrRequests = [],
		isTranslationReady = false,
		self;



    function checkQueueAndRun() {
        var len = arrRequests.length;
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                var request = arrRequests[i];
                sendMessageToSL(request.keyName, request.callback);
            }
            arrRequests = [];
        }
    }

    function sendMessageToSL(keyName, callback) {
        abs.commons.messages.sendSysReq("serviceLayer.translation.getTranslation",
			self.appId,
			typeof (keyName) === "string" ? keyName : JSON.stringify(keyName),
			function (result) {
			    if (/\{.+\}/.test(result) || /\[.+\]/.test(result))
			        result = JSON.parse(result);

			    handleResponse(result, callback);
			});
    }

    function getTranslation(keyName, callback) {
        //check if translation is not ready
        if (!isTranslationReady) {
            //save in array
            arrRequests.push({ keyName: keyName, callback: callback });
        }
        else {
            //translation is ready, call serviceLayer
            sendMessageToSL(keyName, callback);
        }
    }

    function init() {

        isTranslationReady = true;
        checkQueueAndRun();
    }

    return {
        init: init,
        /*
        Requests a translation value for a specified key name
        Params:
        keyName: (string) The name of the key to retrieve.
        onData: (function) A function to call when the translation is retrieved, receives one parameter - translation (string).
        */
        getKey: function (keyName, callback) {

            self = this;
            if (!callback) {
                return;
            }
            getTranslation(keyName, callback);
        },
        /*
        Gets information about the toolbar's language
        Params:
        callback: (function) A function to call with the local info. Receives one parameter: localeInfo (object):
        { alignMode: (string in "RTL"|"LTR"), locale: (string, like: "en-us") }
        */
        getLocale: function (callback) {
            conduit.abstractionlayer.commons.messages.sendSysReq(
                "serviceLayer",
                "webappApi.localization.getLocale",
                JSON.stringify({ service: "toolbarSettings", method: "getLocaleData" }),
                function (result) {
                    handleResponse(result, callback);
                }
            );
        }
    };

})(conduit.abstractionlayer));
conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.webappApi.advanced.localization,
    dependencies: ['translation'],
    onLoad: conduit.webappApi.advanced.localization.init
});
﻿// ADVANCED.SERVICES :
conduit.register("webappApi.advanced.services", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse,
        services = {};

    function getSearchAPIData(callback) {
        conduit.abstractionlayer.commons.messages.sendSysReq(
			"serviceLayer",
			"webappApi.services.getSearchAPIData",
			JSON.stringify({ service: "searchAPI", method: "getSearchAPI", data: "" }),
			function (result) {
			    handleResponse(result, callback);
			}
		);
    }

    function onSearchApiChange(callback, listenerCallback) {
        var response = conduit.abstractionlayer.commons.messages.onTopicMsg.addListener("systemRequest.searchAPIReady", listenerCallback);
        response._callbackType = 'cbSuccess';
        handleResponse(response, callback);
    }

    // serviceData: { 
    //      [name]: (string) The cache file name to write.
    //      [cachedServiceName]: (string) If defined the service will write to this file name regardless of the name property.
    //      [url]: (string) The URL of the service to get,
    //      [callback]: (function) A function to call when data is received from the service.
    //      [interval]: (number) The amount, in milliseconds, to wait before running the service for the first time.
    //      [runNow]: (boolean) Set this to false if the service should run only after the interval, not when it's added.
    //      [manualInvoke=false]: (boolean) If set to true, the service doesn't run in set intervals, but only manually.
    //      [onInitInvoke]: (function) An optional function to call just before invoking the service.
    //      [onCompleteInvoke]: (function) An optional function to call after successfully invoking the service.
    //      [dataType]: (string) the type of the data return in the http request. passed as Content-Type to the http request header.
    //      [headers]: (array) http requests headers in an array. for example - [{ name: "Content-Type", value: "xml"}]
    //      [extraData]: (json) extra parameter that will be passed to the callback function
    //      [cbFail]: (function) A function to call when error occurred while sending or receiving data.
    //      [errorInterval]: (number) The amount, in milliseconds, to wait before running the service after it failed.
    //	    [retryIterations]: (number) The number of iterations of invoking the service in case of an error.
    function addService(serviceData, callback, listenerCallback) {
        try {
            serviceData.callback = function (data, isPreProcessed, extraData) {
                var responseData = [data, isPreProcessed, extraData];
                handleResponse(responseData, listenerCallback);
                return data;
            };
            var service = conduit.backstage.serviceLayer.serviceDataManager.addService(serviceData);
            if (service) {
                services[serviceData.name] = service;
                handleResponse({ result: true, status: 0, description: "", '_callbackType': 'cbSuccess' }, callback);
            }
            else {
                handleResponse({ result: "", status: 100, description: "Failed to run webappApi.services.addService - " + JSON.stringify(serviceData) }, callback);
            }
        }
        catch (e) {
            handleResponse({ result: "", status: 100, description: "Failed to run webappApi.services - " + JSON.stringify(serviceData) + ". " + e.message }, callback);
        }
    }


    function invokeService(serviceName, callback) {
        try {
            var service = services[serviceName]
            if (service) {
                service.invoke();
                handleResponse({ result: true, status: 0, description: "" }, callback);
            }
            else {
                handleResponse({ result: "", status: 100, description: "Failed to run webappApi.services.invokeService - " + serviceName + ". service is missing" }, callback);
            }
        }
        catch (e) {
            handleResponse({ result: "", status: 100, description: "Failed to run webappApi.services.invokeService - " + serviceName + ". " + e.message }, callback);
        }
    }

    function updateService(serviceName, updateData, callback) {
        try {
            var service = services[serviceName]
            if (service) {
                //conduit.backstage.serviceLayer.serviceDataManager.update(service, { url: url, interval: serviceData.reload_interval_sec * 1000 });
                conduit.backstage.serviceLayer.serviceDataManager.update(service, updateData);
                if (updateData && updateData.hasOwnProperty('data')) {
                    if (!updateData.data) {
                        updateData.data = '{}';
                    }
                    service.updateData(JSON.parse(updateData.data));
                }

                handleResponse({ result: true, status: 0, description: "" }, callback);
            }
            else {
                handleResponse({ result: "", status: 100, description: "Failed to run webappApi.services.updateService - " + serviceName + ". service is missing" }, callback);
            }
        }
        catch (e) {
            handleResponse({ result: "", status: 100, description: "Failed to run webappApi.services.updateService - " + serviceName + ". " + e.message }, callback);
        }
    }


    return {
        searchAPI: {
            getData: getSearchAPIData,
            onChange: { addListener: onSearchApiChange }
        },
        addService: { addListener: addService },
        invokeService: invokeService,
        updateService: updateService
    }



})(conduit.abstractionlayer));
﻿// ADVANCED.STUDIO.APPS :
conduit.register("webappApi.advanced.studio.apps", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse,
        handleException = conduit.webappApi.commons.handleException;

    function invokeUserAppsAPI(messageData, callback) {
        conduit.abstractionlayer.commons.messages.sendSysReq(
                "serviceLayer.userApps.studio",
                "webappApi.advanced.studio.apps",
                JSON.stringify(messageData),
                function (response) {
                    var returnObj = JSON.parse(response);
                    conduit.webappApi.commons.handleResponse(returnObj, callback, false)
                }
            );
    }

    var validateParams = function (param, paramName, callback) {

        if (typeof (callback) !== "function") {
            return new TypeError("Invalid callback function.");
        }
        if (typeof (param) !== "string") {
            return new TypeError("Parameter: <" + paramName + "> is invalid, expected a string.");
        }
        if (param.length == 0) {
            return new TypeError("Parameter: <" + paramName + "> is invalid, expected non empty string.");
        }

    }

    return {
        //Loads a new studio app to the toolbar. This will also generate an appId.
        load: function (from_path, callback) {
            var exception = validateParams(from_path, 'path', callback);
            if (exception) {
                return handleException(exception, callback);
            }

            invokeUserAppsAPI({ "method": 'load', "data": { "from_path": from_path} }, callback);
        },

        /* Reloads an existing studio app to the toolbar 
        (Reads updated manifest and files from the unpackaged app, validates and loads, overriding the previous version on the toolbar) */
        reload: function (appId, callback) {
            var exception = validateParams(appId, 'appId', callback);
            if (exception) {
                return handleException(exception, callback);
            }

            invokeUserAppsAPI({ "method": 'reload', "data": { "appId": appId} }, callback);
        },
        //Disables an existing studio app (Will keep in studio apps list, but app will no longer run)
        disable: function (appId, callback) {
            var exception = validateParams(appId, 'appId', callback);
            if (exception) {
                return handleException(exception, callback);
            }

            invokeUserAppsAPI({ "method": 'disable', "data": { "appId": appId} }, callback);
        },
        /*Enables an existing disabled studio app */
        enable: function (appId, callback) {
            var exception = validateParams(appId, 'appId', callback);
            if (exception) {
                return handleException(exception, callback);
            }

            invokeUserAppsAPI({ "method": 'enable', "data": { "appId": appId} }, callback);
        },
        /*Removes the studio app (permanently, unload from toolbar and remove from studio apps list)*/
        remove: function (appId, callback) {
            var exception = validateParams(appId, 'appId', callback);
            if (exception) {
                return handleException(exception, callback);
            }

            invokeUserAppsAPI({ "method": 'remove', "data": { "appId": appId} }, callback);
        },
        /*
        Returns an array of all existing studio apps (both enabled and disabled)
        */
        getList: function (callback) {

            invokeUserAppsAPI({ "method": 'getList', "data": {} }, callback);
        }
    }
})(conduit.abstractionlayer));
﻿// ADVANCED.MANAGED.APPS :
conduit.register("webappApi.advanced.managed.apps", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse,
        handleException = conduit.webappApi.commons.handleException;
    var injectionListeners = [];

    function invokeUserAppsAPI(messageData, callback) {
        messageData.service = 'userApps';
        conduit.abstractionlayer.commons.messages.sendSysReq(
                "serviceLayer",
                "webappApi.advanced.managed.apps",
                JSON.stringify(messageData),
                function (response) {
                    if (typeof response === "string" && response.length > 0) {
                        response = JSON.parse(response);
                    }
                    conduit.webappApi.commons.handleResponse(response, callback, false);
                }
            );
    }

    var validateParams = function (param, paramName, callback) {

        if (typeof (callback) !== "function") {
            return new TypeError("Invalid callback function.");
        }
        if (typeof (param) !== "string") {
            return new TypeError("Parameter: <" + paramName + "> is invalid, expected a string.");
        }
        if (param.length == 0) {
            return new TypeError("Parameter: <" + paramName + "> is invalid, expected non empty string.");
        }

    }

    return {
        /*
        Adds a Managed webapp to the toolbar.
        info: 
        Boolean blockEvents - default true
        Boolean visible - default false
        */
        add: function (guid, info, callback) {
            var exception = validateParams(guid, 'guid', callback);
            if (exception) {
                return handleException(exception, callback);
            }

            var appData = { appGuid: guid, managed: { managerId: this.appId} };
            if (info) {
                appData.managed.visible = typeof (info.visible) !== 'undefined' ? info.visible : false; // default false
                // block documentComplete and navigateComplete events for this app
                appData.managed.blockEvents = typeof (info.blockEvents) !== 'undefined' ? info.blockEvents : true;
                appData.managed.ctid = info.ctid;
                appData.managed.extraData = info.extraData;
            }
            //TODO call the model's isappinstalled function to avoid adding aleardy exist app 

            var response = conduit.backstage.serviceLayer.userApps.addUserAppByJson(appData);
            conduit.webappApi.commons.handleResponse(response, callback, false);


        },
        /*Removes the managed webapp (permanently, unload and remove from toolbar)*/
        remove: function (guid, callback) {
            var exception = validateParams(guid, 'guid', callback);
            if (exception) {
                return handleException(exception, callback);
            }
            var appData = { appGuid: guid };

            var response = conduit.backstage.serviceLayer.userApps.removeAppFromModelAndRepository(appData);
            if (typeof response === "string" && response.length > 0) {
                var managedAppId = response;
                conduit.webappApi.storage.app.keys.remove.apply({ appId: managedAppId }, ["isManagedApp", function () { } ]);
                response = '';
            }

            conduit.webappApi.commons.handleResponse(response, callback, false);
        },
        /*
        invoke the document/navigate complete events in the managed webapp by demand using the event’s data from the Manager app
        info:  String eventType – tabs.onDocumentComplete/tabs.onNavigateComplete
        String eventData – {url: "", tabId: "", postData: ""}
        */
        triggerEvent: function (guid, info, callback) {
            var exception = validateParams(guid, 'guid', callback);
            if (exception) {
                return handleException(exception, callback);
            }
            // delegate the event to the managed webapp by recreating it in the desired format.
            // call the stored listenerCallback function from a map according to appId and event type in conduit.tabs object
            if (info && info.eventType && info.eventData) {
                if (/tabs/.test(info.eventType)) {
                    conduit.webappApi.tabs.triggerEvent(guid, info, callback);
                }
            }
        },

        onWebAppInjection: {
            addListener: function (callback, listenerCallback) {
                injectionListeners.push(listenerCallback);
                var response = { result: true };
                response._callbackType = 'cbSuccess';
                handleResponse(response, callback);
            },

            appInjected: function (appGuid){
                for (var i=0; i <injectionListeners.length; i++ ){
                    handleResponse(appGuid, injectionListeners[i]);
                }
            }
        }
    }
})(conduit.abstractionlayer));
﻿// ADVANCED.LAB:
conduit.register("webappApi.advanced.lab", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse;

    return {
        getNavHistory: function (requestObj, callback) { //TODO check app permissions (if needed)
            var result = abs.backstage.browser.getNavHistory(requestObj);

            handleResponse(result, callback)
        },

        getBookmarkList: function (requestObj, callback) { //TODO check app permissions (if needed)
            var result = abs.backstage.browser.getBookmarkList(requestObj);

            handleResponse(result, callback)
        },

        getBookmark: function (requestObj, callback) { //TODO check app permissions (if needed)
            var result = abs.backstage.browser.getBookmark(requestObj);

            handleResponse(result, callback)
        }
    };
})(conduit.abstractionlayer));
﻿// ADVANCED BRANCHING:
conduit.register("webappApi.advanced.branching", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse;
    return {

        replaceActiveCT: function (activeCTID, callback) {
            var ctid = abs.commons.context.getCTID().result;                        
            abs.commons.repository.setKey(ctid + ".activeCTID", activeCTID); //update the current active CTID key in repository
            abs.commons.repository.setKey(ctid + ".replaceActiveCTManually", "true"); //set key that notify that active CT ID will change only by this API and not using the login response
            conduit.applicationLayer.appCore.appManager.model.replaceActiveCTID(activeCTID);
            
            handleResponse(true, callback);
        }
    }

})(conduit.abstractionlayer));
//  APP:
conduit.register("webappApi.app", (function (abs, undefined) {
    var lastSessionClick = {};
    var SESSION_CLICK_INTERVAL = 5 * 60 * 1000;
    return {
        /*
        Gets custom data for the current app from settings.
        */
        getSettingsData: function (callback) {
            var self = this;
            if (!callback)
                return;

            if (typeof (callback) !== "function"){
                var exception = new TypeError("Invalid callback for app.getAppData, expected a function.");
                return conduit.webappApi.commons.handleException(exception, callback);
            }

            conduit.abstractionlayer.commons.messages.sendSysReq(
                "serviceLayer",
                "webappApi.app.getAppData",
                JSON.stringify({ service: "toolbarSettings", method: "getAppData", data: self.appId }),
                function (response) {
                    conduit.webappApi.commons.handleResponse(JSON.parse(response), callback)
                }
            );
        },
        /*
        Returns the current context (embedded/popup/background). Can be used both synchronously or asynchronously.
        Returns (or provided to the callback): 'embedded', 'popup' or 'background'.
        */
        getCurrentContext: function (callback) {
            if (callback)
                callback(this.context || "background");
        },
        handleClickEvent: function (data) {
	//TODO: if no data log error
            if (data.button == 0) {//left click
                var now = +(new Date);
                var lastClick = lastSessionClick[this.appId + this.viewId] || 0;
                if (now - SESSION_CLICK_INTERVAL > lastClick) {
                    conduit.applicationLayer.appCore.appManager.model.sendUsage({
                        type: "sendToolbarComponentUsage",
                        appId: this.appId,
                        actionType: "BROWSER_COMPONENT_SESSION_CLICK",
                        additionalUsageInfo: {
                            sessionLengthInSeconds: Math.round((now - (lastClick || now)) / 1000)
                        }
                    });
                }
                lastSessionClick[this.appId + this.viewId] = now;
            }
            else if (data.button == 2) { //right click
                var self = this;
                var openContextMenu = function (left, top) {
                    conduit.webappApi.commons.withCurrentWindow(function (windowId) {
                        contextMenuType = conduit.applicationLayer.UI.menuManager.MenusConst.OTHER_APPS_CONTEXT_MENU;
                        menuOptions = {
                            position: { left: left, top: top, right: left, isAbsolute: true },
                            appId: contextMenuType,
                            viewId: self.viewId,
                            windowId: windowId
                        }
                        conduit.applicationLayer.UI.menuManager.openContextMenu(contextMenuType, menuOptions);
                    });
                }
                if (window.chrome) {
                    /*in chrome case the left and right the function recive are relative to the app. We get the app poistion and add it to the relative location*/
                    conduit.abstractionlayer.commons.messages.sendSysReq("applicationLayer.appManager.view_" + data.viewId, "applicationLayer.UI.popup", JSON.stringify({ method: "getAppPosition", data: data.appId }), function (res) {
                        var appPos = JSON.parse(res);
                        var newLeft = data.left + appPos.left;
                        var newTop = data.top + appPos.top;
                        openContextMenu(newLeft, newTop);
                    });

                } else {
                    openContextMenu(data.left, data.top);
                }
            }
        }
    };
})(conduit.abstractionlayer));
﻿// APP.EMBEDDED:
conduit.register("webappApi.app.embedded", (function (abs, undefined) {
    var updateModel = conduit.webappApi.commons.updateModel;

    return {
        setEmbedded: function (info, callback) {
            updateModel(this, "setEmbedded", info, callback, true);
        },
        collapse: function (callback) {
            updateModel(this, "collapse", undefined, callback, true);
        },
        expand: function (callback) {
            updateModel(this, "expand", undefined, callback, true);
        },
        getState: function (callback) {
            updateModel(this, "getState", undefined, callback);
        },
        setOnBeforeLoadData: function (data) {
            conduit.applicationLayer.appCore.appManager.model.getAppById(this.appId).onBeforeLoadData = data;
        }
    }
})(conduit.abstractionlayer));
﻿// APP.ICON:
conduit.register("webappApi.app.icon", (function (abs, undefined) {
    var commons = conduit.webappApi.commons,
        handleResponse = conduit.webappApi.commons.handleResponse,
        updateModel = commons.updateModel;

    function getText(value) {
        var returnValue;
        switch (typeof (value)) {
            case "string":
                returnValue = value;
                break;
            case "function":
                returnValue = value();
                break;
            case "undefined":
                returnValue = undefined;
                break;
            case "boolean":
                returnValue = value.toString();
                break;
            default:
                returnValue = value ? value.toString() : undefined;
                break;
        }

        return returnValue;
    }

    return {
        /*
        Sets the background color of the badge (if exists) on the app's icon.
        Params:
        color: (string/null/undefined) The color of the badge in hex (#383943). Can be undefined/null to set to default.
        [callback]: (function) An optional function to call after the color's been set to the badge.
        */
        setBadgeBackgroundColor: function (color, callback) {
            if (color && typeof (color) !== "string") {
                var exception = new TypeError("Invalid color value for app.setBadgeBackgroundColor, expected a string, null or undefined.");
                return commons.handleException(exception, callback);
            }

            updateModel(this, "setBadgeBackgroundColor", color, callback, true);
        },
        /*
        Sets the badge's text on the app's icon.
        Params:
        text: (any value) If a function is specified, it's called and its return value will be set as the badge's text.
        [callback]: (function) An optional function to call after the text's been set to the badge.
        */
        setBadgeText: function (text, callback) {
            updateModel(this, "setBadgeText", getText(text), callback, true);
        },
        /*
        Sets/changes the icon for the app in the strip.
        Params:
        details: (object/string) The string URL of the icon's image or an object: { [url]: (string) The image URL, [imageData]: (object) { mimeType: (string) The mime type of the image, data: (string) the base64 representation of the image }
        [callback]: (function) An optional function to call after the icon's been set.
        */
        setIcon: function (details, callback) {
            if (!details)
                return undefined;

            var url = typeof (details) === "string" ? details
                : details.imageUrl ? details.imageUrl :
                    details.imageData && details.imageData.mimeType && details.imageData.data ? "data:" + details.imageData.mimeType + ";base64," + details.imageData : undefined;

            if (!url) {
                return commons.handleException(new Error("app.icon.setIcon: No value specified for the icon url or imageData."), callback);
            }


            updateModel(this, "setIcon", url, callback, true);
        },
        /*
        Sets the text next to the app's icon in the toolbar.
        Params:
        text: (any value) If a function is specified, it's called and its return value will be set as the app's title.
        [callback]: (function) An optional function to call after the title's been set.
        */
        setIconText: function (text, callback) {
            updateModel(this, "setText", getText(text), callback, true);
        },
        /*
        Sets the text to show in the tooltip when hovering over the button.
        Params:
        text: (any value) If a function is specified, it's called and its return value will be set as the app's tooltip.
        [callback]: (function) An optional function to call after the tooltip's been set.
        */
        setTooltip: function (text, callback) {
            //TODO - what is this? sendSysReqToApp is not defined...
            //sendSysReqToApp("setTooltip", { text: getText(text) }, callback);
        },
        onClicked: { addListener: function (callback, listenerCallback) {
            var self = this;
            var response = abs.commons.messages.onTopicMsg.addListener("webAppApi.app.icon.clickEvent." + self.appId, listenerCallback);
            response._callbackType = 'cbSuccess';
            handleResponse(response, callback);
        }
        }
    }
})(conduit.abstractionlayer));

﻿// APP.POPUP:
conduit.register("webappApi.app.popup", (function (abs, undefined) {
    var applicationLayerDest,
        sendSysReq,
		lastOpenedPopupId,
		allowOpen = true,
        updateModel = conduit.webappApi.commons.updateModel,
        handleResponse = conduit.webappApi.commons.handleResponse;

    var apiMethods = {
        getInfo: function (popupId, callback) {
            var self = this;
            popupId = popupId === undefined || popupId === null
				? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
				: popupId;

            var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: popupId, viewId: self.viewId, isMenu: self.isMenu });
            handleResponse(popup.properties.position, callback);
        },
        /*
        Creates a popup in the background page, to be ready when the popup is needed in the UI
        Params:
        url: (string) The url of the HTML in the popup.
        options: (object) Parameters for the opened popup: {
        openPosition: (string) "offset (left (number), top (number))" - A string in this format with the offset of the popup from the bottom-left of the embedded/linkbutton.
        },
        [callback]: (function) An optional function to call after the popup's been created. Receives one parameter - success, with value true.
        */
        set: function (url, options, callback) {
            /* this function should set the appData.popup of existing button  (but not forembedded)*/
            options = options || {};
            var defaultWidth = 400,
			    defaultHeight = 400;
            var popupOptions = {
                url: url,
                size: {
                    width: options.dimensions ? options.dimensions.width : options.width || defaultWidth,
                    height: options.dimensions ? options.dimensions.height : options.height || defaultHeight
                },
                closeOnExternalClick: !!options.closeOnExternalClick,
                showFrame: options.showFrame !== false,
                allowScrollInFrame: typeof (options.allowScrolls) === "object" ? options.allowScrolls : { vScroll: false, hScroll: false }
            };
            //TODO finish this, the callback is not called. the respose is undefined. and the popup will not open again.
            updateModel(this, "setPopup", popupOptions, callback, true);
        },
        /*
        Opens a popup
        Params:
        url: (string) The URL to display in the popup.
        [options]: (object) Options for the popup: {
        [isModal]: (boolean=false) Whether to display the popup as only a message.
        [showFrame]: (boolean=true) Whether to display a frame around the popup.
        [closeOnExternalClick]: (boolean=true) Whether the popup closes if the user clicks the mouse outside the popup.
        [saveLocation]: (boolean=true) Whether the popup will be opened at the same position the next time, after being closed.
        [openPosition]: (string) Where to open the popup. Available values: "offset(X,Y)", "center" (center of the screen) and "click" (top left corner of the popup will be where the mouse was clicked).
        [width]: (number) The desired popup's width.
        [height]: (number) the desired popup's height.
        [extraData]: (json object) data that will be passed to the popup. can get it by using conduit.app.getData() API
        }
        [callback]: (function) A function to call after the popup's been opened.
        */
        open: function (url, options, callback) {
            //	alert(JSON.stringify(options));
            //performance measure:conduit.abstractionlayer.commons.storage.setPref("Perform_webappApiPopupOpen", String(+new Date()));
            var self = this;
            if (!allowOpen) {
                if (callback)
                    callback();
                return;
            }
            var frameTitle = options.frameTitle ? String(options.frameTitle) : "";
            options = options || {};
            options.withUsage = (typeof options.withUsage !== 'undefined') ? options.withUsage : true;
            var defaultWidth = 400,
				defaultHeight = 400,
                appData = { appId: self.appId, viewId: self.viewId, frameTitle: frameTitle };
            //TODO go over all the options and decide of they are public and should be documented
            var popupProperties = {
                menuId: options.menuId || "",
                itemappid: options.itemappid || "",
                method: "open",
                url: url,
                width: options.dimensions ? options.dimensions.width : options.width || defaultWidth,
                height: options.dimensions ? options.dimensions.height : options.height || defaultHeight,
                isModal: !!options.isModal,
                showFrame: options.showFrame !== false,
                closeOnExternalClick: options.closeOnExternalClick === true,
                hideOnExternalClick: options.hideOnExternalClick === true,
                transparent: options.transparent === true,
                saveLocation: options.saveLocation !== false,
                saveSize: options.saveSize !== false,
                allowScrollInFrame: typeof (options.allowScrolls) === "object" ? options.allowScrolls : { vScroll: false, hScroll: false },
                nativeFrame: options.nativeFrame === true,
                isShowMininmizedIcon: (options.isShowMininmizedIcon !== undefined) ? options.isShowMininmizedIcon : ("embedded" !== self.context) ? true : false,
                timeData: options.timeData ? options.timeData : undefined,
                isFocused: typeof (options.isFocused) !== 'undefined' ? options.isFocused : true,
                isChild: typeof (options.isChild) !== 'undefined' ? options.isChild : false,
                resizable: options.resizable === true,
                isLightFrame: (typeof options.isLightFrame !== 'undefined') ? options.isLightFrame : true,
                closebutton: options.closebutton,
                extraData: options.extraData,
                tabId: options.tabId
            };

            if (options.icon) {
                appData.icon = options.icon;
            }

            //check if publisher sends some kind of format position
            if (options.openPosition) {
                var openPos = options.openPosition,
                    position;

                //format: offset(50,50) or offset:(50;50)
                var offsetMatch = openPos.match(/^offset\s?:?\((\-?\d+)[,|;]\s?(\-?\d+)\)$/i);
                if (offsetMatch) {
                    position = {
                        left: parseInt(offsetMatch[1], 10),
                        top: parseInt(offsetMatch[2], 10),
                        right: parseInt(offsetMatch[1], 10)
                    };

                    // this is only because the offset in the openPosition is a string and not a regular object. otherwise, I whould put the isAbsolute in the openPosition!
                    if (options.isAbsolute !== undefined) {
                        position.isAbsolute = options.isAbsolute;
                    }
                }
                //format: alignment(T,R) or alignment:(T;R) 
                else {
                    var alignMentMatch = openPos.match(/^alignment:?\((T|B)[,|;](L|R)\)$/);
                    if (alignMentMatch) {
                        var verticalPos = alignMentMatch[1];
                        var horizontalPos = alignMentMatch[2];
                        position = {
                            isAlignment: true,
                            top: verticalPos,
                            left: horizontalPos
                        }
                    }
                    //center
                    else {
                        if (openPos === 'center') {
                            position = { isCenter: true }
                        }
                        else if (openPos === 'click') {
                            //not implementd yet
                        }
                    }
                }
                popupProperties.position = position;
            }

            var startDate = Date.parse(Date());

            conduit.applicationLayer.UI.popupManager.open(popupProperties, appData, function (response) {
                lastOpenedPopupId = response;
                handleResponse(response, callback);
                var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: response, viewId: appData.viewId, isMenu: self.isMenu });
                popup.onClose(function () {
                    if (options.withUsage) {
                        conduit.applicationLayer.appCore.appManager.model.sendUsage({
                            type: "sendToolbarComponentUsage",
                            appId: self.appId,
                            actionType: "GADGET_CLOSE",
                            additionalUsageInfo: {
                                sourceCompType: "API",
                                gadgetType: "GADGET",
                                gadgetUrl: url,
                                durationSec: (Date.parse(Date()) - startDate) / 1000
                            }
                        });
                    }
                }, response);

                if (options.withUsage) {
                    conduit.applicationLayer.appCore.appManager.model.sendUsage({
                        type: "sendToolbarComponentUsage",
                        appId: self.appId,
                        actionType: "GADGET_OPEN",
                        additionalUsageInfo: {
                            sourceCompType: "API",
                            gadgetType: "GADGET",
                            gadgetUrl: url
                        }
                    });

                }
            });
        },
        /*
        Closes the current app's popup, if it's open.
        */
        close: function (popupId, callback) {
            var self = this;
            popupId = popupId === undefined || popupId === null
				? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
				: popupId;

            var appData = { appId: self.appId, popupId: popupId, viewId: self.viewId };
            conduit.applicationLayer.UI.popupManager.close(popupId,
                appData,
				function (response) {
				    if (lastOpenedPopupId === popupId)
				        lastOpenedPopupId = undefined;

				    response._callbackType = 'cbSuccess';
				    handleResponse(response, callback);
				}
			);
        },
        /*
        Resizes the popup
        Params:
        dimensions: (object): {
        [width]: (number) The new width of the popup, in pixels
        [height]: (number) The new height of the popup, in pixels
        },
        [callback]: (function) Function to call after the popup's been resized.
        */
        resize: function (popupId, dimensions, callback) {
            var self = this;
            if (!dimensions || (!dimensions.width && !dimensions.height))
                return false;

            popupId = popupId === undefined || popupId === null
				? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
				: popupId;

            var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: popupId, viewId: self.viewId, isMenu: self.isMenu });
            popup.properties.resizable = false; // avoid auto resize
            popup.resize(dimensions, function (response) {
                response._callbackType = 'cbSuccess';
                handleResponse(response, callback);
            });
        },

        onClosed: {
            addListener: function (popupId, callback, listenerCallback) {
                var self = this;
                popupId = popupId === undefined || popupId === null
					? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
					: popupId;
                var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: popupId, viewId: self.viewId, isMenu: self.isMenu });
                var response;
                if (popup) {
                    popup.onClose(listenerCallback, popupId);
                    response = {
                        'result': true,
                        '_callbackType': "cbSuccess",
                        'status': 0,
                        'description': "success"
                    };
                }
                else {
                    response = {
                        'result': false,
                        'status': 555,
                        'description': "invalid popup id"
                    };
                }
                handleResponse(response, callback);
            }
        },
        onShow: {
            addListener: function (popupId, callback, listenerCallback) {
                var self = this;
                popupId = popupId === undefined || popupId === null
					? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
					: popupId;
                var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: popupId, viewId: self.viewId, isMenu: self.isMenu });
                var response = popup.onShow(listenerCallback, popupId);
                // TODO: adding listener has no response yet (abs bug)
                //response._callbackType = 'cbSuccess';
                //handleResponse(response, callback);
            }
        },
        show: function (popupId, callback) {
            var self = this;
            popupId = popupId === undefined || popupId === null
					? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
					: popupId;
            var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: popupId, viewId: self.viewId, isMenu: self.isMenu });
            var response = popup.show(popupId, callback);
            // TODO: adding listener has no response yet (abs bug)
            //response._callbackType = 'cbSuccess';
            //handleResponse(response, callback);

        },
        onHide: {
            addListener: function (popupId, callback, listenerCallback) {
                var self = this;
                popupId = popupId === undefined || popupId === null
					? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
					: popupId;
                var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: popupId, viewId: self.viewId, isMenu: self.isMenu });
                var response = popup.onHide(listenerCallback, popupId);
                // TODO: adding listener has no response yet (abs bug)
                //response._callbackType = 'cbSuccess';
                //handleResponse(response, callback);
            }
        },
        hide: function (popupId, callback) {
            var self = this;
            popupId = popupId === undefined || popupId === null
					? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
					: popupId;
            var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: popupId, viewId: self.viewId, isMenu: self.isMenu });
            var response = popup.hide(popupId, callback);
            // TODO: adding listener has no response yet (abs bug)
            //response._callbackType = 'cbSuccess';
            //handleResponse(response, callback);
        },
        setFocus: function (popupId, callback) {
            var self = this;
            popupId = popupId === undefined || popupId === null
					? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
					: popupId;
            var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: popupId, viewId: self.viewId, isMenu: self.isMenu });
            var response = popup.setFocus();
        },
        changePosition: function (popupId, top, left, callback) {
            var self = this;
            popupId = popupId === undefined || popupId === null
					? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
					: popupId;
            var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: popupId, viewId: self.viewId, isMenu: self.isMenu });
            var response = popup.changePosition(popupId, top, left, function (response) {
                response._callbackType = 'cbSuccess';
                handleResponse(response, callback);
            });
        },
        onNavigate: {
            addListener: function (popupId, callback, listenerCallback) {
                var self = this;
                popupId = popupId === undefined || popupId === null
					? self.popupId !== undefined ? self.popupId : lastOpenedPopupId
					: popupId;
                var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: popupId, viewId: self.viewId, isMenu: self.isMenu });
                var response = popup.onNavigate(listenerCallback, popupId);
                // TODO: adding listener has no response yet (abs bug)
                //response._callbackType = 'cbSuccess';
                //handleResponse(response, callback);
            }
        },
        handlePopupSize: function (data) {
            var self = this;
            var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: self.popupId, viewId: self.viewId, isMenu: self.isMenu });

            if (popup && popup.properties && popup.properties.resizable) {
                popup.autoResize(data);
            }
        },
        handlePopupTitle: function (title) {
            var self = this;
            var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: self.appId, popupId: self.popupId, viewId: self.viewId, isMenu: self.isMenu });

            if (popup) {
                popup.setTitle(title);
            }
        }
    };

    return apiMethods;

})(conduit.abstractionlayer));

﻿// APP.MENU:
conduit.register("webappApi.app.menu", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse;
    var menuManager = conduit.applicationLayer.UI.menuManager;
    var withCurrentWindow = conduit.webappApi.commons.withCurrentWindow;
    var handleException = conduit.webappApi.commons.handleException;

    function isNumber(value) {
        return (typeof value == "number" && !isNaN(value));
    }

    function parsePosition(options) {
        if (options.position) {
            options.position.left = parseInt(options.position.left);
            options.position.top = parseInt(options.position.top);
            if (!(isNumber(options.position.left) && isNumber(options.position.top))) {
                conduit.coreLibs.logger.logDebug('position is not a number', { className: "webAppApi.menu", functionName: "parsePosition" });
                return false;
            }
            else {
                return true;
            }
        }
        return true;
    }

    return {
        create: function (data, callback) {
            menuManager.createMenu(this, data, function (menu) {
                handleResponse(String(menu.id), callback);
            });
        },
        open: function (data, options, callback) {

            var self = this;
            var defaultWidth = 400,
			    defaultHeight = 400,
                defaultLeft = 0,
                defaultTop = 0;
            var self = this;
            var menuOptions = { dimensions: { width: defaultWidth, height: defaultHeight }, position: { left: defaultLeft, top: defaultTop} };

            if (options) {
                if (!parsePosition(options)) {
                    return handleException(new TypeError("position is invalid, expected a number."), callback);
                }
                menuOptions = {
                    dimensions: { width: options.dimensions ? options.dimensions.width : options.width || defaultWidth,
                        height: options.dimensions ? options.dimensions.height : options.height || defaultHeight
                    },
                    position: {
                        left: options.position ? (options.position.left || defaultLeft) : defaultLeft,
                        top: options.position ? (options.position.top || defaultTop) : defaultTop,
                        right: options.position ? (options.position.right || null) : null
                    }
                };

                if (options.position && options.position.isAbsolute !== undefined)
                    menuOptions.position.isAbsolute = options.position.isAbsolute;
            }

            data.saveCache = ((options && typeof options.saveCache !== 'undefined') ? options.saveCache : false);


            var menu = data.menuId ? menuManager.getMenu(self.appId, data.menuId, self.viewId) : menuManager.createMenu(self, data);
            if (options.timeData) {
                menu.context.timeData = options.timeData;
            }

            abs.commons.messages.sendSysReq("applicationLayer.appManager.view_" + self.viewId, "webapp", JSON.stringify({ method: "getAppPosition", data: self.appId }), function (data) {
                var currentPposition = JSON.parse(data);
                conduit.coreLibs.logger.logDebug('menu open currentPposition: top: ' + currentPposition.bottom + ' type: ' + typeof currentPposition.bottom + ' left: ' + currentPposition.left + ' type: ' + typeof currentPposition.left, { className: "webAppApi.menu", functionName: "open" });
                menuOptions.position.left += currentPposition.left;
                menuOptions.position.right += currentPposition.right;
                menuOptions.position.top += currentPposition.bottom;
                menu.open(menuOptions.position, function (response) {
                    handleResponse(response, callback);
                });
            });


        },
        getData: function (menuId, callback) {
            menuId = menuId || this.menuId;
            var data = menuManager.getMenuData(this.appId, menuId, this.viewId);
            if (/Firefox\/3\.6/.test(navigator.userAgent)) {
                callback($.extend(true, {}, data));
            }
            else {
                handleResponse(data, callback);
            }
        },
        onCommand: {
            addListener: function (menuId, callback, listenerCallback) {
                var self = this,
                    response = abs.commons.messages.onTopicMsg.addListener("adv:menuCommand_" + self.appId + "_" + menuId, listenerCallback);
                response._callbackType = 'cbSuccess';
                handleResponse(response, callback);
            }
        },
        onClose: {
            addListener: function (menuId, callback, listenerCallback) {
                menuManager.onHide(this.originalAppId || this.appId, this.viewId, listenerCallback);
            }
        },
        close: function (callback) {
            menuManager.close(this.viewId);
            if (callback)
                handleResponse("", callback);
        },
        resize: function (dimensions, callback) {
            menuManager.resize(dimensions, this.viewId, function (response) {
                handleResponse(response, callback);
            });
        },

        getPosition: function (callback) {
            if (callback)
                handleResponse(menuManager.getPosition(this.viewId), callback);
        },
        onShow: {
            addListener: function (callback, listenerCallback) {
                menuManager.onShow(this.viewId, listenerCallback);
            }
        }
    }

})(conduit.abstractionlayer));

﻿// NETWORK:
conduit.register("webappApi.network", (function (abs, undefined) {
    var handleException = conduit.webappApi.commons.handleException;

    return {
        /*
        Executes an XMLHttpRequest (AJAX).
        Params:
        e: (object) {
        url: (string) The url of the resource to get
        [error]: (function) A function to call when an error is returned from the resouce. Receives two parameters - errorDescription and statusCode.
        [headers]: (array) An array of name/value objects that represent headers sent to the resource. Example: [{ name: "TestHeader", value: "test1234" }]
        [method]: (string) GET/POST. If not specified, defaults to POST if postParams is specified or GET if not.
        [postParams]: (string/object) Data to be sent to the resource as post data.
        [state]: (any value) An optional parameter to be passed to the success or error callback as second parameter. 
        [success]: (function) A function to call when data is received. Receives two parameters - data and state.
        [username]: (string) Username to send for authentication
        [password]: (string) Password to send along with username for authentication
        }

        Return value:
        result: { responseData: "DATA", headers: "Headers data", responseCode: XXX } 
        */
        httpRequest: function (e, callback) {
            var model = conduit.applicationLayer.appCore.appManager.model;

            if (!model || model.getPermission(this.appId, conduit.utils.apiPermissions.consts.TYPE.CROOS_DOMAIN_AJAX).autorized !== true) {
                var exception = new TypeError("Permission denied (" + conduit.utils.apiPermissions.consts.TYPE.CROOS_DOMAIN_AJAX + ").");
                return handleException(exception, callback);
            }
            if (!e || !e.url || typeof (e.url) !== "string") {
                var exception = new Error("Can't invoke network.httpRequest, no URL specified.");
                return conduit.webappApi.commons.handleException(exception, callback);
            }
            if (!e.method || (e.method && (e.method !== "GET" || e.method !== "POST")))
                e.method = e.postParams ? "POST" : "GET";

            if (e.postParams) {
                var paramsType = typeof (e.postParams);

                if (paramsType === "object")
                    e.postParams = JSON.stringify(e.postParams);
                else if (paramsType !== "string"){
                    var exception = new TypeError("Invalid postParams for network.httpRequest, should be an object or a string.");
                    return handleException(exception, callback);
                }
            }

            conduit.abstractionlayer.commons.http.httpRequest(
                e.url,
                e.method,
                e.postParams || "",
                e.headers ? JSON.stringify({ headers: e.headers }) : "",
                e.userName || "",
                e.password || "", null,
                function (response) {
                    var responseData = response;
                    if (!responseData.status) {
                        var result = response.result;
                        responseData = [result.responseData, result.headers, result.responseCode];
                    }
                    conduit.webappApi.commons.handleResponse(responseData, callback);
                }
            );
        }
    }
})(conduit.abstractionlayer));

﻿// NETWORK.SOCKETS:
conduit.register("webappApi.network.sockets", (function (abs, undefined) {
    var absSockets = conduit.abstractionlayer.backstage.sockets,
        handleResponse = conduit.webappApi.commons.handleResponse,
        handleException = conduit.webappApi.commons.handleException,
        apiMethods = {
            connect: function (options, callback) {
                if (typeof (options) !== "object")
                    handleException(new TypeError("Invalid options for sockets.connect, expected object."), callback);
                if (!options.address)
                    handleException(new Error("Invalid options for sockets.connect, missing address."), callback);
                if (!options.port)
                    handleException(new Error("Invalid options for sockets.connect, missing port number."), callback);
                if (typeof (options.port) !== "number")
                    handleException(new Error("Invalid options for sockets.connect, port is not a number."), callback);

                absSockets.connect(options.address, options.port, !!options.ssl, function (response) {
                    handleResponse(response, callback);
                });

            },
            send: function (connectionToken, data, dataIdentity, callback) {
                connectionToken = parseInt(connectionToken);

                absSockets.send(data, connectionToken, dataIdentity, function (response) {
                    handleResponse(response, callback);
                });
            },
            close: function (connectionToken, callback) {
                connectionToken = parseInt(connectionToken);

                absSockets.close(connectionToken, function (response) {
                    response._callbackType = 'cbSuccess';
                    handleResponse(response, callback);
                });
            },
            onMessage: { addListener: function (connectionToken, callback, listenerCallback) {
                connectionToken = parseInt(connectionToken);
                var response = absSockets.onDataRecieved.addListener(connectionToken, listenerCallback);
                response._callbackType = 'cbSuccess';
                handleResponse(response, callback);
            }
            },
            onConnectionEstablished: { addListener: function (callback, listenerCallback) {
                var response = absSockets.onConnectionEstablished.addListener(listenerCallback);
                response._callbackType = 'cbSuccess';
                handleResponse(response, callback);
            }
            },
            onConnectionClosed: { addListener: function (connectionToken, callback, listenerCallback) {
                connectionToken = parseInt(connectionToken);
                var response = absSockets.onConnectionClosed.addListener(connectionToken, listenerCallback);
                response._callbackType = 'cbSuccess';
                handleResponse(response, callback);
            }
            }
        };

    return apiMethods;
})(conduit.abstractionlayer));
// IDLE:
conduit.register("webappApi.idle", (function (abs, undefined) {
    var handleException = conduit.webappApi.commons.handleException;

    return {
        onStateChanged: {
            /*
            Adds a listener for the event that the browser's state has changed.
            Params:
            callback: (function) A function to call when the browser's state changes. Receives one parameter: state (string in "active"|"idle"|"locked").
            threshold: int, Threshold in seconds.
            */
            addListener: function (threshold, callback, listenerCallback) {
                if (typeof (threshold) !== "number") {
                    var exception = new TypeError("Invalid threshold, expected a number.");
                    return handleException(exception, callback);
                }
                var response = abs.commons.idle.onChangeState.addEventListener(threshold, listenerCallback);
                conduit.webappApi.commons.handleResponse(response, callback);
            }
        }
    };
})(conduit.abstractionlayer));
// ENCRYPTION:
conduit.register("webappApi.encryption", (function (abs, undefined) {
    var encryption = conduit.abstractionlayer.backstage.encryption,
        handleResponse = conduit.webappApi.commons.handleResponse,
        handleException = conduit.webappApi.commons.handleException;

    var validateData = function (text, type, charset) {
        var exception = null;
        if (typeof (text) !== "string") {
            if (type !== undefined && charset !== undefined && (typeof (type) !== "string" || typeof (charset) !== "string")) {
                //TODO this is too general. refactor
                exception = new TypeError("Invalid type of parameters, expected a string.");
            }
            else {                
                exception = new TypeError("Invalid type of data, expected a string.");
            }            
        }

        return exception;
    }

    return {
        encrypt: function (data, callback) {
            var exception = validateData(data)
            if (exception) {
                return handleException(exception, callback);
            }
            var result = encryption.encrypt(data);
            handleResponse(result.result || result, callback);
        },
        decrypt: function (data, callback) {
            var exception = validateData(data)
            if (exception) {
                return handleException(exception, callback);
            }
            var result = encryption.decrypt(data);
            handleResponse(result.result || result, callback);
        },
        hash: function (data, callback) {
            var exception = validateData(data)
            if (exception) {
                return handleException(exception, callback);
            }
            var result = encryption.hash(data);
            handleResponse(result.result || result, callback);
        },
        decodeCharset: function (text, inCharset, callback) {
            encryption.decodeCharset(text, inCharset, function (data) {
                handleResponse(data, callback);
            });
        }
    };

})(conduit.abstractionlayer));
﻿// LOGGING:
conduit.register("webappApi.logging", (function (abs, undefined) {
    var whiteList = ["EMAIL_NOTIFIER"];
    /*
    [message]        - (string, mandatory) Log message.    
    [loggerInfo] - (object, optional) contains the following:
    [context]        - (object, optional) for example, {className: "TollbarSettings", functionName: "loadSettingsData"}
    [error]          - (Error)   The javascript error object. 
    [reportToServer] - (boolean) indicates if to report the error to the server using the ClientErrorLog service. default false.
    [code]           - (number)  the relevant error code.                                
    */
    function logError(message, loggerInfo) {
        var self = this;
        if (typeof (message) === 'string') {
            var scope = loggerInfo && loggerInfo.context ? loggerInfo.context : null;
            if (loggerInfo && loggerInfo.reportToServer) {
                var model = conduit.applicationLayer.appCore.appManager.model;
                var app = model.getAppById(self.appId);
                if (app.viewData && app.viewData.settingsAppType) {
                    if (whiteList.indexOf(app.viewData.settingsAppType) < 0) {
                        // the cuurent app is not allowed to report the error to the server.
                        loggerInfo.reportToServer = false;
                    }
                }
            }


            conduit.coreLibs.logger.logError(message, scope, loggerInfo);
        }
    }

    /*
    [message]        - (string, mandatory) Log message.    
    [loggerInfo] - (object, optional) contains the following:
    [context]        - (object, optional) for example, {className: "TollbarSettings", functionName: "loadSettingsData"}                   
    */
    function logDebug(message, loggerInfo) {
        if (typeof (message) === 'string') {
            var scope = loggerInfo && loggerInfo.context ? loggerInfo.context : null;
            conduit.coreLibs.logger.logDebug(message, scope);
        }
    }

    /*
    [message]        - (string, mandatory) Log message.    
    [loggerInfo] - (object, optional) contains the following:
    [context]        - (object, optional) for example, {className: "TollbarSettings", functionName: "loadSettingsData"}                   
    */
    function logInfo(message, loggerInfo) {
        if (typeof (message) === 'string') {
            var scope = loggerInfo && loggerInfo.context ? loggerInfo.context : null;
            conduit.coreLibs.logger.logInfo(message, scope);
        }
    }


    return {
        logDebug: logDebug,
        logError: logError,
        logInfo: logInfo,
        /*
        Sends usage data to Conduit's server
        */
        usage: { log: function (actionType, additionalUsageInfo) {
            var type = (additionalUsageInfo && additionalUsageInfo.usageType) ? additionalUsageInfo.usageType : "sendToolbarComponentUsage";
            var data = {
                type: type,
                appId: this.appId,
                actionType: actionType,
                additionalUsageInfo: additionalUsageInfo
            }

            conduit.webappApi.commons.updateModel({ usage: "log" }, 'sendUsage', data, function () { });

        }
        }
    };

})(conduit.abstractionlayer));
﻿// NOTIFICATIONS :
conduit.register("webappApi.notifications", (function (abs, undefined) {
    var handleResponse = conduit.webappApi.commons.handleResponse;

    return {
        showNotification: function (data, callback) {
            var model = conduit.applicationLayer.appCore.appManager.model;

            if (!model || model.getPermission(this.appId, conduit.utils.apiPermissions.consts.TYPE.INSTANT_ALERT).autorized !== true) {
                var exception = new TypeError("Permission denied (" + conduit.utils.apiPermissions.consts.TYPE.INSTANT_ALERT + ").");
                return handleException(exception, callback);
            }
            var self = this;
            if (typeof data !== 'object') return;

            var appInfo = model.getAppById(this.appId);

            var notificationObj = {
                channelId: 'API',
                channelName: data.title || "",
                channelLogo: data.icon,
                itemNotification: data.content,
                appName: appInfo.displayText,
                appLogo: appInfo.displayIcon,
                appGuid: appInfo.appGuid,
                notificationLengthSeconds: data.notificationLengthSeconds
            }

            var response = abs.commons.messages.postTopicMsg("notificationsHandler_show", this.appId, JSON.stringify(notificationObj));
            response._callbackType = 'cbSuccess';
            handleResponse(response, callback);
        },
        register: function (data, callback) {
            var self = this;
            var response = abs.commons.messages.postTopicMsg("notificationsHandler_register", this.appId, JSON.stringify(data));
            response._callbackType = 'cbSuccess';
            handleResponse(response, callback);
        }
    }
})(conduit.abstractionlayer));
// PLATFORM:
(function (abs) {
    var onFirstTimeDialogCloseListeners = [];
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
    var toolbarReady = conduit.applicationLayer.dialog.isToolbarReady();
    var commons = conduit.webappApi.commons,
            withCurrentWindow = commons.withCurrentWindow,
            handleResponse = commons.handleResponse,
            handleException = commons.handleException,
            updateModel = commons.updateModel,
            getInformationFromModel = commons.getInformationFromModel;
    conduit.register("webappApi.platform", (function () {
        var cache = {};

        function validateParams(param, paramName, callback) {

            if (typeof (callback) !== "function") {
                return new TypeError("Invalid callback function.");
            }
            if (!param) {
                return new TypeError("Parameter: <" + paramName + "> is invalid, expected non empty string.");
            }
            if (typeof (param) !== "string") {
                return new TypeError("Parameter: <" + paramName + "> is invalid, expected a string.");
            }


        }

        var apiMethods = {

            /*            
            Params:
            callback: (function) Function to call after the apps info is retrieved.
            */
            getAppsList: function (callback) {
                if (!callback)
                    return;
                getInformationFromModel(this, "getAppsList", "", function (response) {
                    handleResponse(response, callback);
                });
            },

            onToolbarReady: {
                addListener: function (callback, listenerCallback) {
                    if (toolbarReady) {
                        handleResponse([true], listenerCallback);
                    } else {
                        var response = { result: true };

                        onFirstTimeDialogCloseListeners.push(listenerCallback);
                        response._callbackType = 'cbSuccess';
                        handleResponse(response, callback);
                    }
                },

                toolbarReady: function () {
                    toolbarReady = true;
                    for (var i = 0; i < onFirstTimeDialogCloseListeners.length; i++) {
                        handleResponse([true], onFirstTimeDialogCloseListeners[i]);
                    }
                }
            },

            /*
            Allows to execute an external program (with or without additional parameters), which was pre-defined on user’s registry. This method is supported only on IE and FF and only on Microsoft Windows OS. Pre-defined registry values are explained here:  http://www.conduit.com/Developers/ExecuteExternalApp/ExecuteExternalApp.aspx 
            registeredName - The name of the pre-defined key in the user’s registry (which defines the program to launch).
            parameters - Optional parameters to use when executing the program.
            callback - callback function to indicate the execution succeeded
            */
            executeExternalProgram: function (registeredName, parameters, callback) {
                //support a sync call for Chrome and sync call for FF
                var response = conduit.abstractionlayer.backstage.business.application.execute(registeredName, parameters, function(response){
                        handleResponse(response, callback);
                    });
                if (response) {
                    handleResponse(response, callback);
                }
            },

            /*
            Gets info about an app.
            Params:
            callback: (function) Function to call after the apps info is retrieved.
            */
            getInfo: function (callback) {
                var self = this;
                if (!callback)
                    return;

                function handleGetInfo() {
                    conduit.abstractionlayer.commons.messages.sendSysReq(
						"serviceLayer",
						"webappApi.platform.getInfo",
						JSON.stringify({ service: "userApps", method: "isUserApp", data: self.appId }),
						function (result) {
						    var model = conduit.applicationLayer.appCore.appManager.model;
						    var app = model.getAppById(self.appId);
						    if (app && app.managed && app.managed.ctid) {
						        cache.toolbar.id = app.managed.ctid;
						    }

						    var appData = { appId: self.appId, isUserAdded: result === "true" };

						    if (app && app.managed && app.managed.extraData) {
						        appData.extraData = app.managed.extraData;
						    }
						    handleResponse({
						        platform: cache.environment,
						        toolbar: cache.toolbar,
						        app: appData
						    }, callback);
						}
					);
                }

                if (!cache.environment) {
                    var browserInfo = abs.commons.environment.getBrowserInfo().result,
                        osInfo = abs.commons.environment.getOSInfo().result;

                    cache.environment = {
                        browser: browserInfo.type,
                        browserVersion: browserInfo.version,
                        locale: browserInfo.locale,
                        OS: osInfo.type,
                        OSVersion: osInfo.version
                    };

                }

                conduit.coreLibs.config.getActiveData(function (activeData) {
                    with (abs.commons.context) {
                        cache.toolbar = {
                            id: activeData.activeCTID,
                            oID: getCTID().result,
                            name: activeData.activeToolbarName,
                            icon: conduit.backstage.serviceLayer.config.toolbarSettings.getAppsData()[0].displayIcon,
                            downloadUrl: getDownloadUrl().result,
                            version: abs.commons.environment.getEngineVersion().result,
                            cID: window.chrome && chrome.extension ? chrome.extension.getURL('').replace("chrome-extension://", "").replace("/undefined", "") : "",
                            locale: conduit.applicationLayer.appCore.appManager.model.getToolbarLocale()
                        };
                    }
                    handleGetInfo();
                });

            },
            getToolbarVersion: function (callback) {
                handleResponse(conduit.abstractionlayer.commons.environment.getEngineVersion().result || "", callback);
            },

            getLocation: function (callback) {
                var countryCode = abs.commons.repository.getKey(ctid + ".countryCode").result;
                if (!countryCode) {
                    countryCode = conduit.backstage.serviceLayer.configuration.getCountryCode();
                }
                handleResponse({ countryCode: countryCode }, callback);
            },

            /*
            Checks whether an app is installed in the toolbar (async)
            Params:
            [appId]: (string) the ID of the app to check. If not specified, checks the current app.
            callback: (function) A function to call with the result. Receives one parameter - isInstalled (boolean).            
            */
            isAppInstalled: function (guid, callback) {
                var exception = validateParams(guid, 'guid', callback);
                if (exception) {
                    return handleException(exception, callback);
                }

                getInformationFromModel(this, "isAppInstalled", guid, function (response) {
                    // the response is string 'true' or 'false'
                    // should be a boolean, so create a boolean out of it and wrap it as array
                    // so the handleResponse function will know how to handle this
                    var boolRes = (response === 'true');
                    handleResponse([boolRes], callback);
                });

                /*
                if (!callback)
                return;
                if (guid) {
                getInformationFromModel(this, "isAppInstalled", guid, function (response) {
                handleResponse(response, callback);
                });
                }
                else {
                response = {
                'result': false,
                'status': 555,
                'description': "invalid guid"
                };
                handleResponse(response, callback);
                }
                */
            },
            /*
            Sends a request to refresh the toolbar.
            Params:
            forceRefresh: (boolean=false) Whether settings should be downloaded from server or not
            */
            refresh: function (forceRefresh, callback) {
                //if (forceRefresh) {
                // remove all managed apps from model
                conduit.applicationLayer.appCore.appManager.model.removeManagedAppsFromModel();

                conduit.abstractionlayer.commons.messages.sendSysReq("serviceLayer",
                        "webappApi.platform.refresh",
                        JSON.stringify({ service: "toolbarSettings", method: "refresh", data: forceRefresh }),
                        function (response) {
                            response._callbackType = 'cbSuccess';
                            handleResponse(response, callback);
                        }
                     );
                //}
                //else
                //conduit.webappApi.advanced.messaging.sendRequestToModel(this, "refreshAll", refreshData, callback);
            },
            refreshApp: function (appId, callback) {
                updateModel(this, "refreshApp", { appId: appId || this.appId }, callback);
            },
            /*
            Sets an image as the toolbar's background. (async)
            Params:
            skinOptions: (object) All properties are strings: {
            background.imageUrl, background.color, splitterImageUrl, separatorImageUrl, 
            dropdownArrowImageUrl, chevronImageUrl, highlighter.activeImageUrl, highlighter.inactiveImageUrl,
            fontColor
            }
            [callback]: (function) An optional function to call after the skin's background been set to the image.
            */
            setSkin: function (skinOptions, callback) {
                if (typeof (skinOptions) !== "object") {
                    var exception = new TypeError("Invalid skinOptions for platform.setSkin, expected an object.");
                    return handleException(exception, callback);
                }

                if (skinOptions.background && skinOptions.background.imageUrl) {
                    skinOptions.background.imageUrl34px = skinOptions.background.imageUrl;
                }

                //TODO setSkin method is not implemented in the model!
                updateModel(this, "setSkin", skinOptions, callback);
            },
            search: {
                getTerm: function (callback) {
                    var model = conduit.applicationLayer.appCore.appManager.model;

                    if (!model || model.getPermission(this.appId, conduit.utils.apiPermissions.consts.TYPE.GET_SEARCH_TERM).autorized !== true) {
                        var exception = new TypeError("Permission denied (" + conduit.utils.apiPermissions.consts.TYPE.GET_SEARCH_TERM + ").");
                        return handleException(exception, callback);
                    }
                    var self = this;
                    abs.commons.messages.sendSysReq(
						"adv:searchGetTerm",
						"webAppApi.platform.search.getTerm",
						"",
						function (response) {
						    handleResponse(response, callback);
						}
					);
                },
                setSearchEngineValue: function (value, callback) {
                    var result = conduit.abstractionlayer.backstage.business.featureProtector.setSearchEngineValue(value);
                    handleResponse(result, callback);
                }
            },

            getScreenHeight: function (callback) {
                // In IE menus are limited to window size, we will give the menu the window height + top offset.
                if (this.isMenu && /IE/i.test(conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type)) {
                    conduit.abstractionlayer.commons.environment.getWindowHeight(function (response) {
                        conduit.abstractionlayer.commons.environment.getWindowOffset(function (offset) {
                            handleResponse(response.result + offset.result.top, callback);
                        });
                    });
                }
                else {
                    conduit.abstractionlayer.commons.environment.getScreenHeight(function (response) {
                        handleResponse(response.result.toString(), callback);
                    });
                }

            },
            getScreenWidth: function (callback) {
                conduit.coreLibs.UI.getScreenWidth(function (screenDimensions) {
                    handleResponse([screenDimensions.width + screenDimensions.offset], callback);
                });
            },
            openApp: function (guid, callback) {
                var data = {
                    guid: guid,
                    sender: this
                }

                conduit.webappApi.commons.updateModel({ platform: "openApp" }, 'openAppByGuid', data, function (response) {
                    handleResponse(response, callback);
                });
            },
            onChangeViewState: { addListener: function (callback, listenerCallback) {
                var response = conduit.abstractionlayer.backstage.browser.onChangeViewState.addEventListener(listenerCallback);
                response._callbackType = 'cbSuccess';
                handleResponse(response, callback);
            }
            },
            isToolbarVisible: function (callback) {
                var isToolbarVisible = conduit.abstractionlayer.backstage.browser.isHidden().result == false;
                handleResponse([isToolbarVisible], callback);
            },
            getToolbarBornDate: function (callback) {
                var bornDate = conduit.backstage.serviceLayer.commons.getToolbarBornServerTime();
                handleResponse(bornDate, callback);
            },
            getInstallDate: function (callback) {
                var installDateObj = conduit.abstractionlayer.commons.repository.getKey(ctid + ".toolbarInstallDate");
                var installDate = "";
                if (installDateObj && !installDateObj.status) {
                    installDate = installDateObj.result;
                }
                handleResponse(installDate, callback);
            }
        };

        return apiMethods;

    })());

    // Add event listeners:
    var events = [
        { path: "search.onExecuted", topic: "adv:onSearchExecuted" },
        { path: "search.onTextChanged", topic: "adv:onSearchTextChanged" }
    ];

    function prepareAddEventListener(topic) {
        return function (callback, listenerCallback) {
            if (!callback)
                return;

            if (typeof (callback) !== "function") {
                var exception = new TypeError("Invalid callback.");
                return handleException(exception, callback);
            }

            var response = abs.commons.messages.onTopicMsg.addListener(topic, listenerCallback);
            response._callbackType = 'cbSuccess';
            handleResponse(response, callback);
        };
    }

    for (var i = 0, count = events.length, currentEvent = events[i]; i < count; currentEvent = events[++i]) {
        conduit.register(
            "webappApi.platform." + currentEvent.path + ".addListener",
            prepareAddEventListener(currentEvent.topic)
        );
    }

})(conduit.abstractionlayer);

﻿// STORAGE:
(function (abs) {
    var ctid = abs.commons.context.getCTID().result,
        repository = abs.commons.repository,
        encryption = conduit.abstractionlayer.backstage.encryption,
		handleResponse = conduit.webappApi.commons.handleResponse;
    handleException = conduit.webappApi.commons.handleException;

    function getKeyPrefix(appId, isGlobal) {
        return ctid + "." + (!isGlobal ? appId + "." : "");
    }


    function registerStorage(isGlobal) {
        function registerStorageTypes(typeNamespace, typeAbsSuffix) {
            conduit.register("webappApi.storage." + (isGlobal ? "global" : "app") + "." + typeNamespace, (function (abs, undefined) {

                var validateStorageParams = function (key, callback) {
                    if (typeof (callback) !== "function") {
                        return new TypeError("Invalid callback function.");
                    }
                    if (typeof (key) !== "string") {
                        return new TypeError("key is invalid, expected a string.");
                    }
                }

                return {
                    exists: function (key, callback) {
                        var response = false;
                        if (key) {
                            var returnValue;
                            if (typeAbsSuffix == "Data") {
                                repository["get" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key,false, function (res) {
                                    returnValue = res;
                                    if (returnValue && !returnValue.status) {
                                        response = true;
                                    }
                                    handleResponse(response, callback);
                                });
                            } else {
                                returnValue = repository["get" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key);
                                if (returnValue && !returnValue.status) {
                                    response = true;

                                }
                                handleResponse(response, callback);
                            }
                        }
                        handleResponse(response, callback);

                    },
                    get: function (key, callback) {
                        var exception = validateStorageParams(key, callback);
                        if (exception) {
                            return handleException(exception, callback);
                        }
                        var data;
                        if (typeAbsSuffix == "Data") {
                            repository["get" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key, false , function (res) {
                                data = res;
                                continueFlow();
                            });
                        } else {
                            data = repository["get" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key);
                            continueFlow();
                        }

                        // if there is no status (no error code), extract the result from data object.
                        // the result is the wanted value
                        function continueFlow() {
                            if (!data.status) {
                                data = data.result;
                            }
                            handleResponse(data, callback);
                        }
                    },
                    set: function (key, value, callback) {
                        var exception = validateStorageParams(key, callback);
                        if (exception) {
                            return handleException(exception, callback);
                        }

                        if (key.toString().length > 256) {
                            var exception = new TypeError("The key name is too long to be saved (max characters = 256).");
                            return handleException(exception, callback);
                        }

                        if (typeof (value) !== "string") {
                            var exception = new TypeError("given value is invalid, expected a string.");
                            return handleException(exception, callback);
                        }

                        if (typeAbsSuffix == "Key" && value.length > 8000) {
                            var exception = new TypeError("The key value is too long to be saved (max characters = 8000).");
                            return handleException(exception, callback);
                        }
                        if (typeAbsSuffix == "Data" && value.length > 5500000) {
                            var exception = new TypeError("The file is too long to be saved (max characters = 5500000).");
                            return handleException(exception, callback);
                        }
                        var response;
                        if (typeAbsSuffix == "Data") {
                            repository["set" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key, value, false, 'overwrite', function (res) {
                                response = res;
                                handleResponse(response, callback);
                            });
                        } else {
                            response = repository["set" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key, value);
                            handleResponse(response, callback);
                        }

                        //response._callbackType = 'cbSuccess';

                    },
                    remove: function (key, callback) {
                        var exception = validateStorageParams(key, callback);
                        if (exception) {
                            return handleException(exception, callback);
                        }
                        var response;
                        if (typeAbsSuffix == "Data") {
                            repository["remove" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key, function (res) {
                                response = res;
                                handleResponse(response, callback);
                            });
                        } else {
                            response = repository["remove" + typeAbsSuffix](getKeyPrefix(this.appId, isGlobal) + key);
                            handleResponse(response, callback);
                        }

                        //response._callbackType = 'cbSuccess';
                        
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

﻿// BROWSER:
conduit.register("webappApi.browser", (function (abs, undefined) {
    var handleException = conduit.webappApi.commons.handleException;
    var absBrowser = conduit.abstractionlayer.backstage.browser;
    var handleResponse = conduit.webappApi.commons.handleResponse;

    function getNavHistory(queryObj, callback) {
        absBrowser.getNavHistory(queryObj, function (response) {
            handleResponse(response, callback);
        });
    }

    function getBookmarks(callback) {
        absBrowser.getBookmarks(function (response) {
            handleResponse(response, callback);
        });
    }

    function getExtensions(callback) {
        absBrowser.getExtensions(function (response) {
            handleResponse(response, callback);
        });
    }

    return {
        getNavHistory: getNavHistory,
        getBookmarks: getBookmarks,
        getExtensions: getExtensions
    }
})(conduit.abstractionlayer));
// TABS:
conduit.register("webappApi.tabs", (function (abs, undefined) {
    /* When a tabInfo object is returned, its structure is:
    {
    windowId: (string) The ID of the window in which the tab is.
    tabId: (string) The ID of the tab.
    url: (string) The url of the current document in the tab.
    title: (string) The title of the current document in the tab.
    selected: (boolean) Whether the tab is currently focused.
    index: (number) The index of the tab in the window.
    }
    */

    var withCurrentWindow = conduit.webappApi.commons.withCurrentWindow,
        absTabs = conduit.abstractionlayer.backstage.tabs,
        handleResponse = conduit.webappApi.commons.handleResponse,
        handleException = conduit.webappApi.commons.handleException,
        absMsg = conduit.abstractionlayer.commons.messages,
        managedAppsMap = new HashMap(), //TODO replace with json
        managedEvents = ['onDocumentComplete', 'onNavigateComplete'],
        managerInjected = {};
    var injectingManager = {};
    var injectionQueue = {};

    absTabs.onDocumentComplete.addListener(function (tabInfo, isMainFrame) {
        if (isMainFrame !== false) {
            injectManager.inject(tabInfo.tabId, function () {
            });
        }
    });

    absTabs.onBeforeNavigate.addListener(function (tabInfo) {
        delete managerInjected[tabInfo.tabId];
        delete injectingManager[tabInfo.tabId];
        delete injectionQueue[tabInfo.tabId];
    });

    function withWindow(windowId, callback) {
        if (typeof (windowId) === "function") {
            callback = windowId;
            windowId = null;
        }

        if (windowId)
            callback(windowId);
        else {
            withLastWindow(callback);
        }
    }

    function navigateTab(tabId, updateProperties, postParams, callback) {
        if (typeof (tabId) !== "string") {
            if (tabId && typeof (tabId) === "object") {
                callback = updateProperties;
                updateProperties = tabId;
                tabId = undefined;
            }
            else if (!!tabId) {
                var exception = new TypeError("Invalid tabId. Expected either string or a non-value.");
                return handleException(exception, callback);
            }
        }

        if (postParams) {
            if (typeof (postParams) === "object") {
                postParams = JSON.stringify(postParams);
            }
        }

        updateProperties = updateProperties || {};

        function doUpdate() {
            absTabs.navigate(null, tabId, conduit.webappApi.commons.replaceUrlAliases(updateProperties.url), postParams, callback);
        }

        if (tabId)
            doUpdate();
        else {
            withCurrentWindow(function (windowId) {
                absTabs.getSelected(windowId, function (response) {
                    tabId = String(response.result.tabId);
                    doUpdate();
                });
            }, callback);
        }
    }

    function backToPage(data) {
        var dataStr = JSON.stringify({ topic: data.topic, data: data.userData });
        absTabs.executeScript(null, String(data.tabId), "conduitPage.managerCallback(" + dataStr + ")", false, false, false, function () { });
    }

    absMsg.onSysReq.addListener("webAppApiInjectManager", function (data, sender, callback) {
        backToPage(JSON.parse(data));
    });
    var injectManager = (function () {
        var listenersObj = {};

        function managerCallback(dataFromPage, tabId) {
            dataFromPageObj = JSON.parse(dataFromPage);
            if (dataFromPageObj.type === "callback") {
                replayCallback({ topic: dataFromPageObj.topic, data: dataFromPageObj.data });
            }
            else {
                var contextData = { topic: dataFromPageObj.topic, userData: dataFromPageObj.data, tabId: tabId };
                absMsg.postTopicMsg(dataFromPageObj.topic, "webAppApi", JSON.stringify(contextData));
            }

        }

        function replayCallback(dataToApp) {
            listenersObj[dataToApp.topic](dataToApp.data);
            delete listenersObj[dataToApp.topic];
        }

        function addCallback(topic, callback) {
            listenersObj[topic] = callback;
        }

        function releaseInjectionQueue(tabId) {
            if (injectionQueue[tabId]) {
                while (injectionQueue[tabId].length > 0) {
                    var cb = injectionQueue[tabId].shift();
                    cb();
                }
            }
        }


        function inject(tabId, callback) {
            if (injectingManager[tabId]) {
                if (!injectionQueue[tabId]) {
                    injectionQueue[tabId] = [];
                }
                injectionQueue[tabId].push(callback);
            } 
            else {
                injectingManager[tabId] = true;
                /* IMPORTANT  a readable version of this code is in tabs.pageManager.js ANY change in the following string should be applyed to the file as well */
                var managerStr = 'if (!conduitPage) { var conduitPage = (function () {  var registeredEvents = {},  objIndex = 0;  var listenersObj = {};  var JSON; JSON || (JSON = {});(function() { function k(a) { return a < 10 ? \"0\" + a : a } function o(a) { p.lastIndex = 0; return p.test(a) ? \'\"\' + a.replace(p, function(a) { var c = r[a]; return typeof c === \"string\" ? c : \"\\\\u\" + (\"0000\" + a.charCodeAt(0).toString(16)).slice(-4) }) + \'\"\' : \'\"\' + a + \'\"\' } function l(a, j) { var c, d, h, m, g = e, f, b = j[a]; b && typeof b === \"object\" && typeof b.toJSON === \"function\" && (b = b.toJSON(a)); typeof i === \"function\" && (b = i.call(j, a, b)); switch (typeof b) {  case \"string\": return o(b); case \"number\": return isFinite(b) ? String(b) : \"null\"; case \"boolean\": case \"null\": return String(b); case \"object\": if (!b) return \"null\";  e += n; f = []; if (Object.prototype.toString.apply(b) === \"[object Array]\") { m = b.length; for (c = 0; c < m; c += 1) f[c] = l(c, b) || \"null\"; h = f.length === 0 ? \"[]\" : e ? \"[\\n\" + e + f.join(\",\\n\" + e) + \"\\n\" + g + \"]\" : \"[\" + f.join(\",\") + \"]\"; e = g; return h } if (i && typeof i === \"object\") { m = i.length; for (c = 0; c < m; c += 1) typeof i[c] === \"string\" && (d = i[c], (h = l(d, b)) && f.push(o(d) + (e ? \": \" : \":\") + h)) } else for (d in b) Object.prototype.hasOwnProperty.call(b, d) && (h = l(d, b)) && f.push(o(d) + (e ? \": \" : \":\") + h); h = f.length === 0 ? \"{}\" : e ? \"{\\n\" + e + f.join(\",\\n\" + e) + \"\\n\" + g + \"}\" : \"{\" + f.join(\",\") +\"}\"; e = g; return h } } if (typeof Date.prototype.toJSON !== \"function\") Date.prototype.toJSON = function() { return isFinite(this.valueOf()) ? this.getUTCFullYear() + \"-\" + k(this.getUTCMonth() + 1) + \"-\" + k(this.getUTCDate()) + \"T\" + k(this.getUTCHours()) + \":\" + k(this.getUTCMinutes()) + \":\" + k(this.getUTCSeconds()) + \"Z\" : null }, String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function() { return this.valueOf() }; var q = /[\\u0000\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g,p = /[\\\\\\\"\\x00-\\x1f\\x7f-\\x9f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g, e, n, r = { \"\\u0008\": \"\\\\b\", \"\\t\": \"\\\\t\", \"\\n\": \"\\\\n\", \"\\u000c\": \"\\\\f\", \"\\r\": \"\\\\r\", \'\"\': \'\\\\\"\', \"\\\\\": \"\\\\\\\\\" }, i; if (typeof JSON.stringify !== \"function\") JSON.stringify = function(a, j, c) { var d; n = e = \"\"; if (typeof c === \"number\") for (d = 0; d < c; d += 1) n += \" \"; else typeof c === \"string\" && (n = c); if ((i = j) && typeof j !== \"function\" && (typeof j !== \"object\" || typeof j.length !== \"number\")) throw Error(\"JSON.stringify\"); return l(\"\",{ \"\": a })}; if (typeof JSON.parse !== \"function\") JSON.parse = function(a, e) { function c(a, d) { var g, f, b = a[d]; if (b && typeof b === \"object\") for (g in b) Object.prototype.hasOwnProperty.call(b, g) && (f = c(b, g), f !== void 0 ? b[g] = f : delete b[g]); return e.call(a, d, b) } var d, a = String(a); q.lastIndex = 0; q.test(a) && (a = a.replace(q, function(a) { return \"\\\\u\" + (\"0000\" + a.charCodeAt(0).toString(16)).slice(-4) })); if (/^[\\],:{}\\s]*$/.test(a.replace(/\\\\(?:[\"\\\\\\/bfnrt]|u[0-9a-fA-F]{4})/g, \"@\").replace(/\"[^\"\\\\\\n\\r]*\"|true|false|null|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?/g,\"]\").replace(/(?:^|:|,)(?:\\s*\\[)+/g, \"\"))) return d = eval(\"(\" + a + \")\"), typeof e === \"function\" ? c({ \"\": d }, \"\") : d; throw new SyntaxError(\"JSON.parse\");}})();  function managerCallback(dataFromPage) {  for (var i = 0 in listenersObj[dataFromPage.topic]) {   listenersObj[dataFromPage.topic][i](dataFromPage.data);   delete listenersObj[dataFromPage.topic][i];  }  }  function addCallback(topic, callback) {  if (!listenersObj[topic]) {   listenersObj[topic] = [];  }  listenersObj[topic].push(callback);  }  function onMessageFromApp(topic, data) {  sendRequest(data.ctid, null, topic, data.userData, function () { }, true, data.cbId);  }  this.sendMessageToApp = {  addListener: function (callback) {   onRequest(null, null, "pageSendRequest", callback);  }  };  function sendRequest(ctid, appId, topic, data, callback, fromApp, cbId) {  if (typeof (topic) !== "string" ) {   return { errorMessage: "Invalid topic, expected a string.", errorCode: 100 };  }  if (typeof (data) !== "string") {   return { errorMessage: "Invalid data, expected a string.", errorCode: 100 };  }  if (appId) topic = ctid + "_" + appId + "_tabs_" + topic;  if (!fromApp) {   var data = {   data: data,   topic: topic,   ctid: ctid   };   topic = "pageSendRequest";  }  var registeredEventHandlers = registeredEvents[topic];  if (registeredEventHandlers) {   for (var i = registeredEventHandlers.length - 1; i >= 0; i--) {   try {    if (callback && !fromApp) {    addCallback(data.topic, callback);    }    registeredEventHandlers[i].handler.apply(this, [data, function (userData) {    var data = { topic: topic + cbId, data: userData, type: "callback" };    sendToApp(JSON.stringify(data), ctid);    } ]);   } catch (error) {    ;   }   }  }  return true;  }  function onRequest(ctid, appId, topic, callback) {  if (typeof (topic) !== "string") {   return { errorMessage: "Invalid topic, expected a string.", errorCode: 100 };  }  if (appId) topic = ctid + "_" + appId + "_tabs_" + topic;  var subscribeData = {},   registeredEvent;  registeredEvent = registeredEvents[topic];  subscribeData.handler = callback;  if (!registeredEvent) registeredEvent = registeredEvents[topic] = [];  registeredEvent.push(subscribeData);  return true;  }  sendMessageToApp.addListener(function (data) {  sendToApp(JSON.stringify(data), data.ctid);  });  return {  onMessageFromApp: onMessageFromApp,  sendRequest: sendRequest,  onRequest: { addListener: onRequest },  managerCallback: managerCallback,  JSON: JSON  }; })(); }';

                absTabs.injectCommunicator(null, String(tabId), "sendToApp", function (data) { managerCallback(data, tabId) }, function () {
                    absTabs.executeScript(null, String(tabId), "function EBCallBackMessageReceived(data, args) { conduitPage.sendRequest(data.ctid, data.appId, data.topic, args);} " + managerStr, false, false, false, function () {
                        callback && callback();
                        releaseInjectionQueue(tabId);
                        managerInjected[tabId] = true;
                        injectingManager[tabId] = false;
                    });
                });
            }
        }

        return {
            inject: inject,
            addCallback: addCallback
        }
    })();

    function validateStringParam(param, paramName) {
        if (param && typeof (param) !== "string") {
            return new TypeError("Invalid " + paramName + ", expected a string.");
        }
    }

    var apiMethods = {
        /*
        Creates a new tab
        Params: e (object): {
        [index]: (number) The position of the newly created tab in the tabs order.
        [isSelected=true]: (boolean) Whether the tab is to be focused on creation.
        [url]: (string) The URL to navigate to in the new tab.
        [windowId]: (string) The ID of the window in which to create the tab. Must be an existing window!
        [onCreate]: (function) A function to call after the tab's been created. Receives one parameter - tabInfo (object).
        [onError]: (function) A function to call if an error occured and the tab hasn't been created. Receives one parameter - error description. Use 'this' for more info.
        }
        */
        create: function (e, callback) {
            e = e || {};
            if (e.windowId && typeof (e.windowId) !== "string") {
                var exception = new TypeError("Invalid type for tab windowId, expected a string.");
                return handleException(exception, callback);
            }

            if (e.isSelected !== undefined) {
                if (typeof (e.isSelected) !== "boolean")
                    e.isSelected = !!e.isSelected;
            }
            else
                e.isSelected = true;

            function doCreate() {
                absTabs.create(conduit.webappApi.commons.replaceUrlAliases(e.url), e.windowId || null, e.isSelected, function (response) {
                    handleResponse(response, callback || e.onCreate);
                });
            }

            if (e.windowId)
                doCreate();
            else
                withCurrentWindow(function (windowId) { e.windowId = windowId; doCreate(); }, callback);
        },
        /*
        Injects Javascript code or a reference to a .js file into a tab's HTML content.
        Params:
        [tabId]: (string) The ID of the tab to execute script in. If not specified, use the current tab.
        details: (object) Contains the JS code or file URL to insert. Possible properties: { code: (string), file: (string), allFrames: (boolean=false) }. "code" takes precedence over file. allFrames specifies whether the JS should be injected into all frames in the specified tab.
        [onExecute]: (function) An optional function to call after the JS's been injected into the tab.
        [onError]: (function) An optional function to call if the JS couldn't be injected. Receives one parameter - error description. Use 'this' for more info.
        */
        executeScript: function (tabId, details, callback) { 
            if (!details || (!details.code && !details.file))
                return;
            var model = conduit.applicationLayer.appCore.appManager.model;

            if (!details.injectToolbarApiMessage || !/EBonMessageReceived/.test(details.code)) {
                if (!model || model.getPermission(this.appId, conduit.utils.apiPermissions.consts.TYPE.JS_INJECTION).autorized !== true) {
                    var exception = new TypeError("Permission denied (" + conduit.utils.apiPermissions.consts.TYPE.JS_INJECTION + ").");
                    return handleException(exception, callback);
                }
            }

            if (tabId && typeof (tabId) !== "string") {
                var exception = new TypeError("Invalid tabId, expected a string.");
                return handleException(exception, callback);
            }

            var self = this;
            var ctid = conduit.abstractionlayer.commons.context.getCTID().result;

            function doExecute() {
                var code;

                if (details.file) {
                    //read the file
                }
                
                code = details.code.replace(/conduitPage.onRequest.addListener\(/g, "conduitPage.onRequest.addListener('" + ctid + "', '" + self.appId + "',");
                code = code.replace(/conduitPage.sendRequest\(/g, "conduitPage.sendRequest('" + ctid + "', '" + self.appId + "',");
              
                if(/function[ ]*EBCallBackMessageReceived/.test(code))//this code is for EBCallBackMessageReceived declaration - ignore it
                {
                    return;
                }   
                if(/EBCallBackMessageReceived\(\)/g.test(code)){ //if calling this function without arguments
                    code = code.replace(/EBCallBackMessageReceived\(/g, "EBCallBackMessageReceived({ ctid : '" + ctid + "', appId : '" + self.appId + "', topic : " + details.topic + "'}");            
                }
                else{
                    code = code.replace(/EBCallBackMessageReceived\(/g, "EBCallBackMessageReceived({ ctid : '" + ctid + "', appId : '" + self.appId + "', topic : '" + details.topic + "'},"); 
                }
                absTabs.executeScript(null, String(tabId), code, false, !!details.allFrames, false, function (response) {
                    response._callbackType = 'cbSuccess';
                    handleResponse(response, callback);
                });
                // for MAM
                var app = model.getAppById(self.appId);
                if (app && app.appGuid) {
                    conduit.webappApi.advanced.managed.apps.onWebAppInjection.appInjected(app.appGuid);
                }
            }
            function getTab() {
                conduit.abstractionlayer.backstage.tabs.get(null, String(tabId), function (response) {
                    var currentTab = response.result || response;
                    var isHttps = currentTab && currentTab.url && (currentTab.url.indexOf('https') == 0); //should be location.protocol

                    if (isHttps && (!model || model.getPermission(self.appId, conduit.utils.apiPermissions.consts.TYPE.SSL_GRANTED).autorized !== true)) {
                        var exception = new TypeError("Permission denied (" + conduit.utils.apiPermissions.consts.TYPE.SSL_GRANTED + ").");
                        return handleException(exception, callback);
                    }
                    if (!managerInjected[tabId]) {
                        injectManager.inject(tabId, function () {
                            doExecute();
                        });
                    }
                    else {
                        doExecute();
                    }
                });
            }
            if (tabId) {
                getTab();
            } else {
                conduit.webappApi.commons.withCurrentTab(function (tabInfo) {
                    tabId = tabInfo.tabId;
                    getTab();
                });
            }
        },

        /*
        Gets information for a tab (async)
        Params:
        [tabId]: (string) The ID of the tab whose information to get. If not specified, uses the focused tab.
        callback: (function) An optional function to call after the tab's info's been received. Receives one parameter - tabInfo (object).
        [onError]: (function) A function to call if an error occured and the tab's info couldn't be retrieved. Receives one parameter - error description. Use 'this' for more info.
        */
        get: function (tabId, callback) {
            var appId = this.appId;

            if (typeof (tabId) === "function") {

                callback = arguments[0];
                tabId = undefined;
            }

            if (!callback)
                return;

            if (tabId && typeof (tabId) !== "string") {
                var exception = new TypeError("Invalid tabId, expected a string.");
                return handleException(exception, callback);
            }

            // TODO: talk to Alon about the String(tabId) fix. Need to change this to tabId validation
            // (if not null and not string, return error). We need to understand from where the tabId
            // comes as int (is it application bug or that the app send int)

            function doGet(tabId) {
                absTabs.get(null, String(tabId), function (response) {
                    var tabInfo = response;
                    var model = conduit.applicationLayer.appCore.appManager.model;

                    if (!model || model.getPermission(appId, conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_TITLE).autorized !== true) {
                        if (tabInfo && (tabInfo.title || tabInfo.title == "")) {
                            delete tabInfo.title;
                        }
                    }
                    if (!model || model.getPermission(appId, conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_URL).autorized !== true) {
                        if (tabInfo && (tabInfo.url || tabInfo.url == "")) {
                            delete tabInfo.url;
                        }
                    }
                    handleResponse(tabInfo, callback);
                });
            }

            if (tabId)
                doGet(tabId);
            else {
                conduit.webappApi.commons.withCurrentTab(function (tabInfo) {
                    doGet(tabInfo.tabId);
                });
            }
        },
        /*
        Gets an array of tabInfo objects for all tabs in a window (async)
        [windowId]: (number) The ID of the window that contains the tabs to get. If not specified (or ""/false/undefined/null), the last focused window is used.
        [onGet]: (function) An optional function to call after the tabs' info's been received. Receives one parameter - tabsInfo (array).
        [onError]: (function) A function to call if an error occured and the tabs' info couldn't be retrieved. Receives one parameter - error description. Use 'this' for more info.
        */
        getAllInWindow: function (windowId, callback) {
            if (windowId && typeof (windowId) !== "string") {
                var exception = new TypeError("Invalid value for windowId, expected a string.");
                return handleException(exception, callback);
            }

            function doGet(windowId) {
                absTabs.getAllInWindow(windowId, function (response) {
                    handleResponse(response, callback);
                });
            }

            if (windowId)
                doGet(windowId);
            else
                withCurrentWindow(doGet, callback);
        },
        /*
        Gets info for the focused tab in a window (async)
        Params:
        [windowId]: (number) The ID of the window from which to get the focused tab. If not specified (or ""/false/undefined/null), the last focused window is used.
        [callback]: (function) An optional function to call after the tab's info's been received. Receives one parameter - tabInfo (object).
        [onError]: (function) A function to call if an error occured and the tab's info couldn't be retrieved. Receives one parameter - error description. Use 'this' for more info.
        */
        getSelected: function (windowId, callback) {
            var appId = this.appId;

            if (typeof (windowId) === "function") {

                callback = arguments[0];
                windowId = undefined;
            }

            if (windowId && typeof (windowId) !== "string") {
                var exception = new TypeError("Invalid value for windowId, expected a string.");
                return handleException(exception, callback);
            }

            conduit.webappApi.commons.withCurrentTab(function (tabInfo) {
                var tabId = tabInfo.tabId + ""; // convert to string - roee ovadia 16.1.12

                absTabs.get(windowId, tabId, function (response) {
                    response = response.result || response; //TODO: remove after chrome fix their bug
                    var model = conduit.applicationLayer.appCore.appManager.model;

                    if (!model || model.getPermission(appId, conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_TITLE).autorized !== true) {
                        if (response && (response.title || response.title == "")) {
                            delete response.title;
                        }
                    }
                    if (!model || model.getPermission(appId, conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_URL).autorized !== true) {
                        if (response && (response.url || response.url == "")) {
                            delete response.url;
                        }
                    }
                    handleResponse(response, callback);
                });
            });
        },
        /*
        Inserts style or a reference to a CSS file into a tab
        Params:
        tabId: (string) The ID of the tab to insert CSS into.
        cssData: (object) Contains the CSS or file URL to insert. Possible properties: { code: (string), file: (string), allFrames: (boolean=false) }. "code" takes precedence over filel. allFrames specified whether the css should be injected into all frames in the specified tab.
        [onInject]: (function) An optional function to call after the CSS's been injected into the tab.
        [onError]: (function) An optional function to call if the CSS couldn't be injected. Receives one parameter - error description. Use 'this' for more info.
        */
        insertCss: function (tabId, cssData, callback) {
            if (!cssData || (!cssData.code && !cssData.file))
                return;

            var isUrl = !cssData.code;

            function doInsert(tabId) {
                absTabs.injectCSS(null, String(tabId), cssData.code || cssData.file, isUrl, !!cssData.allFrames, function (response) {
                    response._callbackType = 'cbSuccess';
                    handleResponse(response, callback);
                });
            }

            if (tabId)
                doInsert(tabId);
            else {
                conduit.webappApi.commons.withCurrentTab(function (tabInfo) {
                    doInsert(tabInfo.tabId);
                });
            }
        },
        /*
        Closes a tab
        Params:
        [tabId]: (string) The ID of the tab to remove. If not specified, the current tab is closed.
        [onRemove]: (function) An optional function to call after the tab's been removed.
        [onError]: (function) A function to call if an error occured and the tab hasn't been removed. Receives one parameter - error description. Use 'this' for more info.
        */
        remove: function (tabId, callback) {
            if (typeof (tabId) !== "string") {
                if (typeof (tabId) === "function") {
                    onRemove = arguments[0];
                    tabId = undefined;
                }
                else if (!!tabId) {
                    var exception = new TypeError("Invalid tabId. Expected either string or a non-value.");
                    return handleException(exception, callback);
                }
            }

            function doRemove() {
                absTabs.remove(null, String(tabId), function (response) {
                    response._callbackType = 'cbSuccess';
                    handleResponse(response, callback);
                });
            }

            if (tabId)
                doRemove();
            else {
                conduit.webappApi.commons.withCurrentTab(function (tabInfo) {
                    tabId = tabInfo.tabId;
                    doRemove();
                });
            }
        },

        sendRequest: function (tabId, topic, data, callback) {
            var exception = validateStringParam(tabId, "tabId") || validateStringParam(topic, "topic")
                || validateStringParam(data, "data");

            if (exception) {
                return handleException(exception, callback);
            }

            var self = this;
            function doSendReq() {
                var cbId;
                var ctid = conduit.abstractionlayer.commons.context.getCTID().result;

                if (callback) {
                    cbId = conduit.abstractionlayer.backstage.guid.generate().result;
                    injectManager.addCallback(ctid + "_" + self.appId + "_tabs_" + topic + cbId, callback);
                }
                var code = "conduitPage.onMessageFromApp('" + ctid + "_" + self.appId + "_tabs_" + topic + "'," + JSON.stringify({ userData: data, cbId: cbId, ctid: ctid }) + ");";
                absTabs.executeScript(null, String(tabId), code, false, false, false, function (response) {
                    response._callbackType = 'cbSuccess';
                    handleResponse(response, callback);
                });
            }

            if (tabId)
                doSendReq();
            else
                conduit.webappApi.commons.withCurrentTab(function (tabInfo) {
                    tabId = tabInfo.tabId;
                    doSendReq();
                });


        },


        /*
        Updates a tab - changes URL or brings the tab into focus
        Params:
        tabId: (string) The ID of the tab to remove.
        updateProperties: (object) The properties to update. { url: (string), selected: (boolean }
        [onUpdate]: (function) A function to call after the tab's been updated. If nothing's been changed, the function isn't called.
        [onError]: (function) A function to call if an error occured and the tab hasn't been updated. Receives one parameter - error description. Use 'this' for more info.
        */
        update: function (tabId, updateProperties, callback) {
            navigateTab(tabId, updateProperties, "", function (data) { handleResponse(data, callback) });
        },
        /*
        Updates a tab - changes URL or brings the tab into focus
        Params:
        tabId: (string) The ID of the tab to remove.
        updateProperties: (object) The properties to update. { url: (string), selected: (boolean }
        postParams:
        [onUpdate]: (function) A function to call after the tab's been updated. If nothing's been changed, the function isn't called.
        [onError]: (function) A function to call if an error occured and the tab hasn't been updated. Receives one parameter - error description. Use 'this' for more info.
        */
        updateWithPost: function (tabId, updateProperties, postParams, callback) {
            navigateTab(tabId, updateProperties, postParams, function (data) { handleResponse(data, callback) });
        },

        triggerEvent: function (appGuid, info, callback) {
            // delegate the event to the managed webapp by recreating it in the desired format.
            // call the stored listenerCallback function from a map according to appGuid and event type in conduit.tabs object

            if (managedAppsMap.Contains(appGuid)) {
                var listenersObj = managedAppsMap.GetByID(appGuid);
                var eventType = /DocumentComplete/.test(info.eventType) ? 'onDocumentComplete' : /onNavigateComplete/.test(info.eventType) ? 'onNavigateComplete' : null;
                if (!eventType) {
                    var exception = new TypeError("Unsupported event type: " + info.eventType);
                    return handleException(exception, callback);
                }

                if (listenersObj && listenersObj[eventType]) {
                    var listenersArr = listenersObj[eventType];
                    if (listenersArr && listenersArr.length > 0) {
                        var eventData = info.eventData;
                        var tabInfo = { tabId: eventData.tabId, url: eventData.url };
                        var postData = eventData.postData;
                        for (var i = 0; i < listenersArr.length; i++) {
                            appCallback = listenersArr[i];
                            switch (eventType) {
                                case "onDocumentComplete":
                                    handleResponse([tabInfo, true], appCallback);
                                    break;
                                case "onNavigateComplete":
                                    handleResponse([tabInfo, postData, true], appCallback);
                                    break;
                            }
                        }
                    }
                }
            }
            handleResponse("", callback);
        } // end function
    },
    eventHandlers = {
        onBeforeNavigate: "onBeforeNavigate",
        onCreated: "onTabCreated",
        onDocumentComplete: "onDocumentComplete",
        onRemoved: "onTabClosed",
        onSelectionChanged: "onTabActivated",
        onNavigateComplete: "onNavigateComplete",
        onNavigateError: "onNavigateError"
    };

    function setResponseData(appId, name, params) {
        var model = conduit.applicationLayer.appCore.appManager.model;

        switch (name) {
            case "onNavigateComplete":
                var isHttps = params[0].url.indexOf('https') == 0; //should be location.protocol

                if (isHttps && (!model || model.getPermission(appId, conduit.utils.apiPermissions.consts.TYPE.SSL_GRANTED).autorized !== true)) {
                    params = params.splice(0, 2);
                } //DO NOT ADD BREAK;
            case "onBeforeNavigate":
            case "onTabCreated":
            case "onDocumentComplete":
                if (!model || model.getPermission(appId, conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_TITLE).autorized !== true) {
                    if (params[0] && (params[0].title || params[0].title == "")) {
                        delete params[0].title;
                    }
                }
                if (!model || model.getPermission(appId, conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_URL).autorized !== true) {
                    if (params[0] && (params[0].url || params[0].url == "")) {
                        delete params[0].url;
                    }
                }
                break;
        }
        return params;
    }

    function createAddListener(name) {
        apiMethods[name] = {
            addListener: function (callback, listenerCallback) {
                var appId = this.appId;
                var appGuid;
                if (!callback || typeof (callback) !== "function") {
                    var exception = new TypeError("Invalid callback for the tabs." + name + ".addListener method, expected a function.");
                    return handleException(exception, callback);
                }

                if (managedEvents.indexOf(name) > -1) {
                    // this event can be blocked by a managed app
                    var model = conduit.applicationLayer.appCore.appManager.model;
                    var app = model.getAppById(appId);

                    if (app && app.managed && app.managed.blockEvents && app.appGuid) {
                        appGuid = app.appGuid;
                        var listenerWrapper = managedAppsMap.GetByID(appGuid); //TODO replace map with object per event type!!
                        var listenersArr;
                        if (!listenerWrapper) {
                            listenersArr = [];
                            listenerWrapper = {};
                            listenerWrapper[name] = listenersArr;
                            managedAppsMap.Add(appGuid, listenerWrapper);
                        }
                        listenersArr = listenerWrapper[name];
                        if (!listenersArr) {
                            listenersArr = [];
                            listenerWrapper[name] = listenersArr;
                        }
                        listenersArr.push(listenerCallback);
                    }
                }


                var response = absTabs[eventHandlers[name]].addListener(function () {//signture changed - n arguments support added (more than one argument).
                    if (appGuid && managedAppsMap.Contains(appGuid)) {
                        var listenerWrapper = managedAppsMap.GetByID(appGuid);
                        if (listenerWrapper[name]) {
                            // we will block events for managed apps in this map
                            return;
                        }
                    }

                    var paramArr = [];

                    if (arguments.length > 1) {
                        for (var i = 0; i < arguments.length; i++) {
                            paramArr[i] = arguments[i];
                        }
                    } else {
                        paramArr[0] = arguments[0];
                    }
                    handleResponse(setResponseData(appId, eventHandlers[name], paramArr), listenerCallback);
                });
                response._callbackType = 'cbSuccess';
                handleResponse(response, callback);
            }
        };
    }

    for (eventHandler in eventHandlers) {
        createAddListener(eventHandler);
    }

    return apiMethods;
})(conduit.abstractionlayer));

// WINDOWS:
conduit.register("webappApi.windows", (function (abs, undefined) {
    /* When a windowInfo object is returned, its structure is:
    {
    windowId: (string) The ID of the window.
    position: (object) { left: (number), top: (number) } The position of the window on the screen.
    dimensions: (object) { width: (number), height: (number) } The size of the window.
    url: (string) The url used to create the window.
    type: (string) "normal"/"popup".
    focused: (boolean) Whether the window is the currenly focused one.
    [tabs]: (array) Array of tabInfo objects that represent all tabs in the window. See tabs documentation.
    }
    */

    var handleException = conduit.webappApi.commons.handleException;

    function getLastFocused(callback) {
        if (!callback || typeof (callback) !== "function") {
            var exception = new TypeError("Invalid callback, expected a function.");
            return handleException(exception, callback);
        }

        absWindows.getLastFocused(function (response) {
            var focusedWindowId = undefined;
            if (response.result && response.result.windowId) {
                focusedWindowId = response.result.windowId;
            }
            handleResponse(response, callback, focusedWindowId);
        });
    }

    // The abstraction layer returns a different structure than what I need:
    function mapWindowInfo(original, focusedWindowId) {
        var focused = focusedWindowId && (original.windowId == focusedWindowId) ? true : false;
        return {
            windowId: original.windowId,
            position: { left: original.left, top: original.top },
            dimensions: { width: original.width, height: original.height },
            url: original.url,
            type: original.type,
            tabs: original.tabs,
            focused: focused
        };
    }

    function handleResponse(response, callback, focusedWindowId) {
        if (response.status) {
            if (callback)
                callback(JSON.stringify({ errorMessage: response.description, errorStatusCode: response.status }));
        }
        else if (callback) {
            var data;
            if (response && typeof (response) === "object" && response.result) {
                if (response._callbackType && response._callbackType == 'cbSuccess') {
                    // in case we Succeeded to add a listener
                    callback(JSON.stringify(response));
                    return;
                }
                else {
                    if (typeof (response.result) === "object") {
                        if (response.result.windows && response.result.windows[0].windowId !== undefined) {
                            data = [];
                            for (var i = 0, count = response.result.windows.length; i < count; i++) {
                                data.push(mapWindowInfo(response.result.windows[i], focusedWindowId));
                            }
                        }
                        else if (response.result.windowId !== undefined) {
                            data = mapWindowInfo(response.result, focusedWindowId);
                        }
                    }
                }
            }
            // must stringify the response since abstraction layer cannot pass objects, only strings
            var resp = data || response.result || response
            callback(JSON.stringify(resp));
        }
    }

    var absWindows = conduit.abstractionlayer.backstage.windows;

    return {
        /*
        Creates a new window
        Params: e (object): {
        [url]: (string) The URL to navigate to in the new tab.
        [position]: (object) { left: (number), top: (number) } The position of the window on the screen.
        [dimensions]: (object) { width: (number), height: (number) } The size of the window.
        [callback]: (function) A function to call after the window's been created. Receives one parameter - windowInfo (object).
        }
        */
        create: function (e, callback) {
            e = e || {};

            if (e.url && typeof (e.url) !== "string") {
                var exception = new TypeError("Invalid type for window URL, should be string.");
                return handleException(exception, callback);
            }

            if (e.position) {
                var left = e.position.left,
                    top = e.position.top;
            }
            if (e.dimensions) {
                var width = e.dimensions.width,
                    height = e.dimensions.height;
            }

            absWindows.create(conduit.webappApi.commons.replaceUrlAliases(e.url), left || 0, top || 0, width || screen.width, height || screen.height, function (response) {
                handleResponse(response, callback);
            });
        },
        /*
        TODO change this documentation
        Gets information for a window (async)
        Params:
        windowId: (string) The ID of the window whose information to get.
        [onGet]: (function) An optional function to call after the window's info's been received. Receives one parameter - windowInfo (object).
        [onError]: (function) A function to call if an error occured and the window's info couldn't be retrieved. Receives one parameter - error description. Use 'this' for more info.
        */
        get: function (windowId, callback) {
            if (typeof (windowId) === "function") {
                // meaning windowId is actually the callback
                windowId = undefined;
                getLastFocused(windowId);
            }
            else if (!windowId && typeof (callback) === "function") {
                // meaning windowId is undefined
                getLastFocused(callback);
            }
            else {
                if (typeof (windowId) !== "string") {
                    var exception = new TypeError("Invalid windowId, expected a string.");
                    return handleException(exception, callback);
                }

                absWindows.getLastFocused(function (response) {
                    // in order to supply the focused parameter to the response we must invoke a call to getLastFocused, to get the focused windowId.	
                    var focusedWindowId = undefined;
                    if (response.result && response.result.windowId) {
                        focusedWindowId = response.result.windowId;
                    }

                    absWindows.get(windowId, function (response) {
                        handleResponse(response, callback, focusedWindowId);
                    });
                });
            }
        },
        /*
        Gets an array of windowInfo objects that represent all the windows
        [options]: (object) Optional parameter with options for the info retrieved. Currently can have only one property - populate (boolean), if set to true, each windowInfo will have a tabs property.
        */
        getAll: function (options, callback) {
            if (typeof (options) === "function") {
                callback = options;
                options = undefined;
            }

            absWindows.getLastFocused(function (response) {
                // in order to supply the focused parameter to the response we must invoke a call to getLastFocused, to get the focused windowId.	
                var focusedWindowId = undefined;
                if (response.result && response.result.windowId) {
                    focusedWindowId = response.result.windowId;
                }

                absWindows.getAll(options ? !!options.populate : false, function (response) {
                    handleResponse(response, callback, focusedWindowId);
                });
            });
        },
        /*
        Gets info for the last focused window in a window.
        Params:
        [onGet]: (function) An optional function to call after the window's info's been received. Receives one parameter - windowInfo (object).
        */
        getLastFocused: function (callback) {
            getLastFocused(callback);
        },
        /*
        Closes a window
        Params:
        windowId: (string) The ID of the window to remove.
        [onRemove]: (function) An optional function to call after the window's been removed.
        [onError]: (function) A function to call if an error occured and the window hasn't been removed. Receives one parameter - error description. Use 'this' for more info.
        */
        remove: function (windowId, callback) {
            if (typeof (windowId) !== "string") {
                var exception = new TypeError("Invalid windowId, expected a string.");
                return handleException(exception, callback);
            }

            absWindows.remove(windowId, function (response) {
                response._callbackType = 'cbSuccess';
                handleResponse(response, callback);
            });
        },
        /*
        Updates a window - changes URL or selects
        Params:
        windowId: (string) The ID of the window to remove.
        updateProperties: (object) The properties to update. { position: { top: (number), left: (number) }, dimensions: { width: (number), height: (number) } }
        [callback]: (function) A function to call after the window's been updated. If nothing's been changed, the function isn't called.
        [onError]: (function) A function to call if an error occured and the window hasn't been updated. Receives one parameter - error description. Use 'this' for more info.
        */
        update: function (windowId, updateProperties, callback) {
            if (typeof (windowId) !== "string") {
                var exception = new TypeError("Invalid windowId, expected a string.");
                return handleException(exception, callback);
            }

            updateProperties = updateProperties || {};

            if (updateProperties.position) {
                var left = updateProperties.position.left,
                    top = updateProperties.position.top;
            }
            if (updateProperties.dimensions) {
                var width = updateProperties.dimensions.width,
                    height = updateProperties.dimensions.height;
            }

            function setFocused(windowInfo) {
                if (updateProperties.focused !== undefined) {
                    absWindows.setFocused(windowId, !!updateProperties.focused, function (response) {
                        handleResponse(response, callback);
                    });
                }
                else if (windowInfo !== undefined && callback)
                    callback(windowInfo);
            }
            if (updateProperties.position || updateProperties.dimensions) {
                // To keep width and height, abs expecting (-1) 
                absWindows.changePosition(windowId, left, top, width || -1, height || -1, function (response) {
                    handleResponse(response, setFocused);
                });
            }
            else
                setFocused();
        },
        // EVENTS:
        /*
        Adds a listener to the window creation event.
        Returns true if the listener was registered successfully or false if not.
        Params:
        callback: (function) A function to call when a window is created. Has one parameter - windowInfo (object).
        */
        onCreated: { addListener: function (callback, listenerCallback) {
            if (!callback || typeof (callback) !== "function") {
                var exception = new TypeError("Invalid callback for the windows.onCreated.addListener method, expected a function.");
                return handleException(exception, callback);
            }

            var response = absWindows.onCreated.addListener(function (data) {
                handleResponse(data, listenerCallback);
            });
            response._callbackType = 'cbSuccess';
            handleResponse(response, callback);
        }
        },
        /*
        Adds a listener to the window onFocus event.
        Returns true if the listener was registered successfully or false if not.
        Params:
        callback: (function) A function to call when a window is focused. Has one parameter - windowId (number).
        */
        onFocusChanged: { addListener: function (callback, listenerCallback) {

            var response = absWindows.onFocusChanged.addListener(function (data) {
                handleResponse(data, listenerCallback);
            });
            response._callbackType = 'cbSuccess';
            handleResponse(response, callback);
        }
        },
        /*
        Adds a listener to the window remove event.
        Returns true if the listener was registered successfully or false if not.
        Params:
        callback: (function) A function to call when a window is removed. Has one parameter - windowId (number).
        */
        onRemoved: { addListener: function (callback, listenerCallback) {
            var response = absWindows.onClosed.addListener(function (data) {
                handleResponse(data, listenerCallback);
            });
            response._callbackType = 'cbSuccess';
            handleResponse(response, callback);
        }
        }
    };
})(conduit.abstractionlayer));
﻿(function () {
    conduit.triggerEvent("onInitSubscriber", {
        subscriber: conduit.webappApi.commons,
        dependencies: ['applicationLayer.appCore.appManager.model', 'applicationLayer.UI.popupManager', 'applicationLayer.UI.menuManager'],
        onLoad: conduit.webappApi.commons.init
    });
})();

