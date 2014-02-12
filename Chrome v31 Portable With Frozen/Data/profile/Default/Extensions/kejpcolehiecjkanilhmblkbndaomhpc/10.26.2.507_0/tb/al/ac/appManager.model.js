conduit.register("applicationLayer.appCore.appManager.model", (function () {

    var messages = conduit.abstractionlayer.commons.messages;
    var tabs = conduit.abstractionlayer.backstage.tabs;
    var windows = conduit.abstractionlayer.backstage.windows;
    var repository = conduit.coreLibs.repository;
    var serviceLayer = conduit.backstage.serviceLayer;
    var absRepository = conduit.abstractionlayer.commons.repository;
    var environment = conduit.abstractionlayer.commons.environment;
    var browserType = conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type;
    var version = conduit.abstractionlayer.commons.environment.getEngineVersion().result;
    var modelsList = new HashMap();
    var viewData = new HashMap();
    var myStuffUrl;
    var design = {};
    var generalData = {};
    var settingsObj;

    var isReady = false;
    var lastViewIndex = 0;
    var baseAppInfo;
    var popupId;
    var modelApp;
    var objApp;
    var optionsData;
    var numberOfActiveApps;
    var wait;
    var onNavigatePatternListenrAdded = false;
    var tabsObj = {};
    var logger = conduit.coreLibs.logger;
    var loginMyStuffEnabled = true;
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
    var userAppsLocation;
    var addUserAppArr = [];
    var addUserAppTimeout;
    var isChrome = /Chrome/i.test(conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type);
    var managerAppsList = {};
    var untrustedDialogOpen = false;
    var performChromeAdjust = false;

    var user_updates = (function () {
        var log = function (method, text, data) {
            var log_entry = text;
            if (arguments.length == 2) {
                if (typeof data != 'string') {
                    try {
                        data = JSON.stringify(data);
                    } catch (ex) {
                        data = 'JSON stringify cause to exception';
                    }
                }
                log_entry = text + ' data: ' + data
            }
            conduit.coreLibs.logger.logDebug(log_entry, { className: "user_updates", functionName: method });
        }
        var update_disabled = { 'enabled': false };
        var update = update_disabled;
        var map_storage_key = ".UserUpdatesMetaMap";
        var map = {};

        function remap(data) {
            if (!data || data.enabled !== true) {
                return { 'enabled': false };
            }
            var update = { enabled: true, icon: { url: ''} };
            update.id = '' + data.updateId;
            update.status = (data.updateStatus == 'ACTIVE_PLAIN') ? 'plain' : 'active';
            update.icon.url = data.iconLink;
            update.action = { url: data.updateUrl };
            return update;
        }

        function storemap() {
            conduit.abstractionlayer.commons.repository.setKey(ctid + map_storage_key, JSON.stringify(map));
        }

        function getmap() {
            var map = {};
            try {
                map = conduit.abstractionlayer.commons.repository.getKey(ctid + map_storage_key).result;
                map = JSON.parse(map);
                if (typeof map != 'object' || map == null) {
                    map = {};
                }
            } catch (ex) {
                map = {};
            }
            return map;
        }

        var action_stub = function () { }
        var action_impl = function () {
            log('action', 'method call');

            conduit.abstractionlayer.commons.context.getUserID(function (response) {
                var userid = response.result;
                var url = update.action.url.replace('@USERID', userid);
                tabs.create(url, null, true, function (info) {
                    log('action: tabs.create handler', '', info);
                    var updateStatusAndSendUsage = function () {
                        var meta = map[update.id];
                        var ts = meta.ts;
                        var delta = +new Date() - parseInt(ts || 0);
                        var elapse_mm = parseInt(delta / 60000); //duration is in minutes
                        var status = update.status;
                        var uuid = update.id;

                        if (meta == true || meta.status == 'active') {
                            log('action: onUserUpdateDocument.ready', 'mark user update as accessed');

                            map[uuid] = true;
                            storemap();
                            update = update_disabled;
                            messages.postTopicMsg("applicationLayer.appManager.model.onUserUpdates", "applicationLayer.appManager.model", JSON.stringify({ method: 'hide', data: { enabled: false} }));
                            if (meta == true) {
                                return;
                            }
                        }
                        settingsObj.design.user_updates = user_updates.data();

                        log('action: updateStatusAndSendUsage.ready', 'send usage');
                        methods.sendUsage({
                            type: "sendToolbarUsage"
                        , actionType: "TOOLBAR_USER_UPDATES_CLICK"
                        , additionalUsageInfo: {
                            update_id: uuid
                            , status: status
                            , user_id: userid
                            , elapsed_mm: elapse_mm
                        }
                        });
                    }
                    updateStatusAndSendUsage();
                });
            });
        };
        var action = action_impl;

        var map = getmap();

        return {
            'init': function (data) {
                log('init', '.', data);
                function ensure_protocol(url) {
                    if (typeof (url) != 'string') {
                        return true;
                    }
                    if (! ~url.indexOf('http') && ! ~url.indexOf('https')) {
                        update.action.url = 'http://' + update.action.url;
                    }
                    return true;
                }

                function is_url(url) {
                    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                    return !!regexp.test(url);

                }
                update = remap(data);
                if (!update.enabled) {
                    action = action_stub;
                    return;
                }

                if (!(update.action && typeof (update.action.url) == 'string' && ensure_protocol(update.action.url) && is_url(update.action.url))) {
                    update = { 'enabled': false };
                    action = action_stub;
                    return;
                }
                if (map[update.id] === true) {
                    update = { 'enabled': false };
                    action = action_stub;
                    return;
                }
                if (typeof map[update.id] != 'object' && map[update.id] == null) { // no meta object
                    map[update.id] = { 'status': update.status, 'ts': +new Date() };
                    storemap();
                }
                if (map[update.id] && map[update.id].status != update.status) { //update meta object on status changed
                    map[update.id] = { 'status': update.status, 'ts': +new Date() };
                    storemap();
                }

                action = action_impl;

                try {
                    update.tooltip = serviceLayer.translation.getTranslation('SB_USERUPDATE_TOOLTIP_NORMAL') || 'Updates from {ToolbarName}';
                    update.tooltip = update.tooltip.replace('{ToolbarName}', conduit.abstractionlayer.commons.context.getToolbarName().result);
                } catch (ex) {
                    update.tooltip = 'Updates';
                }

            }
            , 'data': function () {
                return update;
            }
            , 'action': function () {
                action();
            }
        }
    })();


    function getUserUpdatesObject() {
        return user_updates.data();
    }

    function isMyStuffEnabled() {
        var setupMyStuffEnabled = conduit.abstractionlayer.commons.repository.getKey(ctid + ".myStuffEnabled").result;
        var settingsMyStuffEnabled = settingsObj.generalData.myStuffEnabled !== false;
        var isHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;
        return (((loginMyStuffEnabled || setupMyStuffEnabled) && settingsMyStuffEnabled) && !isHidden);
    }

    function setMyStuffVisibility(loginData) {
        if (loginData) {
            loginMyStuffEnabled = loginData && loginData.myStuff ? loginData.myStuff.enabled : true;
        }
        conduit.abstractionlayer.commons.messages.postTopicMsg("applicationLayer.appManager.view", "applicationLayer.appManager.model", JSON.stringify({ method: "setMyStuffVisibility", data: isMyStuffEnabled() }));
    }

    function handleLoginReady(loginData) {
        try {
            handleChromeAdjustments();
            setMyStuffVisibility(loginData);
            if (!isMyStuffEnabled()) return;
            var pattern = serviceLayer.login.getAppsDetectionUrlPattern();
            if (pattern && !onNavigatePatternListenrAdded) {
                var res = tabs.onNavigatePattern.addListener(pattern, function (url) {
                    var strQueryString = url.match(/\?(.*)$/)[1],
					arrQueryString = strQueryString.split("&"),
					keys = {};

                    for (i = 0; i < arrQueryString.length; i++) {
                        var arrKeyValue = arrQueryString[i].split("=");
                        keys[arrKeyValue[0]] = arrKeyValue[1];
                    }
                    if (keys["appid"] && !getAppByGuid(keys["appid"])) {
                        addUserApp(keys["appid"], keys["appid"], (keys["name"] || ""));
                    }
                });
                if (res && !res.status) {
                    onNavigatePatternListenrAdded = true;
                }
            }
            handleHiddenApps();
        }
        catch (e) {
            logger.logError('Failed to handle login', { className: "appManager.model", functionName: "handleLoginReady" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e, reportToServer: true });
        }

    }

    function handleChromeAdjustments() {
        try {
            if (!isChrome) {
                return;
            }

            var toolbarLoginClientTime = absRepository.getKey(ctid + ".toolbarLoginClientTime").result;
            var chromeAdjustLastUpdate = absRepository.getKey(ctid + ".chromeAdjustLastUpdate").result;

            var chInterval = serviceLayer.login.getChromeInterval();

            var dateArr;
            if (!chromeAdjustLastUpdate) {
                if (!toolbarLoginClientTime) {
                    toolbarLoginClientTime = new Date();
                    absRepository.setKey(ctid + ".toolbarLoginClientTime", toolbarLoginClientTime);
                }
                chromeAdjustLastUpdate = new Date(toolbarLoginClientTime);
            }
            else {
                chromeAdjustLastUpdate = new Date(chromeAdjustLastUpdate);
            }

            if (chInterval && chInterval != "0" && absRepository.getKey("extensionapproved").status && !performChromeAdjust) { //only if interval exist and not 0 and the toolbar isnt already approved call the abstraction 
                chInterval = parseInt(chInterval);
                if ((new Date() - chromeAdjustLastUpdate > chInterval * 60 * 60 * 1000)) {
                    //only if we tried less than 6 time try again
                    var numberOfTriesToCallApprovePluginKey = absRepository.getKey("numberOfTriesToCallApprovePlugin");
                    if (numberOfTriesToCallApprovePluginKey.status || numberOfTriesToCallApprovePluginKey.result < 6) {
                        methods.sendUsage({
                            type: "sendToolbarUsage",
                            actionType: "CH_ADJUST_TRIGGERED",
                            additionalUsageInfo: { chromeInterval: chInterval }
                        });
                        absRepository.setKey(ctid + ".chromeAdjustLastUpdate", new Date());
                        conduit.abstractionlayer.backstage.business.featureProtector.loadChrome25Plugin();
                        performChromeAdjust = true;
                    }
                }
            }

            if (!absRepository.getKey("extensionapproved").status) {
                //send approved usage if needed
                var usage = conduit.backstage.serviceLayer.usage;
                var actionType = "CH_ADJSUT_APPROVED";
                var oUsage = { actionType: actionType, chromeInterval: chInterval };
                if (absRepository.getKey(ctid + "." + actionType).status) { //if the usage key doesnt exist send the usage
                    absRepository.setKey(ctid + "." + actionType, "true");
                    if (usage && usage.sendToolbarUsage) {
                        usage.sendToolbarUsage(oUsage);
                    }
                }
            }
        }
        catch (e) {
            logger.logError('Fail to handle chrome adjusments', { className: "appManager.model", functionName: "handleChromeAdjustments" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e, reportToServer: false });
        }
    }

    function addUserApp(compGuid, compInstanceId, compName, additionalInfo) {
        var openLastPopup = true;
        try {
            if (methods.isAppInstalled(compGuid) == false) {
                addUserAppArr.push(compGuid);
                clearTimeout(addUserAppTimeout);
                if (additionalInfo) {
                    openLastPopup = additionalInfo.openLastPopup;
                }
                addUserAppTimeout = setTimeout(function () {
                    conduit.backstage.serviceLayer.userApps.addCollection(addUserAppArr, openLastPopup);
                    addUserAppArr = [];
                }, 300);
            }
        }
        catch (e) {
            conduit.coreLibs.logger.logError('Failed to add user app', { className: "appManager.model", functionName: "addUserApp" }, { error: e });
        }
    }


    function disableApps() {
        var appsToDisable = getOptionsData(true);
        var optionsData = { apps: appsToDisable };
        conduit.applicationLayer.options.update(optionsData);
    }

    function enableApps() {
        var appOptions = conduit.coreLibs.config.getAppOptions();
        var appsToEnable = getOptionsData(false);
        for (var index in appOptions) {
            var currentApp = appOptions[index];
            if (currentApp.disabled) {
                appsToEnable[currentApp.appId] = { appGuid: currentApp.appGuid, appId: currentApp.appId, disabled: true, render: currentApp.render };
            }
        }
        var optionsData = { apps: appsToEnable };

        conduit.applicationLayer.options.update(optionsData);
    }

    function getOptionsData(disable) {
        var optionsData = {};
        var modelApps = modelsList.GetValuesArray();
        var loderApps = conduit.applicationLayer.appCore.loader.getLoaderApps();
        var embeddedWorkWhenHiddenVal = absRepository.getKey(ctid + ".embeddedWorkWhenHidden").result;
        var hiddenApps = {}; // for apps that are hidden by user
        var embeddedWorkWhenHidden = false;
        var diableWhenHidden;
        if (embeddedWorkWhenHiddenVal && embeddedWorkWhenHiddenVal.toLowerCase() == "true") {
            embeddedWorkWhenHidden = true;
        }
        for (var index in modelApps) {
            diableWhenHidden = (disable && !modelApps[index].isEnabledInHidden()) && !(modelApps[index].appType == "embedded" && embeddedWorkWhenHidden); //TODO handle isEnabledInHidden in loader only apps (no view)
            if (!modelApps[index].getAppIsShowStatus() == false) {
                optionsData[modelApps[index].appId] = { appGuid: modelApps[index].appGuid, appId: modelApps[index].appId, disabled: diableWhenHidden, render: true };
            } else {
                hiddenApps[modelApps[index].appId] = true;
            }
        }
        for (var index in loderApps) {
            if (!optionsData[loderApps[index].appId] && !hiddenApps[loderApps[index].appId]) {
                optionsData[loderApps[index].appId] = { appGuid: loderApps[index].appGuid, appId: loderApps[index].appId, disabled: diableWhenHidden, render: false };
            }
        }

        return optionsData;
    }

    //TODO handle isEnabledInHidden in loader only apps (no view)
    function handleHiddenApps(gottenApps) {
        // ask each app if it is managed, get its manager and ask if isEnabledInHidden
        try {
            var toobarHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;
            // if toolbar is hidden, enable only apps with special policy that should work in hidden mode (from the login)
            var workingAppsWhenHidden = conduit.backstage.serviceLayer.login.getWorkingAppsWhenHidden();
            //{ apps: apps, guidArray: workingAppsWhenHidden };
            //also apps can be gotten apps, we need to get them from the model after the apps metadata returned.
            if (workingAppsWhenHidden) {
                var workingApps = workingAppsWhenHidden.apps;
                var guidArray = workingAppsWhenHidden.guidArray;
                if (gottenApps && gottenApps.length > 0 && guidArray && guidArray.length > 0) {
                    //add the gotten apps to the apps list
                    for (var i in gottenApps) {
                        var gottenApp = gottenApps[i];
                        if (guidArray.indexOf(gottenApp.appGuid) > -1) {
                            workingApps[gottenApp.appGuid] = gottenApp;
                        }
                    }
                }

                var models = modelsList.GetValuesArray();
                var model;
                var appEnabledInHidden;
                var managedApps = [];
                var notifiedApps = [];

                for (var index in models) {
                    model = models[index];
                    if (model.appGuid) {
                        if (model.managed) {
                            managedApps.push(model);
                            continue;
                        }
                        appEnabledInHidden = model.isEnabledInHidden();
                        var appOptions = {};
                        appOptions[model.appId] = { appGuid: model.appGuid, appId: model.appId, appClientGuid: model.appClientGuid };

                        var repositoryObj = { apps: appOptions };
                        if (workingApps[model.appGuid]) {
                            //The app can be enabled in hidden mode. show it in the view, which will create its bgpage in the loader                    
                            model.setEnabledInHidden(true);
                            if (model.viewData) {
                                model.viewData.enabledInHidden = true;
                                if (viewData[model.appId]) {
                                    viewData[model.appId].enabledInHidden = true;
                                }
                            }

                            if (!appEnabledInHidden) {
                                appOptions[model.appId].disabled = false;
                                if (toobarHidden) {
                                    conduit.applicationLayer.options.update(repositoryObj);
                                }
                                notifiedApps.push(model.appGuid);
                            }

                        }
                        else if (appEnabledInHidden) {
                            //The app can not be enabled in hidden mode. hide it from the view, which will remove its bgpage in the loader
                            model.setEnabledInHidden(false);
                            appOptions[model.appId].disabled = true;
                            if (toobarHidden) {
                                conduit.applicationLayer.options.update(repositoryObj);
                            }
                            notifiedApps.push(model.appGuid);
                        }
                    }
                } // end for

                // Managed app (app that was started by the addWebapp API) must check if its Manager app can work in hidden. Only if its Manager can work in hidden, it can also work in hidden mode.
                for (var index in managedApps) {
                    var managedApp = managedApps[index];
                    var managerId = managedApp.managed.managerId;
                    var appOptions = {};
                    var repositoryObj = { apps: appOptions };
                    if (managerId && notifiedApps.indexOf(managerId) > -1) {
                        var manager = getAppByGuid(managerId);
                        appOptions[managedApp.appId] = { appGuid: managedApp.appGuid, appId: managedApp.appId, appClientGuid: managedApp.appClientGuid, disabled: true };
                        if (manager && manager.isEnabledInHidden()) {
                            appOptions[model.appId].disabled = false;

                        }
                        if (toobarHidden) {
                            conduit.applicationLayer.options.update(repositoryObj);
                        }
                    }
                } // end for
            }

        }
        catch (e) {
            conduit.coreLibs.logger.logError('Failed to handle hidden apps', { className: "appManager.model", functionName: "handleHiddenApps" }, { error: e });
        }
    }

    function getModelsList() {
        return modelsList;
    }
    function getViewData() {
        return viewData;
    }

    var methods = {
        getAppsList: function () {
            var appInfoArr = [];
            var appInfo;
            var models = modelsList.GetValuesArray();
            for (var index in models) {
                appInfo = { appId: models[index].appId, isUserAdded: models[index].isUserApp };
                appInfoArr.push(appInfo);
            }
            return JSON.stringify(appInfoArr);
        },
        getPermission: function (id, type) {
            var app = getAppById(id);
            var result = {
                autorized: false
            }

            try {
                result.autorized = (id == "webappApiFront" || app.isPersonalApp) ? true : !!app.apiPermissions[type];
            } catch (e) {

            }
            return result;
        },
        getAdvancedPermission: function (id, type) {
            var app = getAppById(id);
            var result = {
                autorized: false
            }
            if (id == "webappApiFront" || app.isPersonalApp) {
                result.autorized = true;
                return result;
            }
            var obj = app.apiAdvancedPermissions;
            try {
                if (obj) {
                    if (/true/i.test(obj[type])) {
                        result.autorized = true;
                    }
                }

            } catch (e) {

            }
            return result;
        },

        isAppInstalled: function (guid) {
            return getAppByGuid(guid) ? true : false;
        },
        getInstalledApps: function () {
            var models = modelsList.GetValuesArray();
            var model;
            var installedApps = [];
            for (var index in models) {
                model = models[index];
                if (model.appGuid) {
                    //found the app
                    installedApps.push(model.appGuid);
                }
            }
            return JSON.stringify(installedApps);
        },
        /*
        * data object:
        *   type - sendToolbarComponentUsage or sendToolbarUsage or sendHostingUsage
        *   appId 
        *   additionalUsageInfo
        *   actionType - the usage action
        */
        sendUsage: function (data, cb) {
            cb = cb || function () { };
            var isSendUsage = absRepository.getKey(ctid + ".sendUsageEnabled");
            if (isSendUsage && !isSendUsage.status && isSendUsage.result == 'false') {
                // send usage is disabled
                return;
            }

            var usageData = { actionType: data.actionType };
            if (data.appId && data.type == 'sendToolbarComponentUsage') {
                var app = getAppById(data.appId);
                if (app) {
                    if (app.isDeveloperApp) {
                        return;
                    }
                    var appData = {
                        componentId: data.appId,
                        componentGuid: app.appGuid ? app.appGuid : null,
                        isUserApp: app.isUserApp || app.isUserWebApp,
                        appBornDate: app && app.isUserApp && app.getAppBornDate ? app.getAppBornDate() : null,
                        chevron: false,
                        orderId: app.index,
                        componentInstanceGuid: app.appClientGuid ? app.appClientGuid : null,
                        numberOfChevronApps: 0,
                        numberOfActiveApps: numberOfActiveApps
                    }
                    $.extend(usageData, appData);
                    if (data.additionalUsageInfo && data.additionalUsageInfo.elementId) {
                        usageData.elementId = data.additionalUsageInfo.elementId;
                        delete data.additionalUsageInfo.elementId;
                    }
                    else {
                        usageData.elementId = data.appId;
                    }
                }
            }

            $.extend(usageData, data.additionalUsageInfo);
            var aliasesManager = conduit.coreLibs.aliasesManager;
            var usageDataStr = aliasesManager.replaceAliases(JSON.stringify(usageData), null, aliasesManager.constants.TYPE_MODES.NAVIGATION_URL);

            if (serviceLayer.usage[data.type]) {
                serviceLayer.usage[data.type](JSON.parse(usageDataStr),cb);
            }
        },

        openAppByGuid: function (data) {
            var model = getAppByGuid(data.guid);
            data.sender.appId = model.appId;
            openPopup(model, data.sender);
        },

        setSkin: function (skinObj) {
            setSkin(skinObj);
        }

    };

    function getAppById(appId) {
        var loader = conduit.applicationLayer.appCore.loader;

        return modelsList.GetByID(appId) || loader.getAppById(appId);
    }

    function setSkin(skinObj) {
        var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
        conduit.abstractionlayer.commons.repository.getData(ctid + '.skin', false, function (oldSkin) {
            if (oldSkin && !oldSkin.status) {
                oldSkin = JSON.parse(oldSkin.result);
                if (skinObj.background.imageBase64 && (oldSkin.background.imageUrl34px || oldSkin.background.color)) {
                    // toolbar already has set a skin - do nothing
                    return;
                }
            }

            // toolbar has skin in settings - do nothing
            if (skinObj.background.imageBase64 && design.skin && design.skin.background && (design.skin.background.imageUrl34px || design.skin.background.color)) {
                return;
            }

            if (skinObj && typeof (skinObj) == 'object' && (skinObj.background.color != "transparent")) {
                conduit.abstractionlayer.commons.repository.setData(ctid + '.skin', JSON.stringify(skinObj), false, '', function (response) {
                    conduit.abstractionlayer.commons.messages.postTopicMsg("applicationLayer.appManager.view", "applicationLayer.appManager.model", JSON.stringify({ method: "setSkin", data: { 'skin': skinObj, 'skinOnly': true} }));
                });
            }
            else { // remove skin and go back to default
                conduit.abstractionlayer.commons.repository.removeData(ctid + '.skin', function (response) {

                    if (design.skin) {
                        design.skin.background = {};
                    }

                    // Used for FF personals
                    if (browserType == 'Firefox') {
                        var backgroundImg = conduit.abstractionlayer.backstage.browser.getBackgroundImage().result;
                        if (backgroundImg) {
                            setSkin({ background: { imageBase64: backgroundImg} });
                            return;
                        }
                    }
                    conduit.abstractionlayer.commons.messages.postTopicMsg("applicationLayer.appManager.view", "applicationLayer.appManager.model", JSON.stringify({ method: "setSkin", data: { 'skin': skinObj, 'skinOnly': true} }));
                });
            }
        });
    }

    function getAppByGuid(guid) {
        // returns true is an app with the given GUID is installed.
        var models = modelsList.GetValuesArray();
        var model;

        for (var index in models) {
            model = models[index];
            if (model.appGuid == guid) {
                //found the app
                return model;
            }
        }
        return null;

    }

    function getAppBySettingsAppType(appType) {
        // returns the an app with the given appType.
        var models = modelsList.GetValuesArray();
        var model;

        for (var index in models) {
            model = models[index];
            if (model.viewData && model.viewData.settingsAppType == appType) {
                //found the app
                return model;
            }
        }
        return null;

    }

    // Start state area
    var stateTimeoutId;
    messages.onSysReq.addListener("appManager.model.saveState", function (data, sender, callback) {
        var data = JSON.parse(data);
        saveState(data.state, data.saveNow, callback);
    });


    function saveState(state, saveNow, callback) {
        if (conduit.abstractionlayer.backstage.browser.isHidden().result && state != "deleteState") {
            // Don't save state if toolbar is hidden
            return;
        }
        if (stateTimeoutId) {
            clearTimeout(stateTimeoutId);
            stateTimeoutId = undefined;
        }

        // Save state after a grace time:
        stateTimeoutId = setTimeout(function () {
            try {
                function removeManagedApps() {
                    var managedApps = getManagedAppsArray();
                    for (var i = 0; i < managedApps.length; i++) {

                        var managedAppTagExp = new RegExp('<\\s*a\\s*id=\\"' + managedApps[i].appId + '\\"(.*?)<\\s*/a>', 'g')
                        state = state.replace(managedAppTagExp, "");
                    }
                }
                if (state == "deleteState") {
                    conduit.coreLibs.logger.logDebug('calling deleteStateFile', { className: "appManager.model", functionName: "saveState" });
                    conduit.abstractionlayer.commons.repository.deleteStateFile(function () { });
                    return;
                }
                var bodyTag = state.match(/<body([^>]*)>/ig);
                if (!/style/i.test(bodyTag)) {
                    // if body has no style don't save state - somthing went wrong
                    return;
                }
                var scrollPanelState = state.match(/<div\s[^>]*id=\"?scrollPanel\"?[^>]*>/i)[0];

                // Fix for IE8:
                state = state.replace(/<css3-container\b[^>]*>(.*?)<\/css3-container>/gi, ""); //remove PIE code from State roee ovadia 14.11.11

                state = state.replace(/\r\n/g, "\n");
                state = state.replace(/[\n]+/g, "\n");
                state = state.replace(/[\r]+/g, "\r");
                // End fix for IE8
                // Replace special chars with html ASCII code
                // state = conduit.utils.string.convertToASCII(state);
                state = state.replace(/\s?appView_button_minimized/g, "").replace(/\s?menuOpen/g, "");
                state = state.replace(/\s?appView_menu_hover([\"\s])/g, "$1");

                scrollMatch = scrollPanelState.match(/(?:(?:left)|(?:right)):\s([\d\-\.px]+)/);
                if (scrollMatch) {
                    var scrollPanelStateNoScroll = scrollPanelState.replace(scrollMatch[1], "0");
                    state = state.replace(scrollPanelState, scrollPanelStateNoScroll);

                    var leftScrollBtnState = state.match(/<a[^>]+(id=\"?scrollLeftBtn\"?)[^>]*>/)[0],
						rightScrollBtnState = state.match(/<a[^>]+(id=\"?scrollRightBtn\"?)[^>]*>/)[0];

                    var isRtl = design.alignMode === "rtl",
						leftScrollBtnStateNoScroll = leftScrollBtnState.replace(/class=\"?\w*\"?/, "class=\"" + (isRtl ? "" : "scrollLeftBtnDisabled") + "\""),
							rightScrollBtnStateNoScroll = rightScrollBtnState.replace(/class=\"?\w*\"?/, "class=\"" + (isRtl ? "scrollRightBtnDisabled" : "") + "\"");

                    state = state.replace(leftScrollBtnState, leftScrollBtnStateNoScroll);
                    state = state.replace(rightScrollBtnState, rightScrollBtnStateNoScroll);
                }
                //remove managed apps from state
                removeManagedApps();

                //for images caching
                conduit.coreLibs.imageCaching.changeImagePathsToLocal(state, function (state) {

                    conduit.abstractionlayer.commons.repository.saveStateFile(state, function (saveResult) {
                        if (callback) {
                            if (saveResult.status)
                                callback(JSON.stringify({ result: false, error: saveResult.description }));
                            else
                                callback(JSON.stringify({ result: true }));
                        }

                        // save embeddeds data
                        var embeddedsData = [];
                        var models = modelsList.GetValuesArray();

                        for (var index = 0; index < models.length; index++) {
                            var model = models[index];
                            if (model && model.viewData && model.viewData.viewType == "embedded") {
                                embeddedsData.push({ appId: model.appId,
                                    isUserAdded: model.isUserAdded,
                                    apiPermissions: model.apiPermissions,
                                    originalHeight: model.viewData.embedded.size.originalHeight,
                                    onBeforeLoadData: model.onBeforeLoadData
                                });
                            }
                        }
                        absRepository.setKey(ctid + ".embeddedsData", JSON.stringify(embeddedsData));
                    });
                });

            } catch (e) {
                if (callback)
                    callback(JSON.stringify({ result: false, error: e.message }));
            }
        }, saveNow ? 500 : 5000);
    }
    // End state area

    var createDataForApp = function (item, order) {

        var appJson = {};
        appJson.appId = item.appId;
        appJson.appGuid = item.appGuid ? item.appGuid : "";
        appJson.platform = "publisher";
        appJson.chevronFlag = false;
        appJson.orderId = order;
        appJson.sourceChannel = ""; //TODO not implemented.
        appJson.isOldApp = false;
        appJson.appBornDate = item.getAppBornDate();
        return appJson;
    };

    var getAppTrackingUsage = function () {
        var appsArr = new Array();

        var counter = 0;
        var models = modelsList.GetValuesArray();
        for (var index = 0; index < models.length; index++) {
            var model = models[index];
            if (model && model.viewData && model.viewData.isShow) {
                appsArr.push(createDataForApp(model, counter));
                counter++;
            }
        }
        var data = { apps: appsArr };
        return data;
    }

    var initListeners = function () {

        conduit.subscribe('onLoginChange', handleLoginReady);
        conduit.subscribe('disableApps', disableApps);
        conduit.subscribe('enableApps', enableApps);

        messages.onSysReq.addListener('applicationLayer.appManager.model.getAppTrackingAppsData', function (result, sender, callback) {
            var usage = getAppTrackingUsage();
            var json = JSON.stringify({ data: usage });
            callback(json);
        });

        messages.onTopicMsg.addListener("serviceLayer.userApps.onAppRegisterUsageReceived",
			function (data) {

			    setServerBornDate(JSON.parse(data));
			}
		);

        //TODO evaluate again
        messages.onSysReq.addListener('applicationLayer.appManager.model.isReady', function (result, sender, callback) {
            //if (isReady)
            callback("");
        });


        // listener to calls from the webApp api
        messages.onSysReq.addListener("applicationLayer.appManager.model.webAppApiRequest", function (dataStr, sender, callback) {
            handleWebAppApiRequest(JSON.parse(dataStr), JSON.parse(sender), callback);
        });
        // listener to calls from the uiManager controller api
        messages.onSysReq.addListener("applicationLayer.appManager.controller.clickEvent", function (dataStr, sender, callback) {
            var dataObj = JSON.parse(dataStr);
            if (dataObj.userAppFirstTime) {
                clearTimeout(wait);
                wait = setTimeout(function () {
                    handleClickEvent(dataObj);
                }, 300);
            }
            else {
                handleClickEvent(dataObj);
            }
            if (callback) {
                callback("");
            }
        });

        messages.onSysReq.addListener('applicationLayer.appManager.model.getViewData', function (data, sender, callback) {
            if (isReady) {
                if (data) {
                    data = JSON.parse(data);
                    if (data.appId) {
                        var app = getAppById(data.appId);
                        if (app) {
                            callback(JSON.stringify({ app: app, appStatus: data.appStatus }));
                        }
                    }
                }
                else {
                    callback(JSON.stringify({
                        design: design,
                        generalData: generalData,
                        apps: viewData.GetValuesArray(),
                        viewId: ++lastViewIndex,
                        config: settingsObj.config
                    }));
                }

            }
            else {
                callback("");
            }
        });


        /**
        @listener
        @description: addListener to handle user responses from the popup dialog.
        */
        messages.onSysReq.addListener("updateUserAppsPermissions", function (dataStr, sender, callback) {
            conduit.coreLibs.logger.logDebug('updateUserAppsPermissions start', { className: "appManager.model", functionName: "updateUserAppsPermissions" });
            var data = JSON.parse(dataStr);
            conduit.coreLibs.logger.logDebug('updateUserAppsPermissions : method: ' + data.method, { className: "appManager.model", functionName: "updateUserAppsPermissions" });
            if (data.method == "open") {
                untrustedDialogOpen = false;
                conduit.abstractionlayer.backstage.popup.close(popupId, function (data) { })
                //update repository.
                if (!data.isChecked)
                    repository.setLocalKey('isEnableAllDialogs', "false");
                else
                    repository.setLocalKey('isEnableAllDialogs', "true");

                repository.setLocalKey(modelApp.appId + 'isEnableThisAppDialog', "true");

                //open gadget popup.
                if (modelApp.appType == "button") {
                    openPopup(modelApp, objApp)
                }
                else if (modelApp.appType == "embedded") {
                    openTrustedHtml();
                }
            }
            else if (data.method == "openPrivacy") {
                untrustedDialogOpen = false;
                conduit.abstractionlayer.backstage.popup.close(popupId, function (data) { })
                conduit.abstractionlayer.backstage.tabs.create("http://apps.conduit.com/conduitengine/Content-Policy", "", true, function (result) {
                })
            }
            else if (data.method == "rezizePopup") {
                conduit.abstractionlayer.backstage.popup.resize(popupId, 400, 400, function () { })
            }
            else {
                untrustedDialogOpen = false;
                conduit.abstractionlayer.backstage.popup.close(popupId, function (data) { })
            }
            if (callback)
                callback("");
        });

        // listener to changes from the appsMetadata service
        conduit.subscribe("onAppsMetadataChange", conduit.applicationLayer.appCore.appManager.model.fillModelsWithMetadataInfo);

        messages.onTopicMsg.addListener("onPopupClose", function (data) {
            var dataObj = JSON.parse(data),
				model = modelsList.GetByID(dataObj.appId);

            if (model && model.popupIds) {
                var modelPopup = model.popupIds;
                if (modelPopup && modelPopup === dataObj.popupId)
                    delete model.popupIds;
            }
        });

        messages.onSysReq.addListener("addMyStuffComponent", function (dataStr, sender, callback) {
            var dataObj = JSON.parse(dataStr);
            var data = { id: dataObj.id, compInstanceId: dataObj.compInstanceId, compName: dataObj.compName };
            serviceLayer.userApps.addApp(data);
            if (callback)
                callback("");
        });

        messages.onSysReq.addListener("onViewRequest", function (dataStr, sender, callback) {
            var dataObj = JSON.parse(dataStr);
            var response = { result: false };

            switch (dataObj.method) {
                case "isMyStuffEnabled":
                    response.result = isMyStuffEnabled();
                    break;
            }
            if (callback) {
                callback(JSON.stringify(response));
            }
        });

        conduit.subscribe("onImagesCacheReady", function () {

            conduit.abstractionlayer.backstage.system.getCurrentViewID(function (response) {
                if (response && response.result) {
                    var currentViewId = response.result;
                    if (typeof (currentViewId) !== "string") {
                        currentViewId = JSON.stringify(currentViewId)
                    }
                    messages.postTopicMsg("applicationLayer.appManager.view.onSaveStateRequest", "applicationLayer.appManager.model", currentViewId);
                }
            });
        });

        conduit.triggerEvent("onInitSubscriber", {
            subscriber: conduit.applicationLayer.appCore.appManager.model,
            dependencies: ["userApps"],
            onLoad: addAppFromCookie
        });
    };

    var initToolbarDesign = function (callback) {
        var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
        conduit.abstractionlayer.commons.repository.getData(ctid + '.skin', false, function (skin) {
            design = settingsObj.design;
            if (skin && !skin.status) {
                skin = JSON.parse(skin.result);
                var settingsSkin = (design.skin && design.skin.background) || {};
                if (!(skin.background.imageBase64 && (settingsSkin.imageUrl34px || settingsSkin.color))) {
                    design.skin = skin;
                }
            }

            design = settingsObj.design;
            design.dialogsDirection = settingsObj.localeRTL ? "RTL" : "LTR";
            user_updates.init(settingsObj.generalData.originalCt.userUpdates);
            design.user_updates = user_updates.data();

            //update the popupManager with the toolbabr direction.
            conduit.applicationLayer.UI.popupManager.setToolbarDir(design.alignMode.toLowerCase());
            callback();
        });
    };

    function initToolbarDirListener() {
        messages.onSysReq.addListener("getToolbarDirection", function (dataStr, sender, callback) {
            design.myStuffEnabled = isMyStuffEnabled();
            callback(JSON.stringify(design));
        });

        messages.onSysReq.addListener("SendUsage", function (dataStr, sender, callback) {
            methods.sendUsage({
                type: "sendToolbarUsage",
                actionType: dataStr,
                additionalUsageInfo: {
                    sourceCompType: sender,
                    gadgetType: "SPLITTER"
                }
            });

        });

    }

    var initGeneralToolbarInfo = function () {
        generalData = settingsObj.generalData;
    };

    var setServerBornDate = function (data) {
        var model = modelsList.GetByID(data.appId);
        model.setAppBornDate(data.data);
    };

    function getBrowserFixedName(browserName) {
        if (browserName === 'Firefox') {
            browserName = 'ff';
        }
        else if (browserName === 'Chrome') {
            browserName = 'chrome';
        }
        return browserName;
    }

    /**
    @request
    @description:  checks if the app has a version data, and test it.
    */
    function checkIfVersionInfoAndTest(currentApp) {

        //alias.
        var compareVersions = conduit.utils.compareVersions;

        var result = true,
			maxValidVersion = true,
			minValidVersion = true;

        //check if the app has a version object property.
        if (currentApp.componentInfoVersion) {

            //make a reference.
            var versionObj = currentApp.componentInfoVersion;

            //check if the user browser matches the browser property of the app. 
            for (var browser in versionObj) {
                if (browser == getBrowserFixedName(browserType)) {

                    //if we have a MAX_VER property we need to test it.
                    if (versionObj[browser].maxVer) {
                        maxValidVersion = compareVersions(version, versionObj[browser].maxVer, "max");
                    }

                    //if we have a MIN_VER property we need to test it.
                    if (versionObj[browser].minVer) {
                        minValidVersion = compareVersions(version, versionObj[browser].minVer, "min");
                    }
                }
            }
        }

        //always return true, unless one of the tests returns false.
        if (maxValidVersion === false || minValidVersion === false) {
            result = false;
        }

        return result;
    }



    var createAppModels = function () {
        var apps = settingsObj.apps;
        for (var i = 0, count = apps.length; i < count; i++) {
            addAppToModel(apps[i]);
        }

        // shrink/unshrink toolbar
        var isToolbarShrinked = repository.getLocalKey('isToolbarShrinked');

        if (isToolbarShrinked && isToolbarShrinked.data == 'true') {
            shrinkToolbar();
        }
        else {
            unShrinkToolbar();
        }

        getAppsMetadata();
        startAppTrackingState();
    };


    var getAppsMetadata = function () {
        //get apps metadata from the service
        var appsMetadata = serviceLayer.appsMetadata.getAppsMetadata();
        fillModelsWithMetadataInfo(appsMetadata);
    };

    var startAppTrackingState = function () {
        //get app tracking state from the service
        serviceLayer.appTracking.invoke();
    };


    function decapitalize(obj) {
        if (obj instanceof Array) {
            var deCapArr = [];
            for (var i = 0; i < obj.length; i++) {
                deCapArr[i] = decapitalize(obj[i]);
            }
            return deCapArr;
        } else if (typeof obj == 'object') {
            var deCapObj = {};
            for (var itemName in obj) {
                var value = obj[itemName];
                itemName = itemName.replace(itemName.charAt(0), itemName[0].toLowerCase());
                deCapObj[itemName] = decapitalize(value);
            }
            return deCapObj;
        }
        return obj;
    }

    /*
    since the metadata from the appsMEtadata service uses capital letters for all members,
    we need to decapitalize them all...
    */
    var decapitalizeMetadata = function (metadata) {
        return decapitalize(metadata);
    }

    var fillModelsWithMetadataInfo = function (appsMetadataValue) {
        if (!appsMetadataValue)
            appsMetadataValue = conduit.backstage.serviceLayer.appsMetadata.getAppsMetadata();
        if (appsMetadataValue) {
            try {
                var gottenAppsWrapper = {};
                //TODO what about MetaDataOfSharedApps?
                var metadataArr = appsMetadataValue.MetaDataOfGottenApps;
                var component, model;
                for (var index in metadataArr) {
                    component = metadataArr[index];
                    model = modelsList.GetByID(component.Id);
                    if (!model) continue; //TODO is this even possible? maybe we should throw an exception.
                    // fill the model with the metadata
                    component = decapitalizeMetadata(component);
                    model.updateMetadata(component);
                    gottenAppsWrapper[component.contentInstanceId] = model;

                    if (model.appType == 'button' && component.componentThumbnailUrl && !(model.viewData && model.viewData.icon)) {
                        model.methods.setIcon(component.componentThumbnailUrl);
                        var dataForView = { appId: model.appId, data: component.componentThumbnailUrl, method: 'setIcon' };
                        sendChangeToView(dataForView);
                    }
                }

                handleHiddenApps(gottenAppsWrapper);
            }
            catch (e) {
                conduit.coreLibs.logger.logError('Failed to fill models with metadata info', { className: "appManager.model", functionName: "fillModelsWithMetadataInfo" }, { error: e });
            }
        }
    };



    function sendReadyToView(isRefresh) {
        conduit.coreLibs.logger.logDebug('Enter sendReadyToView function', { className: "appManager.model", functionName: "sendReadyToView" });
        try {
            var data = {
                design: design,
                generalData: generalData,
                apps: viewData.GetValuesArray(),
                config: settingsObj.config
            };

            //this check is for cases when an external webapp has been updated
            //and we need to reload the view.
            if (conduit.coreLibs.config.isStagedWebappsAvailable()) {
                isRefresh = true;
                conduit.coreLibs.config.clearStagedWebapps();
            }

            if (isRefresh)
                data.isRefresh = true;
            repository.getLocalData('newSettings', function (newSettings) {
                if (newSettings && newSettings.data) {
                    data.isRefresh = true;
                    repository.removeLocalData('newSettings', function () { });
                    removeManagedAppsFromModel();
                }
                conduit.coreLibs.logger.logDebug('Sending model ready to views', { className: "appManager.model", functionName: "sendReadyToView" });
                conduit.coreLibs.logger.performanceLog({
                    from: "Model",
                    action: "Model Ready: ",
                    time: +new Date(),
                    isWithState: ""
                });
                messages.postTopicMsg("applicationLayer.appManager.model.ready", "applicationLayer.appManager.model", JSON.stringify(data));
                isReady = true;
            });
        }
        catch (e) {
            conduit.coreLibs.logger.logError('Failed Sending model ready to views', { className: "appManager.model", functionName: "sendReadyToView" }, { error: e });
        }
    }

    var handleWebAppApiRequest = function (data, sender, callback) {
        var commandRegex = /^cmd:/;
        if (commandRegex.test(data.method)) {
            data.method = data.method.replace(commandRegex, "");
            var method = commandMethods[data.method];
            if (method)
                method(data, sender, callback);
        }
        else {
            // first check if this is a general method, not a model specific.
            if (methods[data.method]) {
                var returnValue = methods[data.method](data.data);
                return runWebappApiCallback(returnValue, callback);
            }
            var model = modelsList.GetByID(sender.appId);
            if (!model) { callback(""); return; }

            if (data.method == "setIcon") {
                model.displayIcon = data.data;
            }
            if (data.method == "setText") {
                model.displayText = data.data
            }
            if (data.method == "setPopup") {
                if (!model || !model.action || !model.action.popup) return;
                model.action.popup.saveSize = data.data.saveSize;
                model.action.popup.resizable = data.data.resizable;
            }
            //find the right app to refresh
            if (data.method == "refreshApp") {
                sender.appId = data.data.appId;
                model = modelsList.GetByID(data.data.appId);
            }

            setDataForOptions();

            model.handleWebAppApiRequest(data, function (response, returnValue) {
                viewData.Add(sender.appId, model.getViewData());
                response.appId = sender.appId;
                if (data.windowId) {
                    response.windowId = data.windowId;
                }
                sendChangeToView(response);
                runWebappApiCallback(returnValue, callback);
            });
        }
    };

    function runWebappApiCallback(returnValue, callback) {
        if (callback) {
            if (typeof returnValue !== 'undefined') {
                // we got a return value from the model's mwthod. We will return it as a response to the callback.
                if (typeof returnValue !== 'string') {
                    returnValue = JSON.stringify(returnValue);
                }
                callback(returnValue);
            }
            else {
                // We will return a simple response object to the callback.
                callback(JSON.stringify({ result: true, status: 0, description: "" }));
            }
        }
    }

    var sendChangeToView = function (data) {
        messages.postTopicMsg("applicationLayer.appManager.model.onAppChange", "applicationLayer.appManager.model", JSON.stringify(data));
    };

    function sendCommandToViews(method, data) {
        messages.postTopicMsg("applicationLayer.appManager.model.onCommand", "applicationLayer.appManager.model", JSON.stringify({ method: method, data: data }));
    }

    function shrinkToolbar() {
        var allModels = modelsList.GetValuesArray();
        for (var i = 0, count = allModels.length; i < count; i++) {
            var model = allModels[i];
            if (model.appType != "embedded" && model.isCollapsed !== undefined) {
                model.methods.collapse();
            }
        }
        //set flag in repository
        repository.setLocalKey('isToolbarShrinked', 'true');
        var excludedTypes = ["embedded"];
        sendCommandToViews("collapse", excludedTypes);
    }

    function unShrinkToolbar() {
        var allModels = modelsList.GetValuesArray();
        for (var i = 0, count = allModels.length; i < count; i++) {
            var model = allModels[i];
            if (model.appType != "embedded" && model.isCollapsed !== undefined) {
                model.methods.expand();
            }
        }
        //set flag in repository
        var excludedTypes = ["embedded"];
        repository.setLocalKey('isToolbarShrinked', 'false');
        sendCommandToViews("expand", excludedTypes);
    }

    var commandMethods = {
        "UNSHRINK_TOOLBAR": function (data, sender, callback) {
            unShrinkToolbar();
            if (callback)
                callback("");
        },
        "SHRINK_TOOLBAR": function (data, sender, callback) {
            shrinkToolbar();
            if (callback)
                callback("");
        },
        "OPTIONS": function (data, sender, callback) {
            conduit.applicationLayer.options.open(data);
            if (callback)
                callback("");
        },
        "HOMEPAGE": function (data, sender, callback) {
            var mainMenu = getAppBySettingsAppType("MAIN_MENU");
            // it is the toolbar homepage, not the browser homepage.
            if (sender && sender.viewId) {
                mainMenu.viewId = sender.viewId;
            }
            openModelLinkInTab(mainMenu);
            if (callback)
                callback("");
        },
        "ABOUT": function (data, sender, callback) {
            conduit.applicationLayer.aboutBox.open();
            if (callback)
                callback("");
        }
    };


    function navigateInCurrentTab(url, callback) {
        conduit.coreLibs.UI.withCurrentTab(function (tabInfo) {
            tabs.navigate(String(tabInfo.windowId), String(tabInfo.tabId), url, "", function () {
                // send usage
                if (callback)
                    callback();
            });
        });
    }

    function openModelLinkInTab(model) {


        var linkAction = model.action.link;
        if (!linkAction)
            return;

        // to support old menus popups. format is : javascript:EBOpenPopHtml('some_url',width,height)
        if (/EBOpenPopHtml/.test(linkAction.url)) {
            var url = linkAction.url;
            var popupData = url.match(/\(+(.*?)\)/)[1].split(',');
            url = popupData[0].replace(new RegExp('\'|\"', 'g'), '');
            var width = popupData[1] || 400,
                height = popupData[2] || 400;

            model.action.popup = {
                url: url,
                width: width,
                height: height,
                showFrame: true
            };
            var obj = {
                appId: model.appId,
                viewId: model.viewId,
                position: {
                    isAbsolute: false
                }
            }

            openPopup(model, obj)
        }
        else {

            if (linkAction.target === 'NEW') {
                var isTabSelected = true;
                tabs.create(linkAction.url, null, isTabSelected, function () {
                });
            }
            else {
                navigateInCurrentTab(linkAction.url);
            }

        }
    }


    /**
    @function
    @description: this function run whenever a userApp with permissions untrusted was clicked. 
    @param: {object} model - the app model.
    @param: {object} obj - data that came from the view.  
    */
    function openTrustedHtml(showDialog) {

        //alias.
        var popup = conduit.abstractionlayer.backstage.popup,
			repository = conduit.coreLibs.repository,
			environment = conduit.abstractionlayer.commons.environment;



        //data to send to the view, to expand the embedded.
        var objData = {
            method: "expand",
            data: {}
        }
        var sender = {
            appId: modelApp.appId
        }

        //this function finally sends the data to the view.
        handleWebAppApiRequest(objData, sender, function () {
            //update repository.
            repository.setLocalKey('isCollapsed_' + modelApp.appId, "false");
        });

        if (showDialog) {

            openTrustedUntrustedDialog("/al/msd/trusted.html#appData=", false, true, false, true);
        }
    }

    function fixExceedingPopup(left, width, callback) {
        getScreenWidth(function (screenWidth) {
            var fixed = false;
            var popupOffset = left + width - screenWidth + 30;
            if (popupOffset > 0) {
                left -= popupOffset;
                fixed = true;
            }
            callback(left, fixed);
        });
    }

    function getScreenWidth(callback) {
        conduit.abstractionlayer.commons.environment.getScreenWidth(function (screenWidth) {
            conduit.abstractionlayer.commons.environment.getScreenOffset(function (screenOffset) {
                if (!screenWidth.status && !screenOffset.status) {
                    callback(screenWidth.result + screenOffset.result.left);
                }
                else {
                    callback(screen.availLeft + screen.availWidth);
                }
            });
        });
    }

    /**
    @function
    @description: this function run whenever a userApp with permissions untrusted was clicked. 
    @param: {object} model - the app model.
    @param: {object} obj - data that came from the view.  
    */
    function handleUserApp(model, obj) {

        modelApp = model;
        objApp = obj;

        var appType = modelApp.appType;

        //alias
        var popup = conduit.abstractionlayer.backstage.popup,
			repository = conduit.coreLibs.repository,
			environment = conduit.abstractionlayer.commons.environment;

        //check repository for user untrusted settings.
        var isEnableAllDialogs = repository.getLocalKey('isEnableAllDialogs');
        var isEnableThisAppDialog = repository.getLocalKey(modelApp.appId + 'isEnableThisAppDialog');
        //we check repository if we have a key which tell us
        //that the user asked to disable all dialogs.

        if (isEnableAllDialogs && isEnableAllDialogs.data == "false") {
            if (appType == 'button') {
                openPopup(modelApp, objApp)
            }
            else if (appType == 'embedded') {
                openTrustedHtml(showDialog = true);
            }
        }
        //we got false result from the last check, so we 
        //check the repository again if we have a key which tell us
        //that the user asked to disable this app dialog.
        else if (isEnableThisAppDialog && appType == 'button') {
            openPopup(modelApp, objApp)
        }
        else {
            openTrustedUntrustedDialog("/al/msd/untrusted.html#appData=", true, false, false, true);
        }
    }

    function openTrustedUntrustedDialog(relativeUrl, isModal, closeOnExternalClick, hideOnExternalClick, isWebApp) {
        if (untrustedDialogOpen) {
            return;
        }
        untrustedDialogOpen = true;
        //get toolbar direction.
        var dir = design.alignMode.toLowerCase();
        //if direction rtl set new left value.
        if (dir == 'rtl') {
            left -= 300;
        }

        //default app left position on the toolbar.
        var left = objApp.position.left + 12;
        var top = objApp.position.top;

        fixExceedingPopup(left, 350, function (fixedLeft, fixed) {
            if (fixed) {
                dir = (dir == 'rtl') ? 'customRightRtl' : 'customRight';
                // the left position was fixed (reduced) therefore, we need to change the direction of the dialog to point to the right.
            }

            var appName = (modelApp.viewData && modelApp.viewData.text) ? modelApp.viewData.text : modelApp.displayText;
            if (!appName && modelApp.metadata && modelApp.metadata.componentName) {
                appName = modelApp.metadata.componentName;
            }

            //set data to pass as query string to untrusted.html. 
            var appData = {
                thumbnail: modelApp.metadata.componentThumbnailUrl,
                appName: appName,
                dir: dir,
                leftOffset: left - fixedLeft
            }

            var applicationDirName = conduit.coreLibs.config.getApplicationDirName();
            //set url for popup.
            var url = environment.getApplicationPath().result + applicationDirName + relativeUrl + encodeURIComponent(JSON.stringify(appData));

            //open the popup with 1px width and height.
            var popup = conduit.abstractionlayer.backstage.popup;
            popup.open(top, fixedLeft, 1, 1, url, null, isModal, closeOnExternalClick, hideOnExternalClick, isWebApp, { isInnerTransparent: true, isDialog: true }, function (data) {
                //save the generated popupId
                popupId = data.result;
            });
        });
    }

    function openPopup(model, obj) {
        //make a reference to the relevant model by the appId.
        /*var model = modelsList.GetByID(obj.appId);*/
        //get the popup data from the model.
        var popupData = model.action.popup,
				popupUrlData = {
				    appId: obj.appId,
				    context: "popup",
				    viewId: obj.viewId,
				    frameTitle: model.displayText,
				    icon: model.viewData.icon
				};

        if (!/^file:\/\//.test(popupData.url))
            popupUrlData.info = model.getAppInfo();

        //set popup data.
        var objData = {
            appData: popupUrlData,
            url: popupData.url,
            width: parseInt(popupData.width, 10),
            height: parseInt(popupData.height, 10),
            showFrame: popupData.showFrame,
            allowScrollInFrame: popupData.allowScrollInFrame,
            closeOnExternalClick: popupData.closeOnExternalClick,
            title: obj.title ? obj.title : undefined,
            position: obj.position,
            viewId: obj.viewId,
            isShowMininmizedIcon: popupData.isShowMininmizedIcon,
            loggerData: obj.loggerData,
            resizable: popupData.resizable,
            saveSize: popupData.saveSize,
            saveLocation: popupData.saveLocation
        };

        var popupId = model.popupIds;
        if (popupId) {
            objData.appData.popupId = popupId;
        }
        popupData.withUsage = (typeof (popupData.withUsage) !== 'undefined') ? popupData.withUsage : true;
        conduit.applicationLayer.UI.popupManager.open(objData, popupUrlData, function (popupId) {
            var startDate = Date.parse(Date());
            model.popupIds = popupId;
            if (popupData.withUsage) {
                methods.sendUsage({
                    type: "sendToolbarComponentUsage",
                    appId: obj.appId,
                    actionType: "GADGET_OPEN",
                    additionalUsageInfo: {
                        sourceCompType: "Button",
                        gadgetType: "GADGET",
                        gadgetUrl: model.action.popup.url
                    }
                });
            }
            var popup = conduit.applicationLayer.UI.popupManager.getPopup({ appId: obj.appId, popupId: popupId, viewId: obj.viewId });

            popup.onClose(function () {
                if (popupData.withUsage) {
                    methods.sendUsage({
                        type: "sendToolbarComponentUsage",
                        appId: obj.appId,
                        actionType: "GADGET_CLOSE",
                        additionalUsageInfo: {
                            sourceCompType: "Button",
                            gadgetType: "GADGET",
                            gadgetUrl: model.action.popup.url,
                            durationSec: (Date.parse(Date()) - startDate) / 1000
                        }
                    });
                }
            }, popupId);
        });
    }

    var controllerActions = {
        'user_updates_action': function () {
            user_updates.action();
        },
        mystuff: function () {
            if (!myStuffUrl) {
                var myStuffData = serviceLayer.login.getMyStuffData();
                if (myStuffData) {
                    myStuffUrl = myStuffData.addStuffWebUrl.replace("SEARCH_TERM", "") || "http://apps.conduit.com"; // will be taken from the setup.txt
                    tabs.create(myStuffUrl, null, true, function () { });
                }
            }
            else
                tabs.create(myStuffUrl, null, true, function () { });

            methods.sendUsage({
                type: "sendToolbarUsage",
                actionType: "TOOLBAR_PLUS_BUTTON_CLICK"
            });

        },
        link: function (dataObj) {
            var model = modelsList.GetByID(dataObj.appId);
            if (model) {
                model.viewId = dataObj.viewId;
                openModelLinkInTab(model);
                methods.sendUsage({
                    type: "sendToolbarComponentUsage",
                    appId: dataObj.appId,
                    actionType: "BUTTON_CLICK"
                });
            }
            else {
                conduit.coreLibs.logger.logError('App with appId ' + dataObj.appId + ' is missing in the modelsList', { className: "appManager.model", functionName: "controllerActions.link" });
            }

        },
        popup: function (obj) {

            conduit.abstractionlayer.backstage.system.getCurrentViewID(function (response) {
                if (typeof (response) !== 'object') {
                    try {
                        response = JSON.parse(response);
                    } catch (e) {
                        conduit.coreLibs.logger.logError('Failed to parse response.', { className: "webappApi.commons", functionName: "initListeners" }, { code: conduit.coreLibs.logger.GeneralCodes.GENERAL_ERROR, error: e });
                        return;
                    }
                }

                var viewId = response.result;
                if (viewId == obj.viewId) {
                    //get the model of this appId.
                    var model = modelsList.GetByID(obj.appId);
                    if (model) {
                        if (obj.isEmbeddedTrusted) {
                            modelApp = model;
                            objApp = obj;
                            openTrustedHtml(showDialog = true);
                        }
                        else {
                            ((model.isUserApp || model.isUserWebApp) && model.permissions.isUntrusted === true || model.action.embedded) ?
										handleUserApp(model, obj) : openPopup(model, obj);
                        }
                    }
                    else {
                        conduit.coreLibs.logger.logError('App with appId ' + obj.appId + ' is missing in the modelsList', { className: "appManager.model", functionName: "controllerActions.popup" });
                    }
                }
            });
        },
        expand: function (obj) {
            var model = modelsList.GetByID(obj.appId);
            if (model) {
                model.methods.expand();
            }
            else {
                conduit.coreLibs.logger.logError('App with appId ' + obj.appId + ' is missing in the modelsList', { className: "appManager.model", functionName: "controllerActions.expand" });
            }
        },
        menu: function (obj) {
            conduit.applicationLayer.UI.menuManager.openMenu(obj);
        },
        closeMenu: function (obj) {
            conduit.applicationLayer.UI.menuManager.close(obj.viewId);
        },
        contextMenu: function (menuOptions) {
            try {
                var menuManager = conduit.applicationLayer.UI.menuManager;
                var contextMenuType = menuManager.MenusConst.TOOLBAR_CONTEXT_MENU;
                if (menuOptions.appId) {
                    var app = getAppById(menuOptions.appId);
                    contextMenuType = app.appGuid ? menuManager.MenusConst.GOTTEN_APPS_CONTEXT_MENU : menuManager.MenusConst.OTHER_APPS_CONTEXT_MENU;
                    if (app.metadata && app.metadata.publisherInfo) {
                        menuOptions.publisherName = app.metadata.publisherInfo.publisherName ? app.metadata.publisherInfo.publisherName : 'the publisher';
                        menuOptions.moreFromThisPublisherUrl = app.metadata.publisherInfo.moreFromThisPublisherUrl;
                        menuOptions.shareUrl = app.metadata.componentPageUrl;
                        menuOptions.appName = app.metadata.componentName;
                        menuOptions.appImage = app.metadata.componentThumbnailUrl;
                    }
                }
                else {
                    menuOptions.appId = menuManager.MenusConst.TOOLBAR_CONTEXT_MENU;
                }
                menuManager.openContextMenu(contextMenuType, menuOptions);
                methods.sendUsage({
                    type: "sendToolbarUsage",
                    actionType: "PUBLISHER_CONTEXT_MENU_OPEN"
                });
            }
            catch (e) {
                conduit.coreLibs.logger.logError('Failed to open context menu. contextMenuType: ' + contextMenuType + " menuOptions:" + JSON.stringify(menuOptions), { className: "appManager.model", functionName: "controllerActions.contextMenu" });
            }
        }
    };

    var handleClickEvent = function (dataObj) {

        //this topic message is for the bg page that is waiting for this click.
        //if we here because of right click we send no topic. 
        if (dataObj.method !== 'contextMenu') {
            messages.postTopicMsg("webAppApi.app.icon.clickEvent." + dataObj.appId, "applicationLayer.appManager.model", JSON.stringify(dataObj));
        }

        //take the method name
        var method = dataObj.method;
        if (method) {
            delete dataObj.method;
            controllerActions[method](dataObj);
        }
        else {
            var command = dataObj.command;
            if (command) {
                delete dataObj.command;
                commandMethods[command](dataObj);
            }
        }
    }

    function openWelcomePage(ctid) {
        var shouldOpen = absRepository.getKey(ctid + ".openThankYouPage");
        var isWelcomPage = repository.getLocalKey("isWelcomPage");
        if (!isWelcomPage && (shouldOpen.result !== "FALSE" && shouldOpen.result !== "false" || shouldOpen.status)) {
            //get url from generalData
            conduit.abstractionlayer.commons.context.getUserID(function (response) {
                var userid = response.result;
                var sessionId = conduit.abstractionlayer.commons.repository.getKey(ctid + ".installSessionId").result || "-1"
                var toolbarVersion = conduit.abstractionlayer.commons.environment.getEngineVersion().result;
                var wellcomePageUrl = generalData.webServerUrl + "setUpFinish/?CUI=" + userid + "&sessionId=" + sessionId + "&toolbarVersion=" + toolbarVersion;
                // no new tab because of ie bug
                tabs.create(wellcomePageUrl, null, true, function () {
                    sendUsage({
                        type: "sendToolbarUsage",
                        actionType: "OPEN_WELCOME_PAGE",
                        additionalUsageInfo: {
                            wellcomePageUrl: wellcomePageUrl
                        }
                    });
                    repository.setLocalKey("isWelcomPage", true);
                });
            });
        }
    };


    function setDataForOptions() {

        var count = 1;
        var arrApps = modelsList.IndexerArray,
				len = arrApps.length;

        var objAppsForOptions = {
            appsBeforeScroll: [],
            publisherApps: [],
            myStuff: []
        }
        for (var i = 0; i < len; i++) {
            var app = arrApps[i];
            if (app.value.getAppIsShowStatus()) {
                app.value.index = count;
                count++;
            }
            else
                app.value.index = null;
            if (app.value.isUserApp) {
                objAppsForOptions.myStuff.push(app);
            }
            else if (app.value.viewData.allowScroll) {
                objAppsForOptions.publisherApps.push(app);
            }
            else {
                objAppsForOptions.appsBeforeScroll.push(app)
            }
        }
        optionsData = objAppsForOptions;
        numberOfActiveApps = count;
    }

    function initFromSettings(callback) {
        settingsObj = conduit.applicationLayer.appCore.loader.getSettingsData();
        //we set the global 'userAppsLocation' property for later use.
        userAppsLocation = settingsObj && settingsObj.generalData && settingsObj.generalData.userAppsLocation || "AFTER_SEARCH";
        //TODO consider cloning it
        initToolbarDesign(function () {
            initGeneralToolbarInfo();
            createAppModels();
            initToolbarDirListener();
            handleHiddenApps();
            callback();
        });
    }

    function refreshSettings(settings, updateView) {
        if (settings)
            settingsObj = settings;
        modelsList.Clear();
        viewData.Clear();

        initFromSettings(function () {
            if (updateView !== false)
                sendReadyToView(true);
        });
    }

    function addApp(appData) {
        if (appData.appType == "WEBAPP") {
            appData.viewData.appType = "WEBAPP";
        }
        if (addAppToModel(appData)) {
            if (appData.originalAppId) {
                appData.viewData.originalAppId = appData.originalAppId;
            }
            if (appData.update) {
                appData.viewData.replace = true;
                // clear the flag to avoid tyring updating empty app in refresh
                appData.update = false;
            }
            messages.postTopicMsg("applicationLayer.appManager.model.onAddApp", "applicationLayer.appManager.model",
            JSON.stringify({ viewData: appData.viewData, position: 0 }));
        }
    }

    function addAppToModel(appData) {
        appData.userAppsLocation = userAppsLocation;
        //we check each app if it has a version property. if so, we check if the version is valid.
        var isValidVersion = checkIfVersionInfoAndTest(appData);

        //if false, we ignore this app.
        if (!isValidVersion) {

            //make sure to remove it from state if exist.
            messages.postTopicMsg("applicationLayer.appManager.view", "applicationLayer.appManager.model",
            JSON.stringify({ method: "removeApp", data: appData }));

            return;
        }

        if (!appData.viewData || !appData.appId)
            return false;

        // do not add app if it is already in the model, except for webapps
        if (!appData.update && modelsList.GetByID(appData.appId) && appData.appType !== "WEBAPP" && !appData.isOptimizer) {
            return false;
        }

        var modelType = appData.viewData.viewType;
        model = new conduit.applicationLayer.appCore.models[modelType](appData);
        if (appData.appType === "WEBAPP" || appData.isOptimizer) {
            modelsList.Replace(model.appId, model);
            viewData.Replace(model.appId, model.getViewData());
            //update app viewData
            appData.viewData = model.getViewData();
        }
        else if (appData.update) {
            modelsList.Replace(model.appId, model);
            viewData.Replace(model.appId, model.getViewData());
            appData.viewData = model.getViewData();
        }
        else {
            modelsList.Add(model.appId, model);
            viewData.Add(model.appId, model.getViewData());
        }
        //TODO: maybe use appData.viewData = model.getViewData() here and avoid next block

        if (appData.viewData && !appData.viewData.design) {
            // the design is used in the view template for the textDecoration.
            appData.viewData.design = design;

            if (appData.isOptimizer) {
                appData.viewData.isOptimizer = true;
            }
        }

        // for managed apps, add the managed id to the manager
        if (appData.managed && appData.managed.managerId) {
            var managerId = appData.managed.managerId;
            var managedAppsIds = managerAppsList[managerId];
            if (managedAppsIds) {
                if (managedAppsIds.indexOf(appData.appId) < 0) {
                    managedAppsIds.push(appData.appId);
                }
            }
            else {
                managedAppsIds = [];
                managerAppsList[managerId] = managedAppsIds;
                managedAppsIds.push(appData.appId);
            }
        }

        return true;
    };

    function sendUsage(data, cb) {
        cb = cb || function () { };
        methods.sendUsage(data, cb);
    };

    function openAppByGuid(data) {
        methods.openAppByGuid(data);
    };

    function afterViewReady() {
        //implement when needed.
    };

    function getPermission(id, type) {
        return methods.getPermission(id, type);
    };
    function getAdvancedPermission(id, type) {
        return methods.getAdvancedPermission(id, type);
    };

    function checkIfToolbarEnabled() {
        var response = conduit.abstractionlayer.commons.repository.getKey(ctid + ".toolbarDisabled");
        var toolabrDisabled;
        if (response && !response.status) {
            toolabrDisabled = JSON.parse(response.result);
            if (toolabrDisabled) {
                conduit.abstractionlayer.commons.repository.removeKey(ctid + ".toolbarDisabled");
                sendUsage({
                    type: "sendToolbarUsage",
                    actionType: "ENABLE_TOOLBAR_DLG_ENABLE"
                });
            }
        }
    }

    function setToolbarBackground() {
        conduit.abstractionlayer.backstage.browser.onBackgroundImageChanged.addEventListener(function (image) {
            setSkin({ background: { imageBase64: image.result} });
        });
    }

    function addAppFromCookie() {
        conduit.coreLibs.logger.logDebug('Adding new apps to toolbar');
        //Check if this is the first time using key from config         
        if (conduit.abstractionlayer.commons.repository.hasKey(ctid + ".isFirstTimeToolbarLoading").result) {
            conduit.coreLibs.logger.logDebug('All applications were already loaded, return');
            return;
        }

        //if the key doesn't exist add it for the next loads
        conduit.abstractionlayer.commons.repository.setKey(ctid + ".isFirstTimeToolbarLoading", "false");

        //get cookie domain from repository
        var cookieDomain = "";
        var response = conduit.abstractionlayer.commons.repository.getKey(ctid + ".CECookieDomainUrl");
        if (response && !response.status) {
            cookieDomain = response.result;
        }
        else {
            conduit.coreLibs.logger.logDebug('The key, CECookieDomainUrl, doesn\'t exist');
            return;
        }
        var cookieName = "CEInstallParams";
        var appGuid = "";

        //according to cookie details (name & domain) use abstraction layer to get the cookie and get app ID from cookie
        conduit.abstractionlayer.backstage.browserData.readCookies(cookieName, cookieDomain, function (response) {
            if (!response.status) {
                var cookie = JSON.parse(response.result);
                appGuid = cookie.appID;

                //delete cookie (after getting the information)
                conduit.abstractionlayer.backstage.browserData.deleteCookie(cookieName, cookieDomain, null);

                //add the app to the toolbar	
                setTimeout(function () { addUserApp(appGuid, appGuid, "", { openLastPopup: false }); }, 2000);

                //save prefs
                conduit.abstractionlayer.commons.repository.saveAllKeys();
            }
            else {
                conduit.coreLibs.logger.logError("Failed to  get cookie " + cookieName + " at domain " + cookieDomain, { className: "appManager.model", functionName: "addAppFromCookie" }, { error: e });
            }
        });


    }

    function getManagerAppsList() {
        return managerAppsList;
    }

    function getManagedAppsArray() {
        var models = modelsList.GetValuesArray();
        var model;
        var managedApps = [];

        for (var index in models) {
            model = models[index];
            if (model.managed) {
                managedApps.push(model);
            }
        }
        return managedApps;
    }

    function removeManagedAppsFromModel() {
        var managedAppsArr = getManagedAppsArray();
        var managedApp;
        for (var i = 0; i < managedAppsArr.length; i++) {
            managedApp = managedAppsArr[i];
            conduit.webappApi.advanced.managed.apps.remove(managedApp.appGuid, function () { });
        }
    }

    function replaceActiveCTID(activeCTID) {
        serviceLayer.serviceMap.replaceActiveCTID(activeCTID);
    }

    function getToolbarLocale() {
        return settingsObj.locale;
    }

    function getSettingsGeneralData() {
        return generalData;
    }

    function init() {
        logger.logDebug('applicationLayer.appCore.appManager.model.init');
        try {
            conduit.coreLibs.logger.performanceLog({ from: "Model - init", action: " start init app manager model: ", time: +new Date(), isWithState: "" });
            initListeners();
            initFromSettings(function () {
                handleLoginReady();
                sendReadyToView();
                setDataForOptions();
                checkIfToolbarEnabled();
                // Used for FF personas
                if (browserType == 'Firefox') {
                    setToolbarBackground();
                }
                conduit.coreLibs.logger.performanceLog({ from: "Model - init", action: "trigger event model ready: ", time: +new Date(), isWithState: "" });
                conduit.triggerEvent("onReady", { name: 'applicationLayer.appCore.appManager.model' });
            });
        }
        catch (e) {
            logger.logError('Failed to init model', { className: "appManager.model", functionName: "init" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e, reportToServer: true });
        }
    };

    return {
        init: init,
        afterViewReady: afterViewReady,
        refreshSettings: refreshSettings,
        addApp: addApp,
        setDataForOptions: setDataForOptions,
        getModelsList: getModelsList,
        getViewData: getViewData,
        sendUsage: sendUsage,
        openWelcomePage: openWelcomePage,
        getPermission: getPermission,
        getAdvancedPermission: getAdvancedPermission,
        openAppByGuid: openAppByGuid,
        getAppById: getAppById,
        isMyStuffEnabled: isMyStuffEnabled,
        addUserApp: addUserApp,
        getToolbarLocale: getToolbarLocale,
        fillModelsWithMetadataInfo: fillModelsWithMetadataInfo,
        getManagerAppsList: getManagerAppsList,
        removeManagedAppsFromModel: removeManagedAppsFromModel,
        replaceActiveCTID: replaceActiveCTID,
        getSettingsGeneralData: getSettingsGeneralData
    };

})());

﻿conduit.register("applicationLayer.appCore.models.base", function (appData) {

    var that = this;

    //aliases.
    var repository = conduit.coreLibs.repository;

    if (!appData) return;

    this.appId;
    this.appGuid;
    this.webappGuid;
    this.appClientGuid;
    this.appType;
    this.allowScroll;
    this.action;
    this.index;
    this.icons = {
        optionsIcon: null,
        thumbnail: null
    };
    this.isUserApp = !!appData.isUserApp;
    this.isUserWebApp = !!appData.isUserWebApp;
    this.isPersonalApp = !!appData.isPersonalApp;
    this.isDeveloperApp = !!appData.isDeveloperApp;
    this.option = { url: "" };
    this.permissions = { isUntrusted: false };
    this.update = { url: "", version: "" };
    this.viewData = {};
    this.methods = {};
    this.metadata = {};
    this.userAppsLocation = appData.userAppsLocation || "AFTER_SEARCH";
    this.firstTab;

    this.apiPermissions = setAppPermissions();
    this.apiAdvancedPermissions = setAppAdvancedPermissions();
    this.init = function () {
        this.appFolder = appData.appType;
        this.appId = appData.appId;
        this.appGuid = appData.appGuid ? appData.appGuid : null;
        this.webappGuid = appData.webappGuid ? appData.webappGuid : null;
        this.appClientGuid = appData.appClientGuid ? appData.appClientGuid : null;
        this.permissions.isUntrusted = appData.data && appData.data.isUntrusted ? appData.data.isUntrusted : false;
        this.metadata = appData.data ? appData.data : {};
        this.appType = appData.viewData.viewType;
        this.setViewData();
        this.displayText = appData.displayText;
        this.displayIcon = appData.displayIcon;
    };

    this.setAppIsShowStatus = function (appId, val) {
        repository.setLocalKey(appId + 'isDisplayed', val);
    }

    this.getAppIsShowStatus = function () {
        var options = conduit.coreLibs.config.getAppOptions(this.appId);
        return !options || (options && options.disabled !== true);
    }

    this.setViewData = function () {
    };

    this.getViewData = function () {
        return this.viewData
    };
    this.getAction = function () {
        return this.action;
    };

    this.getAppBornDate = function () {
        var status = repository.getLocalKey(this.appId + ".bornDate");
        if (status && status.data) {
            try {
                status = JSON.parse(status.data).Response;
            } catch (e) {
                status = null;
            }
            return status
        }
        return null;
    };

    this.setAppBornDate = function (date) {
        repository.setLocalKey(this.appId + ".bornDate", date);
    };

    this.updateMetadata = function (data) {

        this.appGuid = data.contentInstanceId;
        this.metadata = data;
    };

    this.setEnabledInHidden = function (enabled) {
        this.enabledInHidden = enabled;
    };

    this.isEnabledInHidden = function () {
        return this.enabledInHidden;
    };


    this.handleWebAppApiRequest = function (dataObj, callback) {
        if (this.methods[dataObj.method]) {
            var returnValue = this.methods[dataObj.method](dataObj.data);
            callback(dataObj, returnValue);
        }
    };
    function handleFirstWindow(response) {
        var window = response.result || response;
        conduit.abstractionlayer.backstage.tabs.getSelected(String(window.windowId), function (response) {
            var tabInfo = response.result || response;
            that.firstTab = {
                url: tabInfo.url,
                title: tabInfo.title
            }
        });

    }

    function setAppPermissions() {
        var apiPermissions = appData.data && appData.data.data && appData.data.data.popHtml ? appData.data.data.popHtml.apiPermissions : (appData.data ? appData.data.apiPermissions : undefined);
        var settingsObj = conduit.applicationLayer.appCore.loader.getSettingsData();

        if (settingsObj.generalData.allowNonPrivacyFunctions || that.isUserApp) {
            apiPermissions = apiPermissions || {};
            if (that.isUserApp) {
                apiPermissions.sslGranted = false;
            }
            var mainFrameTitle = (typeof (apiPermissions.getMainFrameTitle) == 'boolean') ? apiPermissions.getMainFrameTitle : true;
            var mainFrameUrl = (typeof (apiPermissions.getMainFrameUrl) == 'boolean') ? apiPermissions.getMainFrameUrl : true;
            var searchTerm = (typeof (apiPermissions.getSearchTerm) == 'boolean') ? apiPermissions.getSearchTerm : true;

            $.extend(true, apiPermissions, {
                getMainFrameTitle: mainFrameTitle,
                getMainFrameUrl: mainFrameUrl,
                getSearchTerm: searchTerm
            });
        }
        return apiPermissions
    }

    function setAppAdvancedPermissions() {
        var apiAdvancedPermissions = appData.data && appData.data.data && appData.data.data.popHtml ? appData.data.data.popHtml.apiAdvancedPermissions : (appData.data ? appData.data.apiAdvancedPermissions : undefined);
        return apiAdvancedPermissions
    }

    // Do this to get window information for BC API in the first window
    conduit.abstractionlayer.backstage.windows.getLastFocused(handleFirstWindow);
    //    var isShow = function () { return true };



    //   var getAppVisibleKeyfName = function () {
    //        var strKeyName = appId + ".isShow";
    //    };
});

// Info required for BC API:
conduit.applicationLayer.appCore.models.base.prototype.getAppInfo = function () {
    var self = this;
    if (!this.baseAppInfo) {
        var absCommons = conduit.abstractionlayer.commons,
		browserInfo = absCommons.environment.getBrowserInfo().result,
		osInfo = absCommons.environment.getOSInfo().result;
        this.baseAppInfo = {};

        this.baseAppInfo.platform = {
            browser: browserInfo.type,
            browserVersion: browserInfo.version,
            locale: browserInfo.locale,
            OS: osInfo.type,
            OSVersion: osInfo.version
        };

        this.baseAppInfo.tabInfo = this.firstTab;
        
        var activeCTID = conduit.backstage.serviceLayer.login.getActiveCTID();

        with (absCommons.context) {
            self.baseAppInfo.toolbar = {
                id: activeCTID,
                oCtid: conduit.abstractionlayer.commons.context.getCTID().result,
                name: getToolbarName().result,
                downloadUrl: getDownloadUrl().result,
                version: absCommons.environment.getEngineVersion().result,
                cID: window.chrome && chrome.extension ? chrome.extension.getURL('').replace("chrome-extension://", "").replace("/undefined", "").replace("/", "") : "",
                locale: conduit.applicationLayer.appCore.appManager.model.getToolbarLocale()
            };
        }
    }
    if (!this.isPersonalApp) {
        if (!this.apiPermissions || this.apiPermissions[conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_TITLE] !== true) {//model.getPermission is not available at this point
            if (this.baseAppInfo.tabInfo && (this.baseAppInfo.tabInfo.title || this.baseAppInfo.tabInfo.title == "")) {
                delete this.baseAppInfo.tabInfo.title;
            }
        }
        if (!this.apiPermissions || this.apiPermissions[conduit.utils.apiPermissions.consts.TYPE.GET_MAIN_FRAME_URL] !== true) {//model.getPermission is not available at this point
            if (this.baseAppInfo.tabInfo && (this.baseAppInfo.tabInfo.url || this.baseAppInfo.tabInfo.url == "")) {
                delete this.baseAppInfo.tabInfo.url;
            }
        }
    }
    return $.extend({}, this.baseAppInfo, { appId: this.appId, isUserAdded: this.isUserApp || this.isUserWebApp, apiPermissions: this.apiPermissions, originalHeight: this.viewData.embedded && this.viewData.embedded.size && this.viewData.embedded.size.originalHeight });
}
﻿conduit.register("applicationLayer.appCore.models.button", function (appData) {
    conduit.applicationLayer.appCore.models.base.call(this, appData);
    var that = this;
    this.isMinimized = false;
    this.popupIds = {};
    this.viewText = "";
    this.viewtooltip;
    this.viewBadge = { color: "red", text: "" };
    this.icons.viewIcon;
    this.isCollapsed = false;
    this.action = {
        popup: { url: "", width: 0, height: 0, showFrame: true, isModal: false, allowScrollInFrame: { vScroll: false, hScroll: false} },
        link: { url: "", target: "TAB"} // WINDOW, TAB , SELf
    };
    this.managed = appData.managed;

    //we need this properties in case of external webapp in order to build a BGpage path.
    if (appData.pages) {
        this.pages = appData.pages;
    }
    if (appData.version) {
        this.version = appData.version;
    }
    if (appData.baseAppType) {
        this.baseAppType = appData.baseAppType;
    }
    this.setViewData = function () {
        if (appData.popupData) {
            that.action.popup.url = conduit.coreLibs.aliasesManager.replaceAliases(appData.popupData.url);
            that.action.popup.width = appData.popupData.size ? appData.popupData.size.width : appData.popupData.width;
            that.action.popup.height = appData.popupData.size ? appData.popupData.size.height : appData.popupData.height;
            that.action.popup.showFrame = appData.popupData.showFrame;
            that.action.popup.isModal = appData.popupData.isModal;
            that.action.popup.closeOnExternalClick = appData.popupData.closeOnExternalClick;
            that.action.popup.allowScrollInFrame = appData.popupData.allowScrollInFrame;
            that.action.popup.saveSize = (typeof (appData.popupData.saveSize) != 'undefined') ? //backward compitability, appType "BUTTON" used to seperate old toolbar buttons from SB buttons
                                                appData.popupData.saveSize : (appData.appType == "BUTTON" ? true : false);
            that.action.popup.resizable = (typeof (appData.popupData.resizable) != 'undefined') ? //backward compitability
                                                appData.popupData.resizable : (appData.appType == "BUTTON" ? true : false);
            that.action.popup.saveLocation = (typeof (appData.popupData.saveLocation) != 'undefined') ? //backward compitability
                                                appData.popupData.saveLocation : (appData.appType == "BUTTON" ? true : false);
            that.action.popup.isShowMininmizedIcon = (typeof (appData.popupData.isShowMininmizedIcon) !== 'undefined') ?
				appData.popupData.isShowMininmizedIcon : true;
            that.action.popup.withUsage = (typeof (appData.popupData.withUsage) !== 'undefined') ?
				appData.popupData.withUsage : true;
        }
        if (appData.linkData) {
            //TODO - remove from the app model
            if (!isPopupNotLink(appData.linkData.url)) {
                that.action.link.url = appData.linkData.url;
                that.action.link.target = appData.linkData.target;
            }
            else {
                convertLinkToPopup();
            }
        }

        this.viewData = appData.viewData;
        this.viewData.appId = that.appId;
        this.viewData.isShow = that.getAppIsShowStatus(that.appId);
        this.viewData.userAppsLocation = that.userAppsLocation;
        this.viewData.isUserApp = that.isUserApp;
        this.viewData.isUserWebApp = that.isUserWebApp;
        this.viewData.badge = that.viewBadge;
        this.viewData.settingsAppType = appData.appType;
        if (that.isUserApp || (appData.data && appData.data.appGuid) || (appData.webappGuid)) {
            if (!this.viewData.tooltip) {
                this.viewData.tooltip = this.viewData.text || (appData.data && appData.data.button && appData.data.button.buttonTooltip);
            }
            if (!appData.webappGuid) { // we allow to add text to webapps
                this.viewData.text = "";
            }
        }
        this.viewData.action = that.action;
        if (this.viewData.managed && !this.viewData.managed.visible == true) {
            this.viewData.width = 0;
        }

    };

    var convertLinkToPopup = function () {
        var strURL = appData.linkData.url
        that.action.popup.url = strURL.substring(strURL.indexOf("(") + 1, strURL.indexOf(","));
        that.action.popup.url = that.action.popup.url.replace(/\\'/g, "");
        that.action.popup.url = that.action.popup.url.replace(/"/g, '');
        that.action.popup.url = that.action.popup.url.replace(/'/g, "");
        that.action.popup.width = parseInt(strURL.substring(strURL.indexOf(",") + 1, strURL.lastIndexOf(",")));
        that.action.popup.height = parseInt(strURL.substring(strURL.lastIndexOf(",") + 1, strURL.indexOf(")")));
        that.action.popup.showFrame = true;
        that.action.popup.isModal = false;
        that.action.popup.closeOnExternalClick = false;
        that.action.popup.allowScrollInFrame = { vScroll: true, hScroll: true };
        appData.viewData.method = "popup";
    };

    var isPopupNotLink = function (strURL) {
        if (strURL && strURL.indexOf("EBOpenPopHtml") != -1)
            return true;
        return false;
    };

    this.methods = {
        hideApp: function (bIsVisible) {
            that.bIsVisible = bIsVisible;
        },
        showApp: function (bIsVisible) {
            that.bIsVisible = bIsVisible;
        },
        onMinimizeToggleIcon: function (oData) {
            if (oData) {
                that.viewData.isMinimized = oData.isMinimized;
            }
        },
        collapse: function () {
            that.isCollapsed = true;
        },
        expand: function () {
            that.isCollapsed = false;
        },
        setBadgeBackgroundColor: function (color) {
            that.viewBadge.color = color;
        },
        setBadgeText: function (text) {
            that.viewBadge.text = text;
        },
        setIcon: function (url) {
            that.viewData.icon = url;
            that.icons.viewIcon = url;
        },
        setText: function (text) {
            that.viewText = text;
        },
        setTooltip: function (text) {
            that.viewtooltip = text;
        },
        setPopup: function (popupOptions) {
            if (popupOptions.url !== undefined)
                that.action.popup.url = popupOptions.url;

            if (popupOptions.size !== undefined) {
                if (popupOptions.size.width !== undefined)
                    that.action.popup.width = popupOptions.size.width;

                if (popupOptions.size.height !== undefined)
                    that.action.popup.height = popupOptions.size.height;
            }

            if (popupOptions.showFrame !== undefined)
                that.action.popup.showFrame = popupOptions.showFrame;

            if (popupOptions.closeOnExternalClick !== undefined)
                that.action.popup.closeOnExternalClick = popupOptions.closeOnExternalClick;

            if (popupOptions.allowScrollInFrame !== undefined) {
                that.action.popup.allowScrollInFrame = popupOptions.allowScrollInFrame;
            }

        }
    };
    this.init();
});
conduit.applicationLayer.appCore.models.button.prototype = new conduit.applicationLayer.appCore.models.base();
conduit.applicationLayer.appCore.models.button.constructor = conduit.applicationLayer.appCore.models.button; 

﻿conduit.register("applicationLayer.appCore.models.menu", function (appData) {
    conduit.applicationLayer.appCore.models.base.call(this, appData);
    var that = this;
    this.popupIds = [];
    this.icons.viewIcon;
    this.isCollapsed = false;
    this.action = {
        popup: { url: "", width: 0, height: 0, showFrame: true, isModal: false },
        link: { url: "", target: "TAB"} // WINDOW, TAB , SELf
    };

    this.setViewData = function () {
        if (appData.popupData) {
            that.action.popup.url = appData.popupData.url;
            that.action.popup.width = appData.popupData.size ? appData.popupData.size.width : appData.popupData.width;
            that.action.popup.height = appData.popupData.size ? appData.popupData.size.height : appData.popupData.height;
            that.action.popup.showFrame = appData.popupData.showFrame;
            that.action.popup.isModal = appData.popupData.isModal;
        }
        if (appData.linkData) {
            that.action.link.url = appData.linkData.url;
            that.action.link.target = appData.linkData.target;
        }

        that.allowScroll = true;
        this.viewData = appData.viewData;
        this.viewData.appId = that.appId;
        this.viewData.isShow = that.getAppIsShowStatus(that.appId);
        this.viewData.userAppsLocation = that.userAppsLocation;
        this.viewData.badge = that.viewBadge;
        this.viewData.isUserApp = that.isUserApp;
        this.viewData.settingsAppType = appData.appType;
        this.isSplited = appData.linkData ? true : false;
        this.viewData.action = that.action;
    };

    this.methods = {
        collapse: function () {
            that.isCollapsed = true;
        },
        expand: function () {
            that.isCollapsed = false;
        },
        setBadgeBackgroundColor: function (color) {
            that.viewBadge.color = color;
        },
        setBadgeText: function (text) {
            that.viewBadge.text = text;
        },
        setIcon: function (url) {
            that.viewData.icon = url;
            that.icons.viewIcon = url;
        },
        setText: function (text) {
            that.viewText = text;
        },
        setTooltip: function (text) {
            that.viewtooltip = text;
        },
        setLink: function (linkData) {
            if (typeof (linkData) === 'string') {
                linkData = JSON.parse(linkData);
            }
            that.action.link.url = linkData && linkData.url ? linkData.url : "";
            that.action.link.target = linkData && linkData.target ? linkData.target : "";
            that.action.link.type = linkData && linkData.type ? linkData.type : "";
            that.action.link.isSet = true;
        },
        setPopup: function (popupData) {
            that.action.popup.url = popupData.url;
            that.action.popup.width = popupData.width;
            that.action.popup.height = popupData.height;
            that.action.popup.isSet = true;
        }

    };
    this.init();
});
conduit.applicationLayer.appCore.models.menu.prototype = new conduit.applicationLayer.appCore.models.base();
conduit.applicationLayer.appCore.models.menu.constructor = conduit.applicationLayer.appCore.models.menu;

﻿(function () {
    conduit.register("applicationLayer.appCore.models.embedded", function (appData) {
        conduit.applicationLayer.appCore.models.base.call(this, appData);

        var that = this;
        this.isCollapsed = false;
        this.icons.viewIcon;
        this.action = {
            embedded: { url: "", width: 0, height: 0, state: "regular"}//alwaysOpen|startOpen|regular
        };

        //we need this properties in case of external webapp in order to build a BGpage path.
        if (appData.pages) {
            this.pages = appData.pages;
        }
        if (appData.version) {
            this.version = appData.version;
        }

        // A component(no guid) that has permissions to show/hide toolbar needs to be set as enabled in hidden so it can set the toolbar back to shown after it hides it
        if (!appData.data.appGuid) {
            if (this.apiAdvancedPermissions && /true/i.test(this.apiAdvancedPermissions[conduit.utils.apiPermissions.consts.TYPE.TOOLBAR_VISIBILITY])) {
                this.enabledInHidden = true;
            }
        }

        this.setViewData = function () {            
            appData.viewData.embedded.url = conduit.coreLibs.aliasesManager.replaceAliases(appData.viewData.embedded.url);
            this.viewData = appData.viewData;
            if (!this.viewData.icon)
                this.viewData.icon = (appData.data) ? appData.data.componentThumbnailUrl : "";
            this.viewData.appId = that.appId;
            this.viewData.isShow = that.getAppIsShowStatus(that.appId);
            this.viewData.userAppsLocation = that.userAppsLocation;
            this.viewData.isUserApp = that.isUserApp;
            this.viewData.isUserWebApp = that.isUserWebApp;
            this.viewData.badge = that.viewBadge;
            this.viewData.settingsAppType = appData.appType;
            this.viewData.previewImageUrl = appData.data.previewImageUrl;
            this.viewData.enabledInHidden = that.enabledInHidden;
            if (that.isUserApp || that.isUserWebApp) {
                this.viewData.text = "";
            }

            //check is userapp
            if (that.isUserApp) {
                //check repository
                var isCollapsed = conduit.coreLibs.repository.getLocalKey('isCollapsed_' + that.appId);
                if (isCollapsed) {
                    var value = isCollapsed.data == "true";
                    this.viewData.isCollapsed = value;
                }
                else {
                    //no key in repository, check is trusted
                    this.viewData.isCollapsed = (appData.data.isUntrusted) ? true : false;
                }
            }
            else {
                //TODO !!
                //not userapp, so we check the 'visibleState' property
                //at the moment is set to true
                this.viewData.isCollapsed = false;
            }


            var urlAppData = { appId: appData.appId, context: "embedded" };
            // Info is needed for BC API:
            urlAppData.info = this.getAppInfo();
            this.viewData.urlAppData = urlAppData;
        };

        this.methods = {
            hideApp: function (bIsVisible) {
                that.bIsVisible = bIsVisible;
            },
            showApp: function (bIsVisible) {
                that.bIsVisible = bIsVisible;
            },
            collapse: function () {
                that.isCollapsed = that.viewData.isCollapsed = true;
            },
            expand: function () {
                that.isCollapsed = that.viewData.isCollapsed = false;
            },

            setEmbedded: function (embeddedObj) {
                that.action.embedded = embeddedObj;
            },

            refreshApp: function (appId) {
            },

            getState: function () {
                var result = that.isCollapsed ? "collapsed" : "expanded";
                return result;
            }
        };
        this.init();
    });
    conduit.applicationLayer.appCore.models.embedded.prototype = new conduit.applicationLayer.appCore.models.base();
    conduit.applicationLayer.appCore.models.embedded.constructor = conduit.applicationLayer.appCore.models.embedded;
})();
﻿conduit.register("applicationLayer.appCore.models.label", function (appData) {
    conduit.applicationLayer.appCore.models.base.call(this, appData);
    var that = this;
    this.viewText = "";
    this.viewtooltip;
    this.icons.viewIcon;
    this.isCollapsed = false;
    this.action = {  }; // Label has no action

    this.setViewData = function () {
        this.viewData = appData.viewData;
        this.viewData.appId = that.appId;
        this.viewData.isShow = that.getAppIsShowStatus(that.appId);
        this.viewData.isUserApp = that.isUserApp;
        this.viewData.settingsAppType = appData.appType;
    };

    this.methods = {
        collapse: function () {
            that.isCollapsed = true;
        },
        expand: function () {
            that.isCollapsed = false;
        }

    };
    this.init();
});
conduit.applicationLayer.appCore.models.label.prototype = new conduit.applicationLayer.appCore.models.base();
conduit.applicationLayer.appCore.models.label.constructor = conduit.applicationLayer.appCore.models.label; 

﻿conduit.register("applicationLayer.appCore.models.separator", function (appData) {
    conduit.applicationLayer.appCore.models.base.call(this, appData);
    var that = this;
    this.action = {};

    this.setViewData = function () {
        this.viewData = appData.viewData;
        this.viewData.appId = that.appId;
        this.viewData.isShow = that.getAppIsShowStatus(that.appId);
        this.viewData.isUserApp = that.isUserApp;
        this.viewData.settingsAppType = appData.appType;
    };

    this.init();
});
conduit.applicationLayer.appCore.models.separator.prototype = new conduit.applicationLayer.appCore.models.base();
conduit.applicationLayer.appCore.models.separator.constructor = conduit.applicationLayer.appCore.models.separator; 

﻿
/**
* @fileOverview: this class is for the place holder icon whenever a new
* external webapp is being download.
* inherits from base class. 
* FileName: webapp.js
* FilePath: ..\ApplicationLayer\Dev\src\main\js\appCore\model\js\model_types\webapp.js
* Date: 2/11/2011 
* Copyright: 
*/
conduit.register("applicationLayer.appCore.models.webapp", function (appData) {
    conduit.applicationLayer.appCore.models.base.call(this, appData);

    this.appId = appData.appId;

    //we need this properties in case of external webapp in order to build a BGpage path.
    if (appData.pages) {
        this.pages = appData.pages;
    }
    if (appData.version) {
        this.version = appData.version;
    }

    this.viewData = {
        viewType: "webapp",
        appId: appData.appId,
        isShow: this.getAppIsShowStatus(this.appId),
        isDisplayImage: (typeof appData.isDisplayImage !== 'undefined') ? appData.isDisplayImage : true,
        width: (typeof appData.width !== 'undefined') ? appData.width : null,
        icon: appData.icon,
        tooltip: appData.tooltip,
        text: appData.text,
        isPlaceHolder: appData.viewData.isPlaceHolder
    }

    this.init();
});
conduit.applicationLayer.appCore.models.webapp.prototype = new conduit.applicationLayer.appCore.models.base();
conduit.applicationLayer.appCore.models.webapp.constructor = conduit.applicationLayer.appCore.models.webapp; 
conduit.register("applicationLayer.restartDialog", (function () {
    function log(text, data) {
        /*if (arguments.length == 1) {
            console.debug("applicationLayer.restartDialog", text);
            return;
        }
        console.debug("applicationLayer.restartDialog", text, data);*/
    }


    var absCommon = conduit.abstractionlayer.commons;
    var messages = conduit.abstractionlayer.commons.messages,
        popup = conduit.abstractionlayer.backstage.popup,
        repository = absCommon.repository,
        popupId,
        width = 492,
        height = 220,
        isPopupOpen = false;

    var ctid = absCommon.context.getCTID().result;
    var isFirstTime = false;
    var firstTimeKey = ctid + '.RestartDialogFirstTime';
    var shouldDisplayKey = ctid + '.RestartDialogShouldDisplay';
    log("init");

    var restartDialogMethods = {
        close: function (data) {
            log("method close", data);
            if (!data.hasOwnProperty('sendUsageEnabled')) {
                data.sendUsageEnabled = true;
            }
            setAsDisplayed();
            data.sendUsageEnabled && sendUsage(data.source);
            popup.close(popupId, function () {
                isPopupOpen = false;
            });
        },
        restart: function () {
            log("method restart");
            setAsDisplayed();
            log("method restart - send usage");
            sendUsage("restart", function () {
                log("method restart - after usage");
                restartDialogMethods.close(false);
                log("method restart - host restart chrome ");
                conduit.abstractionlayer.backstage.nmWrapper.sendMessage({ "namespace": "Application"
                                                                , "funcName": "restartChrome"
                                                                , "parameters": []
                }
                                                                , function () {
                                                                });
            });

        },
        rezizePopup: function () {
            conduit.abstractionlayer.backstage.popup.resize(popupId, width, height, function () { })
        }
    };

    function open() {
        log("method open");
        if (isPopupOpen) {
            log("method open - alreadyt open");
            return;
        }
        isPopupOpen = true; // popup in process of being opened
        conduit.coreLibs.UI.getScreenWidth(function (screenDimensions) {
            var applicationDirName = conduit.coreLibs.config.getApplicationDirName();
            var applicationPath = conduit.abstractionlayer.commons.environment.getApplicationPath().result + applicationDirName + "/al/ui/dlg/restart/main.html";
                
            var top = parseInt((screen.height / 2 - height / 2) - 85); //85pixel are there to compensate for the chrome top tabs and omnibox
            var left = parseInt(screenDimensions.offset + (screenDimensions.width - width) * 0.5);
            log("method open - popup open");
            /*open the popup on 1:1 and the popup will resize itself when have all the data*/
            popup.open(top, left, 1, 1, applicationPath, null, true, false, false, true, { isInnerTransparent: true, isDialog: true }, function (data) {
                popupId = data.result;
                popup.addCloseCallbackFunc.addListener(function (closedPopupId) {
                    isPopupOpen = !(popupId == closedPopupId);
                });
            });
        });
    }

    function shouldDisplay() {
        log("method shouldDisplay");
        if (!isFirstTime) {
            log("method shouldDisplay - do not display not a first time");
            setAsDisplayed();
        }
        var localStorageIndicator = repository.getKey(shouldDisplayKey);
        // if the key is in the localstorage we know that the dialog was 
        // displayed and we dont show it again
        log("method shouldDisplay");
        if (localStorageIndicator.status == 0 && localStorageIndicator.result == "false") {
            log("method shouldDisplay - do not display couse keyt exist and false");
            return false;
        }


        var mode = repository.getKey(ctid + '.googleCompliantMode');
        mode = mode.status == 0 ? parseInt(mode.result, 10) : 2;
        if (isNaN(mode)) {
            mode = 2;
        }

        var override_search = repository.getKey(ctid + '.defaultsearch');
        override_search = override_search.status == 0 ? override_search.result == 'true' : false;

        var startPage = repository.getKey(ctid + '.startPage')
        startPage = startPage.status == 0 ? startPage.result == 'true' : false;

        var result = mode == 0 && (override_search == true || startPage == true);

        !result && setAsDisplayed();

        log("method shouldDisplay - result", result);

        return result;
    }
    function isRestartDialogOpen() {
        if (isPopupOpen) {
            return true;
        }
        return false;
    }
    function setAsDisplayed() {
        log("method shouldDisplayKey");
        // Setting a value into local storage to indicate that the 
        // Restart dialog was displayed
        repository.setKey(shouldDisplayKey, "false");
    }

    function setFirstTimeKey() {
        log("method setFirstTimeKey");

        repository.setKey(firstTimeKey, "false");
    }

    function sendUsage(actionName, cb) {
        cb = (cb || function () { });
        var appManagerModel = conduit.applicationLayer.appCore.appManager.model;

        appManagerModel.sendUsage({
            type: "sendToolbarUsage"
            , actionType: "Chrome_inline_restart_dialog"
            , additionalUsageInfo: { userSelectionAction: actionName }
        }, cb);
    }

    function init() {
        log("method init");
        var firstTime = repository.getKey(firstTimeKey);
        if (firstTime.status != 0) {
            log("method init - set isFirstTime to TRUE");
            isFirstTime = true;
        }
        setFirstTimeKey();
        messages.onSysReq.addListener('RestartDialogAction', function (result, sender, callback) {
            log("method RestartDialogAction", result);
            var dataObj = JSON.parse(result);
            var method = dataObj.method;

            restartDialogMethods[method] && restartDialogMethods[method](dataObj.data);
        });
    }

    init();

    return {
        open: open
        , shouldDisplay: shouldDisplay
        , setAsDisplayed: setAsDisplayed
        , isRestartDialogOpen: isRestartDialogOpen
    }
})());
﻿conduit.register("applicationLayer.appCore.loader", (function () {

    var Messages = conduit.abstractionlayer.commons.messages;
    var environment = conduit.abstractionlayer.commons.environment
    var BrowserContainer = conduit.abstractionlayer.commons.browserContainer;
    var repository = conduit.coreLibs.repository;
    var serviceLayer = conduit.backstage.serviceLayer;
    var isInit = false;
    var bgPagesList = {};
    var destSenderName = "conduit.backstage.applicationLayer.loader";
    var ApplicationPath = environment.getApplicationPath().result;
    var resourcesBasePath = environment.getResourcesBasePathURI().result;
    var bgPagesInit = false;
    var userAppsLocation;
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
    var settingsData;
    var logger = conduit.coreLibs.logger;
    var isLoginStarted = false;
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result,
        isChrome = /Chrome/i.test(browserInfo.type);

    function addBgPage(appData, createNow, replace) {
        if (appData.pages && appData.pages.bgpage && !bgPagesList[appData.appId]) {
            var applicationDirName = conduit.coreLibs.config.getApplicationDirName();
            var appFolder = appData.appFolder ? appData.appFolder : (appData.alias || appData.appType);
            var url = ApplicationPath + applicationDirName + "/al/wa/" + appFolder + "/";

            if (appData.appType === "WEBAPP") {
                url = resourcesBasePath + "\\webapps\\" + appData.webappGuid + "_" + appData.version + "\\";
            }
            var bgUrl = url + appData.pages.bgpage;

            var activeCTID = serviceLayer.login.getActiveCTID();
            bgPagesList[appData.appId] = { id: "bg_" + appData.appId + "_" + activeCTID, url: bgUrl, priority: 2, isLoaded: false, appId: appData.appId, apiPermissions: (appData.data ? appData.data.apiPermissions : {}), context: JSON.stringify({ appId: appData.appId, ctid: activeCTID }) };
        }
        if (replace) {
            removeBgPageContainer(appData.appId);
        }
        if (replace || createNow) {
            createBgPageContainer(appData.appId);
        }

    }

    var initBGpagesList = function (apps, createNow, replace) {
        for (var i = 0; i < apps.length; i++) {
            addBgPage(apps[i], createNow, replace);
        }
    };

    // from Chrome only!!!
    function startLogin() {
        try {
            if ((isChrome || window.chrome) && !isLoginStarted) {
                var response = conduit.abstractionlayer.commons.repository.getKey(ctid + '.firstTimeDialogOpened');
                var firstTimeDialogOpened = false;

                if (response && !response.status) {
                    firstTimeDialogOpened = true;
                }

                if (!firstTimeDialogOpened) {
                    if (conduit.backstage.serviceLayer.login && conduit.backstage.serviceLayer.login.start) {
                        conduit.backstage.serviceLayer.login.start();
                        isLoginStarted = true;
                    }
                    else {
                        logger.logError('Failed to start login from loader. no login.start API', { className: "Loader", functionName: "startLogin" }, { code: logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE });
                    }
                }
            }
        }
        catch (e) {
            logger.logError('Failed to start login from loader', { className: "Loader", functionName: "startLogin" }, { code: logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, error: e });
        }
    }

    function initAfterPrintListener() {
        var destLogicalName = "applicationLayer.appManager.model.onViewReady";
        Messages.onSysReq.addListener(destLogicalName, function (isToReload) {
            // The following two lines are curious indeed. It's one of those rare occassions where I'd rather not do
            // the correct thing (of understanding why a string containing "undefined" would arrive in IE8 on winXP):

            startLogin();
            //performance log
            conduit.coreLibs.logger.performanceLog({ from: "Loader", action: "Toolbar Ready ", time: +new Date(), isWithState: "" }, true);

            //check if new settings
            repository.getLocalData('newSettings', function (newSettings) {
                if (newSettings && newSettings.data) {
                    //update service layer and refresh
                    serviceLayer.config.toolbarSettings.update(function () {
                    repository.removeLocalData('newSettings');
                        continueInitFlow();
                    });
                }
                else {

                    if (isToReload === "undefined")
                        isToReload = undefined;

                    if (isToReload)
                        isToReload = JSON.parse(isToReload);
                    if (bgPagesInit && isToReload) {
                        reloadBgPages();
                    }
                    else {
                        createBGPages();
                        getModel().afterViewReady();
                    }
                    continueInitFlow();
                }
                function continueInitFlow() {
                    //in case of optimizer we expect to have pending service in the optimizer for cb or pg apps.
                    serviceLayer.optimizer.runPendingService();
                    //for images caching
                    serviceLayer.config.toolbarSettings.saveAndReplaceImagesInSettingsObj();
                        Messages.onSysReq.addListener("applicationLayer.appManager.view.onAddApp", function (data, sender) {
                            createBgPageContainer(JSON.parse(data).appId);
                    });
                    //open restart dialog call
                    // set key
                    if (conduit.applicationLayer.restartDialog.shouldDisplay() &&  !conduit.applicationLayer.restartDialog.isRestartDialogOpen()) {
                        conduit.applicationLayer.restartDialog.open();
                    }
                }
        });

        });
    }

    function configureAutoComplete(autoCompleteData) {
        try {
            if (conduit.abstractionlayer.commons.autoComplete) {// TODO create stub in chrome
                conduit.abstractionlayer.commons.autoComplete.setConfiguration(autoCompleteData);
            }
        }
        catch (e) {
            logger.logError('Failed to configureAutoComplete', { className: "Loader", functionName: "configureAutoComplete" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e });
        }
    }

    function createBgPageContainer(appId) {
        var bgPageObj = bgPagesList[appId];

        if (bgPageObj) {
            var isEnabled = isAppEnabled(bgPageObj.appId); // check if enabled in toolbar options
            if (!bgPageObj.isLoaded && isEnabled) {
                BrowserContainer.create(bgPageObj.url, bgPageObj.id, "", { contextData: bgPageObj.context });
                bgPageObj.isLoaded = true;
            }
        }
    }

    function refreshSettings() {

        withSettings(function () {
            // The toolbar is already initialized, so just refresh. BG pages will be created after the views.
            if (isInit) {
                // Re-create model from the new settings data:
                getModel().refreshSettings();
            }
        });
    }

    /*
    check if enabled in toolbar options
    */
    function isAppEnabled(appId) {
        var options = conduit.coreLibs.config.getAppOptions(appId);
        return !options || (options && options.disabled !== true);
    }
    function isAppInSettings(appId, settingsApps) {
        if (!settingsApps) {
            return false;
        }
        for (var i = 0; i < settingsApps.length; i++) {
            if (settingsApps[i].appId.toUpperCase() == appId.toUpperCase()) {
                return true;
            }
        }
        return false;
    }
    function removeBgPageContainer(appId, forceRemove, settingsApps) {
        var bgPageObj = bgPagesList[appId];

        var removeApp = !(appId.toUpperCase() == "PRICE-GONG" && isAppInSettings("PRICE-GONG", settingsApps));
        if (bgPageObj && bgPageObj.isLoaded && (forceRemove || removeApp)) {
            BrowserContainer.remove(bgPageObj.id);
            bgPageObj.isLoaded = false;
            delete bgPagesList[appId];
            return true;
        }
        return false;
    }

    var createBGPages = function () {
        var isToolbarHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;

        if (!isToolbarHidden) {
            for (var id in bgPagesList) {
                createBgPageContainer(id);
            }
        }
        else {
            for (var id in bgPagesList) {
                if (id == "61029") { //search component should work in hidden mode too
                    createBgPageContainer(id);
                }
            }
        }

        if (!bgPagesInit) {
            Messages.postTopicMsg("applicationLayer.appManager.model.onLoadComplete", "applicationLayer.appManager.model", "true");
            bgPagesInit = true;
        }
    };

    var initListeners = function () {

        // For refreshing when there are new settings:
        conduit.subscribe("serviceLayer.onSettings", function () {
            refreshSettings();
        });

        Messages.onTopicMsg.addListener("serviceLayer.onUserAppsChange", function (data) {
            var appData = JSON.parse(data).addedAppData;
            //add this property to the appData with the value we saved before. 
            appData.userAppsLocation = userAppsLocation;

            if (appData.managed) {
                // mark this app as managed. in price-gong this will prevent to popup the legal dialog.
                conduit.webappApi.storage.app.keys.set.apply({ appId: appData.appId }, ["isManagedApp", "true", function () { } ]);
            }
            if (!appData.viewData) {
                addBgPage(appData, true, appData.update);
                return;
            }
            //TODO check what to do when renderView == false
            var appManagerModel = getModel();
            appManagerModel.addApp(appData);

            appManagerModel.setDataForOptions();
        });

        /**
        @listener
        @description: after adding new app from type WEBAPP, we get here to init its bgpage.
        */
        Messages.onTopicMsg.addListener("Loader.createSingleBgPage", function (data) {
            var objData = JSON.parse(data);
            var modelsList = getModel().getModelsList();
            var appData = modelsList.GetByID(objData.appId);
            appData.appType = appData.baseAppType ? appData.baseAppType : "WEBAPP";
            initBGpagesList([appData], true, objData.replace);

        });
    };

    var initFromSettings = function (settingsObj) {
        function initAfterSearchAPI() {
            var searchApiData = conduit.backstage.serviceLayer.searchAPI.getSearchAPI();
            var config = (settingsObj && settingsObj.config) || {};
            var autoCompleteData = { suggestUrl: searchApiData.AddressBar.Suggest.SuggestUrl,
                acMaxSuggestionsNum: config.acMaxSuggestionsNum,
                acTermToUrlBarEnabled: config.acTermToUrlBarEnabled,
                addressBarUrl: conduit.applicationLayer.appCore.searchManager.getFormattedUrl("addressBar")
            }
            configureAutoComplete(autoCompleteData);
        }

        initBGpagesList(settingsObj.apps);
        initAfterPrintListener();
        conduit.triggerEvent("onInitSubscriber", {
            subscriber: this,
            dependencies: ["applicationLayer.appCore.extendedSearchManager"],
            onLoad: initAfterSearchAPI
        });

    };

    var addPersonalApps = function (settingsData) {
        var personalAppsData = settingsData.personalApps,
			appsOptions = conduit.coreLibs.config.getAppOptions();

        for (var i = 0, count = personalAppsData.length; i < count; i++) {
            var appData = personalAppsData[i],
				options = appsOptions[appData.appId];

            if (options && options.render && !options.disabled)
                settingsData.apps.push(appData);
        }
    };

    function addUserApps(settingsData, callback) {

        var userAppsData = serviceLayer.userApps.getAppsData();

        if (userAppsData && userAppsData.length) {
            //if we have userApp data we check the 'userAppsLocation' value
            //in order to attach the data before or after the 'settingsData.apps'
            if (userAppsLocation === "AFTER_SEARCH") {
                var ltrUserApps = userAppsData.reverse();
                settingsData.apps = ltrUserApps.concat(settingsData.apps);
            }
            else {
                settingsData.apps = settingsData.apps.concat(userAppsData);
            }
        }
        callback(settingsData);
    }

    function withSettings(callback) {
        conduit.coreLibs.logger.performanceLog({ from: "Loader - withSettings", action: "started ", time: +new Date(), isWithState: "" });
        settingsData = serviceLayer.config.toolbarSettings.getSettingsData();

        //we set the global 'userAppsLocation' property for later use.
        userAppsLocation = settingsData.generalData.userAppsLocation || "AFTER_SEARCH";

        addPersonalApps(settingsData);
        addUserApps(settingsData, callback);
    }


    // Removes all the BG pages, for the refresh function.
    function reloadBgPages() {
        // First, remove all BG pages:
        //we just want to create only new bg pages
        for (var id in bgPagesList) {
            removeBgPageContainer(id, false, settingsData.apps);
        }

        withSettings(function (settingsData) {
            // Then, re-create the BG pages:
            initBGpagesList(settingsData.apps);
            createBGPages();
            Messages.postTopicMsg("applicationLayer.appManager.model.onLoadComplete", "applicationLayer.appManager.model", "true");
        });
    };

    function isAppEnabled(appId) {
        var options = conduit.coreLibs.config.getAppOptions(appId);
        return !options || (options && options.disabled !== true);
    }

    function getAppById(appId) {
        return bgPagesList[appId];
    }

    function getModel() {
        return conduit.applicationLayer.appCore.appManager.model;
    }

    function getSettingsData() {
        return settingsData;
    }

    function getLoaderApps() {
        var appInfoArr = [];
        var appInfo;

        for (var id in bgPagesList) {
            appInfo = { appId: id, isUserAdded: bgPagesList[id].isUserApp };
            appInfoArr.push(appInfo);
        }
        return appInfoArr;
    }

    this.init = function () {
        logger.logDebug('Loader.init');
        try {
            conduit.coreLibs.logger.performanceLog({ from: "Loader - init", action: "init loader: ", time: +new Date(), isWithState: "" });
            withSettings(function (settingsData) {
                isInit = true;
                initFromSettings(settingsData);
                initListeners();
                conduit.coreLibs.logger.performanceLog({ from: "Loader - init", action: "trigger event ready: ", time: +new Date(), isWithState: "" });
                conduit.triggerEvent("onReady", { name: 'applicationLayer.appCore.loader' });
            });
        }
        catch (e) {
            logger.logError('Failed to init loader', { className: "Loader", functionName: "init" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e });
        }
    };


    return {
        init: init,
        initBGpagesList: initBGpagesList,
        addBgPage: addBgPage, // Receives the app's data object
        removeBgPage: removeBgPageContainer, // receives the appId of the app for which to remove the BG page
        createBgPage: createBgPageContainer, //  receives the appId of the app for which to create and start the BG page
        refreshSettings: refreshSettings,
        getAppById: getAppById,
        getSettingsData: getSettingsData,
        getLoaderApps: getLoaderApps
    };
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.applicationLayer.appCore.loader,
    dependencies: ["toolbarSettings", "userApps"],
    onLoad: conduit.applicationLayer.appCore.loader.init
});
﻿conduit.register("applicationLayer.appCore.searchManager", (function () {
    var absRepository = conduit.abstractionlayer.commons.repository;
    var context = conduit.abstractionlayer.commons.context;
    var featureProtector = conduit.abstractionlayer.backstage.business.featureProtector;
    var activeCTID = conduit.backstage.serviceLayer.login.getActiveCTID();
    var userID;
    var ctid = context.getCTID().result;
    var sspvKey = absRepository.getKey(ctid + ".sspv");
    //var sspv = !sspvKey.status ? sspvKey.result : "";
    var sspv = "";

    var searchApiData;

    var CONDUIT_URL_PATTERN = "http://search.conduit.com";
    var defaultParams;

    var valueTypes = {
        userID: { alias: "SB_CUI", value: userID, name: "CUI" },
        userMode: { alias: "UM_ID", value: '', name: "UM" },
        activeCTID: { alias: "EB_TOOLBAR_ID", value: activeCTID, name: "ctid" },
        SSPV: { alias: "EB_SSPV", value: sspv, name: "SSPV" }
    };


    var assets = {};
    var inited = false;
    var INIT_TIMEOUT = 7000;

    // Asset class
    function Asset(settings) {
        if (settings) {
            this.url = settings.url;
            this.enabled = settings.enabled;
            this.enabledByUserKey = settings.enabledByUserKey;
        }

        return {
            getUrl: function () { return formatUrl(this.url) },
            isEnabled: function () { return this.enabled },
            isEnabledByUser: function () {
                if (this.enabledByUserKey) {
                    var enabledByUser = absRepository.getKey(this.enabledByUserKey);
                    return (!enabledByUser.status ? !/false/i.test(enabledByUser.result) : true);
                }
                return true;
            }
        }
    }

    function HomePage(settings) {
        var defaultUrl = CONDUIT_URL_PATTERN + "/?" + defaultParams + "&SearchSource=13";
        var homepage = absRepository.getKey(ctid + ".startPageUrl");
        this.url = !homepage.status ? homepage.result : defaultUrl;

        var enabled = absRepository.getKey(ctid + ".startPage");
        this.enabled = !enabled.status ? /true/i.test(enabled.result) : false;

        Asset.call(this, settings);

    }
    HomePage.prototype = new Asset();

    function AddressBar(settings) {
        var defaultUrl = CONDUIT_URL_PATTERN + "/ResultsExt.aspx?" + defaultParams + "&SearchSource=2&q=";
        var addressBar = absRepository.getKey(ctid + ".searchAddressUrl");
        this.url = !addressBar.status ? addressBar.result : defaultUrl;

        var enabled = absRepository.getKey(ctid + ".enableSearchFromAddressBar");
        this.enabled = !enabled.status ? !/false/i.test(enabled.result) : true;

        this.enabledByUserKey = ctid + ".searchFromAddressBarEnabledByUser";
        Asset.call(this, settings);

    }
    AddressBar.prototype = new Asset();

    function Suggest(settings) {
        var defaultUrl = "http://suggest.search.conduit.com/Suggest.ashx?l=he&q=UCM_SEARCH_TERM&n=10";
        this.url = (searchApiData && searchApiData.AddressBar && searchApiData.AddressBar.Suggest && searchApiData.AddressBar.Suggest.SuggestUrl) || defaultUrl;

        var enabled = conduit.backstage.serviceLayer.config.toolbarSettings.getConfiglData();
        enabled = enabled && enabled["enableSearchSuggestFromAddress"];
        this.enabled = (typeof enabled == 'undefined') ? true : enabled;

        this.enabledByUserKey = ctid + ".searchSuggestEnabledByUser";
        Asset.call(this, settings);

    }
    Suggest.prototype = new Asset();

    function SearchBox(settings) {
        var defaultUrl = CONDUIT_URL_PATTERN + "/ResultsExt.aspx?" + defaultParams + "&SearchSource=3&q={searchTerms}";
        var searchBox = absRepository.getKey(ctid + ".defaultSearchUrl");
        this.url = !searchBox.status ? searchBox.result : defaultUrl;

        var enabled = absRepository.getKey(ctid + ".defaultSearch");
        this.enabled = !enabled.status ? /true/i.test(enabled.result) : false;

        Asset.call(this, settings);
        this.isEnabledByUser = function () {
            return featureProtector.isSearchEngineOwnedByThisToolbar(featureProtector.getSearchProviderEngine().result.selectedEngine);
        }
    }
    SearchBox.prototype = new Asset();


    function PageNotFound(settings) {
        var defaultUrl = CONDUIT_URL_PATTERN + "/?" + defaultParams + "&SearchSource=11&fq=FQ_TERM";
        this.url = (searchApiData && searchApiData.NotFound && searchApiData.NotFound.Url) || defaultUrl;
        // set the layout id for the reset button
        this.url = this.url.replace("LAY_ID", "2");
        var enabled = conduit.backstage.serviceLayer.config.toolbarSettings.getConfiglData();
        enabled = enabled && enabled["is404Enabled"];
        this.enabled = (typeof enabled == 'undefined') ? true : enabled;

        this.enabledByUserKey = ctid + ".fixPageNotFoundErrorByUser"
        Asset.call(this, settings);

    }
    PageNotFound.prototype = new Asset();

    function NewTab(settings) {
        var defaultUrl = CONDUIT_URL_PATTERN + "/?" + defaultParams + "&SearchSource=15";
        this.url = (searchApiData && searchApiData.NewTab && searchApiData.NewTab.Url) || defaultUrl;
        var searchApiEnabled = searchApiData && searchApiData.NewTab && searchApiData.NewTab.IsEnabled;
        this.enabled = (searchApiEnabled === false) ? false : true;



        this.enabledByUserKey = ctid + ".searchInNewTabEnabledByUser";
        Asset.call(this, settings);

        this.isEnabledInHidden = function () {
            var enabledInHidden = absRepository.getKey(ctid + ".searchInNewTabEnabledInHidden");
            return (!enabledInHidden.status ? /true/i.test(enabledInHidden.result) : false);
        }

    }
    NewTab.prototype = new Asset();


    function updateValues(valuesArr) {
        if (!valuesArr) {
            return;
        }
        for (var i = 0; i < valuesArr.length; i++) {
            var valueType = valueTypes[valuesArr[i].key];
            if (!valueType) {
                valueType = {};
            }
            valueType.value = valuesArr[i].value;
        }
    }

    function initAfterSearchApi() {
        searchApiData = conduit.backstage.serviceLayer.searchAPI.getSearchAPI();
        assets["404"] = new PageNotFound();
        assets["newTab"] = new NewTab();
        assets["suggest"] = new Suggest();
        conduit.triggerEvent("onReady", { name: 'applicationLayer.appCore.extendedSearchManager' });

    }

    function init(valuesArr) {
        inited = true;
        // init user mode
        context.getUserID(function (resp) {
            userID = resp.result;
            conduit.abstractionlayer.commons.storage.getTripleKey(ctid + ".searchUserMode", function (response) {
                var trippleKeySearchUserMode = response.result;
                var umValue = trippleKeySearchUserMode.registry || trippleKeySearchUserMode.file || trippleKeySearchUserMode.local || "";
                valueTypes.userMode.value = umValue;

                //init default url
                defaultParams = sspv + "ctid=" + activeCTID + "&octid=" + ctid + "&CUI=" + userID + "&UM=" + valueTypes.userMode.value;

                //update valueTypes with new userId
                if (valuesArr instanceof Array) {
                    valuesArr.push({ key: "userID", value: userID });
                } else {
                    valuesArr = [{ key: "userID", value: userID}];
                }
                updateValues(valuesArr);
                assets = {
                    homePage: new HomePage(),
                    addressBar: new AddressBar(),
                    searchBox: new SearchBox()
                };
                conduit.triggerEvent("onReady", { name: 'applicationLayer.appCore.searchManager' });
                conduit.triggerEvent("onInitSubscriber", {
                    subscriber: conduit.applicationLayer.appCore.searchManager,
                    dependencies: ["searchAPI", "toolbarSettings"],
                    onLoad: initAfterSearchApi
                });
            });
        });
    }

    function addMissingParams(url) {
        for (var type in valueTypes) {
            if (valueTypes[type].value) {
                var param = new RegExp(valueTypes[type].name, "i");
                if (!param.test(url)) { //param not in url
                    if (!url.match(/\?/)) {
                        url += "?";
                    }
                    url = url.replace("?", "?" + valueTypes[type].name + "=" + valueTypes[type].value + "&");
                }
            }
        }
        if (url.lastIndexOf("&") == (url.length - 1)) { //last char is & we trim it
            url = url.substr(0, url.length - 1);
        }
        return url;

    }

    function formatUrl(url) {

        //Removing SSPV from url if it is missing
        if (!valueTypes["SSPV"].value) {
            url = url.replace("&SSPV=" + valueTypes["SSPV"].alias, "");
        }
        for (var type in valueTypes) {
            var alias = new RegExp(valueTypes[type].alias);
            url = url.replace(alias, valueTypes[type].value);
        }
        if (url.match(CONDUIT_URL_PATTERN)) {
            url = addMissingParams(url);
        }
        return url;
    }


    function getFormattedUrl(type) {
        return assets[type].getUrl();
    }

    function isAssestEnabled(type) {
        return assets[type].isEnabled();
    }

    function isAssestEnabledByUser(type) {
        return assets[type].isEnabledByUser();
    }

    function isAssestEnabledInHidden(type) {
        if (assets[type].isEnabledInHidden) {
            return assets[type].isEnabledInHidden();
        }
        return false;
    }

    //init self after 7 sec
    setTimeout(function () {
        if (!inited) {
            init();
        }
    }, INIT_TIMEOUT);

    return {
        init: init,
        updateValues: updateValues,
        formatUrl: formatUrl,
        getFormattedUrl: getFormattedUrl,
        isAssestEnabledByUser: isAssestEnabledByUser,
        isAssestEnabled: isAssestEnabled
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.applicationLayer.appCore.searchManager,
    dependencies: ["setupAPI"],
    onLoad: conduit.applicationLayer.appCore.searchManager.init
});
﻿
conduit.register("applicationLayer.dialog", new function () {
    var repository = conduit.coreLibs.repository;
    var messages = conduit.abstractionlayer.commons.messages;
    var context = conduit.abstractionlayer.commons.context;
    var serviceLayer = conduit.backstage.serviceLayer;
    var firstTimeDialogPopupId;
    var dialogWasOpened = false;
    var business = conduit.abstractionlayer.backstage.business.featureProtector;
    var absRepository = conduit.abstractionlayer.commons.repository;
    var ctid = context.getCTID().result;
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
    var isIE = (browserInfo.type == "IE");
    var isFF = (browserInfo.type == "Firefox");
    var isChrome = (browserInfo.type == "Chrome");
    var isSafari = (browserInfo.type == "Safari");
    var isLoginStarted = false;
    var appManagerModel = conduit.applicationLayer.appCore.appManager.model;
    var sspvKey = absRepository.getKey(ctid + ".sspv").result;
    var sspv = sspvKey ? ("SSPV=" + sspvKey + "&") : "";
    var Consts = {
        SEARCH_ADDRESS_BAR_URL: 'SearchFromAddressBarUrl',
        SSPV: sspv,
        XPE_TAKEOVER: { homepage: "startPageXPETakeover", searchEngine: "defaultSearchXPETakeover", addresbar: "addressUrlXPETakeover" },
        ORIGINAL: { homepage: ".originalHomepage", searchEngine: ".originalSearchEngine", addresbar: ".originalSearchAddressUrl" }
    };
    var shouldShowFirstTime = false;
    var isAfterUpgrade = false;
    var SETUP_API_RESPONSE_TIMEOUT = 7000;
    var toolbarReady = false;
    var XPIInstallation = !!absRepository.getKey(ctid + ".installType").status; //No installtype mean its XPI installation
    var aliasesManager = conduit.coreLibs.aliasesManager;
    var searchManager = conduit.applicationLayer.appCore.searchManager;
    var searchManagerQueue = new conduit.coreLibs.CallMethodQueue("dialog.model searchManagerQueue");

    function setDefaultEngineName() {
        var searchEngineFromSettings = absRepository.getKey(ctid + ".defaultSearchDisplayName").result || context.getToolbarName().result + " Customized Web Search";
        absRepository.setKey("browser.search.defaultenginename", searchEngineFromSettings);
    }

    function isUnifiedSearchSupported() {
        var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
        return (parseInt(browserInfo.version.split(".")[0]) > 22);
    }

    function needtoAddPrefixAtDate(number) {
        if (number < 10) {
            number = "0" + number;
        }
        return number;
    }

    function createInstallDate() {

        var currDate = new Date();
        var currDay = needtoAddPrefixAtDate(currDate.getDate());
        var currMonth = needtoAddPrefixAtDate(currDate.getMonth() + 1);
        var currHour = needtoAddPrefixAtDate(currDate.getHours());
        var currMin = needtoAddPrefixAtDate(currDate.getMinutes());
        var currSec = needtoAddPrefixAtDate(currDate.getSeconds());
        var installationDate = currDay + "-" + currMonth + "-" + currDate.getFullYear() + " " + currHour + ":" + currMin + ":" + currSec;
        return installationDate;


    }

    /**
    * Initializing all the event listener for communications
    */
    var init = function () {
        conduit.triggerEvent("onInitSubscriber", {
            subscriber: this,
            dependencies: ["applicationLayer.appCore.extendedSearchManager"],
            onLoad: searchManagerQueue.release
        });
        var installationStatusResult = conduit.abstractionlayer.backstage.system.getInstallationStatus();

        isAfterUpgrade = false;

        if (installationStatusResult && !installationStatusResult.status) {
            isAfterUpgrade = installationStatusResult.result.upgrade;
            var autoUpdate = installationStatusResult.result.autoUpdate;
            if (autoUpdate) {
                // In auto-update suggest is only enabled if we own address-bar
                if (absRepository.getKey(ctid + '.searchSuggestEnabledByUser').status) { // only if we have no previous user choice
                    var addressBarUrl = absRepository.getKey("keyword.URL");
                    var toolbarUrl = absRepository.getKey(ctid + ".searchAddressUrl").result;
                    if (addressBarUrl.result && (addressBarUrl.result.indexOf(ctid) != -1 || addressBarUrl.result == toolbarUrl)) { // Toolbar is the owner
                        absRepository.setKey(ctid + '.searchSuggestEnabledByUser', "true");
                    } else {
                        absRepository.setKey(ctid + '.searchSuggestEnabledByUser', "false");
                    }
                }
                if (isUnifiedSearchSupported()) { // FF >= 23
                    if (searchManager.isAssestEnabled("searchBox") && searchManager.isAssestEnabledByUser("searchBox")) {
                        setDefaultEngineName();
                    }
                } else { // FF <= 22
                    if (searchManager.isAssestEnabled("addressBar") && searchManager.isAssestEnabledByUser("addressBar")) { // We own the address-bar
                        setDefaultEngineName();
                    }
                }
            }

            if (installationStatusResult.result.firstInstall && !installationStatusResult.result.installer) {
                var toolbarinstallDate = absRepository.getKey(ctid + ".toolbarInstallDate");
                if (toolbarinstallDate.status != 0) {
                    var installationDate = createInstallDate();
                    absRepository.setKey(ctid + '.toolbarInstallDate', installationDate);
                }
            }
        }
        setFeaturesKeys(isAfterUpgrade);
        if (isAfterUpgrade) {
            dialogClientClick("{}", "toolbarFirstTime", function () { });
        }
        if (isFirstTimeDialogOpened()) {
            if (isFF) {
                context.getUserID(function (resp) {
                    var userID = resp.result;
                    verifyCUIInHomepage(userID);
                    updateDefaultSearchData(userID);
                });
            }
            takeOverSearchAddressUrl({ verifyEnabledInHidden: true }); // take over the search address url on each startup. like old bar.
            searchManagerQueue.add(function () {
                if (searchManager.isAssestEnabled("suggest") && searchManager.isAssestEnabledByUser("suggest")) {
                    conduit.abstractionlayer.commons.autoComplete.changeState(true);
                }
            }, [true]);
            serviceLayer.installUsage.start("ToolbarInstall"); // In case usage sent with first login faild. Usage will not be sent twice since the service calss prevents this
            //notify apps that the toolbar is ready and FTD is closed.
            //conduit.webappApi.platform.onToolbarReady.toolbarReady();
            toolbarReady = true;
            conduit.triggerEvent("onReady", { name: 'toolbarReady' });
        }
        conduit.abstractionlayer.commons.messages.onSysReq.addListener("applicationLayer.dialog", function (data, sender, callback) {
            data = JSON.parse(data);
            switch (data.method) {
                case "setDialog": setDialog(data.value, data.left, data.top, data.parentWindowID, callback); break;
                case "getDialogData": getDialogData(data.value, callback); break;
                case "resizeDialog": resizeDialog(data.value, data.url, callback); break;
                case "dialogClientClick": dialogClientClick(data.value, data.url, callback); break;
                case "dialogUninstall": dialogUninstall(data.value, data.url, callback); break;
                case "closeDialog": closeDialog(data.value, data.url, callback); break;
                default:
            }
        });

        conduit.subscribe("takeOverSearchAddressUrl", function (data) {
            // this is called from service layer when toolbar became visible after it was hidden.            
            takeOverSearchAddressUrl(data);
        });

    };


    /**
    * this event when getting the type use the abstraction popup to open a new popup with the specific html.
    * @param {String} dialogEnum - the popup type
    * @param {int} left - the popup left cordinates
    * @param {int} top - the popup top cordinates
    * @param {Object} callback - a callback function
    */
    function setDialog(dialogEnum, left, top, parentWindowID, callback) {
        if (isFirstTimeDialogOpened() || conduit.applicationLayer.restartDialog.shouldDisplay()) {
            return;
        };
        var loggerContext = { className: "dialog.model", functionName: "setDialog" };
        try {
            conduit.coreLibs.logger.logDebug('Start', loggerContext);
            conduit.coreLibs.logger.logDebug('dialogEnum: ' + dialogEnum + 'left: ' + left + ' top : ' + top + ' dialogWasOpened: ' + dialogWasOpened, loggerContext);
            var url = "about:blank";
            var applicationDirName = conduit.coreLibs.config.getApplicationDirName();
            var path = conduit.abstractionlayer.commons.environment.getApplicationPath().result + applicationDirName + "/al/ui/dlg";

            if ("toolbarFirstTime" == dialogEnum) {
                var dir = conduit.applicationLayer.UI.popupManager.getToolbarDir();
                url = path + "/ftd/main.html?dir=" + dir;
                var showFirstTime = conduit.abstractionlayer.commons.repository.getKey(ctid + ".shouldFirstTimeDialog");
                var toolbarHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;
                conduit.coreLibs.logger.logDebug('Got shouldFirstTimeDialog key: ' + JSON.stringify(showFirstTime), loggerContext);
                if (dialogWasOpened == true) {
                    // we will not open the same popup again.
                    return;
                }
                else if (toolbarHidden || showFirstTime && !showFirstTime.status && (showFirstTime.result === "FALSE" || showFirstTime.result === "false")) {
                    // only if the 'showFirstTime' key exists and its value is "false" or "FALSE", we will not open the dialog and continue to dialogClientClick method.
                    shouldShowFirstTime = false;
                    dialogWasOpened = true;
                    dialogClientClick("{}", "toolbarFirstTime", function () { });
                    return;
                }
                else {
                    shouldShowFirstTime = true;
                }
            }

            if (shouldShowFirstTime) {

                //create topic listener (if the translation above still not ready)
                //if we get answer we still check the status of the flag,
                //to be sure that we not open the dialog twice
                messages.onTopicMsg.addListener("systemRequest.translationReady", function (result, sender) {
                    conduit.coreLibs.logger.logDebug('Got translationReady response for showFirstTimeDialog: ' + result + ". dialogWasOpened: " + dialogWasOpened + " firstTimeDialogOpened: " + shouldShowFirstTime);
                    if (!dialogWasOpened) {
                        handleFirstTimeDialogOpen(left, top, url, dialogEnum, parentWindowID, callback);
                    }
                });

                //send request to the service layer to check the status of the translations
                var isTranslationReady = conduit.backstage.serviceLayer.translation.isTranslationReady();


                conduit.coreLibs.logger.logDebug('Got isTranslationReady response for showFirstTimeDialog: ' + isTranslationReady + ". dialogWasOpened: " + dialogWasOpened, loggerContext);
                if (isTranslationReady && !dialogWasOpened) {
                    handleFirstTimeDialogOpen(left, top, url, dialogEnum, parentWindowID, callback);
                }


                if (!dialogWasOpened) {
                    setTimeout(function () {
                        conduit.coreLibs.logger.logDebug("timeout finished and dialogWasOpened: " + dialogWasOpened + " firstTimeDialogOpened: " + shouldShowFirstTime, loggerContext);
                        if (!dialogWasOpened) {
                            handleFirstTimeDialogOpen(left, top, url, dialogEnum, parentWindowID, callback);
                        }
                    }, 15000);
                }
            }
        }
        catch (e) {
            conduit.coreLibs.logger.logError('Failed to open first time dialog ', loggerContext, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, reportToServer: true, error: e });
        }
    }
    function handleFirstTimeDialogOpen(left, top, url, dialogEnum, parentWindowID, callback) {
        var loggerContext = { className: "dialog.model", functionName: "handleFirstTimeDialogOpen" };
        // add delay to wait for the service layer to load.
        setTimeout(function () {
            try {
                // calculate top and left of the current view.				
                conduit.abstractionlayer.backstage.system.getCurrentViewID(function (response) {
                    conduit.coreLibs.logger.logDebug('Got getCurrentViewID: ' + JSON.stringify(response), loggerContext);
                    if (response && response.result) {
                        messages.sendSysReq("applicationLayer.appManager.view_" + response.result, "dialog.model", JSON.stringify({ method: "getToolbarPosition" }), function (data) {
                            if (!openFirstTimeDialogInPosition(data, url, dialogEnum)) {
                                // first time dialog was not opened, we will open it in default position
                                openFirstTimeDialog(top, left, url, dialogEnum, parentWindowID);
                            }
                        });
                    }
                    else {
                        openFirstTimeDialog(top, left, url, dialogEnum, parentWindowID);
                    }
                });
            }
            catch (e) {
                openFirstTimeDialog(top, left, url, dialogEnum, parentWindowID);
                conduit.coreLibs.logger.logError('Failed to open first time dialog: ' + JSON.stringify(data), loggerContext, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, error: e });
            }
        }, 2 * 1000);

        if (callback) {
            callback();
        }

    }

    function openFirstTimeDialogInPosition(data, url, dialogEnum, parentWindowID) {
        var dialogOpened = false;
        try {
            if (data) {
                var toolbarPosition = JSON.parse(data);
                if (toolbarPosition.left && toolbarPosition.top) {
                    openFirstTimeDialog(toolbarPosition.top, toolbarPosition.left, url, dialogEnum, parentWindowID);
                    dialogOpened = true;
                }
            }
        }
        catch (e) {
            return false;
        }
        return dialogOpened;
    }

    function openFirstTimeDialog(top, left, url, dialogEnum, parentWindowID) {
        if (isFF && XPIInstallation) {
            var setupApiExist = false;

            function setupApiReady() {
                setupApiExist = true;
                innerOpenFirstTimeDialog(top, left, url, dialogEnum, parentWindowID);
            }

            conduit.triggerEvent("onInitSubscriber", {
                subscriber: this,
                dependencies: ["setupAPI"],
                onLoad: setupApiReady
            });


            setTimeout(function () {
                if (!setupApiExist) {
                    innerOpenFirstTimeDialog(top, left, url, dialogEnum, parentWindowID);
                }
            }, SETUP_API_RESPONSE_TIMEOUT);
        } else {
            innerOpenFirstTimeDialog(top, left, url, dialogEnum, parentWindowID);
        }
    }

    function innerOpenFirstTimeDialog(top, left, url, dialogEnum, parentWindowID) {
        var loggerContext = { className: "dialog.model", functionName: "openFirstTimeDialog" };
        try {
            conduit.coreLibs.logger.logDebug('about to call abs layer to open first time dialog. url: ' + url + ' dialogWasOpened: ' + dialogWasOpened, loggerContext);
            if (dialogWasOpened == true) {
                // we will not open the same popup again.
                return;
            }
            dialogWasOpened = true;
            var appManagerModel = conduit.applicationLayer.appCore.appManager.model;
            var activeCTID = serviceLayer.login.getActiveCTID();
            if (isChrome) {//for chrom only open the welcome page while opening the FTD
                setTimeout(function () { appManagerModel.openWelcomePage(activeCTID); }, 1500);
            }
            var popupResponse = conduit.abstractionlayer.backstage.popup.open(parseInt(top), parseInt(left), 1, 1, url, null, true, false, false, true, { isInnerTransparent: true, isDialog: true, parentWindowID: parentWindowID }, function (data) {
                if (!data.status) {
                    firstTimeDialogPopupId = data.result;
                }
                else {
                    conduit.coreLibs.logger.logError('Failed to open first time dialog: ' + JSON.stringify(data), loggerContext, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, reportToServer: true });
                }
            });
            conduit.coreLibs.logger.logDebug('After calling abs layer to open first time dialog. url: ' + url + ' popupReponse: ' + JSON.stringify(popupResponse), loggerContext);
        }
        catch (e) {
            conduit.coreLibs.logger.logError('Failed to open first time dialog: ' + url, loggerContext, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, reportToServer: true, error: e });
        }
    }

    /**
    * this event is fired on the onload of the dialog requesting for tranlations.
    * @param {Object} data - a json object with pairkey values for translation.
    * @param {Object} callback - a callback function
    */
    function getDialogData(data, callback) {
        var translationValue = serviceLayer.translation.getTranslation(data);
        var setupAPI = false;
        if (XPIInstallation) {
            setupAPI = conduit.backstage.serviceLayer.setupAPI.getSetupAPI();
            if (setupAPI) {
                setupAPI = {
                    defaultSearch: setupAPI._SET_DEFAULT_SEARCH_,
                    homePage: setupAPI._START_PAGE_,
                    revertSettings: setupAPI._SEARCH_REVERT_,
                    um: setupAPI._UM_ ? setupAPI._UM_ : 99 //UM default value is 1 
                }
            } else {
                setupAPI = {};
            }
        }
        callback(JSON.stringify({ translationPackage: translationValue, setupAPIData: setupAPI, ctid: ctid }));
    }

    /**
    * this event is fired by the dialog when it finishes to embed the translated text
    * and it wishes to do "fit to window"
    * @param {Object} data - a json object in this case is not relevant
    * @param {String} url - the name type of the dialog
    * @param {Object} callback - a callback function
    */
    function resizeDialog(data, url, callback) {

        var width = parseInt(data.width);
        var height = parseInt(data.height);
        width = width < 10 ? 700 : width;
        height = height < 10 ? 700 : height;
        conduit.abstractionlayer.backstage.popup.resize(firstTimeDialogPopupId, width, height, function (data) {
            if (data.status) {
                conduit.coreLibs.logger.logError('Failed to resize first time dialog: ' + url, loggerContext, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, reportToServer: true });
            }
        });

        if (callback) {
            callback('');
        }
    }

    function closeDialog(data, url, callback) {
        if (firstTimeDialogPopupId) {
            conduit.abstractionlayer.backstage.popup.close(firstTimeDialogPopupId, function () { });
        }
    }

    /**
    * this event is fired by the user clicks on the finish button to close the dialog
    * and save his settings.
    * @param {Object} data - a json object in this case is not relevant
    * @param {String} url - the name type of the dialog
    * @param {Object} callback - a callback function
    */
    function dialogClientClick(data, url, callback) {
        try {
            var popupId = firstTimeDialogPopupId;
            var dialogFunctions = {
                'toolbarOptions': function (data, url, callback) { },
                'toolbarFirstTime': function (data, url, callback) {

                    //CONSTANT Array that contain the personal apps type and status(checked|not checked)
                    var dialogAppsActions = {
                        "email": { type: 'EMAIL_NOTIFIER', status: 0 },
                        "weather": { type: 'WEATHER', status: 0 },
                        "radio": { type: 'RADIO_PLAYER', status: 0 },
                        "facebook": { type: 'BROWSER_COMPONENT', status: 0 }
                    };

                    /*
                    * remove the personalApps key
                    */
                    repository.removeLocalData('personalApps');

                    // set the status of the apps relativity to the checked apps in the dialog box
                    var setAppStatus = function (realApps) {
                        for (var appIndex in realApps) {
                            if (dialogAppsActions[appIndex] && realApps[appIndex].checked === true) {
                                dialogAppsActions[appIndex].status = 1;
                            }
                        }
                    }

                    setAppStatus(JSON.parse(data)); // set the local apps status

                    addNewPersonalApps(dialogAppsActions);

                    //invoke global actions like set homepage and adding search providers
                    invokeGlobalActions(JSON.parse(data).extraOptions, function () {

                        if (popupId) {
                            conduit.abstractionlayer.backstage.popup.close(popupId, function (data) {

                                //send usage.
                                if (parseInt(data.status) === 0) {

                                    var appManagerModel = conduit.applicationLayer.appCore.appManager.model;

                                    appManagerModel.sendUsage({
                                        type: "sendToolbarUsage",
                                        actionType: "WLCM_DLG_FINISH"
                                    });
                                }

                                //If FTD exist call finalize dialog only after the popup was closed
                                //set the firstTimeToolbar dialog to true, now it will not show never again
                                //save unique id to the toolbar, then when the next toolbar installed will show again
                                finalizeDialog();
                            });
                        }
                        else { //call finalizeDialog also if there is no FTD 
                            //set the firstTimeToolbar dialog to true, now it will not show never again
                            //save unique id to the toolbar, then when the next toolbar installed will show again
                            finalizeDialog();
                        }
                    });
                }
            };

            dialogFunctions[url](data, url, callback);
        }
        catch (e) {
            conduit.coreLibs.logger.logError('Failed to close first time dialog: ' + JSON.stringify(data), { className: "dialog.model", functionName: "dialogClientClick" }, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, error: e });
        }
    }

    function finalizeDialog() {
        try {
            absRepository.setKey(ctid + '.firstTimeDialogOpened', "true");
            // only after the first time dialog, we can start the login service for the first time.
            absRepository.saveAllKeys();
            if (!isChrome && !isIE && serviceLayer.login) {
                if (isAfterUpgrade && serviceLayer.login.handleFeatureProtectorData) {
                    serviceLayer.login.handleFeatureProtectorData(true);
                } else if (serviceLayer.login.start) {
                    serviceLayer.login.start();
                }
            }

            var appManagerModel = conduit.applicationLayer.appCore.appManager.model;

            var activeCTID = serviceLayer.login.getActiveCTID();

            if (isFF || !shouldShowFirstTime) {
                appManagerModel.openWelcomePage(activeCTID);
            }

            //notify apps that the toolbar is ready and FTD is closed.
            conduit.triggerEvent("onReady", { name: 'toolbarReady' });
            conduit.abstractionlayer.commons.environment.getProfileData(function (res) {
                if (res.status === 0) {
                    conduit.applicationLayer.appCore.appManager.model.sendUsage({ type: "sendToolbarUsage", actionType: "SEND_PROFILE_DATA", additionalUsageInfo: res.result });
                }
            });
            if (conduit.webappApi) {
                conduit.webappApi.platform.onToolbarReady.toolbarReady();
            }

            conduit.abstractionlayer.backstage.browser.isBookmarksEnabled(function (bookmarksEnabledResult) {
                if (bookmarksEnabledResult.status == 0) {
                    var numOfLinks = -1;
                    conduit.abstractionlayer.backstage.browser.getBookmarks(function (data) {
                        var bookmarks = data.result;
                        if (bookmarksEnabledResult.result && /true/i.test(bookmarksEnabledResult.result)) {
                            numOfLinks = bookmarks.length;
                        }
                        conduit.applicationLayer.appCore.appManager.model.sendUsage({ type: "sendToolbarUsage", actionType: "BOOKMARKS_ENABLED", additionalUsageInfo: { isEnabled: bookmarksEnabledResult.result, numOfLinks: numOfLinks} });
                    });
                }
            });
        }
        catch (e) {
            conduit.coreLibs.logger.logError('Failed to close and finalize first time dialog: ', { className: "dialog.model", functionName: "finalizeDialog" }, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, error: e });
        }
    }

    /*
    * Send request to the service layer to get the personal components settings.
    * in the callback add the new personal apps to the model and store their type as keys in the repository.
    */
    function addNewPersonalApps(dialogAppsActions) {
        var loggerContext = { className: "dialog.model", functionName: "addNewPersonalApps" };
        conduit.coreLibs.logger.logDebug('Start', loggerContext);

        //get the personal components data from service layer
        var appsData = serviceLayer.config.toolbarSettings.getPersonalAppsData();
        if (appsData) {

            conduit.coreLibs.logger.logDebug('Got PersonalAppsData from settings', loggerContext);
            try {
                var currentApps = {}; //Will save the apps with associative indexing
                //Reindexing the apps by associative keys
                (function (appsData) {
                    for (var appsDataIndex in appsData) {
                        currentApps[appsData[appsDataIndex].appType] = appsData[appsDataIndex];
                    }
                })(appsData);

                var appData = null;
                var personalAppType = null;
                var personalAppTypeArray = [],
                appsOptions = conduit.coreLibs.config.getAppOptions();

                // iterate through the dialogAppsActions array and passing it by (status=1) to the repData
                for (var appIndex in dialogAppsActions) {
                    if (dialogAppsActions[appIndex].status === 1) {
                        personalAppType = dialogAppsActions[appIndex].type;
                        personalAppTypeArray.push(personalAppType);
                        appData = currentApps[personalAppType];

                        var options = appsOptions[appData.appId];
                        if (!options) {
                            options = {};
                            appsOptions[appData.appId] = options;
                        }

                        options.render = true;
                        // add apps to the model and view
                        var loader = conduit.applicationLayer.appCore.loader;
                        var appManagerModel = conduit.applicationLayer.appCore.appManager.model;
                        conduit.coreLibs.logger.logDebug('About to load bgPage for personal app: ' + appData.appId + ". appsOptions: " + JSON.stringify(appsOptions), loggerContext);
                        loader.initBGpagesList([appData]);
                        appManagerModel.addApp(appData);
                    }
                }
                conduit.coreLibs.logger.logDebug('About to setAppOptions: ' + JSON.stringify(appsOptions), loggerContext);
                conduit.coreLibs.config.setAppOptions(appsOptions);
                conduit.coreLibs.logger.logDebug('After setAppOptions', loggerContext);
                //save the selected apps to the repository
                if (personalAppTypeArray.length > 0) {
                    repository.setLocalData("personalApps", personalAppTypeArray, false, function () { });
                }
                conduit.coreLibs.logger.logDebug('End', loggerContext);
            }
            catch (e) {
                conduit.coreLibs.logger.logError('Failed to add New Personal Apps from first time dialog: ' + result, { className: "dialog.model", functionName: "addNewPersonalApps" }, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, error: e });
            }
        }
    }

    function createSearchProtectorData(callback) {

        conduit.coreLibs.repository.getLocalData("searchProtectorData", function (searchProtectorData) {

            var featureProtector = searchProtectorData ? searchProtectorData : {};

            var browserSearchProtectorEnabled = featureProtector.browserSearch && featureProtector.browserSearch.enabled == false ? false : true;

            var homePageProtectorEnabled = featureProtector.homepage && featureProtector.homepage.enabled == false ? false : true;

            featureProtector.browserSearch = { enabled: browserSearchProtectorEnabled };
            featureProtector.homepage = { enabled: homePageProtectorEnabled };
            featureProtector.homepageProtectCount = 0;
            featureProtector.searchProtectCount = 0;
            featureProtector.homepageProtectChoise = 'null';
            featureProtector.searchProtectChoise = 'null';
            featureProtector.homepageChangedManually = false;
            featureProtector.searchChangedManually = false;
            featureProtector.searchProviderSelectedByUser = false;
            featureProtector.homepageSelectedByUser = false;

            var homepageUrl = searchManager.getFormattedUrl("homePage");


            var searchUrl = searchManager.getFormattedUrl("searchBox");
            var searchEngine = absRepository.getKey(ctid + ".defaultSearchDisplayName").result || context.getToolbarName().result + " Customized Web Search";
            var addressUrl = searchManager.getFormattedUrl("addressBar");

            featureProtector.searchUrlFromSettings = searchUrl;
            featureProtector.searchEngineFromSettings = searchEngine;
            featureProtector.searchAddressUrlFromSettings = addressUrl;
            featureProtector.homepageUrlFromSettings = homepageUrl;

            callback(featureProtector);
        });
    }


    /*
    * invoke global actions like set homepage and adding search providers
    * extraOptions - Object indicating the settings of all the extra personal apps
    */
    function invokeGlobalActions(extraOptions, callbackFunc) {

        try {
            // Global actions meant for other actions except from personal apps            
            createSearchProtectorData(function (searchProtectorData) {
                try {
                    var dialogGlobalActions = {
                        'HomepageIsSet': function () {
                            //this code is for FF only!
                            searchProtectorData.homepageSelectedByUser = true;
                            //keep the current homepage url as the original home page url - must be done here since the external SP will take over the homepage after updating the homepage white list
                            if (absRepository.getKey(ctid + Consts.ORIGINAL.homepage).status) {
                                absRepository.setKey(ctid + Consts.ORIGINAL.homepage, business.getHomePage().result.homepage);
                            }
                            updateHomepageProtectorWhiteList(searchProtectorData.homepageUrlFromSettings);
                            conduit.coreLibs.logger.validateUrl(searchProtectorData, { className: "dialog.model", functionName: "invokeGlobalActions" });
                            var homepageXPETakeover = absRepository.getKey(ctid + "." + Consts.XPE_TAKEOVER.homepage);
                            if (!homepageXPETakeover.status) {
                                absRepository.removeKey(ctid + "." + Consts.XPE_TAKEOVER.homepage);
                            }
                            if (homepageXPETakeover.status || (homepageXPETakeover.result && homepageXPETakeover.result != 'true')) {
                                business.setHomePage(searchProtectorData.homepageUrlFromSettings);
                            }


                        },
                        'FFSearchIsDefault': function () {

                            updateSearchProtectorWhiteLists(searchProtectorData.searchAddressUrlFromSettings, searchProtectorData.searchEngineFromSettings);
                            var searchXPETakeover = absRepository.getKey(ctid + "." + Consts.XPE_TAKEOVER.searchEngine);
                            if (!searchXPETakeover.status) {
                                absRepository.removeKey(ctid + "." + Consts.XPE_TAKEOVER.searchEngine);
                            }
                            if (searchXPETakeover.status || (searchXPETakeover.result && searchXPETakeover.result != 'true')) {
                                business.setSearchProvider(searchProtectorData.searchUrlFromSettings, searchProtectorData.searchEngineFromSettings, { disableSuggest: !getConfigData("enableSearchSuggestFromSearchBox") });
                            }


                            var searchAddressUrlFromSettings = searchProtectorData.searchAddressUrlFromSettings;
                            //mark that user want to take over address bar searches
                            conduit.abstractionlayer.commons.repository.setKey(ctid + ".searchFromAddressBarEnabledByUser", "true");
                            takeOverSearchAddressUrl({ url: searchAddressUrlFromSettings, installation: true });

                            searchProtectorData.searchProviderSelectedByUser = true;
                        },
                        'FixPageNotFoundErrorsChecked': function () {
                        }
                    };

                    if (!extraOptions || (extraOptions['HomepageIsSet'] && !extraOptions['HomepageIsSet'].visible)) {
                        if (!extraOptions) {
                            extraOptions = {};
                        }
                        // in FF, if there is no dialog, we need to check the default behavior
                        if (isFF) {
                            if (searchManager.isAssestEnabled("homePage")) {
                                dialogGlobalActions.HomepageIsSet();
                            }

                            if (searchManager.isAssestEnabled("searchBox")) {
                                dialogGlobalActions.FFSearchIsDefault();
                            } else if (!searchManager.isAssestEnabled("addressBar")) {
                                resetGlobalSelectedCTID();
                            }

                        }
                    }

                    for (var actionIndex in extraOptions) {
                        if (typeof (dialogGlobalActions[actionIndex]) !== 'undefined' && Boolean(extraOptions[actionIndex].checked) === true) {
                            dialogGlobalActions[actionIndex]();
                        }
                    }

                    if (extraOptions['AlertEnabled'] && extraOptions['AlertEnabled'].visible) {
                        handleAlertEnabled(extraOptions['AlertEnabled'].checked);
                    }

                    if (extraOptions['FFSearchIsDefault'] && extraOptions['FFSearchIsDefault'].visible && Boolean(extraOptions['FFSearchIsDefault'].checked) !== true) {
                        absRepository.setKey(ctid + ".searchFromAddressBarEnabledByUser", "false");
                        absRepository.setKey(ctid + '.searchSuggestEnabledByUser', "false");
                    }

                    if (extraOptions['revertSettingsEnable'] && extraOptions['revertSettingsEnable'].visible) {
                        var revertSettingsEnable = extraOptions.revertSettingsEnable.checked ? "true" : "false";

                        absRepository.setKey(ctid + ".revertSettingsEnabled", revertSettingsEnable);
                    }
                    if (searchProtectorData && !searchProtectorData.homepageSelectedByUser && !isChrome) {
                        absRepository.setKey(ctid + ".searchInNewTabEnabledByUser", "false");
                    }

                    if (searchProtectorData) { //save the data here only  
                        conduit.coreLibs.repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
                    }
                    absRepository.saveAllKeys();

                    if (callbackFunc) {
                        callbackFunc();
                    }
                } catch (e) {
                    conduit.coreLibs.logger.logError('Failed to invoke Global Actions in first time dialog', { className: "dialog.model", functionName: "invokeGlobalActions" }, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, error: e });
                }
            });

        }
        catch (e) {
            conduit.coreLibs.logger.logError('Failed to create Search Protector data in first time dialog', { className: "dialog.model", functionName: "invokeGlobalActions" }, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, error: e });
        }
    }

    // params (object)
    //                url - searchAddressUrlFromSettings
    //                verifyEnabledInHidden - should we check if to take over the search in hidden mode
    //                installation - (boolean) true when called when toolbar is installed
    //                forceTakeOver - (boolean) take over the url even if the Smartbar.keywordURLSelectedCTID is empty or not mine
    function takeOverSearchAddressUrl(params) {
        function shouldNotRetake() {
            if (params.forceTakeOver) {
                return false // user selection from options
            }

            var FF19Solved = conduit.abstractionlayer.commons.repository.getKey(ctid + ".FF19Solved");
            return (!FF19Solved.status && /false/i.test(FF19Solved.result)) //XPE mode 10, do not hide FF native search protector
        }

        if (!params) {
            params = {};
        }
        if (shouldNotRetake() || (params.verifyEnabledInHidden && !isSearchInNewTabTakeOverEnabledInHidden())) {
            return;
        }

        var activeCTID = serviceLayer.login.getActiveCTID();

        // this is the legacy logic, not an error
        if (searchManager.isAssestEnabled("searchBox") || params.forceTakeOver || searchManager.isAssestEnabledByUser("addressBar")) {

            var searchAddressUrlFromSettings = params.url;
            if (!searchAddressUrlFromSettings) {
                searchAddressUrlFromSettings = searchManager.getFormattedUrl("addressBar");
            }
            if (!searchManager.isAssestEnabled("addressBar") && !params.forceTakeOver && !searchManager.isAssestEnabledByUser("addressBar")) {
                resetGlobalSelectedCTID();
            }
            else {
                if (params.installation) {
                    // first installation                                         
                    absRepository.setKey(conduit.utils.consts.GLOBAL.SELECTED_CTID, ctid); //Smartbar.keywordURLSelectedCTID  // should we also do it in SP?
                    absRepository.setKey(ctid + '.' + Consts.SEARCH_ADDRESS_BAR_URL, searchAddressUrlFromSettings); // CTXXX.SearchFromAddressBarUrl

                    var currentSearchAddressUrl = getSearchAddressUrlFromRepository();
                    var repositoryResponse = absRepository.getKey(conduit.utils.consts.GLOBAL.ADDRESS_BAR_SAVED_URL); //Smartbar. SearchFromAddressBarSavedUrl 
                    if (repositoryResponse && repositoryResponse.status) {
                        // should happen only once when this is the first smartbar installed on this browser. (for FF only!)
                        if (currentSearchAddressUrl) {
                            absRepository.setKey(conduit.utils.consts.GLOBAL.ADDRESS_BAR_SAVED_URL, currentSearchAddressUrl);
                        }
                    }
                    var addresbarXPETakeover = absRepository.getKey(ctid + "." + Consts.XPE_TAKEOVER.addresbar);
                    if (!addresbarXPETakeover.status) {
                        absRepository.removeKey(ctid + "." + Consts.XPE_TAKEOVER.addresbar);
                    }
                    if (addresbarXPETakeover.status || (addresbarXPETakeover.result && addresbarXPETakeover.result != 'true')) {
                        setSearchAddressUrl(searchAddressUrlFromSettings);
                    }
                    searchManagerQueue.add(function () {
                        if (searchManager.isAssestEnabled("suggest")) {
                            conduit.abstractionlayer.commons.autoComplete.changeState(true);
                        }
                    }, [true]);
                }
                else {
                    // secondary takeover
                    if (params.forceTakeOver) {
                        absRepository.setKey(conduit.utils.consts.GLOBAL.SELECTED_CTID, ctid); //Smartbar.keywordURLSelectedCTID                        
                        setSearchAddressUrl(searchAddressUrlFromSettings);
                    }
                    else {
                        /*
                        when toolbar starts - if Smartbar.keywordURLSelectedCTID (CTXXX) is my ctid, I will be take over the address bar.
                        if not, check if we have pref called CTXXX.SearchFromAddressBarUrl. if so, use its value to take over the address bar.
                        if not, use my url to take over the address bar and set CommunityToolbar.keywordURLSelectedCTID my ctid
                        */
                        var selectedCTIDResponse = absRepository.getKey(conduit.utils.consts.GLOBAL.SELECTED_CTID); //Smartbar.keywordURLSelectedCTID 
                        if (selectedCTIDResponse && !selectedCTIDResponse.status) {
                            var selectedCTID = selectedCTIDResponse.result;
                            if (selectedCTID == ctid) {
                                // if Smartbar.keywordURLSelectedCTID is my ctid, I will be take over the address bar.                                
                                setSearchAddressUrl(searchAddressUrlFromSettings);
                            }
                            else {
                                var urlResponse = absRepository.getKey(selectedCTID + '.' + Consts.SEARCH_ADDRESS_BAR_URL); //CTXXX.SearchFromAddressBarUrl
                                if (urlResponse && !urlResponse.status && urlResponse.result) {
                                    // found an additional smartbar that should take over the search, lets help him in case he is not alive...                                    
                                    setSearchAddressUrl(urlResponse.result, true, selectedCTID);
                                }
                            }
                        } // no one should take over the search address bar. is it is disabled.                    
                    }
                }
            }
        }
    }

    function resetGlobalSelectedCTID() {
        // enableSearchFromAddressBar value is false. we will not take over the address bar
        var selectedCTIDResponse = absRepository.getKey(conduit.utils.consts.GLOBAL.SELECTED_CTID); //Smartbar.keywordURLSelectedCTID 
        if (selectedCTIDResponse && !selectedCTIDResponse.status && selectedCTIDResponse.result == ctid) {
            // no one should take over the search address bar. is it is disabled.
            absRepository.setKey(conduit.utils.consts.GLOBAL.SELECTED_CTID, ""); //Smartbar.keywordURLSelectedCTID  // should we also do it in SP?
        }
        conduit.coreLibs.logger.logDebug(ctid + '.enableSearchFromAddressBar value is false. we will not take over the address bar', { className: "dialog.model", functionName: "resetGlobalSelectedCTID" });
    }

    function setSearchAddressUrl(url, enabled, ctid) {
        business.setSearchAddressUrl(url, enabled);
        if (ctid && enabled) {
            absRepository.setKey(conduit.utils.consts.GLOBAL.ADDRESSURL_OWNER, ctid); //smartbar.addressBarOwnerCTID
        }
    }

    // checks if we can revet the search from address url to the one that was set before any toolbar (SB/OB) was installed on this browser.
    // if the url belongs to conduit - reset it to the browser's default.
    function getValidAddressBarSavedUrl(keyName) {
        var url = "";

        var repositoryResponse = absRepository.getKey(keyName); //Smartbar.SearchFromAddressBarSavedUrl or CommunityToolbar.SearchFromAddressBarSavedUrl
        if (repositoryResponse && !repositoryResponse.status && repositoryResponse.result) {
            var topLevelDomain = conduit.utils.general.getTopLevelDomainName(repositoryResponse.result);
            if (topLevelDomain != conduit.utils.consts.GLOBAL.CONDUIT_TOP_LEVEL_DOMAIN && topLevelDomain != conduit.utils.consts.GLOBAL.QASITE_TOP_LEVEL_DOMAIN) {
                // revert to the first ever url, e.g. google (for FF only!)
                url = repositoryResponse.result;
            }
        }

        return url;
    }

    function disableSearchAddressUrl(params) {
        // this is called when the checkbox in unchecked from the toolbar options dialog
        absRepository.setKey(conduit.utils.consts.GLOBAL.SELECTED_CTID, ""); //Smartbar.keywordURLSelectedCTID
        var url = "";
        url = getValidAddressBarSavedUrl(conduit.utils.consts.GLOBAL.ADDRESS_BAR_SAVED_URL); //Smartbar.SearchFromAddressBarSavedUrl
        if (!url && isFF) {
            // check oldbar pref
            url = getValidAddressBarSavedUrl(conduit.utils.consts.GLOBAL.OLDBAR_ADDRESS_BAR_SAVED_URL); //CommunityToolbar.SearchFromAddressBarSavedUrl
        }
        var enabled = isIE || !url ? false : true;
        setSearchAddressUrl(url, enabled); // false will turn off searches for IE8 only! and will reset the pref in FF.
    }

    function getSearchAddressUrlFromRepository() {
        var response = conduit.abstractionlayer.backstage.business.featureProtector.getSearchAddressUrl();
        if (response && response.result && response.result.url) {
            return response.result.url;
        }
        return null;
    }

    function isSearchInNewTabTakeOverEnabledInHidden() {
        var isEnabledInHidden = true;

        if (conduit.abstractionlayer.backstage.browser.isHidden().result) {
            var response = absRepository.getKey(ctid + ".addressBarTakeOverEnabledInHidden");

            if (response && !response.status) {
                isEnabledInHidden = /true/i.test(response.result)
            }
        }

        return isEnabledInHidden;
    }

    function handleAlertEnabled(enable) {
        var enableAlerts = enable ? "always" : "never";
        absRepository.setKey(ctid + ".enableAlerts", enableAlerts);
        // update the notification app
        conduit.abstractionlayer.commons.messages.postTopicMsg("adv:NotificationSettingsUpdate", "applicationLayer.dialog.model", enableAlerts);
    }

    function updateDefaultSearchData(userID) {
        var currEngine = business.getSearchProviderEngine().result;
        var selectedEngineUrl;
        var updateSuggest;
        if (business.isSearchEngineOwnedByThisToolbar(currEngine.selectedEngine)) {
            if (!/CUI/i.test(currEngine.selectedEngineUrl)) {
                var topLevelDomain = conduit.utils.general.getTopLevelDomainName(currEngine.selectedEngineUrl);
                if (topLevelDomain == conduit.utils.consts.GLOBAL.CONDUIT_TOP_LEVEL_DOMAIN || topLevelDomain == conduit.utils.consts.GLOBAL.QASITE_TOP_LEVEL_DOMAIN) {
                    selectedEngineUrl = currEngine.selectedEngineUrl.replace('q=', 'q={searchTerms}') + "&CUI=" + userID;
                    updateSearchProtectorWhiteLists(selectedEngineUrl, currEngine.selectedEngine);
                }
            }
            var isSuggestEnabled = getConfigData("enableSearchSuggestFromSearchBox");
            if (!!currEngine.suggestEnabled != !!isSuggestEnabled) {
                updateSuggest = true;
            }
            if (updateSuggest || selectedEngineUrl) {
                business.setSearchProvider(selectedEngineUrl || currEngine.selectedEngineUrl.replace('q=', 'q={searchTerms}'), currEngine.selectedEngine, { updateEngine: true, disableSuggest: !isSuggestEnabled });
            }
        }
    }

    function getConfigData(param) {
        var configData = conduit.backstage.serviceLayer.config.toolbarSettings.getConfiglData();
        return configData && configData[param];
    }


    function verifyCUIInHomepage(userID) {

        var currHomePage = business.getHomePage().result.homepage;
        if (business.isIHomepageOwnedByThisToolbar(currHomePage)) {
            if (!/CUI/i.test(currHomePage)) {
                var topLevelDomain = conduit.utils.general.getTopLevelDomainName(currHomePage);
                if (topLevelDomain == conduit.utils.consts.GLOBAL.CONDUIT_TOP_LEVEL_DOMAIN || topLevelDomain == conduit.utils.consts.GLOBAL.QASITE_TOP_LEVEL_DOMAIN) {
                    currHomePage = currHomePage.replace("?", "?CUI=" + userID + "&");
                    updateHomepageProtectorWhiteList(currHomePage);
                    business.setHomePage(currHomePage);
                }

            }
        }
    }

    function setFeaturesKeys(isAfterUpgrade) {
        function setDefaultKey(defaultKeyName, newKeyName, forceCreation, reset) {
            var newKeyNameExist = conduit.abstractionlayer.commons.repository.getKey(ctid + "." + newKeyName);
            var defaultKey = false;
            var isEnabled = false;
            if (!newKeyNameExist.status && reset) {
                conduit.abstractionlayer.commons.repository.removeKey((ctid + "." + newKeyName));
            }
            else if (newKeyNameExist.status || forceCreation) {
                var defaultKey = conduit.abstractionlayer.commons.repository.getKey(ctid + "." + defaultKeyName);
                var isEnabled = defaultKey.status ? "true" : defaultKey.result;

                conduit.abstractionlayer.commons.repository.setKey((ctid + "." + newKeyName), isEnabled);
            }
        }
        setDefaultKey("searchInNewTabEnabled", "searchInNewTabEnabledByUser", isAfterUpgrade, isAfterUpgrade);
        setDefaultKey("fixPageNotFoundError", "fixPageNotFoundErrorByUser", isAfterUpgrade, isAfterUpgrade);
        setDefaultKey("enableSearchFromAddressBar", "searchSuggestEnabledByUser", isAfterUpgrade); //disable search suggest if we didn't take address bar
    }

    function handleSearchProviderProtector(searchProtectorData) {

        var searchAddressUrlFromSettings = searchProtectorData.searchAddressUrlFromSettings;

        if (searchProtectorData.searchProviderSelectedByUser == false) {
            //support default search                  
            var response = absRepository.getKey(ctid + '.shouldModifyDefaultSearch');
            var shouldModifyDefaultSearch = false;
            if (response && !response.status) {
                shouldModifyDefaultSearch = /true/i.test(response.result);
            }

            if (shouldModifyDefaultSearch) {
                conduit.abstractionlayer.backstage.business.featureProtector.setSearchProvider(searchProtectorData.searchUrlFromSettings, searchProtectorData.searchEngineFromSettings, { disableSuggest: !getConfigData("enableSearchSuggestFromSearchBox") });
            }

            // check if the searchProvider is set in silent installation 
            var value = conduit.abstractionlayer.backstage.business.featureProtector.getSearchAddressUrl();
            if (value && value.result) {
                var result = value.result;

                if (/true/i.test(result.isSet) && result.url == searchAddressUrlFromSettings) {
                    // we need to start the protector and update the white list
                    searchProtectorData.searchProviderSelectedByUser = true;
                    updateSearchProtectorWhiteLists(searchAddressUrlFromSettings, searchProtectorData.searchEngineFromSettings);
                    // consider limit it for IE only
                    takeOverSearchAddressUrl({ url: searchAddressUrlFromSettings, installation: true });
                }
            }
        }
    }

    function updateSearchProtectorWhiteLists(searchProvider, searchEngine) {

        absRepository.setKey(conduit.utils.consts.GLOBAL.SEARCH_URL_LIST, searchProvider);
        absRepository.setKey(conduit.utils.consts.GLOBAL.SEARCH_ENGINE_LIST, searchEngine);

    }

    function handleHomepageProtector(searchProtectorData) {

        var homepageUrlFromSettings = searchProtectorData.homepageUrlFromSettings;

        if (searchProtectorData.homepageSelectedByUser == false) {
            // check if the homepage is set in bundle installation
            var value = conduit.abstractionlayer.backstage.business.featureProtector.getHomePage();
            if (value && value.result) {
                var result = value.result;
                if (/true/i.test(result.isSet) && result.homepage == homepageUrlFromSettings) {
                    // we need to start the protector and update the white list
                    searchProtectorData.homepageSelectedByUser = true;
                    updateHomepageProtectorWhiteList(homepageUrlFromSettings);
                }
            }
        }
    }

    function updateHomepageProtectorWhiteList(homepageUrlFromSettings) {

        absRepository.setKey('Smartbar.ConduitHomepagesList', homepageUrlFromSettings);
    }

    /**
    * this event is fired by the dialog when the user whished to uninstall
    * the toolbar
    * @param {Object} data - a json object in this case is not relevant
    * @param {String} url - the name type of the dialog
    * @param {Object} callback - a callback function
    */
    function dialogUninstall(data, url, callback) {
        appManagerModel.sendUsage({ type: "sendToolbarUsage", actionType: "WLCM_DLG_CLICK_ABORT" });
        var txtUninstallTitle = serviceLayer.translation.getTranslation('CTLP_STR_ID_PERSONAL_COMP_CONFIRM_UNINSTALL_BODY_FF').replace(/\\n/g, "\n");
        var confirmAbort = window.confirm(txtUninstallTitle);
        if (!confirmAbort) { callback(); return; }
        appManagerModel.sendUsage({ type: "sendToolbarUsage", actionType: "WLCM_DLG_CONFIRM_ABORT" });
        if (firstTimeDialogPopupId) {
            conduit.abstractionlayer.backstage.popup.close(firstTimeDialogPopupId, function () { });
        }
        conduit.abstractionlayer.backstage.business.uninstall();
        callback();
    }

    function isFirstTimeDialogOpened() {
        var firstTimeDialogOpened = false; ;
        try {
            var response = conduit.abstractionlayer.commons.repository.getKey(ctid + '.firstTimeDialogOpened');
            if (response && !response.status) {
                firstTimeDialogOpened = true;
            }
        }
        catch (e) {
            // failed to check
        }
        return firstTimeDialogOpened;
    }

    function isToolbarReady() {
        return toolbarReady;
    }


    return {
        takeOverSearchAddressUrl: takeOverSearchAddressUrl,
        disableSearchAddressUrl: disableSearchAddressUrl,
        isToolbarReady: isToolbarReady,
        init: init
    };
});

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.applicationLayer.dialog,
    dependencies: ["applicationLayer.appCore.searchManager"],
    onLoad: conduit.applicationLayer.dialog.init
});

﻿/**
* @fileOverview:  [somedescription]
* FileName: options.model.js
* FilePath: ..ApplicationLayer\Dev\src\main\js\options\js\options.model.js
* Date: 13/9/2011 
* Copyright: 
*/
conduit.register("applicationLayer.options", (function () {

    var messages = conduit.abstractionlayer.commons.messages;
    var popup = conduit.abstractionlayer.backstage.popup;
    var repository = conduit.coreLibs.repository;
    var serviceLayer = conduit.backstage.serviceLayer;
    var popupId;
    var width = 741;
    var height = 532;
    var isPopupOpen = false;
    var absCommon = conduit.abstractionlayer.commons;
    var CTID = absCommon.context.getCTID().result;

    var optionsMethods = {

        /**
        @function
        @description: gets an array of apps to remove and sends it to the service layer.
        */
        removeFromSlAndUpdate: function (appsToRemoveArr, callback) {
            serviceLayer.userApps.removeApp(appsToRemoveArr);
            if (callback) {
                callback(JSON.stringify({ result: true }));
            }
        },
        update: function (data, callback) {

            var appManagerModel = conduit.applicationLayer.appCore.appManager.model,
				modelsList = appManagerModel.getModelsList(),
				viewData = appManagerModel.getViewData(),
                managerAppsList = appManagerModel.getManagerAppsList(),
                personalAppsData,
                settingsAppsData,
                userAppsData,
				userAppsToRemove = []; //this array will hold all the apps to remove.

            var personalAppsData = serviceLayer.config.toolbarSettings.getPersonalAppsData();

            var searchManager = conduit.applicationLayer.appCore.searchManager;
            var pageNotFoundUrl = searchManager.getFormattedUrl("404");

            if (data.pageNotFoundEnabled) {
                absCommon.repository.setExternalKey("revertData." + CTID + ".pageNotFoundUrl", pageNotFoundUrl, function () { });
            }
            else {
                absCommon.repository.removeExternalKey("revertData." + CTID + ".pageNotFoundUrl", function () { });
            }

            if (personalAppsData) {
                var settingsAppsData = serviceLayer.config.toolbarSettings.getAppsData(data.apps);
                if (settingsAppsData) {
                    var userAppsData = serviceLayer.userApps.getAppsData(data.apps);
                    if (userAppsData) {
                        function getApp(array, appId) {
                            if (array) {
                                for (var i = 0; i < array.length; i++) {
                                    var appData = array[i];
                                    if (appData.appId === appId)
                                        return appData;
                                }
                            }

                            return;
                        }

                        for (var appId in data.apps) {
                            var isPersonalApp = false;
                            var appData = modelsList.GetByID(appId) || getApp(settingsAppsData, appId) || getApp(userAppsData, appId);
                            if (!appData) {
                                // if a personal app is not in model we need to add it. (see "if (isPersonalApp)")
                                appData = getApp(personalAppsData, appId);
                                if (appData) {
                                    isPersonalApp = true;
                                }
                            }

                            appData = $.extend(appData, data.apps[appId]);

                            if (appData) {
                                var managedAppsIds = managerAppsList[appData.appId];
                                var showApp = (appData.render && !appData.disabled);
                                if (showApp) {
                                    conduit.applicationLayer.appCore.loader.addBgPage(appData, appData.renderView === false);

                                    if (isPersonalApp) {
                                        // only personal apps can be added to the model from the options!
                                        appManagerModel.addApp(appData);
                                        // if we add the app to model, no need to update view options.
                                        delete data.apps[appId];
                                        continue;
                                    }
                                    // if there is no view to this app (webapp with only bgpage), we need to start the bgpage cause the view will not do it for us.
                                    if (appData.pages && !appData.pages.embedded && !appData.pages.popup) {
                                        conduit.applicationLayer.appCore.loader.createBgPage(appId);
                                    }
                                }
                                else if (appId != "61029") { //search component should work in hidden mode too
                                    // If the app is hidden, remove its BG page, it shouldn't be running.
                                    conduit.applicationLayer.UI.popupManager.closeOpenPopups(appId);
                                    conduit.applicationLayer.appCore.loader.removeBgPage(appId, true);
                                }

                                if (modelsList.GetByID(appId) && appData.viewData) {
                                    appData.viewData.isShow = showApp;
                                    if (viewData && viewData.GetByID(appId)) {
                                        var appsViewData = viewData.GetByID(appId);
                                        appsViewData.isShow = showApp;
                                    }
                                }
                            }

                            //check if the app supposed to be removed.
                            if (appData.isToRemove) {

                                //remove from modelsList.
                                modelsList.Remove(appId);

                                //remove from viewData.
                                viewData.Remove(appId);

                                //update the repository - remove user untrusted settings.
                                conduit.coreLibs.repository.removeLocalKey(appId + 'isEnableThisAppDialog');
                                conduit.coreLibs.repository.removeLocalKey('isCollapsed_' + appId);

                                //remove from view.
                                messages.postTopicMsg("applicationLayer.appManager.view", "applicationLayer.appManager.model",
                                    JSON.stringify({ method: "removeApp", data: appData }));

                                //add to the array.
                                if (appData.isUserApp || appData.isUserWebApp || appData.isDeveloperApp) {
                                    userAppsToRemove.push(appData);
                                }
                            }



                            //handle Managed Apps
                            if (managedAppsIds) {
                                for (var i = 0; i < managedAppsIds.length > 0; i++) {
                                    var managedAppId = managedAppsIds[i];
                                    var managedApp = modelsList.GetByID(managedAppId);
                                    if (managedApp && managedApp.appGuid && (!showApp || appData.isToRemove)) {
                                        // call the webapp api to remove this managed app
                                        conduit.webappApi.advanced.managed.apps.remove(managedApp.appGuid, function () { });
                                    }
                                }
                            }
                        }

                        //set keys for search
                        var search = data.search;
                        for (var key in search) {
                            repository.setLocalKey(key, search[key].toString());
                            var dataObj = null;
                            switch (key) {
                                case "ENABALE_HISTORY":
                                    dataObj = { enableHistory: search[key] };
                                    break;
                                case "selectToSearchBoxEnabled":
                                    dataObj = { isSelectToSearchBoxEnabled: search[key] };
                                    repository.setLocalKey('selectToSearchBoxEnabledByUser', 'true'); //set a key that mark that the decision was done by user
                                    break;
                            }
                            if (dataObj) {
                                conduit.abstractionlayer.commons.messages.postTopicMsg("adv:update_search_options", "applicationLayer.appManager.model", JSON.stringify(dataObj));
                            }
                        }

                        close();

                        conduit.abstractionlayer.commons.messages.postTopicMsg("applicationLayer.appManager.view", "applicationLayer.appManager.model", JSON.stringify({ method: "options", data: data.apps }));

                        //if we have something in the array we continue.
                        if (userAppsToRemove.length > 0) {
                            optionsMethods.removeFromSlAndUpdate(userAppsToRemove, callback);
                        }
                        else {
                            if (callback) {
                                callback(JSON.stringify({ result: true }));
                            }
                        }

                    }

                }

            }
        },
        close: function (data) {
            var appManagerModel = conduit.applicationLayer.appCore.appManager.model;
            var settingsGeneralData = appManagerModel.getSettingsGeneralData();
            var webServerUrl = conduit.coreLibs.config.getToolbarUrl(settingsGeneralData);     
            if (data) {
                if (data.openMarketPlacePage) {
                    // open market place page. 
                    conduit.abstractionlayer.backstage.tabs.create("http://apps.conduit.com", "", true, function (result) {
                    });
                }
                else if (data.openHelpPage) {
                    // open help page.
                    var helpUrl = webServerUrl + "/help/?version=" + conduit.abstractionlayer.commons.environment.getEngineVersion().result;
                    conduit.abstractionlayer.backstage.tabs.create(helpUrl, "", true, function (result) {
                    });
                }
                else if (data.openContactUsPage) {
                    // open contact us page.
                    var contactUsUrl = webServerUrl + "/contact/";
                    conduit.abstractionlayer.backstage.tabs.create(contactUsUrl, "", true, function (result) {
                    });
                }
                else if (data.openPrivacyPage) {
                    // open privacy page. 
                    var privacyUrl = webServerUrl + "/privacy/?version=" + conduit.abstractionlayer.commons.environment.getEngineVersion().result;
                    conduit.abstractionlayer.backstage.tabs.create(privacyUrl, "", true, function (result) {
                    });
                }
                else if (data.openEULAPage) {
                    // open end user license agreement page. 
                    var licenceAggreementUrl = webServerUrl + "/EULA/";
                    conduit.abstractionlayer.backstage.tabs.create(licenceAggreementUrl, "", true, function (result) {
                    });
                }
            }
            close();
        },
        getApps: function (data, callback) {
            var appManagerModel = conduit.applicationLayer.appCore.appManager.model;

            var modelsList = appManagerModel.getModelsList();
            var appsInfoObj = {},
				personalApps = [],
                mystuffApps = [],
				apps = {};
            var appInfo;
            var app;
            var models = modelsList.GetValuesArray();
            for (var index in models) {
                app = models[index];
                if (app.isPersonalApp) {
                    personalApps.push(app);
                }
                else if (app.isUserApp || app.isDeveloperApp || app.isUserWebApp) {
                    mystuffApps.push(app);
                }
                else {
                    apps[app.appId] = app;
                }
            }
            appsInfoObj.personalApps = personalApps;
            appsInfoObj.mystuffApps = mystuffApps;
            appsInfoObj.apps = apps
            callback(JSON.stringify(appsInfoObj));
        },
        takeOverSearchAddressUrl: function (data, callback) {
            // called from the toolbar options when the 'enable search from address bar' check box is checked
            conduit.applicationLayer.dialog.takeOverSearchAddressUrl(data);
            if (callback) {
                callback('');
            }
        },
        disableSearchAddressUrl: function (data, callback) {
            // called from the toolbar options when the 'enable search from address bar' check box is unchecked
            conduit.applicationLayer.dialog.disableSearchAddressUrl(data);
            if (callback) {
                callback('');
            }
        },
        enableSearchSuggest: function (data, callback){
            conduit.abstractionlayer.commons.autoComplete.changeState(data);
        },
        sendUsage: function (data, callback) {
            var appManagerModel = conduit.applicationLayer.appCore.appManager.model;

            appManagerModel.sendUsage({
                type: "sendToolbarUsage",
                actionType: data.actionType,
                additionalUsageInfo: data.additionalUsageInfo
            });
            if (callback) {
                callback('');
            }
        }
    }

    /**
    @function
    @description: 
    */
    function init() {

        //set first time search key
        var isData = repository.getLocalKey('ENABALE_HISTORY');
        if (!isData) {
            repository.setLocalKey('ENABALE_HISTORY', 'true');
        }

        var isEnableAllDialogs = repository.getLocalKey('isEnableAllDialogs');
        if (!isEnableAllDialogs) {
            repository.setLocalKey('isEnableAllDialogs', 'true');

        }

        var selectToSearchBoxEnabledKeyName = 'selectToSearchBoxEnabled';
        var isSelectToSearchBoxEnabled = repository.getLocalKey(selectToSearchBoxEnabledKeyName);        
        var app;
        var settingsAppsData = serviceLayer.config.toolbarSettings.getAppsData();
        for (var i = 0, count = settingsAppsData.length; i < count && !app; i++) {
            var appData = settingsAppsData[i];
            if (appData && appData.appType === "SEARCH") {
                app = { index: i, appData: appData };
                break;
            }
        }
        if (app) {
            var selectToSearchBox = app.appData.data && app.appData.data.selectToSearchBox;
            if (selectToSearchBox && selectToSearchBox.enabled !== "undefined") {
                if (/false/i.test(selectToSearchBox.enabled)) {
                    repository.setLocalKey(selectToSearchBoxEnabledKeyName, 'false');
                    repository.removeLocalKey('selectToSearchBoxEnabledByUser'); //remove the mark for decide by user
                }
                else {
                    var isSelectToSearchBoxEnabledByUser = repository.getLocalKey('selectToSearchBoxEnabledByUser');
                    if (!isSelectToSearchBoxEnabledByUser) { //Update the key default behavior only if it wasn't updated by the user
                        if (selectToSearchBox['default'] !== 'undefined' && /false/i.test(selectToSearchBox['default'])) {
                            repository.setLocalKey(selectToSearchBoxEnabledKeyName, 'false');
                        }
                        else {
                            repository.setLocalKey(selectToSearchBoxEnabledKeyName, 'true');
                        } 
                    }
                }
            }
        }
        isSelectToSearchBoxEnabled = repository.getLocalKey(selectToSearchBoxEnabledKeyName); //check again if the key exist, if not set it as true
        if (!isSelectToSearchBoxEnabled) {
            repository.setLocalKey(selectToSearchBoxEnabledKeyName, 'true');
        }        

        messages.onSysReq.addListener('handleOptions', function (result, sender, callback) {
            var dataObj = JSON.parse(result),
				method = dataObj.method;

            if (method == "resize") {
                popup.resize(popupId, width, height, function (data) {
                    callback("");
                });
            }
            else {
                delete dataObj.method;
                optionsMethods[method](dataObj.data, callback);
            }

        });
    }

    /**
    @function
    @description: 
    */
    function close() {
        popup.close(popupId, function () {
            isPopupOpen = false;
        });
    }

    /**
    @function
    @description: refresh the toolbar.
    */
    function refreshToolbar() {
        serviceLayer.config.toolbarSettings.refresh();
        //update the optionsData
        var appManagerModel = conduit.applicationLayer.appCore.appManager.model;
        appManagerModel.setDataForOptions();
    }


    function open(params) {

        if (isPopupOpen)
            return;

        conduit.coreLibs.UI.getScreenWidth(function (screenDimensions) {
            var applicationDirName = conduit.coreLibs.config.getApplicationDirName();
            var applicationPath = conduit.abstractionlayer.commons.environment.getApplicationPath().result + applicationDirName + "/al/options/options.html";
            var top = parseInt((screen.height - height) * 0.5);
            var left = parseInt(screenDimensions.offset + (screenDimensions.width - width) * 0.5);
            popup.open(top, left, 1, 1, applicationPath, null, true, false, false, true, { isInnerTransparent: true, isDialog: true, isFocused: true }, function (data) {
                popupId = data.result;
                isPopupOpen = true;
                popup.addCloseCallbackFunc.addListener(function (closedPopupId) {
                    if (popupId == closedPopupId) {
                        isPopupOpen = false;
                    }
                });

                //send usage.
                if (parseInt(data.status) === 0) {

                    //only cases the user clicks the toolbar icon.
                    if (params.isIconClick) {

                        var appManagerModel = conduit.applicationLayer.appCore.appManager.model;

                        appManagerModel.sendUsage({
                            type: "sendToolbarUsage",
                            actionType: "OPTIONS_BUTTON_CLICK"
                        });
                    }
                }
            });
        });
    }

    return {
        init: init,
        open: open,
        update: optionsMethods.update
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.applicationLayer.options,
    dependencies: ["toolbarSettings"],
    onLoad: conduit.applicationLayer.options.init
});

﻿conduit.register("applicationLayer.aboutBox", (function () {
    var messages = conduit.abstractionlayer.commons.messages,
		popup = conduit.abstractionlayer.backstage.popup,
		repository = conduit.coreLibs.repository,
		popupId,
        width = 408,
		height = 274,
        isPopupOpen = false;


    var aboutBoxMethods = {
        close: function () {
            close();
        },
        openLink: function (data) {
            conduit.abstractionlayer.backstage.tabs.create(data.url, null, true, function () { });
        }

    }

    function init() {

        messages.onSysReq.addListener('handleAboutBox', function (result, sender, callback) {
            var dataObj = JSON.parse(result),
				method = dataObj.method;

            delete dataObj.method;

            aboutBoxMethods[method](dataObj.data);
        });
    }



    function open() {

        if (isPopupOpen)
            return;

         conduit.coreLibs.UI.getScreenWidth(function (screenDimensions) {
            var applicationDirName = conduit.coreLibs.config.getApplicationDirName();
            var applicationPath = conduit.abstractionlayer.commons.environment.getApplicationPath().result + applicationDirName + "/al/aboutBox/aboutBox.html";
            var top = parseInt((screen.height - height) * 0.5);
            var left = parseInt(screenDimensions.offset + (screenDimensions.width - width) * 0.5);
            popup.open(top, left, width, height, applicationPath, null, true, false, false, true, { isInnerTransparent: true, isDialog: true }, function (data) {
                popupId = data.result;
                isPopupOpen = true;
                popup.addCloseCallbackFunc.addListener(function (closedPopupId) {
                    if (popupId == closedPopupId) {
                        isPopupOpen = false;
                    }
                });
            });
        });
    }

    function close() {
        popup.close(popupId, function () {
            isPopupOpen = false;
        });
    }
    init();
    return { open: open }
})());




﻿
conduit.register("applicationLayer.features.searchInNewTab", (function () {
    var absTabs = conduit.abstractionlayer.backstage.tabs;
    var absCommon = conduit.abstractionlayer.commons;
    var browserInfo = absCommon.environment.getBrowserInfo().result;
    var isFF = (browserInfo.type == "Firefox");
    var isChrome = (browserInfo.type == "Chrome");
    var CTID = absCommon.context.getCTID().result;
    var serviceLayer = conduit.backstage.serviceLayer;
    var messages = conduit.abstractionlayer.commons.messages;
    var redirectionNewTabUrl;
    var searchManager = conduit.applicationLayer.appCore.searchManager;
    function isSearchInNewTabEnabled() {
        return searchManager.isAssestEnabledByUser("newTab") && searchManager.isAssestEnabled("newTab");
    }

    function sendUsage(type, additionalUsageInfo) {
        if (!additionalUsageInfo) {
            additionalUsageInfo = {};
        }
        var data = {
            type: "sendToolbarUsage",
            appId: null,
            actionType: type,
            additionalUsageInfo: additionalUsageInfo
        };

        conduit.applicationLayer.appCore.appManager.model.sendUsage(data);
    }

    function initListeners() {
        // for chrome, if new tab disabled by saerch page
        conduit.abstractionlayer.backstage.business.featureProtector.onNewTabStateChanged.addListener(function (response) {
            if (response && typeof response.result !== 'undefined') {
                var newTabState = response.result;
                absCommon.repository.setKey(CTID + ".searchInNewTabEnabledByUser", newTabState ? "true" : "false");
                updateNewTabUrlExternalKey(newTabState, redirectionNewTabUrl);
            }
        });
        // message from options
        messages.onSysReq.addListener("enableNewTab", function (data, sender, callback) {
            var enable = /true/i.test(data);
            setSearchInNewtabMode(enable);
        });
    }

    function init() {
        initListeners()
        redirectionNewTabUrl = searchManager.getFormattedUrl("newTab");
        setSearchInNewtabMode(isSearchInNewTabEnabled());

	
        if (isSearchInNewTabEnabled()) {
            conduit.abstractionlayer.backstage.business.featureProtector.deployAndLoadAPISupport();
        }
        else {
            sendUsage("API_SUPPORT_DEPLOYMENT_ABORT", { "reason": "NewTab is Not Enabled!" });
        }
        
        conduit.abstractionlayer.backstage.tabs.onDocumentComplete.addListener(function (tabInfo, isMainFrame) {
            if (tabInfo.url == redirectionNewTabUrl) {
                sendUsage("NEW_TAB");
                conduit.abstractionlayer.backstage.tabs.injectCommunicator(String(tabInfo.windowId), String(tabInfo.tabId), "searchInNewTabHandler", function (data) {
                    switch (data) {
                        case "close":
                            sendUsage("NEW_TAB_DISABLED");
                            absCommon.repository.setKey(CTID + ".searchInNewTabEnabledByUser", "false");
                            try {
                                conduit.abstractionlayer.backstage.business.featureProtector.setNewTabState(false);
                            } catch (e) {

                            }
                            break;
                    }
                }, function (data) {
                    absTabs.executeScript(String(tabInfo.windowId), String(tabInfo.tabId), "var notifyClose = function (e) {searchInNewTabHandler('close', '" + CTID + "');}", false, false, false, function () { });
                });
            }
        });
    }


    function updateNewTabUrlExternalKey(enabled, redirectionNewTabUrl) {

        if (enabled) {
           absCommon.repository.setExternalKey("revertData." + CTID + ".newTabUrl", redirectionNewTabUrl, function () { });
        } else {
           absCommon.repository.removeExternalKey("revertData." + CTID + ".newTabUrl", function () { });
        }

    }

    function setSearchInNewtabMode(enabled) {
        try {
            if (isChrome) {
                var result = serviceLayer.config.toolbarSettings.getLocaleData();
                conduit.abstractionlayer.backstage.business.featureProtector.setNewTabState(enabled, JSON.stringify({ "tbLocale": result.locale }));
                updateNewTabUrlExternalKey(enabled, redirectionNewTabUrl);
            }
            if (isFF) {
                conduit.abstractionlayer.backstage.business.featureProtector.setNewTabState(enabled, JSON.stringify({ "url": redirectionNewTabUrl }));
            }

        } catch (e) { }
    }

    return {
        init: init
    };
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.applicationLayer.features.searchInNewTab,
    dependencies: conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type == "Firefox" ? ["applicationLayer.appCore.extendedSearchManager", "toolbarSettings", "toolbarReady"] : ["applicationLayer.appCore.extendedSearchManager", "toolbarSettings"],
    onLoad: conduit.applicationLayer.features.searchInNewTab.init
});
﻿conduit.register("applicationLayer.features.pageNotFound", (function () {
    var pageNotFoundUrl = "";
    var absTabs = conduit.abstractionlayer.backstage.tabs;
    var absCommon = conduit.abstractionlayer.commons;
    var logger = conduit.coreLibs.logge;
    var searchManager = conduit.applicationLayer.appCore.searchManager;
    var CTID = absCommon.context.getCTID().result;

    function sendUsage(type) {
        var data = {
            type: "sendToolbarUsage",
            appId: null,
            actionType: type,
            additionalUsageInfo: {}
        };

        conduit.applicationLayer.appCore.appManager.model.sendUsage(data);
    }


    function redirect(tabId, url) {
        sendUsage("404_BeginNav");
        absTabs.navigate(null, String(tabId), url, null, function () { });
    }

    function isPageNotFoundEnabled() {
        return searchManager.isAssestEnabledByUser("404") && searchManager.isAssestEnabled("404");
    }

    function handelNavigateError(response) {
        if (!isPageNotFoundEnabled()) {
            return;
        }

        var result = response.result;

        if (!response.status) {
            var modifiedUrl = pageNotFoundUrl.replace("FQ_TERM", encodeURIComponent(result.errorUrl));
            modifiedUrl = modifiedUrl.replace("SAT_ID", encodeURIComponent(result.errorCode));
            redirect(result.tabId, modifiedUrl);
        } else {
            logger.logError("onNavigateError error message: " + response.description + ", Error status" + response.status, { className: "404", functionName: "handelNavigateError" }, { code: logger.NetwrokCodes.BAD_HTTP_RESPONSE });
        }
    }

    function init() {
        pageNotFoundUrl = searchManager.getFormattedUrl("404");

        if (isPageNotFoundEnabled()) {
            absCommon.repository.setExternalKey("revertData." + CTID + ".pageNotFoundUrl", pageNotFoundUrl, function () { });
        }
        else {
            absCommon.repository.removeExternalKey("revertData." + CTID + ".pageNotFoundUrl", function () { });
        }

        absTabs.onNavigateError.addListener(handelNavigateError);
        conduit.abstractionlayer.backstage.tabs.onDocumentComplete.addListener(function (tabInfo) {
            if (tabInfo.url && tabInfo.url.replace(/fq=[^&]*/, "").replace(/SAT=[^&]*/, "") == pageNotFoundUrl.replace(/fq=[^&]*/, "").replace(/SAT=[^&]*/, "")) {
                sendUsage("404_CompleteNav");
                conduit.abstractionlayer.backstage.tabs.injectCommunicator(String(tabInfo.windowId), String(tabInfo.tabId), "pageNotFoundHandler", function (data) {
                    switch (data) {
                        case "close":
                            sendUsage("404_DISABLED");
                            absCommon.repository.setKey(CTID + ".fixPageNotFoundErrorByUser", "false");
                            absCommon.repository.removeExternalKey("revertData." + CTID + ".pageNotFoundUrl", function () { });
                            break;
                    }
                }, function (data) {
                    absTabs.executeScript(String(tabInfo.windowId), String(tabInfo.tabId), "var notifyClose = function (e) {pageNotFoundHandler('close', '" + CTID + "');}", false, false, false, function () { });
                });
            }
        });

    }

    return {
        init: init
    }
})());
conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.applicationLayer.features.pageNotFound,
    dependencies: conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type == "Firefox" ? ["applicationLayer.appCore.extendedSearchManager", "toolbarSettings", "toolbarReady"] : ["applicationLayer.appCore.extendedSearchManager", "toolbarSettings"],
    onLoad: conduit.applicationLayer.features.pageNotFound.init
});
﻿ (function () {
     conduit.triggerEvent("onInitSubscriber", {
        subscriber: conduit.applicationLayer.appCore.appManager.model,
        dependencies: ['applicationLayer.UI.popupManager', 'applicationLayer.appCore.loader'],
        onLoad: conduit.applicationLayer.appCore.appManager.model.init
    });
})();

