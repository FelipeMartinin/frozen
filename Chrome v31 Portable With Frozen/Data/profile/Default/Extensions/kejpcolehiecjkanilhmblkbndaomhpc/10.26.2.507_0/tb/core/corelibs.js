//
// Copyright © Conduit Ltd. All rights reserved.
// This software is subject to the Conduit license (http://hosting.conduit.com/EULA/).
//
// This code and information are provided 'AS IS' without warranties of any kind, either expressed or implied, including, without limitation, // to the implied warranties of merchantability and/or fitness for a particular purpose.
//
//

﻿
conduit.register("utils.apiPermissions.consts", new function () {
    var TYPE = {
        CROOS_DOMAIN_AJAX: "crossDomainAjax",
        GET_MAIN_FRAME_TITLE: "getMainFrameTitle",
        GET_MAIN_FRAME_URL: "getMainFrameUrl",
        GET_SEARCH_TERM: "getSearchTerm",
        INSTANT_ALERT: "instantAlert",
        JS_INJECTION: "jsInjection",
        SSL_GRANTED: "sslGranted",
        TOOLBAR_VISIBILITY:"toolbarVisibility"
    };

    return {
        TYPE: TYPE
    };
});

conduit.register("utils.consts", new function () {

    var GLOBAL = {
        SEARCH_URL_LIST: 'Smartbar.ConduitSearchUrlList',
        SEARCH_ENGINE_LIST: 'Smartbar.ConduitSearchEngineList',
        SELECTED_CTID: 'Smartbar.keywordURLSelectedCTID',
        ADDRESS_BAR_SAVED_URL: 'Smartbar.SearchFromAddressBarSavedUrl',
        OLDBAR_ADDRESS_BAR_SAVED_URL: 'CommunityToolbar.SearchFromAddressBarSavedUrl',
        CONDUIT_TOP_LEVEL_DOMAIN : "conduit",
        QASITE_TOP_LEVEL_DOMAIN : "qasite",
        ADDRESSURL_OWNER: "smartbar.addressBarOwnerCTID"
    };

    //TODO delete unnecessary consts
    var CONTENT_SCRIPT = {
        TOOLBAR_HEIGHT: 280, // 280px for ABST_ATP_TESTER
        BORDER_RADIUS: '5px',
        WRAPPER_DIV_SELECTOR: '#main-iframe-wrapper'
    };

    //#ifndef NPAPI_TESTER
    CONTENT_SCRIPT.TOOLBAR_HEIGHT = 750;
    //#endif 

    //#ifndef ABST_ATP_TESTER
    CONTENT_SCRIPT.TOOLBAR_HEIGHT = 34;
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
        SET_POPUP_POSITION: 'setPopupsPositionInBg'
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
        HAS_DATA: 'hasData',
        NPAPI_KEY_FUNC: 0,
        NPAPI_DATA_FUNC: 1,
        NPAPI_GLOBAL_KEY_FUNC: 2,
        NPAPI_GLOBAL_DATA_FUNC: 3
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

    return {
        GLOBAL: GLOBAL,
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
        COMPRESSION: COMPRESSION
    };
});

var Consts = conduit.utils.consts;
//****  Filename: Utils.js
//****  FilePath: main/js/utils
//****
//****  Author: Yochai
//****  Date: 16.02.11
//****  Class Name: Utils
//****  Type: Singleton
//****  Description: Has one global object - content_side which tells us if we're in the view or the bg.
//****  Inherits from: No one.
//****
//****  Copyright: Realcommerce & Conduit.
//****

if (!conduit.utils) {
    conduit.utils = {};
}

conduit.utils.conten_side = false;
try {
    chrome.browserAction.justCheck;
} catch (e) {
    conduit.utils.conten_side = true;
}

/************** PRIVATE FUNCTIONS **********************/
/**
@description converts objects to strings - so when printing it will be readable
@function objectToString
@property {object} obj - the object we want to read as a string
*/
/*function objectToString(obj) {
var parse = function (_obj) {
var a = [], t;
for (var p in _obj) {
if (_obj.hasOwnProperty(p)) {
t = _obj[p];
if (t && typeof t == "object") {
a[a.length] = p + ":{ " + arguments.callee(t).join(", ") + "}";
}
else {
if (typeof t == "string") {
a[a.length] = [p + ": \"" + t.toString() + "\""];
}
else {
a[a.length] = [p + ": " + t.toString()];
}
}
}
}
return a;
};
return "{" + parse(obj).join(", ") + "}";

}*/

