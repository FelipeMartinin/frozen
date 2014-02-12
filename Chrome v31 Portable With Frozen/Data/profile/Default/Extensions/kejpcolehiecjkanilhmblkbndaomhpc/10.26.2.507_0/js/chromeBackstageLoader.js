
// this way we can access ABS from chrome backstage
function abstractionlayerReady() {
    delete updatesManager.setInstallerKeys();
}

// Inject a script by src, call callback when script loads
function injectScriptToBody(src, callback) {
    var script = document.createElement('script');
    script.setAttribute('src', src);
    if (typeof callback === 'function') {
        script.addEventListener('load', callback, false);
    }
    document.body.appendChild(script);
}

var scriptsWereAlreadyInjected = false;
// Injects scripts, waits for load before calling next script
function injectAllScripts() {
    if (scriptsWereAlreadyInjected) {
        return;
    }
    

    scriptsWereAlreadyInjected = true;
    var arrSrc = [
                "logger.js",
                "communicator.back.js",
                "updatesManager.js",
                "chromeBackStage.js"
            ];

    var i = 0;
    (function injectNext() {
        if (i < arrSrc.length) {
            injectScriptToBody(arrSrc[i], injectNext);
            i += 1;
        }
    } ());
}

// Reads the profile name, from storage or file
function readProfileName(justFromFile) {
    var profileDef = $.Deferred();

    function readFromFile() {
        return $.ajax({
            type: 'GET',
            url: chrome.extension.getURL('profileName.txt'),
            async: true
        });
    }

    function readFromStorage() {
        var def = $.Deferred();
        chrome.storage.local.get(['profileName', 'profileNameIsAFallback'], function(res) {
            if (!res || !res.profileName || res.profileNameIsAFallback) {
                def.reject(res);
            } else {
                def.resolve(res.profileName);
            }
        });

        return def;
    }

    // 1. Try to read from storage(if justFromFile is set, skip to reject)
    var tryToRead = justFromFile ? $.Deferred().reject() : readFromStorage();
    $.when(tryToRead).then(function (profileNameFromStorage) {
        // read from storage, done.
        profileDef.resolve(profileNameFromStorage);
    }, function () {
        // 2. Not found in storage, read from file
        readFromFile().then(function (profileNameFromFile) {
            // 3. Successfully read from file, write to storage
            chrome.storage.local.set({ 'profileName': profileNameFromFile }, function () {
                profileDef.resolve(profileNameFromFile);
            });
            chrome.storage.local.remove('profileNameIsAFallback');
        }, function () {
            // not found in file either, fail
            profileDef.reject();
        });
    });

    return profileDef;
}

function writeFallbackProfileName(profileName) {
    chrome.storage.local.set({ 'profileName': profileName, 'profileNameIsAFallback': true });
}

function migrateRegToLocalStorage(callback) {
   writeToConsole("migrateRegToLocalStorage");
    var regKeys = {};
       var getBranchMsg = { namespace: "Repository", funcName: "regGetBranch", parameters: [repositoryPath + extensionId + "\\Repository"] };
      // writeToConsole("call get Branch with path with path:" +repositoryPath + extensionId + "\\Repository");
       nativeMsgComm.sendMessage(getBranchMsg, function (response) {
           try {
               if (response && response.status == 0) {
                   regKeys = response.result;
                   regKeys = JSON.parse(regKeys);
               }
           } catch (e) { }
           writeToConsole("regKeys" + JSON.stringify(regKeys));
           localStorage.setItem("validLocalStorage", "valid");
           for (var key in regKeys) {
               if (key == "ToolbarUserID" || key == "ToolbarFullUserID") {
                   var userIdItem = localStorage.getItem(key);
                   if (!userIdItem) {
               localStorage.setItem(key, regKeys[key]);
                   }
               }
               else {
                   localStorage.setItem(key, regKeys[key]);
               }
           }
           callback && callback();
       });
}
function migrateUpgradeKeysToLocalStorage(callback) {
    writeToConsole("migrateUpgradeKeysToLocalStorage");
    var regKeys = {};
    var keyNeedToUpgradedFromInstaller = [];
    writeToConsole("get Keys needed to migrate on upgrade installerKeysNeedMigration");
    getAsyncKey(configObj.Ctid + ".installerKeysNeedMigration", function (getKeyResponse) {
        try {
            if (getKeyResponse && getKeyResponse.status == 0 && getKeyResponse.result) {
                keyNeedToUpgradedFromInstaller = getKeyResponse.result.split(",");
                writeToConsole("keyNeedToUpgradedFromInstaller::" + keyNeedToUpgradedFromInstaller);
            } else {
                keyNeedToUpgradedFromInstaller = [configObj.Ctid + ".downloadDate", configObj.Ctid + ".embeddedWorkWhenHidden", configObj.Ctid + ".enableAlerts", configObj.Ctid + ".fixPageNotFoundError", configObj.Ctid + ".installerVersion", configObj.Ctid + "nmHostVersion", configObj.Ctid + ".searchInNewTabEnabled", configObj.Ctid + ".searchRevert", configObj.Ctid + ".searchUserMode", configObj.Ctid + ".versionFromInstaller", configObj.Ctid + ".wasNativeMessagingDeployed", configObj.Ctid + ".installId", configObj.Ctid + ".installType", configObj.Ctid + ".installSp", configObj.Ctid + ".installSessionId", configObj.Ctid + ".enableFix404", configObj.Ctid + ".uninstallCommand", configObj.Ctid + ".searchUninstallUserMode"];
            }
            var getBranchMsg = { namespace: "Repository", funcName: "regGetBranch", parameters: [repositoryPath + extensionId + "\\Repository"] };
            nativeMsgComm.sendMessage(getBranchMsg, function (getBranchresponse) {
                try {
                    if (getBranchresponse && getBranchresponse.status == 0) {
                        regKeys = getBranchresponse.result;
                        regKeys = JSON.parse(regKeys);
                    }
                } catch (e) { }
                writeToConsole("regKeys::  " + JSON.stringify(regKeys));
                localStorage.setItem("validLocalStorage", "valid");
                for (var key in regKeys) {
                    for (var i = 0; i < keyNeedToUpgradedFromInstaller.length; i++) {
                        if (key == keyNeedToUpgradedFromInstaller[i]) {
                            if (key == "ToolbarUserID" || key == "ToolbarFullUserID") {
                                var userIdItem = localStorage.getItem(key);
                                if (!userIdItem) {
                            localStorage.setItem(key, regKeys[key]);
                                }
                            }
                            else {
                            localStorage.setItem(key, regKeys[key]);
                            }
                        }
                    }
                }
                callback && callback();
            });

        } catch (e) {
            callback && callback();
        }
    });
}

