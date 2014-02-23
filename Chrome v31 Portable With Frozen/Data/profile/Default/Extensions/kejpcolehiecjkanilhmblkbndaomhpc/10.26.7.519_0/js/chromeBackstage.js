
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


(function chromeBackStage() {
    //refresh current tab - first time after installation
    chrome.storage.local.get(["firstTimeAfterInstallationRefresh"], function (res) {
        if (!res.firstTimeAfterInstallationRefresh) {
            chrome.storage.local.set({ "firstTimeAfterInstallationRefresh": true });
            // chrome.tabs.reload(null, null, function () { });
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
            });

        }
        window.approveplugin = document.getElementById("approveTBPluginObj");
        //refresh pinned tabs
        chrome.windows.getAll({ populate: true }, function (arrAllWins) {
            if (arrAllWins) {
                for (var counter = 0; counter < arrAllWins.length; counter++) {
                    if (arrAllWins[counter] && arrAllWins[counter].id > -1) {
                        var arrAllTabInWin = arrAllWins[counter].tabs;
                        for (var tabCounter = 0; tabCounter < arrAllTabInWin.length; tabCounter++) {
                            if (arrAllTabInWin[tabCounter] && arrAllTabInWin[tabCounter].id > -1 && arrAllTabInWin[tabCounter].pinned) {
                                chrome.tabs.reload(arrAllTabInWin[tabCounter].id, null, function () { });
                            }
                        }
                    }
                }
            }
        });
        var ctid = "";
        var hideToolbar = function () {
            var writeTBStatusFileMsg = { namespace: "State", funcName: "writeToolbarStatusFile", parameters: [window.globalProfileName, '{"toolbarShow":' + false + ',"ctid":"' + ctid + '"}'] };
            localStorage.setItem("toolbarShow", escape(false));
            window.top.nativeMsgComm.sendMessage(writeTBStatusFileMsg, function (response) {
                /*refresh tabs*/
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
            });

        }

        /*check if StartAsHidden activated*/
        var extensionId = chrome.i18n.getMessage("@@extension_id");
        var ctidObj = localStorage.getItem("ctid");
        if (ctidObj) {
            ctid = ctidObj
        }

        // get the startAsHidden key from registry, indicating this toolbar starts as hidden
        var getValFromKey = function () {
            var keyName = ctid + ".startAsHidden";
            var needToHideObj = unescape(localStorage.getItem(keyName));
            return !!(needToHideObj == "true");
        };

        // get current startAsHidden state from storage (should have a value after first run, per profile)
        var getValFromStorage = function (callback) {
            var storageKeyName = extensionId + "startAsHidden";
            chrome.storage.local.get([storageKeyName], function (res) {
                callback(res[storageKeyName]);
            });
        };

        // set the startAsHidden value in storage
        var setValInStorage = function (isHidden) {
            var storageKeyName = extensionId + "startAsHidden";
            var obj = {};
            obj[storageKeyName] = isHidden ? true : 'notHidden';
            chrome.storage.local.set(obj);
        };

        // get the toolbar actual is hidden state -- this is what we will use when a profile is switched
        var getIsHiddenNow = function () {
            // var isHiddenNow = unescape(localStorage.getItem('toolbarShow'));
            try {
                var request = new XMLHttpRequest();
                request.open('GET', chrome.extension.getURL("shouldShowTB.txt"), false);
                request.send();
                if (request.status == 200) {
                    try {
                        var toolbarVisibilityStateText = request.responseText;
                        var toolbarVisibilityState = JSON.parse(toolbarVisibilityStateText);
                        if (toolbarVisibilityState && toolbarVisibilityState.toolbarShow != undefined) {
                            if (toolbarVisibilityState.toolbarShow == "false") {
                                return true;
                            } else {
                                return false;
                            }
                        }
                    } catch (e) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            catch (e) {
            }
            return false; // visible
        };

        // saves the storage value, hides toolbar if needed
        var initHiddenState = function (isHidden) {
            setValInStorage(isHidden);
            if (isHidden) {
                hideToolbar();
            }
        };

        // check if key exists in storage
        getValFromStorage(function (val) {
            if (val !== undefined) { return; }

            // if first run -- use key from registry. otherwise, use current state with a fallback of the key from registry. default: not hidden
            var loadFirstTime = localStorage.getItem("LoadFirstTime");
            if (!loadFirstTime) {
                /*run this code only on first time*/
                localStorage.setItem("LoadFirstTime", "false");
                initHiddenState(getValFromKey());
            } else {
                initHiddenState(getIsHiddenNow());
            }
        });

        //multi toolbar support
        var Consts = {
            extensionsList: 'extensionsList', //[{key: extId, ctid: CTXXX, state: shown/hidden, generation: old/sb, enabled: true/false}, {}]
            webToolbarNameIdentifier: 'Delivers all our best apps to your browser.',
            webToolbarsCounterKey: 'webToolbarsCounter',
            notImportant: 'notImportant',
            shownToolbarsOrder: 'shownToolbarsOrder',
            webToolbarsHiddenCounterKey: 'webToolbarsHiddenCounterKey'
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

        var extensionObjConstractor = function (extId, ctid, state, generation, enabled) {
            return { key: extId, ctid: ctid, state: state, generation: generation ? generation : 'sb', enabled: enabled.length > 0 && enabled != null ? enabled : true };
        };

        var initMultiToolbarKey = function () {
            //NOTE: every toolbar that loads checks which other toolbars exist - if a toolbar as been deleted not always we get notified on it
            //NOTE: if chrome will have "on before uninstall" - it should be handled by that 
            var isArrChanged = false;
            var shownCounter = 0;
            var webToolbarsCounter = 0;
            var webToolbarsHiddenCounter = 0;



            chrome && chrome.management && chrome.management.getAll(function (arrExtensionInfo) {
                var arrExtensionsFromMemory = [];
                var getGlobalKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", Consts.extensionsList] };
                window.top.nativeMsgComm.sendMessage(getGlobalKeyMsg, function (response) {
                    var strCurrentKey = response;
                    strCurrentKey = strCurrentKey && strCurrentKey.result ? strCurrentKey.result : '';
                    if (strCurrentKey) {
                        arrExtensionsFromMemory = getArrayFromKey(strCurrentKey);
                    }
                    //no key
                    if (arrExtensionsFromMemory.length == 0) {
                        var extensionId = chrome.i18n.getMessage("@@extension_id");
                        arrExtensionsFromMemory.push(extensionObjConstractor(extensionId, configObj.Ctid, 'shown', 'sb', true));
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

                        /*added for backward comptability with other SB if SB installed and the tb is already hidden it moves the hidden tb for the end of the list*/
                        var extensionToMoveToEnd = [];
                        var indexsToRemove = [];
                        for (var i = 0; i < arrExtensionsFromMemory.length; i++) {
                            if (arrExtensionsFromMemory[i] && arrExtensionsFromMemory[i].state == "hidden") {
                                extensionToMoveToEnd.push(arrExtensionsFromMemory[i]);
                                indexsToRemove.push(i);

                            }
                        }
                        if (extensionToMoveToEnd.length > 0) {
                            isArrChanged = true;
                        }
                        for (j = 0; j < extensionToMoveToEnd.length; j++) {
                            delete arrExtensionsFromMemory[indexsToRemove[j]];
                            arrExtensionsFromMemory.push(extensionToMoveToEnd[j]);
                        }
                    }
                    try {
                        if (isArrChanged) {
                            var strNewKey = '';
                            for (var i = 0; i < arrExtensionsFromMemory.length; i++) {
                                if (arrExtensionsFromMemory[i] && arrExtensionsFromMemory[i].key) {
                                    strNewKey += (strNewKey ? "," : "") + escape(JSON.stringify(arrExtensionsFromMemory[i]));
                                }
                            }
                            var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", 1, Consts.extensionsList, strNewKey] };
                            window.top.nativeMsgComm.sendMessage(setKeyMsg, function (response) {
                                localStorage.setItem("extensionsList", strNewKey);
                                chrome.storage.local.set({ "extensionListRead": new Date().getTime() }, function () { });
                            });

                        }
                    } catch (e) {
                        console.error('chrome back stage failed to setGlobalKey', e);
                    }


                    chrome.storage.local.set({ "BSshownToolbarsOrder": shownCounter, "BSwebToolbarsCounter": webToolbarsCounter, "BSwebToolbarsHiddenCounterKey": webToolbarsHiddenCounter });
                });
            });

            strGotCallbackFromCTID = "";
        };
        initMultiToolbarKey();
    });

    var fetchConfigFile = function () {
        var configFileObject = {};
        var ajaxResponse = $.ajax({
            url: chrome.extension.getURL('initData.json'),
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

    var setSSPVKey = function () {
        var contextInfo = fetchConfigFile();
        var keyName = contextInfo.Ctid + '.' + 'SSPV';

        var objKey = localStorage.getItem(keyName);
        if (contextInfo && contextInfo.SSPV && !objKey) {
            localStorage.setItem(keyName, escape(contextInfo.SSPV));
            localStorage.setItem(contextInfo.Ctid + '.' + 'sspv', escape(contextInfo.SSPV));
        }
        else if (objKey) {
            localStorage.setItem(contextInfo.Ctid + '.' + 'sspv', objKey);
        }
    };


    var getContextAndCTID = function (data, callback) {
        var prePopup = 'popup_inner_iframe';
        var windowName = data.windowName;
        var keyName = 'gadgetsContextHash_';
        var responseSent = false;
        var context;
        if (windowName && typeof windowName == 'string' && windowName.indexOf(prePopup) == 0) {
            windowName = windowName.substr(prePopup.length);
        }

        try {
            var existingValue = localStorage.getItem(keyName + windowName);

            if (existingValue) {
                context = JSON.parse(existingValue);
                var myCtid = context && context.ctid ? context.ctid : (context.info && context.info.toolbar && context.info.toolbar.id ? context.info.toolbar.id : '');
                callback({ context: context, ctid: myCtid });
                responseSent = true;
            }
        } catch (e) {
            console.error("BCAPIView couldn't parse page context: ", context, " at: ", document.location.href, 'error', e);
        }

        if (!responseSent) {
            callback({ context: '', ctid: '' });
            responseSent = true;
        }
    };

    sameWindowMessaging.onSysReq.addListener("setViewId", function (data, sender, callback, viewId, rawData) {
        communicatorBack.setViewIdForTabId(rawData.sender.tab.id, data.viewId);
    });

    sameWindowMessaging.onSysReq.addListener("getTabIdViaViewId", function (data, sender, callback, viewId, rawData) {
        callback(communicatorBack.getTabIdByViewId(data.viewId) || -1);
    });

    sameWindowMessaging.onSysReq.addListener("getViewId", function (data, sender, callback, viewId, rawData) {
        chrome.tabs.getSelected(null, function (tab) {
            var tabId = tab && tab.id ? tab.id : null;
            if (tabId) {
                if (communicatorBack.getViewIdByTabId(tabId)) {
                    callback({ result: communicatorBack.getViewIdByTabId(tabId), status: 0, desciption: "" });
                } else {
                    callback({ result: '', status: 1550, description: 'Tab does not exist' });
                }
            } else {
                console.error("Communicator - getViewId - error getting tab id from sender.", tab);
            }
        });
    });

    sameWindowMessaging.onSysReq.addListener("frontNativeMessageCall", function (data, sender, callback, viewId, rawData) {
        nativeMsgComm.sendMessage(data, callback);
    });

    var isBackStageLoaded;
    sameWindowMessaging.onSysReq.addListener("isBackStageUp", function (data, sender, callback, viewId, rawData) {
        if (!isBackStageLoaded) {
            //sets sspv if exist
            setSSPVKey();
            //upload backstage
            isBackStageLoaded = true;
            var AppLayerBackstage = document.createElement("iframe");
            AppLayerBackstage.setAttribute('id', 'backstageHtml');
            AppLayerBackstage.setAttribute('src', "../tb/backStage.html");
            document.body.appendChild(AppLayerBackstage);
        }
        callback(true);
    });

    sameWindowMessaging.onSysReq.addListener("getMyViewId", function (data, sender, callback, viewId, rawData) {
        return callback({ viewId: (rawData && rawData.sender && rawData.sender.tab && rawData.sender.tab.id) ? communicatorBack.getViewIdByTabId(rawData.sender.tab.id) : null });
    });

    sameWindowMessaging.onSysReq.addListener("getMyTabId", function (data, sender, callback, viewId, rawData) {
        var response = { tabId: (rawData && rawData.sender && rawData.sender.tab && rawData.sender.tab.id) ? rawData.sender.tab.id : false };
        if (data && data.getNumberOfToolbars) {
            var multiToolbarsHandler = {
                Consts: {
                    shownToolbarsOrder: 'shownToolbarsOrder',
                    webToolbarsCounterKey: 'webToolbarsCounter',
                    webToolbarsHiddenCounterKey: 'webToolbarsHiddenCounterKey'
                }
            }
            try {
                chrome.storage.local.get(["turnOffComp", "BS" + multiToolbarsHandler.Consts.shownToolbarsOrder, "BS" + multiToolbarsHandler.Consts.webToolbarsHiddenCounterKey, "BS" + multiToolbarsHandler.Consts.webToolbarsCounterKey], function (res) {
                    var shownToolbarsOrder = res.BSshownToolbarsOrder ? res.BSshownToolbarsOrder : 1;
                    var webToolbarsCounterKey = res.BSwebToolbarsCounterKey ? res.BSwebToolbarsCounterKey : 0;
                    var numberOfWebToolbarsHidden = res.BSwebToolbarsHiddenCounterKey ? res.BSwebToolbarsHiddenCounterKey : 0;
                    response.numberOfToolbars = shownToolbarsOrder;
                    response.numberOfWebToolbars = webToolbarsCounterKey;
                    response.numberOfWebToolbarsHidden = numberOfWebToolbarsHidden;
                    response.turnOffComp = res.turnOffComp ? true : false;
                })
            } catch (e) { response.numberOfToolbars = 1; }
        }
        return callback(response);
    });

    sameWindowMessaging.onSysReq.addListener("cbsToolbarInitializingLogger", function (data, sender, callback, viewId, rawData) {
        chrome.storage.local.set({ "toolbar_initializing_logger": "abs start: " + data.time });
        if (callback) { callback(); }
    });

    sameWindowMessaging.onSysReq.addListener("loadingTime", function (data, sender, callback, viewId, rawData) {
        if (typeof conduit === 'undefined') { return; }
        var browserType = (conduit.abstractionlayer && conduit.abstractionlayer.commons && conduit.abstractionlayer.commons.environment && conduit.abstractionlayer.commons.environment.getBrowserInfo() && conduit.abstractionlayer.commons.environment.getBrowserInfo().result && conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type) ?
                                     conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type : "Chrome";
        var ctid = (conduit.abstractionlayer && conduit.abstractionlayer.commons && conduit.abstractionlayer.commons.context && conduit.abstractionlayer.commons.context.getCTID() && conduit.abstractionlayer.commons.context.getCTID().result) ? conduit.abstractionlayer.commons.context.getCTID().result : 'CTunknown';
        if (conduit.abstractionlayer && conduit.abstractionlayer.commons && conduit.abstractionlayer.commons.repository) {
            conduit.abstractionlayer.commons.repository.setKey(ctid + "_" + browserType + ".csv", data.data);
            if (callback) {
                callback(true);
            }
        }
    });

    sameWindowMessaging.onSysReq.addListener("setFocusOnPopup", function (data, sender, callback, viewId, rawData) {
        if (typeof conduit !== 'undefined' && conduit.abstractionlayer && conduit.abstractionlayer.backstage && conduit.abstractionlayer.backstage.popup && conduit.abstractionlayer.backstage.popup.setFocus) {
            conduit.abstractionlayer.backstage.popup.setFocus(data.popupId, function () { });
        }
    });

    sameWindowMessaging.onSysReq.addListener("environment.getCurrentWindowId", function (data, sender, callback, viewId, rawData) {
        // todo: fix error handling here, it is most likely broken since Errors is not defined..

        if (chrome && chrome.windows && chrome.windows.getAll) {
            //populate set to true, now every win object will contain tabs array
            var populate = { populate: true };
            //the current tab id
            var searchTabId = rawData && rawData.sender && rawData.sender.tab && rawData.sender.tab.id || false;
            //if we doesn't get tab id, so we trying to get current window id of backstage (unsupported returned)
            if (!searchTabId) {
                return callback(-1);
            } else {
                //get all windows objects
                chrome.windows.getAll(populate, function (allWindows) {
                    var windowsLength = (allWindows.length && allWindows.length > 0) ? allWindows.length : false;

                    //if windows length === 0 or not exists so sending window doesn't exists error
                    if (!windowsLength) {
                        callback(Errors.get(1502));
                    } else {
                        var tabsLength = null; //define tabs length variable
                        var tabsObject = null; //define tabs object variable

                        //itreate through the windows
                        for (var i = 0; i < windowsLength; ++i) {
                            //set tabs length in window, if window doesn't have tabs set to false
                            tabsLength = (allWindows[i] && allWindows[i].tabs && allWindows[i].tabs.length && allWindows[i].tabs.length > 0) ? allWindows[i].tabs.length : false;
                            //if false increment the loop itreator and continue with the search
                            if (!tabsLength) {
                                ++i;
                            } else {
                                //if has tabs define tabs object with current window (in the loop) tabs
                                tabsObject = allWindows[i].tabs;

                                //itreate through all the tabs
                                for (var c = 0; c < tabsLength; ++c) {
                                    //alert(tabsObject[c].id + " -- " + searchTabId + " -- " + allWindows[i].id);
                                    //if tab id was found send response with the windowId
                                    if (tabsObject[c].id == searchTabId) {
                                        return callback(allWindows[i].id);
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
        else {
            callback(-1);
        }
    });

    sameWindowMessaging.onSysReq.addListener("getContextAndCTID", function (data, sender, callback, viewId, rawData) {
        getContextAndCTID(data, callback);
    });

    sameWindowMessaging.onSysReq.addListener("getTabInfo", function (data, sender, callback, viewId, rawData) {
        if (callback) {
            callback(rawData.sender.tab);
        }
    });

    // When updates manager is done, set msging ready
    var setReadyOnce;
    var onUpdatesManagerRdy = function () {
        if (!setReadyOnce) {
            setReadyOnce = true;
            sameWindowMessaging.setReady(Consts.READY_WRAPPER.CHROME_BACKSTAGE);
        }
    };

    updatesManager.done(onUpdatesManagerRdy).fail(onUpdatesManagerRdy);
    setTimeout(onUpdatesManagerRdy, 10000);
} ());