var Utils = conduit.utils;
﻿(function ($) {
    conduit.register("coreLibs.repository", {

        setLocalData: function (keyName, data, setAsFile, callback) {
            var dataType = typeof (data);
            if (dataType === "function" || !data) {
                throw new TypeError("coreLibs.repository.setData receives only objects and value types.");
            }
            var ctid = conduit.abstractionlayer.commons.context.getCTID();
            if (ctid.status == "0") {
                ctid = ctid.result;
            }
            else {
                ctid = "";
            }
            var dataStr = dataType === "object" ? JSON.stringify(data) : data.toString(),
                repositoryData = { dataType: dataType, data: dataStr };
            if (dataStr.length > 256 || setAsFile == true) {
                //set to data - file in IE andFF
                keyName = ctid + "." + keyName;
                conduit.abstractionlayer.commons.repository.setData(keyName, JSON.stringify(repositoryData), false, "overwrite", function (res) {
                    if (callback) {
                        callback(res);
                    }
                });
            }
            else {
                //set to key
                keyName = ctid + "." + keyName;
                var res = conduit.abstractionlayer.commons.repository.setKey(keyName, JSON.stringify(repositoryData));
                if (callback) {
                    callback(res);
                }
            }
        },
        setLocalKey: function (keyName, data) {
            var dataType = typeof (data);
            if (dataType === "function" || !data) {
                throw new TypeError("coreLibs.repository.setData receives only objects and value types.");
            }
            var ctid = conduit.abstractionlayer.commons.context.getCTID();
            if (ctid.status == "0") {
                ctid = ctid.result;
            }
            else {
                ctid = "";
            }
            var dataStr = dataType === "object" ? JSON.stringify(data) : data.toString(),
                repositoryData = { dataType: dataType, data: dataStr };

            //set to key
            keyName = ctid + "." + keyName;
            conduit.abstractionlayer.commons.repository.setKey(keyName, JSON.stringify(repositoryData));
        },
        getLocalData: function (keyName, callback) {
            var ctid = conduit.abstractionlayer.commons.context.getCTID();
            if (ctid.status == "0") {
                ctid = ctid.result;
            }
            else {
                ctid = "";
            }
            keyName = ctid + "." + keyName;
            conduit.abstractionlayer.commons.repository.getData(keyName, false, function (dataStr) {

                // form data
                if (typeof (dataStr) === "object" && (dataStr.result === false || dataStr.status !== 0)) {
                    //from key
                    dataStr = conduit.abstractionlayer.commons.repository.getKey(keyName);
                    if (typeof (dataStr) === "object" && dataStr.result === false) {
                        if (callback) {
                            callback(null);
                        }
                        return null;
                    }
                }
                if (!dataStr) {
                    throw new Error("Data doesn't exist in repository for key: " + keyName);
                }
                var repositoryData = typeof (dataStr.result) === "string" && dataStr.result ? $.parseJSON(dataStr.result) : dataStr.result;
                if (callback) {
                    callback((repositoryData && repositoryData.dataType === "object" ? $.parseJSON(repositoryData.data) : repositoryData));
                }
            });
        },
        getLocalKey: function (keyName) {
            var ctid = conduit.abstractionlayer.commons.context.getCTID();
            if (ctid.status == "0") {
                ctid = ctid.result;
            }
            else {
                ctid = "";
            }
            keyName = ctid + "." + keyName;

            //from key
            dataStr = conduit.abstractionlayer.commons.repository.getKey(keyName);
            if (typeof (dataStr) === "object" && dataStr.result === false) {
                return null;
            }

            if (!dataStr) {
                throw new Error("Data doesn't exist in repository for key: " + keyName);
            }
            var repositoryData = typeof (dataStr.result) === "string" && dataStr.result ? $.parseJSON(dataStr.result) : dataStr.result;
            return (repositoryData && repositoryData.dataType === "object" ? $.parseJSON(repositoryData.data) : repositoryData);
        },
        removeLocalData: function (keyName) {
            var ctid = conduit.abstractionlayer.commons.context.getCTID();
            if (ctid.status == "0") {
                ctid = ctid.result;
            }
            else {
                ctid = "";
            }
            keyName = ctid + "." + keyName;
            conduit.abstractionlayer.commons.repository.removeKey(keyName);
        },
        removeLocalKey: function (keyName) {
            var ctid = conduit.abstractionlayer.commons.context.getCTID();
            if (ctid.status == "0") {
                ctid = ctid.result;
            }
            else {
                ctid = "";
            }
            keyName = ctid + "." + keyName;
            conduit.abstractionlayer.commons.repository.removeKey(keyName);
        },
        removePublicData: function () {
            keyName = keyName;
            conduit.abstractionlayer.commons.repository.removeKey(keyName);
        },
        setData: function (keyName, data, callback) {
            var dataType = typeof (data);
            if (dataType === "function" || !data) {
                throw new TypeError("coreLibs.repository.setData receives only objects and value types.");
            }

            conduit.abstractionlayer.commons.repository.setData(keyName, JSON.stringify({ dataType: dataType, data: data }), false, "overwrite", function (res) {
                if (callback) {
                    callback(res);
                }
            });
        },
        getData: function (keyName, callback) {
            conduit.abstractionlayer.commons.repository.getData(keyName, false, function (dataStr) {

                if (typeof (dataStr) === "object" && dataStr.result === false) {
                    if (callback) {
                        callback(null);
                    }
                    return null;
                }

                if (!dataStr) {
                    throw new Error("Data doesn't exist in repository for key: " + keyName);
                }

                try {
                    repositoryData = typeof (dataStr.result) === "string" && dataStr.result ? $.parseJSON(dataStr.result) : dataStr.result;
                }
                catch (err) {
                    repositoryData = dataStr.result;
                }

                callback(repositoryData.data);
            });
        },
        handleDataFromGetFiles: function (dataStr) {
            try {
                dataStr = unescape(dataStr);
                repositoryData = typeof (dataStr) === "string" && dataStr ? $.parseJSON(dataStr) : dataStr;
            }
            catch (err) {
                repositoryData = dataStr;
            }

            return repositoryData ? repositoryData.data : '';
        }


    });
})(jQuery);
﻿conduit.register("coreLibs.config", (function () {
    var applicationDirNameDefault = 'tb';
    var applicationDirName;
    var activeCTID, activeToolbarName;
    var Messages = conduit.abstractionlayer.commons.messages,
        hardCtid = conduit.abstractionlayer.commons.context.getCTID().result,
        appOptionsKey = hardCtid + ".appOptions",
        stagedWebappsKeyName = hardCtid + '.stagedWebapps';

    function isDebug(callback) {
        try {
            conduit.abstractionlayer.commons.repository.getExternalKey("smartbarDebug", function (isDebugKey) {
                // in chrome there is still a bug in abs that the value is boolean.
                if (callback) {
                    callback(!isDebugKey.status && (isDebugKey.result === "true" || isDebugKey.result == true));
                    return;
                }
                callback(false);
            });
        }
        catch (e) {
            callback(false);
        }
    }

    function isPerformanceMode() {
        //var isPerformanceModeKey = conduit.abstractionlayer.commons.repository.getKey("smartbarPerformanceMode");
        //return !isPerformanceModeKey.status && isPerformanceModeKey.result === "yes";
        return false;
    }

    conduit.subscribe("onLoginChange", function () {
        var newActiveCTID = conduit.backstage.serviceLayer.login.getActiveCTID();
        activeCTID = newActiveCTID;
        activeToolbarName = conduit.backstage.serviceLayer.login.getActiveCTName();

    });

    function getActiveCTID() {
        var replaceActiveCTManuallyKey = conduit.abstractionlayer.commons.repository.getKey(hardCtid + ".replaceActiveCTManually");
        var replaceActiveCTManually = !replaceActiveCTManuallyKey.status && /true/i.test(replaceActiveCTManuallyKey.result) //check if the key exist and equal to true, meaning the active CT ID was replaced via WEBAPP API

        if (!(activeCTID) || replaceActiveCTManually) { //activeCTID is defined only in backstage, when subscribe to "onLoginChange" will return a active CT ID        
            var activeCTIDKey = conduit.abstractionlayer.commons.repository.getKey(hardCtid + ".activeCTID").result;
            var activeID = activeCTIDKey ? activeCTIDKey : hardCtid; //if active CT ID exist in repository, use it otherwise, use the original CTID                                    
            return activeID;
        }
        else {
            return activeCTID;
        }
    }

    function getActiveToolbarName(callback) {
        if (!(activeToolbarName)) {
            // get the active ctid from the service layer
            Messages.sendSysReq("serviceLayer", "coreLibs.config", JSON.stringify({ service: 'login', method: 'getActiveCTName' }), function (toolbarActiveName) {
                if (toolbarActiveName) {
                    name = toolbarActiveName;
                }
                else {
                    name = conduit.abstractionlayer.commons.context.getToolbarName().result;
                }

                callback(name);
            });
        }
        else {
            callback(activeToolbarName);
        }
    }

    function getApplicationDirName() {
        if (!applicationDirName) {
            var result = conduit.abstractionlayer.commons.environment.getApplicationDirName();

            if (result.status == 0) {
                applicationDirName = result.result;
            }
        }
        return (applicationDirName && typeof (applicationDirName) === 'string' ? applicationDirName : applicationDirNameDefault);
    }

    function getAppOptions(appId) {
        var appOptions = conduit.abstractionlayer.commons.repository.getKey(appOptionsKey);
        appOptions = appOptions && appOptions.status === 0 ? JSON.parse(appOptions.result) : {};
        var returnedOptions = appId ? appOptions[appId] : appOptions;
        return returnedOptions;
    }

    function setAppOptions(data) {
        var optionsData = JSON.stringify(data);
        conduit.abstractionlayer.commons.repository.setKey(appOptionsKey, optionsData);
    }

    function getActiveData(callback) {
        if (!(activeCTID) || !(activeToolbarName)) {
            // get the active ctid and name from the service layer
            Messages.sendSysReq("serviceLayer", "coreLibs.config", JSON.stringify({ service: 'login', method: 'getActiveCTData' }), function (activeData) {
                activeData = JSON.parse(activeData);
                var activeID = activeData.activeCTID
                activeName = activeData.activeCTName;

                if (!activeID) {
                    activeID = conduit.abstractionlayer.commons.context.getCTID().result;
                }
                if (!activeName) {
                    activeName = conduit.abstractionlayer.commons.context.getToolbarName().result;
                }

                callback({ activeCTID: activeID, activeToolbarName: activeName });
            });
        }
        else {
            callback({ activeCTID: activeCTID, activeToolbarName: activeToolbarName });
        }
    }

    function clearStagedWebapps() {
        conduit.abstractionlayer.commons.repository.setKey(stagedWebappsKeyName, "false");
    }

    function isStagedWebappsAvailable() {
        var value = conduit.abstractionlayer.commons.repository.getKey(stagedWebappsKeyName);

        if (value && !value.status) {
            var result = value.result === "false" ? false : true;
            return result;
        }
        return false;
    }

    function getToolbarUrl(settingsGeneralData) {
        var toolbarUrl;
        if (settingsGeneralData && settingsGeneralData.webServerUrl) {
            toolbarUrl = settingsGeneralData.webServerUrl.replace(/\/$/, "");
        }
        else {
            var response = conduit.abstractionlayer.commons.repository.getKey(ctid + ".webServerUrl");
            if (!response.status && response.result) {
                toolbarUrl = response.result.replace(/\/$/, "");
            }
            else {
                var toolbarName = conduit.abstractionlayer.commons.context.getToolbarName().result
                toolbarName = toolbarName.replace(/[\s\_]/g, ""); // remove _ and spaces. for example, in chrome toolbar name can be Try_Me domain name is tryme
                toolbarUrl = 'http://' + name + ".ourtoolbar.com"; //replace in build                     
            }
        }

        return toolbarUrl;
    }

    function getMachineId() {
        var machineId = "";
        var getMacineIdObj = conduit.abstractionlayer.commons.context.getMachineId();
        if (getMacineIdObj.status == 0) {
            machineId = "SB_" + getMacineIdObj.result;
        }
        return machineId;
    }
    // use following namespace: conduit.coreLibs.config. to use the APIs   
    return {
        isDebug: isDebug,
        isPerformanceMode: isPerformanceMode,
        getActiveCTID: getActiveCTID,
        getActiveToolbarName: getActiveToolbarName,
        getActiveData: getActiveData,
        getAppOptions: getAppOptions,
        setAppOptions: setAppOptions,
        isStagedWebappsAvailable: isStagedWebappsAvailable,
        clearStagedWebapps: clearStagedWebapps,
        getApplicationDirName: getApplicationDirName,
        getToolbarUrl: getToolbarUrl,
        getMachineId: getMachineId
    }

})());
﻿
conduit.register("coreLibs.logger", (function () {
    //TODO document in sharepoint
    var GeneralCodes = { GENERAL_ERROR: 1, SERVICE_CALL_FAILED: 300, MISSING_SETTINGS_ITEM: 301, INVALID_DATA: 302, INJECT_SCRIPT_ERROR: 303,
        SERVICE_METHOD_INVOCATION_ERROR: 304, MISSING_REPOSITORY_KEY: 305, MISSING_SSPV_IN_URL: 306, SP_WAS_NOT_INITIALIZED: 307,
        LOGIN_POST_XML_FAILURE: 308, LOGIN_INIT_FAILURE: 309, FIRST_LOGIN_START_FAILURE: 310, LOGIN_DOWNLOAD_REF_COOKIE_FAILURE: 311,
        FIRST_TIME_DIALOG_FLOW_FAILURE: 312
    };
    var StorageCodes = { FAILED_SET_TO_STORAGE: 400 };
    var NetwrokCodes = { BAD_HTTP_RESPONSE: 500 };
    var ServiceCodes = { serviceMap: 10, toolbarSettings: 20, login: 30, appsMetadata: 40, appTracking: 50, appTrackingFirstTime: 60, toolbarContextMenu: 70,
        gottenAppsContextMenu: 80, otherAppsContextMenu: 90, translation: 100, userApps: 110, WebappSettings: 120, uninstall: 130, usage: 140,
        WebappValidation: 150, menu: 160, toolbarGrouping: 170, clientErrorLog: 180, searchAPI: 190
    };

    var BrowserType = conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type;

    // Save file to path...

    var path = conduit.abstractionlayer.commons.context.getCTID().result + "_" + BrowserType + ".csv";
    var absCommons = conduit.abstractionlayer.commons;

    function updateFile() {
        try {
            var result = conduit.abstractionlayer.commons.repository.hasKey(path);
            if (result.result) {
                var dataToFile = "From,Action,Time, Is_State_Exist, Time from first step, Time from prev step \n";
                var data = conduit.abstractionlayer.commons.repository.getKey(path).result;
                var dataArr = JSON.parse(data);
                var dataLine = "";
                var totalTime = "";
                for (var i = 0; i < dataArr.length; i++) {
                    var loggerObj = dataArr[i];
                    dataLine = loggerObj.from + "," + loggerObj.action +
						"," + loggerObj.time +
						"," + loggerObj.isWithState +
                        "," + loggerObj.timeFromStart +
                        "," + loggerObj.timeFromPrev +
						"\n";
                    dataToFile += dataLine;
                }
                conduit.abstractionlayer.commons.repository.hasData(path, function (response) {
                    if (response.result && !/false/i.test(response.result)) {
                        conduit.abstractionlayer.commons.repository.getData(path, function (dataResponse) {
                            dataToFile = dataResponse.result + "\n" + dataToFile;
                            setFileData(path, dataToFile);
                        });
                    }
                    else {
                        setFileData(path, dataToFile);
                    }
                });
            }
        } catch (e) { }

    }

    function setFileData(path, dataToFile) {
        conduit.abstractionlayer.commons.repository.setData(path, dataToFile, function () {
            //remove the key from pref
            conduit.abstractionlayer.commons.repository.removeKey(path);
        });
    }

    function updatePref(loggerObj) {
        try {
            var prefArr = [];
            //check if exist
            var result = conduit.abstractionlayer.commons.repository.hasKey(path);
            //first time.
            if (result.result) {

                var data = conduit.abstractionlayer.commons.repository.getKey(path).result;
                prefArr = JSON.parse(data);

                loggerObj.timeFromStart = (loggerObj.time - prefArr[0].time);

                var timeFromPrev = 0;
                var lastState = (prefArr.length - 1);
                if (lastState >= 0) {
                    timeFromPrev = (loggerObj.time - prefArr[lastState].time);
                }
                loggerObj.timeFromPrev = timeFromPrev;
                prefArr.push(loggerObj);
            }
            else {
                loggerObj.timeFromStart = 0;
                loggerObj.timeFromPrev = 0;
                prefArr.push(loggerObj);
            }

            conduit.abstractionlayer.commons.repository.setKey(path, JSON.stringify(prefArr));
        }
        catch (e) { }
    }

    function add(o) {
        conduit.coreLibs.config.isDebug(function (res) {
            if (res) {
                var dataTofile = o.from + ',' + o.action + ',' + o.startTime + ',' + o.popupOpen + ',' + o.popupInit + ',' + o.endTime + ',' + o.isApi + ',' + o.isWithState + ',' + (o.endTime - o.startTime) / 1000 + '\n';
                //  updateFile(dataTofile);
            }
        });
    }

    var _performanceLog = function (loggerObj, writeToFile) {
        conduit.coreLibs.config.isDebug(function (res) {
            if (!res) { return }

            updatePref(loggerObj);
            if (writeToFile) {
                updateFile();
            }
        });
    }

    function formatMessage(message, context, code) {
        var contextPrefix = "";
        if (context) {
            if (context.className) {
                contextPrefix = "CLASS :: " + context.className;
            }
            if (context.functionName) {
                contextPrefix += " :: FUNCTION :: " + context.functionName + " ::";
            }

        }
        var formattedMessage = contextPrefix;
        if (code) {
            formattedMessage = contextPrefix + " CODE :: " + code + " :: MESSAGE :: " + message;
        }
        else {
            formattedMessage = contextPrefix + " MESSAGE :: " + message;
        }

        return formattedMessage;
    }

    function updateAbsErrorObject(absErrorObject, message, context) {
        absErrorObject.errorMessage = message;

        if (context) {
            if (context.className) {
                absErrorObject.namespace = context.className;
            }
            if (context.functionName) {
                absErrorObject.functionName = context.functionName;
            }
        }
    }

    /*
    [message]        - (string, mandatory) Log message.
    [context]        - (object, mandatory) for example, {className: "TollbarSettings", functionName: "loadSettingsData"}
    [additionalInfo] - (object, optional) contains the following:
    [error]          - (Error)   The javascript error object. 
    [reportToServer] - (boolean) indicates if to report the error to the server using the ClientErrorLog service. default false.
    [code]           - (number)  the relevant error code.                                
    */
    function logError(message, context, additionalInfo) {
        try {

            var code = GeneralCodes.GENERAL_ERROR;
            var error;
            var reportToServer = false;
            var name = "";
            var url = "";
            var absErrorObject = {};

            if (additionalInfo) {
                code = additionalInfo.code ? additionalInfo.code : code;
                error = additionalInfo.error ? additionalInfo.error : undefined;
                reportToServer = additionalInfo.reportToServer === true ? true : false;
                name = additionalInfo.name ? additionalInfo.name : "";
                url = additionalInfo.url ? additionalInfo.url : "";
                absErrorObject.errorObject = error;
            }

            updateAbsErrorObject(absErrorObject, message, context);
            message = formatMessage(message, context, code);

            conduit.abstractionlayer.commons.logging.logError(absErrorObject);

            if (reportToServer) {

                var stack = "";
                var stackArray;
                var errorMessage = "";
                if (error) {
                    try {
                        var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
                        var isFF = /Firefox/i.test(browserInfo.type);
                        var isCH = /Chrome/i.test(browserInfo.type);
                        if ((isCH || isFF) && error.stack) {
                            var stackMatch = error.stack.match(/([\w\.]+\.js:\d+)/gi); // take file names and line numbers.
                            if (stackMatch && stackMatch.length > 0) {
                                stack = stackMatch.splice(0, 5).join(', ');
                            }
                        }
                        errorMessage = formatErrorObject(error);
                    }
                    catch (e) {
                        stack = "";
                    }
                }

                var errorData = { message: errorMessage, stack: stack };
                var errorItem = { 'message': message, 'code': code, 'error': errorData, 'level': "ERROR", 'name': name, 'url': url };

                var addClientError = JSON.stringify({ method: 'addError', service: 'clientErrorLog', data: errorItem });
                //sending request to the service layer to get the personal components
                conduit.abstractionlayer.commons.messages.sendSysReq('serviceLayer', 'errorHandling', addClientError, function () { });
            }
        }
        catch (e) {
            // we failed to log the error.
        }
    }

    function formatErrorObject(error) {
        var strEx = '';
        if (typeof (error) != 'undefined') {
            if (typeof (error.message) != 'undefined') {
                strEx = error.message;
            }
            if (typeof (error.description) != 'undefined') {
                strEx = strEx + " , description: " + error.description;
            }
            if (typeof (error.name) != 'undefined') {
                strEx = strEx + " , name: " + error.name;
            }
            // take only the first 200 chars.
            strEx = getStringValuePrefix(strEx, 250);
        }
        return strEx;
    }


    function getCodeByServiceName(serviceName) {
        var code = ServiceCodes[serviceName] ? ServiceCodes[serviceName] : GeneralCodes.SERVICE_CALL_FAILED;
        return code;
    }

    function logDebug(message, context) {
        var absErrorObject = {};
        updateAbsErrorObject(absErrorObject, message, context);
        message = formatMessage(message, context);
        // check application layer debug mode here to prevent logs when not needed.
        conduit.abstractionlayer.commons.logging.logDebug(absErrorObject);
    }

    function logInfo(message, context) {
        var absErrorObject = {};
        updateAbsErrorObject(absErrorObject, message, context);
        message = formatMessage(message, context);
        // check application layer debug mode here to prevent logs when not needed.        
        conduit.abstractionlayer.commons.logging.logDebug(absErrorObject);
    }

    function getStringValuePrefix(data, num) {
        try {
            var dataFromServer = "";
            var numOfChars = num ? num : 100;
            if (typeof (data) === 'string') {
                dataFromServer = data.substring(0, numOfChars);
            }
            else if (typeof (data) === 'object') {
                dataFromServer = JSON.stringify(data);
                if (dataFromServer) {
                    dataFromServer = dataFromServer.substring(0, numOfChars);
                }
            }
            return dataFromServer;
        }
        catch (e) {
            return "";
        }
    }

    function validateUrl(searchProtectorData, context) {
        try {
            var errorMessage = null;
            var homepageurl = searchProtectorData.homepageUrlFromSettings;
            if (homepageurl == null || typeof (homepageurl) === 'undefined' || homepageurl.length == 0) {
                errorMessage = 'Homepage URL is empty';
            }
            if (errorMessage) {
                logError(errorMessage, context, { code: conduit.coreLibs.logger.GeneralCodes.MISSING_SSPV_IN_URL, reportToServer: true });
            }

        }
        catch (e) {
            // failed to report errors;  
        }
    }
    return {
        logError: logError,
        logDebug: logDebug,
        logInfo: logInfo,
        getCodeByServiceName: getCodeByServiceName,
        GeneralCodes: GeneralCodes,
        StorageCodes: StorageCodes,
        NetwrokCodes: NetwrokCodes,
        add: add,
        performanceLog: _performanceLog,
        getStringValuePrefix: getStringValuePrefix,
        validateUrl: validateUrl
    }
})());