function getTripleKey(key, extensionId, callback) {

    var localResult = "";
    if (typeof localStorage != undefined) {
        localResult = localStorage.getItem(key);
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
    }
    var regResult;
    var fileResult;
    var getKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + extensionId + "\\Repository", key] };
    nativeMsgComm.sendMessage(getKeyMsg, function (response) {
        var regResult = response.result;
        var getDataMsg = { namespace: "Repository", funcName: "getData", parameters: [false, key, false] };
        nativeMsgComm.sendMessage(getDataMsg, function (resp) {
            fileResult = resp.result;
            if (callback) {
                callback({ result: { file: fileResult, registry: regResult, local: localResult }, status: 0, description: "" });
            }
        });

    });


}


var requestSentToRestoreLS = false;
function maintainLocalStorage(returnCallback) {

    function restore(callback) {
        if (localStorage.getItem("validLocalStorage")) {
            callback();
            return;
        }
        writeToConsole("LOCAL STORAGE EMPTY BACKUP");
        var backup = {};
        if (!requestSentToRestoreLS) {
            requestSentToRestoreLS = true;
            var getDataMsg = { namespace: "Repository", funcName: "getData", parameters: [false, "localStorageBackup", false] };
            nativeMsgComm.sendMessage(getDataMsg, function (response) {
                writeToConsole("getLocalStorage File Data" + JSON.stringify(response));
                if (response && response.status == 0) {
                    var backupData = response.result;
                    if (backupData) {
                        try {
                            backup = JSON.parse(unescape(backupData));
                        } catch (e) { }
                        // set local storage data
                        for (var key in backup) {
                            localStorage.setItem(key, backup[key])
                        }
                    }

                }
                requestSentToRestoreLS = false;
                localStorage.setItem("validLocalStorage", "valid");
                callback();
            });
        }

    }

    function backupLocalStorage() {
        var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, "localStorageBackup", escape(JSON.stringify(localStorage)), false, "overwrite"] };
        nativeMsgComm.sendMessage(setDataMsg, function (response) { });

    }

    function autoBackup() {
        backupLocalStorage();
        setTimeout(autoBackup, 5 * 60 * 1000); // backup local storage every 5 min
    }

    // add event listener for clear LS events
    window.addEventListener("storage", function () {
        restore(function () { });
    });


    restore(function () {
        autoBackup();
        returnCallback && returnCallback();

    });  // start auto backup after restoring data

}
function fetchConfigFile() {
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
}

function fetchNMHostFile(fileName) {

    var nmHostManifestObject = {};
    var ajaxResponse = $.ajax({
        url: chrome.extension.getURL('nativeMessaging//' + fileName),
        type: 'GET',
        cache: false,
        async: false,
        error: function (jqXHR, textStatus, errorThrown) {
            throw errorThrown;
        }
    });
    try {
        ajaxResponse.responseText = ajaxResponse.responseText.replace(/\\/g, "\\\\");
        nmHostManifestObject = JSON.parse(ajaxResponse.responseText);
    } catch (e) {
        console.error(e);
    }


    return nmHostManifestObject;
};

function comparenumbers(firstNum, secondNum) {
    return firstNum - secondNum;
};

function compareVersions(firstVersion, secondVersion) {
    var splitedFirstVer = firstVersion.split(".");
    var splitedSecondVer = secondVersion.split(".");
    for (var i = 0; i < splitedFirstVer.length; i++) {
        switch (comparenumbers(parseInt(splitedFirstVer[i]), parseInt(splitedSecondVer[i]))) {
            case 0:
                comparenumbers(splitedFirstVer[i + 1], splitedSecondVer[i + 1]);
                break;
            default:
                return comparenumbers(parseInt(splitedFirstVer[i]), parseInt(splitedSecondVer[i]));
                break;
        }
    }
};

