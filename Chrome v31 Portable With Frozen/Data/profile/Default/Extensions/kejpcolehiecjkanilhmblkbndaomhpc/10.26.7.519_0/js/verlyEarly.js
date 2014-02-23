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

(function () {
    conduit.jasmine = {};
    conduit.jasmine.helpers = {};
})();

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


/* CONST */
var TOOLBAR_HEIGHT = 320; // ABST_ATP_TESTER

//#ifndef NPAPI_TESTER
var TOOLBAR_HEIGHT = 750;
//#endif

//#ifndef ABST_ATP_TESTER
var TOOLBAR_HEIGHT = 35;
//#endif

var contentScript = this.contentScript = {
    'wasInit': false
};

var profileName;
var early = this.early = (function () {
    var mainIframe, aborted = typeof (conduitEnv) !== 'undefined' && conduitEnv.tabInfo && conduitEnv.tabInfo.windowId === -1;

    // Set viewId for global use
    conduitEnv.viewId = Math.random();

    // Init messaging system
    var messaging = messagingBusInit('contentScripts', conduitEnv.viewId);
    var cbsMessages = conduitEnv.cbsMessages = new MessagingReadyWrapper(messaging, Consts.READY_WRAPPER.CHROME_BACKSTAGE);
    var albMessages = conduitEnv.albMessages = new MessagingReadyWrapper(messaging, Consts.READY_WRAPPER.ABS_LAYER_BACK);

    return {
        toolbarPositionTop: null,
        pushTop: TOOLBAR_HEIGHT,
        totalHeight: TOOLBAR_HEIGHT,
        containerIframeId: null,
        wasInit: (window.top !== window ? true : false),

        init: function () {
            // This is part of the implementation for toolbarAPI. local id helps the toolbarAPI know which toolbars need to register as ready and waits for them
            this.uniqueLocalId = Math.floor(new Date() / 1000 % 1 * 1000) + Math.floor(Math.random() * 1000000);
            cbsMessages.onSysReq.addListener('getUniqueLocalId', function (data, sender, callback) {
                if (callback) {
                    callback(uniqueLocalId);
                }
            });

            // Inject the uniqueLocalId for toolbarAPI and save a copy of JSON so webpages can't override it and mess up our code (like cnn.com)
            var script = document.createElement('script');
            script.innerHTML = 'window.conduitSmartBarsLocalIds = window.conduitSmartBarsLocalIds || []; window.conduitSmartBarsLocalIds.push(' + this.uniqueLocalId + ');' +
                'window.conduitCopyOfJSON = window.JSON';

            document.documentElement.appendChild(script);
            document.documentElement.removeChild(script);

            var me = this;

            var contentScriptStarter = function () {
                if (contentScript && contentScript.startContentScript && contentScript.wasInit === false) {
                    contentScript.startContentScript();
                }

                me.wasInit = true;
            };

            this.createToolbar(contentScriptStarter);
        },

        createToolbar: function (callback) {
            var deferred = $.Deferred();

            if (aborted) {
                deferred.reject();
                return deferred;
            }
            var that = this;
            var numberOfToolbars = 1;
            cbsMessages.sendSysReq("getMyTabId", "verlyEarly.js", { getNumberOfToolbars: true }, function (response) {
                numberOfToolbars = response && response.numberOfToolbars ? response.numberOfToolbars : 1;
                chrome.storage.local.set({ "numberOfToolbars": numberOfToolbars });
                if (response) {
                    if (response.turnOffComp) {
                        chrome.storage.local.set({ "compState": "off" });
                    }
                }
            });

            function injectStripToBody() {
                var currentUrl = location.href.toLowerCase();
                if (document.body.tagName.toLowerCase() != "frameset" && ((currentUrl.indexOf('&sat=msp') < 0 && currentUrl.indexOf('?sat=msp') < 0) || (!((currentUrl.indexOf('&sat=msp') > 0 || currentUrl.indexOf('?sat=msp') > 0) && currentUrl.indexOf("?q=") < 0 && currentUrl.indexOf("&q=") < 0)))) {
                    /*
                    Directly position the body to make room for our toolbar.  This may seem redundant
                    with the code above that appends a <style> element to do the same thing, but this
                    takes care of overriding other potentially conflicting style settings directly.
                    */

                    if (!(window.menubar.visible === false && window.statusbar.visible === false)) {
                        if (!document.getElementById("main-iframe-wrapper")) {
                            var getTotalHeight = parseInt(numberOfToolbars, 10) * TOOLBAR_HEIGHT;

                            var mainIframeWrapper = document.createElement("div");
                            mainIframeWrapper.setAttribute("class", "SkipThisFixedPosition main-iframe-wrapper");
                            mainIframeWrapper.setAttribute("id", "main-iframe-wrapper");
                            mainIframeWrapper.setAttribute("style", "display:block !important; width:100%; height:" + getTotalHeight + "px; position:fixed; top:0px; margin:0; padding:0; left:0px; line-height:0; z-index:2147483646;");
                            mainIframeWrapper.setAttribute('background', chrome.extension.getURL('screenShot.png'));
                            document.body.appendChild(mainIframeWrapper);
                        }
                        var extensionId = chrome.extension.getURL("").replace("chrome-extension://", "").replace("/", "");
                        var MainIframes = document.getElementsByClassName("TOOLBAR_IFRAME");
                        var isExist = false;
                        for (var i = 0; i < MainIframes.length; i++) {
                            var iframeExtId = MainIframes[i].getAttribute("extensionId");
                            if (extensionId == iframeExtId) {
                                isExist = true;
                            }
                        }
                        if (!isExist) {
                            //a reference to the body.
                            var body = document.body;
                            // a reference to the main iframe wrapper from the verlyEarly.js.
                            var mainIframeWrapper = document.getElementById('main-iframe-wrapper');
                            var originHandleWidth;
                            var originHandleHeight;
                            var divWrapper;


                            // this is the main toolbar iframe which points to band.htm.
                            mainIframe = window.document.createElement("iframe");
                            mainIframe.setAttribute("class", "TOOLBAR_IFRAME");
                            mainIframeId = conduitEnv.viewId;
                            mainIframe.setAttribute("id", mainIframeId);
                            mainIframe.setAttribute("frameborder", "0");
                            mainIframe.setAttribute("scrolling", "no");
                            mainIframe.setAttribute("extensionId", extensionId);
                            mainIframe.setAttribute("name", JSON.stringify({ profileName: profileName, viewId: conduitEnv.viewId }));
                            //position: absolute new from 12.9 - in order to fix a problem that toolbars switch in places
                            //NOTE: this alias TBHeight is very important - it's being replaced by the ANT for tester. if changed - should also be changed in ANT!!!
                            var TBHeight = '35px';
                            if (toolbarVisibilityState == undefined || toolbarVisibilityState.toolbarShow == undefined) {
                                toolbarVisibilityState = {};
                                toolbarVisibilityState.toolbarShow = true;
                            }
                            if (toolbarVisibilityState && toolbarVisibilityState.toolbarShow !== false) {
                                mainIframeWrapper.style.setProperty("z-index", "2147483646");
                                mainIframe.setAttribute("style", "width:100%;height:" + TBHeight + " !important ;visibility:visible !important; line-height:0; position: absolute;left:0px; border-bottom: 1px solid rgba(0, 0, 0, 0.29687);display:block !important;");
                            } else {
                                mainIframeWrapper.style.setProperty("z-index", "1");
                                mainIframe.setAttribute("style", "width:100%;height:" + 0 + " !important ;visibility:hidden !important; line-height:0; position: absolute;left:0px; border-bottom: 1px solid rgba(0, 0, 0, 0.29687);");
                            }
                            mainIframe.style.setProperty("margin", "0", "important");

                            mainIframe.setAttribute("src", chrome.extension.getURL("frontstage.html"));
                            //#ifndef NPAPI_TESTER
                            mainIframe.setAttribute("src", chrome.extension.getURL("npapiTester.html"));
                            //#endif
                            //#ifndef ABST_ATP_TESTER
                            var frontStageInjectedURL = chrome.extension.getURL("js/iframeHost.html");

                            mainIframe.setAttribute("src", frontStageInjectedURL);
                            cbsMessages.sendSysReq("setViewId", "verlyEarly.js", { viewId: mainIframeId });
                            //#endif

                            if (mainIframeWrapper) {
                                cbsMessages.sendSysReq("cbsToolbarInitializingLogger", "verlyEarly.js", { time: Date.now() }, function () {
                                    albMessages.sendSysReq("toolbarInitializingLogger", "contentSctipt.js", "(@:", function (response) { });
                                });

                                var timestamp = +new Date();
                                var loggerObj = [{ 'from': 'Abs Layer', 'action': 'loading toolbar', 'time': timestamp, 'isWithState': "", 'timeFromStart': 0, 'timeFromPrev': 0}];
                                cbsMessages.sendSysReq("loadingTime", " verlyEarly.js ", { data: JSON.stringify(loggerObj) }, function (ans) { });
                                mainIframeWrapper.appendChild(mainIframe);

                            } else {
                                console.error("NO MAIN IFRAME WRAPPER IN DOCUMENT " + document.location);
                            }

                            if (!document.getElementById('mainContainerSB_CTID')) {
                                // Adding only if the fixed div doesn't exist.
                                //fixedDivContainer - Adding a fixed div to act as a container for popups
                                var maincontainerDiv = document.createElement("div");
                                maincontainerDiv.setAttribute('id', 'mainContainerSB_CTID');
                                maincontainerDiv.setAttribute('style', 'width:100%;');
                                maincontainerDiv.style.setProperty("display", "block", "important");

                                var fixedDivContainer = document.createElement("div");
                                fixedDivContainer.setAttribute('id', 'popupsFixedDiv');
                                fixedDivContainer.className = 'popupsFixedDivClass SkipThisFixedPosition';
                                maincontainerDiv.appendChild(fixedDivContainer);
                                document.body.appendChild(maincontainerDiv);
                            }

                            //Add css to fixed container div
                            document.getElementById('popupsFixedDiv').setAttribute('style', 'left:0px; height:0px; top:0px; z-index:2147483646; position:fixed; overflow:visible;');
                            //get CTID and show/hide toolbar
                            // Since BG is now loaded after FS.
                            cbsMessages.onSysReq.addListener('InformCTIDToCS', function (data, sender, callback) {
                                //console.error("GOT CTID FROM BG: ", data);
                                if (data) {
                                    ctid = data;
                                    mainIframe.setAttribute('ctid', ctid);
                                    // fixedid is a property used by automation
                                    mainIframe.setAttribute('fixedid', 'TOOLBAR_IFRAME-' + ctid);
                                }
                            });

                            //NOTE: this setTimeout is bug fix - should be removed  - was added because the listener is not registered yet
                            var isMsgBack = false;
                            var handleMutiToolbars = function (objPlacement, cameFromEvent) {
                                if (!cameFromEvent) {
                                    if (isMsgBack) { return; }
                                    isMsgBack = true;
                                }
                                setTimeout(function () {


                                    var allIframes = document.getElementsByClassName('TOOLBAR_IFRAME');
                                    var currIframeObj;
                                    for (var i = 0; i < allIframes.length; i++) {
                                        if (mainIframeId == allIframes[i].getAttribute("id")) {
                                            var placement = objPlacement && objPlacement.result && objPlacement.result.placement ? objPlacement.result.placement : 0;
                                            var numberOfOldToolbars = objPlacement && objPlacement.result && objPlacement.result.numberOfOldToolbars ? objPlacement.result.numberOfOldToolbars : 0;
                                            var toolbarPlacementAfterOldToolbarsCalculation = (numberOfOldToolbars === 0) ? placement : (placement - numberOfOldToolbars >= 0 ? placement - numberOfOldToolbars : 0);
                                            var numberOfShownToolbars = objPlacement.result.numberOfShownToolbars;

                                            allIframes[i].style.setProperty("top", toolbarPlacementAfterOldToolbarsCalculation * Consts.CONTENT_SCRIPT.TOOLBAR_HEIGHT + "px", "important");

                                            currIframeObj = allIframes[i];
                                            var divHeight = numberOfShownToolbars * Consts.CONTENT_SCRIPT.TOOLBAR_HEIGHT;
                                            allIframes[i].parentNode.style.setProperty('height', divHeight + 'px');
                                            if (numberOfOldToolbars > 0 && allIframes[i].parentNode) {
                                                // old toolbars are 34px
                                                allIframes[i].parentNode.style.setProperty("top", numberOfOldToolbars * 34 + "px", "important");
                                            }
                                        }
                                    }
                                    var currIframeObjTop = currIframeObj.style.getPropertyValue('top');
                                    var numberOfToolbars = 0;
                                    var maxTop = 0;
                                    var topNeedToBeFixed = false;
                                    if (currIframeObj.style.visibility != "hidden") {
                                        for (var i = 0; i < allIframes.length; i++) {
                                            if (mainIframeId != allIframes[i].getAttribute("id") && (allIframes[i].parentNode.getAttribute("class").indexOf("main-iframe-wrapper") != -1)) {
                                                if (maxTop < parseInt(allIframes[i].style.getPropertyValue('top'))) {
                                                    maxTop = parseInt(allIframes[i].style.getPropertyValue('top'));
                                                }
                                                if (allIframes[i].style.getPropertyValue('top') === currIframeObjTop) {
                                                    topNeedToBeFixed = true;
                                                }
                                                if (allIframes[i] && allIframes[i].id && allIframes[i].id.indexOf('0.') > -1) {
                                                    if (window.getComputedStyle(allIframes[i]).getPropertyValue('height') === "35px") {
                                                        numberOfToolbars++;
                                                    }
                                                }
                                            }

                                        }
                                        if (topNeedToBeFixed) {
                                            currIframeObj.style.setProperty("top", (maxTop + Consts.CONTENT_SCRIPT.TOOLBAR_HEIGHT) + "px", "important");
                                        }
                                    } else {
                                        /*backward compatbility with smartbars after installation the SB is added to the end of the list
                                        and i am fixing the list in the chrome backstage but i don't now waht toolbar loads first.
                                        this checks that the top of the hidden TB is less the the SB installed0
                                        */
                                        setTimeout(function () {
                                            var allIframes = document.getElementsByClassName('TOOLBAR_IFRAME');
                                            for (var i = 0; i < allIframes.length; i++) {
                                                if (mainIframeId != allIframes[i].getAttribute("id") && allIframes[i].style.visibility != "hidden") {
                                                    var iframeTop = parseInt(allIframes[i].style.top);
                                                    if (iframeTop > parseInt(currIframeObjTop)) {
                                                        var newTop = iframeTop - Consts.CONTENT_SCRIPT.TOOLBAR_HEIGHT;
                                                        allIframes[i].style.removeProperty("top");
                                                        allIframes[i].style.setProperty("top", newTop + "px", "important");
                                                    }
                                                }
                                            }
                                        }, 700)
                                    }

                                }, 1);
                            };

                            chrome.storage.onChanged.addListener(function onChanged(changes) {
                                if (changes && changes["extensionListRead"]) {
                                    console.log("very Early extenion list changed update view");
                                    cbsMessages.sendSysReq('injectTBReady', 'veryErly', 'veryErly', function (objPlacement) {
                                        handleMutiToolbars(objPlacement,true);
                                    });
                                }
                            });
                            setTimeout(function () {
                                //for first time the page loads (backstage loads later)


                                cbsMessages.onSysReq.addListener('injectTBReadyFirstTime', function (data, sender, callback) {
                                    //// conduit.abstractionlayer.commons.logging.logError('contentscript injectTBReadyFirstTime 1:  data ' + data);
                                    handleMutiToolbars(data);
                                });

                                var numRetries = 0, waitTimer = setTimeout(function waitForInjectTBReady() {
                                    if (numRetries++ < 40) {
                                        waitTimer = setTimeout(waitForInjectTBReady, 500);
                                    }

                                    //for every time the page loads but not the first time (backstage loads later)
                                    cbsMessages.sendSysReq('injectTBReady', 'veryErly', 'veryErly', function (objPlacement) {
                                        clearTimeout(waitTimer);
                                        //// conduit.abstractionlayer.commons.logging.logError('contentscript injectTBReady 2:  objPlacement ' + objPlacement);
                                        handleMutiToolbars(objPlacement);
                                    });
                                }, 500);
                            }, 1);
                        }

                    }

                }
                else {
                    console.error("We don't handle pages with framesets yet");
                }

                if (conduitEnv.fireToolbarInjected) {
                    conduitEnv.fireToolbarInjected();
                }

                if (callback) {
                    callback();
                }

            }

            function waitForBody() {
                var def = $.Deferred();
                conduitEnv.onLoadSequenceMark(function () {
                    def.resolve();
                }, 'body', true);

                return def;
            }

            function waitForValue(val) {
                var def = $.Deferred();

                var fallback = setTimeout(function () {
                    def.reject();
                }, 10000);

                var valFound = function (name) {
                    def.resolve(name);
                    clearTimeout(fallback);
                }

                chrome.storage.local.get([val], function (res) {
                    if (res[val]) {
                        valFound(res[val]);
                    } else {
                        var calledOnce;
                        chrome.storage.onChanged.addListener(function onChanged(changes, areaName) {
                            if (!calledOnce && changes && changes[val]) {
                                calledOnce = true;
                                valFound(changes[val].newValue);
                                chrome.storage.onChanged.removeListener(onChanged);
                            }
                        });
                    }
                });

                return def;
            }

            var waitForProfile = waitForValue("profileName");
            waitForProfile.then(function success(pname) {
                profileName = pname || 'Default';
            }, function fail() {
                profileName = 'Default';
            });
            var extensionId = chrome.i18n.getMessage("@@extension_id");
            var keyName = extensionId + "startAsHidden";
            $.when(waitForProfile, waitForValue(keyName), waitForBody()).then(injectStripToBody, injectStripToBody);
        },

        abortToolbar: function () {
            aborted = true;
            if (mainIframe) {
                var parent = mainIframe.parentNode;
                parent.removeChild(mainIframe);
                if (!parent.getElementsByClassName('TOOLBAR_IFRAME').length) {
                    parent.parentNode.removeChild(parent);
                }
            }
        }
    }
} ());