﻿conduit.register("coreLibs.UI", (function () {
    var currentWindowId,
              currentTab;

    if (conduit.abstractionlayer.backstage) {
        var absWindows = conduit.abstractionlayer.backstage.windows;
        function setCurrentTab() {
            conduit.abstractionlayer.backstage.tabs.getSelected(currentWindowId, function (response) {
                var tab = $.extend({}, response.result, true);

                currentTab = tab;
            });
        }

        absWindows.getLastFocused(function (response) {
            var newWindowId = String(response.result.windowId);
            if (newWindowId !== currentWindowId) {
                currentWindowId = newWindowId;
                setCurrentTab();
            }
        });

        absWindows.onFocusChanged.addListener(function (windowId) {
            var newWindowId = typeof (windowId) === 'object' ? windowId.windowId : String(windowId).replace("windowId:", "");

            if (newWindowId !== currentWindowId) {
                currentWindowId = newWindowId;
                setCurrentTab();
            }
        });

        conduit.abstractionlayer.backstage.tabs.onTabActivated.addListener(function (tabId) {
            conduit.coreLibs.logger.logDebug('onTabActivated tab id ' + JSON.stringify(tabId), { className: "coreLibs.UI", functionName: "currentTab listener" });
            if (typeof (tabId) === "object" && tabId.tabId)
                tabId = tabId.tabId;

            conduit.abstractionlayer.backstage.tabs.get(currentWindowId, tabId.toString(), function (response) {
                conduit.coreLibs.logger.logDebug('tabs tab info ', { className: "coreLibs.UI", functionName: "currentTab listener" });
                var tab = $.extend({}, response.result, true);
                currentTab = tab;
            });
        });

        conduit.abstractionlayer.commons.messages.onSysReq.addListener("coreLibs.UI.backstage", function (data, sender, callback) {
            var dataObj = JSON.parse(data),
                           method = conduit.coreLibs.UI[dataObj.method];

            if (method) {
                dataObj.params = dataObj.params || [];
                dataObj.params.push(function (data) {
                    if (typeof (data) !== "string")
                        data = JSON.stringify(data);

                    callback(data);
                });
                method.apply(dataObj, dataObj.params);
            }
        });
    }

    return {
        withCurrentWindow: function (callback) {
            if (absWindows) {
                if (currentWindowId)
                    callback(currentWindowId);
                else {
                    absWindows.getLastFocused(function (windowResult) {
                        callback(windowResult.result.windowId);
                    });
                }
            }
            else {
                conduit.abstractionlayer.commons.messages.sendSysReq("coreLibs.UI.backstage", "coreLibs.UI.frontstage", JSON.stringify({ method: "withCurrentWindow" }),
                function (data) {
                    callback(JSON.parse(data));
                });
            }
        },
        withCurrentTab: function (callback) {
		// TODO: maybe we should refactor this function to use only return value
            if (absWindows) {
                if (currentTab) {
                    if (callback)
                        callback(currentTab);
                    else
                        return currentTab;
                }
            }
            else {
                conduit.abstractionlayer.commons.messages.sendSysReq("coreLibs.UI.backstage", "coreLibs.UI.frontstage", JSON.stringify({ method: "withCurrentTab" }),
                function (data) {
                    callback(JSON.parse(data));
                });
            }
        },
        getScreenWidth: function (callback) {
            conduit.abstractionlayer.commons.environment.getScreenWidth(function (screenWidth) {
                conduit.abstractionlayer.commons.environment.getScreenOffset(function (screenOffset) {
                    if (!screenWidth.status && !screenOffset.status) {
                        callback({ width: screenWidth.result, offset: screenOffset.result.left });
                    }
                    else {
                        callback(screen.availLeft + screen.availWidth);
                    }
                });
            });
        }
    }
})());
﻿conduit.register("coreLibs.aliasesManager", (function () {
    var currentWindowId, currentTab, webServerUrl, apps, searchTerm;
    var absCommons = conduit.abstractionlayer.commons;
    var toolbarVersion = absCommons.environment.getEngineVersion().result;
    var browserInfo = absCommons.environment.getBrowserInfo().result;
    var osInfo = absCommons.environment.getOSInfo().result;
    var toolbarName = absCommons.context.getToolbarName().result;
    var ctid = absCommons.context.getCTID().result;
    var trippleKeySearchUserMode;
    var umValue;
    var userID;
    var umUninstallValue;
    var isFF = (browserInfo.type == "Firefox");
    var isChrome = (browserInfo.type == "Chrome");

    var activeCTID = conduit.coreLibs.config.getActiveCTID();
    var constants = {
        APP_DIR_NAME_ALIAS: '_APP_DIR_NAME_',
        APP_PATH_NAME_ALIAS: '_APP_PATH_NAME_',
        EB_LOCALE: 'EB_LOCALE',
        EB_COUNTRY_CODE: 'EB_COUNTRY_CODE',
        APPTRACKING_CURRENT_STATE: 'EB_APPTRACKING_CURRENT_STATE',
        SEARCH_TERM: 'EB_SEARCH_TERM',
        MAIN_FRAME_URL: 'EB_MAIN_FRAME_URL',
        MAIN_FRAME_TITLE: 'EB_MAIN_FRAME_TITLE',
        TOOLBAR_SUB_DOMAIN: 'EB_TOOLBAR_SUB_DOMAIN',
        TOOLBAR_ID: 'EB_TOOLBAR_ID',
        TOOLBAR_VERSION: 'EB_TOOLBAR_VERSION',
        ORIGINAL_CTID: 'EB_ORIGINAL_CTID',
        TOOLBAR_SUB_DOMAIN: 'EB_TOOLBAR_SUB_DOMAIN',
        DOWNLOAD_PAGE: 'EB_DOWNLOAD_PAGE',
        TOOLBAR_NAME: 'EB_TOOLBAR_NAME',
        EB_USER_ID: 'EB_USER_ID',
        EB_SMV: 'EB_SMV',
        UM_ID: 'UM_ID',
        UM_UNINSTALL_ID: 'UM_UNINSTALL_ID',
        SB_CUI: 'SB_CUI',
        TYPE_MODES: {
            NAVIGATION_URL: 'NAVIGATION_URL',
            TAB: 'TAB',
            SEARCH: 'SEARCH',
            SEARCH_ASSET: 'SEARCH_ASSET'
        }
    };
    var aliasList = {
        _APP_DIR_NAME_: function (data) {
            return conduit.coreLibs.config.getApplicationDirName();
        },
        _APP_PATH_NAME_: function (data) {
            return absCommons.environment.getApplicationPath().result;
        },
        EB_TOOLBAR_VERSION: toolbarVersion,
        EB_TOOLBAR_NAME: toolbarName,
        EB_TOOLBAR_LOGO: function () {
            var result = "";

            if (apps && apps[0]) {
                var mainMenuApp = apps[0];
                var toolbarLogoIcon = (mainMenuApp.viewData && mainMenuApp.viewData.icon) ? mainMenuApp.viewData.icon : null;

                if (toolbarLogoIcon) {
                    result = toolbarLogoIcon;
                }
            }
            return result;
        },
        EB_ORIGINAL_CTID: ctid,
        EB_TOOLBAR_ID: function () {
            return conduit.coreLibs.config.getActiveCTID();
        },
        EB_BROWSER_TYPE: browserInfo.type,
        EB_APPTRACKING_CURRENT_STATE: null,
        EB_BROWSER_VERSION: browserInfo.version,
        EB_OS_TYPE: osInfo.type,
        EB_OS_VERSION: osInfo.version,
        EB_PLATFORM: browserInfo.type,
        EB_USER_ID: userID,
        SB_CUI: userID,
        UM_ID: umValue,
        UM_UNINSTALL_ID: umUninstallValue,
        EB_SMV: "true",
        EB_COUNTRY_CODE: absCommons.repository.getKey(ctid + ".countryCode").result || ""
    };
    var aliasListDynamic = {
        EB_TOOLBAR_SUB_DOMAIN: function () {
            return webServerUrl;
        },
        EB_DOWNLOAD_PAGE: function () {
            return webServerUrl;
        },
        EB_MAIN_FRAME_TITLE: function () {
            var result = "";

            try {
                if (currentTab && currentTab.title) {
                    result = encodeURIComponent(currentTab.title);
                }
            } catch (e) {
                result = "";
            }
            return result;
        },
        EB_MAIN_FRAME_URL: function () {
            var result = "";

            try {
                if (currentTab && currentTab.url) {
                    result = encodeURIComponent(currentTab.url);
                }
            } catch (e) {
                result = "";
            }
            return result;
        },
        EB_SEARCH_TERM: function () {
            return (searchTerm || "");
        },
        EB_LOCALE: null,
        EB_COUNTRY_CODE: null
    };

    function updateAlistList() {
        aliasList["SB_CUI"] = userID;
        aliasList["EB_USER_ID"] = userID;
        aliasList["UM_ID"] = umValue;
        aliasList["UM_UNINSTALL_ID"] = umUninstallValue;
    }
    function replaceAliases(str, type, typeMode, blackList) {
        var value, regex;

        if (typeMode) {
            type = getTypeModeList(typeMode);
        }
        if (type) {
            var fullAliasList = {};

            $.extend(true, fullAliasList, aliasList, aliasListDynamic);
            if (typeof (type) === 'object' && type.length) {
                for (var i = 0; i < type.length; i++) {
                    value = fullAliasList[type[i]];
                    regex = new RegExp(type[i], "g");
                    if (value) {
                        str = str.replace(regex, (typeof (value) === 'function' ? value() : value));
                    }
                }
            } else {
                value = fullAliasList[type];
                regex = new RegExp(type, "g");
                if (value) {
                    str = str.replace(regex, (typeof (value) === 'function' ? value() : value));
                }
            }
        } else {
            for (var key in aliasList) {
                if (blackList && blackList.indexOf(key) != -1) {
                    continue;
                }
                value = aliasList[key];
                regex = new RegExp(key, "g");
                if (value) {
                    str = str.replace(regex, (typeof (value) === 'function' ? value() : value));
                }
            }
        }
        return str;
    }

    function getTypeModeList(typeMode) {
        var list = {};

        switch (typeMode) {
            case constants.TYPE_MODES.NAVIGATION_URL:
                list = [constants.SEARCH_TERM,
                            constants.MAIN_FRAME_URL,
                            constants.MAIN_FRAME_TITLE,
                            constants.TOOLBAR_SUB_DOMAIN,
                            constants.TOOLBAR_ID,
                            constants.TOOLBAR_VERSION,
                            constants.ORIGINAL_CTID,
                            constants.DOWNLOAD_PAGE,
                            constants.TOOLBAR_NAME];
                break;
            case constants.TYPE_MODES.TAB:
                list = [constants.MAIN_FRAME_URL,
                            constants.MAIN_FRAME_TITLE];
                break;
            case constants.TYPE_MODES.SEARCH:
                list = [constants.SEARCH_TERM];
                break;
            case constants.TYPE_MODES.SEARCH_ASSET:
                list = [constants.SB_CUI, constants.UM_ID];
                break;
        }
        return list;
    }

    function updateAbstracrionAliasList(typeMode) {
        var keyList = getTypeModeList(typeMode);
        var fullAliasList = {};
        var requestObj = { list: [] };

        $.extend(true, fullAliasList, aliasList, aliasListDynamic);
        for (var i = 0; i < keyList.length; i++) {
            var value = fullAliasList[keyList[i]];

            requestObj.list.push({ key: keyList[i], value: (typeof (value) === 'function' ? value() : value) });
        }
        setNavigationAliases(requestObj);
    }

    function setNavigationAliases(list) {
        if (conduit.abstractionlayer.commons.appMethods.setNavigationAliases) {
            conduit.abstractionlayer.commons.appMethods.setNavigationAliases(JSON.stringify(list));
        }
    }
    //isDynamic - true for dynamic values such as EB_LOCALE.
    function setAlias(key, value, isDynamic) {
        var list = isDynamic ? aliasListDynamic : aliasList;

        list[key] = value;
    }

    function init() {
        try {
            absCommons.context.getUserID(function (resp) {
                userID = resp.result;
                conduit.abstractionlayer.commons.storage.getTripleKey(ctid + ".searchUserMode", function (response) {
                    trippleKeySearchUserMode = response.result;
                    umValue = trippleKeySearchUserMode.registry || trippleKeySearchUserMode.file || trippleKeySearchUserMode.local || "";
                    conduit.abstractionlayer.commons.storage.getTripleKey(ctid + ".searchUninstallUserMode", function (response) {
                        var trippleKeySearchUninstallUserMode = response.result;
                        umUninstallValue = trippleKeySearchUninstallUserMode.registry || trippleKeySearchUninstallUserMode.file || trippleKeySearchUninstallUserMode.local || "";
                        updateAlistList();
                        conduit.triggerEvent("onReady", { name: "aliasesManager" });
                        var settings = conduit.backstage.serviceLayer.config.toolbarSettings.getSettingsData();

                        webServerUrl = settings.generalData.webServerUrl;
                        apps = settings.apps;
                        updateAbstracrionAliasList(constants.TYPE_MODES.NAVIGATION_URL);
                    });
                });
            });
        }

        catch (e) {
            conduit.abstractionlayer.commons.logging.logError({ errorMessage: 'Failed in coreLibs.aliasesManager.init', errorObject: e });
        }
    }

    //Listeners and Dynamic values
    if (conduit.abstractionlayer.backstage) {
        var absWindows = conduit.abstractionlayer.backstage.windows;

        function setCurrentTab() {
            conduit.abstractionlayer.backstage.tabs.getSelected(currentWindowId, function (response) {
                currentTab = $.extend({}, response.result);
                updateAbstracrionAliasList(constants.TYPE_MODES.TAB);
            });
        }

        absWindows.onFocusChanged.addListener(function (windowId) {
            var newWindowId = typeof (windowId) === 'object' ? windowId.windowId : String(windowId).replace("windowId:", "");

            if (newWindowId !== currentWindowId) {
                currentWindowId = newWindowId;
                setCurrentTab();
            }
        });

        conduit.abstractionlayer.backstage.tabs.onTabActivated.addListener(function (response) {
            setCurrentTab();
        });

        conduit.abstractionlayer.backstage.tabs.onDocumentComplete.addListener(function (response) {
            setCurrentTab();
        });
    }

    absCommons.messages.onTopicMsg.addListener('adv:onSearchTextChanged', function (response) {
        searchTerm = response;
        updateAbstracrionAliasList(constants.TYPE_MODES.SEARCH);
    });

    return {
        constants: constants,
        replaceAliases: replaceAliases,
        setAlias: setAlias,
        init: init
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.coreLibs.aliasesManager,
    dependencies: ["toolbarSettings"],
    onLoad: conduit.coreLibs.aliasesManager.init
});

﻿// Object for measuring performance, to use when debugging.
// Usage:
// var timer = conduit.coreLibs.performance.createTimer("timerName");
// timer.log("first measure");
// timer.log("second measure");
// alert(timer.print()); OR:
// timer.save("myTimer"); <- saves the results to a file in the repository folder.
conduit.register("coreLibs.performance", (function () {
    var timers = {};

    function timer() {
        var logs = [],
                                                self = this;

        this.log = function (title) {
            logs.push({ title: title, time: new Date() });
        }

        this.print = function () {
            if (logs.length < 2)
                return "Not enough data to print timer log";

            var str = "";
            for (var i = 1; i < logs.length; i++) {
                str += logs[i].title + ": " + (logs[i].time - logs[i - 1].time) + "\n";
            }
            return str;
        }

        this.start = function () {
            self.log("START");
        }

        this.save = function (repositoryKeyPrefix) {
            conduit.abstractionlayer.commons.repository.saveData("timer_" + repositoryKeyPrefix + "_" + logs[logs.length - 1].time.valueOf(), this.print());
        }
    }

    return {
        createTimer: function (name, overwrite) {
            if (timers[name] && !overwrite)
                throw new Error("Timer with name \"" + name + "\" already exists.");

            return (timers[name] = new timer());
        },
        deleteTimer: function (name) {
            if (timers[name])
                delete timers[name];
        },
        getTimer: function (name) {
            return timers[name];
        },
        timers: timers
    }
})());
﻿conduit.register("coreLibs.commands", (function () {
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
    var isFF = /Firefox/i.test(browserInfo.type);
    var commandsObj = {
        "UNSHRINK_TOOLBAR": true,
        "SHRINK_TOOLBAR": true,
        "OPTIONS": true,
        "HOMEPAGE": true,
        "ABOUT": true,
        "WEBAPP_COMMAND": true,
        "TOGGLE_COMMAND": true,
        "DO_UPGRADE": isFF ? false : true,
        "REFRESH_TOOLBAR_VIEW": true,
        "DELETE_SEARCH_HISTORY": true,
        "UNINSTALL": true
    }

    function isCommandSupported(command, settings) {
        return isEnabled(command, commandsObj[command], settings);
    }

    function isEnabled(command, supported, settings) {
        if (supported) {
            if (command == "OPTIONS" && (settings.config && settings.config.toolbarOptionsEnabled == false)) {
                return false;
            }
            return true;
        }
        return false;
    }

    return {
        isCommandSupported: isCommandSupported
    }

})());


﻿/* CallMethodQueue Object
*  params (constactor):
*   name : Queue name for debug (string)
*  
*/
conduit.register("coreLibs.CallMethodQueue", function (name) {
    var queue = [];
    var validator = false;
    var _name = name || "";
    /* Add a function to Queue, if release function was called, add will RUN the function.
    *  method: the function to run (Function)
    *  params: function parameters (Array)
    *  extraData: (optional object)
    *   context: the context to run the function in (via apply) (Object)
    *   logInfo: for debug perposes (string)
    */
    function add(method, params, extraData) {
        var context = extraData && extraData.context || null,
            logInfo = extraData && extraData.logInfo || "";
        if (validator) {
            conduit.coreLibs.logger.logDebug(_name + " CallMethodQueue -----------> run, logInfo: " + logInfo);
            //FF ABS functions does not suuport apply method
            Function.prototype.apply.call(method, context, params);
        }
        else {
            conduit.coreLibs.logger.logDebug(_name + " CallMethodQueue -----------> add, logInfo: " + logInfo);
            queue.push({ method: method, params: params, context: context });
        }
    }

    /* release will apply all the functions in queue.
    *  extraData: (optional object)
    *   logInfo: for debug perposes (string)
    */
    function release(extraData) {
        var logInfo = extraData && extraData.logInfo || "";
        validator = true;
        conduit.coreLibs.logger.logDebug(_name + " CallMethodQueue -----------> release, logInfo: " + logInfo);
        for (var i = 0; i < queue.length; i++) {
            currentElement = queue[i];
            Function.prototype.apply.call(currentElement.method, currentElement.context, currentElement.params);
        }
        queue = [];
    }


    return {
        add: add,
        release: release
    }
});
﻿conduit.register("coreLibs.imageCaching", (function () {
    var imagesIndex = 0;
    var directoryImageName = "toolbarImages";
    var resourcesBaseUrlPath = conduit.abstractionlayer.commons.environment.getResourcesBasePathURI().result;
    var absFiles = conduit.abstractionlayer.commons.files;
    var imagesExtentions = ["JPEG", "JFIF", "JPG", "EXIF", "TIFF", "TIF", "RAW", "PNG", "GIF", "BMP", "PPM", "PGM", "PBM", "PNM", "ICO"];
    var FALLBACK_INTERVAL = 45000;
    var FILE_PREFIX = "file";
    var HTTP_PREFIX = "http";
    var imagesHashForIE = {};
    var repository = conduit.abstractionlayer.commons.repository;


    function init() {

    }

    function utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    };

    function toLegalImageName(strText) {
        var ansImageName = strText;
        if (ansImageName.indexOf(FILE_PREFIX) == 0)
            return ansImageName;
        var tmp = 0;
        for (var x = 0; x < ansImageName.length; x++)
            if (strText[x] == '.' && (x != ansImageName.length - 1))
                tmp = x;

        var strEnd = "";
        var strStart = "";
        for (var y = tmp + 1; y < ansImageName.length; y++)
            strEnd = strEnd + ansImageName[y];

        var isIn = false;
        for (var x = 0; x < imagesExtentions.length; x++)
            if (imagesExtentions[x] == strEnd.toUpperCase()) {
                isIn = true;
                break;
            }

        if (isIn) {
            for (var y = 0; y < tmp; y++)
                strStart = strStart + ansImageName[y];
            strStart = strStart.replace(/\.|\\|\/|\:|\*|\?|\&amp\;|\&|\"|\<|\>|\|/g, '_');
            ansImageName = strStart + '.' + strEnd;

            if (strText.length > 160)
                ansImageName = utf8Encode(ansImageName);

            return ansImageName;
        }

        else return null;
    }

    function downloadImage(imageObj, directoryImageName, app, fileName, imagesPath, callback) {
        try {
            conduit.abstractionlayer.commons.http.httpDownloadFile(imageObj.icon, directoryImageName, fileName, 2, function (response) {
                if (response) {
                    if (!response.status) {
                        replaceDataFromObj(app, imageObj.path, imagesPath + fileName);
                    }

                    imagesIndex--;
                    if (imagesIndex == 0) {
                        callback();
                    }
                }
            })
        } catch (e) {
            //TODO: log
        };
    }


    function replaceDataFromObj(obj, path, value, checkFunction) {
        var pathMembers = path.split("."), i;
        for (i = 0; i < pathMembers.length - 1; i++) {
            obj = obj[pathMembers[i]];
        }
        if (!checkFunction || checkFunction(obj[pathMembers[i]], value));
        obj[pathMembers[i]] = value;
    }

    function getImagesFromApp(app) {
        var ans = [];
        if (app.displayIcon && app.displayIcon.indexOf("http") != -1)
            ans.push({ path: "displayIcon", icon: app.displayIcon });

        if (app.viewData && app.viewData.icon && app.viewData.icon.indexOf(HTTP_PREFIX) != -1)
            ans.push({ path: "viewData.icon", icon: app.viewData.icon });
        return ans;
    }

    function handleFallback(callback, data) {
        if (imagesIndex == 0)
            return;
        //if till now not all images finished DL, save at least the current state
        callback(data);
    }

    function saveAndReplaceImagesInSettingsObj(dataToRepository, callback) {
        if (isSafari()) {
            return;
        }
        conduit.abstractionlayer.commons.environment.getResourcesBasePath(function (resourcesBasePath) {
            resourcesBasePath = resourcesBasePath.result;
            absFiles.isDirectoryExists(resourcesBasePath + "\\" + directoryImageName, function (ops) {
                if (!ops.result) {
                    ops = absFiles.createDirectory(resourcesBasePath + "\\" + directoryImageName, function () {
                        saveImages(dataToRepository, resourcesBasePath, callback);
                    });
                }
                else {
                    saveImages(dataToRepository, resourcesBasePath, callback);
                }
            });
        });
    }

    function saveImages(dataToRepository, resourcesBasePath, callback) {
        var app, imageObj, fileName;
        var imagesToDownloadArray = [];
        var needUpdate = false;
        //change main icon

        absFiles.getAllFiles(resourcesBasePath + "\\" + directoryImageName, false, function (allFilesInDir) {
            allFilesInDir = allFilesInDir.result;

            for (var index = 0; index < dataToRepository.apps.length; index++) {
                app = dataToRepository.apps[index];
                var imagesArray = getImagesFromApp(app);
                //if has http images
                if (imagesArray.length > 0) {
                    for (var i = 0; i < imagesArray.length; i++) {
                        imageObj = imagesArray[i];
                        fileName = ((imageObj.icon).indexOf(resourcesBaseUrlPath) != -1) ? imageObj.icon.substr(imageObj.icon.lastIndexOf("/") + 1) : toLegalImageName(imageObj.icon);
                        needUpdate = true;
                        if (allFilesInDir.indexOf(resourcesBasePath + "\\" + directoryImageName + "\\" + fileName) == -1) {
                            imagesIndex++;
                            imagesToDownloadArray.push({ imageObj: imageObj, directoryImageName: directoryImageName, app: app, fileName: fileName, imagesPath: resourcesBaseUrlPath + "/" + directoryImageName + "/" });
                        }
                        else {
                            replaceDataFromObj(app, imageObj.path, resourcesBaseUrlPath + "/" + directoryImageName + "/" + fileName);
                        }
                    }
                }
            }
            var imageToDownload = null;
            for (var i = 0; i < imagesToDownloadArray.length; i++) {
                imageToDownload = imagesToDownloadArray[i];
                downloadImage(imageToDownload.imageObj, imageToDownload.directoryImageName, imageToDownload.app, imageToDownload.fileName, imageToDownload.imagesPath, function () { callback(dataToRepository) });
            }

            if (needUpdate)
                setTimeout(function () { handleFallback(callback, dataToRepository); }, FALLBACK_INTERVAL);
        });
    }

    function getImageUrl(strTemp) {
        strTemp = strTemp.match(/src=\"[^\"]*\"/i);
        strTemp = strTemp[0].substr(5);
        return strTemp.substr(0, strTemp.lastIndexOf("/"));
    }

    function getFileName(url) {
        return url.substring(url.lastIndexOf("/") + 1, url.length);
    }

    function isSafari() {
        return window.safari != null;
    }
    function changeImagePathsToLocal(state, callback) {
        conduit.abstractionlayer.commons.environment.getResourcesBasePath(function (response) {
            var resourcesBasePath = response.result;
            if (isSafari()) {
                callback(state);
                return;
            }
            var strImage, strUrl;
            var imgArr = state.match(/<img\s[^>]*src=["|']http:[^>]*>/ig);
            if (!imgArr) {
                callback(state);
                return;
            }
            absFiles.getAllFiles(resourcesBasePath + "\\" + directoryImageName, false, function (allFilesInDir) {
                allFilesInDir = allFilesInDir.result;
                if (allFilesInDir) {
                    for (var i = 0; i < imgArr.length; i++) {
                        var tmp = imgArr[i];
                        var image = imgArr[i].match(/("|')http:[^("|')]+["|']/ig);
                        if (image && image[0]) {
                            image = image[0];
                            image = image.substring(1, image.length - 1);
                            var strUrl = getImageUrl(imgArr[i]);
                            var strImage = toLegalImageName(image);

                            if (allFilesInDir.indexOf(resourcesBasePath + "\\" + directoryImageName + "\\" + strImage) != -1 && imgArr[i].match(/.png|.jpg|.gif/i)) {                                
                                state = state.replace(image, resourcesBaseUrlPath + "/" + directoryImageName + "/" + strImage);
                            }
                        }

                    }
                }
                callback(state);
            });
        });
    }
    init();
    return {
        saveAndReplaceImagesInSettingsObj: saveAndReplaceImagesInSettingsObj,
        changeImagePathsToLocal: changeImagePathsToLocal
    }

})());