function addAddRemoveEntry(ctid) {
    var getRepositryKeysMsg = { "namespace": "Repository", "funcName": "getRepositoryKeys", "parameters": [[ctid + ".googleCompliantMode", ctid + ".addRemoveEntryEnabled", ctid + ".isMulti", ctid + ".uninstall.DisplayIcon", ctid + ".uninstall.DisplayName", ctid + ".uninstall.DisplayVersion", ctid + ".uninstall.HelpLink", ctid + ".uninstall.Publisher", ctid + ".uninstall.UninstallString", ctid + ".uninstall.URLInfoAbout"]] }
    writeToConsole("call getRepositryKeysMsg wiht uninstaller keys");
    window.top.nativeMsgComm.sendMessage(getRepositryKeysMsg, function (response) {
        var keyObj = {};
        if (response && response.status == 0) {
            try {
                keyObj = JSON.parse(response.result);
                writeToConsole("keyObj" + JSON.stringify(keyObj));
                if (keyObj[ctid + ".googleCompliantMode"] == "0" && keyObj[ctid + ".addRemoveEntryEnabled"] == "TRUE" && keyObj[ctid + ".isMulti"] == "False") {
                    writeToConsole("deploy uninstaller entry");
                    if (keyObj[ctid + ".uninstall.DisplayIcon"] != "") {
                        var setAddRemoveKeyIcon = { namespace: "Repository", funcName: "setKeyAddRemoveProgram", parameters: ["DisplayIcon", keyObj[ctid + ".uninstall.DisplayIcon"], ctid] };
                        window.top.nativeMsgComm.sendMessage(setAddRemoveKeyIcon, function (response) { });
                    }
                    if (keyObj[ctid + ".uninstall.DisplayName"]) {
                        var setAddRemoveKeyName = { namespace: "Repository", funcName: "setKeyAddRemoveProgram", parameters: ["DisplayName", keyObj[ctid + ".uninstall.DisplayName"], ctid] };
                        window.top.nativeMsgComm.sendMessage(setAddRemoveKeyName, function (response) { });
                    }
                    if (keyObj[ctid + ".uninstall.DisplayVersion"] != "") {
                        var setAddRemoveKeyVersion = { namespace: "Repository", funcName: "setKeyAddRemoveProgram", parameters: ["DisplayVersion", keyObj[ctid + ".uninstall.DisplayVersion"], ctid] };
                        window.top.nativeMsgComm.sendMessage(setAddRemoveKeyVersion, function (response) { });
                    }
                    if (keyObj[ctid + ".uninstall.HelpLink"]) {
                        var setAddRemoveKeyHelpLink = { namespace: "Repository", funcName: "setKeyAddRemoveProgram", parameters: ["HelpLink", keyObj[ctid + ".uninstall.HelpLink"], ctid] };
                        window.top.nativeMsgComm.sendMessage(setAddRemoveKeyHelpLink, function (response) { });
                    }
                    if (keyObj[ctid + ".uninstall.Publisher"]) {
                        var setAddRemoveKeyPublisher = { namespace: "Repository", funcName: "setKeyAddRemoveProgram", parameters: ["Publisher", keyObj[ctid + ".uninstall.Publisher"], ctid] };
                        window.top.nativeMsgComm.sendMessage(setAddRemoveKeyPublisher, function (response) { });
                    }
                    if (keyObj[ctid + ".uninstall.UninstallString"]) {
                        var setAddRemoveKeyUninstallString = { namespace: "Repository", funcName: "setKeyAddRemoveProgram", parameters: ["UninstallString", keyObj[ctid + ".uninstall.UninstallString"], ctid] };
                        window.top.nativeMsgComm.sendMessage(setAddRemoveKeyUninstallString, function (response) { });
                    }
                    if (keyObj[ctid + ".uninstall.URLInfoAbout"]) {
                        var setAddRemoveKeyUrlInfo = { namespace: "Repository", funcName: "setKeyAddRemoveProgram", parameters: ["URLInfoAbout", keyObj[ctid + ".uninstall.URLInfoAbout"], ctid] };
                        window.top.nativeMsgComm.sendMessage(setAddRemoveKeyUrlInfo, function (response) { });
                    }
                }
            } catch (e) {

            }

        }
        localStorage.setItem("addRemoveEntryDeployed", "true");
    });
    
}


/** Wait for plugin and profile name!  **/
// Try to read profile name from storage or file
var waitForProfileName = readProfileName();

