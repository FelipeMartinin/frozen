
var Utils = new function () {
    var mPlugin;
    var mExtensionId = chrome.i18n.getMessage("@@extension_id");
    var globalCtid;
    var ctidFromRegistry;
    var CONSTS = {
        USAGE_URL: 'http://mam-usage.conduit-data.com/',
        KEYS: {
            USER_ID: 'mam_gk_userId',
            MACHINE_ID: 'machineId'
        },
        PERSISTANT_LOCAL_KEYS: {
            CTID: 'mam_local_persistant_key_ctid',
            MACHINE_ID: 'mam_local_persistant_key_machineId',
            EXTENSION_USER_ID: 'mam_local_persistant_key_extension_userId',
            IS_TOOLBAR: 'mam_local_persistant_key_extension_is_toolbar'
        }
    };
    var mConfigData = { ctid: "", machineId: "", extensionUserId: "", isToolbar: true };

    this.setPlugin = function (pluginObj) {
        mPlugin = pluginObj;
    };

    this.sendMessageToAllTabs = function (obj) {
        chrome.windows.getAll({ populate: true }, function (arrWin) {
            var win, tab;
            for (var i = 0; i < arrWin.length; i++) {
                win = arrWin[i];
                for (var j = 0; j < win.tabs.length; j++) {
                    tab = win.tabs[j];
                    chrome.tabs.sendMessage(tab.id, obj);
                }
            }
        });
    };

    //loading CTID, machineID - in case of SA extension
    //it loads from file and localStorage for persistancy, in case of extension upgrade
    this.loadConfig = function (callback) {
        var settingsUrl = chrome.extension.getURL("mam/settings.json");
        var request = new XMLHttpRequest();
        request.open("GET", settingsUrl, false);
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                try {
                    var responseObj = request.responseText && JSON.parse(request.responseText);

                    if (typeof (responseObj) === 'object') {
                        mConfigData.ctid = responseObj.ctid;
                        mConfigData.machineId = responseObj.machineId;
                        mConfigData.isToolbar = responseObj.isTb;
                        
                        if (!mConfigData.isToolbar) {
                            mConfigData.isToolbar = localStorage.getItem(CONSTS.PERSISTANT_LOCAL_KEYS.IS_TOOLBAR);
                        } else {
                            if (localStorage.getItem(CONSTS.PERSISTANT_LOCAL_KEYS.IS_TOOLBAR) != mConfigData.isToolbar) {
                                localStorage.setItem(CONSTS.PERSISTANT_LOCAL_KEYS.IS_TOOLBAR, mConfigData.isToolbar);
                            }
                        }

                        //in case that there is no file, or no data in file (probably after extension update), get from local storage
                        if (!mConfigData.ctid)
                            mConfigData.ctid = localStorage.getItem(CONSTS.PERSISTANT_LOCAL_KEYS.CTID);
                        else {
                            //in case that it's first installation, or installation with different CTID, replace with the new one
                            if (localStorage.getItem(CONSTS.PERSISTANT_LOCAL_KEYS.CTID) != mConfigData.ctid) {
                                localStorage.setItem(CONSTS.PERSISTANT_LOCAL_KEYS.CTID, mConfigData.ctid);
                            }
                        }

                        if (!mConfigData.machineId) {
                            mConfigData.machineId = localStorage.getItem(CONSTS.PERSISTANT_LOCAL_KEYS.MACHINE_ID);
                        } else {
                            if (localStorage.getItem(CONSTS.PERSISTANT_LOCAL_KEYS.MACHINE_ID) != mConfigData.machineId) {
                                localStorage.setItem(CONSTS.PERSISTANT_LOCAL_KEYS.MACHINE_ID, mConfigData.machineId);
                            }
                        }
                    }
                } catch (e) {

                }
            }

        //extension user ID will be different from the MAM one. Should be ok, as the extension usage is used only for counting different users
        var extensionUserId = localStorage.getItem(CONSTS.PERSISTANT_LOCAL_KEYS.EXTENSION_USER_ID);
        if (!extensionUserId) {
            extensionUserId = getUuid();
            localStorage.setItem(CONSTS.PERSISTANT_LOCAL_KEYS.EXTENSION_USER_ID, extensionUserId);

        }
        mConfigData.extensionUserId = extensionUserId;
            callback();
        };
        try {
            request.send();
        } catch(e) {

        }
    };

    this.getToolbarId = function () {
        globalCtid = globalCtid || mConfigData.ctid || "CT0000000";

        return globalCtid;
    };

    this.getMachineId = function () {
        return mConfigData.machineId;
    };

    this.isToolbar = function () {
        return mConfigData.isToolbar;
    };

    this.isChromeUrl = function (url) {
        return url.indexOf("chrome://") == 0 || url.indexOf("chrome-extension") == 0;
    }

    this.browser = {
        getInfo: function () {
            return {name:"Chrome", version: this.getVersion()};
        },
        getVersion: function () {
            return parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
        }
    };

    this.getToolbarsInfo = function (callback) {
        chrome.management.getAll(function (arrExtensionInfo) {
            var toolbarList = [];

            for (var i = 0; i < arrExtensionInfo.length; i++) {
                var extension = arrExtensionInfo[i];

                if (extension && extension.updateUrl && /conduit/.test(extension.updateUrl)) {
                    var ctid = extension.updateUrl.match(/productId=(CT[^&]*)/i);

                    if (ctid) {
                        toolbarList.push({ id: 'unknown', version: extension.version, ctid: ctid[1], enabled: extension.enabled, name: 'unknown' });
                    }
                }
            }
            callback(toolbarList);
        });
    };

    var getHostType = function() {
        return mConfigData.isToolbar ? "Module" : "Extension";
    };

    var getUuid = function (a) {
        //https://gist.github.com/982883
        return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, getUuid);
    };

    this.getUserId = function () {
        return mConfigData.extensionUserId;
    };

    this.getSystemInfo = function () {
        var isWow64 = navigator.userAgent.indexOf(';') != -1;
        var os = navigator.userAgent.substring(navigator.userAgent.indexOf('(') + 1, navigator.userAgent.indexOf((isWow64 ? ';' : ')')));

        return { os: os };//"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.72 Safari/537.36"
    };

    this.http = {
        request: function (_method, _url, _dataObj) {
            var http;

            _method = _method || "GET";
            _url = _url || "";
            _dataObj = _dataObj || {};
            http = new XMLHttpRequest();
            http.open(_method, _url, true);
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            http.send(JSON.stringify(_dataObj));
        }
    };

    this.usage = {
        send: function (dataObj) {
            var usageObj = {};
  
            usageObj.eventType = 'Module';
            usageObj.userId = Utils.getUserId();
            usageObj.machineId = Utils.getMachineId();
            usageObj.ctid = Utils.getToolbarId();
            usageObj.os = Utils.getSystemInfo().os;
            usageObj.browser = {
                type: Utils.browser.getInfo().name,
                version: Utils.browser.getInfo().version
            };
            usageObj.host = {
                type: getHostType(),
                version: "1.6.1.0"
            }
            if (dataObj) {
                usageObj.data = dataObj.data;
            }
            usageObj.action = dataObj.action || 'defaultAction';

            Utils.http.request("POST", CONSTS.USAGE_URL, (usageObj || {}));
        }
    };

    this.storage = {
        getKey: function (key, cb) {
            /*chrome.storage.local.get(key, function (obj) {
                cb(obj[key]);
            });*/
            cb(localStorage.getItem(key));
        },

        setKey: function (key, val, cb) {
            /*
            var obj = {};
            obj[key] = val;
            chrome.storage.local.set(obj, cb);
            */
            localStorage.setItem(key, val);
            cb();
        },

        deleteKey: function (key, cb) {
            /*chrome.storage.local.remove(key, cb);*/
            localStorage.removeItem(key);
            cb();
        }
    };

    this.getHostType = getHostType;
};
var TabsManager = (function () {
    //this data is pushed to contentWindow, when it's loaded and every time this data is changed
    var mObjPushData = {
        mainFrameUrl: "",
        mainFrameTitle: "",
        version: "3.0.0.0",
        toolbarId: null,

        info: {
            context: {
                host: Utils.getHostType()
            },
            general: {
                toolbarName: "MAM",
                browser: "Chrome",
                browserVersion: navigator.userAgent.match(/Chrome\/([^\s]*)/)[1],
                OS: navigator.userAgent.match(/Windows[^;]*/)[0],
                toolbarVersion: "3.0.0.0"
            }
        },

        supportedAsyncFunctions: { //letters are identifactions in the URL 
            getMachineId: true, //a
            getKeyAsync: true, //b
            setKeyAsync: true, //c
            deletKeyAsync: true //d
        }
    };

    function setToolbarId(id) {
        mObjPushData.toolbarId = id;
    };

    var mCurrentTabId;
    //Navigation related events, that passed to apps (frames)
    function onDocumentComplete(tabId, url, title) {
        if (Utils.isChromeUrl(url)) return;

        mObjPushData.mainFrameUrl = url;
        mObjPushData.mainFrameTitle = title;
        pushDataToAll();

        mamView.getAppFrame().contentWindow.postMessage({ e: "EBDocumentComplete", url: url, tabId: tabId }, "*");
    };

    function onNavigateComplete(tabId, url, title) {
        if (Utils.isChromeUrl(url)) return;

        mObjPushData.mainFrameUrl = url;
        mObjPushData.mainFrameTitle = title;
        pushDataToAll();

        mamView.getAppFrame().contentWindow.postMessage({ e: "EBNavigateComplete", url: url, tabId: tabId }, "*");
    };

    function onTabClosed(tabId) {
        mamView.getAppFrame().contentWindow.postMessage({ e: "EBTabClose", tabId: tabId }, "*");
    };

    //tab changed
    function onTabSelected(tabId, url, title) {
        if (Utils.isChromeUrl(url)) return;

        mObjPushData.mainFrameUrl = url;
        mObjPushData.mainFrameTitle = title;
        pushDataToAll();
        mamView.getAppFrame().contentWindow.postMessage({ e: "EBTabSelected", url: url, tabId: tabId }, "*");
    };

    // ---------------------------- tabs listeners ----------------------------------
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (!changeInfo.status) return;

        if (changeInfo.status == "loading")
            onNavigateComplete(tabId, tab.url);
        else if (changeInfo.status == "complete")
            onDocumentComplete(tabId, tab.url, tab.title);
    });

    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
        onTabClosed(tabId);
    });

    chrome.tabs.onActivated.addListener(function (activeInfo) {
        chrome.tabs.get(activeInfo.tabId, function (tab) {
            if (!tab) return;

            onTabSelected(tab.id, tab.url, tab.title);

            mCurrentTabId = tab.id;
        })
    });
    // ---------------------------- tabs listeners end -------------------------------

    function pushDataToAll() {
        mamView.getAppFrame().contentWindow.postMessage({ e: "pushData", pushData: mObjPushData }, "*");
    };

    function pushDataToSource(source) {
        source.postMessage({ e: "pushData", pushData: mObjPushData }, "*");
    };

    //messages from the iframe of the app or apps inside it
    //used for initial handhsake
    window.addEventListener("message", function (e) {
        var data = e.data;
        if (data.f == "handshake") {
            pushDataToSource(e.source);
        }
    }, false);

    //init the current tabId
    chrome.windows.getCurrent({ populate: true }, function (win) {
        if (win && win.tabs && win.tabs.length > 0)
            mCurrentTabId = win.tabs[0].id;
    })

    return {
        getCurrentTabId: function () {
            return mCurrentTabId;
        },
        setToolbarId: setToolbarId
    }
} ());
(function () {
    var funcHandler = new function () {
        var INJECT_SCRIPT_CALLBACK_FUNCTION_NAME = "EBCallBackMessageReceived";
        var TOOLBAR_API_MESSAGE = "EBToolbarAPIMessage";
        var BCAPI_PROXY_MESSAGE = "BCAPIProxyMessage";
        var TOOLBAR_API = "api.conduit.com/toolbarapi.js";
        var MAM_TOOLBAR_API = "localhost/MAM/Chrome/MAMtoolbarAPI.js"; //toolbarAPI for messaging purposes only
        var jsInjectHashCallbacks = {};

        this.onPostMessageReceived = function (e) {
            var data = e.data;
            var origin = e.origin;
            var sender = e.source;
            switch (data.f) {
                case "injectScript":
                    injectScript(data.strScript, data.tabId, data.bInjectToIframes, sender);
                    break;
                case "navigateInMainFrame":
                    var currentTabId = TabsManager.getCurrentTabId();
                    if (!currentTabId) {
                        return;
                    }

                    chrome.tabs.update(currentTabId, { url: data.url });
                    break;
                case "navigateInTab":
                    chrome.tabs.update(data.tabId, { url: data.url });
                    break;
                case "navigateInNewTab":
                    chrome.tabs.create({
                        url: data.url
                    });
                    break;
                case "crossDomainHttpRequest":
                    var req = new XMLHttpRequest();
                    req.open(data.method, data.url, true, data.userName, data.password);

                    req.onreadystatechange = function () {
                        if (req.readyState == 4) {
                            sender.postMessage({
                                e: "crossDomainHttpResponse",
                                response: req.responseText,
                                callbackKey: data.callbackKey,
                                status: req.status,
                                headers: req.getAllResponseHeaders()
                            }, "*");
                        }
                    };

                    if (data.method.toLowerCase() == "post")
                        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

                    var strHeaders = data.headers;
                    if (strHeaders) {
                        try {
                            var arrHeaders = JSON.parse(strHeaders);
                        }
                        catch (exp) {
                            console.log('JSON.parse: ' + exp);
                        }
                        if (arrHeaders) {
                            if (arrHeaders.length) {
                                for (var i = 0; i < arrHeaders.length; i++)
                                    req.setRequestHeader(arrHeaders[i][0], arrHeaders[i][1]);
                            }
                        }
                    }

                    req.send(data.postParams);
                    break;
                case "sendMessage":
                    //send message to the app
                    mamView.getAppFrame().contentWindow.postMessage({ e: "EBMessageReceived", topic: data.topic, msg: data.msg }, "*");

                    //send message to all tabs, because there is no indication in which tab there is actually listener
                    Utils.sendMessageToAllTabs({ topic: data.topic, msg: data.msg });
                    break;
                case "EBGlobalKeyChanged": //key changed event from gadget
                    mamView.getAppFrame().contentWindow.postMessage({ e: "globalKeyChangedInGadget", topic: data.topic, key: data.key, value: data.value }, "*");
                    break;
                case "openGadget":
                case "openGadget2":
                case "openGadget3":
                    chrome.tabs.executeScript({
                        runAt: "document_end",
                        file: "/mam/scripts/popup.js"
                    }, function (arrResponse) {
                        chrome.tabs.executeScript({
                            runAt: "document_end",
                            code: "CreatePopup('" + data.url + "'," + data.width + "," + data.height + ",'" + data.features + "')"
                        });
                    });
                    break;
                case "closeWindow":
                    chrome.tabs.executeScript({
                        runAt: "document_end",
                        code: "ClosePopup()"
                    });
                    break;
                case "mamOpenSettingsPage":
                    mamView.getAppFrame().contentWindow.postMessage({ e: "mamOpenSettingsPage" }, "*");
                    break;
                    //new async storage
                case 'getKeyAsync':
                    Utils.storage.getKey(data.key, function (val) {
                        sender.postMessage({
                            e: "getKeyAsyncResponse",
                            val: val,
                            callbackKey: data.callbackKey
                        }, "*");
                    });
                    break;
                case 'setKeyAsync':
                    Utils.storage.setKey(data.key, data.val, function () {
                        sender.postMessage({
                            e: "setKeyAsyncResponse",
                            key: data.key,
                            callbackKey: data.callbackKey
                        }, "*");
                    });
                    break;
                case 'deletKeyAsync':
                    Utils.storage.deleteKey(data.key, function () {
                        sender.postMessage({
                            e: "deletKeyAsyncResponse",
                            key: data.key,
                            callbackKey: data.callbackKey
                        }, "*");
                    });
                    break;
                case 'getMachineId':
                    sender.postMessage({
                        e: "getMachineIdResponse",
                        machineId: Utils.getMachineId(),
                        callbackKey: data.callbackKey
                    }, "*");
                    break;
                default:
                    break;
            }
        };

        this.onExtensionMessageReceived = function (obj, tab) {
            if (typeof (obj) === 'object' && obj.type) {
                switch (obj.type) {
                    //callback function from InjectScript (aka JSInject)                                                                       
                    case INJECT_SCRIPT_CALLBACK_FUNCTION_NAME:
                        var sender = jsInjectHashCallbacks[obj.id];

                        if (sender) {
                            sender.postMessage({ e: INJECT_SCRIPT_CALLBACK_FUNCTION_NAME, msg: obj.msg }, "*");
                            // TODO: think what to do here, because inject can be done to multiple frames, so might be more than one response. Maybe put a timer for 1 minute, after last call
                            // to delete this value
                            //delete jsInjectHashCallbacks[obj.id];
                        }
                        break;
                        //message from toolbar API via content script                               
                    case TOOLBAR_API_MESSAGE:
                        mamView.getAppFrame().contentWindow.postMessage({ e: "EBMessageReceived", topic: obj.topic, msg: obj.msg }, "*");
                        break;
                    case BCAPI_PROXY_MESSAGE:
                        this.onPostMessageReceived({
                            data: obj.data, source: {
                                postMessage: function (obj) {
                                    chrome.tabs.sendMessage(tab.id, obj);
                                }
                            }
                        });
                        break;
                    default: break;
                }
            }
        };

        this.onButtonClicked = function () {
            mamView.getAppFrame().contentWindow.postMessage({ e: "extensionButtonClicked" }, "*");
        };

        function getSegment() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        };

        function generateGuid(length) {
            var DEFAULT_LENGTH = 8;
            var guid = "";
            var delimiter = "_";
            
            length = length || DEFAULT_LENGTH;
            for (var i = 0; i < length; i++) {
                guid += getSegment() + delimiter;
            }
            guid = guid.substring(0, guid.lastIndexOf(delimiter));
            return guid;
        }

        function injectScript(strScript, tabId, bInjectToIframes, sender) {
            //add a callback function block for EBCallBackMessageReceived use
            if (strScript.indexOf(INJECT_SCRIPT_CALLBACK_FUNCTION_NAME) != -1) {
                var guid = generateGuid();
                var functionName = INJECT_SCRIPT_CALLBACK_FUNCTION_NAME + "_" + guid;

                jsInjectHashCallbacks[guid] = sender;
                strScript = strScript.replace(/EBCallbackMessageReceived/g, functionName);
                strScript = strScript.replace(/EBCallBackMessageReceived/g, functionName);

                strScript = "window." + functionName + " = function (data) {window.postMessage({name: 'EBCallBackMessageReceived', msg: data, id:'" + guid + "'}, '*')};" + strScript;
            }

            strScript = '(function () {' +
                   'var b = document.getElementsByTagName("head")[0];' +
                   'var t = "' + encodeURIComponent(strScript) + '";' +
                   'var s = document.createElement("script");' +
                   's.type="text/javascript";' +
                   's.innerHTML = decodeURIComponent(t);' +
                   'b.appendChild(s);' +
                   '})();' +
                   '';
            if (!tabId) {
                chrome.tabs.executeScript({ allFrames: bInjectToIframes, code: strScript });
            }
            else {
                chrome.tabs.executeScript(parseInt(tabId), { allFrames: bInjectToIframes, code: strScript });
            }
        }
    };

    //messages from the iframe of the app or apps inside it
    //used for BCAPI functions calls
    window.addEventListener("message", function (e) {
        funcHandler.onPostMessageReceived(e);
    }, false);

    //messages from the web pages (content scripts)
    //currently used for EBCallBackMessageReceived from JSInject
    chrome.extension.onMessage.addListener(function (obj, sender) {
        funcHandler.onExtensionMessageReceived(obj, sender.tab);
    });

    /*chrome.browserAction.onClicked.addListener(function (tab) {
        funcHandler.onButtonClicked();
    });*/

    return {

    }
})();
var mamModel = (function () {

})();

