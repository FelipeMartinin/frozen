conduit = {}
conduit.searchInNewTab = function () {
    var toolbarLocale = "";
    var SSPV_CONST = ""; // replaced in build
    var dirName = function () { return chrome.i18n.getMessage("@@extension_id"); } ();

    var generateUserID = function () {
        var UNIQUE_ID_LENGTH = 19;
        var strID = "UN" + Math.random().toString().substring(2);
        while (strID.length < UNIQUE_ID_LENGTH) {
            strID += Math.random().toString().substring(2);
        }
        return strID.substr(0, 19);
    };

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

    var setContextInfo = function () {

        var contextInfo = getKey('contextInfo') ? getKey('contextInfo') : null;

        configFileUrl = chrome.extension.getURL('initData.json');
        configFileObject = fetchConfigFile(configFileUrl);

        var downloadUrlFromInit = configFileObject.downloadUrl ? configFileObject.downloadUrl : "";
        var myCtid = configFileObject.Ctid;
        var sspv = configFileObject.SSPV ? configFileObject.SSPV : "";
        if (!sspv) {
            localStorage.removeItem('newTabSSPV');
        } else {
            setKey('newTabSSPV', sspv);
        }
        // prepare object for repository.
        var obj = {
            toolbarName: configFileObject.toolbarName,
            Ctid: myCtid,
            downloadUrl: downloadUrlFromInit,
            version: configFileObject.version
        }

        //set object to repository.
        setKey('contextInfo', JSON.stringify(obj));
    }

    var JSONstring = {
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
    }

    var returnObj = function (param) {
        // get data from reposiroty.
        try {
            var contextInfo = {};
            var res = getKey('contextInfo');
            if (res.status == 0) {
                contextInfo = JSONstring.toObject(res.result);
            }
        } catch (e) {
            console.error(e);
        }

        var obj = {};
        obj.result = contextInfo[param] ? contextInfo[param] : "";
        obj.status = contextInfo[param] ? 0 : 2200;
        obj.description = contextInfo[param] ? "" : "Dedicated Key doesn\'t exist";

        return obj;
    }

    var getContextItem = function (itemName) {
        var res = getKey('contextInfo');
        if (res.result !== 0) {
            setContextInfo();
        }

        //then get it back with the relevant param.
        var objToReturn = returnObj(itemName);

        return objToReturn;
    }

    var getKey = function (key) {
        try {

            if (!key) {
                return { result: '', status: 9000, description: 'Parameter is null' };
            }

            var keyValue = localStorage.getItem(key);
            if (keyValue) {
                keyValue = unescape(keyValue)
            }
            var oldItem;
            try {
                oldItem = JSON.parse(keyValue);
                oldItem = oldItem && oldItem.itemData;
                if (oldItem) {
                    keyValue = oldItem;
                }
            } catch (e) { }
            if (!keyValue) {
                return { result: "", status: 1, description: '' };
            }
            else {
                return { result: keyValue, status: 0, description: '' };
            }


        } catch (e) {
            console.error("Repository - GetKey Exception: " + e + " " + (e.stack ? e.stack.toString() : ""));
        }

        console.error("getKey error for key ", key);
        return { result: "", status: 1, description: '' };
    }

    var setKey = function (key, value, func_type, binary, type) {
        var isObjectSaved = null;
        var tmpFuncType = func_type;
        try {
            if (!key || value === undefined || value === null || value === "" && func_type !== 1) {
                return { result: '', status: 9000, description: 'Parameter is null' };
            }
            else {
                value = escape(value);
                return { result: localStorage.setItem(key, value), status: 0 };
            }
        } catch (e) { }

        // Can reach here if object is string and reply doesn't contain result or if local storage object saving failed.
        console.error("Error: repository set ", isObjectSaved, " is incorrect for key ", key);
        return { result: false, status: 0, description: '' };
    }

    var getCTID = function () {
        return getContextItem('Ctid');
    }

    var getVersion = function () {
        return getContextItem('version');
    }

    var setUserIDKeys = function (userID, generateFullUserID) {
        setTripleKey("ToolbarUserID", userID, function () {
            setFullUserId(userID, generateFullUserID);
        });
    }

    function setFullUserId(userID, generateFullUserID) {
        getFullUserID(function (resp) {
            var fullUserID = resp.result;
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
            setTripleKey('ToolbarFullUserID', fullUserID, function () { });
        });
    }

    var pad = function (num) { return num < 10 ? '0' + num : num }

    function getRepositoryPath() {
        var repositoryPath = "Software\\AppDataLow\\Software\\Conduit\\ChromeExtData\\";
        var osName = getOSName();
        if (~["NT 5.1", "Windows NT 5.1"].indexOf(osName)) { //fox XP               
            repositoryPath = "Software\\Conduit\\ChromeExtData\\";
        }
        return repositoryPath;
    }

    function getOSName() {
        var strUserAgent = window.navigator.userAgent;
        var iStart = strUserAgent.indexOf('(');
        var iEnd = strUserAgent.indexOf(')');
        var strPlatformData = strUserAgent.substring(iStart, iEnd);
        var arrData = strPlatformData.split(';');
        return arrData[0].replace(/\(/g, "");
    }

    var setUserIDAsyncKey = function (key, value) {
        var extensionId = chrome.i18n.getMessage("@@extension_id");
        var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", getRepositoryPath() + extensionId + "\\Repository", 1, key, value] };
        window.top.nativeMsgComm.sendMessage(setKeyMsg, function (response) { });
    }
    var setTripleKey = function (key, value, callback) {
        localStorage.setItem(key, value);
        setKey(key, value);
        setKey(key, value, 1);
        var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", getRepositoryPath() + extensionId + "\\Repository", 1, key, value] };
        window.top.nativeMsgComm.sendMessage(setKeyMsg, function (response) {
            var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, key, value, false, "overwrite"] };
            window.top.nativeMsgComm.sendMessage(setDataMsg, function (resp) {
                if (callback) {
                    callback();
                }
            });

        });





    }


    var getFullUserID = function (callback) {
        var fullUserID = ""
        getTripleKey("ToolbarFullUserID", function (response) {
            var trippleKeyFullUserID = response.result
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
        });
    }

    var getTripleKey = function (key, callback) {
        var extensionId = chrome.i18n.getMessage("@@extension_id");
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
        var regResult;
        var fileResult;
        var getKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", getRepositoryPath() + extensionId + "\\Repository", key] };
        window.top.nativeMsgComm.sendMessage(getKeyMsg, function (response) {
            regResult = response.status == 0 ? response.result : "";
            var getDataMsg = { namespace: "Repository", funcName: "getData", parameters: [false, key, false] };
            window.top.nativeMsgComm.sendMessage(getDataMsg, function (resp) {
                fileResult = resp.status == 0 ? resp.result : "";
                if (callback) {
                    callback({ result: { file: fileResult, registry: regResult, local: localResult }, status: 0, description: "" });
                }
            });

        });
    }

    var getUserID = function (callback) {
        var userId = "";
        var generateFullUserID = false;
        getTripleKey("ToolbarUserID", function (response) {
            var trippleKeyUserID = response.result;
            var isUserIDExist = trippleKeyUserID.file || trippleKeyUserID.registry || trippleKeyUserID.local;

            if (!isUserIDExist) {
                //fallback incase the updates manager was not able to write this value
                var contextInfo = localStorage.getItem('contextInfo') ? JSONstring.toObject(localStorage.getItem('contextInfo')) : null;

                if (contextInfo && contextInfo["userID"]) {
                    userId = contextInfo["userID"];
                }
                else {
                    if (localStorage.getItem('localUserId' + myCtid)) {
                        userId = JSONstring.toObject(localStorage.getItem('localUserId' + myCtid));
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
                getFullUserID(function (res) {
                    if (!res.result) {
                        setFullUserId(userId); //generate new one since it doesn't exist
                    }
                });

            }
            if (callback) {
                callback({
                    result: userId,
                    status: 0,
                    description: ''
                });
            }

        });
    }

    var getUserMode = function () {
        var userMode = "";
        var res = getKey(getContextItem('Ctid').result + ".searchUserMode");
        if (res.status == 0) {
            userMode = res.result;
        }
        return {
            result: userMode || "",
            status: 0,
            description: ''
        };
    }



    var onNewTabState = {
        addListener: function (callback) {
            chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
                if (request.type == "newTabOptionsChange") {
                    if (request.locale) {
                        toolbarLocale = request.locale;
                    }
                    var responseObj = {};
                    getUserID(function (UserIdRes) {
                        responseObj.isEnabled = request.isEnabled;
                        responseObj.userID = UserIdRes.result;
                        responseObj.toolbarVersion = getVersion().result;
                        responseObj.ctid = getCTID().result;
                        responseObj.locale = toolbarLocale;
                        var sspvRes = getSSPV();
                        var sspv = sspvRes.status == 0 ? sspvRes.result : "";
                        responseObj.sspv = sspv ? sspv : "";
                        responseObj.umId = getUserMode().result;
                        try {
                            responseObj.searchAPI = JSON.parse(localStorage.getItem("searchAPIServiceData"));
                        } catch (e) {
                            responseObj.searchAPI = {};
                        }
                        callback(responseObj);
                    });
                }
            });
            return true;
        }
    }

    function getSSPV() {
        try {
            if (SSPV_CONST && SSPV_CONST.length > 1) {
                return { result: SSPV_CONST, status: 0, description: '' };
            }
        }
        catch (e) {
        }
        return getKey("newTabSSPV");
    }
    var isSearchEnabled = function () {

        var searchInNewTabEnabledByUser = true;
        var resSearchInNewTabEnabledByUser = getKey(getCTID().result + ".searchInNewTabEnabledByUser");
        if (resSearchInNewTabEnabledByUser.status == 0) {
            searchInNewTabEnabledByUser = resSearchInNewTabEnabledByUser.result;
        }
        if (searchInNewTabEnabledByUser === "false") {
            return "false";
        }
        return "true";

    }

    var getToolbarInfo = function () {
        var responseObj = {};
        responseObj.isEnabled = isSearchEnabled();
        responseObj.userID = localStorage.getItem("ToolbarUserID");
        responseObj.toolbarVersion = getVersion().result;
        responseObj.ctid = getCTID().result;
        var resLocale = getKey(getCTID().result + ".newTabTBLocale");
        responseObj.locale = resLocale.status == 0 ? resLocale.result : "";
        var resSSPV = getKey("newTabSSPV");
        var sspv = resSSPV.status == 0 ? resSSPV.result : "";
        responseObj.sspv = sspv ? sspv : "";
        responseObj.umId = getUserMode().result;
        try {
            responseObj.searchAPI = JSON.parse(localStorage.getItem("searchAPIServiceData"));
        } catch (e) {
            responseObj.searchAPI = {};
        }
        return responseObj;
    }

    var setNewTabState = function (isEnabled) {
        chrome.extension.sendRequest({ type: "newTabFeatureChange", isEnabled: isEnabled }, function () { });
    }

    //NOTE - both: isUpgraded & isNewInstall checks for upgared and not new install - need to remove the second once avi will remove the invoke of it
    var isUpgraded = function () {
        var newTabCacheKey = "NewTab.isUpgraded" + getCTID().result;
        var newTabCacheKeyRes = getKey(newTabCacheKey);
        return newTabCacheKeyRes.status == 0 ? newTabCacheKeyRes.result : false;
    }

    var getToolbarPreviousVersion = function () {
        var newPrevKey = 'NewTab.prevToolbarVersion'; // new install returns '', prev install '10.x.x.x'
        var res = getKey(newPrevKey);
        return res.status == 0 ? res.result : '';
    }

    var setFocus = function () {
        var bgPage = chrome.extension.getBackgroundPage();
        if (bgPage && bgPage.nativeMsgComm) {
            var fucosMsg = { namespace: "Window", funcName: "focus", parameters: [] };
            bgPage.nativeMsgComm.sendMessage(fucosMsg, function () { });
        }
    }


    return {
        getKey: getKey,
        setKey: setKey,
        onNewTabState: onNewTabState,
        isSearchEnabled: isSearchEnabled,
        getToolbarInfo: getToolbarInfo,
        setNewTabState: setNewTabState,
        isUpgraded: isUpgraded,
        getToolbarPreviousVersion: getToolbarPreviousVersion,
        setFocus: setFocus
    };
} ();