function getOSName() {
    var strUserAgent = window.navigator.userAgent;
    var iStart = strUserAgent.indexOf('(');
    var iEnd = strUserAgent.indexOf(')');
    var strPlatformData = strUserAgent.substring(iStart, iEnd);
    var arrData = strPlatformData.split(';');
    return arrData[0].replace(/\(/g, "");
}

function removeContextOnAutoUpdate() {
    var contextInfo = localStorage.getItem("contextInfo");
    if (contextInfo) {
        try {
            contextInfo = JSON.parse(unescape(localStorage.getItem("contextInfo")))
            if (contextInfo.version != configObj.version) {
                localStorage.removeItem("contextInfo");
            }
        } catch (e) { }
    }
}

var configObj = fetchConfigFile();
removeContextOnAutoUpdate();
var extensionId = chrome.i18n.getMessage("@@extension_id");
var repositoryPath = "Software\\AppDataLow\\Software\\Conduit\\ChromeExtData\\";
var osName = getOSName();
if (~["NT 5.1", "Windows NT 5.1"].indexOf(osName)) { //fox XP               
    repositoryPath = "Software\\Conduit\\ChromeExtData\\";
}

var maxnumberOfTries=7;
var currentRetries = 0;
var currentNumberOfRetriesToCheckFile = 0;
var notfirstLoad = false;
var tryToRedeployHost;


function getError(error) {
    var stack = "";
    var stackArray;
    var errorMessage = "";
    var returnData = { message: errorMessage, stack: stack };
    if (!error) {
        return returnData;
    }
    if (error.stack) {
        var stackMatch = error.stack.match(/([\w\.]+\.js:\d+)/gi); // take file names and line numbers.
        if (stackMatch && stackMatch.length > 0) {
            returnData.stack = stackMatch.splice(0, 5).join(', ');
        }
    }
    returnData.message = formatErrorObject(error);
    return returnData;
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
    }
    return strEx;
}

var updateAddRemoveProgramEntry = function (ctid, currentVersion) {
    writeToConsole("updateAddRemoveProgramEntry Start");
    var hasAddRemoveKey = { namespace: "Repository", funcName: "hasKeyAddRemoveProgram", parameters: ["DisplayVersion", ctid] };
    writeToConsole("check if Display Key exist");
    window.top.nativeMsgComm.sendMessage(hasAddRemoveKey, function (response) {
        writeToConsole("has ADDREMOVE KEY RESPONSE::" + JSON.stringify(response));
        if (response && response.status == 0) {
            writeToConsole("key exist remove it and write new version");
            var removeAddRemoveKey = { namespace: "Repository", funcName: "removeKeyAddRemoveProgram", parameters: ["DisplayVersion", ctid] };
            window.top.nativeMsgComm.sendMessage(removeAddRemoveKey, function (response) {
                var setAddRemoveKey = { namespace: "Repository", funcName: "setKeyAddRemoveProgram", parameters: ["DisplayVersion", currentVersion, ctid] };
                window.top.nativeMsgComm.sendMessage(setAddRemoveKey, function (response) { });
            });
        }
    });

}

function connectToNativeHostFromLoader(sender, initMode) {
    writeToConsole("connectToNativeHostFromLoader Start");

    //if chrome version is lower than 29 don't try to connect 
    var chromeVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
    if (chromeVersion < 29) {
        sendUsage("NM_HOST_DISCONNECTED_CHROME_" + chromeVersion);
        injectAllScripts();
        return;
    }

    if (!configObj) {
        configObj = fetchConfigFile();
    }

    if (initMode == true) {
        writeToConsole("initParams true - initilize params");
        maxnumberOfTries = 7;
        currentRetries = 0;
        notfirstLoad = false;
    }

    window.nativeMsgComm.onConnect = function () { onHostConnectEvent(sender); };

    window.nativeMsgComm.onDisconnect = onHostDisconnectEvent;

    writeToConsole("Call nativeMsgComm connect");
    window.nativeMsgComm.connect();
}

function onHostDisconnectEvent() {
    writeToConsole("onConnect onDisconnect current retires:" + currentRetries);
    writeToConsole("onConnect onDisconnect Not first load:" + notfirstLoad);

    if (currentRetries < maxnumberOfTries && !notfirstLoad) {
        writeToConsole("num of Retries" + currentRetries)
        currentRetries++;
        setTimeout(function () {
            window.nativeMsgComm.connect(); //in case of disconnect, try to connect again up to maxnumberOfTries
        }, 200);
    } else {
        writeToConsole("number of reties end or disconnect happened or not on first load params: notfirstLoad:" + notfirstLoad);
        writeToConsole("number of reties end or disconnect happened or not on first load params: currentRetries:" + currentRetries);
        if (currentRetries == maxnumberOfTries && !notfirstLoad) {
            sendUsage("NM_HOST_DISCONNECTED_AFTER_MAX_RETRIES");
            injectAllScripts();
        } 
    }
}