// fire function
early.init();

//****  Filename: browserContinaerEventsListener.js
//****  FilePath: main/js/
//****
//****  Author: Uri W.
//****  Date: 03.07.11
//****  Class Name: N/A
//****  Description: Injected into every page and iframe - checks anchor ('#') if the page is a browser container.
//****  If it is - listens in on the page loaded events and sends a message when the Browser Container is loaded.
//****
//****  Copyright: Realcommerce & Conduit.
//****

(function () {
    //#ifdef DBG
    try {
        //#endif

        //Alias
        var Messages = conduitEnv.cbsMessages;
        var anchorString = conduit.abstractionlayer.utils.anchorString;
        var tabId = null;

        var getBrowserIdFromWinName = function () {
            return window && window.name && window.name.indexOf(Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX) == 0 ? window.name.substr(Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX.length, window.name.length) : '';
        };

        // Parsing hash string and checking for isBrowserContainer key.
        var isBrowserContainerHashMarkerPresent = function () {
            return window && window.name && window.name.indexOf(Consts.BROWSER_CONTAINER.BROWSER_CONTAINER_ID_PREFIX) == 0 ? true : false;
        };

        // Browser Container Window.onload handler (when all images are loaded)
        var BCWindowLoadEvent = function () {
            var objData = {
                'bcId': getBrowserIdFromWinName()
            };

            //Convert object to string.
            var strData = JSON.stringify(objData);
            Messages.sendSysReq(Consts.BROWSER_CONTAINER.REQUESTS.BC_WINDOW_LOADED, 'browserContainerEventListener.js', strData, function (response) { });
        };

        // Browser Container Document Ready handler (when DOM is ready).
        var DOMContentLoaded = function () {
            var objData = {
                'bcId': getBrowserIdFromWinName()
            };

            //Convert object to string.
            var strData = JSON.stringify(objData);
            Messages.sendSysReq(Consts.BROWSER_CONTAINER.REQUESTS.BC_DOCUMENT_COMPLETE, 'browserContainerEventListener.js', strData, function (response) { });
        };

        // Adds Document Loaded and Window.load event handlers to Browser Container page
        var addBrowserContainerEventListeners = function () {
            Messages.sendSysReq("getMyTabId", function (result) {
                tabId = result.tabId;

                window.addEventListener(Consts.BROWSER_CONTAINER.WINDOW_LOAD_EVENT, function () { BCWindowLoadEvent(); }, false);
                document.addEventListener(Consts.BROWSER_CONTAINER.DOM_CONTENT_LOADED, DOMContentLoaded, false);
            });
        };

        var init = function () {
            if (isBrowserContainerHashMarkerPresent()) {
                addBrowserContainerEventListeners();
            }
        };

        init();
        //#ifdef DBG
    }
    catch (e) {
        console.error('Exception in ' + '[Browser Container]' + ' class: ', e.stack ? e.stack.toString() : e.toString());
    }
    //#endif
})();
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