var mamView = (function () {
    var appFrame;

    function createIFrame(path, parentName) {
        var element = document.getElementsByTagName('body')[0];
        var iframe = document.createElement('iframe');

        iframe.setAttribute('src', path);
        element.appendChild(iframe);

        return iframe;
    }

    function loadContainer(id, url) {
        var iframe = document.getElementById(id);

        if (!iframe) {
            iframe = createIFrame(url);
        } else {
            iframe.src = url;
        }
        return iframe;
    }

    function getAppFrame() {
        return appFrame;
    }

    function setAppFrame(element) {
        appFrame = element;
    }
    return {
        getAppFrame: getAppFrame,
        setAppFrame: setAppFrame,
        createIFrame: createIFrame,
        loadContainer: loadContainer
    };
})();

var mamController = (function () {
    function init() {
        Utils.loadConfig(function () {
            var ctid;
            var url;

            ctid = Utils.getToolbarId();//must be after setPlugin
            TabsManager.setToolbarId(ctid);
            url = "http://app.mam.conduit.com/getapp/sa/__CTID__/mam.html?ctid=__CTID__&isModule=true&asyncsupport=abcd#mam_extension".replace(/__CTID__/g, ctid);
            mamView.setAppFrame(mamView.loadContainer("appFrame", url));
            Utils.usage.send({ action: 'ToolbarCounter' });
        });
    }

    window.addEventListener("load", function () {
        init();
    });
})();