function onHostConnectEvent(sender) {
    writeToConsole("OnConnectHappen");
    var addRemoveEntryDeployed = localStorage.getItem("addRemoveEntryDeployed");
    writeToConsole("addRemoveEntryDeployed  " + addRemoveEntryDeployed);
    if (!addRemoveEntryDeployed) {
        writeToConsole("call addAddRemoveEntry");
        addAddRemoveEntry(configObj.Ctid);
    }
    var getGlobalKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", "extensionsList"] };
    window.top.nativeMsgComm.sendMessage(getGlobalKeyMsg, function (response) {
        writeToConsole("get ExtensioListKey and write it to local storage ::" + JSON.stringify(response));
        if (response && response.status == 0) {
            localStorage.setItem("extensionsList", response.result);
        }
        //first check if need to update the current host 
        //only after it run keys migration and inject all scripts
        if (!configObj) {
            configObj = fetchConfigFile();
        }
        writeToConsole("call updateNativeMessagingHost");
        updateNativeMessagingHost(configObj.Ctid, function () { //the callback will be called only if no update of host required. otherwise, it will happen on the second connect
            writeToConsole("updateNativeMessagingHost Callback");
            var updateAfterChangeVersion = localStorage.getItem("runOnlyFirstTimeAfterVersion" + configObj.version);
            if (!updateAfterChangeVersion) {
                updateAddRemoveProgramEntry(configObj.Ctid, configObj.version);
                localStorage.setItem("runOnlyFirstTimeAfterVersion" + configObj.version, "updated");
            }
            writeToConsole("call maintainLocalStorage");
            maintainLocalStorage(function () { //restore local storage
                writeToConsole("restore done check if need Migration");

                var keyWereMigratedFromRegistry = localStorage.getItem("KeysMigrated");
                writeToConsole("keyWereMigratedFromRegistry ::" + keyWereMigratedFromRegistry); //migration from registry to local storage

                if (!keyWereMigratedFromRegistry) { // new install First Time / Auto Update or upgrade from old version (less the 10.23)
                    writeToConsole("KeyWasn't Migrated yes do full migration from regisrty");
                    migrateRegToLocalStorage(function () {
                        writeToConsole("set KeysMigrated to true");
                        localStorage.setItem("KeysMigrated", "true");
                        continueFlow(sender);
                    });
                } else {  //upgrades
                    writeToConsole("check if upgrade was done by get Key MigrateInstallerKeysOnUpgrade");
                    writeToConsole("call getKey with:: " + configObj.Ctid + "." + window.globalProfileName + ".MigrateInstallerKeysOnUpgrade");
                    getAsyncKey(configObj.Ctid + "." + window.globalProfileName + ".MigrateInstallerKeysOnUpgrade", function (response) {
                        writeToConsole("get Key result " + JSON.stringify(response));
                        if (response && response.status == 0) { // upgrade was done for profile
                            writeToConsole("upgrade done : call migrateUpgradeKeysToLocalStorage");
                            migrateUpgradeKeysToLocalStorage(function () {
                                //TODO : delete MigrateInstallerKeysOnUpgrade key
                                var removeKeyMsg = { namespace: "Repository", funcName: "removeKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + extensionId + "\\Repository", configObj.Ctid + "." + window.globalProfileName + ".MigrateInstallerKeysOnUpgrade"] };
                                nativeMsgComm.sendMessage(removeKeyMsg, function (response) {
                                    writeToConsole("upgrade done : call migrateUpgradeKeysToLocalStorage");
                                    continueFlow(sender);
                                });
                            });
                        } else { // the key migrateUpgradeKeysToLocalStorage doesn't exist 
                            writeToConsole("call getKey getVersionFromInstaller");
                            getAsyncKey(configObj.Ctid + ".versionFromInstaller", function (response) {
                                writeToConsole("getVersionFromInstaller response:: " + JSON.stringify(response));
                                if (response && response.status == 0) {
                                    writeToConsole("Current Version:  " + configObj.version);
                                    if (configObj.version == response.result) {
                                        writeToConsole("Installer Version and toolbar version identical");
                                        getAsyncKey(configObj.Ctid + ".wasMigratedAfterOldInstallerInstallation" + configObj.version, function (wasMigratedRes) {
                                            writeToConsole("key wasMigratedAfterOldInstallerInstallation " + JSON.stringify(wasMigratedRes));
                                            if (wasMigratedRes && wasMigratedRes.status != 0) {
                                                writeToConsole("call migrateUpgradeKeysToLocalStorage");
                                                migrateUpgradeKeysToLocalStorage(function () {
                                                    writeToConsole("set  wasMigratedAfterOldInstallerInstallation to true");
                                                    var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + extensionId + "\\Repository", 1, configObj.Ctid + ".wasMigratedAfterOldInstallerInstallation" + configObj.version, "true"] };
                                                    nativeMsgComm.sendMessage(setKeyMsg, function (response) { });
                                                    continueFlow(sender);
                                                });
                                            } else {
                                                continueFlow(sender);
                                            }
                                        });
                                    } else {
                                        continueFlow(sender);
                                    }
                                } else {
                                    continueFlow(sender);
                                }
                            });
                        }
                    });
                }

                function continueFlow(sender) {
                    updateMachineIDKey(function () {
                        updateUserMode(function () {
                            getTripleKey("ToolbarUserID", extensionId, function (trippleKeyUserID) {
                                var isUserIDExist = trippleKeyUserID.result.file || trippleKeyUserID.result.registry || trippleKeyUserID.result.local;
                                writeToConsole("isUserIDExist  " + isUserIDExist);
                                var currUserID = localStorage.getItem("ToolbarUserID");
                                writeToConsole("currUserID  " + currUserID);
                                if (isUserIDExist && !currUserID) {
                                    writeToConsole("UPDATE USER ID with " + isUserIDExist);
                                    localStorage.setItem("ToolbarUserID", isUserIDExist);
                                }
                                notfirstLoad = true;                               
                                writeToConsole("inject All Scripts After connect");
                                injectAllScripts();
                            });
                        });
                    });
                }

            });

        });
    });
}

