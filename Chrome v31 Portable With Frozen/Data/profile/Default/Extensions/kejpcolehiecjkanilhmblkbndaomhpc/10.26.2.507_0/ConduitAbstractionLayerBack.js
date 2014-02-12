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
var globalProfileName = window.top.globalProfileName;

// All backstage pages have the same 'window.top'. Using only one conduit abstraction layer in BG pages.
if (window.top && window.top.conduit) {
    conduit = window.top.conduit;
}
else  {
    


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
conduit.register("abstractionlayer.backstage.nmWrapper", new function () {


    var eventListenersHash = {}; //contains has with key- event name value createListenerProxy - contains the handles of this events

    /*proxy object that ceated perEvent name and contains the handlers for this event*/
    var createListenerProxy = function (eventName) {
        var handlers = {};
        var counter = 0;
        return {
            listen: function (_handler) {
                counter++;
                handlers[counter] = _handler;
                return counter;

            },
            handle: function (data) {
                for (var key in handlers) {
                    if (handlers.hasOwnProperty(key)) {
                        if (handlers[key])
                            handlers[key].call(undefined,data);
                    }
                }
            },
            remove: function (id) {
                delete handlers[id];
            }
        };
    };


    var sendMessage = function (data, callback) {
        window.top.nativeMsgComm.sendMessage(data, callback);
    }

    //Validate string parameter
    var invalidStringParam = function (val) {
        return (!val || typeof (val) != typeof ("") || val.length == 0);
    };

    //Validate function parameter
    var invalidHandlerParam = function (val) {
        return (!val || typeof (val) != 'function');
    };

    var addListener = function (eventName, callback) {

        if (invalidStringParam(eventName)) {
            return Errors.get(1900);
        }
        if (invalidHandlerParam(callback)) {
            return Errors.get(1901);
        }
        if ((eventName in eventListenersHash) === false) {
            eventListenersHash[eventName] = createListenerProxy(eventName);
        }
        var id = eventListenersHash[eventName].listen(callback);
        return { status: 0,
            description: "",
            result: id
        };
    };


    var removeListner = function (eventName, id) {
        if (invalidStringParam(eventName)) {
            return Errors.get(1900);
        }
        if (invalidStringParam(id)) {
            return Errors.get(1900);
        }
        if ((eventName in eventListenersHash)) {
            eventListenersHash[eventName].remove(id);
        }
    }


    var init = function () {
        /*onNotification is fired on every event fired from c++ */
        window.top.nativeMsgComm.onNotification = function (dataObj) {
            if (dataObj.target) {
                if ((dataObj.target in eventListenersHash)) {
                    eventListenersHash[dataObj.target].handle(dataObj.data);
                }
            }

        }
    }

    var getHostState = function () {
        return window.top.nativeMsgComm.getHostState();
    }

    init();
    return {
        sendMessage: sendMessage,
        addListener: addListener,
        removeListner: removeListner,
        getHostState: getHostState
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

//****  Filename: bundleDataInit.back.js
//****  FilePath: main/js/init
//****
//****  Author: Uri Weiler
//****  Date: 26.10.11
//****  Class Name: conduit.abstractionlayer.backstage.bundleDataInit
//****  Type: Static
//****  Description: Reads bundleData from initData.json file on startup.
//****
//****  Inherits from: N/A
//****
//****  Usage: read anything you need from bundleDataInit.
//****
//****  Copyright: Realcommerce & Conduit.
//****

// Static class - runs only once in backstage.
if (/\/(SERVICES\.HTML)$/.test(document.location.href.toUpperCase())) {
    conduit.register("conduit.abstractionlayer.backstage.bundleDataInit", new function () {
        // Aliases
        var Repository = conduit.abstractionlayer.commons.repository;

        // Variables
        var initData = {};

        /**
        @description - ajax request to get the initData.json file from the extension dir. (PRIVATE)
        @function getInitDataFileAsJSON
        @returns {Object} - Config. (initData.json) file as a JSON object.
        **/
        var getInitDataFileAsJSON = function (configFileUrl) {
            var configFileObject = {};
            try {
                var ajaxResponse = $.ajax({
                    url: configFileUrl,
                    type: 'GET',
                    cache: false,
                    async: false,
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.error("ERROR Getting initData file: ", configFileUrl, " from extension dir.!");
                        throw errorThrown;
                    }
                });

                configFileObject = JSONstring.toObject(ajaxResponse.responseText);
            } catch (e) {
                console.error(e);
            }

            return configFileObject;
        };

        /**
        @description - checks for bundle data fields and performs the logic with them.
        @function parseBundleData
        **/
        var parseBundleData = function (initData) {
            if (initData && initData.bundleData) {
                var bundleData = initData.bundleData;

                // Logic on bundleData fields...
                if (typeof bundleData.silentInstall !== 'undefined' && typeof initData.Ctid !== 'undefined') {
                    if (typeof bundleData.silentInstall === 'boolean') {
                        bundleData.silentInstall = bundleData.silentInstall ? "true" : "false";
                    }

                    // openThankYouPage is the opposite of silentInstall.
                    Repository.setKey(initData.Ctid + ".openThankYouPage", bundleData.silentInstall === "true" ? "false" : "true");
                }
            }
        };

        /**
        @description Initializes initData variable.
        @function init
        **/
        var init = function () {
            var configFileUrl = chrome.extension.getURL("initData.json");
            initData = getInitDataFileAsJSON(configFileUrl);
            parseBundleData(initData);
        };

        init();

        return {
            getInitDataFileAsJSON: getInitDataFileAsJSON
        };
    });
}
/**
* @fileOverview singeltone - generates uniqe guid
* FileName :  guid.back.js
* FilePath : ../src/main/js/guid/guid.back.js
* Date : 11/22/2010 16:19:22 AM
* Copyright: Realcommerce & Conduit.
* @author tomerr
* last checking date: 27/06/2011 11:42:00 AM
*/

conduit.register("abstractionlayer.backstage.guid", new function () {
    /********************PUBLIC FUNCTIONS*********************/
    var generate = function () {
        /// <summary>Generates guid according to rfc4122 version 4 - see http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript</summary>
        var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return { result: guid, status: 0, description: '' };
    };

    /********************EXPOSED FUNCTIONS*********************/
    return {
        generate: generate
    };
});
var Guid = conduit.abstractionlayer.backstage.guid;

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

try {
    var doesMultiToolbarsHandlerExist = false;
    var myCtid = '';
    //HANDLER FOR MULTI TOOLBARS
    conduit.register("abstractionlayer.backstage.multiToolbarsHandler", (function () {
        var Repsitory = conduit.abstractionlayer.commons.repository;
        var Environment = conduit.abstractionlayer.commons.environment;
        var Messages = conduit.abstractionlayer.commons.messages;
        var isFirstTime = true;

        var Consts = {
            extensionsList: 'extensionsList', //[{key: extId, ctid: CTXXX, state: shown/hidden, generation: old/sb, enabled: true/false}, {}]
            webToolbarNameIdentifier: 'Delivers all our best apps to your browser.',
            webToolbarsCounterKey: 'webToolbarsCounter',
            notImportant: 'notImportant',
            shownToolbarsOrder: 'shownToolbarsOrder',
            webToolbarsHiddenCounterKey: 'webToolbarsHiddenCounterKey'
        };

        Messages.onSysReq.addListener('getExtensionsListKey', function (data, sender, callback) {
            var obj = {};
            obj.status = 0;
            obj.description = "";
            obj.result = localStorage.getItem("extensionsList");
            callback(JSON.stringify(obj));
        });


        var obj = {};
        obj.status = 0;
        obj.description = "";
        obj.result = localStorage.getItem("extensionsList");
        Messages.sendSysReq('getExtensionsListKeyFirstTime', 'multiTBBack', JSON.stringify(obj), function () { });

        var extensionObjConstractor = function (extId, ctid, state, generation, enabled) {
            return { key: extId, ctid: ctid, state: state, generation: generation ? generation : 'sb', enabled: enabled.length > 0 && enabled != null ? enabled : true };
        };

        var getArrayFromKey = function (strCurrentKey) {
            var arrExtensions = new Array();
            try {
                var arrExtsJsons = strCurrentKey.split(",");
                for (var i = 0; i < arrExtsJsons.length; i++) {
                    var objCurrExt = JSONstring.toObject(unescape(arrExtsJsons[i]));
                    if (objCurrExt) {
                        arrExtensions.push(objCurrExt);
                    }
                }
            } catch (e) { console.error('Error in multi toolbars handler parsing key ', e) };
            return arrExtensions;
        };

        var addExtObjToList = function (objExtension) {
            if (!objExtension) {
                return;
            }

            var strCurrentKey = localStorage.getItem("extensionsList");

            //no key in registry
            if (!strCurrentKey) {
                //conduit.abstractionlayer.commons.logging.logError('SET KEY 1:  ' + escape(JSON.stringify(objExtension)));
                Repsitory.setGlobalKey(Consts.extensionsList, escape(JSON.stringify(objExtension)), function () {
                    console.log("set LS extensionsList key multiHandlersBack.js ->addExtObjToList");
                    localStorage.setItem("extensionsList", escape(JSON.stringify(objExtension)));
                    chrome.storage.local.set({ "extensionListRead": new Date().getTime() }, function () { });
                });
            }

            //key in registry
            else {
                var isExtensionAlreadyExist = false;
                var isNeedToBeDeletedAndReRegInEnd = false;
                var isNeedToBeUpdated = false;
                var arrExtensions = getArrayFromKey(strCurrentKey);

                for (var counter = 0; counter < arrExtensions.length; counter++) {
                    if (arrExtensions[counter] && arrExtensions[counter].key && arrExtensions[counter].key == objExtension.key) {
                        isExtensionAlreadyExist = true;
                        //states  in the same place in the reg
                        if (arrExtensions[counter].ctid && arrExtensions[counter].ctid == objExtension.ctid) {
                            if (arrExtensions[counter].state && arrExtensions[counter].state != objExtension.state) {
                                arrExtensions[counter].state = objExtension.state;
                                isNeedToBeUpdated = true;
                            }
                            if (arrExtensions[counter].generation && arrExtensions[counter].generation != objExtension.generation) {
                                arrExtensions[counter].generation = objExtension.generation;
                                isNeedToBeUpdated = true;
                            }
                            if (arrExtensions[counter].enabled && arrExtensions[counter].enabled != objExtension.enabled) {
                                arrExtensions[counter].enabled = objExtension.enabled;
                                isNeedToBeUpdated = true;
                            }
                        }
                        //not the same ctid -> moves to last
                        else {
                            isNeedToBeDeletedAndReRegInEnd = true;
                        }
                    }
                }

                var addExtensionInTheEnd = function () {
                    //conduit.abstractionlayer.commons.logging.logError('SET KEY 2:  ' + (strCurrentKey ? strCurrentKey + "," : "") + escape(JSON.stringify(objExtension)));
                    var val = (strCurrentKey ? strCurrentKey + "," : "") + escape(JSON.stringify(objExtension));
                    Repsitory.setGlobalKey(Consts.extensionsList, val, function () {
                        localStorage.setItem("extensionsList", val);
                        chrome.storage.local.set({ "extensionListRead": new Date().getTime() }, function () { });
                    });
                };

                //extension not in list
                if (!isExtensionAlreadyExist) {
                    addExtensionInTheEnd();
                }
                //extension in list
                else {
                    //ctid changed - ext needs to be deleted and rewritten
                    if (isNeedToBeDeletedAndReRegInEnd) {
                        removeExtObjToList(objExtension.key);
                        //get the new key
                        var strCurrentKey = localStorage.getItem("extensionsList");
                        addExtensionInTheEnd();
                    }
                    //ctid is the same - ext needs to be updated with state/generation
                    if (isNeedToBeUpdated) {
                        //arrExtensionsFromMemory is already updated
                        var strNewKey = '';
                        for (var i = 0; i < arrExtensions.length; i++) {
                            strNewKey += (strNewKey ? "," : "") + escape(JSON.stringify(arrExtensions[i]));
                        }
                        Repsitory.setGlobalKey(Consts.extensionsList, strNewKey, function () {
                            localStorage.setItem("extensionsList", strNewKey);
                            chrome.storage.local.set({ "extensionListRead": new Date().getTime() }, function () { });
                        });
                    }
                }
            }
        };

        var removeExtObjToList = function (extensionId) {
            if (!extensionId) {
                return;
            }

            var strCurrentKey = localStorage.getItem("extensionsList");
            var arrExtensions = getArrayFromKey(strCurrentKey);

            for (var counter = 0; counter < arrExtensions.length; counter++) {
                if (arrExtensions[counter] && arrExtensions[counter].key && arrExtensions[counter].key == extensionId) {
                    delete arrExtensions[counter];

                    var strNewKey = '';
                    for (var i = 0; i < arrExtensions.length; i++) {
                        if (arrExtensions[i]) {
                            strNewKey += (strNewKey ? "," : "") + escape(JSON.stringify(arrExtensions[i]));
                        }
                    }

                    Repsitory.setGlobalKey(Consts.extensionsList, strNewKey, function () {
                        localStorage.setItem("extensionsList", strNewKey);
                        chrome.storage.local.set({ "extensionListRead": new Date().getTime() }, function () { });
                    });

                    break;
                }
            }
        };

        var changeExtObjProperty = function (extensionId, propertyName, newProperty) {

            var strCurrentKey = localStorage.getItem("extensionsList");
            var arrExtensions = getArrayFromKey(strCurrentKey);
            var shownCounter = 0;
            var webToolbarsCounter = 0;
            var webToolbarsHiddenCounter = 0;


            for (var counter = 0; counter < arrExtensions.length; counter++) {
                if (arrExtensions[counter] && arrExtensions[counter].key && arrExtensions[counter].key == extensionId) {
                    if (arrExtensions[counter][propertyName] != null && arrExtensions[counter][propertyName] != newProperty) {
                        arrExtensions[counter][propertyName] = newProperty;
                        var strNewKey = '';
                        var keyToAddAtEnd;
                        for (var i = 0; i < arrExtensions.length; i++) {
                            if (arrExtensions[i] && arrExtensions[i].key != extensionId) {
                                strNewKey += (strNewKey ? "," : "") + escape(JSON.stringify(arrExtensions[i]));
                            } else {
                                keyToAddAtEnd = i;
                            }
                            if (propertyName == 'enabled') {
                                shownCounter += arrExtensions[i].enabled && arrExtensions[i].generation == 'sb' ? 1 : 0;
                                webToolbarsCounter += arrExtensions[i].enabled && arrExtensions[i].generation == 'old' ? 1 : 0;
                                webToolbarsHiddenCounter += !arrExtensions[i].enabled && arrExtensions[i].generation == 'old' ? 1 : 0;
                            }
                        }
                        if (keyToAddAtEnd) {
                            strNewKey += (strNewKey ? "," : "") + escape(JSON.stringify(arrExtensions[keyToAddAtEnd]));
                        }
                        Repsitory.setGlobalKey(Consts.extensionsList, strNewKey, function () {
                            localStorage.setItem("extensionsList", strNewKey);
                            chrome.storage.local.set({ "extensionListRead": new Date().getTime() }, function () { });
                        });
                        if (propertyName == 'enabled') {
                            chrome.storage.local.set({ "BSshownToolbarsOrder": shownCounter, "BSwebToolbarsCounter": webToolbarsCounter, "BSwebToolbarsHiddenCounterKey": webToolbarsHiddenCounter });
                        }
                        else { console.error('Error in changeExtObjProperty: no npi'); }
                        break;
                    }
                }
            }
        };

        var changeExtObjState = function (extensionId, newState) {
            changeExtObjProperty(extensionId, 'state', newState);
        };

        var changeExtObjCTID = function (extensionId, newCTID) {
            changeExtObjProperty(extensionId, 'ctid', newCTID);
        };

        var changeExtObjGeneration = function (extensionId, newGeneration) {
            changeExtObjProperty(extensionId, 'generation', newGeneration);
        };

        var changeExtObjEnabled = function (extensionId, newEnabled) {
            changeExtObjProperty(extensionId, 'enabled', newEnabled);
            /*if (!newEnabled) {
            changeExtObjProperty(extensionId, 'state', 'hidden');
            }*/
        };

        var init = function () {
            try {
                // Running listener collection only in backstage.html because there should only be one
                if (!doesMultiToolbarsHandlerExist) {
                    doesMultiToolbarsHandlerExist = true;

                    chrome && chrome.management && chrome.management.onDisabled && chrome.management.onDisabled.addListener(function (extensionInfo) {
                        changeExtObjEnabled(extensionInfo.id, extensionInfo.enabled);
                    });

                    chrome && chrome.management && chrome.management.onEnabled && chrome.management.onEnabled.addListener(function (extensionInfo) {
                        changeExtObjEnabled(extensionInfo.id, extensionInfo.enabled);
                    });

                    //NOTE: every toolbar that loads checks which other toolbars exist - if a toolbar as been deleted not always we get notified on it
                    //NOTE: if chrome will have "on before uninstall" - it should be handled by that 
                    var isArrChanged = false;
                    var shownCounter = 0;
                    var webToolbarsCounter = 0;
                    var webToolbarsHiddenCounter = 0;

                    chrome && chrome.management && chrome.management.getAll(function (arrExtensionInfo) {
                        var strCurrentKey = localStorage.getItem("extensionsList");
                        var arrExtensionsFromMemory = [];
                        if (strCurrentKey) {
                            arrExtensionsFromMemory = getArrayFromKey(strCurrentKey);
                        }

                        //no key
                        if (arrExtensionsFromMemory.length == 0) {
                            var extensionId = chrome.i18n.getMessage("@@extension_id");
                            var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
                            arrExtensionsFromMemory.push(extensionObjConstractor(extensionId, ctid, 'shown', 'sb', true));
                            isArrChanged = true;
                        }
                        else {

                            //delete removed extensions
                            for (var j = 0; j < arrExtensionsFromMemory.length; j++) {
                                var isFound = false;
                                for (var i = 0; i < arrExtensionInfo.length; i++) {
                                    if (arrExtensionInfo[i].id == arrExtensionsFromMemory[j].key) {
                                        if (arrExtensionInfo[i].enabled != arrExtensionsFromMemory[j].enabled) {
                                            arrExtensionsFromMemory[j].enabled = arrExtensionInfo[i].enabled;
                                            isArrChanged = true;
                                        }
                                        isFound = true;
                                        shownCounter += arrExtensionsFromMemory[j].enabled && arrExtensionsFromMemory[j].generation == 'sb' ? 1 : 0;
                                        webToolbarsCounter += arrExtensionsFromMemory[j].enabled && arrExtensionsFromMemory[j].generation == 'old' ? 1 : 0;
                                        webToolbarsHiddenCounter += !arrExtensionsFromMemory[j].enabled && arrExtensionsFromMemory[j].generation == 'old' ? 1 : 0;
                                    }

                                }
                                //extension doesn't exists any more - delete it
                                if (!isFound) {
                                    delete arrExtensionsFromMemory[j];
                                    isArrChanged = true;
                                }
                            } //for

                            //add old toolbar if it's new
                            for (var a = 0; a < arrExtensionInfo.length; a++) {
                                //if its an old toolbar 
                                if (arrExtensionInfo[a].description == Consts.webToolbarNameIdentifier) {
                                    var isOldToolbarFound = false;
                                    for (var b = 0; b < arrExtensionsFromMemory.length; b++) {
                                        if (arrExtensionsFromMemory[b] && arrExtensionInfo[a].id == arrExtensionsFromMemory[b].key) {
                                            isOldToolbarFound = true;
                                        }
                                    }


                                    if (!isOldToolbarFound) {
                                        var productId = 'productId=';
                                        var prefixIndex = arrExtensionInfo[a].updateUrl && arrExtensionInfo[a].updateUrl.indexOf(productId) > -1 ? arrExtensionInfo[a].updateUrl.indexOf(productId) + productId.length : -1;
                                        var postfixIndex = -1;
                                        if (prefixIndex > -1) {
                                            var updateUrl = arrExtensionInfo[a].updateUrl.substr(prefixIndex);
                                            postfixIndex = updateUrl.indexOf('&') > -1 ? updateUrl.indexOf('&') : -1;
                                        }
                                        var myCtid = prefixIndex > -1 && postfixIndex > -1 ? updateUrl.substr(0, postfixIndex) : 'ctDummy';
                                        arrExtensionsFromMemory.push(extensionObjConstractor(arrExtensionInfo[a].id, myCtid, 'shown', 'old', arrExtensionInfo[a].enabled));
                                        isArrChanged = true;
                                    }



                                }
                            }
                        }
                        if (isArrChanged) {
                            var strNewKey = '';
                            for (var i = 0; i < arrExtensionsFromMemory.length; i++) {
                                if (arrExtensionsFromMemory[i] && arrExtensionsFromMemory[i].key) {
                                    strNewKey += (strNewKey ? "," : "") + escape(JSON.stringify(arrExtensionsFromMemory[i]));
                                }
                            }
                            //conduit.abstractionlayer.commons.logging.logError('SET KEY 6:  ' + strNewKey);
                            Repsitory.setGlobalKey(Consts.extensionsList, strNewKey, function () {
                                localStorage.setItem("extensionsList", strNewKey);
                                chrome.storage.local.set({ "extensionListRead": new Date().getTime() }, function () { });
                            });
                        }


                        //conduit.abstractionlayer.commons.logging.logError('SET 1:  ' + shownCounter);
                        chrome.storage.local.set({ "BSshownToolbarsOrder": shownCounter, "BSwebToolbarsCounter": webToolbarsCounter, "BSwebToolbarsHiddenCounterKey": webToolbarsHiddenCounter });

                    });


                    strGotCallbackFromCTID = "";
                }
            } catch (e) { console.error('Error in multi toolbars handler init: ', e); }
        };
        init();

        return {
            extensionObjConstractor: extensionObjConstractor,
            addExtObjToList: addExtObjToList,
            removeExtObjToList: removeExtObjToList,
            changeExtObjState: changeExtObjState,
            changeExtObjCTID: changeExtObjCTID,
            changeExtObjGeneration: changeExtObjGeneration,
            changeExtObjEnabled: changeExtObjEnabled
        }
    } ()));
} catch (e) {
    console.error('Exception in backStage' + 'multi toolbar' + ' class: ', e.stack ? e.stack.toString() : e.toString());
}

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

//****  Filename: idle.common.js
//****  FilePath: main/js/idle
//****
//****  Author: Hezi.Abrass
//****  Date: 19.07.11
//****  Class Name: conduit.abstractionlayer.commons.idle
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
    var Messages = conduit.abstractionlayer.commons.messages; // alias
    var _threshold = 15;

    var init = function () {
        //Listener
        Messages.onSysReq.addListener('idle_onChangeState', function (request, sender, callback) {
            try {
                //Convert string to object.
                var req = JSON.parse(request);
                onChangeState(req.threshold, callback);
            }
            catch (e) {
                console.error("Error in Idle backstage listeners", e);
            }
        });
    };
    init();

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
                _threshold = threshold;
                chrome.idle.onStateChanged.addListener(function (newState) {
                    var result = { 'state': newState };
                    callback(result);
                    return Errors.get(1);
                });
                checkState();
                return (Errors.get(1));
            } catch (tabError) {
                callback(Errors.get(0));
            }
        }
        //#endregion
    };

    var CHECK_STATE_INTERVAL = 15000;

    var checkState = function () {
        if (chrome && chrome.idle && chrome.idle.queryState) {
            // Request the state based off of the user-supplied threshold.
            chrome.idle.queryState(_threshold, function (state) {
            });
        }

        setTimeout(checkState, CHECK_STATE_INTERVAL);
    };

    if (document.location.href.toUpperCase().indexOf("/\BACKSTAGE.HTML") > -1 || document.location.href.toUpperCase().indexOf("/BACKSTAGE.HTML") > -1)
    {
        // Check every 15 seconds (minimum idle threshold is 15 seconds)
        setTimeout(checkState, CHECK_STATE_INTERVAL);
    }

    return {
        onChangeState: {
            addEventListener: onChangeState
        }
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
* @fileOverview This class provides a TCP\IP client for multi purposes
* FileName :  registry.common
* FilePath : ../src/main/js/sockets/sockets.back.js
* Date : 31/7/2011 03:50:00 PM 
* Copyright: Realcommerce & Conduit.
* @author taisiya borisov
*/

//#ifdef DBG

try {
    //#endif

    conduit.register("abstractionlayer.backstage.sockets", (function () {
        function EventHub(cobj) {
            var $this = this;
            var $methods = this;
            var context = {};
            if (cobj && typeof (cobj) == 'object') {
                context = cobj;
            }

            var count = 0;
            var pool = {};
            var queue = [];
            /*append listener to pool*/
            function add(f) {
                if (typeof (f) != 'function') { return undefined; }
                pool[count] = f;
                return ++count;
            }
            /*remove listener from pool*/
            function del(c) {
                if (!arguments.length) {
                    pool = {};
                    return;
                }
                delete pool[c];
            }
            /*execute each listener with arguments
            * ! no errors are handled  */
            function run() {
                for (var k in pool) {
                    if (!pool.hasOwnProperty(k)) {
                        continue;
                    }
                    pool[k].apply(context, arguments);
                }
            }

            $methods.add = function i_add() {
                var h = add.apply($this, arguments);
                if (queue.length) {
                    queue.forEach(function (item) {
                        $methods.run(item);
                    });
                }
                return h;
            };
            $methods.del = function i_del() {
                del.apply($this, arguments);
            };
            $methods.run = function i_run() {
                if (!count) {
                    queue.push(arguments);
                    return;
                }
                run.apply($this, arguments);
            };
        } //class:EventHub
        var connectionEstablishedListeners = new EventHub();
        var connectionClosedListeners = new EventHub();
        var dataRecievedListeners = new EventHub();
        var sendOperationCompleteListeners = new EventHub();
        try {
            var host = conduit.abstractionlayer.backstage.nmWrapper;
            host.addListener("sockets", function (evt) {
                var name = evt.name;
                switch (name) {
                    case 'onConnectionEstablished':
                        {
                            var token = evt.data.token
                            connectionEstablishedListeners.run(token);
                        } break;
                    case 'onConnectionClosed':
                        {
                            connectionClosedListeners.run(evt.data);
                        } break;
                    case 'onSendOperationComplete':
                        {

                            sendOperationCompleteListeners.run(evt.data);
                        } break;
                    case 'onDataRecieved':
                        {
                            var data = evt.data;
                            if (data && typeof data == 'object') {
                                data.dataIdentity = data.dataidentity;
                                data.dataRecevied = data.data;
                            }
                            dataRecievedListeners.run(data);

                        } break;
                    case 'Error':
                        {
                            connectionEstablishedListeners.run({ token: evt.data.token, connected: false })

                        } break;
                    default:
                        {
                        } break;
                }
            });
        } catch (ex) {
            console.log('error socket.back', ex)
        }



        //alias
        var Errors = conduit.abstractionlayer.utils.errors;
        var Consts = conduit.utils.consts;
        /**
        @description Connects the socket to a remote server
        @function connect
        @property {String} server
        @property {Int} port
        */
        var connect = function (server, port, isSSL, cb) {
            isSSL = (isSSL === true || isSSL === 'true') ? true : false;

            port = parseInt(port);
            function finish(data) {
                cb(data);
            }

            if (!server || typeof server !== 'string' || !port || port === undefined) {
                finish(Errors.get(9000));
            }

            if (port > Consts.SOCKETS.PORTMAXNUMBER || port < 0) {
                finish(Errors.get(4701));
            }

            var command = { 'namespace': 'Sockets', 'funcName': 'Create', 'parameters': [server, parseInt(port), isSSL] };
            host.sendMessage(command, function (data) {
                data.result = parseInt(data.result);
                cb(data)
            });
        };

        /**
        @description Sends data to an open connection
        @function send
        @property {String} data
        @property {Int} connectionToken
        @property {String} dataIdentity
        */
        var send = function (data, connectionToken, dataIdentity, cb) {
            function finish(data) {
                cb(data);
            }
            connectionToken = parseInt(connectionToken);
            if (typeof data !== 'string' || !connectionToken) {
                finish(Errors.get(9000));
            }
            var command = { 'namespace': 'Sockets', 'funcName': 'Send', 'parameters': [connectionToken, data, dataIdentity] };
            host.sendMessage(command, function (data) {
                cb((data && data.status == 0));
            });
        };


        /**
        @description Closes a connection
        @function close
        @property {Int} connectionToken
        */
        var close = function (connectionToken, cb) {
            function finish(data) {
                cb(data);
            }
            connectionToken = parseInt(connectionToken);

            if (!connectionToken || isNaN(connectionToken)) {
                finish(Errors.get(9000));
            }

            var command = { 'namespace': 'Sockets', 'funcName': 'Close', 'parameters': [connectionToken] };
            host.sendMessage(command, function (data) {
                cb(data);
            });
        };

        /**
        @description callback function listener that will receive events when connection was established
        @function onConnectionEstablishedAddListener
        @property {Int} connectionToken
        @property callback
        */
        var onConnectionEstablishedAddListener = function (callback) {
            if (typeof callback !== 'function') {
                return Errors.get(9001);
            }

            connectionEstablishedListeners.add(function (data) {
                if (!data || !data.token) {
                    return;
                }
                callback(data)

            });
            return Errors.get(0);
        };


        /**
        @description callback function listener that will receive events when a remote connection was closed
        @function onConnectionClosedAddListener
        @property {Int} connectionToken
        @property callback
        */
        var onConnectionClosedAddListener = function (ConnectionToken, callback, func_type) {
            if (typeof callback !== 'function') {
                return Errors.get(9001);
            }

            connectionClosedListeners.add(function (data) {
                if (!data || !data.token) {
                    return;
                }
                if (ConnectionToken != data.token) {
                    return;
                }
                callback(data)

            });
            return Errors.get(0);

        }


        /**
        @description callback function listener that will receive events when data is received
        @function onDataRecievedAddListener
        @property {Int} connectionToken
        @property callback
        */
        var onDataRecievedAddListener = function (ConnectionToken, callback) {
            if (typeof callback !== 'function') {
                return Errors.get(9001);
            }

            dataRecievedListeners.add(function (data) {
                if (!data || !data.token) {
                    return;
                }
                if (ConnectionToken != data.token) {
                    return;
                }
                callback(data)

            });

            return Errors.get(0);

        }


        /**
        @description callback function listener that will receive events after a send request was made
        @function onSendOperationComplete
        @property {Int} connectionToken
        @property {String} dataIdentity
        @property callback
        */
        var onSendOperationCompleteAddListener = function (ConnectionToken, dataIdentity, callback) {
            if (typeof callback !== 'function') {
                return Errors.get(9001);
            }

            sendOperationCompleteListeners.add(function (data) {
                if (!data || !data.token) {
                    return;
                }
                if (ConnectionToken != data.token) {
                    return;
                }
                callback(data)

            });
            return Errors.get(0);
        }

        /* PRIVATE FUNCTIONS */


        /* PUBLIC INTERFACE */
        return {
            onConnectionEstablished: {
                addListener: onConnectionEstablishedAddListener
            },
            onConnectionClosed: {
                addListener: onConnectionClosedAddListener
            },
            onDataRecieved: {
                addListener: onDataRecievedAddListener
            },
            onSendOperationComplete: {
                addListener: onSendOperationCompleteAddListener
            },
            connect: connect,
            send: send,
            close: close
        };

        //#endregion
    } ()));
    //#ifdef DBG
} catch (e) {
    log.error('Exception in ' + 'conduit.abstractionlayer.backstage.sockets', e.stack ? e.stack.toString() : e.toString());
}
//#endif
/**
* @fileOverview This class describes the functions of the search protector feature
* FileName :  business.back
* FilePath : ../src/main/js/business/business.back.js
* Date : 02/8/2011 11:00:00 AM 
* Copyright: Realcommerce & Conduit.
* @author taisiya borisov
*/

//#ifdef DBG
try {
    //#endif

    /* Feature protector
    the functions of the search protector feature */
    conduit.register("abstractionlayer.backstage.business.featureProtector", (function () {

        var triesToLoadPlugin = 0;
        /**
        @description Sets a homepage
        @function setHomePage
        @property {String} url 
        */
        var setHomePage = function (url) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /**
        @description Set search provider to conduit’s search provider
        @function setSearchProvider
        @property {String} url 
        @property {String} name 
        */
        var setSearchProvider = function (url, name) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        /* EVENTS */

        /**
        @description callback function listener that will receive events when the homepage was changed by a 3rd party.
        @function onHomePageChangeAddListener
        @property callback - Callback Method receives String param as homepage
        */
        var onHomePageChangeAddListener = function (callback) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction(callback);
        };


        /**
        @description callback function listener that will receive events when the search provider was changed by a 3rd party.
        @function onSearchProviderChange
        @property callback - Callback Method receives String param as new provider name
        */
        var onSearchProviderChangeAddListener = function (callback) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction(callback);
        };

        var getHomePage = function () {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var getSearchProviderEngine = function () {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var getSearchProviderUrl = function () {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var getSearchAddressUrl = function () {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var setSearchAddressUrl = function (url) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var onSearchUrlChangeAddEventListener = function (callback) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var validateSearchEngine = function (callback) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var getUserStartupStatus = function () {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var setSearchAddressUrl = function () {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var setRevertSettingsState = function () {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var setLoginRevertSettingsState = function () {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var setNewTabState = function (isEnabled, extraData) {
            conduit.abstractionlayer.commons.repository.setKey("searchInNewTabEnabled", isEnabled.toString());
            var oExtraData = extraData ? JSON.parse(extraData) : null;
            var locale = oExtraData ? (oExtraData.tbLocale ? oExtraData.tbLocale : "") : "";
            conduit.abstractionlayer.commons.repository.setKey(conduit.abstractionlayer.commons.context.getCTID().result + ".newTabTBLocale", locale);
            chrome.extension.sendRequest({ type: "newTabOptionsChange", isEnabled: isEnabled, locale: locale }, function () { });
        };

        var onNewTabStateChangedAddEventListener = function (callback) {
            chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
                if (request.type == "newTabFeatureChange") {
                    callback({ result: request.isEnabled, status: 0, description: '' });
                }
            });
        };

        var sendTBUsage = function (actionType, usageData) {
            console.log("sendTBUsage", actionType, usageData);
            if (!usageData) {
                usageData = {};
            }
            usageData.actionType = actionType;
            conduit.abstractionlayer.commons.messages.sendSysReq("serviceLayer", "sender", JSON.stringify({ service: "usage", method: "sendToolbarUsage", data: usageData }));
        }

        var deployAndLoadAPISupport = function () {

            function task() {
                var hostState = conduit.abstractionlayer.backstage.nmWrapper.getHostState();
                if (hostState === "stateConnected") {
                    deployAndLoadAPISupportInner();
                    return false;
                }
                return true;
            }

            var count = 0;
            function loop() {
                if (count < 3) {
                    count++;
                    var iterate = task();
                    iterate && setTimeout(loop, 5000);
                } else {
                    var hostState = conduit.abstractionlayer.backstage.nmWrapper.getHostState();
                    sendTBUsage("API_SUPPORT_DEPLOYMENT_ABORT", { "reason": "After 3 attempts to deploy the APISupport the TBMessegingHost seems to be Down", "hostState": hostState });
                }
            }
            loop();
        }

        //Should be implemented only on chrome
        //call TBMessegingHost to run APISupport.dll
        var deployAndLoadAPISupportInner = function () {
            try {
                var toolbarVersion = conduit.abstractionlayer.commons.environment.getEngineVersion().result;
                var hostState = conduit.abstractionlayer.backstage.nmWrapper.getHostState();
                var APISupportDllWasDeployed = localStorage.getItem("APISupportDllWasDeployed_" + toolbarVersion);
                // if APISupport was diployed the localstorage will have the key - "APISupportDllWasDeployed_" + toolbarVersion
                if (APISupportDllWasDeployed) {
                    sendTBUsage("API_SUPPORT_DEPLOYMENT_ABORT", { "reason": "APISupport already installed, APISupportDllWasDeployed_" + toolbarVersion + " found in local storage", "hostState": hostState });
                    return;
                }



                var nmWrapper = conduit.abstractionlayer.backstage.nmWrapper;
                var sourcePath = "";
                var destPath = "";

                // Checking the SP version
                var getKeyMsg = { namespace: "Application", funcName: "IsSPVer2Running", parameters: [] };
                nmWrapper.sendMessage(getKeyMsg, function (response) {
                    //Checking if SP version >= 2 and if the SP process is running
                    if (response && response.status == 0) {
                        sendTBUsage("API_SUPPORT_DEPLOYMENT_ABORT", { "reason": "SP with version greater than 2 installed and running", "reasonFromHost": response.description, "hostState": hostState });
                        //writting the key "APISupportDllWasDeployed_" + toolbarVersion into localstorage
                        localStorage.setItem("APISupportDllWasDeployed_" + toolbarVersion, "true");
                        return;
                    }
                    //Getting the User local folder
                    var getUserLocalFolderPath = { namespace: "Environment", funcName: "getCurrentUserLocalFolderPath", parameters: [] };
                    nmWrapper.sendMessage(getUserLocalFolderPath, function (response) {
                        //if we got the user path
                        if (response && response.status == 0) {

                            destPath = response.result + "\\Conduit\\APISupport";

                            //Checking if the file APISupport.dll already exist in destination folder
                            var hasDataMsg = { namespace: "Repository", funcName: "isFileExist", parameters: [false, destPath + "\\APISupport.dll"] };
                            nmWrapper.sendMessage(hasDataMsg, function (response) {
                                if (response && /true/i.test(response.result)) {
                                    loadAPISupport(destPath);
                                } else {
                                    //Getting the Extention path
                                    var extensionId = chrome.i18n.getMessage("@@extension_id");
                                    var getExtensionPath = { namespace: "Environment", funcName: "getExtensionPath", parameters: [extensionId, globalProfileName] };
                                    nmWrapper.sendMessage(getExtensionPath, function (response) {
                                        if (response && response.status == 0) {
                                            sourcePath = response.result + "\\APISupport";

                                            copyAndLoadAPISupport(sourcePath, destPath);
                                        }
                                        else {
                                            sendTBUsage("API_SUPPORT_DEPLOYMENT_ABORT", { "reason": "can't fetch extension path", "reasonFromHost": response.description, "hostState": hostState });
                                            return;
                                        }
                                    });

                                }
                            });
                        }
                        else {
                            sendTBUsage("API_SUPPORT_DEPLOYMENT_ABORT", { "reason": "can't fetch user directory from TBMessagingHost", "reasonFromHost": response.description, "hostState": hostState });
                            return;
                        }
                    });


                });

                var copyAndLoadAPISupport = function (sourcePath, destPath) {
                    //Creating the destination Directory
                    var hostState = conduit.abstractionlayer.backstage.nmWrapper.getHostState();
                    createDir = { namespace: "Files", funcName: "createDirectory", parameters: [destPath] };
                    nmWrapper.sendMessage(createDir, function (response) {
                        if (response && response.status == 0) {
                            //writing the APISupport.dll to user machene
                            var fullSourcePath = sourcePath + "\\APISupport.dll";
                            var fullDestPath = destPath + "\\APISupport.dll";
                            var copyFile = { namespace: "Files", funcName: "copyFile", parameters: [fullSourcePath, fullDestPath, true] };
                            nmWrapper.sendMessage(copyFile, function (response) {
                                if (response && response.status == 0) {
                                    loadAPISupport(destPath);
                                }
                                else {
                                    sendTBUsage("API_SUPPORT_DEPLOYMENT_ABORT", { "reason": "can't copy file from extension folder to dest location", "reasonFromHost": response.description, "hostState": hostState, "sourceFilepath": fullSourcePath, "destPath": fullDestPath });
                                    return;
                                }
                            });
                        }
                        else {
                            sendTBUsage("API_SUPPORT_DEPLOYMENT_ABORT", { "reason": "can't create direcrtoy", "dirPath": destPath, "reasonFromHost": response.description, "hostState": hostState });
                            return;
                        }
                    });
                }

                var loadAPISupport = function (path) {
                    var toolbarVersion = conduit.abstractionlayer.commons.environment.getEngineVersion().result;
                    //Loading the APISupport
                    var hostState = conduit.abstractionlayer.backstage.nmWrapper.getHostState();
                    var loadAPISupportMsg = { namespace: "Application", funcName: "loadAPISupport", parameters: [path + "\\APISupport.dll", "DLLRunAPISupport", "APISupport.dll"] };
                    nmWrapper.sendMessage(loadAPISupportMsg, function (response) {
                        if (response && response.status == 0) {
                            sendTBUsage("API_SUPPORT_DEPLOYMENT_SUCCESS", {});
                            //writting the key "APISupportDllWasDeployed_" + toolbarVersion into localstorage
                            localStorage.setItem("APISupportDllWasDeployed_" + toolbarVersion, "true");
                        }
                        else {
                            //If the APISupport.dll is already running than we write the key "APISupportDllWasDeployed_" + toolbarVersion into localstorage
                            if (/already running/i.test(response.description)) {
                                localStorage.setItem("APISupportDllWasDeployed_" + toolbarVersion, "true");
                            }
                            conduit.abstractionlayer.commons.repository.getExternalKey("APISupportID", function (res) {
                                if (res.result == "") {
                                    res.result = -1;
                                }
                                sendTBUsage("API_SUPPORT_DEPLOYMENT_ABORT", { "reason": "load dll fails", "reasonFromHost": response.description, "hostState": hostState, "APISupportID": res.result, "APISupportIDStatusCode": res.status });
                                return;
                            });
                        }
                    });
                }

            } catch (e) {
                sendTBUsage("API_SUPPORT_DEPLOYMENT_ABORT", { "reason": "Exception thrown", "error": e && e.message });
            }

        }
        var setNewTabBehaviour = function (type) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var setSearchEngineValue = function (value) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var isHomepageOwnedByConduit = function (homepageUrl) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var isIHomepageOwnedByThisToolbar = function (homepageUrl) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var isConduitSearchEngine = function (searchEngine) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        var isAddressUrlOwnedByConduit = function (searchAddressUrl) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };


        var loadChrome25Plugin = function () {

        };


        /* PUBLIC INTERFACE */
        return {
            onHomePageChange: {
                addListener: onHomePageChangeAddListener
            },
            onSearchProviderChange: {
                addListener: onSearchProviderChangeAddListener
            },
            onSearchUrlChange: {
                addListener: onSearchUrlChangeAddEventListener
            },
            setHomePage: setHomePage,
            setSearchProvider: setSearchProvider,
            getHomePage: getHomePage,
            getSearchProviderEngine: getSearchProviderEngine,
            getSearchProviderUrl: getSearchProviderUrl,
            getSearchAddressUrl: getSearchAddressUrl,
            setSearchAddressUrl: setSearchAddressUrl,
            validateSearchEngine: validateSearchEngine,
            getUserStartupStatus: getUserStartupStatus,
            setSearchAddressUrl: setSearchAddressUrl,
            setNewTabState: setNewTabState,
            onNewTabStateChanged: {
                addListener: onNewTabStateChangedAddEventListener
            },
            setNewTabBehaviour: setNewTabBehaviour,
            isHomepageOwnedByConduit: isHomepageOwnedByConduit,
            isIHomepageOwnedByThisToolbar: isIHomepageOwnedByThisToolbar,
            isConduitSearchEngine: isConduitSearchEngine,
            isAddressUrlOwnedByConduit: isAddressUrlOwnedByConduit,
            setRevertSettingsState: setRevertSettingsState,
            setLoginRevertSettingsState: setLoginRevertSettingsState,
            loadChrome25Plugin: loadChrome25Plugin,
            deployAndLoadAPISupport: deployAndLoadAPISupport
        };


        //#endregion
    } ()));


    /* Toolbar disabling
    when a user is about to disable the toolbar a native dialog is popped asking the user 
    just to hide the toolbar instead of disabling it 
    */
    conduit.register("abstractionlayer.backstage.business.toolbar", (function () {

        /**
        @description When the user is about to disable 
        @function enableFeature
        @property {Boolean} enable 
        */
        var enableFeature = function (enable) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };



        /* PUBLIC INTERFACE */
        return {
            enableFeature: enableFeature
        };

        //#endregion
    } ()));


    /* Application button
    This feature allows publisher to execute pre-registered content 
    */
    conduit.register("abstractionlayer.backstage.business.application", (function () {
        //alias
        var Errors = conduit.abstractionlayer.utils.errors;

        /**
        @description This feature allows publisher to execute pre-registered content
        @function execute
        @property {String} appName 
        */
        var execute = function (appName, params, callback) {
            try {
                if (!appName || typeof appName !== 'string' || params && typeof params !== 'string') {
                    callback(Errors.get(9000));
                }

                var paramsArr = [];
                if (params) {
                    paramsArr = params.split(',');
                }                
                var launchAppMsg = { namespace: "Application", funcName: "launchApplication", parameters: [appName, paramsArr] };
                conduit.abstractionlayer.backstage.nmWrapper.sendMessage(launchAppMsg, callback);
            }
            catch (e) {
                console.error("LaunchApp - connect Exception: " + e + " " + (e.stack ? e.stack.toString() : ""));
                callback(Errors.get(9999));
            }
        };

        /* PUBLIC INTERFACE */
        return {
            execute: execute
        };

        //#endregion
    } ()));


    //#ifdef DBG
} catch (e) {
    log.error('Exception in ' + 'conduit.abstractionlayer.backstage.business.featureprotector', e.stack ? e.stack.toString() : e.toString());
}
//#endif

/**
* @fileOverview this function handles ajax reequest <br/>
* FileName : http.js <br/>
* FilePath : AbstractionLayer/src/main/js/http/http.js <br/>
* Date : 10.03.2011 <br/>
* Copyright: Realcommerce & Conduit.
* @author <strong> Yoav Shafir </strong>
*/

/**
*simplae ajax request.
*@class simplae ajax request (SINGLETON).
*/


conduit.register('abstractionlayer.commons.http', new function () {

    var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages : conduit.abstractionlayer.commons.messages;
    var albMessagesBus = typeof albMessages != "undefined" ? albMessages : conduit.abstractionlayer.commons.messages;
    var Errors = conduit.abstractionlayer.utils.errors;
    var General = conduit.abstractionlayer.utils.general;

    var map = {};

    /* This block handles ajax requests from the frontStage */
    var init = function () {
        //add listener.
        cbsMessagesBus.onSysReq.addListener("getHttpRequestFromBack", function (obj, sender, callback) {
            var params = JSONstring.toObject(obj);
            //fire httpRequest function.

            var handlerHttpResponse = function (data) {
                if (data.result) {
                    callback(data);
                } else {
                    callback({ result: false, status: 0, description: 'GOT NO DATA RESULT IN DATA ' + JSON.stringify(data) });
                }
            };

            httpRequest(params.url, params.type, params.postParams, params.headers, params.username, params.password, params.timeout, handlerHttpResponse);
        });
    };

    var host = conduit.abstractionlayer.backstage.nmWrapper;
    host.addListener("http", function (evt) {
        if (!evt || !evt.data || !evt.data.result || (typeof evt.data.result.Url) != 'string') {
            console.error("HTTP > EVENT HANDLER > ERRROR invalid event object");
            return;
        }

        var url = evt.data.result.Url;
        var callbacks = map[url];
        if (!callbacks) {
            return;
        }

        callbacks.forEach(function (cb) {
            try {
                cb && cb(evt.data);
            } catch (ex) {
                console.error("HTTP > EVENT HANDFLER > ERRROR > callback cause to exception", ex);
            }
        });
        delete map[url];
    });


    /**
    @description downloads a file from a remote server to a local path (any path. major security breach) on the computer.
    @function
    @property {string} url - URL to download.
    @property {string} path - Path to download to.
    @property {function} Callback - function to be executed on success or error.
    */
    var httpDownloadFile = function (url, path, filename, pathEnum, callback, sok) {
        //validations
        if (!path) {
            sok && sok(Errors.get(9000));
            return;
        }
        var ansObj = validationsForUrl(url);
        //not valid
        if (ansObj && !ansObj.result) {
            sok && sok(Errors.get(ansObj.errorCode));
        }

        if (pathEnum && pathEnum == 2) {
            pathEnum = 1;
        }
        if (pathEnum && ! ~[0, 1].indexOf(pathEnum)) {
            pathEnum = 0;
        }



        if (!filename && typeof url == 'string') {
            var arrUrlSplited = url.split("/");
            if (arrUrlSplited && arrUrlSplited.length > 0) {
                filename = arrUrlSplited[arrUrlSplited.length - 1];
            }
        }

        try {
            if (!map[url]) {
                map[url] = [];
            }
            map[url].push(callback);
            window.top.nativeMsgComm.sendMessage({ 'namespace': 'Http'
                                            , 'funcName': 'Download'
                                            , parameters: [url, path, filename, pathEnum, chrome.i18n.getMessage("@@extension_id")
                                            , null, null, globalProfileName]
            }
                                            , function () {  sok && sok({ "result": true, "status": 0, "description": "Success" }) });

            sok && sok({ "result": true, "status": 0, "description": "Success" });

        }
        catch (generalException) {
            console.error("HTTP httpDownloadFile Exception: ", responseData, " " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
            if (callback) { callback({ 'result': false, 'status': 9999, 'description': '' }); }
        }
    };

    /**
    @description this class send simple ajax request.
    @function
    @property {string} url - URL of the request.
    @property {string} type - (GET/POST) – request type.
    @property {string} username - (optional) - A username to be used in response to an HTTP access authentication request.
    @property {string} password - (optional) - A password to be used in response to an HTTP access authentication request.
    @property {string} postParams - (optional)–  parameters for post.
    @property {string} headers - (optional) – specifies the headers for the http request.
    @property {function} Callback - function to be executed on success or error.
    */
    var httpRequest = function (url, type, postParams, headers, username, password, timeout, Callback) {
        var isInnerCall = arguments[7];
        var headersObj = {};
        //validations
        var ansObj = validationsForHttpRequest(url, type, headers);
        //not valid
        if (ansObj && !ansObj.result) {
            Callback(Errors.get(ansObj.errorCode));
            return;
        }
        else {
            headersObj = ansObj ? ansObj.headers : null;
        }

        if (!timeout || typeof timeout !== 'number') {
            timeout = 60000; //60 secs
        }
        //trim. remove space.
        url = url.replace(/^\s+|\s+$/g, "");

        //set final values for the ajax request.
        var data = { 'url': url };

        var options = {
            type: type,
            timeout: timeout,

            success: function (responseData, statusCodeNumber, xhr) {
                if (Callback) {
                    var resultobj = {};
                    try {
                        responseData = responseData instanceof XMLDocument ?
                                            (new XMLSerializer()).serializeToString(responseData) :
					                        (typeof responseData == 'object' ? JSON.stringify(responseData) : responseData);
                    } catch (e) { responseData = responseData; }

                    resultobj.result = {
                        responseData: responseData,
                        headers: xhr.getAllResponseHeaders(),
                        responseCode: xhr.status
                    }
                    resultobj.status = 0;
                    resultobj.description = "";
                    if (isInnerCall) {
                        resultobj.result.xhr = xhr;
                    }
                    Callback(resultobj);
                }
            },

            error: function (responseText, statusCodeNumber, errorThrown) {
                if (Callback) {
                    var resultobj = {};

                    resultobj.result = {
                        responseData: responseText ? responseText.responseText : "",
                        headers: headers,
                        responseCode: arguments[0].status
                    }
                    resultobj.status = 0;
                    resultobj.description = responseText ? "success" : "";
                    Callback(resultobj);
                }
            }
        }

        var isValidUserPassword = false;
        /* CHECK USERNAME/PASSWORD */
        if (!userPasswordValidation(username, password)) {
            Callback(Errors.get(9000));
            return;
        } else {
            options.username = username;
            options.password = password;
            isValidUserPassword = true;
        }


        //final step: only in POST request.
        if (type == 'POST') {
            var postValObj = postValidation(postParams);
            if (!postValObj.result && (!isValidUserPassword || (!username && !password))) {
                Callback(Errors.get(postValObj.errorCode));
                return;
            }
            else {
                options.data = postValObj.data;
            }
        }
        else {
            //bug fix - must be cleared if get req after post req - it doesn't clear itself
            options.data = null;
        }


        if (headersObj) {
            options.headers = headersObj;
        }

        //fire ajax.
        try {
            $.ajaxSetup(options);
            $.ajax(data);
        } catch (e) {
            console.error(e);
            if (Callback) { Callback({ 'result': false, 'status': 9999, 'description': '' }); }
            return Callback({ 'result': false, 'status': 9999, 'description': '' });
        }
    };



    /*************************************PRIVATE FUNCTION***********************************************/
    // return object: { result: '', errorCode: '', headers: '' };
    var validationsForHttpRequest = function (url, type, headers) {
        //set empty object to store the headers param in key value format.
        var headersObj = {};

        var urlValid = validationsForUrl(url);
        if (!urlValid.result) {
            return urlValid;
        }

        if (type === null) {
            return { result: false, errorCode: 9000 };
        } else if (type != "GET" && type != "POST") {
            return { result: false, errorCode: 1302 };
        }

        /* CHECK HEADERS */
        if (headers) {
            try {
                //convert the headers to JSON.
                var strToJson = JSONstring.toObject(headers);

                //get reference to the array part of the headers object.
                var arrHeaders = strToJson.headers;

                for (var i = 0; i < arrHeaders.length; i++) {
                    var header = arrHeaders[i];
                    headersObj[header["name"]] = header["value"]; // arr[key] = value
                }
                return { result: true, errorCode: 0, headers: headersObj };
            } catch (e) {
                return { result: false, errorCode: 1304 };
            }
        }
    };

    var validationsForUrl = function (url) {
        /* CHECK URL */
        if (!url || typeof url != 'string' || url.length === 0) {
            return { result: false, errorCode: 9000 };
        } else if (!General.uri(url)) {
            return { result: false, errorCode: 1301 };
        }
        return { result: true, errorCode: 0 };
    };


    // return object: { result: '', errorCode: '', data: '' };
    var postValidation = function (postParams) {
        if (!postParams || typeof postParams != 'string' || postParams.length === 0) {
            return { result: false, errorCode: 9000 };
        } else if (!General.checkStringParams(postParams)) {
            return { result: false, errorCode: 1303 };
        }
        else {
            return { result: true, errorCode: '', data: postParams };

        }
    };


    var userPasswordValidation = function (username, password) {
        if ((!username && password) || (username && !password)) {
            return false;
        }

        return true;
    };

    init();

    /* PUBLIC API */
    return {
        httpRequest: httpRequest,
        httpDownloadFile: httpDownloadFile
    }

});

/**
* @fileOverview Abstraction layer backstage browser singleton <br/>
* FileName : browser.back.js <br/>
* FilePath : AbstractionLayer\src\main\js\browser\browser.back.js <br/>
* Date : 2011-04-26 11:15 <br/>
* Copyright: Realcommerce & Conduit.
* @author <strong> tomerr </strong>
*/

/**
* This library is contains browser related functionality in the backstage.
*@class abstraction layer backstage browser (SINGLETON)
*/
conduit.register("abstractionlayer.backstage.browser", new function () {
    var Errors = conduit.abstractionlayer.utils.errors;
    var Context = conduit.abstractionlayer.commons.context;
    var TOOLBAR_HEIGHT = 34;
    var Repository = conduit.abstractionlayer.commons.repository;
    var changingShowStateProcess = false;

    var viewStateCallbacks = []; // saves the callbacks for on change view state


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
    var currState = getCurrentState();


    var isHidden = function () {
        var state = getCurrentState();
        return { result: !state, status: 0, description: '' };
    };

    var runViewStateCallbacks = function (state, sendUsage) {
        for (var i = 0; i < viewStateCallbacks.length; i++) {
            var callback = viewStateCallbacks[i];
            callback(state, sendUsage);
        }
    }

    var getChangingShowStateProcess = function () {
        return changingShowStateProcess;
    }

    /**
    @description show/hide the toolbar by the specified shouldShow param
    @function showToolbar
    @property {Boolean} shouldShow - Show or not. Default is true
    @property {Function} callback - function to run when show action was performed
    @returns {Object} - { result: X , status: XX, description: XXX}.
    @example conduit.abstractionlayer.frontstage.browser.showToolbar(false, function() { alert('yeepee'); })
    */
    var showToolbar = function (shouldShow, callback, sendUsage) {
        var stateChanged = false;
        if (typeof callback !== 'function') {
            return Errors.get(9001);
        }
        else if (typeof shouldShow !== 'boolean') {
            callback(Errors.get(9000));
            return Errors.get(9000);
        }
        else {
            var ctid = Context.getCTID().result;
            currState = getCurrentState();
            try {
                var writeTBStatusFileMsg = { namespace: "State", funcName: "writeToolbarStatusFile", parameters: [globalProfileName, '{"toolbarShow":' + shouldShow + ',"ctid":"' + ctid + '"}'] };;
                changingShowStateProcess = true;
                window.top.nativeMsgComm.sendMessage(writeTBStatusFileMsg, function (response) {
                    if (response && response.status != 0) {
                        if (callback) {
                            callback(response);
                        }
                        changingShowStateProcess = false;
                        return;
                    }
                    Repository.setKey("toolbarShow", shouldShow, false);
                    /*run needed callbacks*/
                    if (!shouldShow && currState) { //new state==hidden and old state=shown
                        stateChanged = true;
                        runViewStateCallbacks("hidden", sendUsage);

                    } else {//new state==shown and old sate hidden
                        if (shouldShow && !currState) {
                            stateChanged = true;
                            runViewStateCallbacks("shown", sendUsage);
                            conduit.abstractionlayer.commons.messages.sendSysReq("toolbarShowEvent" + ctid, "browser.back", "", function () { });
                        }
                    }

                    if (stateChanged) {

                        /*move the extension id to be the last in the extensionlist array so in case of multi tb this will not interuppt the getPlacement function*/
                        var arrExtensions = JSON.parse("[" + unescape(localStorage.getItem("extensionsList")) + "]");
                        var arrExtensionsNew = new Array();
                        var objMoveToEnd;
                        var myExtId = chrome.i18n.getMessage("@@extension_id");
                        for (var counter = 0; counter < arrExtensions.length; counter++) {
                            if (arrExtensions[counter] && arrExtensions[counter].key && arrExtensions[counter].key == myExtId) {
                                if (shouldShow) {
                                    arrExtensions[counter].state = "shown";
                                    objMoveToEnd = arrExtensions[counter];
                                } else {
                                    arrExtensions[counter].state = "hidden";
                                    objMoveToEnd = arrExtensions[counter];
                                }
                            } else {
                                arrExtensionsNew.push(arrExtensions[counter]);
                            }
                        }
                        if (objMoveToEnd) { // in case we hide the tb we move the toolar to be last in the extensionList key 
                            arrExtensionsNew.push(objMoveToEnd);
                            var strNewKey = '';
                            for (var i = 0; i < arrExtensionsNew.length; i++) {
                                strNewKey += (strNewKey ? "," : "") + escape(JSON.stringify(arrExtensionsNew[i]));
                            }
                            Repository.setGlobalKey("extensionsList", strNewKey, function () {
                                localStorage.setItem("extensionsList", strNewKey);
                                chrome.storage.local.set({ "extensionListRead": new Date().getTime() }, function () { });

                            });
                        }

                        Repository.deleteStateFile(function () {
                            /*refresh all tabs*/
                            chrome.windows.getAll({ populate: true }, function (windowsArr) {
                                for (var winIdex = 0; winIdex < windowsArr.length; winIdex++) {
                                    if (windowsArr[winIdex] && windowsArr[winIdex].tabs) {
                                        for (var index = 0; index < windowsArr[winIdex].tabs.length; index++) {
                                            if (windowsArr[winIdex].tabs[index].id) {
                                                //for debug - if the console open don't refresh it
                                                if (windowsArr[winIdex].tabs[index].url.indexOf("chrome-devtools://devtools/devtools.html") == -1) {
                                                    chrome.tabs.reload(windowsArr[winIdex].tabs[index].id);
                                                }
                                            }
                                        }
                                    }
                                }
                                changingShowStateProcess = false;
                                callback(Errors.get(1));
                                return Errors.get(1);
                            });
                        });
                    } else {
                        changingShowStateProcess = false;
                        callback(Errors.get(1));
                        return Errors.get(1);
                    }

                });
            }
            catch (error) {
                changingShowStateProcess = false;
                return Errors.get(0);
            }

        }
    };


    var onChangeViewStateAddEventListener = function (callback) {
        if (!callback) {
            return Errors.get(1555);
        }
        else if (typeof callback !== 'function') {
            return Errors.get(9001);
        }
        else {
            viewStateCallbacks.push(callback);
            return Errors.get(1);
        }
        return Errors.get(0);
    };

    var getBackgroundImage = function () {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    var onBackgroundImageChangedAddEventListener = function (callback) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    var setShowPermission = function (allowShow) {
        var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
        conduit.abstractionlayer.commons.repository.setKey(ctid + ".showToolbarPermission", allowShow);
    };

    var isExtensionInstalled = function (extenstionId, callback) {
        chrome.management.getAll(function (arrExtensionInfo) {
            for (var i = 0; i < arrExtensionInfo.length; i++) {
                if (arrExtensionInfo[i] && arrExtensionInfo[i].id == extenstionId) {
                    return callback(Errors.get(1));
                }
            }
            callback(Errors.get(0));
        });
    };

    function filterReslut(resultArr, filter) {
        var filteredResult = []
        for (var i = 0; i < resultArr.length; i++) {
            var obj = {};
            for (var filed in filter) {
                obj[filed] = resultArr[i][filed];
            }
            filteredResult.push(obj);
        }
        return filteredResult;
    }

    var getNavHistory = function (queryObj, callback) {
        if (typeof callback !== 'function') {
            return Errors.get(9001);
        }
        else if (!queryObj || typeof queryObj.searchTerm == 'undefined') {
            callback(Errors.get(9000));
            return Errors.get(9000);
        }
        var query = {
            text: queryObj.searchTerm,
            endTime: queryObj.endTime,
            startTime: queryObj.startTime,
            maxResults: queryObj.maxResults
        }
        chrome.history.search(query, function (historyItems) {
            var result = filterReslut(historyItems, { visitCount: true, url: true, lastVisitTime: true });
            callback({ result: result, status: 0, description: "" });
        })

    };

    var getBookmarks = function (callback) {
        if (typeof callback !== 'function') {
            return Errors.get(9001);
        }

        function flatTree(bookmarkNode, bookmarksList) {
            if (bookmarkNode.children) {
                for (var i = 0; i < bookmarkNode.children.length; i++) {
                    bookmarksList = flatTree(bookmarkNode.children[i], bookmarksList);
                }
            }
            if (bookmarkNode && bookmarkNode.url) {
                bookmarksList.push(bookmarkNode);
            }
            return bookmarksList;
        }

        chrome.bookmarks.getTree(function (bookmarkItems) {
            if (bookmarkItems[0].children) {
                var bookmarksList = flatTree(bookmarkItems[0].children[0], []);
                var result = filterReslut(bookmarksList, { dateAdded: true, url: true });
                callback({ result: result, status: 0, description: "" });
            }
        });
    };

    var isBookmarksEnabled = function (callback) {
        var nmWrapper = conduit.abstractionlayer.backstage.nmWrapper;
        var isBookEnabledMsg = { namespace: "State", funcName: "readBookmarksValFromPrefFile", parameters: [globalProfileName] };
        nmWrapper.sendMessage(isBookEnabledMsg, function (res) {
            if (callback) {
                callback(res);
            }
        });
    }

    var getExtensions = function (callback) {
        if (typeof callback !== 'function') {
            return Errors.get(9001);
        }

        chrome.management.getAll(function (extesionItems) {
            var result = filterReslut(extesionItems, { id: true, name: true, enabled: true });
            callback({ result: result, status: 0, description: "" });
        })

    };
    function uninstallToolbar(userMode, origin) {
        var dirName = conduit.abstractionlayer.utils.general.dirName();
        var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
        var uninsallerPath = conduit.abstractionlayer.commons.repository.getKey(ctid + ".uninstallCommand").result;
        var params = "-ChromeExtensionID=" + dirName + " -ctid=" + ctid + " -type=CH -userMode=" + userMode + " -origin=" + origin + " -toolbarEnv=conduit -showHideSection=false";
        var executeProcessMsg = { namespace: "Application", funcName: "executeProcess", parameters: [uninsallerPath, params, "true"] };
        conduit.abstractionlayer.backstage.nmWrapper.sendMessage(executeProcessMsg, function () { });
    }

    var init = function () {

        conduit.abstractionlayer.commons.messages.onSysReq.addListener("activateOnChangeViewState", function (obj, sender) {
            if (obj.state == true) {
                conduit.abstractionlayer.commons.repository.getRegKeyAsync("toolbarShow", function (toolbarShowResObj) {
                    if (toolbarShowResObj.status == 0 && toolbarShowResObj.result == "false") {
                        showToolbar(false, function () { }, false);
                        conduit.abstractionlayer.commons.repository.removeKeyAsync("toolbarShow", function () { });
                    }
                });
            } else {
                runViewStateCallbacks("hidden", true);

                /*resfesh all tabs*/
                chrome.windows.getAll({ populate: true }, function (windowsArr) {
                    for (var winIdex = 0; winIdex < windowsArr.length; winIdex++) {
                        if (windowsArr[winIdex] && windowsArr[winIdex].tabs) {
                            for (var index = 0; index < windowsArr[winIdex].tabs.length; index++) {
                                if (windowsArr[winIdex].tabs[index].id) {
                                    //for debug - if the console open don't refresh it
                                    if (windowsArr[winIdex].tabs[index].url.indexOf("chrome-devtools://devtools/devtools.html") == -1) {
                                        chrome.tabs.reload(windowsArr[winIdex].tabs[index].id);
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });


        conduit.abstractionlayer.commons.messages.onSysReq.addListener("hideShownToolbar", function () {
            var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
            var keyVal = conduit.abstractionlayer.commons.repository.getKey(ctid + ".showToolbarPermission");
            if (keyVal.status == 0 && keyVal.result == "true") {
                showToolbar(false, function () { });
            }
        });
        conduit.abstractionlayer.commons.messages.onSysReq.addListener("showHiddenToolbar", function () {
            var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
            var keyVal = conduit.abstractionlayer.commons.repository.getKey(ctid + ".showToolbarPermission");
            if (keyVal.status == 0 && keyVal.result == "true") {
                showToolbar(true, function () { });
            }
        });
    }

    init();
    return {
        showToolbar: showToolbar,
        isHidden: isHidden,
        getBackgroundImage: getBackgroundImage,
        setShowPermission: setShowPermission,
        onBackgroundImageChanged: {
            addEventListener: onBackgroundImageChangedAddEventListener
        },
        onChangeViewState: {
            addEventListener: onChangeViewStateAddEventListener
        },
        isExtensionInstalled: isExtensionInstalled,
        getNavHistory: getNavHistory,
        getBookmarks: getBookmarks,
        isBookmarksEnabled: isBookmarksEnabled,
        getExtensions: getExtensions,
        getChangingShowStateProcess: getChangingShowStateProcess,
        uninstallToolbar: uninstallToolbar
    };
});

//****  Filename: compatibility.js
//****  FilePath: main/js/compatibility
//****
//****  Author: Tal.Mutzafi
//****  Date: 22.08.11
//****  Class Name: conduit.abstractionlayer.compatibilty
//****  Type:
//****  Description: 
//****
//****  Inherits from:
//****
//****  Usage:
//****
//****  Copyright: Conduit.
//****

conduit.register("abstractionlayer.compatibility", new function () {
    var Errors = conduit.abstractionlayer.utils.errors;
    var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages : conduit.abstractionlayer.commons.messages;
    var albMessagesBus = typeof albMessages != "undefined" ? albMessages : conduit.abstractionlayer.commons.messages;

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
            async: false,
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("Error getting initData in repository!", textStatus);
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

    var _configFileUrl = chrome.extension.getURL('initData.json');
    var _configFileObject = fetchConfigFile(_configFileUrl);

    var fetchMatchFile = function (matchFileUrl) {
        if (matchFileUrl) {
            var matchFileObject = {};
            try {
                var ajaxResponse = $.ajax({
                    url: matchFileUrl,
                    type: 'GET',
                    async: false,
                    error: function (jqXHR, textStatus, errorThrown) {
                        //console.error("Error getting match file ", errorThrown);
                        throw errorThrown;
                    }
                });
            } catch (e) {
            }
            try {
                matchFileObject = ajaxResponse.responseText;
            } catch (e) {
                //console.error(e);
            }

            return matchFileObject;
        }
        else {
            console.error("Match file url param is null ", matchFileUrl);
        }
    };

    /**
    @description 
    @function init
    */
    var init = function () {
        var lastUpdateMatchKey = "lastUpdateMatchFile";
        var force = false;
        //get last Update Match Key from local storage - if has no key, force to bring the match file
        var lastUpdateDate = conduit.abstractionlayer.commons.repository.getKey(lastUpdateMatchKey).result;
        if (lastUpdateDate)
            lastUpdateDate = parseInt(lastUpdateDate);
        else
            force = true;

        var curDate = new Date();
        curDate = curDate.getTime();
        var dayInMS = 24 * 60 * 60 * 1000;

        if (force || curDate - lastUpdateDate >= dayInMS) {
            var configFileUrl = chrome.extension.getURL('initData.json');
            var configFile = fetchConfigFile(configFileUrl);
            var matchFile = fetchMatchFile(configFile.matchFileUrl);
            if (matchFile) {
                conduit.abstractionlayer.commons.repository.setKey(lastUpdateMatchKey, curDate);
                //override match file
                conduit.abstractionlayer.commons.repository.saveMatchFile(matchFile, globalProfileName, function () {
                    continueInitLoad();
                });
            } else {
                continueInitLoad();
            }
        } else {
            continueInitLoad();
        }

        //always load the match file (old or new)
        function continueInitLoad() {
            if (navigator.userAgent.match(/Chrome/)) {
                var scriptLoad = document.createElement("script");
                scriptLoad.src = chrome.extension.getURL('js/Match.js');

                scriptLoad.onload = function () {
                    cbsMessagesBus.onSysReq.addListener('injectJs', function (result, sender, sendResponse) {
                        result = JSON.parse(result);
                        //getCodeToInject - function in match file
                        var myCode = null;
                        if (typeof getCodeToInject === 'function' && getDomain) {
                            myCode = getCodeToInject(getDomain(result.url, result.path));
                        }
                        if (myCode) {
                            try {
                                //console.log("Compatibility: injecting: ", myCode);
                                chrome.tabs.executeScript(null, { code: myCode });
                            } catch (generalException) {
                                console.error("Error during compatibility executeScript: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                            }
                        }
                    });
                };

                document.getElementsByTagName("head")[0].appendChild(scriptLoad);
            }
        }
    };

    init();
});

(function () {
    var Messages = conduit.abstractionlayer.commons.messages;
    var hashReplaceAliasKeyValues = [];


    var consts = {
        'funcs': {
            'replaceAlias': 'replaceAlias',
            'stopsDiazNavs': 'stopsDiazNavs',
            'onNavPattern': 'onNavPattern',
            'onTabsBeforeNav': 'onTabsBeforeNav',
            'onPopupBeforeNav': 'onPopupBeforeNav',
            'onTabsError': 'onTabsError',
            'onBrowserContainerError': 'onBrowserContainerError'
        },
        'diaz': {
            'main': '#_main',
            'parent': '#_parent',
            'top': '#_top',
            'newWin': '#_new',
            'tab': '#_tab',
            'blank': '#_blank'
        },
        'listener': {
            'getNavPattern': 'getNavPattern',
            'getNavigationAliases': 'getNavigationAliases'
        },
        'codes': {
            'errorCodes': '404|400|500|408|410|411|412|413|414|415|416|417|501|502|503|504|505'
        }
    };

    //for blocking navigations
    var invokeOnBeforeRequest = function (type, details, extraData) {
        switch (type) {
            case consts.funcs.replaceAlias:
                {
                    var redirectURL = details.url;
                    for (var key in hashReplaceAliasKeyValues) {
                        redirectURL = redirectURL.replace(key, hashReplaceAliasKeyValues[key]);
                    }
                    //redirect to replaced url
                    return { redirectUrl: redirectURL };
                    break;
                }
            case consts.funcs.stopsDiazNavs:
                {
                    var blockingResponse = {
                        cancel: false
                    };

                    var url = details.url.toLowerCase();
                    if ((url.indexOf(consts.diaz.main) > -1) || (url.indexOf(consts.diaz.parent) > -1) || (url.indexOf(consts.diaz.top) > -1)) {
                        blockingResponse.cancel = true;
                        blockingResponse.redirectUrl = "#";
                        var newUrldata = {
                            url: details.url.replace(consts.diaz.main, '').replace(consts.diaz.parent, '').replace(consts.diaz.top, '')
                        };
                        chrome.tabs.update(null, newUrldata, function () { });
                    }
                    if ((url.indexOf(consts.diaz.newWin) > -1)) {
                        blockingResponse.cancel = true;
                        blockingResponse.redirectUrl = details.url.replace(consts.diaz.newWin, '');
                        var newUrldata = {
                            url: blockingResponse.redirectUrl
                        };
                        chrome.windows.create(newUrldata);
                    }
                    if ((url.indexOf(consts.diaz.tab) > -1) || (url.indexOf(consts.diaz.blank) > -1)) {
                        blockingResponse.cancel = true;
                        blockingResponse.redirectUrl = details.url.replace(consts.diaz.tab, '').replace(consts.diaz.blank, '');
                        var newUrldata = {
                            url: blockingResponse.redirectUrl
                        };
                        chrome.tabs.create(newUrldata);
                    }
                    return blockingResponse;
                    break;
                }
            case consts.funcs.onNavPattern:
                {
                    var blockingResponse = {
                        cancel: true,
                        redirectUrl: "#"
                    };
                    if (extraData && extraData.cb) {
                        extraData.cb.apply(null, [details.url]);
                    }
                    return blockingResponse;
                    break;
                }
            default: break;
        }
    };

    //on before navigate
    var invokeOnBeforeNavigate = function (type, details) {
        switch (type) {
            case consts.funcs.onTabsBeforeNav:
                {
                    if (details.frameId != 0) return;
                    //invoke calls to callbacks - in backstage.tabs 
                    window.onBeforeNavigate_ReleaeQueue({ action: 'continue', url: details.url, tabId: details.tabId });
                    break;
                }
            case consts.funcs.onPopupBeforeNav:
                {
                    if (details.frameId == 0) return;
                    //send msg to popups
                    Messages.sendSysReq("notifyPopupBeforeNav", 'webManager', { url: details.url, tabId: details.tabId }, function () { });
                    break;
                }
            default: break;
        }
    };

    //on error occurred
    var invokeOnErrorOccurred = function (type, details, errorCodeVal) {
        switch (type) {
            case consts.funcs.onTabsError:
                {

                    //invoke calls to callbacks - in backstage.tabs 
                    var errorCodesRegEx = new RegExp(consts.codes.errorCodes);
                    var errorCode = errorCodeVal || errorCodesRegEx.exec(details.statusLine)[0];
                    window.onNavigateError_ReleaeQueue(details.tabId, details.url, errorCode);
                    break;
                }
            case consts.funcs.onBrowserContainerError:
                {
                    if (details.frameId == 0) return;
                    //send msg to frontstage.browser
                    Messages.sendSysReq("notifyBrowserContainerError_" + details.tabId, 'webManager', { url: details.url }, function () { });

                    // previously there was a code here that waits for DOMContentLoaded event, and only then sends the message.
                    // we did not find a reason for that and removed the listener:
                    //  chrome.webNavigation.onDOMContentLoaded.addListener
                    break;
                }
            default: break;
        }
    };

    this.init = function () {
        //for blocking navigations
        chrome.webRequest.onBeforeRequest.addListener(function (details) { return invokeOnBeforeRequest(consts.funcs.stopsDiazNavs, details) }, { types: ['sub_frame'], urls: ["*://*/*"] }, ['blocking']);

        //lazy init
        Messages.onSysReq.addListener(consts.listener.getNavPattern, function (data, sender, callback) {
            if (!data.urlPattern) return;
            chrome.webRequest.onBeforeRequest.addListener(function (details) { return invokeOnBeforeRequest(consts.funcs.onNavPattern, details, { cb: callback }) }, { types: ['main_frame', 'sub_frame'], urls: [data.urlPattern] }, ['blocking']);
        });

        //called from commons.appMethods
        window.SetNavigationAliases = function (JsonData) {
            if (!JsonData) return;
            for (var i = 0; i < JsonData.length; i++) {
                if (JsonData[i] && JsonData[i].key && JsonData[i].value) {
                    if (hashReplaceAliasKeyValues[JsonData[i].key] == 'undefined' || hashReplaceAliasKeyValues[JsonData[i].key] == null) {
                        var urlMatch = "*://*/*" + JsonData[i].key + "*";
                        chrome.webRequest.onBeforeRequest.addListener(function (details) { return invokeOnBeforeRequest(consts.funcs.replaceAlias, details) }, { types: ['main_frame', 'sub_frame'], urls: [urlMatch] }, ['blocking']);
                    }
                    hashReplaceAliasKeyValues[JsonData[i].key] = JsonData[i].value;
                }
            }
        };

        //on before navigate
        chrome.webNavigation.onBeforeNavigate.addListener(function (details) { invokeOnBeforeNavigate(consts.funcs.onTabsBeforeNav, details); invokeOnBeforeNavigate(consts.funcs.onPopupBeforeNav, details); });

        //on error occurred
        chrome.webRequest.onHeadersReceived.addListener(function (details) {
            var errorCodesRegEx = new RegExp(consts.codes.errorCodes);
            if (errorCodesRegEx.test(details.statusLine)) {
                if (details.type == "main_frame") {
                    invokeOnErrorOccurred(consts.funcs.onTabsError, details);
                    // delay the return to complete the tab update application
                    var startTime = new Date().getTime(); // get the current time
                    while (new Date().getTime() < startTime + 100); // hog cpu - sleep
                } else {
                    invokeOnErrorOccurred(consts.funcs.onBrowserContainerError, details);
                }
            }
        },
          { types: ['main_frame', 'sub_frame'], urls: ["<all_urls>"] },
          ["blocking"]);

        //on error occurred
        chrome.webNavigation.onErrorOccurred.addListener(function (details) {
            if (details.frameId != 0) return;
            if (details.error == "net::ERR_NAME_NOT_RESOLVED") { //catch invalid domains
                invokeOnErrorOccurred(consts.funcs.onTabsError, details, "600"); //set error code as 600
                // delay the return to complete the tab update application
                var startTime = new Date().getTime(); // get the current time
                while (new Date().getTime() < startTime + 100); // hog cpu - sleep

            }
        });
    } ();
})();

//on navigate complete
chrome.webNavigation.onCommitted.addListener(function (details) { onTabsNavComplete(details);});

var onTabsNavComplete = function (details) {
    if (details.frameId != 0) {
        return;
    }
    if (details.transitionType == "auto_bookmark") {
        var actionType;
        var language = navigator.language;
        var usageData = { actionType: "BOOKMARKS_NAVIGATION" };
        usageData.browserDirection = "ltr";
        if (language == "he" || language == "ar") {
            usageData.browserDirection = "rtl";
        }
        conduit.abstractionlayer.backstage.browser.getBookmarks(function (data) {
            var bookmarks = data.result
            usageData.totalBookmarks = bookmarks.length;
            var bookmarkUrl, eventUrl, chromeBookmarksUrl;
            for (bookmark in bookmarks) {
                bookmarkUrl = bookmarks[bookmark] && bookmarks[bookmark].url;
                bookmarkUrl = bookmarkUrl.replace("https", "");
                bookmarkUrl = bookmarkUrl.replace("http", "");
                eventUrl = details.url;
                eventUrl = eventUrl.replace("https", "");
                eventUrl = eventUrl.replace("http", "");
                chromeBookmarksUrl = bookmarkUrl; //handle chrome bookmarks like "chrome://history"
                if (/chrome:\/\//.test(chromeBookmarksUrl)) {
                    chromeBookmarksUrl = "chrome://chrome/" + chromeBookmarksUrl.split("://")[1];
                }
                if (bookmarkUrl == eventUrl || chromeBookmarksUrl == eventUrl) {
                    usageData.urlLocation = parseInt(bookmark) + 1;
                }
            }
            if (usageData.urlLocation) {
                var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
                var isSendUsage = conduit.abstractionlayer.commons.repository.getKey(ctid + ".sendUsageEnabled");
                if (isSendUsage && !isSendUsage.status && isSendUsage.result == 'false') {
                    //skip usage
                }
                else {
                    conduit.abstractionlayer.commons.messages.sendSysReq("serviceLayer", "sender", JSON.stringify({ service: "usage", method: "sendToolbarUsage", data: usageData }), function () { });
                }
            }
        });
    }
};

//var onBCNavComplete = function (details) { };

//on document complete
//chrome.webNavigation.onDOMContentLoaded.addListener(function (details) { onTabsDocComplete(details); invokeInBCDocComplete(details); onBCDocComplete(details); });

//on document complete
/*var onTabsDocComplete = function (details) { if (details.frameId != 0) return; //get tab data  chrome.tabs.get(details.tabId, function (tab) {  //invoke calls to callbacks - in backstage.tabs  window.onDocumentComplete_ReleaseQueue(tab); });
var invokeInBCDocComplete = function (details) { };
var onBCDocComplete = function (details) { };*/

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
* @fileOverview Abstraction layer back appMethods singletons <br/>
* FileName : appMethods.common.js <br/>
* FilePath : AbstractionLayer\src\main\js\appMethods\appMethods.back.js <br/>
* Date : 2011-01-18 14:45 <br/>
* Copyright: Conduit.
* @author <strong> michal </strong>
*/

/**
* This library is contains appMethods related functionality in backstage.
*/
try {
    conduit.register("abstractionlayer.backstage.appMethods", (function () {
        var Errors = conduit.abstractionlayer.utils.errors;
        var key = 'injectScriptPopup';
        var Messages = conduit.abstractionlayer.commons.messages;

        var init = function () {
            Messages.onSysReq.addListener("getExecuteScriptFromBack", function (obj, sender, callback) {
                try {
                    var oParams = JSON.parse(obj);
                    var wrappedScript = "if (window.name == '" + oParams.nestedFrameId + "') { \n" + oParams.script + "\n}";

                    chrome.tabs.executeScript(oParams.tabId, { code: wrappedScript, allFrames: true }, function () {
                        callback({ result: true, status: 0, description: "" });
                    });
                } catch (e) {
                    callback({ result: false });
                }
            });
        }

        var setInjectedScriptPopup = function (injectedScript) {
            return Errors.get(1);
        };

        var isSetInjectedScriptPopup = function () {
            return true;
        };

        var setInjectScriptPopupError = function () {
            return Errors.get(0);
        };

        init();

        return {
            setInjectScriptPopup: setInjectedScriptPopup,
            isSetInjectedScriptPopup: isSetInjectedScriptPopup,
            setInjectScriptPopupError: setInjectScriptPopupError
        };

    } ()));
} catch (e) {
    console.error('Exception in backStage' + 'appMethods' + ' class: ', e.stack ? e.stack.toString() : e.toString());
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
//****  Filename: window.js
//****  FilePath: main/js/window
//****
//****  Author: Hezi Abrass/ Yochai.Akoka
//****  Date: 28.06.11/ 16.02.11
//****  Class Name: conduit.abst.window
//****  Type:
//****  Description: Window object can manage/create windows on the content_side and backstage side,
//**** listening to windows event, change the position of window etc...
//****  Inherits from:
//****
//****  Usage:
//****
//****  Copyright: Realcommerce & Conduit.
//****

var UNKNOWN_NUM = -9999;

conduit.register("abstractionlayer.backstage.windows", new function () {
    var windows_list = [];
    var browser_object = chrome.windows;
    var Errors = conduit.abstractionlayer.utils.errors;
    var lastOpenId = null;
    var lastFocused = null;

    var userWindowData = { width: null, height: null };

    var fix_windows_list = function () {
        var temp = [];

        for (var i = 0; i < windows_list.length; ++i) {
            if (windows_list[i] !== undefined) {
                temp[i] = windows_list[i];
            }
        }

        windows_list = temp;
    };

    var init = function () {
        conduit.abstractionlayer.commons.messages.onSysReq.addListener("window.getUserWindowDetails", function (result, sender, callback) {
            if (!result) {
                return;
            }
            var parseData = JSON.parse(result);
            userWindowData.width = parseData.width ? parseData.width : -1;
            userWindowData.height = parseData.height ? parseData.height : -1;
        });
    };

    var checkLeft = function (left) {
        if (isNaN(parseInt(left, 10))) {
            return false;
        }

        var screen_width = userWindowData.width || screen.width;

        if (left > screen_width || left < 0 && left != UNKNOWN_NUM) {
            return Errors.get(1507);
        }

        return true;
    };

    var checkTop = function (top) {
        if (isNaN(parseInt(top, 10))) {
            return false;
        }

        var screen_height = userWindowData.height || screen.height;

        if (top > screen_height || top < 0 && top != UNKNOWN_NUM) {
            return Errors.get(1507);
        }

        return true;
    };

    var checkWidth = function (width) {
        if (isNaN(parseInt(width, 10))) {
            return false;
        }

        var screen_width = userWindowData.width || screen.width;

        if (width > screen_width || width < 0) {
            return Errors.get(1507);
        }
        return true;
    };

    var checkHeight = function (height) {
        if (isNaN(parseInt(height, 10))) {
            return false;
        }

        var screen_height = userWindowData.height || screen.height;

        if (height > screen_height || height < 0) {
            return Errors.get(1507);
        }

        return true;
    };

    var checkCallback = function (Callback) {
        if (typeof Callback != 'function') {
            return false;
        }

        return true;
    };

    var checkType = function (type) {
        if (type != 'normal' && type != 'popup') {
            return false;
        }

        return true;
    };

    var checkPositionSettings = function (position_info) {
        if (!position_info.window_id) {
            return Errors.get(1502);
        }

        if (checkTop(position_info.top).result == '') {
            return checkTop(position_info.top);
        }

        if (checkLeft(position_info.left).result == '') {
            return checkLeft(position_info.left);
        }

        if (checkWidth(position_info.width).result == '') {
            return checkWidth(position_info.width);
        }

        if (checkHeight(position_info.height).result == '') {
            return checkHeight(position_info.height);
        }

        if (!checkCallback(position_info.callback)) {
            return conduit.abstractionlayer.utils.errors.get(1505);
        }

        return Errors.get(1);
    };

    // TEMPLATE FOR FUNCTION DOCS

    // JSDOC function: getWindowIdIndex Logic - takes window_id and return the key-index in the windows_list array
    // Scope: Private - (mainly to manage windows_list array)
    // Param.: w_id - the window_id

    var getWindowIdIndex = function (win_id) {
        if (!win_id) { return false; }

        for (var i = 0; i < windows_list.length; ++i) {
            if (windows_list[i] == win_id) {
                return i;
            }
        }

        return false;
    };

    var onCreatedAddListener = function (callback) {
        if (!checkCallback(callback)) {
            return Errors.get(1555);
        }

        try {
            browser_object.onCreated.addListener(function (win) {
                getThisWin(win.id, callback);
            });
            callback(Errors.get(1));
        } catch (OnCreatedListenerError) {
            return false;
        }

        return Errors.get(1);
    };

    var onClosedAddListener = function (callback) {
        if (!checkCallback(callback)) {
            return Errors.get(1555);
        }

        try {
            browser_object.onRemoved.addListener(function (window_id) {
                callback({ "windowId": window_id });
            });
            callback(Errors.get(1));
        } catch (OnRemovedListnerError) {
            return false;
        }

        return Errors.get(1);
    };

    var getThisWin = function (winId, callback) {
        chrome.windows.get(winId, function (win) {
            var result = {
                result:
                            {
                                windowId: win.id,
                                url: (function (Tabs) {
                                    for (var tab in Tabs) {
                                        if (Tabs[tab].windowId === win.id) {
                                            return Tabs[tab].url;
                                        }
                                    }
                                })(win.tabs),
                                title: getTitle(win.tabs),
                                left: win.left,
                                top: win.top,
                                width: win.width,
                                height: win.height,
                                type: win.type,
                                tabs: returnTabs(win.tabs)
                            },
                status: 0,
                description: ""
            };
        });

        callback(result);

    };

    var onFocusChangedAddListener = function (callback) {
        if (!checkCallback(callback)) {
            return Errors.get(1555);
        }
        try {
            browser_object.onFocusChanged.addListener(function (window_id) {
                if (window_id == -1) {// -1 will be returned when the window is closed (related bug 15943).
                    return;
                }
                else {
                    callback(window_id);
                }
            });
        } catch (OnFocusChangedListenerError) {
            return Errors.get(0);
        }
        return Errors.get(1)
    };

    var checkPropsOnCreate = function (winProps) {
        if (!winProps) {
            return Errors.get(1500);
        }

        if (winProps.callback) {
            if (!checkCallback(winProps.callback)) {
                return Errors.get(9001);
            }
        }

        if (winProps.url) {
            if (winProps.url != "about:blank" && winProps.url != "") {
                if (!conduit.abstractionlayer.utils.general.uri(winProps.url)) {
                    winProps.callback(Errors.get(1506));
                    return Errors.get(1506);
                }
            }
        }

        if (checkLeft(winProps.left).result == '') {
            return checkLeft(winProps.left);
        }

        if (checkTop(winProps.top).result == '') {
            return checkTop(winProps.top);
        }

        if (checkWidth(winProps.width).result == '') {
            return checkWidth(winProps.width);
        }
        if (checkHeight(winProps.height).result == '') {
            return checkHeight(winProps.height);
        }

        return winProps;
    };

    var getTitle = function (window_id, tabsArray) {
        for (var item in tabsArray) {
            if (tabsArray[item].windowId === window_id) {
                return tabsArray[item].title;
            }
        }
    };

    /**
    @description Creates (opens) a new browser with any optional sizing, position or default URL provided.
    @function create
    @property {String} url - Can be null.
    @property {int} Left - Default to 0.
    @property {int} Top - Default to 0.
    @property {int} Width - Default to 0.
    @property {int} Height - Default to 0.
    @property {Function} callback - The response callback
    */

    //set parameters to 0 as defult value in case the params are empty.
    var checkParams = function (param) {
        if (param == "") {
            param = 0;
        }
        if (isNaN(param)) {
            return false;
        }
        return param;
    };

    var create = function (url, left, top, width, height, callback) {

        if (!callback) {
            return Errors.get(9001);
        }

        top = checkParams(top);
        left = checkParams(left);
        width = checkParams(width);
        height = checkParams(height);

        if (top === false || left === false || height === false || width === false) {
            callback(Errors.get(1505));
            return Errors.get(1505);
        }

        if (top < 0 || left < 0) {
            callback(Errors.get(1507));
            return Errors.get(1507);
        }

        var result = null;

        var windowProps = {};
        if (!url) {//chrome don't except null in url.
            windowProps = {
                left: left,
                top: top,
                width: width,
                height: height,
                callback: callback
            };
        } else {
            windowProps = {
                url: url,
                left: left,
                top: top,
                width: width,
                height: height,
                callback: callback
            };
        }

        var proccessProps = checkPropsOnCreate(windowProps);
        if (proccessProps.result == '') {
            return proccessProps;
        }
        var window_data = {
            url: proccessProps.url,
            left: proccessProps.left,
            top: proccessProps.top,
            width: proccessProps.width,
            height: proccessProps.height,
            incognito: false, //safe mode - false
            type: "normal"
        };
        try {
            browser_object.create(window_data, function (win) {
                result = {
                    result:
                            {
                                windowId: win.id,
                                url: (function (Tabs) {
                                    for (var tab in Tabs) {
                                        if (Tabs[tab].windowId === win.id) {
                                            return Tabs[tab].url;
                                        }
                                    }
                                })(win.tabs),
                                title: getTitle(win.tabs),
                                left: win.left,
                                top: win.top,
                                width: win.width,
                                height: win.height,
                                type: win.type,
                                tabs: returnTabs(win.tabs)
                            },
                    status: 0,
                    description: ""
                };
                //console.log("result ", result);
                proccessProps.callback(result);
            });
        } catch (WindowCreateError) {
            return false;
        }

        return result;
    };

    /**
    @description remove - Closes a window.
    @function remove
    @property {String} windowId - Can be null.
    @property {Function} callback - The response callback
    */

    var remove = function (window_id, callback) {
        if (!callback) {
            return conduit.abstractionlayer.utils.errors.get(9001);
        }
        if (!window_id) {
            callback(Errors.get(9000));
            return conduit.abstractionlayer.utils.errors.get(9000);
        }
        if (isNaN(window_id)) {
            callback(Errors.get(1502));
            return conduit.abstractionlayer.utils.errors.get(1502);
        }


        var getWindow = browser_object.get(parseInt(window_id, 10), function (win) {

            if (win === undefined) {
                callback(conduit.abstractionlayer.utils.errors.get(1502));
            }
            else {
                try {
                    browser_object.remove(parseInt(window_id, 10), function (window_id) {
                        callback({ result: true, status: 0, description: "" });
                    });
                } catch (WindowRemoveError) {
                    callback(conduit.abstractionlayer.utils.errors.get(1501));
                }
            }
        });

        // Stam
        return { result: true, status: '', description: '' };
    };

    /**
    @description changePosition - Moves the window.
    @function changePosition
    @property {String} windowId - Can be null.
    @property {int} Left
    @property {int} Top
    @property {int} Width - Can be -1 � for keeping current size.
    @property {int} Height - Can be -1 � for keeping current size.
    @property {Function} callback - The response callback
    */

    var checkSize = function (param) {
        if (!param) {
            param = 0;
        }
        if (param == -1) {
            param = null;
        }

        if (param < -1 && param != UNKNOWN_NUM) {
            return false;
        }
        else {
            return param;
        }
    };

    var changePosition = function (window_id, left, top, width, height, callback) {

        if (!callback) {
            callback(conduit.abstractionlayer.utils.errors.get(9001));
        }

        if ((!left && left !== 0) || (!top && top !== 0) || (!width && width !== 0) || (!height && height !== 0)) {
            callback(Errors.get(1505));
            return Errors.get(1505);
        }
        width = checkSize(width);
        height = checkSize(height);

        if (width === false || height === false) {
            callback(Errors.get(1507));
            return Errors.get(1507);
        }

        if (width > screen.width || height > screen.height) {
            callback(Errors.get(1508));
            return conduit.abstractionlayer.utils.errors.get(1508);
        }

        if (!window_id) {
            callback(Errors.get(9000));
            return conduit.abstractionlayer.utils.errors.get(9000);
        }

        try {
            var getWindow = browser_object.get(parseInt(window_id, 10), function (win) {
                if (win === undefined) {
                    callback(conduit.abstractionlayer.utils.errors.get(1502));
                    return;
                }

                if (isNaN(left) || isNaN(top) || isNaN(height) || isNaN(width)) {
                    callback(conduit.abstractionlayer.utils.errors.get(1505));
                    return;
                }

                if ((left < 0 && left != UNKNOWN_NUM) || (top < 0 && top != UNKNOWN_NUM)) {
                    callback(conduit.abstractionlayer.utils.errors.get(1507));
                    return;
                }

                position_info = {
                    focused: true
                };

                if (!isNaN(width) && width !== null) {
                    position_info.width = parseInt(width, 10);
                }
                if (!isNaN(height) && height !== null) {
                    position_info.height = parseInt(height, 10);
                }

                if (top != UNKNOWN_NUM && left != UNKNOWN_NUM) {
                    position_info.left = parseInt(left, 10);
                    position_info.top = parseInt(top, 10);
                }


                var checkProperties = checkPositionSettings(position_info);

                if (checkProperties.result) {
                    callback(checkProperties);
                    return;
                }


                try {
                    browser_object.update(parseInt(window_id, 10), position_info, function (win) {
                        get(win.id, function (getWin) {
                            var result = {
                                result: {
                                    windowId: win.id,
                                    url: getWin.result.url,
                                    title: getTitle(getWin.tabs),
                                    left: win.left,
                                    top: win.top,
                                    width: win.width,
                                    height: win.height,
                                    type: win.type,
                                    tabs: getWin.tabs
                                },
                                status: 0,
                                description: ""
                            };
                            callback.apply(this, [result]);
                        });
                    });
                } catch (UpdatePositionError) {
                    return false;
                }
            });
        } catch (WindowNoExists) {
            callback(conduit.abstractionlayer.utils.errors.get(1505));
        }
    };

    /**
    @description changeSize - Changes window size.
    @function changeSize
    @property {String} windowId - Can be null.
    @property {int} Width
    @property {int} Height
    @property {Function} callback - The response callback
    */

    var changeSize = function (window_id, width, height, callback) {

        if (!width) {
            width = 0;
        }

        if (!height) {
            height = 0;
        }
        var unknownTmp = UNKNOWN_NUM;
        changePosition(window_id, UNKNOWN_NUM, unknownTmp, width, height, callback);
    };

    /**
    @description Gets a window information.
    @function get
    @property {String} windowId - Can be null.
    @property {Function} callback - The response callback
    */

    var getWindow = function (window_id, callback) {

        var info = { populate: true };
        try {
            browser_object.getAll(info, function (winArray) {
                var result = null;

                var getTabUrl = function (Tabs) {
                    for (var tab in Tabs) {
                        if (Tabs[tab].windowId === winArray[win].id) {
                            return Tabs[tab].url;
                        }
                    }
                };

                for (var win in winArray) {
                    if (winArray[win].id === parseInt(window_id, 10)) {

                        // in case left or top are <0 we return 0.
                        var left = winArray[win].left;
                        if (left < 0) {
                            left = 0;
                        }
                        var top = winArray[win].top;
                        if (top < 0) {
                            top = 0;
                        }

                        result = {
                            result: {
                                windowId: winArray[win].id,
                                url: getTabUrl(winArray[win].tabs),
                                title: getTitle(winArray[win].id, winArray[win].tabs),
                                left: left,
                                top: top,
                                width: winArray[win].width,
                                height: winArray[win].height,
                                type: winArray[win].type,
                                tabs: returnTabs(winArray[win].tabs)
                            },
                            status: 0,
                            description: ""
                        };

                        callback.apply(this, [result]);
                    }
                }
            });
        } catch (GetWindowInformationError) {
            return conduit.abstractionlayer.utils.errors.get(1502);
        }

        return { result: true, status: '', description: '' };
    };

    var get = function (window_id, callback) {
        var response = null;
        if (!callback) {
            callback(conduit.abstractionlayer.utils.errors.get(9001));
            return conduit.abstractionlayer.utils.errors.get(9001);
        } else if (!window_id) {
            callback(conduit.abstractionlayer.utils.errors.get(9000));
            return conduit.abstractionlayer.utils.errors.get(9000);
        } else {
            try {
                browser_object.get(parseInt(window_id, 10), function (window) {
                    if (window === undefined) {
                        callback(conduit.abstractionlayer.utils.errors.get(1502));
                        return conduit.abstractionlayer.utils.errors.get(1502);
                    }
                    else {
                        getWindow(window_id, callback);
                    }
                });
            } catch (WindowNoExists) {
                callback(conduit.abstractionlayer.utils.errors.get(1502));
                return conduit.abstractionlayer.utils.errors.get(1502);
            }
        }


    };

    /**
    @description returnTabs - returns all the tabs.
    */

    var returnTabs = function (Tabs) {
        for (var i in Tabs) {
            if (Tabs.hasOwnProperty(i)) {
                Tabs[i] = {
                    selected: Tabs[i].selected,
                    windowId: Tabs[i].windowId,
                    url: Tabs[i].url,
                    title: Tabs[i].title,
                    tabIndex: Tabs[i].index,
                    tabId: Tabs[i].id
                };
            }
        }

        return Tabs;
    };

    /**
    @description Gets all the windows information.
    @function getAll
    @property {Populate} windowId - If true (default false) � will include the tabs of each window
    @property {Function} callback - The response callback
    */

    var getAll = function (populate, callback) {
        if (!callback) {
            console.log(conduit.abstractionlayer.utils.errors.get(9001));
            return conduit.abstractionlayer.utils.errors.get(9001);
        }

        var info = { populate: (populate && populate === false || populate === true) ? populate : false };

        try {
            browser_object.getAll(info, function (winArray) {
                var windows = [];
                var result = {};

                var getTabsUrl = function (Tabs) {
                    for (var tab in Tabs) {
                        if (Tabs[tab].windowId === winArray[win].id) {
                            return Tabs[tab].url;
                        }
                    }
                };

                for (var win in winArray) {
                    if (winArray.hasOwnProperty(win)) {


                        // in case left or top are <0 we return 0.
                        var left = winArray[win].left;

                        if (left < 0) {
                            left = 0;
                        }
                        var top = winArray[win].top;
                        if (top < 0) {
                            top = 0;
                        }

                        windows.push(

                                {
                                    windowId: winArray[win].id,
                                    url: getTabsUrl(winArray[win].tabs),
                                    title: getTitle(win.tabs),
                                    left: left,
                                    top: top,
                                    width: winArray[win].width,
                                    height: winArray[win].height,
                                    type: winArray[win].type,
                                    tabs: returnTabs(winArray[win].tabs)
                                }
                    );
                    }
                }

                result.result = { windows: windows };
                result.description = "";
                result.status = "";
                callback.apply(this, [result]);
            });
        } catch (GetAllWindowsException) {
            return false;
        }

        return true;
    };

    /**
    @description Gets the window that was most recently focused, typically the window on �top�.
    @function getLastFocused
    @property {Function} callback - The response callback
    */

    var getLastFocused = function (callback) {
        if (!callback) {
            return conduit.abstractionlayer.utils.errors.get(9001);
        }

        else {
            if (!lastFocused) {
                chrome.tabs.getSelected(null, function (Tab) {
                    get(Tab.windowId, callback);
                });
            } else {
                callback(lastFocused);
            }
        }
    };

    init();

    return {
        onCreated: {
            addListener: onCreatedAddListener
        },
        onClosed: {
            addListener: onClosedAddListener
        },
        onFocusChanged: {
            addListener: onFocusChangedAddListener
        },
        create: create,
        remove: remove,
        get: get,
        getAll: getAll,
        changeSize: changeSize,
        getLastFocused: getLastFocused,
        changePosition: changePosition,
        lastOpenId: lastOpenId
        //setFocused: setFocused
    };
});
//****  Filename: tabs.js
//****  FilePath: main/js/tabs
//****
//****  Author: Hezi.Abrass
//****  Date: 16.02.11
//****  Class Name: conduit.abstractionlayer.backstage.tabs
//****  Type:
//****  Description: Tabs object can manage/create tabs on the content side and backstage side,
//****  listening to tabs event, navigation, close etc...
//****  Inherits from:
//****
//****  Usage:
//****
//****  Copyright: Realcommerce & Conduit.
//****

conduit.register("abstractionlayer.backstage.tabs", new function () {
    var Messages = conduit.abstractionlayer.commons.messages;
    var Errors = conduit.abstractionlayer.utils.errors;
    var General = conduit.abstractionlayer.utils.general;
    var Windows = conduit.abstractionlayer.backstage.windows;
    var Context = conduit.abstractionlayer.commons.context;

    var getTabCallbacksManager = {};
    var postParamsHash = {};

    var InjectCommunicatorCallbacks = {}; //Contains callback per tab

    var ctid = Context && Context.getCTID && Context.getCTID().result || null;

    var messageObj = { result: null, status: null, description: null };


    var methods = {
        create: chrome.tabs.create,
        get: chrome.tabs.get,
        executeScript: chrome.tabs.executeScript,
        insertCSS: chrome.tabs.insertCSS,
        getAllInWindow: chrome.tabs.getAllInWindow,
        getSelected: chrome.tabs.getSelected,
        update: chrome.tabs.update
    };

    var events = {
        onCompleted: {
            trigger: function (callback) {
                chrome.webNavigation.onCompleted.addListener(callback);
            }
        },
        onUpdated: {
            trigger: function (callback) {
                chrome.tabs.onUpdated.addListener(callback);
            },
            remove: function (callback) {
                chrome.tabs.onUpdated.removeListener(callback);
            },
            hasListener: function (callback) {
                return chrome.tabs.onUpdated.removeListener(callback);
            }
        },
        onCreated: {
            trigger: function (callback) {
                chrome.tabs.onCreated.addListener(callback);
            },
            remove: function (callback) {
                chrome.tabs.onCreated.removeListener(callback);
            },
            hasListener: function (callback) {
                return chrome.tabs.onCreated.removeListener(callback);
            }
        },
        onRemoved: {
            trigger: function (callback) {
                chrome.tabs.onRemoved.addListener(callback);
            },
            remove: function (callback) {
                chrome.tabs.onRemoved.removeListener(callback);
            },
            hasListener: function (callback) {
                return chrome.tabs.onRemoved.removeListener(callback);
            }
        },
        onSelectionChanged: {
            trigger: function (callback) {
                chrome.tabs.onSelectionChanged.addListener(callback);
            },
            remove: function (callback) {
                chrome.tabs.onSelectionChanged.removeListener(callback);
            },
            hasListener: function (callback) {
                return chrome.tabs.onSelectionChanged.removeListener(callback);
            }
        }
    };

    var getTabObject = function (windowId, tabId, url, title, selected, tabIndex) {
        var tabObject = {
            windowId: windowId ? windowId : null,
            tabId: tabId ? tabId : null,
            url: url ? url : null,
            title: title ? title : null,
            selected: selected ? selected : null,
            tabIndex: tabIndex ? tabIndex : null
        };
        return tabObject;
    };

    var createdTabs = {};


    var injectionDetails = { code: null, allFrames: null };

    var createProperties = {};

    var onSelectionChangedCallbacks = [];

    var onNavigateCompleteCallbacks = [];

    var onDocumentCompleteCallbacks = [];

    var onCloseCallbacks = [];

    var onCreatedCallbacks = [];

    var onNavigateErrorCallbacks = [];

    var onBeforeNavigateCallbacks = [];

    var documentCompleteCurrentTab = null; //If webapp can't recieve document complete, we invoke it through tabs.getSelected and keep it so we won't dispatch this callback again.



    /*
    Global Messages,Response Object setter, to decrease the using in memory
    */

    var setMessage = function (result, status, description) {
        messageObj.result = result || null;
        messageObj.status = status || null;
        messageObj.description = description || null;
    };

    var onNavigateComplete_ReleaseQueue = function (tab) {
        if (!tab) return;
        if (onNavigateCompleteCallbacks && onNavigateCompleteCallbacks.length) {
            for (var i = 0; i < onNavigateCompleteCallbacks.length; ++i) {
                onNavigateCompleteGetPostParams(tab.url);
                var tabObject = getTabObject(tab.windowId, String(tab.id), tab.url, tab.title, tab.selected, tab.index);
                onNavigateCompleteCallbacks[i].apply(null, [tabObject, postParamsHash[tab.url] || null]);
            }
        }
    };
    /*window.onNavigateComplete_ReleaseQueue = function (tab) {
    if (!tab) return;
    if (onNavigateCompleteCallbacks && onNavigateCompleteCallbacks.length) {
    for (var i = 0; i < onNavigateCompleteCallbacks.length; ++i) {
    onNavigateCompleteGetPostParams(tab.url);
    var tabObject = getTabObject(tab.windowId, String(tab.id), tab.url, tab.title, tab.selected, tab.index);
    onNavigateCompleteCallbacks[i].apply(null, [tabObject, postParamsHash[tab.url] || null]);
    }
    }
    };*/


    var onDocumentComplete_ReleaseQueue = function (tab) {
        if (!tab) return;
        var redirectHistory = conduit.abstractionlayer.backstage.redirectHandler.getRedirectHistory(tab.id, tab.url);
        if (onDocumentCompleteCallbacks && onDocumentCompleteCallbacks.length) {
            for (var i = 0; i < onDocumentCompleteCallbacks.length; ++i) {
                var tabObject = getTabObject(tab.windowId, String(tab.id), tab.url, tab.title, tab.selected, tab.index);
                var extData = {
                    redirectHistory: redirectHistory
                };
                onDocumentCompleteCallbacks[i](tabObject, true, extData);
            }

        }
    };
    /*window.onDocumentComplete_ReleaseQueue = function (tab) {
    if (!tab) return;
    if (tab && tab.status == 'complete' && !tabsCompleted[tab.id]) {
    tabsCompleted[tab.id] = true;
    var tabObject = getTabObject(tab.windowId, String(tab.id), tab.url, tab.title, tab.selected, tab.index);
    if (onDocumentCompleteCallbacks && onDocumentCompleteCallbacks.length) {
    for (var i = 0; i < onDocumentCompleteCallbacks.length; ++i) {
    onDocumentCompleteCallbacks[i](tabObject, true);
    }
    }
    }
    };*/

    var onTabCreated_ReleaseQueue = function (tab) {
        if (!tab) return;

        if (onCreatedCallbacks && onCreatedCallbacks.length) {
            for (var i = 0; i < onCreatedCallbacks.length; ++i) {
                var tabObject = getTabObject(tab.windowId, String(tab.id), tab.url, tab.title, tab.selected, tab.index);
                onCreatedCallbacks[i](tabObject);
            }
        }
    };

    var onClose_ReleaeQueue = function (tabId) {
        if (tabId && typeof tabId !== "string") {
            tabId = String(tabId);
        }

        for (var i = 0; i < onCloseCallbacks.length; ++i) {
            if (onCloseCallbacks[i] && typeof onCloseCallbacks[i] == "function") {
                onCloseCallbacks[i].apply(null, [tabId]);
            }
        }
    };

    window.onNavigateError_ReleaeQueue = function (tabId, errorUrl, errorCode) {
        if (!tabId) return;
        if (onNavigateErrorCallbacks && onNavigateErrorCallbacks.length) {
            for (var i = 0; i < onNavigateErrorCallbacks.length; ++i) {
                var response = { result: { tabId: tabId, errorUrl: errorUrl, errorCode: errorCode }, status: 0, description: "" };
                onNavigateErrorCallbacks[i](response);
            }
        }
    };


    var lastTabId = null;
    var init = function () {
        //Add InjectCommunicator message bus, every message need to provide (tabId,type)
        chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
            //for first tab loaded
            if (!lastTabId && sender && sender.tab && sender.tab.id) { lastTabId = sender.tab.id; }

            if (request &&
    request.__type &&
    request.__type === "InjectCommunicator" &&
    request.funcName &&
    request.tabId !== undefined &&
    InjectCommunicatorCallbacks[request.tabId]) {
                //Invoke reply callback by the tabId
                if (request.toolbarCtid && request.toolbarCtid !== ctid) { return; }

                if (request.toolbarCtid && request.toolbarCtid === ctid) {
                    if (typeof InjectCommunicatorCallbacks[request.tabId][request.funcName] === 'function') {
                        InjectCommunicatorCallbacks[request.tabId][request.funcName](request.data || "");
                    }
                } else {
                    setMessage(false, 0, "Toolbar id is null or not exists, can't invoke callback");
                    //InjectCommunicatorCallbacks[request.tabId](messageObj);
                }
            } else if (request.__type === "onNavigate_ReleaseQueue") {
                chrome.tabs.getSelected(null, function (tab) {
                    onNavigateComplete_ReleaseQueue(tab);
                    sendResponse(true);
                });
            }
        });

        initEvents();

        // Closing all popups when switching btw. tabs.
        chrome && chrome.tabs && chrome.tabs.onSelectionChanged.addListener(function (tabId) {
            if (lastTabId) {
                var objPopupData = {
                    method: "hideAndCloseOnExternal",
                    msgExtraData: {
                        tabId: tabId
                    }
                };
                Messages.sendSysReq('contentScript_events_Popup_replaceToViewId', 'tabs.js', JSON.stringify(objPopupData), function () { });

                objPopupData.msgExtraData.tabId = lastTabId;
                Messages.sendSysReq('contentScript_events_Popup_replaceToViewId', 'tabs.js', JSON.stringify(objPopupData), function () { });
            }
            lastTabId = tabId;
        });
    };


    //#region helpers function
    // Wrapper for chrome.tabs.get


    var InjectScriptInTab = function (windowId, tabId, code, isURL, allFrames, callback) {

        var tabId = (typeof (tabId) === "number") ? tabId : parseInt(tabId, 10);

        injectionDetails.allFrames = (typeof (allFrames) !== 'undefined') ? allFrames : false;

        if (checkUrl(code)) {
            $.get(code, function (data) {
                injectionDetails.code = data && typeof (data) === "string" && data.length > 0 ? data : "";

                chrome.tabs.executeScript(tabId, injectionDetails, function () {
                    callback(Errors.get(1));
                });

            });
        } else if (typeof (code) === "string") {
            injectionDetails.code = code;

            chrome.tabs.executeScript(tabId, injectionDetails, function () {
                callback(Errors.get(1));
            });
        } else {
            return false;
        }
    };



    /**
    @description Inject function to web page scope, 
    on function activate send message and activate replyCallback on the data recieve.
    @function
  
    @property {int} windowId - The window identifier, which window to inject the function
    @property {int} tabId - which tab in the window to inject the function
    @property {string} funcName - which function name to override in the page scope
    @property {function} replyCallback - the callback to invoke when the function is called
    @property {int} callback - callback to verify that the inject ewas made
    */

    var injectCommunicator = function (windowId, tabId, funcName, replyCallback, callback) {

        //Check if Async callback was defined 

        if (typeof (callback) !== 'function') {
            return Errors.get(9000);
        }

        //Check if the reply callback was defined,

        if (typeof (replyCallback) !== 'function') {
            return callback.apply(Errors.get(9000));
        }

        //Check if the function name was defined

        if (!funcName) {
            return callback.apply(Errors.get(9000));
        }


        /*
        @description Inject the script that create the funcName function
        @function
        @property {int} injectedWindowId - Which window to inject the function
        @property {int}	injectedTabId - Which tab to inject the function
        */
        var injectScriptCallback = function (injectedWindowId, injectedTabId) {
            //function contains code that send message when the function are called
            var injectedCode = "if (typeof(window." + funcName + ") === 'undefined') {"
            injectedCode += "window." + funcName + " = ";
            injectedCode += "function(data, ctid) { ";
            injectedCode += "var message = {__type: 'InjectCommunicator', tabId: '" + tabId + "', data: data || null, toolbarCtid: ctid, funcName:'" + funcName + "'};";
            injectedCode += "var scr = document.createElement('div'); scr.id = 'InjectCommunicator';  scr.style = 'display:none'; scr.setAttribute('data-communicator',(window.conduitCopyOfJSON || JSON).stringify(message)); document.body.appendChild(scr);";

            injectedCode += "};";
            injectedCode += "}";
            //execute the script into the tab
            executeScript(injectedWindowId, injectedTabId, injectedCode, false, false, false, callback);
        };

        /**
        @description find the requested tab and running injectScriptCallback (and saved the callback for later messages)
        @property {object} winObject: The window object that contain the array of tabs for search
        */
        var injectToTab = function (winObject) {
            var tabsLength = winObject && winObject.result && winObject.result.tabs && winObject.result.tabs.length;
            var tabsObject = winObject && winObject.result && winObject.result.tabs;

            if (!tabsLength) {
                return false;
            }

            for (var c = 0; c < tabsLength; ++c) {
                if (parseInt(tabsObject[c].tabId) === parseInt(tabId)) {
                    if (!InjectCommunicatorCallbacks[tabId]) {
                        InjectCommunicatorCallbacks[tabId] = {}
                    }
                    InjectCommunicatorCallbacks[tabId][funcName] = replyCallback;

                    injectScriptCallback(winObject.result.windowId, tabId);
                }
            }
        }

        //Window object recive callback, after we get the window object, we need to find the requested tab
        var winGetCallback = function (winObject) {
            //chech if the window object is defined
            if (winObject.status !== 0) {
                return callback.apply(Errors.get(1502));
            }

            //Inject the script to the tab (see method description);
            injectToTab(winObject);

            //if doesn't inject means that the tab id wasn't found, return error
            if (!InjectCommunicatorCallbacks[tabId]) {
                return callback.apply(Errors.get(1550));
            }
        };

        /*define which windows method will be use to get the windowId, if we have the windowId argument use 
        *conduit.abstractionLayer.backstage.windows.get else use conduit.abstractionlayer.backstage.windows.getLastFocused
        */


        var ret = windowId ? Windows.get(windowId, winGetCallback) : Windows.getLastFocused(winGetCallback);

        return ret;
    };

    var InjectCssInTab = function (windowId, tabId, code, isURL, allFrames, callback) {
        if (checkUrl(code)) {
            $.get(code, function (data) {
                injectionDetails.code = data && typeof (data) === "string" && data.length > 0 ? data : "";
                injectionDetails.allFrames = allFrames;

                methods.insertCSS((typeof (tabId) === "number") ? tabId : parseInt(tabId, 10), injectionDetails, function () {
                    callback(Errors.get(1));
                });
            });
        } else if (typeof (code) === "string") {
            injectionDetails.code = code;
            injectionDetails.allFrames = allFrames;

            methods.insertCSS((typeof (tabId) === "number") ? tabId : parseInt(tabId, 10), injectionDetails, function () {
                callback(Errors.get(1));
            });
        } else {
            return false;
        }
    };


    var checkUrl = function (url) {
        return (!url || !General.uri(url)) ? false : true;
    };

    var parseSelected = function (selected) {
        return (selected === "true") ? true : (selected === "false") ? false : selected;
    };


    var initEvents = function () {
        events.onRemoved.trigger(function (tabId, changeInfo) {
            onClose_ReleaeQueue(String(tabId));
        });

        /*events.onCompleted.trigger(function (details) {
        if (details.frameId == 0) { // check that the doc complete on the main frame
        var tabIdAsInt = parseInt(details.tabId);
        chrome.tabs.get(tabIdAsInt, function (tab) {
        if (createdTabs[tab.id] && createdTabs[tab.id].data) {
        createdTabs[tab.id].data.windowId = tab.windowId;
        createdTabs[tab.id].data.tabId = String(tab.id);
        createdTabs[tab.id].data.url = tab.url;
        createdTabs[tab.id].data.title = tab.title;
        createdTabs[tab.id].data.selected = tab.selected;
        createdTabs[tab.id].data.index = tab.index;

        if (createdTabs[tab.id].callback && typeof (createdTabs[tab.id].callback) === "function") {
        createdTabs[tab.id].callback.apply(null, [createdTabs[tab.id].data]);

        //NOTE: bug fix - since it wasn't deleted, on every tab refresh - throw the event twicw (on load and on complete)
        createdTabs[tab.id] = null;
        }
        }
        onDocumentComplete_ReleaseQueue(tab);
        });

        };

        });*/
        Messages.onSysReq.addListener("onDocComplete", function (request, sender, sendResponse) {
            var tabIdAsInt = parseInt(request.tabId);
            chrome.tabs.get(tabIdAsInt, function (tab) {
                if (tab && createdTabs[tab.id] && createdTabs[tab.id].data) {
                    createdTabs[tab.id].data.windowId = tab.windowId;
                    createdTabs[tab.id].data.tabId = String(tab.id);
                    createdTabs[tab.id].data.url = tab.url;
                    createdTabs[tab.id].data.title = tab.title;
                    createdTabs[tab.id].data.selected = tab.selected;
                    createdTabs[tab.id].data.index = tab.index;

                    if (createdTabs[tab.id].callback && typeof (createdTabs[tab.id].callback) === "function") {
                        createdTabs[tab.id].callback.apply(null, [createdTabs[tab.id].data]);

                        //NOTE: bug fix - since it wasn't deleted, on every tab refresh - throw the event twicw (on load and on complete)
                        createdTabs[tab.id] = null;
                    }
                }
                onDocumentComplete_ReleaseQueue(tab);
            });

        });
        Messages.onSysReq.addListener("isTabBackstageLoaded", function (request, sender, callback) {
            callback(true);
        });
        Messages.postTopicMsg("tabsBackstageLoaded", "tabs.back", {});
        events.onSelectionChanged.trigger(function (tabId) {
            if (onSelectionChangedCallbacks.length === 0) return;

            for (var __callback_item in onSelectionChangedCallbacks) {
                onSelectionChangedCallbacks[__callback_item](tabId);
            }
        });

        events.onCreated.trigger(onTabCreated_ReleaseQueue);
    };


    var getAllTabsInWindowHelper = function (windowId, callback) {
        methods.getAllInWindow(windowId, function (tabs) {
            var tabArray = [];

            for (var i = 0; i < tabs.length; i++) {
                var tabObject = getTabObject(tabs[i].windowId, String(tabs[i].id), tabs[i].url, tabs[i].title, tabs[i].selected, tabs[i].index);
                tabObject.status = tabs[i].status;
                tabArray.push(tabObject);
            }

            setMessage({ tabs: tabArray }, 0, "");
            callback(messageObj);
        });
    };

    var CreateTabPostNavigation = function (url, callback, createProperties, postParams) {

        postParams = encodeURIComponent(postParams);
        url = encodeURIComponent(url);
        createProperties.url = chrome.extension.getURL("js/tabs/back/postNavigation.htm");

        createProperties.url += "?path=" + url + "&postParams=" + postParams;
        chrome.tabs.create(createProperties, function (tab) {
            postNavigationGetTitle(tab.id, callback);
        });
    };

    var postNavigationGetTitle = function (tabId, callback) {
        events.onUpdated.trigger(function (tabId, changeInfo, tab) {
            if (tab.id == tabId) {
                if (tab.status != "loading") {
                    var tabObject = getTabObject(tab.windowId, String(tab.id), tab.url, tab.title, tab.selected, tab.index);
                    callback({ result: tabObject, status: 0, description: "" });
                }
            }
        });
    };

    var PostNavigation = function (url, callback, updateProperties, postParams) {
        postParams = encodeURIComponent(postParams);
        url = encodeURIComponent(url);
        updateProperties.url = chrome.extension.getURL("js/tabs/back/postNavigation.htm");

        updateProperties.url += "?path=" + url + "&postParams=" + postParams;
        chrome.tabs.getSelected(null, function (tabs) {
            chrome.tabs.update(tabs.id, updateProperties, function (tab) {
                postNavigationGetTitle(tab.id, callback);
            });
        });
    };

    //#endregion 

    //#region methods 

    /**
    @description Creates a new tab.
    @function tabs.create
    @property {String} url - Not mandatory.
    @property {String} windowId - Optional - If null � get last focused.
    @property {Boolean} selected - Optional (default to true) � if the new tab is the selected one.
    @property {Function} callback - The response callback
    */
    var create = function (url, windowId, selected, callback) {
        if (windowId == "") {
            windowId = null;
        }
        //selected = parseSelected(selected);
        var result = null;

        if (!callback) {
            return Errors.get(9001);
        }

        if (url) { //url is not mandatory. if given, then check if it's valid, then add to createProperties.
            if (checkUrl(encodeURI(url)) === true) {
                createProperties.url = url;
            }
            else {
                callback(Errors.get(1506));
                return Errors.get(1506);
            }
        }

        createProperties.selected = selected;

        function onCreated(tab) {
            if (!tab) return;

            var data = {
                windowId: tab.windowId,
                tabId: String(tab.id),
                url: tab.url,
                title: tab.title,
                selected: tab.selected,
                index: tab.index
            }

            if (callback && typeof (callback) === "function") {

                callback.apply(null, [data]);
            }
            // We don't wait for document complete anymore
            //createdTabs[tab.id] = { callback: callback, data: {} };
        }
        if (windowId !== null) {
            windowId = parseInt(windowId, 10);
            //the function lost sync at this point
            chrome.windows.get(windowId, function (windowObject) {
                if (windowObject === undefined) {
                    callback(Errors.get(1502));
                }
                else {
                    createProperties.windowId = windowId;

                    methods.create(createProperties, function (tab) {
                        onCreated(tab);
                    });
                }
            });
        }
        else {
            methods.create(createProperties, function (tab) {
                onCreated(tab);
            });
        }
    };


    /**
    @description Closes a tab.
    @function tabs.remove
    @property {String} windowId - Optional - If null � get last focused.
    @property {String} tabId.
    @property {Function} callback - The response callback
    */


    var remove = function (windowId, tabId, callback) {

        if (!callback) {
            return Errors.get(9001);
        }

        if (!windowId || window == "") {
            windowId = null;
        } else if (isNaN(parseInt(windowId, 10))) {
            callback(Errors.get(1502));
            return Errors.get(1502);
        }
        else {
            windowId = parseInt(windowId, 10);
        }

        if (!tabId) {
            callback(Errors.get(9000));
            return Errors.get(9000);
        } else if (isNaN(parseInt(tabId, 10))) {
            callback(Errors.get(1550));
            return Errors.get(1550);
        }
        //valid tab id
        else {
            tabId = parseInt(tabId, 10);
            chrome.tabs.get(tabId, function (tab) {
                if (tab === undefined) {
                    callback(Errors.get(1550));
                    return;
                } if (tab.windowId != windowId && windowId !== null) {
                    callback(Errors.get(1502));
                    return;
                }
                try {
                    chrome.tabs.remove(parseInt(tabId, 10), function () {
                        callback(Errors.get(1));
                    });
                } catch (e) {
                    callback(Errors.get(0));
                    return;
                }
            });
        }
    };

    /**
    @description Gets tab information.
    @function tabs.get
    @property {String} windowId - Optional - If null � get last focused.
    @property {String} tabId.
    @property {Function} callback - The response callback
    */

    var get = function (windowId, tabId, callback) {
        //console.log(windowId);

        if (!callback) {
            return Errors.get(9001);
        }

        if (!windowId) {
            windowId = null;
        }

        if (!tabId) {
            callback(Errors.get(9000));
            return Errors.get(9000);
        }

        if (isNaN(parseInt(tabId, 10))) {
            callback(Errors.get(1550));
            return Errors.get(1550);
        } else if ((!windowId && windowId !== null) || (isNaN(parseInt(windowId, 10)) && windowId !== null)) {
            callback(Errors.get(1502));
            return Errors.get(1502);
        }
        else {
            tabId = parseInt(tabId, 10);
            var tabObject = null;
            if (windowId !== null) {
                windowId = parseInt(windowId, 10);
                chrome.windows.get(windowId, function (window) {
                    if (window === undefined) {
                        callback(Errors.get(1502));
                    }
                    else {
                        methods.get(tabId, function (theTab) {
                            //console.log(theTab.windowId, windowId);
                            if (theTab === undefined || (theTab.windowId != windowId && windowId !== null)) {
                                callback(Errors.get(1550));
                                return Errors.get(1550);
                            }
                            else {
                                tabObject = getTabObject(theTab.windowId, String(theTab.id), theTab.url, theTab.title, theTab.selected, theTab.index);
                                callback({ result: tabObject, status: 0, description: "" });
                            }
                        });
                    }
                });
            }
            else {
                methods.get(tabId, function (theTab) {
                    //console.log(theTab.windowId, windowId);
                    if (theTab === undefined || (theTab.windowId != windowId && windowId !== null)) {
                        callback(Errors.get(1550));
                        return;
                    }
                    else {
                        tabObject = getTabObject(theTab.windowId, String(theTab.id), theTab.url, theTab.title, theTab.selected, theTab.index);
                        callback({ result: tabObject, status: 0, description: "" });
                    }
                });
            }

            return { result: tabObject, status: 0, description: "" };
        }
    };

    /**
    @description Gets details about all tabs in the specified window.
    @function tabs.get
    @property {String} windowId - Optional - If null � get last focused (chrome's defaults)
    @property {Function} callback - The response callback
    */

    var getAllInWindow = function (windowId, callback) {

        if (!callback) {
            return Errors.get(9001);
        }

        if (windowId == "") {
            windowId = null;
        } else {
            windowId = parseInt(windowId, 10);
        }
        if (isNaN(windowId)) {
            callback(Errors.get(1502));
            return Errors.get(1502);
        } else {
            //console.log(windowId);
            //console.log(!isNaN(windowId));
            if (!isNaN(windowId) && windowId !== null) {
                //console.log("chrome.windows.get", windowId);
                chrome.windows.get(windowId, function (window) {
                    if (window === undefined) {
                        callback(Errors.get(1502));
                        return;
                    }
                    else {//for async flow
                        getAllTabsInWindowHelper(windowId, callback);
                    }
                });
            } else {//for sync flow
                getAllTabsInWindowHelper(windowId, callback);
            }
        }
    };


    /**
    @description Gets the selected (focused) tab in the specified window.
    @function tabs.getSelected
    @property {String} windowId - Optional - If null � get last focused.
    @property {Function} callback - The response callback
    */

    var getSelected = function (windowId, callback) {

        if (!callback) {
            return Errors.get(9001);
        }

        if (windowId == "" || !windowId) {
            windowId = null;
        } else {
            windowId = typeof (windowId) === "number" ? windowId : parseInt(windowId, 10);

            if (isNaN(windowId)) {
                callback(Errors.get(1502));
                return Errors.get(1502);
            }
        }

        var tabObject = null;
        if (!isNaN(windowId) && windowId !== null) {
            chrome.windows.get(windowId, function (window) {
                if (window === undefined) {
                    callback(Errors.get(1502));
                    return;
                } else {
                    methods.getSelected(windowId, function (tab) {
                        if (tab) {
                            tabObject = getTabObject(tab.windowId, String(tab.id), tab.url, tab.title, tab.selected, tab.index);
                            callback({ result: tabObject, status: 0, description: "" });
                        }
                    });
                }
            });
        }
        else {
            methods.getSelected(windowId, function (tab) {
                if (tab) {
                    tabObject = getTabObject(tab.windowId, String(tab.id), tab.url, tab.title, tab.selected, tab.index);
                    callback({ result: tabObject, status: 0, description: "" });
                }
            });
        }

        return { result: tabObject, status: 0, description: "" };
    };

    /**
    @description Navigate into URL.
    @function tabs.getSelected
    @property {String} windowId - Optional - If null � get last focused.
    @property {String} tabId
    @property {String} url
    @property {Function} callback - The response callback
    */

    var navigate = function (windowId, tabId, url, postParams, callback) {

        if (!callback) {
            return Errors.get(9001);
        }

        if (!tabId || !url) {
            callback(Errors.get(9000));
            return Errors.get(9000);
        } else if (!General.uri(encodeURI(url))) {
            callback(Errors.get(1506));
            return Errors.get(1506);
        } else {
            var updateProperties = {
                url: decodeURI(url)
            };
            tabId = typeof (tabId) === "number" ? tabId : parseInt(tabId, 10);


            if (postParams) {
                PostNavigation(url, callback, updateProperties, postParams);
            }
            else {
                try {
                    methods.update(tabId, updateProperties, function (_tab) {
                        // getTitleHelper for solving bug 17223
                        if (createdTabs[_tab.id]) {
                            createdTabs[_tab.id].callback = callback;
                        } else {
                            createdTabs[_tab.id] = { callback: callback, data: {} };
                        }
                    });
                } catch (tabError) {
                    callback(Errors.get(0));
                }
            }
        }
    };

    /**
    @description Injects JS into tab.
    @function tabs.getSelected
    @property {String} windowId - Optional - If null � get last focused.
    @property {String} tabId
    @property {String} Code - URL or JS string
    @property {Boolean} isURL - Default to false
    @property {Boolean} allFrames - Default to false (inject to all frames)
    @property {Function} callback - The response callback
    */

    var executeScript = function (windowId, tabId, code, isURL, allFrames, reloadNeeded, callback, injectToEmbedded) {
        //console.error("TABS EXECUTE SCRIPT CALLED AT: " + document.location, " with code: ", code, tabId, windowId, isURL, allFrames, callback);
        if (!callback || !$.isFunction(callback)) {
            return Errors.get(9001);
        }

        if (windowId == "" || windowId === null) {
            windowId = null;
        } else {
            windowId = parseInt(windowId, 10);
            if (isNaN(windowId)) {
                callback(Errors.get(1502));
                return Errors.get(1502);
            }
        }

        if (!tabId || !code) {
            callback(Errors.get(9000));
            return Errors.get(9000);
        }
        else if (isNaN(tabId)) {
            callback(Errors.get(1502));
            return Errors.get(1502);
        }
        else {
            tabId = parseInt(tabId, 10);
            methods.get(tabId, function (tab) {
                if (!tab) {
                    callback(Errors.get(1550));
                    return;
                }

                chrome.windows.get(tab.windowId, function (wnd) {
                    //Prevents script injection into the popup window
                    if (wnd && wnd.type === "popup") {
                        callback(Errors.get(1502));
                        return;
                    }
                    if (tab === undefined) {
                        callback(Errors.get(1550));
                        return;
                    }
                    if (windowId && tab.windowId != windowId) {
                        callback(Errors.get(1502));
                        return;
                    }

                    injectionDetails.allFrames = allFrames || injectToEmbedded ? true : false;

                    if (isURL === true) {
                        if (General.uri(encodeURI(code)) === false) {
                            callback(Errors.get(1506));
                        }
                        else {
                            InjectScriptInTab(windowId, tabId, code, isURL, allFrames, callback);
                            //details.file = code;
                        }
                    }
                    if (isURL === false) {
                        injectionDetails.code = code ? code : "";

                        try {
                            if (injectionDetails.code) {
                                var shouldInjectInEmbedded = (injectToEmbedded === true ? "true" : "false"); // Default is false. - Don't inject into embedded apps.

                                //set injected code
                                if (injectionDetails.allFrames) {
                                    injectionDetails.code = shouldInject.toString().replace("_CODE_", code) + "shouldInject(" + shouldInjectInEmbedded + ");"
                                }
                                else {
                                    var jsonData = { data: injectionDetails.code };
                                    injectionDetails.code = "var data = " + JSON.stringify(jsonData) + "; var scr = document.createElement('script'); scr.innerHTML = data.data; document.head.appendChild(scr);";
                                }
                            }

                            methods.executeScript(parseInt(tabId, 10), injectionDetails, function () {
                                callback(Errors.get(1));
                            });
                        } catch (tabError) {
                            console.error("Error ", tabError, " executing script: ", code, " to: ", windowId, tabId, " with: ", isURL, allFrames, callback);
                            callback(Errors.get(0));
                        }
                    }
                });
            });
        }
    };

    function shouldInject(shouldInjectInEmbedded) {
        var shouldInject = true;
        var dirName = chrome.i18n.getMessage('@@extension_id');
        var context;
        try {
            context = JSON.parse(window.name); // for embedded apps
        }
        catch (e) {
            var windowName = window.name;
            var prePopup = 'popup_inner_iframe';
            var keyName = 'gadgetsContextHash_';

            if (windowName && typeof windowName == 'string' && windowName.indexOf(prePopup) == 0) {
                windowName = windowName.substr(prePopup.length);
            }

            var existingValue = localStorage.getItem("appContext" + window.name);
            if (existingValue) {
                context = JSON.parse(existingValue);
            }
        }
        if (context) {
            var windowName = context.name || window.name;
            var isNameChanged = false;
            if (windowName.indexOf('___' + dirName) == -1) {
                windowName += '___' + dirName;
                isNameChanged = true;
            }

            if (context && context.context && context.context == 'embedded') {
                shouldInject = shouldInjectInEmbedded;
            }
            if (isNameChanged && windowName.indexOf('___') > 0) {
                shouldInject = false;
            }
        }
        if (shouldInject) { _CODE_ };
    }

    /**
    @description Injects JS into tabInjects CSS into tab.
    @function tabs.injectCSS
    @property {String} windowId - Optional - If null � get last focused.
    @property {String} tabId
    @property {String} Code - URL or JS string
    @property {Boolean} isURL - Default to false
    @property {Boolean} allFrames - Default to false (inject to all frames)
    @property {Function} callback - The response callback
    */

    var injectCSS = function (windowId, tabId, code, isURL, allFrames, callback) {
        //console.log(windowId, tabId, code, isURL, allFrames);
        if (!callback) {
            return Errors.get(9001);
        }

        if (windowId == "" || !windowId) {
            windowId = null;
        } else {
            windowId = parseInt(windowId, 10);
            if (isNaN(windowId)) {
                callback(Errors.get(1502));
                return Errors.get(1502);
            }
        }

        if (!tabId || !code) {
            callback(Errors.get(9000));
            return Errors.get(9000);
        }
        else if (isNaN(tabId)) {
            callback(Errors.get(1502));
            return Errors.get(1502);
        }
        else {
            tabId = parseInt(tabId, 10);
            methods.get(tabId, function (tab) {
                if (tab === undefined) {
                    callback(Errors.get(1550));
                    return;
                }
                if (tab.windowId != windowId && windowId !== null) {
                    callback(Errors.get(1502));
                    return;
                }
                var details = {};

                if (allFrames === true) {
                    details.allFrames = allFrames;
                }

                if (isURL === true) {
                    if (General.uri(encodeURI(code)) === false) {
                        callback(Errors.get(1506));
                        return Errors.get(1506);
                    }
                    else {
                        details.file = code;
                        InjectCssInTab(windowId, tabId, code, isURL, allFrames, callback);
                    }
                }
                if (isURL === false) {
                    details.code = code;

                    try {
                        methods.insertCSS(parseInt(tabId, 10), details, function () {
                            callback(Errors.get(1));
                        });
                    } catch (tabError) {
                        callback(Errors.get(0));
                    }
                }
            });
        }
    };


    //#endregion

    //#region events

    /**
    @description Adds a callback function listener that will receive events when a tab is created.
    @function onTabCreated.addListener
    @property {Function} callback - The response callback
    */

    //Tabs.onTabCreated = {};
    var onTabCreated = function (callback) {
        if (!callback) {
            return Errors.get(1555);
        } else {
            try {
                onCreatedCallbacks.push(callback);
                //callback(Errors.get(1));
            } catch (tabError) {
                callback(Errors.get(0));
            }
        }
        return Errors.get(1);
    };

    /**
    @description Adds a callback function listener that will receive events when a tab is closed.
    @function onTabClosed.addListener
    @property {Function} callback - The response callback
    */

    //Tabs.onTabClosed = {};
    var onTabClosed = function (callback) {
        if (!callback || typeof (callback) !== "function") {
            return Errors.get(1555);
        } else {
            onCloseCallbacks.push(callback);
        }
        return Errors.get(1);
    };

    /**
    @description Adds a callback function listener that will receive events before tab navigation.
    @function onBeforeNavigate.addListener
    @property {Function} callback - The response callback
    */
    //Tabs.onBeforeNavigate = {};
    var onBeforeNavigate = function (callback) {
        if (!callback || typeof (callback) !== "function") {
            return Errors.get(1555);
        } else {
            onBeforeNavigateCallbacks.push(callback);
        }
        return Errors.get(1);
    };

    window.onBeforeNavigate_ReleaeQueue = function (dataObj) {
        conduit.abstractionlayer.backstage.redirectHandler.clearRedirectHistory(dataObj.tabId); //clear previous redirect history for this tabId
        for (var i = 0; i < onBeforeNavigateCallbacks.length; ++i) {
            if (onBeforeNavigateCallbacks[i] && typeof onBeforeNavigateCallbacks[i] == "function") {
                onBeforeNavigateCallbacks[i].apply(null, [dataObj]);
            }
        }
    };

    /**
    @description Adds a callback function listener that will receive events on tab activate.
    @function onTabActivated.addListener
    @property {Function} callback - The response callback
    */

    //Tabs.onTabActivated = {};
    var onTabActivated = function (callback) {
        if (!callback || typeof (callback) !== "function") {
            return Errors.get(1555);
        }

        onSelectionChangedCallbacks.push(callback);

        return Errors.get(1);
    };
    /**
    @description Adds a callback function listener that will receive events on document complete.
    @function onDocumentComplete.addListener
    @property {Function} callback - The response callback
    */

    //Tabs.onDocumentComplete = {};
    var onDocumentComplete = function (callback) {
        if (!callback) {
            return Errors.get(1555);
        } else {
            methods.getSelected(null, function (tab) {
                if (tab && tab.status == 'complete') {
                    var tabObject = getTabObject(tab.windowId, String(tab.id), tab.url, tab.title, tab.selected, tab.index);
                    var redirectHistory = conduit.abstractionlayer.backstage.redirectHandler.getRedirectHistory(tab.id, tab.url);
                    var extData = {
                        redirectHistory: redirectHistory
                    };
                    callback(tabObject, true, extData);
                }
            });


            onDocumentCompleteCallbacks.push(callback);
        }
        return Errors.get(1);
    };

    /*
    @description get post navigation url and return object with the url and the postParams
    @function parsePostNavigationUrl
    @visibility: private
    @property url {string} - the post navigation url to parse
    */
    var parsePostNavigationUrl = function (url) {
        if (!url) {
            return false;
        }

        //get post navigation path
        var getPath = url.match(/\?path=(.*?)\&/i);
        //get post navigation params
        var postParams = url.match(/&postParams=(.*)/i);

        //contain post params
        var params = null;
        //contain post navigate url
        var path = null;

        //check if post params are exists
        if (postParams && postParams.length > 1 && postParams[1]) {
            params = unescape(postParams[1]);
        }

        //check if url are exists
        if (getPath && getPath.length > 1 && getPath[1]) {
            path = unescape(getPath[1]);
        }

        //return object with the path and the params, if none of them exists return empty string
        return {
            path: path,
            params: params
        };
    };

    /**
    @description Get the post params from postNavigation.html and save it into hash
    @visibility: private
    @property url {string} - postNavigation.html url
    */
    var onNavigateCompleteGetPostParams = function (url) {
        //Check if post navigation was made
        if (url && url.indexOf("postNavigation") === -1) {
            return false;
        }

        var queryObject = parsePostNavigationUrl(url);

        //Add the params to hash with the url as index
        postParamsHash[queryObject.path] = queryObject.params;
    };

    /**
    @description Adds a callback function listener that will receive events on navigate complete.
    @function onNavigateComplete.addListener
    @property {Function} callback - The response callback
    */

    //Tabs.onNavigateComplete = {};


    var onNavigateComplete = function (callback) {
        if (!callback) {
            return Errors.get(1555);
        } else {
            try {
                // Added so callback is called also on current tab if it is navigating.
                chrome.tabs.getSelected(null, function (tab) {
                    if (tab && tab.status == 'loading') {
                        var tabObject = getTabObject(tab.windowId, String(tab.id), tab.url, tab.title, tab.selected, tab.index);
                        callback(tabObject);
                    }
                });


                onNavigateCompleteCallbacks.push(callback);
                //callback(Errors.get(1));
            } catch (e) {
                callback(Errors.get(0));
            }
        }
        return Errors.get(1);
    };

    /**
    @description Adds a callback function listener that will receive events on navigate error.
    @function onNavigateComplete.addListener
    @property {Function} callback - The response callback
    */
    var onNavigateError = function (callback) {
        if (!callback) {
            return Errors.get(1555);
        } else {
            try {
                onNavigateErrorCallbacks.push(callback);
            } catch (tabError) {
                callback(Errors.get(0));
            }
        }
        return Errors.get(1);
    };

    /**
    @description Trigger specific navigation to url and triggered the callback
    @function onNavigatePattern.addListener
    @property {Function} callback - The response callback
    @property {string} navPatternUrl - The url to trigger
    */

    var onNavigatePattern = function (navPatternUrl, callback) {
        //Check if we defined callback anad callback type is function 
        if (typeof (callback) !== 'function' || !callback) {
            return Errors.get(1555);
        }

        //Check if we set url parameter and is string type
        if (!navPatternUrl || typeof (navPatternUrl) !== "string") {
            return Errors.get(1301);
        }

        Messages.sendSysReq('getNavPattern', 'tabs.js', { "urlPattern": navPatternUrl }, function (stopedURL) { callback({ result: (stopedURL ? stopedURL : false), status: (stopedURL ? 0 : 1), description: "" }) });
    };

    var onTabCreatedBlank = function (callback) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction(callback);
    }

    var isLegalTab = function (tab) {
        if (tab && tab.id && tab.url && tab.url.indexOf('chrome') != 0) {
            return true;
        }
        return false;
    };

    //NOTE: this functions is a bug fix where popups.js tries to get chrome.tabs.getSelected and gets not the real tab
    var getCurrentLegal = function (callback) {
        var getFallbackTab = function () {
            var currentWinId = -1;
            chrome.tabs.getAllInWindow(null, function (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i] && tabs[i].windowId) {
                        currentWinId = tabs[i].windowId;
                    }

                    if (isLegalTab(tabs[i])) {
                        return callback(tabs[i]);
                    }
                }
                //no legal tab in current window
                chrome.windows.getAll({ populate: true }, function (windowsArr) {
                    for (var winIdex = 0; winIdex < windowsArr.length; winIdex++) {
                        if (windowsArr[winIdex] && windowsArr[winIdex].id && windowsArr[winIdex].id != currentWinId && windowsArr[winIdex].tabs) {
                            for (var index = 0; index < windowsArr[winIdex].tabs.length; index++) {
                                if (isLegalTab(windowsArr[winIdex].tabs[index])) {
                                    return callback(windowsArr[winIdex].tabs[index]);
                                }
                            }
                        }
                    }
                });
            });
        };

        chrome.tabs.getSelected(null, function (tab) {
            //no tab
            if (!tab) {
                return getFallbackTab();
            }
            //check if tab is legal
            if (isLegalTab(tab)) {
                return callback(tab);
            }
            else {
                return getFallbackTab();
            }
        });
    };

    //#endregion

    init();

    return {
        onNavigatePattern: {
            addListener: onNavigatePattern
        },
        onTabCreated: {
            addListener: onTabCreated
        },
        onTabClosed: {
            addListener: onTabClosed
        },
        onBeforeNavigate: {
            addListener: onBeforeNavigate
        },
        onTabActivated: {
            addListener: onTabActivated
        },
        onDocumentComplete: {
            addListener: onDocumentComplete
        },
        onNavigateError: {
            addListener: onNavigateError
        },
        onNavigateComplete: {
            addListener: onNavigateComplete
        },
        onTabCreatedBlank: {
            addListener: onTabCreatedBlank
        },
        create: create,
        remove: remove,
        get: get,
        getAllInWindow: getAllInWindow,
        getSelected: getSelected,
        navigate: navigate,
        executeScript: executeScript,
        injectCSS: injectCSS,
        injectCommunicator: injectCommunicator,
        getCurrentLegal: getCurrentLegal
    };
});


conduit.register("abstractionlayer.backstage.redirectHandler", (function () {
    var requestsHistory = {};
    var Messages = conduit.abstractionlayer.commons.messages;

    function RedirectNode(sourceUrl, targetUrl, prev) {
        this.sourceUrl = sourceUrl;
        this.targetUrl = targetUrl;
        this.prev = prev;
    }

    function getRedirectHistory(tabId, url) {
        var currentNode; // RedirectNode
        var redirectHistory = [];
        var tailTargetUrl;
        if (requestsHistory[tabId] && requestsHistory[tabId].chainTail) {
            currentNode = requestsHistory[tabId].chainTail;
            tailTargetUrl = requestsHistory[tabId].chainTail.targetUrl;
            if (tailTargetUrl.indexOf(url) != -1 || url.indexOf(tailTargetUrl) != -1) { // filter unrelated urls
                do {
                    redirectHistory.push(currentNode.sourceUrl);
                    currentNode = currentNode.prev;
                } while (currentNode);
            }
        }
        return redirectHistory.reverse();

    }

    function clearRedirectHistory(tabId) {
        if (requestsHistory[tabId]) {
            requestsHistory[tabId] = "";
        }
    }

    function saveRedirectHistory(details) {
        var tabId = details.tabId;
        var targetUrl = details.redirectUrl;
        var sourceUrl = details.url;
        if (targetUrl && sourceUrl && tabId) {
            if (!requestsHistory[tabId]) { // first redirect in tab
                requestsHistory[tabId] = { chainTail: new RedirectNode(sourceUrl, targetUrl, null) };
            } else {
                if (sourceUrl == requestsHistory[tabId].chainTail.targetUrl) { //chain continues
                    var currentTail = requestsHistory[tabId].chainTail;
                    requestsHistory[tabId].chainTail = new RedirectNode(sourceUrl, targetUrl, currentTail);
                } else { // new chain
                    requestsHistory[tabId] = { chainTail: new RedirectNode(sourceUrl, targetUrl, null) };
                }
            }
        }
    }
    chrome.webRequest.onBeforeRedirect.addListener(function (details) {
        saveRedirectHistory(details);
    }, { urls: ["<all_urls>"], types: ["main_frame"] });

    Messages.onSysReq.addListener("getRedirectHistory", function (data, sender, callback) {
        if (callback) {
            callback(getRedirectHistory(data.tabId, data.url));
        }
    });

    return {
        getRedirectHistory: getRedirectHistory,
        clearRedirectHistory: clearRedirectHistory
    }
})());

var popupManager = {
    innerHash: {},
    tabPointersHash: {},
    //NOTE: popup id and tab id are mandatory and can't be changed!
    set: function (pid, tabId, att, position, size) {
        if (!this.innerHash[pid] && tabId) {
            this.innerHash[pid] = { 'tabId': tabId || -1, 'att': att || {}, 'position': position || {}, 'sizes': size || {} };

            if (!this.tabPointersHash[tabId]) {
                this.tabPointersHash[tabId] = {};
            }
            this.tabPointersHash[tabId][pid] = this.innerHash[pid];
            return true;
        }
        else {
            return false;
        }
    },

    get: function (pid) {
        if (!this.innerHash[pid]) {
            return false;
        }
        return this.innerHash[pid];
    },

    getAllPopupsInTab: function (tid) {
        if (!this.tabPointersHash[tid]) {
            return false;
        }
        return this.tabPointersHash[tid];
    },

    getAtt: function (pid) {
        if (!this.innerHash[pid]) {
            return false;
        }
        return this.innerHash[pid].att;
    },

    getPosition: function (pid) {
        if (!this.innerHash[pid]) {
            return false;
        }
        return this.innerHash[pid].position;
    },

    getSize: function (pid) {
        if (!this.innerHash[pid]) {
            return false;
        }
        return this.innerHash[pid].sizes;
    },

    getTabId: function (pid) {
        if (!this.innerHash[pid]) {
            return false;
        }
        return this.innerHash[pid].tabId;
    },

    setPosition: function (pid, position) {
        if (!this.innerHash[pid]) {
            return false;
        }

        this.innerHash[pid].position = position || {};
        return true;
    },

    setSize: function (pid, size) {
        if (!this.innerHash[pid]) {
            return false;
        }

        this.innerHash[pid].sizes = size || {};
        return true;
    },

    setAttState: function (pid, state) {
        if (!this.innerHash[pid]) {
            return false;
        }
        if (!this.innerHash[pid].att) {
            this.innerHash[pid].att = {};
        }
        this.innerHash[pid].att.state = state;
        return true;
    },

    remove: function (pid) {
        if (!this.innerHash[pid]) {
            return false;
        }
        var tid = this.innerHash[pid].tabId;
        var position = this.innerHash[pid].position;

        if (this.tabPointersHash[tid]) {
            this.tabPointersHash[tid][pid] = {};
        } else {
            console.error('popupManager:remove: tabPointersHash does not contain tabid', tid, ' pid: ', pid, ' innerHash:', this.innerHash[pid]);
        }

        this.innerHash[pid] = {};
        return position;
    },

    removeAllPopupsInTab: function (tid) {
        if (!this.tabPointersHash[tid]) {
            return false;
        }

        for (var pid in this.tabPointersHash[tid]) {
            if (pid && this.tabPointersHash[tid][pid]) {
                this.innerHash[pid] = {};
                this.tabPointersHash[tid][pid] = {};
            }
        }
        this.tabPointersHash[tid] = null;
        return true;
    },

    isExist: function (pid) {
        if (!this.innerHash[pid]) {
            return false;
        }
        return true;
    }
}


/**
* @fileOverview [Popups.back] <br/>
* FileName : popups.back.js <br/>
* FilePath : js/popups <br/>
* Date : 4/5/2011 1:44:13 PM <br/>
* Updated: 24/01/2012 By Michal. 
* Copyright: Realcommerce & Conduit.
* @author <strong> Yoav S </strong>
*/
try {
    (function () {
        /**
        @class Used to open popups, popup can serve dialogs and gadgets. 
        It’s shared because in IE gadgets should open from the backstage process 
        and dialogs from the front stage processes.
        */
        conduit.register('abstractionlayer.backstage.popup', new function () {
            //Alias
            var Repository = conduit.abstractionlayer.commons.repository;
            var Messages = conduit.abstractionlayer.commons.messages;
            var Guid = conduit.abstractionlayer.backstage.guid;
            var AppMethods = conduit.abstractionlayer.commons.appMethods;
            var Logging = conduit.abstractionlayer.commons.logging;
            var Consts = conduit.utils.consts;
            var arrPopupsOpenedAsWindow = [];
            var arrAppIdAndPopupIds = [];
            var callbackMap = { "onShow": [], "onClose": [], "onHide": [] };
            var arrIsResizerActive = [];
            var isBackStage = (document && (document.location.href.toUpperCase().indexOf("BACKSTAGE.HTML") > -1)) ? true : false;
            var keyName = 'gadgetsContextHash_';
            var extensionId = chrome.i18n.getMessage("@@extension_id");
            var functionSyncFinishedWithoutErrors = conduit.abstractionlayer.utils.errors.get(1);
            var arrCallbacksOnBeforeNavigateError = [];
            /***********************************************************PRIVATE***********************************************************/

            //NOTE: fire popups events to registered handlers
            var dispatchEventPopup = function (popupID, type, extraData) {
                if (popupID && type) {
                    var callbacks = callbackMap[type];
                    for (var cbId in callbacks) {
                        if (callbacks[cbId]) {
                            callbacks[cbId].call(null, popupID, extraData);
                        }
                    }
                    switch (type) {
                        case "onShow":
                            popupManager.setAttState(popupID, 'shown');
                            break;
                        case "onClose":
                            popupManager.setPosition(popupID, { 'top': -1, 'left': -1 });
                            break;
                        case "onHide":
                            popupManager.setAttState(popupID, 'hidden');
                            break;
                    }
                }
            };

            //NOTE: only tabId is mandatory
            var dispatchCloseOnExternal = function (tabId, idToKeepOpen) {
                var allPopupsInTabHash = popupManager.getAllPopupsInTab(tabId);
                for (var popupID in allPopupsInTabHash) {
                    if (popupID && idToKeepOpen != popupID) {
                        if (allPopupsInTabHash[popupID] && popupManager.isExist(popupID)) {
                            if (popupManager.getAtt(popupID) && popupManager.getAtt(popupID).hideOnExternalClick && popupManager.getAtt(popupID).isMenu && popupManager.getAtt(popupID).state == 'shown') {
                                hide(popupID, function () { });
                            }
                            else if (popupManager.getAtt(popupID) && popupManager.getAtt(popupID).closeOnExternal) {
                                close(popupID, function () { });
                            }
                        }
                    }
                }
            };

            var init = function () {
                if (!isBackStage) return;

                //init listeners
                Messages.onSysReq.addListener(extensionId, function (request, sender, sendResponse, viewId) {
                    if (request && request.method && request.popupID) {
                        if (!popupManager.isExist(request.popupID)) {
                            return;
                        }

                        var objParams = {
                            method: request.method,
                            popupID: request.popupID
                        };
                        sendRequestToContentScript(objParams, sendResponse);
                    }
                });

                Messages.onSysReq.addListener("popups.events", function (request, sender, sendResponse, viewId) {
                    if (!request) { sendResponse(); }

                    switch (request.type) {
                        case Consts.POPUPS.WINDOW_CLOSE_FROM_BS:
                            if (request.popupId) {
                                close(request.popupId, function () { });
                            }
                            break;
                        case Consts.POPUPS.SET_POPUP_POSITION:
                            popupManager.setPosition(request.data.popupID, { top: request.data.top, left: request.data.left });
                            break;
                        case Consts.POPUPS.SET_POPUP_SIZE:
                            popupManager.setSize(request.data.popupId, { width: request.data.width, height: request.data.height });
                            break;
                        case Consts.POPUPS.RESET:
                            //make sure that the popups are dead
                            //get tabId by viewId it from view id
                            Messages.sendSysReq("getTabIdViaViewId", "popups.back.js", { viewId: viewId }, function (tabId) {
                                var allPopupsInTab = popupManager.getAllPopupsInTab(tabId);
                                for (var popupId in allPopupsInTab) {
                                    if (popupId && popupManager.isExist(popupId)) {
                                        dispatchEventPopup(popupId, "onClose");
                                    }
                                }
                                popupManager.removeAllPopupsInTab(tabId);
                            });
                            break;
                        case Consts.POPUPS.CLOSE_ON_EXTERNAL:
                            var idToKeepOpen;
                            if (request.windowName) {
                                var popupIdFromWinName = request.windowName.replace(keyName, '').replace('___' + extensionId, '');
                                if (popupManager.isExist(popupIdFromWinName) && (popupManager.getAtt(popupIdFromWinName).hideOnExternalClick || popupManager.getAtt(popupIdFromWinName).closeOnExternal)) {
                                    idToKeepOpen = popupIdFromWinName;
                                }
                            }

                            idToKeepOpen = request.data && request.data.popupId || idToKeepOpen;
                            if ((request && request.tabId) || (sender && sender.tab && sender.tab.id)) {
                                dispatchCloseOnExternal(request.tabId ? request.tabId : sender.tab.id, idToKeepOpen);
                            }
                            else if (viewId) {
                                //take it from view id
                                Messages.sendSysReq("getTabIdViaViewId", "popups.back.js", { viewId: viewId }, function (response) {
                                    dispatchCloseOnExternal(response, idToKeepOpen);
                                });
                            }

                            if (sendResponse) {
                                sendResponse(true);
                            }
                            break;
                        case Consts.POPUPS.ON_CLOSE_EVENT:
                            for (var cbID in callbackMap.onClose) {
                                callbackMap.onClose[cbID].call(null, request.pId);
                            }
                            break;
                        case Consts.POPUPS.SET_POPUP_FOCUS:
                            if (request.popupId) {
                                setFocus(request.popupId, function () { });
                            }
                            break;
                        default: break;
                    }
                });

                Messages.onSysReq.addListener("notifyPopupBeforeNav", function (request, sender, sendResponse, viewId) {
                    if (!request || !request.url || !request.tabId) return;
                    var allPopupsInTab = popupManager.getAllPopupsInTab(request.tabId);
                    var pIdList = [];
                    for (var pid in allPopupsInTab) {
                        if (pid && allPopupsInTab[pid]) {
                            pIdList.push(pid);
                        }
                    }
                    sendRequestToContentScript({ method: 'getAllPopupsUrls', popupId: '-1', pIdList: pIdList }, function (popupsUrlHash) {
                        for (var pid in popupsUrlHash) {
                            if (popupsUrlHash[pid] == request.url) {
                                return arrCallbacksOnBeforeNavigateError(pid).callback(request.url);
                            }
                        }
                    }, { tabId: request.tabId });
                });

                //if a tab is closed while a popup is open - sent notification to listeners
                chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
                    if (tabId <= 0) return;

                    var popupsInTab = popupManager.getAllPopupsInTab(tabId);
                    for (var popupId in popupsInTab) {
                        if (popupId && popupsInTab[popupId]) {
                            dispatchEventPopup(popupId, "onClose");
                            dispatchEventPopup(popupId, "onHide");
                        }
                    }
                    popupManager.removeAllPopupsInTab(tabId);
                });
                var lastFocusWindow = null;
                chrome.windows.onFocusChanged.addListener(function (windowId) {
                    if (windowId == -1) return;
                    if (!lastFocusWindow) {
                        chrome.windows.getAll({ populate: true }, function (arrWindows) {
                            for (var w = 0; w < arrWindows.length; w++) {
                                if (arrWindows[w] && arrWindows[w].id && arrWindows[w].id != windowId) {
                                    for (var t = 0; t < arrWindows[w].tabs.length; t++) {
                                        dispatchCloseOnExternal(arrWindows[w].tabs[t].id);
                                    }
                                }
                            }
                            lastFocusWindow = windowId;
                        });
                    }
                    else {
                        var tempId = lastFocusWindow;
                        lastFocusWindow = windowId;
                        chrome.windows.get(tempId, { populate: true }, function (win) {
                            if (!win || !win.tabs) return;
                            for (var i = 0; i < win.tabs.length; i++) {
                                dispatchCloseOnExternal(win.tabs[i].id);
                            }
                        });
                    }
                });
            };

            var sendRequestToContentScript = function (objPopupData, callback, extraData) {
                var popupId = objPopupData.popupId || objPopupData.popupID;
                var tabId = popupManager.getTabId(popupId) || (extraData && extraData.tabId ? extraData.tabId : -1) || -1;
                objPopupData.msgExtraData = { tabId: tabId };

                var strData = JSON.stringify(objPopupData);
                Messages.sendSysReq('contentScript_events_Popup_replaceToViewId', 'abs.backstage.popup.js', strData, function (response, responseExtraData) {
                    var appResponse = response.appResult || {};
                    var dataResponse = response.dataResult || {};
                    var pmSuss = null;
                    switch (objPopupData.method) {
                        case 'openPopup':
                            if (appResponse && appResponse.status == 0) {
                                pmSuss = popupManager.set(appResponse.result, dataResponse.tabId, extraData.att, dataResponse.position, dataResponse.size);
                            }

                            if (strData && strData.indexOf('ftd') > 0) {
                                chrome.tabs.update(dataResponse.tabId, { active: true }, function () { });
                            }
                            break;
                        case 'closePopup':
                            if (appResponse && appResponse.status == 0) {
                                dispatchEventPopup(popupId, "onClose", { position: popupManager.getPosition(popupId) });
                                pmSuss = popupManager.remove(popupId);
                            }
                            break;
                        case 'changePositionPopup':
                            if (appResponse.description) {
                                pmSuss = popupManager.setPosition(appResponse.description.popupId, appResponse.description);
                            }
                            break;
                        case 'hidePopup':
                            if (appResponse && appResponse.status == 0) {
                                pmSuss = popupManager.setAttState(popupId, 'hidden');
                                dispatchEventPopup(popupId, "onHide");
                            }
                            break;
                        case 'showPopup':
                            if (appResponse && appResponse.status == 0) {
                                pmSuss = popupManager.setAttState(popupId, 'shown');
                                dispatchEventPopup(popupId, "onShow");
                            }
                            break;
                        //default case                                     
                        case 'getAllPopupsUrls':
                        case 'resizePopup':
                        case 'dragStop':
                        case 'dragStart':
                        case 'attach':
                        case 'detach':
                        case 'setFocus':
                        case 'navigate':
                        case 'resizeStart':
                        case 'resizeStop':
                            if (appResponse && appResponse.status == 0) {
                                pmSuss = true;
                            }
                            break;
                    }
                    if (!pmSuss) {
                        console.error('An error has accur in: ' + objPopupData.method, response, responseExtraData);
                    }

                    if (callback) {
                        callback(appResponse);
                    }
                });
            };

            var validations = function (arrErrorsToCheck, pid, cb, contentUrl, totalWidth, totalHeight, top, left) {
                for (var i = 0; i < arrErrorsToCheck.length; i++) {
                    switch (arrErrorsToCheck[i]) {
                        case 9000:
                            if (!pid) {
                                if (cb) {
                                    cb(conduit.abstractionlayer.utils.errors.get(9000));
                                }
                                return { succ: 1, ans: conduit.abstractionlayer.utils.errors.get(9000) };
                            }
                            break;
                        case 9001:
                            if (!cb) {
                                return { succ: 1, ans: conduit.abstractionlayer.utils.errors.get(9001) };
                            }
                            break;
                        case 2800:
                            if (!contentUrl || typeof (contentUrl) != 'string' || !conduit.abstractionlayer.utils.general.uri(contentUrl)) {
                                return { succ: 1, ans: conduit.abstractionlayer.utils.errors.get(2800) };
                            }
                            break;
                        case 2801:
                            if (!popupManager.isExist(pid)) {
                                if (cb) {
                                    cb(conduit.abstractionlayer.utils.errors.get(2801));
                                }
                                return { succ: 1, ans: conduit.abstractionlayer.utils.errors.get(2801) };
                            }
                            break;
                        case 2802:
                            //Invalid width - can be -1 - stays the same as it was
                            if (isNaN(totalWidth) || totalWidth < -1) {
                                return { succ: 1, ans: conduit.abstractionlayer.utils.errors.get(2802) };
                            }
                            break;
                        case 2803:
                            //Invalid height - can be -1 - stays the same as it was
                            if (isNaN(totalHeight) || totalHeight < -1) {
                                return { succ: 1, ans: conduit.abstractionlayer.utils.errors.get(2803) };
                            }
                            break;
                        case 2804:
                            //Invalid top
                            if (isNaN(top) || top < 0) {
                                return { succ: 1, ans: conduit.abstractionlayer.utils.errors.get(2804) };
                            }
                            break;
                        case 2805:
                            //Invalid left
                            if (isNaN(left) || left < 0) {
                                return { succ: 1, ans: conduit.abstractionlayer.utils.errors.get(2805) };
                            }
                            break;
                    }
                }
                return { succ: 0 };
            }

            var createobjParams = function (method, popupID) {
                return { method: method, popupID: popupID };
            };
            /***********************************************************END PRIVATE***********************************************************/


            /***********************************************************PUBLIC***********************************************************/

            var open = function (top, left, totalWidth, totalHeight, contentUrl, frameObject, isModal, closeOnExternalClick, hideOnExternalClick, isWebApp, extraDataObject, callback) {
                /*dont test a @left because, will fix him latter to default 0 value*/
                var validObj = validations([9001, 2800, 2802, 2803, 2804], null, callback, contentUrl, totalWidth, totalHeight, top, left);
                if (validObj.succ != 0) return validObj.ans;

                /* fix left position */
                left = Math.max(left || 0, 0);

                if (!isWebApp) {
                    //should be change totalWidth, totalHeight according to chrome window hieht and width
                    chrome.windows.create({ url: url, left: left, top: top, width: totalWidth, height: totalHeight, type: "popup" }, function (result) {
                        var tmpPopupId = result && result.id ? result.id : null;
                        if (tmpPopupId) {
                            arrPopupsOpenedAsWindow[tmpPopupId] = true;
                        }
                        callback({ result: tmpPopupId, status: 0, description: "" });
                    });
                    return;
                }

                if (left + totalWidth > screen.availWidth) {
                    var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
                    var cStyle = document.body.currentStyle || window.getComputedStyle(document.body, "");
                    hasVScroll = cStyle.overflow == "visible" || cStyle.overflowY == "visible" || (hasVScroll && cStyle.overflow == "auto") || (hasVScroll && cStyle.overflowY == "auto");
                    //resetting left
                    left = screen.availWidth - totalWidth - (hasVScroll ? 16 : 0) > 0 ? screen.availWidth - totalWidth - (hasVScroll ? 16 : 0) : 0;
                }
                if (top + totalHeight > screen.availHeight) {
                    //resetting top
                    top = screen.availHeight - totalHeight > 0 ? screen.availHeight - totalHeight : 0;
                }
                contentUrl = conduit.abstractionlayer.utils.general.addHTTPToUrl(contentUrl);

                //Here we also generate an ID for the iframe.
                var objPopupData = {
                    popupId: Guid.generate().result,
                    method: Consts.POPUPS.OPEN,
                    url: contentUrl,
                    top: top,
                    left: left,
                    width: totalWidth,
                    height: totalHeight,
                    frameObject: frameObject,
                    isModal: isModal || false,
                    closeOnExternalClick: closeOnExternalClick || false,
                    hideOnExternalClick: hideOnExternalClick || false,
                    isWebApp: isWebApp || true,
                    extraDataObject: extraDataObject
                };
                objPopupData.ctid = conduit.abstractionlayer.commons.context.getCTID().result;
                //wraps all the data inorder to send it as msg to CS and handle the cb from it
                var addTabIdToMsg = function (tid) {
                    var contextData = null;
                    try {
                        contextData = extraDataObject && extraDataObject.contextData ? JSON.parse(extraDataObject.contextData) : {};
                    } catch (e) {
                        contextData = {};
                    }

                    //data to PM
                    var popupsAtts = {
                        closeOnExternal: closeOnExternalClick || false,
                        hideOnExternalClick: hideOnExternalClick || false,
                        isMenu: objPopupData && objPopupData.extraDataObject && objPopupData.extraDataObject.isMenu || false,
                        state: 'shown',
                        appId: contextData && contextData.appId ? contextData.appId : ''
                    };

                    //set popup context
                    if (extraDataObject && extraDataObject.contextData) {
                        AppMethods.setContext(objPopupData.popupId, extraDataObject.contextData);
                    }

                    sendRequestToContentScript(objPopupData, callback, { att: popupsAtts, tabId: tid });
                };


                //support gadget context 
                if (extraDataObject && extraDataObject.tabId) {
                    addTabIdToMsg(extraDataObject.tabId);
                }
                else {
                    conduit.abstractionlayer.backstage.tabs.getCurrentLegal(function (tab) {
                        addTabIdToMsg(tab.id);
                    });
                }

                return functionSyncFinishedWithoutErrors;
            };

            var close = function (popupID, callback) {
                /// Parameters Validation
                if (window && arrPopupsOpenedAsWindow && arrPopupsOpenedAsWindow[popupID]) {
                    return chrome.windows.remove(popupID, callback);
                }
                var validObj = validations([9000, 9001, 2801], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                sendRequestToContentScript(createobjParams('closePopup', popupID), callback);
                return functionSyncFinishedWithoutErrors;
            };

            var resize = function (popupID, width, height, callback) {
                //console.log('RESIZE');
                var validObj = validations([9000, 9001, 2801, 2802, 2803], popupID, callback, null, width, height);
                if (validObj.succ != 0) return validObj.ans;

                var objParams = createobjParams('resizePopup', popupID);

                if (width != Consts.POPUPS.VALUE_UNCHANGED) {
                    objParams.width = width;
                }

                if (height != Consts.POPUPS.VALUE_UNCHANGED) {
                    objParams.height = height;
                }
                sendRequestToContentScript(objParams, callback);
                return functionSyncFinishedWithoutErrors;
            };

            var changePosition = function (popupID, top, left, callback) {
                //console.log('CHANGE POSITION');
                var validObj = validations([9000, 9001, 2801, 2804, 2805], popupID, callback, null, null, null, top, left);
                if (validObj.succ != 0) return validObj.ans;

                var objParams = {
                    method: 'changePositionPopup',
                    popupID: popupID,
                    top: top,
                    left: left
                };
                sendRequestToContentScript(objParams, callback);
                return functionSyncFinishedWithoutErrors;
            };

            var hide = function (popupID, callback) {
                //console.log('HIDE');
                var validObj = validations([9000, 9001, 2801], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                sendRequestToContentScript(createobjParams('hidePopup', popupID), callback);
                return functionSyncFinishedWithoutErrors;
            };

            var show = function (popupID, newContext, callback) {
                //console.log('SHOW');
                var validObj = validations([9000, 9001, 2801], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                var objParams = createobjParams('showPopup', popupID);
                if (newContext) {
                    AppMethods.setContext(popupID, newContext);
                    objParams.newContext = newContext;
                }
                sendRequestToContentScript(objParams, callback);
                return functionSyncFinishedWithoutErrors;
            };

            var addCloseCallbackFunc = function (callback) {
                callbackMap.onClose.push(callback);
            };

            var onHidePopupAddListener = function (callback) {
                callbackMap.onHide.push(callback);
            };

            var onPopupShownAddListener = function (callback) {
                callbackMap.onShow.push(callback);
            };

            var onBeforeNavigateListener = function (popupID, callback) {
                var validObj = validations([9000, 9001], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                arrCallbacksOnBeforeNavigateError[popupID] = {};
                arrCallbacksOnBeforeNavigateError[popupID].callback = callback;
                return functionSyncFinishedWithoutErrors;
            };

            var dragStop = function (popupID, callback) {
                var validObj = validations([9000, 9001, 2801], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                sendRequestToContentScript(createobjParams('dragStop', popupID), callback);
                return functionSyncFinishedWithoutErrors;
            };

            var dragStart = function (popupID, callback) {
                var validObj = validations([9000, 9001, 2801], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                sendRequestToContentScript(createobjParams('dragStart', popupID), callback);
                return functionSyncFinishedWithoutErrors;
            };

            var attach = function (popupID, callback) {
                var validObj = validations([9000, 9001, 2801], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                sendRequestToContentScript(createobjParams('attach', popupID), callback);
                return functionSyncFinishedWithoutErrors;
            };

            var detach = function (popupID, callback) {
                var validObj = validations([9000, 9001, 2801], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                sendRequestToContentScript(createobjParams('detach', popupID), callback);
                return functionSyncFinishedWithoutErrors;
            };

            var setFocus = function (popupID, callback) {
                var validObj = validations([9000, 9001, 2801], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                sendRequestToContentScript(createobjParams('setFocus', popupID), callback);
                return functionSyncFinishedWithoutErrors;
            };

            var navigate = function (popupID, top, left, totalWidth, totalHeight, contentUrl, frameObject, callback) {
                //console.log('NAVIGATE');
                var validObj = validations([9000, 9001, 2800, 2801, 2802, 2803, 2804, 2805], popupID, callback, contentUrl, totalWidth, totalHeight, top, left);
                if (validObj.succ != 0) return validObj.ans;


                if (left + totalWidth > screen.availWidth) {
                    var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
                    var cStyle = document.body.currentStyle || window.getComputedStyle(document.body, "");
                    hasVScroll = cStyle.overflow == "visible" || cStyle.overflowY == "visible" || (hasVScroll && cStyle.overflow == "auto") || (hasVScroll && cStyle.overflowY == "auto");
                    //resetting left
                    left = screen.availWidth - totalWidth - (hasVScroll ? 16 : 0) > 0 ? screen.availWidth - totalWidth - (hasVScroll ? 16 : 0) : 0;
                }
                if (top + totalHeight > screen.availHeight) {
                    //resetting top
                    top = screen.availHeight - totalHeight > 0 ? screen.availHeight - totalHeight : 0;
                }

                contentUrl = conduit.abstractionlayer.utils.general.addHTTPToUrl(contentUrl);

                var objPopupData = {
                    method: 'navigate',
                    popupID: popupID,
                    url: contentUrl,
                    top: top,
                    left: left,
                    width: totalWidth,
                    height: totalHeight,
                    frameObject: frameObject || false
                };

                sendRequestToContentScript(objPopupData, callback);
                return functionSyncFinishedWithoutErrors;
            };

            var getPopupPosition = function (popupID) {
                var validObj = validations([9000, 2801], popupID);
                if (validObj.succ != 0) return validObj.ans;
                return { result: popupManager.getPosition(popupID), status: 0, description: "" };
            };

            var resizeStart = function (popupID, callback) {
                var validObj = validations([9000, 9001, 2801], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                arrIsResizerActive[popupID] = true;
                sendRequestToContentScript(createobjParams('resizeStart', popupID), callback);
                return functionSyncFinishedWithoutErrors;
            };

            var resizeStop = function (popupID, callback) {
                var validObj = validations([9000, 9001, 2801], popupID, callback);
                if (validObj.succ != 0) return validObj.ans;

                arrIsResizerActive[popupID] = false;
                sendRequestToContentScript(createobjParams('resizeStop', popupID), callback);
                return functionSyncFinishedWithoutErrors;
            };

            var getSize = function (popupID) {
                var validObj = validations([9000, 2801], popupID);
                if (validObj.succ != 0) return validObj.ans;
                return { result: popupManager.getSize(popupID), status: 0, description: '' };
            };
            /***********************************************************END PUBLIC***********************************************************/

            init();
            /* PUBLIC INTERFACE */
            return {
                open: open,
                close: close,
                resize: resize,
                changePosition: changePosition,
                hide: hide,
                show: show,
                addCloseCallbackFunc: {
                    addListener: addCloseCallbackFunc
                },
                onHidePopup: {
                    addListener: onHidePopupAddListener
                },
                onPopupShown: {
                    addListener: onPopupShownAddListener
                },
                onBeforeNavigate: {
                    addListener: onBeforeNavigateListener
                },
                dragStop: dragStop,
                dragStart: dragStart,
                attach: attach,
                detach: detach,
                setFocus: setFocus,
                navigate: navigate,
                getPosition: getPopupPosition,
                resizeStart: resizeStart,
                resizeStop: resizeStop,
                getSize: getSize
            };
        });

    })();
} catch (e) {console.error(e);}
/**
* @fileOverview encryption and decryption of the code in several ways.
* FileName :  encryption.back
* FilePath : ../src/main/js/encryption/encryption.back.js
* Date for all review and checks : 23/6/2011 16:00:00 PM 
* Copyright: Realcommerce & Conduit.
* @author michal naor
*/

conduit.register("abstractionlayer.backstage.encryption", new function () {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var hexStr = "0123456789ABCDEF";
    var Errors = conduit.abstractionlayer.utils.errors;

    /************** PRIVATE FUNCTIONS **********************/
    /*
    @function: encodeHex
    @description: encode input string to hexdecimal(16) string
    @param: (string) input - the input string
    */
    var encodeHex = function (input) {
        var output = "";
        var chr1 = "";
        var enc1, enc2 = "";
        var index = 0;
        do {
            chr1 = input.charCodeAt(index++);
            enc1 = chr1 >> 4;
            enc2 = chr1 & 15;

            output = output + hexStr.charAt(enc1) + hexStr.charAt(enc2);
        } while (index < input.length);

        return output;
    };

    /*
    @function: decodeHex
    @description: decode hexdecimal string back to the original string
    @param: (string) input - the input string
    */
    var decodeHex = function (input) {
        var output = "";
        var chr1, chr2 = "";
        var enc1 = "";
        var index = 0;

        // remove all characters that are not A-F, a-F, or 0-9

        input = input.replace(/[^A-Fa-f0-9]/g, "");
        input = input.toUpperCase();

        do {
            chr1 = hexStr.indexOf(input.charAt(index++));
            chr2 = hexStr.indexOf(input.charAt(index++));

            enc1 = chr2 | (chr1 << 4);
            output = output + String.fromCharCode(enc1);
        } while (index < input.length);

        return output;
    };

    /*
    @function: encode64
    @description: encode string to base64
    @param: (string) input - the input string
    */
    var encode64 = function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var index = 0;

        do {
            chr1 = input.charCodeAt(index++);
            chr2 = input.charCodeAt(index++);
            chr3 = input.charCodeAt(index++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            }
            else {
                if (isNaN(chr3)) {
                    enc4 = 64;
                }
            }

            output = output +
            keyStr.charAt(enc1) +
            keyStr.charAt(enc2) +
            keyStr.charAt(enc3) +
            keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        } while (index < input.length);

        return output;
    };

    /*
    @function: decode64
    @description: decode string from base64
    @param: (string) input - the input string
    */
    var decode64 = function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var index = 0;
        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        do {
            enc1 = keyStr.indexOf(input.charAt(index++));
            enc2 = keyStr.indexOf(input.charAt(index++));
            enc3 = keyStr.indexOf(input.charAt(index++));
            enc4 = keyStr.indexOf(input.charAt(index++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        } while (index < input.length);

        return output;
    };

    /*
    @function: encodeUTF8
    @description: convert string to UTF-8 encoding
    @param: (string) input - the input string
    */
    var encodeUTF8 = function (string) {
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

    /*
    @function: decodeUTF8
    @description: decode string from UTF-8
    @param: (string) input - the input string
    */
    var decodeUTF8 = function (utftext) {
        var string = "";
        var index = 0;
        var c = 0;
        var c1 = 0;
        var c2 = 0;

        while (index < utftext.length) {
            c = utftext.charCodeAt(index);

            if (c < 128) {
                string += String.fromCharCode(c);
                index++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(index + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                index += 2;
            }
            else {
                c2 = utftext.charCodeAt(index + 1);
                c3 = utftext.charCodeAt(index + 2);

                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                index += 3;
            }
        }

        return string;
    };

    /*
    @function for the md5 algoritim 
    */
    var MD5 = function (string) {
        function RotateLeft(lValue, iShiftBits) {
            return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
        }

        function AddUnsigned(lX, lY) {
            var lX4, lY4, lX8, lY8, lResult;
            lX8 = (lX & 0x80000000);
            lY8 = (lY & 0x80000000);
            lX4 = (lX & 0x40000000);
            lY4 = (lY & 0x40000000);
            lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
            if (lX4 & lY4) {
                return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
            }
            if (lX4 | lY4) {
                if (lResult & 0x40000000) {
                    return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                } else {
                    return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                }
            } else {
                return (lResult ^ lX8 ^ lY8);
            }
        }

        function F(x, y, z) { return (x & y) | ((~x) & z); }
        function G(x, y, z) { return (x & z) | (y & (~z)); }
        function H(x, y, z) { return (x ^ y ^ z); }
        function I(x, y, z) { return (y ^ (x | (~z))); }

        function FF(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }

        function GG(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }

        function HH(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }

        function II(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }

        function ConvertToWordArray(string) {
            var lWordCount;
            var lMessageLength = string.length;
            var lNumberOfWords_temp1 = lMessageLength + 8;
            var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
            var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
            var lWordArray = Array(lNumberOfWords - 1);
            var lBytePosition = 0;
            var lByteCount = 0;
            while (lByteCount < lMessageLength) {
                lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                lBytePosition = (lByteCount % 4) * 8;
                lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
                lByteCount++;
            }
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
            lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
            lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
            return lWordArray;
        }

        function WordToHex(lValue) {
            var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
            for (lCount = 0; lCount <= 3; lCount++) {
                lByte = (lValue >>> (lCount * 8)) & 255;
                WordToHexValue_temp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
            }
            return WordToHexValue;
        }

        function Utf8Encode(string) {
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
        }

        var x = Array();
        var k, AA, BB, CC, DD, a, b, c, d;
        var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
        var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
        var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
        var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

        string = Utf8Encode(string);

        x = ConvertToWordArray(string);

        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

        for (k = 0; k < x.length; k += 16) {
            AA = a; BB = b; CC = c; DD = d;
            a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
            d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
            c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
            b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
            a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
            d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
            c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
            b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
            a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
            d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
            c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
            b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
            a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
            d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
            c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
            b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
            a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
            d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
            c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
            b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
            a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
            d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
            c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
            b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
            a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
            d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
            c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
            b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
            a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
            d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
            c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
            b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
            a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
            d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
            c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
            b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
            a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
            d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
            c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
            b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
            a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
            d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
            c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
            b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
            a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
            d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
            c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
            b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
            a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
            d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
            c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
            b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
            a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
            d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
            c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
            b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
            a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
            d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
            c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
            b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
            a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
            d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
            c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
            b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
            a = AddUnsigned(a, AA);
            b = AddUnsigned(b, BB);
            c = AddUnsigned(c, CC);
            d = AddUnsigned(d, DD);
        }

        var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);

        return temp.toLowerCase();
    };

    /************** PUBLIC FUNCTIONS **********************/
    /**
    @function: encryptBASE64
    @description:Encrypts the Data to 64 base.
    @param: (string) input - the input string to encrypt
    @ Returned JSON object:
    @ on success : { result: "ENCRYPEDDATA", status: 0, description: ""}
    @ on error : { result: "", status: XXXX, description: "Error Description"}  
    */
    var encryptBASE64 = function (input) {
        if (!input) {
            return Errors.get(9000);
        }
        else {
            try {
                var result = encode64(input);
                return { result: result, status: 0, description: '' };
            }
            catch (Error) {
                return Errors.get(9000);
            }
        }
    };

    /**
    @function: decryptBASE64
    @description:Decrypt the Data from 64 base
    @param: (string) input - the input string to dencrypt
    @Returned JSON object:
    @on success : { result: "DATA", status: 0, description: ""}
    @on error : { result: "", status: XXXX, description: "Error Description"}
    */
    var decryptBASE64 = function (input) {
        if (!input) {
            return Errors.get(9000);
        }
        else {
            try {
                var result = decode64(input);
                return { result: result, status: 0, description: '' };
            }
            catch (Error) {
                return Errors.get(9000);
            }
        }
    };

    /**
    @function: hashMD5
    @description:Returns a unique integer code for a given string using MD5 hashing.
    @param: (string) input - the input string to hash
    @Returned JSON object:
    @on success : { result: 123123123213, status: 0, description: ""}
    @on error : { result: "", status: XXXX, description: "Error Description"}
    */
    var hashMD5 = function (input) {
        if (!input) {
            return Errors.get(9000);
        }
        else {
            try {
                var result = MD5(input);
                return { result: result, status: 0, description: '' };
            }
            catch (Error) {
                return Errors.get(9000);
            }
        }
    };


    var utf8Decode = function (str_data) {
        // http://kevin.vanzonneveld.net
        // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // +      input by: Aman Gupta
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Norman "zEh" Fuchs
        // +   bugfixed by: hitwork
        // +   bugfixed by: Onno Marsman
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // *     example 1: utf8_decode('Kevin van Zonneveld');
        // *     returns 1: 'Kevin van Zonneveld'
        var tmp_arr = [],
        i = 0,
        ac = 0,
        c1 = 0,
        c2 = 0,
        c3 = 0;

        str_data += '';

        while (i < str_data.length) {
            c1 = str_data.charCodeAt(i);
            if (c1 < 128) {
                tmp_arr[ac++] = String.fromCharCode(c1);
                i++;
            } else if (c1 > 191 && c1 < 224) {
                c2 = str_data.charCodeAt(i + 1);
                tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = str_data.charCodeAt(i + 1);
                c3 = str_data.charCodeAt(i + 2);
                tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }

        return tmp_arr.join('');
    };

    var utf8Encode = function (data) {
        // http://kevin.vanzonneveld.net
        // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: sowberry
        // +    tweaked by: Jack
        // +   bugfixed by: Onno Marsman
        // +   improved by: Yves Sucaet
        // +   bugfixed by: Onno Marsman
        // +   bugfixed by: Ulrich
        // +   bugfixed by: Rafal Kukawski
        // *     example 1: utf8_encode('Kevin van Zonneveld');
        // *     returns 1: 'Kevin van Zonneveld'

        if (data === null || typeof data === "undefined") {
            return "";
        }

        var string = (data + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        var utftext = "",
        start, end, stringl = 0;

        start = end = 0;
        stringl = string.length;
        for (var n = 0; n < stringl; n++) {
            var c1 = string.charCodeAt(n);
            var enc = null;

            if (c1 < 128) {
                end++;
            } else if (c1 > 127 && c1 < 2048) {
                enc = String.fromCharCode((c1 >> 6) | 192) + String.fromCharCode((c1 & 63) | 128);
            } else {
                enc = String.fromCharCode((c1 >> 12) | 224) + String.fromCharCode(((c1 >> 6) & 63) | 128) + String.fromCharCode((c1 & 63) | 128);
            }
            if (enc !== null) {
                if (end > start) {
                    utftext += string.slice(start, end);
                }
                utftext += enc;
                start = end = n + 1;
            }
        }

        if (end > start) {
            utftext += string.slice(start, stringl);
        }

        return utftext;
    };

    /**
    * checking if charset is valid.
    * @param {string} charset - for example : windows-1255.
    * @return {boolean} return true on valid charset.
    */

    var validateCarset = function (charset) {
        charset = charset.toLowerCase();
        switch (charset) {
            case "iso 8859-1": //western europe
            case "iso 8859-2": //western and central europe
            case "iso 8859-3": //western europe and south european (turkish, maltese plus esperanto)
            case "iso 8859-4": //western europe and baltic countries (lithuania, estonia, latvia and lapp)
            case "iso 8859-5": //cyrillic alphabet
            case "iso 8859-6": //arabic
            case "iso 8859-7": //greek
            case "iso 8859-8": //hebrew
            case "iso 8859-9": //western europe with amended turkish character set
            case "iso 8859-10": //western europe with rationalised character set for nordic languages, including complete icelandic set
            case "iso 8859-11": //thai
            case "iso 8859-13": //baltic languages plus polish
            case "iso 8859-14": //celtic languages (irish gaelic, scottish, welsh)
            case "iso 8859-15": //added the euro sign and other rationalisations to iso 8859-1
            case "iso 8859-16": //central, eastern and southern european languages
            case "windows-1250": //for central european languages that use latin script
            case "windows-1251": //for cyrillic alphabets
            case "windows-1252": //for western languages
            case "windows-1253": //for greek
            case "windows-1254": //for turkish
            case "windows-1255": //for hebrew
            case "windows-1256": //for arabic
            case "windows-1257": //for baltic languages
            case "windows-1258": //for vietnamese
            case "mac os roman":
            case "koi8-r":
            case "koi8-u":
            case "koi7":
            case "mik":
            case "iscii":
            case "tscii":
            case "viscii":
            case "jis x 0208": //is a widely deployed standard for japanese character encoding that has several encoding forms.
            case "shift jis": //(microsoft code page 932 is a dialect of shift_jis)
            case "euc-jp":
            case "iso-2022-jp":
            case "jis x 0213": //is an extended version of jis x 0208.
            case "shift_jis-2004":
            case "euc-jis-2004":
            case "iso-2022-jp-2004":
            case "guobiao":
            case "gb 2312":
            case "gbk": //(microsoft code page 936)
            case "gb 18030":
            case "big5": //(a more famous variant is microsoft code page 950)
            case "hkscs":
            case "ks x 1001": //is a korean double-byte character encoding standard
            case "euc-kr":
            case "iso-2022-kr":
            case "ansel":
            case "iso/iec 6937":
            case "utf-8":
                return true;
            default:
                return false;
        }
    };

    var toUnicode = function (theString) {
        var unicodeString = '';
        for (var i = 0; i < theString.length; i++) {
            var theUnicode = theString.charCodeAt(i).toString().toUpperCase();
            while (theUnicode.length < 4) {
                theUnicode = '0' + theUnicode;
            }
            theUnicode = '\\u' + theUnicode;
            unicodeString += theUnicode;
        }
        return unicodeString;
    };

    var quoted_printable_decode = function (str) {
        // Convert a quoted-printable string to an 8 bit string
        // Removes softline breaks
        var RFC2045Decode1 = /\=\r\n/gm,        // Decodes all equal signs followed by two hex digits
        RFC2045Decode2IN = /\=([0-9A-F]{2})/gim,
        // the RFC states against decoding lower case encodings, but following apparent PHP behavior
        // RFC2045Decode2IN = /=([0-9A-F]{2})/gm,
        RFC2045Decode2OUT = function (sMatch, sHex) {
            //console.log(RFC2045Decode2OUT);
            return String.fromCharCode(parseInt(sHex, 16));
        };
        return str.replace(RFC2045Decode1, '').replace(RFC2045Decode2IN, RFC2045Decode2OUT);
    };


    /**
    * Decodes text according to a given charset
    * @param {string} data - data to decode.
    * @param {string} type - Q/B inputs Q= Quoted-Printable ,B = Base64.
    * @param {string} Charset - for example : windows-1255.
    * @return {object} result.
    */
    var decodeCharset = function (data, charset, cb) {
        var obj = {};
        try {
            if (!data || !charset) {
                cb(Errors.get(9000));
            }

            var host = conduit.abstractionlayer.backstage.nmWrapper;

            var command = { 'namespace': 'Encryption', 'funcName': 'decodeCharset', 'parameters': [charset, data] };
            host.sendMessage(command, function (data) {
                if (data && !data.status) {
                    cb(data.result);
                    return;
                }
                return cb('');

            });
        } catch (generalException2) {
            // console.error("Decode: General Exception: " + generalException2 + " " + (generalException2.stack ? generalException2.stack.toString() : "") + document.location);
        }
    };




    return {
        encrypt: encryptBASE64,
        decrypt: decryptBASE64,
        hash: hashMD5,
        decodeCharset: decodeCharset
    };
});

///**
//* @fileOverview this class handelling the issues of: Cookies, Cache, History
//* FileName :  browser_data.back
//* FilePath : ../src/main/js/browser_data/browser_data.back.js
//* Date : 28/6/2011 11:00:00 PM 
//* Copyright: Realcommerce & Conduit.
//* @author michal naor
//*/

conduit.register('abstractionlayer.backstage.browserData', new function () {
    var Errors = conduit.abstractionlayer.utils.errors;
    var CONDUIT = conduit;

    /************** PRAVITE FUNCTIONS **********************/
    /**
    @description checks if the given domain is valid
    @function isValidDomainUrl - sync
    @property {String} domain - the name of the domain
    */
    var isValidDomainUrl = function (domain) {
        var validDomain = domain.toLowerCase();
        if (validDomain.indexOf("https://") != -1) {
            validDomain = validDomain.substr(8);
        }
        else if (validDomain.indexOf("http://") != -1) {
            validDomain = validDomain.substr(7);
        }

        // length most be >=4
        if (validDomain.length <= 3) {
            return { isValid: false, domain: validDomain };
        }
        // lat least 2 dots
        var counter = 0;
        for (var i = 0; i < domain.length; i++) {
            if (domain.charAt(i) == ".") {
                counter++;
            }
        }
        if (counter <= 1) {
            return { isValid: false, domain: validDomain };
        }
        return { isValid: true, domain: validDomain };
    };

    /**
    @description gets the url out of the cookie
    @function getUrlFromCookie - sync
    @property {String} cookie 
    */
    var getUrlFromCookie = function (cookie) {
        if (!cookie) {
            return "";
        }

        var prefix = cookie.secure ? "https://" : "http://";
        if (cookie.domain.charAt(0) == ".") {
            prefix += "www";
        }

        return prefix + cookie.domain;
    };

    /**
    @description sets the url out of the domain + secure
    @function setCookieUrl - sync
    @property {String} domain - the domain the cookie will be in  
    @property {String} secure - optional
    */
    var setCookieUrl = function (domain, secure) {
        var prefix = secure ? "https://" : "http://";
        domain = domain.toLowerCase();
        if (domain.indexOf("https://") != -1 || domain.indexOf("http://") != -1) {
            prefix = "";
        }
        if (domain.charAt(0) == "." && domain.indexOf("www") != -1) {
            prefix += "www";
        }
        return prefix + domain;
    };

    /**
    @description called by deleteCookies and deletes each cookie
    @function onReadingAllCookies 
    @property {Array} arrCookies - array of chrome cookies
    */
    var onReadingAllCookies = function (arrCookies) {
        if (!arrCookies) {
            return;
        }

        for (var cookieCounter = 0; cookieCounter < arrCookies.length; cookieCounter++) {
            try {
                var cookieIdentify = {};
                cookieIdentify.url = getUrlFromCookie(arrCookies[cookieCounter]);
                cookieIdentify.name = arrCookies[cookieCounter].name;
                chrome.cookies.remove(cookieIdentify, function (removedCookieDetails) {
                    console.error(removedCookieDetails);
                    if (!removedCookieDetails) {
                        console.error('delete all cookies, wasnt able to remove the cookie: ' + JSON.stringify(removedCookieDetails) + '\nError: ' + chrome.extension.lastError);
                    }
                    else {
                        console.error('Success in deleting cookie: ' + JSON.stringify(removedCookieDetails));
                        console.error('Error: ' + chrome.extension.lastError);
                    }
                }); //a-sync - dont do anything in callback
            }
            catch (e) { }
        }
    };



    /************** PUBLIC FUNCTIONS **********************/
    /**
    @description Clears the browser history
    @function clearHistory - sync
    */
    var clearHistory = function () {
        chrome.history.deleteAll(function () { });
        return Errors.get(1);
    };

    /**
    @description Deletes all the browser cookies
    @function deleteCookies
    */
    var deleteCookies = function () {
        chrome.cookies.getAll({}, onReadingAllCookies);
        return Errors.get(1);
    };

    /**
    @description Deletes one cookie
    @function deleteCookies
    */
    var deleteCookie = function (cookieName, domain, callback) {
        if (!cookieName || !domain) {
            callback(Errors.get(9000));
        }
        else {
            var urlObj = isValidDomainUrl(domain);
            if (!urlObj.isValid) {
                callback(Errors.get(4202));
            }

            try {
                var cookieIdentify = {};
                cookieIdentify.url = setCookieUrl(domain, null);
                cookieIdentify.name = cookieName;
                readCookies(cookieName, domain, function (result) {
                    if (!(result.status == 0 && result.result != false)) {
                        callback(Errors.get(4200));
                        return;
                    }

                    chrome.cookies.remove(cookieIdentify, function (removedCookieDetails) {
                        callback(Errors.get(1));
                    });
                }); //a-sync - dont do anything in callback
            } catch (e) {
                callback({ result: '', status: 9999, description: 'error in deleting cookie: ' + e });
            }
        }
    };

    /**
    @description Reads a cookie - creates at each call an instant - inorder to be able to call the callback
    @function readCookies
    @property {String} cookieName - the name of the cookie we want to read
    @property {String} domain - the domain the cookie is writen in
    */
    var readCookies = function (cookieName, domain, callback) {
        if (typeof callback !== 'function') {
            callback = function () { };
            console.log("ReadCookies for cookie - ", cookieName, " was not sent with a callback - Chrome cookies are asynchronous!");
        }

        if (!cookieName || !domain) {
            callback(Errors.get(9000));
            return (Errors.get(9000));
        }
        else {
            var urlObj = isValidDomainUrl(domain)
            if (!urlObj.isValid) {
                callback(Errors.get(4202));
                return (Errors.get(4202));
            }
            else {
                try {
                    if (!callback) { return; }

                    var cookieIdentify = {};
                    cookieIdentify.url = setCookieUrl(urlObj.domain, null);
                    cookieIdentify.name = cookieName;

                    chrome.cookies.get(cookieIdentify, function (cookie) {
                        if (!cookie) {
                            callback(Errors.get(0));
                            return (Errors.get(0));
                        }
                        else {
                            callback({ result: cookie.value, status: 0, description: '' });
                            return ({ result: cookie.value, status: 0, description: '' });
                        }
                    });
                }
                catch (e) {
                    callback(Errors.get(0));
                }
            }
        }

        return (Errors.get(0));
    };

    /**
    @description write a cookie with the following data: cookieName, expires, cookieData in the domain that is given- creates at each call an instant - inorder to be able to call the callback
    @function writeCookie
    @property {String} cookieName - the name of the cookie we want to set
    @property {String} domain - the domain the cookie is writen in
    @property {Int32} Expires - Hours to expires (defaults to 72hrs) - optional
    @property {String} cookieData - the cookie data- optional
    */
    var writeCookie = function (cookieName, domain, expires, cookieData, callback) {
        if (!cookieName || !domain) {
            callback(Errors.get(9000));
        }
        else {
            var urlObj = isValidDomainUrl(domain);
            if (!urlObj.isValid) {
                callback(Errors.get(4202));
            }
            else {
                try {
                    var cookieIdentify = {};
                    cookieIdentify.url = setCookieUrl(domain, null);
                    cookieIdentify.name = cookieName;
                    cookieIdentify.value = cookieData;
                    cookieIdentify.domain = urlObj.domain;
                    if (expires) {
                        if (isNaN(expires) === false) {
                            expires = expires * 3600000;
                        }
                    }
                    var myCookieDate = new Date().valueOf();
                    cookieIdentify.expirationDate = expires ? (Math.ceil((new Date().getTime() + expires) * 0.001)) : (Math.ceil((new Date().getTime() + 259200000) * 0.001)); // 72 hours = mil secs, 1000*60*60*72
                    chrome.cookies.set(cookieIdentify, function (cookie) {
                        if (!callback) {
                            return;
                        }
                        if (!cookie) {
                            callback(Errors.get(0));
                        }
                        else {
                            callback(Errors.get(1));
                        }
                    });
                }
                catch (e) {
                    if (!callback) { return; }
                    callback(Errors.get(0));
                }
            }
        }
    };

    var clearCache = function () {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    /* PUBLIC INTERFACE */
    return {
        clearHistory: clearHistory,
        deleteCookies: deleteCookies,
        readCookies: readCookies,
        writeCookie: writeCookie,
        deleteCookie: deleteCookie,
        clearCache: clearCache
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
* @fileOverview this class allow commpresion on files/dirs.
* FileName :  compression.back
* FilePath : src/main/js/compression/compression.back.js
* Date :  11/09/11
* Copyright: Conduit.
* @author michal
*/

try {

    conduit.register("abstractionlayer.backstage.compression", (new function () {
        var Errors = conduit.abstractionlayer.utils.errors;


        var environment = conduit.abstractionlayer.commons.environment;



        var extract = function (fullPath, compressedFile, destPath, overwrite, callback) {
            return conduit.abstractionlayer.commons.generic.unsupportedFunction();
        };

        return {
            extract: extract
        };
    }));
} 
catch (e) {
    console.error('Exception in abstractionlayer.backstage.compression', e.stack ? e.stack.toString() : e.toString());
}

/**
* @fileOverview this function handles system request <br/>
* FileName : backstage.system.js <br/>
* FilePath : AbstractionLayer/src/main/js/system/system.back.js <br/>
* Date : 18.01.2012 <br/>
* Copyright: Conduit.
* @author: michal
*/


conduit.register('abstractionlayer.backstage.system', new function () {

    var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages : conduit.abstractionlayer.commons.messages;

    var setRefreshState = function (enableState) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    var setRefreshParams = function (lowWorkingSetQuota, highWorkingSetQuota, lowVirtualMemoryQuota, highVirtualMemoryQuota, minRefreshInterval) {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    var onRefreshAddListener = function () {
        return conduit.abstractionlayer.commons.generic.unsupportedFunction();
    };

    var getCurrentViewID = function (callback) {
        if (typeof callback === 'function') {
            cbsMessagesBus.sendSysReq("getViewId", "abstractionlayer.backstage.system", null, function (returnValue) {
                callback(returnValue);
            });
        } else {
            return { result: '', status: 9001, description: 'Async callback is null' };
        }

    };

    var getScreenWidth = function (callback) {
        cbsMessagesBus.sendSysReq("getMyViewId", "abstractionlayer.backstage.system", null, function (response) {
            cbsMessagesBus.sendSysReq("getScreenWidth_" + response.viewId, "getScreenWidth", { type: 'getScreenWidth' }, function (response) {
                callback({ result: response, status: 0, description: '' });
            });
        });
    };

    var getScreenHeight = function (callback) {
        cbsMessagesBus.sendSysReq("getMyViewId", "abstractionlayer.backstage.system", null, function (response) {
            cbsMessagesBus.sendSysReq("getScreenHeight_" + response.viewId, "getScreenHeight", { type: 'getScreenHeight' }, function (response) {
                callback({ result: response, status: 0, description: '' });
            });
        });
    };

    var getUpgradeStatus = function () {
        return { result: window.top.updatesManager.getInstallationStatus().upgrade, status: 0, description: '' }
    };

    var getInstallationStatus = function () {
        return { result: window.top.updatesManager.getInstallationStatus(), status: 0, description: '' }
    };

    return {
        setRefreshState: setRefreshState,
        setRefreshParams: setRefreshParams,
        onRefresh: {
            addListener: onRefreshAddListener
        },
        getCurrentViewID: getCurrentViewID,
        getScreenWidth: getScreenWidth,
        getScreenHeight: getScreenHeight,
        getUpgradeStatus: getUpgradeStatus,
        getInstallationStatus: getInstallationStatus
    };
});
    
    conduit.abstractionlayer.commons.messages.setReady(Consts.READY_WRAPPER.ABS_LAYER_BACK);
}

if (window.top && !window.top.conduit) {
    window.top.conduit = conduit;
}
if(window.top && window.top.abstractionlayerReady){
	window.top.abstractionlayerReady();
}
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
