var updatesManager = (function () {
    var asyncActions = [];
    var Context;
    var extensionId = chrome.i18n.getMessage("@@extension_id");
    var installationStatus = {};

    var fetchConfigFile = function () {
        var configFileObject = {};
        var ajaxResponse = $.ajax({
            url: '../initData.json',
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



    var getContextInfo = function () {
        //make the ajax call to initData.js.
        var configFileObject = fetchConfigFile();

        // prepare object for
        var obj = {
            toolbarName: configFileObject.toolbarName,
            Ctid: configFileObject.Ctid,
            version: configFileObject.version
        }
        return obj;
    };

    var generateUserID = function () {
        var UNIQUE_ID_LENGTH = 19;
        var strID = "UN" + Math.random().toString().substring(2);
        while (strID.length < UNIQUE_ID_LENGTH) {
            strID += Math.random().toString().substring(2);
        }
        return strID.substr(0, 19);
    };

    var checkLocalStorageAvailbility = function () {
        try {
            if (typeof (localStorage) !== "undefined") {
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    var getUserID = function (myCtid) {
        var userId = "";
        var generateFullUserID = false;

        try {
            if (checkLocalStorageAvailbility()) {
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
            } else {
                userId = generateUserID();
                generateFullUserID = true;
            }
        } catch (e) {
            userId = generateUserID();
            generateFullUserID = true;
        }

        return { userId: userId, generateFullUserID: generateFullUserID };
    };

    function setUserIDKeys(userIdKey, userID, extensionId, generateFullUserID) {
        setTripleKey(userIdKey, userID, extensionId, function () {
            setFullUserId(userID, extensionId, generateFullUserID);
        });
    }

    function pad(num) { return num < 10 ? '0' + num : num }

    function setFullUserId(userID, extensionId, generateFullUserID) {
        getFullUserID(extensionId, function (fullUserID) {
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
            setTripleKey('ToolbarFullUserID', fullUserID, extensionId, function () { });
        });
    }

    function getFullUserID(extensionId, callback) {
        var fullUserID = ""
        getTripleKey('ToolbarFullUserID', extensionId, function (response) {
            var trippleKeyFullUserID = response.result;
            var isFullUserIDExist = trippleKeyFullUserID.file || trippleKeyFullUserID.registry || trippleKeyFullUserID.local;
            if (isFullUserIDExist) {
                fullUserID = trippleKeyFullUserID.local ? trippleKeyFullUserID.local : trippleKeyFullUserID.registry ? trippleKeyFullUserID.registry : trippleKeyFullUserID.file;
            }

            callback(fullUserID);
        });
    }

    function setTripleKey(key, value, extensionId, callback) {
        if (checkLocalStorageAvailbility()) {
            localStorage.setItem(key, value);
        }
        var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", getRepositoryPath() + extensionId + "\\Repository", 1, key, value] };
        nativeMsgComm.sendMessage(setKeyMsg, function (response) {
            var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, key, value, false, "overwrite"] };
            nativeMsgComm.sendMessage(setDataMsg, function (resp) {
                if (callback) {
                    callback();
                }
            });

        });
    }


    function enc(str) {
        if (typeof str != 'string') {
            return "";
        }
        var e = "";
        for (var i = 0; i < str.length; i++) {
            e += String.fromCharCode(str.charCodeAt(i) + 134);
        }
        return escape(e);
    }

    function setInstallerKeys() {
        try {
            var repository = conduit.abstractionlayer.commons.repository;
            var INSTALLER_REGISTRY_KEY_NAME = "defaultKeys";

            repository.getExternalKey(INSTALLER_REGISTRY_KEY_NAME, function (response) {
                if (!response.status) {
                    var result = response.result;
                    var defaultKeys = result.replace(/{\s*'|'\s*}|'\s*:\s*'|\s*',\s*'/g, function (match) { return match.replace(/'/g, '"') });
                    var keyList = JSON.parse(defaultKeys);
                    for (var i = 0; i < keyList.length; i++) {
                        var isEncrypted = keyList[i].scope == "BC";
                        var isGlobal = keyList[i].scope == "SB";
                        var keyValue = keyList[i].value || "";
                        var keyName = (isGlobal ? "smartbar" : Context.Ctid) + ("." + keyList[i].key);

                        if (isGlobal || isEncrypted) {
                            if (isEncrypted) {
                                localStorage.setItem(keyName, enc(keyValue));
                            } else {
                                repository.setKey(keyName, keyValue);
                            }

                        } else {
                            if (isEncrypted) {
                                localStorage.setItem(keyName, enc(keyValue));
                            } else {
                                repository.setKey(keyName, keyValue);
                            }
                        }
                    }
                }
                repository.removeExternalKey(INSTALLER_REGISTRY_KEY_NAME);
            });
        } catch (e) { }
    }

    var pricegongDataMigration = function () {
        var ctid = Context.Ctid;
        var def = $.Deferred();
        asyncActions.push(def);

        function buildDataBridge(storage) {
            storage = storage || {};


            function get(name) {
                return storage[name];
            }

            function set(name, value) {
                var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, ctid + "." + name, escape(value), false, "overwrite"] };
                nativeMsgComm.sendMessage(setDataMsg, function (response) { });
            }

            function isChrome() {
                return true;
            }

            return {
                isChrome: isChrome,
                getOldbarValue: get,
                setSmartbarValue: set
            };
        }

        var waitForScript = (function getUpgradeScript() {
            var scriptDef = $.Deferred();
            var timer = setTimeout(function () {
                scriptDef.reject();
            }, 5000);

            var script = document.createElement("script");
            script.src = "pricegongMigration.js";
            script.onload = function () {
                clearTimeout(timer);
                scriptDef.resolve();
            }

            document.body.appendChild(script);
            return scriptDef.promise();
        } ());

        function hasData(data) {
            if (!data) {
                def.resolve();
                return;
            }

            waitForScript.done(function () {
                try {
                    pg_upgrade(buildDataBridge(data));
                } catch (err) {
                    console.error('pg_upgrade failed', err);
                }
                def.resolve();
            }).fail(function () {
                def.resolve();
            });
        }

        var calledOnce;
        chrome.storage.onChanged.addListener(function onChanged(changes, areaName) {
            if (!calledOnce && changes && changes["pricegong-migration"]) {
                calledOnce = true;
                try {
                    hasData(changes["pricegong-migration"].newValue);
                } catch (e) {
                    def.resolve();
                }
                chrome.storage.onChanged.removeListener(onChanged);
                chrome.storage.local.remove(["pricegong-migration"]);
            }
        });
        setTimeout(function () {
            if (!calledOnce) {
                calledOnce = true;
                def.resolve();
            }
        }, 10000);

        (function loadPGiframe() {
            var iframe = document.createElement("iframe");
            iframe.src = "http://pricegong.conduitapps.com#conduitupgradedatamigration";
            document.body.appendChild(iframe);
        } ());
    }

    function writeShowToolbarFile(ctid, showState, globalProfileName, extensionId, callback) {
        var writeTBStatusFileMsg = { namespace: "State", funcName: "writeToolbarStatusFile", parameters: [globalProfileName, '{"toolbarShow":' + showState + ',"ctid":"' + ctid + '"}'] };

        window.top.nativeMsgComm.sendMessage(writeTBStatusFileMsg, function (response) {
            if (response && response.status != 0) {
                if (callback) {
                    callback(response);
                }
                return;
            }
            localStorage.setItem("toolbarShow", escape(showState));
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
                if (callback) {
                    callback(response);
                }
            });
        });
    }
    function saveAppOptions(ctid) {
        var ctid = Context.Ctid;
        var appOpts = {};
        var oldOptsStr = localStorage['predefined_components_toggle' + ctid];
        var oldOpts;
        try {
            oldOpts = JSON.parse(oldOptsStr || '{}');
        } catch (e) {
            console.error('failed parsing old app state options', e);
            return;
        }

        var curr, anythingAdded;
        for (curr in oldOpts) {
            if (oldOpts.hasOwnProperty(curr)) {
                var oldValue = oldOpts[curr];
                appOpts[curr] = {
                    "render": true,
                    "disabled": !oldValue
                };

                anythingAdded = true;
            }
        }

        if (anythingAdded) {
            var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, ctid + ".appOptions", escape(JSON.stringify(appOpts)), false, "overwrite"] };
            nativeMsgComm.sendMessage(setDataMsg, function (response) { });
        }
    }

    function oldbarNewTabMigration() {
        var ctid = Context.Ctid;
        var oldSearchInNewTabEnabled = localStorage.getItem("User.searchInNewTabEnabled");
        if (/false/i.test(oldSearchInNewTabEnabled)) {
            localStorage.setItem(ctid + ".searchInNewTabEnabledByUser", "false");
        }
    }
    function getInstallationStatus() {
        return installationStatus;
    }

    function getOSName() {
        var strUserAgent = window.navigator.userAgent;
        var iStart = strUserAgent.indexOf('(');
        var iEnd = strUserAgent.indexOf(')');
        var strPlatformData = strUserAgent.substring(iStart, iEnd);
        var arrData = strPlatformData.split(';');
        return arrData[0].replace(/\(/g, "");
    }

    function getRepositoryPath() {
        var repositoryPath = "Software\\AppDataLow\\Software\\Conduit\\ChromeExtData\\";
        var osName = getOSName();
        if (~["NT 5.1", "Windows NT 5.1"].indexOf(osName)) { //fox XP               
            repositoryPath = "Software\\Conduit\\ChromeExtData\\";
        }
        return repositoryPath;
    }

    this.init = function () {
        Context = getContextInfo();

        //get the last toolbar version key
        var cacheKey = Context.Ctid + ".lastToolbarVersion";
        var versionFromInstaller = Context.Ctid + ".versionFromInstaller";
        var fromInstaller = false;
        var oldCacheKey = "lastToolbarVersion" + Context.Ctid; // webtoolbar
        var extensionId = chrome.i18n.getMessage("@@extension_id");
        var newTabCacheKey = "NewTab.isUpgraded" + Context.Ctid;
        var newPrevKey = 'NewTab.prevToolbarVersion'; // new install returns '', prev install '10.x.x.x'
        var userIdKey = 'ToolbarUserID';
        var isFromOldbar; // will be set to true if we're updating/upgrading from oldbar (2.x.x.x)       
        var lastToolbarVersion;
        try {
            var lastToolbarVersionObj = localStorage.getItem(cacheKey);
            lastToolbarVersionObj = lastToolbarVersionObj;

            if (lastToolbarVersionObj) {
                lastToolbarVersion = unescape(lastToolbarVersionObj);
            }
        } catch (e) { }
        try {
            var versionFromInstallerResObj = localStorage.getItem(versionFromInstaller);
            if (versionFromInstallerResObj) {
                fromInstaller = (unescape(versionFromInstallerResObj) == Context.version);
            }
        } catch (e) { }


        if (!lastToolbarVersion && checkLocalStorageAvailbility()) {
            lastToolbarVersion = localStorage.getItem(cacheKey) || localStorage.getItem(oldCacheKey);
        }

        if (lastToolbarVersion) {
            lastToolbarVersion = lastToolbarVersion.replace(/"/g, '');
        }
        installationStatus = { autoUpdate: !fromInstaller && Context.version != lastToolbarVersion,
            upgrade: fromInstaller && (lastToolbarVersion ? Context.version != lastToolbarVersion : false),
            firstInstall: !lastToolbarVersion,
            installer: fromInstaller,
            lastVersion: lastToolbarVersion
        };
        // if this is the first time toolbar is running
        if (!lastToolbarVersion) {
            // Setting the lastToolbarVersion key right now to avoid running cleanup again until un-install occurs.
            localStorage.setItem(cacheKey, escape(Context.version));
            /*write also async to registry for uninstaller*/
            var extensionId = chrome.i18n.getMessage("@@extension_id");
            var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", getRepositoryPath() + extensionId + "\\Repository", 1, cacheKey, Context.version] };
            window.top.nativeMsgComm.sendMessage(setKeyMsg, function (response) { });
            if (checkLocalStorageAvailbility()) {
                localStorage.setItem(newTabCacheKey, "false");
                localStorage.setItem(newPrevKey, '');
            }
        }
        //if toolbar version has been updated
        else if (Context.version != lastToolbarVersion) {
            if (installationStatus.autoUpdate) {
                localStorage.setItem(Context.Ctid + '.RestartDialogFirstTime', 'false');
                localStorage.setItem(Context.Ctid + '.RestartDialogShouldDisplay', 'false');
            }
            if (compareVersions(lastToolbarVersion, "10.0") < 0) { //lastToolbarVersion < "10.0" ==> OB version
                isFromOldbar = true;

                //remove this key only if toolbar was installed by CRX (in this case the installType key doesn't exist               
                if (localStorage.getItem(Context.Ctid + ".installType")) {
                    localStorage.removeItem(userIdKey);
                }

                // All keys data migration require localStorage
                if (checkLocalStorageAvailbility()) {
                    // save apps state options (predefined components show/hide)
                    saveAppOptions();

                    // perform special data migration for pricegong (from BCAPI based to WEBAPPAPI based)
                    pricegongDataMigration();

                    // migrate the user decision regarding the new tab feature. in old bar, user could only restore the setting from the new tab page "Restore" action.
                    oldbarNewTabMigration();
                }
            }
            localStorage.removeItem('contextInfo'); // remove old initData.json data
            localStorage.setItem(newTabCacheKey, "true");
            localStorage.setItem(newPrevKey, lastToolbarVersion);

            //if has been upgraded - copy old data to new 

            //migrate keys
            var map = {
                toolbarBornServerTimeCTID: {
                    type: 'Key',
                    name: 'CTID.toolbarBornServerTime'
                },
                searchHistoryCTID: {
                    type: 'Data',
                    name: 'CTID.search-import-history'
                },
                FirstLoginWasMadeCTID: {
                    type: 'Data',
                    name: 'CTID.serviceLayer_service_login_isFirstLoginInvoked'
                },
                'CommunityToolbar.keywordURLSelectedCTID': {
                    type: 'GlobalKey',
                    name: 'Smartbar.keywordURLSelectedCTID'
                },
                'CommunityToolbar.SearchFromAddressBarSavedUrl': {
                    type: 'GlobalKey',
                    name: 'Smartbar.SearchFromAddressBarSavedUrl'
                },
                is_searchbox_history: {
                    additional: true,
                    type: 'Key',
                    name: 'CTID.ENABALE_HISTORY',
                    jsonDataType: 'string'
                },
                is_searchbox_autofill: {
                    additional: true,
                    type: 'Key',
                    name: 'CTID.selectToSearchBoxEnabled',
                    jsonDataType: 'string',
                    userChangeName: 'CTID.selectToSearchBoxEnabledByUser',
                    userChangeValue: 'false'
                },
                is_usage: {
                    additional: true,
                    type: 'Key',
                    name: "CTID.sendUsageEnabled"
                }
            }
            if (checkLocalStorageAvailbility()) {
                try {
                    var additionalSettings = $.parseJSON(localStorage['additional_settings' + Context.Ctid] || '{}');
                } catch (e) {
                }
            }
            try {
                if (!isFromOldbar) {
                    //migrate appOptions from repository to local storage  
                    var currAppOptions = localStorage.getItem(Context.Ctid + ".appOptions");
                    if (!currAppOptions) {
                        var getDataMsg = { namespace: "Repository", funcName: "getData", parameters: [false, Context.Ctid + ".appOptions", false] };
                        nativeMsgComm.sendMessage(getDataMsg, function (response) {
                            localStorage.setItem(Context.Ctid + ".appOptions", unescape(response.result));
                            var removeDataMsg = { namespace: "Repository", funcName: "removeData", parameters: [false, Context.Ctid + ".appOptions"] };
                            nativeMsgComm.sendMessage(removeDataMsg, function () { });
                        });
                    }
                    if (fromInstaller) {  //We are on upgrade and not autoUpdate  
                        var storageKeyName = extensionId + "startAsHidden";
                        chrome.storage.local.remove(storageKeyName);
                        localStorage.removeItem("LoadFirstTime");
                    } else { // auto Update
                        var getToolbarState = unescape(localStorage.getItem("toolbarShow"));
                        var toolbarShow = true;
                        if (getToolbarState == false || getToolbarState == "false") {
                            toolbarShow = false;
                        }
                        writeShowToolbarFile(Context.Ctid, toolbarShow, globalProfileName, extensionId);
                    }
                }
            } catch (e) {
            }
            if (isFromOldbar) {
                $.each(map, function (idx, item) {
                    if (!item || !item.name || !item.type) { return; }
                    var key = idx.toString().replace('CTID', Context.Ctid);
                    var setter = 'set' + item.type;
                    var additionalValue = additionalSettings[key];
                    var value = (item.additional && typeof (additionalValue) !== 'undefined') ? additionalValue : localStorage[key];
                    var dataObj = {};
                    if (typeof (value) !== 'undefined') {
                        if (item.jsonDataType) {
                            if (item.jsonDataType === 'string') {
                                value = String(value);
                            }
                            dataObj = { dataType: item.jsonDataType, data: value };
                            value = JSON.stringify(dataObj);
                        }
                        if (item.userChangeName && dataObj && dataObj.data == item.userChangeValue) {
                            // for example, for 'is_searchbox_autofill' we need to check if the user disabled the feature.
                            // if so, we will mark it as user change to the appropriate key.
                            var keyName = item.userChangeName.replace('CTID', Context.Ctid);
                            if (setter == "setKey") {
                                localStorage.setItem(keyName, escape(value));
                            }
                            else {
                                var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, keyName, escape(value), false, "overwrite"] };
                                nativeMsgComm.sendMessage(setDataMsg, function (response) { });
                            }
                        }
                        var keyName = item.name.replace('CTID', Context.Ctid);
                        if (setter == "setKey") {
                            localStorage.setItem(keyName, escape(value));
                        }
                        else {
                            var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, keyName, escape(value), false, "overwrite"] };
                            nativeMsgComm.sendMessage(setDataMsg, function (response) { });
                        }
                    }
                });
            }

            // notifications disable
            if (isFromOldbar && checkLocalStorageAvailbility()) {
                try {
                    if (JSON.parse(localStorage.getItem('alertsDb') || '{}').isAlertsEnabled === false) {
                        localStorage.setItem(Context.Ctid + '.enableAlerts', 'false');
                    }
                    /*check if old bar is hidden if so hide also SB*/
                    var getToolbarState = unescape(localStorage.getItem("toolbarShow"));
                    var toolbarShow = true;

                    if (!getToolbarState || getToolbarState == "false") {
                        toolbarShow = false;
                    }

                    if (localStorage.getItem("Show" + Context.Ctid) == '"false"' || !toolbarShow) {
                        var ctid = Context.Ctid;
                        localStorage.setItem("toolbarShow", "false");
                        writeShowToolbarFile(ctid, false, globalProfileName, extensionId);

                    }

                } catch (e) {
                }
            }

            // don't show first time dialog
            localStorage.setItem(Context.Ctid + '.firstTimeDialogOpened', 'true');
            localStorage.setItem(Context.Ctid + '.shouldFirstTimeDialog', 'true');

            var getExtensionIdPathMsg = { namespace: "Environment", funcName: "getExtensionIdPath", parameters: [globalProfileName] };
            nativeMsgComm.sendMessage(getExtensionIdPathMsg, function (objFullExtensionPath) {
                var getInstalledVersionsMsg = { namespace: "Environment", funcName: "getInstalledVersions", parameters: [globalProfileName] };
                nativeMsgComm.sendMessage(getInstalledVersionsMsg, function (objInstalledVerions) {

                    if (objFullExtensionPath && objFullExtensionPath.result && objInstalledVerions && objInstalledVerions.result) {
                        var arrAllVersions = objInstalledVerions.result;
                        for (var i in arrAllVersions) {
                            arrAllVersions[i] = arrAllVersions[i].replace("_", ".");
                        }
                        arrAllVersions.sort(compareVersions);

                        var lowestVersion = (lastToolbarVersion && arrAllVersions.indexOf(lastToolbarVersion) > -1) ? lastToolbarVersion : arrAllVersions[0];
                        var highestVersion = arrAllVersions[arrAllVersions.length - 1];
                        //returns founded versions to real 
                        for (var i = lowestVersion.length - 1; i > 0; i--) {
                            if (lowestVersion[i] == ".") {
                                lowestVersion = lowestVersion.substr(0, i) + "_" + lowestVersion.substr(i + 1, lowestVersion.length - 1);
                                break;
                            }
                        }
                        for (var j = highestVersion.length - 1; j > 0; j--) {
                            if (highestVersion[j] == ".") {
                                highestVersion = highestVersion.substr(0, j) + "_" + highestVersion.substr(j + 1, highestVersion.length - 1);
                                break;
                            }
                        }

                        var Consts = {
                            toolbarImages: "toolbarImages",
                            webApps: "webApps"
                        };
                        var copyDirMsg = { namespace: "Files", funcName: "copyDirectory", parameters: [objFullExtensionPath.result + "\\" + lowestVersion + "\\" + Consts.toolbarImages, objFullExtensionPath.result + "\\" + highestVersion + "\\" + Consts.toolbarImages, false, true] };
                        window.top.nativeMsgComm.sendMessage(copyDirMsg, function (response) {

                        });
                    }
                });
            });


            // Refreshing all tabs
            chrome.windows.getAll(null, function (windowsArr) {
                for (windowObj in windowsArr) {
                    chrome.tabs.getAllInWindow(windowsArr[windowObj].id, function (tabs) {
                        for (tab in tabs) {
                            if (!tabs[tab].id) {
                                continue;
                            }
                            chrome.tabs.reload(tabs[tab].id);
                        }
                    });
                }
            });

            var compareSB = compareVersions(lastToolbarVersion, "10.13");
            var compareOB = compareVersions(lastToolbarVersion, "10.0");
            if (compareSB < 0 && compareOB >= 0) { //lastToolbarVersion < "10.13" && lastToolbarVersion => "10.0"
                localStorage.setItem(Context.Ctid + '.upgradeFromClearSBVersion', 'true'); // mark that upgrade was done from SB version that support only non encrypted keys
            }
        }
        else {
            localStorage.setItem(newTabCacheKey, "false");
        }



        getTripleKey(userIdKey, extensionId, function (response) {
            var trippleKeyUserID = response.result;
            var isUserIDExist = trippleKeyUserID.file || trippleKeyUserID.registry || trippleKeyUserID.local;
            if (!isUserIDExist) {
                //{ userId: userId, generateFullUserID: generateFullUserID }
                var userIdResult = getUserID(Context.Ctid);
                setUserIDKeys(userIdKey, userIdResult.userId, extensionId, userIdResult.generateFullUserID);
            }
            else {
                var userId = trippleKeyUserID.local ? trippleKeyUserID.local : trippleKeyUserID.registry ? trippleKeyUserID.registry : trippleKeyUserID.file;
                getFullUserID(extensionId, function (response) {
                    if (!response) {
                        setFullUserId(userId, extensionId); //generate new one since it doesn't exist
                    }
                });

            }
        });
        // Setting the new toolbar version as the lastToolbarVersion. the registry key might've already been set in case of fresh install
        // but that doesn't affect this flow
        if (checkLocalStorageAvailbility()) {
            try {
                localStorage.setItem(cacheKey, Context.version);
                /*Set the key also async for uninstaller*/
                var extensionId = chrome.i18n.getMessage("@@extension_id");
                var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", getRepositoryPath() + extensionId + "\\Repository", 1, cacheKey, Context.version] };
                window.top.nativeMsgComm.sendMessage(setKeyMsg, function (response) { });
            } catch (e) {
            }
        }
    };

    try {
        this.init();
    } catch (e) {
        console.error('updatesManager init error', e);
    }
    window.postMessage({ type: 'updatesManagerLoaded' }, "*");

    var managerDefObj = $.when.apply($, asyncActions);
    managerDefObj.setInstallerKeys = setInstallerKeys;
    managerDefObj.getInstallationStatus = getInstallationStatus;
    return managerDefObj;
})();