function updateUserMode(callback) {
    var umKey = configObj.Ctid + ".searchUserMode";
    writeToConsole("updateUserMode umKey", umKey);
    var um = localStorage.getItem(umKey);
    writeToConsole("updateUserMode value retrived from LS", um);
    if (um) {
        writeToConsole("value in LS no need to do anytihing");
        callback();
        return;
    } else {
        writeToConsole("getUM From Registry");
        var getUmKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + extensionId + "\\Repository", umKey] };

        nativeMsgComm.sendMessage(getUmKeyMsg, function (response) {
            writeToConsole("getUM From Registry Response::  " + JSON.stringify(response));
            if (response && response.status == 0) {
                localStorage.setItem(umKey, response.result); //if the  key of usermode exist, set it again in local storage
                callback();
            } else {
                writeToConsole("getUM From File");
                var getUMDataMsg = { namespace: "Repository", funcName: "getData", parameters: [false, umKey, false] };
                nativeMsgComm.sendMessage(getUMDataMsg, function (response) {
                    writeToConsole("getUM From File Response::  " + JSON.stringify(response));
                    if (response && response.status == 0) {
                        localStorage.setItem(umKey, response.result); //if the  key of usermode exist, set it again in local storage
                        callback();
                    } else {
                        callback();
                    }

                });

            }
        });
    }

}

function updateMachineIDKey(callback) {
    var getGlobalKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", "machineId"] };
    nativeMsgComm.sendMessage(getGlobalKeyMsg, function (response) {
        if (!response.status) {
            localStorage.setItem("machineId", response.result); //if the global key of machine ID exist, set it again in local storage
            callback();
        } else { //generate it            
            var getMachineIDMsg = { namespace: "Context", funcName: "getMachineID", parameters: [] };
            nativeMsgComm.sendMessage(getMachineIDMsg, function (response) {
                if (!response.status) {
                    localStorage.setItem("machineId", response.result); //set it again in local storage  
                    var setGlobalKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + "GlobalStorage\\Repository", 1, "machineId", response.result] };
                    nativeMsgComm.sendMessage(setGlobalKeyMsg, function (response) {
                        callback();
                    });
                } else {
                    sendUsage("MACHINE_ID_ERR_MSG", { errorStatus: response.status, errorDescription: response.description });
                    callback();
                }
            });
        }
    });
}

function getAsyncKey(keyName, callback) {
    var extensionId = chrome.i18n.getMessage("@@extension_id");
    var repositoryPath = "Software\\AppDataLow\\Software\\Conduit\\ChromeExtData\\";
    var osName = getOSName();
    if (~["NT 5.1", "Windows NT 5.1"].indexOf(osName)) { //fox XP               
        repositoryPath = "Software\\Conduit\\ChromeExtData\\";
    }
    var getKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + extensionId + "\\Repository", keyName] };
    nativeMsgComm.sendMessage(getKeyMsg, callback);
}

function updateNativeMessagingHost(ctid, callback) {
    /**
    get from registry the current host version (should be saved as key in the toolbar repository)
    get from the extension the new host version (using fetchNMHostFile)
    if version is newer:
    create new directory for the new host version
    copy all files from extension folder to new folder
    update manifest file
    update host version key in registry       
    **/
    writeToConsole("updateNativeMessagingHost Start - get Async Key nmHostVersion");
    getAsyncKey(ctid + ".nmHostVersion", function (response) {
        var currentHostVersion = "1.0.0.0"; //fallback in case key wasn't found
        if (!response.status) {
            currentHostVersion = response.result;
        } else {//if we fail to get the version key from the registry, try to get it from local storage
            var localStorageVersion = localStorage.getItem(ctid + ".nmHostVersion");
            if (localStorageVersion) {
                currentHostVersion = localStorageVersion;
            }
        }
        writeToConsole("currentHostVersion :: " + currentHostVersion);
        var nmHostConfig = fetchNMHostFile("nmHostConfig.json");
        var nextHostVersion = '1.0.0.0';
        if (nmHostConfig.version) {
            nextHostVersion = nmHostConfig.version;
        }
        if (compareVersions(currentHostVersion, nextHostVersion) < 0) { //currentHostVersion < nextHostVersion need to update the nmHost
            //The callback is not passed on purpose since it will be called in the next connect after the update of host is done
            writeToConsole("update done from host version " + currentHostVersion + " to host version " + nextHostVersion);
            deployNewNativeMessagingHost(nextHostVersion, currentHostVersion, repositoryPath, ctid);
        }
        else {
            writeToConsole("no need to deploy new host, version wasn't change");
            callback(); //only if no need to run update of the host continue the flow to run key migration and inject of all scripts
        }
    });
}

function deployNewNativeMessagingHost(nextHostVersion, currentHostVersion, repositoryPath, ctid, callback) {
    writeToConsole("deployNewNativeMessagingHost");
    try {
        var Consts = {
            chromeUserData: "\\Google\\Chrome\\User Data\\",
            NativeMessagingPath: "\\NativeMessaging\\"
        };

        //first update the manifest file of the new nmHost in case this is chrome 29
        var chromeVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
        writeToConsole("deployNewNativeMessagingHost2");        
        //get current user local folder
        writeToConsole("deployNewNativeMessagingHost get user local folder");
        var getLocalUserMsg = { namespace: "Environment", funcName: "getCurrentUserLocalFolderPath", parameters: [] };
        nativeMsgComm.sendMessage(getLocalUserMsg, function (response) {
            writeToConsole("deployNewNativeMessagingHost get user local folder response" + JSON.stringify(response));
            if (!response.status) {
                var currerntNMHost = response.result + Consts.NativeMessagingPath + ctid;
                if (chromeVersion == 29) {
                    writeToConsole("call handleChrome29InstallationsFromNMHost");
                    handleChrome29InstallationsFromNMHost(function () { writeToConsole("handleChrome29InstallationsFromNMHost callback"); continueUpdateFlow(currerntNMHost, nextHostVersion, ctid) });
                }
                else {
                    writeToConsole("deployNewNativeMessagingHost continue update flow");
                    continueUpdateFlow(currerntNMHost, nextHostVersion, ctid);
                }
            }
        });
    }
    catch (e) {
        console.error("fail to deploy new host file ", e);
    }
    writeToConsole("finish deployNewNativeMessagingHost");
}

function continueUpdateFlow(currerntNMHost, nextHostVersion, ctid) {
    //get extension path
    writeToConsole("continueUpdateFlow");
    var extensionId = chrome.i18n.getMessage("@@extension_id");
    writeToConsole("continueUpdateFlow get Extension Path");
    var getExtensionPathMsg = { namespace: "Environment", funcName: "getExtensionPath", parameters: [extensionId, globalProfileName] };
    var currerntNMHostManifestFilePath = currerntNMHost + "\\nmHostManifest.json";
    nativeMsgComm.sendMessage(getExtensionPathMsg, function (response) {
        writeToConsole("continueUpdateFlow get Extension Path response" + JSON.stringify(response));
        if (!response.status) {
            var nativeMessagingDirInExtension = response.result + "\\nativeMessaging";
            //create new directory with the host new version 
            var newHostDirPath = currerntNMHost + "\\" + nextHostVersion.replace(/\./g, "_");
            writeToConsole("newHostDirPath create create dir" + newHostDirPath);
            var createDirMsg = { namespace: "Files", funcName: "createDirectory", parameters: [newHostDirPath] };

            nativeMsgComm.sendMessage(createDirMsg, function (response) {
                writeToConsole("create create dir response" + JSON.stringify(response));
                if (!response.status) {
                    //copy the new files from the extension folder to the new directory

                    var newNMHostManifestFilePath = nativeMessagingDirInExtension + "\\nmHostManifest.json";
                    writeToConsole("copy files from" + newNMHostManifestFilePath + "to   " + newHostDirPath + "\\nmHostManifest.json");
                    var copyFileMsg = { namespace: "Files", funcName: "copyFile", parameters: [newNMHostManifestFilePath, newHostDirPath + "\\nmHostManifest.json", true] };
                    nativeMsgComm.sendMessage(copyFileMsg, function (response) {
                        writeToConsole("copy files response");
                        copyFileMsg = { namespace: "Files", funcName: "copyFile", parameters: [nativeMessagingDirInExtension + "\\TBMessagingHost.exe", newHostDirPath + "\\TBMessagingHost.exe", true] };
                        nativeMsgComm.sendMessage(copyFileMsg, function (response) {
                            writeToConsole("copy files response2");
                            copyFileMsg = { namespace: "Files", funcName: "copyFile", parameters: [nativeMessagingDirInExtension + "\\nmHostConfig.json", newHostDirPath + "\\nmHostConfig.json", true] };
                            nativeMsgComm.sendMessage(copyFileMsg, function (response) {
                                writeToConsole("copy files response3");
                                if (!response.status) {
                                    //copy the manifest only after the new directory was created and the files were copied                                                     
                                    //send message to host to overwrite the manifest file 
                                    var copyManifestMsg = { namespace: "Files", funcName: "copyFile", parameters: [newNMHostManifestFilePath, currerntNMHostManifestFilePath, true] };
                                    nativeMsgComm.sendMessage(copyManifestMsg, function (response) {
                                        writeToConsole("copy files response4");
                                        if (!response.status) {
                                            //update the host version in registry
                                            localStorage.setItem(ctid + ".nmHostVersion", nextHostVersion);
                                            var setKeyMsg = { namespace: "Repository", funcName: "setKey", parameters: ["HKEY_CURRENT_USER", repositoryPath + extensionId + "\\Repository", 1, ctid + ".nmHostVersion", nextHostVersion] };
                                            nativeMsgComm.sendMessage(setKeyMsg, function (response) {
                                                writeToConsole("call disconnect and connect");
                                                //After all disconnect, reconnect, continue the flow
                                                disconnectFromNativeHost();
                                                connectToNativeHostFromLoader("updateHost", true);
                                            });
                                        }
                                    });
                                }
                            });
                        });
                    });
                }
            });
        }
    });
}

function disconnectFromNativeHost() {
    notfirstLoad = true;
    writeToConsole("call nativeMsgComm Disconnect");
    window.nativeMsgComm.disconnect();
}

function sendUsage(actionType, additionalData) {
    try {
        if (!configObj) {
            configObj = fetchConfigFile();
        }
        function createPostParams() {
            var regexBrowserInfo = /(Chrome)\/([0-9\.]+)/;
            var browserInfoArray = navigator.userAgent.match(regexBrowserInfo);
            var browserInfo = {
                'type': browserInfoArray[1],
                'version': browserInfoArray[2]
            };
            var regexOsInfo = /.*?\((.*?)\s(.*?)\)/;
            var osInfoArray = navigator.userAgent.match(regexOsInfo);

            var osFullVersion = osInfoArray[2].indexOf(";") != -1 ? osInfoArray[2].split(";")[0] : osInfoArray[2];
            var arrorsFullVersion = osFullVersion.split(" ");
            var osNumber = null;
            for (var i = 0; i < arrorsFullVersion.length; i++) {
                if (arrorsFullVersion[i].indexOf(".") != -1) {
                    osNumber = arrorsFullVersion[i];
                    break;
                }
            }

            var osInfo = {
                'type': osInfoArray[1],
                'version': osNumber
            };

            var ctid = configObj && configObj.Ctid ? configObj.Ctid : '';
            var tbversion = configObj && configObj.version ? configObj.version : '';
            var uid = ""
            try {
                uid = localStorage.getItem("ToolbarUserID");
                var oldItem;
                oldItem = JSON.parse(uid);
                oldItem = oldItem && oldItem.itemData;
                if (oldItem) {
                    uid = oldItem;
                }
            }
            catch (e) { }

            var nmHostVersion = localStorage && localStorage.getItem(ctid + ".nmHostVersion");
            var postParams = { "ctid": ctid,
                "originalCtid": ctid,
                "toolbarVersion": tbversion,
                "browser": "Chrome",
                "browserVersion": browserInfo.version,
                "os": osInfo.type,
                "osVersion": osInfo.version,
                "actionType": actionType,
                "userId": uid,
                "machineID": localStorage.getItem("machineId") || '',
                "nmHostVersion": nmHostVersion,
                "nmHostSupportVersion": '1.0.0.2'
            };
            if (additionalData) {
                postParams.additionalData = additionalData;
            }

            return postParams;
        }
        var postParams = createPostParams();

        try {
            var data = { 'url': 'http://tb-test.conduit-data.com' };
            var options = {
                type: 'POST',
                data: JSON.stringify(postParams)
            };
            $.ajaxSetup(options);
            $.ajax(data);
        } catch (e) {

        }
    } catch (e) {
        //console.error(e);
    }
}

function handleChrome29InstallationsFromNMHost(callback) {

    var nmHostManifest = fetchNMHostFile('nmHostManifest.json');
    if (nmHostManifest.path) {
        //get current user local folder
        var getLocalUserMsg = { namespace: "Environment", funcName: "getCurrentUserLocalFolderPath", parameters: [] };
        nativeMsgComm.sendMessage(getLocalUserMsg, function (response) {
            var currentUserLocalPath = response.result;
            var currentUserLocalPathRegxString = new RegExp(currentUserLocalPath.replace(/\\/g, "\\\\\\\\"));
            if (!currentUserLocalPathRegxString.test(nmHostManifest.path)) {
                var path = currentUserLocalPath + "\\NativeMessaging\\" + configObj.Ctid + "\\";
                nmHostManifest.path = path.replace(/\\/g, "\\\\") + nmHostManifest.path; // Chrome reads the manifest file only with double backslash
                var saveNMHostManifestFileMsg = { namespace: "State", funcName: "saveNMHostManifestFile", parameters: [globalProfileName, JSON.stringify(nmHostManifest)] };
                nativeMsgComm.sendMessage(saveNMHostManifestFileMsg, function (response) {
                    callback();
                });
            }
        });
    }
}

function writeToConsole(msg, param) {
   /* if (param)
        console.log(msg, param);
    else
        console.log(msg);
    var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, "logFile", msg, false, "append"] };
    nativeMsgComm.sendMessage(setDataMsg, function (response) { });
    var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, "logFile", "\n", false, "append"] };
    nativeMsgComm.sendMessage(setDataMsg, function (response) { });*/
}


(function loadBackstage() {
    waitForProfileName.then(function (profileName) {
        // Got profile name, onwards!
        window.globalProfileName = profileName;
        window.nativeMsgComm = new nativeMessaging.NativeMsgCom('nmhost' + configObj.Ctid.toLowerCase());
        connectToNativeHostFromLoader("ChromeBackStage", false);       

    }, function () {
        // Now try to read it again, this time only from file
        readProfileName(true).then(function (profileName) {
            window.globalProfileName = profileName;
            window.nativeMsgComm = new nativeMessaging.NativeMsgCom('nmhost' + configObj.Ctid.toLowerCase());
            connectToNativeHostFromLoader("ChromeBackStage", false);
           
        }, function () {
            console.error('failed reading profile name! errors are expected if working with a non-default user profile...');
            window.globalProfileName = 'Default';
            writeFallbackProfileName(window.globalProfileName);
            window.nativeMsgComm = new nativeMessaging.NativeMsgCom('nmhost' + configObj.Ctid.toLowerCase());
            connectToNativeHostFromLoader("ChromeBackStage", false);           
        });
    });
}());

