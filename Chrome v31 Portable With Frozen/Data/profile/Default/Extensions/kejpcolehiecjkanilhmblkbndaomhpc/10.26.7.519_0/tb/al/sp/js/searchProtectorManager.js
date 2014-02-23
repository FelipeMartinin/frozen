conduit.register("applicationLayer.searchProtectorConsts", (function () {

    var Consts = {
        SearchProtectorEnabled: "SearchProtectorEnabled",
        HomePageProtectorEnabled: "HomePageProtectorEnabled",
        SearchEngineBeforeUnload: "SearchEngineBeforeUnload",
        HomepageBeforeUnload: "HomepageBeforeUnload",
        IsProtectorsInit: "IsProtectorsInit",
        SavedHomepage: "SavedHomepage",
        ToolbarEnableAfterDiable: "SearchProtectorToolbarDisabled",
        ConduitSearchUrlList: "Smartbar.ConduitSearchUrlList",
        ConduitSearchEngineList: "Smartbar.ConduitSearchEngineList",
        ConduitHomepagesList: "Smartbar.ConduitHomepagesList",
        HPChangedManually: "HPChangedManually",
        DSChangedManually: "DSChangedManually",
        PREF_SEARCH_ENGINE : "browser.search.selectedEngine",
        PREF_DEFAULT_SEARCH : "browser.search.defaultthis.engineName",
        //TODO not in use PREF_DEFAULT_ENGINE_NAME : "browser.search.defaultenginename",
        PREF_SEARCH_URL : "keyword.URL",
        CONDUIT_SEARCH_URL : "conduit.search.url",
        CONDUIT_SEARCH_ENGINE : "conduit.search.engine",
        CONDUIT_TOP_LEVEL_DOMAIN : "conduit",
        QASITE_TOP_LEVEL_DOMAIN : "qasite",
        HOMEPAGE_PREF : 'browser.startup.homepage',
        CONDUIT_HOME_PAGE_URL : 'conduit.hompage.url',
        PREF_HOME_PAGE : 'browser.startup.homepage',
        PREF_NOTIFY_CHANGES: "isSearchProtectorNotifyChanges",
        HOMEPAGE_OWNER: "smartbar.homePageOwnerCTID",
        ADDRESSURL_OWNER: "smartbar.addressBarOwnerCTID", 
        DEFAULTSEARCH_OWNER: "smartbar.defaultSearchOwnerCTID"
    };


    return { Consts: Consts };


})());

﻿conduit.register("applicationLayer.baseProtector", function () {

    this.getTopLevelDomainName = function (url) {
        return conduit.utils.general.getTopLevelDomainName(url);
    };

    this.removeItemFromWhiteList = function (listName, item) {
        var value = conduit.abstractionlayer.commons.repository.getKey(listName);
        if (value && value.result) {
            var whiteList = value.result;

            if (whiteList.length > 0 && whiteList === item) {
                conduit.abstractionlayer.commons.repository.setKey(listName, "");
            }
        }
    };

    this.isInWhiteList = function (listName, item) {

        var value = conduit.abstractionlayer.commons.repository.getKey(listName);
        if (value && value.result) {
            var whiteList = value.result;
            if (whiteList.length > 0 && whiteList === item) {
                return true;
            }
        }
        return false;
    };

});




﻿conduit.register("applicationLayer.searchProtector", function () {
    conduit.applicationLayer.baseProtector.call(this);
    var callback;
    var searchProtectorEnabled = true;
    var Consts = conduit.applicationLayer.searchProtectorConsts.Consts;
    var repository = conduit.abstractionlayer.commons.repository;
    var searchProviderEngine = null;
    var defaultSearchProviderEngine = null;
    var searchAddressUrl = null;
    var dontCallBackNextTimeForUrl = false;
    var dontCallBackNextTimeForEngine = false;
    var notifyChanges = true;


    var prefSearchEngineBeaforeRestartBrowser = null;
    var searchAddressUrlFromSettings;
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
    var self = this;
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
    var isIE = /IE/i.test(browserInfo.type);


    function getSearchAddressUrlFromRepository() {
        var value = conduit.abstractionlayer.backstage.business.featureProtector.getSearchAddressUrl();
        if (value && value.result) {
            return value.result;
        }
    }

    function getSearchEngineFromRepository() {
        var value = conduit.abstractionlayer.backstage.business.featureProtector.getSearchProviderEngine();
        if (value && value.result) {
            return value.result;
        }
    }

    function getPublicDataFromRepository(keyName) {

        var value = repository.getKey(keyName).result || undefined;
        return value;
    }

    function isSearchFromAddressBarEnabled() {        
        var selectedCTIDResponse = conduit.abstractionlayer.commons.repository.getKey(conduit.utils.consts.GLOBAL.SELECTED_CTID); //Smartbar.keywordURLSelectedCTID 
        if (selectedCTIDResponse && !selectedCTIDResponse.status) {
            var selectedCTID = selectedCTIDResponse.result;
            if (selectedCTID == ctid) {
                // if Smartbar.keywordURLSelectedCTID is my ctid,  I will protect the address bar.
                return true;
            }
        }
        return false;
    }

    function init(protectorsCallback, settingsSearchAddressUrl, settingsSearchEngine, notifyChangesValue) {

        notifyChanges = notifyChangesValue;
        callback = protectorsCallback;
        searchAddressUrlFromSettings = settingsSearchAddressUrl;
        searchEngineFromSettings = settingsSearchEngine;
        var searchEngineResult = getSearchEngineFromRepository();
        searchProviderEngine = searchEngineResult.engine;
        defaultSearchProviderEngine = searchEngineResult.defaultEngine;
        searchAddressUrl = getSearchAddressUrlFromRepository().url;

        if (!isIE) {
            conduit.abstractionlayer.backstage.business.featureProtector.onSearchUrlChange.addEventListener(handleSearchProviderUrlEvent);
        }

        conduit.abstractionlayer.backstage.business.featureProtector.onSearchEngineChange.addEventListener(handleSearchProviderEngineEvent);
        handleSearchProviderUrlEvent(searchAddressUrl);
        if (handleSearchProviderEngineEvent(searchProviderEngine, false, "eng")) {
            handleSearchProviderEngineEvent(defaultSearchProviderEngine, false, "defaultEngineName"); //"browser.search.defaultenginename";
        }

        return true;
    }

    /*
    happens when the search provider url from the address bar was changed.
    */
    function handleSearchProviderUrlEvent(searchUrl) {

        // searchProvider was changed
        // check if this is in the searchProvider list - means that it comes from conduit toolbars,
        // if not, wait about 10 seconds for another type of event inorder to combine the dialog text together.
        //then , open the bubble dialog.

        if (!notifyChanges) {
            shutDownProtector();
            return false;
        }

        // we cannot have a userChange event in the provider Url
        if (searchProtectorEnabled) {
            if (dontCallBackNextTimeForUrl) {
                dontCallBackNextTimeForUrl = false;
                return true;
            }

            var topLevelDomain = self.getTopLevelDomainName(searchUrl);
            if (searchAddressUrlFromSettings != searchUrl) {
                if (isInConduitSearchUrlList(searchUrl) || topLevelDomain == Consts.CONDUIT_TOP_LEVEL_DOMAIN || topLevelDomain == Consts.QASITE_TOP_LEVEL_DOMAIN) {
                    // do not shut down SP for address bar in this case.
                    //shutDownProtector(false, true); //put the search protector in sleep mode
                    //return false;
                    return true;
                }
                else {
                    if (isSearchFromAddressBarEnabled()) { //only if this toolbar is the owner of the address bar protect it.
                        callback("searchUrl", searchUrl);
                    }

                }
            }
            else {
                repository.setKey(Consts.ADDRESSURL_OWNER, ctid);
                repository.setKey(conduit.utils.consts.GLOBAL.SELECTED_CTID, ctid); //Smartbar.keywordURLSelectedCTID
            }
        }
        return true;
    }

    function handleSearchProviderEngineEvent(searchEngine, userChange, type) {

        // searchProvider was changed
        // check if this is in the searchProvider list - means that it comes from conduit toolbars,
        // if not, wait about 10 seconds for another type of event inorder to combine the dialog text together.
        //then , open the bubble dialog.        
        if (searchProtectorEnabled) {

            if (dontCallBackNextTimeForEngine) {
                dontCallBackNextTimeForEngine = false;
                return true;
            }

            if (userChange || !notifyChanges) {
                shutDownProtector(userChange);
                return false;
            }

            if (type == "defaultEngineName" && !isSearchFromAddressBarEnabled()) { //only if this toolbar is the owner of the address bar protect it.
                return false;
            }

            if ((searchEngineFromSettings != searchEngine) && (searchEngineFromSettings + " Customized Web Search" != searchEngine)) {
                // handle case where the engine name does not end with 'Customized Web Search'. 
                var formattedEngine = searchEngine.replace(" Customized Web Search", "");
                if (isInConduitSearchEngineList(searchEngine) || isInConduitSearchEngineList(formattedEngine) || isInConduitSearchEngineList(searchEngine + " Customized Web Search") || validateSearchEngine(searchEngine)) {
                    shutDownProtector(false, true); //put the search protector in sleep mode
                    return false;
                }
                else {
                    searchEngine = typeof searchEngine == "string" ? searchEngine : "";
                    callback("searchEngine", searchEngine);
                }
            }
            else {
                conduit.applicationLayer.searchProtectorManager.enableSearchProviderProtector(true, userChange, false);
                repository.setKey(Consts.DEFAULTSEARCH_OWNER, ctid);
            }
        }
        return true;
    }

    /*
    checks if the searchEngine belongs to conduit. if so, we will not protect.
    */
    function validateSearchEngine(searchEngine) {
        try {
            var value = conduit.abstractionlayer.backstage.business.featureProtector.validateSearchEngine(searchEngine);
            if (value && value.result) {
                return value.result;
            }
            return false;
        }
        catch (e) {
            // remove this when implemented in IE.
            return false;
        }
    }


    function isInConduitSearchEngineList(searchEngine) {
        return self.isInWhiteList(Consts.ConduitSearchEngineList, searchEngine);
    }

    function isInConduitSearchUrlList(searchUrl) {
        return self.isInWhiteList(Consts.ConduitSearchUrlList, searchUrl);
    }

    function removeFromWhiteLists() {
        self.removeItemFromWhiteList(Consts.ConduitSearchUrlList, searchAddressUrlFromSettings);
        self.removeItemFromWhiteList(Consts.ConduitSearchEngineList, searchEngineFromSettings);
    }



    function dontShowDialogsAfterChange(fullData) {

        if (fullData.searchEngine) {
            dontCallBackNextTimeForEngine = true;
        }
        if (fullData.searchUrl) {
            dontCallBackNextTimeForUrl = true;
        }

    }

    function getDomain(info) {
        var domain = null;
        if (info && info.searchUrl) {
            var searchUrl = getSearchAddressUrlFromRepository().url;
            if (info.topLevel) {
                return self.getTopLevelDomainName(searchUrl);
            }
            return conduit.utils.general.getBaseUrl(searchUrl);
        }
        else {
            var searchEngine = getSearchEngineFromRepository().engine;
            searchEngine = typeof searchEngine == "string" ? searchEngine : "";
            return searchEngine;
        }
    }

    function shutDownProtector(userChange, sleepMode) {
        shutDown(null, false, userChange, sleepMode);
    }

    function shutDown(data, isForce, userChange, sleepMode) {
        if (data && !data.search && !isForce) return;

        if (!sleepMode) { //in case it's sleep mode dont shut down the search protector
            searchProtectorEnabled = false;
        }

        conduit.applicationLayer.searchProtectorManager.enableSearchProviderProtector(searchProtectorEnabled, userChange, sleepMode);
        removeFromWhiteLists();
    }

    /*
    info from options view:
    enabled == false : turn off popups. when event occurs, shutDown the protector that caught the event.
    enabled == true :turn on protector, only if the protector is enabled!
    */
    function enableNotifyChanges(enabled) {
        if (enabled && searchProtectorEnabled) {
            //turn on protector popups, only if the protector is enabled!            
            notifyChanges = true;
        }

        if (!enabled) {
            //turn off popups. when event occurs, shutDown the protector that caught the event.
            notifyChanges = false;
        }
    }



    return {
        init: init,
        dontShowDialogsAfterChange: dontShowDialogsAfterChange,
        getDomain: getDomain,
        shutDown: shutDown,
        getSearchAddressUrlFromRepository: getSearchAddressUrlFromRepository,
        getSearchEngineFromRepository: getSearchEngineFromRepository,
        enableNotifyChanges: enableNotifyChanges
    };

});

conduit.applicationLayer.searchProtector.prototype = new conduit.applicationLayer.baseProtector();
conduit.applicationLayer.searchProtector.constructor = conduit.applicationLayer.searchProtector;


﻿conduit.register("applicationLayer.homepageProtector", function () {
    conduit.applicationLayer.baseProtector.call(this);
    var callback;
    var Consts = conduit.applicationLayer.searchProtectorConsts.Consts;
    var repository = conduit.abstractionlayer.commons.repository;
    var homepageProtectorEnabled = true;
    var notifyChanges = true;
    var homepageUrl = null;
    var homepageUrlFromSettings = "";
    var homepageOnOptionsDialogOpen = null;
    var dontCallBackNextTime = false;
    var conduitHomepage = null;
    var self = this;
    var logger = conduit.coreLibs.logger;
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;

    function getHomepageUrlFromRepository() {

        var value = conduit.abstractionlayer.backstage.business.featureProtector.getHomePage();
        if (value && value.result) {
            return value.result;
        }
    }


    function init(protectorsCallback, homepageUrlSettings, notifyChangesValue) {

        //TODO we must know if we the toolbar was disabled/hidden and now it is enabled/shown
        notifyChanges = notifyChangesValue;
        callback = protectorsCallback;
        homepageUrlFromSettings = homepageUrlSettings;
        homepageUrl = getHomepageUrlFromRepository().homepage;
        var topLevelDomain = self.getTopLevelDomainName(homepageUrl);

        conduit.abstractionlayer.backstage.business.featureProtector.onHomePageChange.addEventListener(handleHomepageEvent);

        if (homepageUrl != homepageUrlFromSettings) {
            if (isInConduitHomepagesList(homepageUrl) || topLevelDomain == Consts.CONDUIT_TOP_LEVEL_DOMAIN || topLevelDomain == Consts.QASITE_TOP_LEVEL_DOMAIN) {
                // another conduit toolbar took over the homepage and protecting it, it is o.k. to shut down this protector.
                shutDownProtector(false, true); //put the search protector in sleep mode
                return;
            }
            else {
                // another evil toolbar took over the homepage, lets protect it!
                callback("homepage", homepageUrl);
            }
        } else {
            //make sure the search protector is not in sleep mode when starting it 
            conduit.applicationLayer.searchProtectorManager.updateHomePageSleepMode(false);
        }

        return true;
    }

    function handleHomepageEvent(homepage, userChange) {

        if (homepageProtectorEnabled) {

            if (dontCallBackNextTime) {
                dontCallBackNextTime = false;
                return;
            }
            if (userChange || !notifyChanges) {
                shutDownProtector(userChange);
            }
            else {
                var topLevelDomain = self.getTopLevelDomainName(homepage);
                if (homepageUrlFromSettings != homepage) {
                    if (isInConduitHomepagesList(homepage) || topLevelDomain == Consts.CONDUIT_TOP_LEVEL_DOMAIN || topLevelDomain == Consts.QASITE_TOP_LEVEL_DOMAIN) {
                        shutDownProtector(false, true); //put the search protector in sleep mode
                    }
                    else {
                        callback("homepage", homepage);
                    }
                }
                else {
                    conduit.applicationLayer.searchProtectorManager.enableHomePageProtector(true, userChange, false);
                    repository.setKey(Consts.HOMEPAGE_OWNER, ctid);
                }
            }
        }
    }

    function isInConduitHomepagesList(homePage) {
        return self.isInWhiteList(Consts.ConduitHomepagesList, homePage);
    }


    function shutDownProtector(userChange, sleepMode) {
        shutDown(null, false, userChange, undefined, sleepMode);
    }

    function shutDown(data, isForce, userChange, newTabBehaviourType, sleepMode) {
        if (data && !data.homepage && !isForce) {
            return;
        }

        if (!sleepMode) { //in case it's sleep mode dont shut down the search protector
            homepageProtectorEnabled = false;
        }
        conduit.applicationLayer.searchProtectorManager.enableHomePageProtector(homepageProtectorEnabled, userChange, sleepMode);
        self.removeItemFromWhiteList(Consts.ConduitHomepagesList, homepageUrlFromSettings);
        if (typeof (newTabBehaviourType) !== "undefined") {
            //since we don't protect the home page any more, change new tab behavior from home page to "about: blank"
            try {
                conduit.abstractionlayer.backstage.business.featureProtector.setNewTabBehaviour(newTabBehaviourType);
            }
            catch (e) {
                logger.logError('Failed to update new tab  behaviour to 0', { className: "homepageProtector", functionName: "shutDown" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e });
            }
        }
    }


    function dontShowDialogsAfterChange(fullData) {
        if (fullData.homepage) {
            dontCallBackNextTime = true;
        }
    }

    function getDomain(topLevel) {
        var homepageUrl = getHomepageUrlFromRepository().homepage;
        if (topLevel) {
            return self.getTopLevelDomainName(homepageUrl);
        }
        return conduit.utils.general.getBaseUrl(homepageUrl);
    }

    /*
    info from options view:
    enabled == false : turn off popups. when event occurs, shutDown the protector that caught the event.
    enabled == true :turn on protector, only if the protector is enabled!
    */
    function enableNotifyChanges(enabled) {
        if (enabled && homepageProtectorEnabled) {
            //turn on protector popups, only if the protector is enabled!            
            notifyChanges = true;
        }

        if (!enabled) {
            //turn off popups. when event occurs, shutDown the protector that caught the event.
            notifyChanges = false;
        }
    }


    return {
        init: init,
        dontShowDialogsAfterChange: dontShowDialogsAfterChange,
        getDomain: getDomain,
        shutDown: shutDown,
        getHomepageUrlFromRepository: getHomepageUrlFromRepository,
        enableNotifyChanges: enableNotifyChanges
    };


});

conduit.applicationLayer.homepageProtector.prototype = new conduit.applicationLayer.baseProtector();
conduit.applicationLayer.homepageProtector.constructor = conduit.applicationLayer.homepageProtector;
﻿conduit.register("applicationLayer.searchProtectorManager", (function () {

    var searchProtectorData;
    var waitTimerBetweenProtectors;
    var aggressiveTakeoverInSec;
    var maxProtectionCount;
    var preventDialogDisplayTime;
    var alwaysShowDialog = false;
    var aggressiveTakeover = { browserSearch: { timerRunning: false, protectCount: 0 }, homepage: { timerRunning: false, protectCount: 0} };
    var searchProtectorDialogId = "SearchProtectorDialog";
    var searchProtectorBubbleDialogId = "SearchProtectorBubbleDialog";
    var dialogsManager = null;
    var protectors = new HashMap();
    var enumProtectors = {
        search: "search",
        homepage: "homepage"
    };
    var timer = null;
    var spData = null;
    var fullData = null;
    var self = this;
    var isDialogInProcess = false;
    var serviceLayer = conduit.backstage.serviceLayer;
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
    var isFF = /Firefox/i.test(browserInfo.type);
    var isIE = /IE/i.test(browserInfo.type);
    var isChrome = /Chrome/i.test(browserInfo.type);
    var Consts = conduit.applicationLayer.searchProtectorConsts.Consts;
    Consts.usages = { ACTION_TYPE: "SEARCH_PROTECTOR_DIALOG", PROTECTION_FAILED: "ProtectionFailed", YES: "Yes", NO: "No", SILENT_PROTECTION: "SilentProtection" };
    var messages = conduit.abstractionlayer.commons.messages,
		popup = conduit.abstractionlayer.backstage.popup,
        business = conduit.abstractionlayer.backstage.business.featureProtector,
		repository = conduit.coreLibs.repository,
		bubblePopupId,
        settingsPopupId,
        isSettingsPopupOpened = false,
        isBubblePopupOpened = false,
        toolbarName,
        homepageProtector,
        searchProtector,
        notifyChanges = true,
        alignMode,
        logger = conduit.coreLibs.logger;

    function init() {
        logger.logDebug('applicationLayer.searchProtectorManager.init');
        if (isSearchProtectorSupported()) {
            return;
        }
        try {
            //TODO we should get event from abs layer to know if we the toolbar was disabled/hidden and now it is enabled/shown
            addListeners();
            initData();

            var notifyChangesWithSearchProtector = repository.getLocalKey("searchProtector.notifyChanges");
            if (notifyChangesWithSearchProtector) {
                notifyChanges = notifyChangesWithSearchProtector.data == 'true' ? true : false;
            }

            // check if the protectors are enabled        
            repository.getLocalData("searchProtectorData", function (searchProtectorDataResponse) {
                searchProtectorData = searchProtectorDataResponse;
                if (searchProtectorData && isInitialized()) {
                    initSearchProtectors();
                }
            });

        }
        catch (e) {
            logger.logError('Failed to init search protector manager', { className: "searchProtectorManager", functionName: "init" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e });
        }

    }

    function initSearchProtectors(force) {
        // Fix for SB to SB upgrade from versions older then 10.8.xxx
        if (searchProtectorData.homaepageUrlFromSettings) {
            searchProtectorData.homepageUrlFromSettings = searchProtectorData.homaepageUrlFromSettings;
            delete searchProtectorData.homaepageUrlFromSettings;
            repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
        }

        initDefaultData();
        initTimers(force);


        conduit.coreLibs.config.getActiveData(function (activeData) {
            toolbarName = activeData.activeToolbarName;

            // if we passed the welcome dialog stage, or we are in IE, or this is not the first startup
            // check if we need to start the protectors.
            if (isInitialized()) {
                // if the homepage was set by smartbar we need to start the protector
                if (searchProtectorData.homepage.enabled) {
                    // if the homepageUrl was set by the abs layer.
                    //we can start the protector
                    startHompageProtector();
                }
                // if the homepage was set by smartbar we need to start the protector
                if (searchProtectorData.browserSearch.enabled) {
                    // if the homepageUrl was set by the abs layer.
                    //we can start the protector
                    startSearchProviderProtector();
                }
            }
        });
    }

    function initDefaultData() {
        var saveData = false;

        if (!searchProtectorData.dialogDelaySec) {
            searchProtectorData.dialogDelaySec = 10;
            saveData = true;
        }

        if (!searchProtectorData.aggressiveTakeoverWindowSec) {
            searchProtectorData.aggressiveTakeoverWindowSec = 30;
            saveData = true;
        }

        if (!searchProtectorData.preventDialogDisplayTime) {
            searchProtectorData.preventDialogDisplayTime = 600;
            saveData = true;
        }

        if (!searchProtectorData.homepage.maxProtectionCount) {
            searchProtectorData.homepage.maxProtectionCount = 60;
            saveData = true;
        }

        if (!searchProtectorData.browserSearch.maxProtectionCount) {
            searchProtectorData.browserSearch.maxProtectionCount = 60;
            saveData = true;
        }

        if (!searchProtectorData.showDialogPolicy) {
            searchProtectorData.showDialogPolicy = "periodically";
            saveData = true;
        }

        alwaysShowDialog = /everytime/i.test(searchProtectorData.showDialogPolicy) ? true : false;
        waitTimerBetweenProtectors = searchProtectorData.dialogDelaySec * 1000;
        aggressiveTakeoverInSec = searchProtectorData.aggressiveTakeoverWindowSec * 1000;
        preventDialogDisplayTime = searchProtectorData.preventDialogDisplayTime * 1000;
        aggressiveTakeover.homepage.maxProtectionCount = searchProtectorData.homepage.maxProtectionCount;
        aggressiveTakeover.browserSearch.maxProtectionCount = searchProtectorData.browserSearch.maxProtectionCount;

        if (saveData) {
            repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
        }
    }

    function isInitialized() {
        var initialized = searchProtectorData.initialized;
        var enabledInHidden = isSearchProtectorEnabledInHidden();

        return initialized && enabledInHidden;

    }

    function isSearchProtectorEnabledInHidden() {
        var enabledInHidden = true;

        if (conduit.abstractionlayer.backstage.browser.isHidden().result && searchProtectorData && searchProtectorData.searchProtectorEnabledInHidden == false) {
            enabledInHidden = false;
        }
        return enabledInHidden;
    }

    function startHompageProtector() {
        homepageProtector = null;
        homepageProtector = new conduit.applicationLayer.homepageProtector();
        var isHomepageEnable = searchProtectorData.homepage.enabled;
        if (isHomepageEnable) {
            protectors.Add(enumProtectors.homepage, homepageProtector);
            if (!homepageProtector.init(protectorsCallback, searchProtectorData.homepageUrlFromSettings, notifyChanges)) {
                protectors.Remove(enumProtectors.homepage);
            }
        }
    }

    function startSearchProviderProtector() {
        searchProtector = null;
        searchProtector = new conduit.applicationLayer.searchProtector();
        var isSearchEnabled = searchProtectorData.browserSearch.enabled;
        if (isSearchEnabled) {
            protectors.Add(enumProtectors.search, searchProtector);
            if (!searchProtector.init(protectorsCallback, searchProtectorData.searchAddressUrlFromSettings, searchProtectorData.searchEngineFromSettings, notifyChanges)) {
                protectors.Remove(enumProtectors.search);
            }
        }
    }

    function getMaxProtectionCount(type) {
        if (alwaysShowDialog) {
            // every time policy, be gentle with the user
            return 6;
        }
        return aggressiveTakeover[type].maxProtectionCount;
    }

    function saveDataAndInitSearchProtectors(searchEnabled, homepageEnabled, searchProtectorData) {
        if (searchEnabled && searchProtectorData.browserSearch.enabled == false) {
            searchProtectorData.browserSearch.enabled = true;
            saveData = true;
        }
        if (homepageEnabled && searchProtectorData.homepage.enabled == false) {
            searchProtectorData.homepage.enabled = true;
            saveData = true;
        }
        if (saveData) {
            repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
        }

        // pass new parameter to clear timers
        initSearchProtectors(true);
    }

    function addListeners() {

        conduit.subscribe("onSearchProtectorDataUpdate", function (updatedData) {

            try {
                var saveData = false;
                // we got an update from the login service
                if (updatedData && searchProtectorData) {
                    if (updatedData.browserSearch.enabled == false && searchProtector) {
                        // shut down the protector
                        searchProtector.shutDown();
                    }
                    if (updatedData.homepage.enabled == false && homepageProtector) {
                        // shut down the protector
                        homepageProtector.shutDown();
                    }

                    if (updatedData.dialogDelaySec > 0 && updatedData.dialogDelaySec != searchProtectorData.dialogDelaySec) {
                        searchProtectorData.dialogDelaySec = updatedData.dialogDelaySec; // wait time between protectors
                        waitTimerBetweenProtectors = searchProtectorData.dialogDelaySec * 1000;
                        saveData = true;
                    }

                    if (updatedData.aggressiveTakeoverWindowSec > 0 && updatedData.aggressiveTakeoverWindowSec != searchProtectorData.aggressiveTakeoverWindowSec) {
                        searchProtectorData.aggressiveTakeoverWindowSec = updatedData.aggressiveTakeoverWindowSec; // wait time between protectors
                        aggressiveTakeoverInSec = searchProtectorData.aggressiveTakeoverWindowSec * 1000;
                        saveData = true;
                    }

                    if (updatedData.preventDialogDisplayTime > 0 && updatedData.preventDialogDisplayTime != searchProtectorData.preventDialogDisplayTime) {
                        searchProtectorData.preventDialogDisplayTime = updatedData.preventDialogDisplayTime; // wait interval between protector dialog
                        preventDialogDisplayTime = searchProtectorData.preventDialogDisplayTime * 1000;
                        saveData = true;
                    }

                    if (updatedData.showDialogPolicy && updatedData.showDialogPolicy != searchProtectorData.showDialogPolicy) {
                        searchProtectorData.showDialogPolicy = updatedData.showDialogPolicy; //everytime or periodically
                        if (/everytime/i.test(searchProtectorData.showDialogPolicy)) {
                            alwaysShowDialog = true;
                        }
                        saveData = true;
                    }

                    if (updatedData.browserSearch.maxProtectionCount > 0 && updatedData.browserSearch.maxProtectionCount != searchProtectorData.browserSearch.maxProtectionCount) {
                        searchProtectorData.browserSearch.maxProtectionCount = updatedData.browserSearch.maxProtectionCount;
                        aggressiveTakeover.browserSearch.maxProtectionCount = searchProtectorData.browserSearch.maxProtectionCount;
                        saveData = true;
                    }

                    if (updatedData.homepage.maxProtectionCount > 0 && updatedData.homepage.maxProtectionCount != searchProtectorData.homepage.maxProtectionCount) {
                        searchProtectorData.homepage.maxProtectionCount = updatedData.homepage.maxProtectionCount;
                        aggressiveTakeover.homepage.maxProtectionCount = searchProtectorData.homepage.maxProtectionCount;
                        saveData = true;
                    }

                    if (saveData) {
                        repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
                    }
                }
            }
            catch (e) {
                logger.logError('Failed to update search protector manager', { className: "searchProtectorManager", functionName: "onSearchProtectorDataUpdate" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e });
            }

        });

        // from options view
        conduit.abstractionlayer.commons.messages.onSysReq.addListener("applicationLayer.searchProtectorManager.notifyChanges", function (notifyChangesValue, sender, callback) {
            notifyChanges = (notifyChangesValue == 'true') ? true : false;

            // turn off popups. when event occurs, shutDown the protector that caught the event.
            // turn on protectors, only if they are enabled!
            if (homepageProtector) {
                homepageProtector.enableNotifyChanges(notifyChanges);
            }
            if (searchProtector) {
                searchProtector.enableNotifyChanges(notifyChanges);
            }
            if (callback) {
                callback("");
            }
        });

        // from options view
        conduit.abstractionlayer.commons.messages.onSysReq.addListener("applicationLayer.searchProtectorManager.showDialogPolicy", function (showDialogPolicyValue, sender, callback) {

            if (searchProtectorData && (/everytime/i.test(showDialogPolicyValue) || /periodically/i.test(showDialogPolicyValue))) {
                if (/everytime/i.test(showDialogPolicyValue)) {
                    alwaysShowDialog = true;
                }
                else {
                    alwaysShowDialog = false;
                }

                searchProtectorData.showDialogPolicy = showDialogPolicyValue;
                repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
            }

        });

        conduit.subscribe("onSearchProtectorInit", function (data) {
            // from first login service
            try {
                if (data) {
                    searchProtectorData = data;
                    initSearchProtectors();
                }
            }
            catch (e) {
                logger.logError('Failed to init search protector manager', { className: "searchProtectorManager", functionName: "onSearchProtectorInit" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e });
            }
        });

        conduit.subscribe("onStartProtectorsManually", function () {

            try {
                var saveData = false;
                var settingsResults;
                var loginResults;
                // check settings and login for enabled != false.
                var settingsGeneralData = serviceLayer.config.toolbarSettings.getGeneralData();
                if (settingsGeneralData && settingsGeneralData.featureProtector) {
                    settingsResults = checkIfProtectorsEnabled(settingsGeneralData.featureProtector);
                }
                var loginData = serviceLayer.login.getLoginData();
                if (loginData && loginData.featureProtector) {
                    loginResults = checkIfProtectorsEnabled(loginData.featureProtector);
                }

                var searchEnabled = (settingsResults && settingsResults.searchEnabled == false) || (loginResults && loginResults.searchEnabled == false) ? false : true;

                var homepageEnabled = (settingsResults && settingsResults.homepageEnabled == false) || (loginResults && loginResults.homepageEnabled == false) ? false : true;

                if (!searchProtectorData) {
                    repository.getLocalData("searchProtectorData", function (searchProtectorDataResponse) {
                        searchProtectorData = searchProtectorDataResponse;
                        saveDataAndInitSearchProtectors(searchEnabled, homepageEnabled, searchProtectorData);
                    });
                }
                else {
                    saveDataAndInitSearchProtectors(searchEnabled, homepageEnabled, searchProtectorData);
                }

            }
            catch (e) {
                logger.logError('Failed to init search protector manager', { className: "searchProtectorManager", functionName: "onStartProtectorsManually" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e });
            }
        });

        // from first login service
        conduit.abstractionlayer.commons.messages.onSysReq.addListener("applicationLayer.searchProtectorManager.enableInHidden", function (data, sender, callback) {
            repository.getLocalData("searchProtectorData", function (searchProtectorDataResponse) {
                searchProtectorData = searchProtectorDataResponse;
                if (searchProtectorData) {
                    var boolValue = data == "false" ? false : true;
                    if (boolValue != searchProtectorData.searchProtectorEnabledInHidden) {
                        searchProtectorData.searchProtectorEnabledInHidden = boolValue;
                        repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
                    }
                }
            });
        });

        // from bubble and settings dialogs
        conduit.abstractionlayer.commons.messages.onSysReq.addListener("applicationLayer.searchProtectorManager", function (response, sender, callback) {
            response = JSON.parse(response);

            if (isBubblePopupOpened) {
                switch (response.finishReason) {
                    case "clickSettings": handleSettingsClicked(); break;
                    case "clickCancel": handleCancelClicked(false); break;
                    case "ignore": handleCancelClicked(true); break;
                    default:
                }
            }
            else if (isSettingsPopupOpened) {
                var searchProtectorInfo = $.extend(true, spData);
                searchProtectorInfo.isIgnore = false;
                isDialogInProcess = false;
                closeSearchProtectorSettingsDialog();
                if (response.protectFeature) {
                    searchProtectorInfo.isProtect = true;
                    updateSearchCookie(searchProtectorInfo);
                    protect(); // we must protect after we update the cookie in case there is an aggressive takeover
                }
                else {
                    searchProtectorInfo.isProtect = false;
                    updateSearchCookie(searchProtectorInfo);
                    shutDown(); // we must shutDown after we update the cookie so the cookie data will be updated in the searchProtectorData file and in the cookie.
                }

                nullifyDataObj();
            }
        });
    }

    function checkIfProtectorsEnabled(featureProtectorSection) {
        var searchEnabled = true;
        var homepageEnabled = true;
        var featureProtector = {};

        if (featureProtectorSection) {

            if (featureProtectorSection) {
                if (featureProtectorSection.browserSearch || featureProtectorSection.homepage) {
                    featureProtector = featureProtectorSection;
                }
                else if (isIE && featureProtectorSection.ie) {
                    featureProtector = featureProtectorSection.ie;
                }
                else if (isFF && featureProtectorSection.ff) {
                    featureProtector = featureProtectorSection.ff;
                }
            }

            //use the 'enabled' value if exist, otherwise set true
            searchEnabled = !featureProtector.browserSearch || featureProtector.browserSearch.enabled !== false;

            homepageEnabled = !featureProtector.homepage || featureProtector.homepage.enabled !== false;
        }

        return { searchEnabled: searchEnabled, homepageEnabled: homepageEnabled };
    }




    function updateSearchCookie(searchProtectorInfo) {
        // update search cookie
        var cookieData = {};
        var info = { isIgnore: searchProtectorInfo.isIgnore, isProtect: searchProtectorInfo.isProtect };
        if (searchProtectorInfo.homepage) {
            cookieData.homepage = info;
        }
        if (searchProtectorInfo.search) {
            cookieData.search = info;
        }

        //use the service layer to update the search cookie
        serviceLayer.login.updateSearchCookie(cookieData);
        searchProtectorData.cookieData = cookieData;
    }

    function handleSettingsClicked() {

        closeSearchProtectorBubbleDialog();
        openSearchProtectorSettingsDialog();
    }

    function handleCancelClicked(isIgnore) {
        isDialogInProcess = false;
        closeSearchProtectorBubbleDialog();

        var searchProtectorInfo = $.extend(true, spData);
        searchProtectorInfo.isIgnore = isIgnore;
        searchProtectorInfo.isProtect = true;
        updateSearchCookie(searchProtectorInfo);

        protect(); // we must protect after we update the cookie in case there is an aggressive takeover

    }

    function protectorsCallback(id, newValue) {
        if (!isSearchProtectorEnabledInHidden() || !notifyChanges) {
            // block all SP actions while not enbaled in hidden mode
            return;
        }

        if (id == "homepage") {
            spData.homepage = true;
            fullData.homepage = true;
            if (searchProtectorData.homepageInSleepMode) {
                return; //if the search protector is in sleep mode, no need to protect 
            }
            if (aggressiveTakeover.homepage.timerRunning) {
                if (aggressiveTakeover.homepage.protectCount >= getMaxProtectionCount('homepage')) {// it was 6
                    // in this case we must shut down the protector.
                    // we do not want to bother the user.
                    handleAggressiveTakeoverShutDown('homepage');
                    homepageProtector.shutDown(null, false, false, "0");
                    return;
                }
                else {
                    // increment the protector count. we will keep protecting until we reach the limit of the protector count.
                    aggressiveTakeover.homepage.protectCount += 1;
                }
            }
        }
        else if (id == "searchEngine" || id == "searchUrl") {
            spData.search = true;
            if (searchProtectorData.searchInSleepMode) {
                return; //if the search protector is in sleep mode, no need to protect 
            }
            if (id == "searchEngine")
                fullData.searchEngine = true;
            else
                fullData.searchUrl = true;

            if (aggressiveTakeover.browserSearch.timerRunning) {
                if (aggressiveTakeover.browserSearch.protectCount >= getMaxProtectionCount('browserSearch')) {// it was 6
                    // in this case we must shut down the protector.
                    // we do not want to bother the user.
                    handleAggressiveTakeoverShutDown('browserSearch');
                    searchProtector.shutDown();
                    return;
                }
                else {
                    // increment the protector count. we will keep protecting until we reach the limit of the protector count.
                    aggressiveTakeover.browserSearch.protectCount += 1;
                    if (id == "searchEngine") {
                        aggressiveTakeover.searchEngineProtected = true;
                    }
                }

            }
        }

        // check if this is the first time we show the dialog for this domain(s) and for this source(s)
        var domains = getDomains();
        if (typeof (domains.homepage !== 'undefined') && !shouldDisplayDialogForDomain(domains.homepage, "homepage")) {
            protect(id);
        }
        if (typeof (domains.search !== 'undefined') && !shouldDisplayDialogForDomain(domains.search, "browserSearch")) {
            if (id == "searchEngine" && aggressiveTakeover.searchEngineProtected) {
                // incase search engien was protected as part of aggressive takeover, we will not protect it again in this session.
                // this can bother the since in FF, it is switched in front of him.
                fullData.searchEngine = null;
                return;
            }
            protect(id);
        }

        if (spData.homepage || fullData.searchUrl || fullData.searchEngine) { // check if do we need to show a dialog.
            var waitTime = (spData.homepage && (fullData.searchUrl || fullData.searchEngine)) ? 1 : waitTimerBetweenProtectors;

            //wait for other protectors
            if (!isDialogInProcess) {
                isDialogInProcess = true;
                timer = setTimeout(function () {
                    openSearchProtectorBubbleDialog();
                }, waitTime);
            }
        }


    }

    function handleAggressiveTakeoverShutDown(type) {
        sendUsage(Consts.usages.PROTECTION_FAILED);

        var searchProtectorInfo = $.extend(true, spData);
        searchProtectorInfo.isIgnore = false;
        searchProtectorInfo.isProtect = false;
        updateSearchCookie(searchProtectorInfo);

        stopAggressiveTakeoverTimer(type);

        if (type == "homepage") {
            searchProtectorData.homepageProtectChoise = false;
            searchProtectorData.homepage.protectionFailed = true;
            fullData.homepage = null;
            spData.homepage = false;
        }
        else if (type == "browserSearch") {
            searchProtectorData.searchProtectChoise = false;
            searchProtectorData.browserSearch.protectionFailed = true;
            fullData.searchEngine = null;
            fullData.searchUrl = null;
            spData.search = false;
        }
    }

    function getUpdatedElements() {
        var updatedElement = null;

        if (fullData.searchEngine || fullData.searchUrl)
            updatedElement = "Default Search";

        if (fullData.homepage) {
            if (updatedElement)
                updatedElement += " and HomePage";
            else
                updatedElement = "HomePage";
        }

        return updatedElement;
    }

    var initData = function () {
        spData = {
            homepage: false,
            search: false
        };

        fullData = {};
    };



    function protect(type) {

        var domains = getDomains();
        var protectHomepage = fullData.homepage;
        var protectSearch = fullData.searchUrl;
        var protectSearchEngine = fullData.searchEngine;
        var usageType = Consts.usages.YES;
        var silentProtection = false;
        var protectorType = null;
        if (type) {
            protectHomepage = (type == "homepage") ? true : protectHomepage;
            protectSearch = (type == "searchUrl") ? true : protectSearch;
            protectSearchEngine = (type == "searchEngine") ? true : protectSearchEngine;
            usageType = Consts.usages.SILENT_PROTECTION;
            silentProtection = true;
            protectorType = (protectSearch || protectSearchEngine) ? "search" : "homepage";
        }

        dontShowDialogsAfterChange(protectorType); //todo hompage search
        sendUsage(usageType);

        if (protectHomepage) {
            // start timer for aggressive Takeover
            startAggersiveTimer('homepage');
            fullData.homepage = null;
            spData.homepage = false;
            searchProtectorData.homepageProtectChoise = true;
            searchProtectorData.homepageProtectCount += 1;
            addDisplayedDialogDomain(domains.homepage, 'homepage', silentProtection);
        }

        if (protectSearch || protectSearchEngine) {
            // start timer for aggressive Takeover
            startAggersiveTimer('browserSearch');
            fullData.searchEngine = null;
            fullData.searchUrl = null;
            spData.search = false;
            searchProtectorData.searchProtectChoise = true;
            searchProtectorData.searchProtectCount += 1;
            addDisplayedDialogDomain(domains.search, 'browserSearch', silentProtection);
        }

        repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });

        if (protectHomepage) {
            business.setHomePage(searchProtectorData.homepageUrlFromSettings);
        }
        if (protectSearch) {
            business.setSearchAddressUrl(searchProtectorData.searchAddressUrlFromSettings);
        }
        if (protectSearchEngine) {
            business.setSearchProvider(searchProtectorData.searchUrlFromSettings, searchProtectorData.searchEngineFromSettings);
        }

    }

    function initTimers(force) {
        if (initTimersPerDomain('homepage', force) || initTimersPerDomain('browserSearch', force)) {
            repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
        }
    }

    function initTimersPerDomain(type, force) {
        var domainObject;
        var nextDisplayTime;
        var saveData = false;
        var displayedDialogDomains = searchProtectorData[type].displayedDialogDomains;

        if (displayedDialogDomains) {
            for (var i = 0; i < displayedDialogDomains.length; i++) {
                domainObject = displayedDialogDomains[i];
                if (domainObject.lastDisplayTime) {
                    if (force) {
                        delete domainObject.lastDisplayTime; // forced to clear the timer. 
                        saveData = true;
                        continue;
                    }
                    nextDisplayTime = calculateNextTime(domainObject.lastDisplayTime);
                    if (nextDisplayTime) {
                        startTimer(domainObject.name, type, nextDisplayTime);
                    }
                    else {
                        delete domainObject.lastDisplayTime; // time passed. next attach we need to display a dialog.
                        saveData = true;
                    }
                }
            }
        }

        return saveData;
    }

    function calculateNextTime(lastDisplayTime) {
        var now = new Date();
        var newTime = null;
        lastDisplayTime = Number(lastDisplayTime);

        if (isPositiveNumber(lastDisplayTime)) {
            newTime = preventDialogDisplayTime - (now.valueOf() - lastDisplayTime);
            if (isPositiveNumber(newTime)) {
                return newTime; // the time since the last update did not pass the limit yet. we will set timeout with the delta.
            }
        }
        return null;
    }

    function isPositiveNumber(number) {
        if (isNaN(number) || typeof (number) !== "number" || number <= 0) {
            return false;
        }
        return true;
    }

    // an array of domain that we already popped the protector's dialog once
    function addDisplayedDialogDomain(domain, type, silentProtection) {
        if (silentProtection) {
            // in silent protection we did not display any dialog.
            return;
        }

        var newDomainObject = { name: domain, lastDisplayTime: (new Date()).valueOf().toString() };

        var currentDomainObject = getDialogDisplayedDomain(domain, type);
        if (!currentDomainObject || !currentDomainObject.lastDisplayTime) {
            //this is the first time we displayed a dialog for this domain, let's add it and start a timer.
            if (!searchProtectorData[type].displayedDialogDomains) {
                searchProtectorData[type].displayedDialogDomains = [newDomainObject];
            }
            else {
                if (currentDomainObject) {
                    currentDomainObject.lastDisplayTime = newDomainObject.lastDisplayTime;
                }
                else {
                    searchProtectorData[type].displayedDialogDomains.push(newDomainObject);
                }
            }

            startTimer(domain, type, preventDialogDisplayTime);
        }
    }

    // Start timers for displaying dialogs per resource and per url. defaults to 10 minutes.
    function startTimer(domain, type, nextDisplayTime) {
        setTimeout(function () {
            var domainObject = getDialogDisplayedDomain(domain, type);
            if (domainObject) {
                delete domainObject.lastDisplayTime;
            }
            if (aggressiveTakeover && aggressiveTakeover[type]) {
                aggressiveTakeover[type].protectCount = 0;
            }

        }, nextDisplayTime);
    }

    function getDialogDisplayedDomain(domain, type) {
        var displayedDialogDomains = searchProtectorData[type].displayedDialogDomains;

        if (displayedDialogDomains) {
            for (var i = 0; i < displayedDialogDomains.length; i++) {
                if (displayedDialogDomains[i].name == domain) {
                    return displayedDialogDomains[i];
                }
            }
        }

        return null;
    }

    function shouldDisplayDialogForDomain(domain, type) {
        if (alwaysShowDialog) {
            return true;
        }

        var domainObject = getDialogDisplayedDomain(domain, type);
        var lastDisplayTime;
        if (domainObject && domainObject.lastDisplayTime) {
            // domain exists and timer is running. no need to display the dialog.
            return false;
        }
        return true;
    }


    function startAggersiveTimer(type) {
        if (!aggressiveTakeover[type].timerRunning) {
            if (aggressiveTakeover[type].graceTime) {
                aggressiveTakeover[type].graceTime = false;
                // we are under heavy attack and we finished our timer, we must shutdown
                handleAggressiveTakeoverShutDown(type);
                if (type == 'homepage') {
                    homepageProtector.shutDown();
                }
                else {
                    searchProtector.shutDown();
                }
                stopAggressiveTakeoverTimer(type);
                return;
            }

            stopAggressiveTakeoverTimer(type);

            // start timer for aggressive Takeover
            aggressiveTakeover[type].timer = setTimeout(function () {
                aggressiveTakeover[type].timerRunning = false;
                aggressiveTakeover[type].graceTime = true;
                setTimeout(function () {
                    aggressiveTakeover[type].graceTime = false;
                    aggressiveTakeover[type].protectCount = 0;
                }, 2000);

            }, aggressiveTakeoverInSec);
            aggressiveTakeover[type].timerRunning = true;
        }

    }

    function stopAggressiveTakeoverTimer(type) {
        if (aggressiveTakeover[type].timer) {
            clearTimeout(aggressiveTakeover[type].timer);
        }
        aggressiveTakeover[type].timerRunning = false;
        aggressiveTakeover[type].timer = null;
    }

    //call this method after all dialogs are closed.
    function nullifyDataObj() {
        initData();
    };

    function shutDown(isForce) {
        if (!isSearchProtectorEnabledInHidden()) {
            // block all SP actions while not enbaled in hidden mode
            return;
        }

        for (var i = 0; i < protectors.Count(); i++) {
            protectors.GetByIndex(i).shutDown(spData, isForce);
        }

        if (!isForce) {
            sendUsage(Consts.usages.NO);

            if (fullData.homepage) {
                searchProtectorData.homepageProtectChoise = false;
                fullData.homepage = null;
                spData.homepage = false;
            }
            if (fullData.searchEngine || fullData.searchUrl) {
                searchProtectorData.searchProtectChoise = false;
                fullData.searchEngine = null;
                fullData.searchUrl = null;
                spData.search = false;
            }
            repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
        }
    }

    function sendUsage(userResult) {
        conduit.applicationLayer.appCore.appManager.model.sendUsage({
            type: "sendToolbarUsage",
            actionType: Consts.usages.ACTION_TYPE,
            additionalUsageInfo: {
                userResult: userResult,
                updatedElement: getUpdatedElements(),
                domain: getDomain()
            }
        });
    }



    function dontShowDialogsAfterChange(type) {
        if (type) {
            var protector = protectors.GetByID(enumProtectors[type]);
            protector.dontShowDialogsAfterChange(fullData);
        }
        else {
            for (var i = 0; i < protectors.Count(); i++) {
                protectors.GetByIndex(i).dontShowDialogsAfterChange(fullData);
            }
        }
    }

    function getDomain(topLevel) {
        var info = { topLevel: topLevel };
        if (fullData.homepage) {
            var homePageProtector = protectors.GetByID(enumProtectors.homepage);
            if (homePageProtector) {
                return homePageProtector.getDomain(topLevel);
            }
        }
        else {
            var searchProtector = protectors.GetByID(enumProtectors.search);
            if (searchProtector) {
                info.searchUrl = fullData.searchUrl;
                return searchProtector.getDomain(info);
            }
        }
        return null;
    };

    function getDomains(topLevel) {
        var domains = { homepage: "", search: "" };
        var info = { topLevel: topLevel };
        if (fullData.homepage) {
            var homePageProtector = protectors.GetByID(enumProtectors.homepage);
            if (homePageProtector) {
                domains.homepage = homePageProtector.getDomain(topLevel);
            }
        }
        if (fullData.searchEngine || fullData.searchUrl) {
            var searchProtector = protectors.GetByID(enumProtectors.search);
            if (searchProtector) {
                info.searchUrl = fullData.searchUrl;
                domains.search = searchProtector.getDomain(info);
            }
        }
        return domains;
    }


    function enableHomePageProtector(enabled, userChange, sleepMode) {
        searchProtectorData.homepage.enabled = enabled;
        if (userChange) {
            searchProtectorData.homepageChangedManually = true;
        }

        searchProtectorData.homepageInSleepMode = sleepMode;

        repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
    }

    function enableSearchProviderProtector(enabled, userChange, sleepMode) {

        searchProtectorData.browserSearch.enabled = enabled;
        if (userChange) {
            searchProtectorData.searchChangedManually = true;
        }

        searchProtectorData.searchInSleepMode = sleepMode;

        repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });

    }


    function getScreenDimensions(width, height) {
        var screenDimensions = {};
        if (conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type == "IE") {
            screenDimensions.left = parseInt((screen.width - width) * 0.5),
            screenDimensions.top = parseInt((screen.height - height) * 0.5);
        }
        else {
            screenDimensions.top = (screen.height - height) * 0.5;
            screenDimensions.left = ((screen.availWidth - width) * 0.5) + screen.availLeft;
        }
        return screenDimensions;
    }

    function getScreenDimensionsForBubble(width, height, screenHight) {
        var screenDimensions = {};
        var currentScreenHight = screenHight || screen.availHeight || screen.height;
        if (conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type == "IE") {
            screenDimensions.left = parseInt((screen.width - width)),
            screenDimensions.top = parseInt((currentScreenHight - height - 15));
        }
        else {
            screenDimensions.left = ((screen.availWidth - width)) + screen.availLeft - 10;
            screenDimensions.top = (currentScreenHight - height - 15);
        }
        return screenDimensions;
    }

    function openSearchProtectorBubbleDialog() {

        var width = 260;
        var height = 110;
        conduit.abstractionlayer.commons.environment.getScreenHeight(function (response) {
            var screenHight = screen.availHeight || screen.height;
            if (response && !response.status && response.result) {
                screenHight = response.result;
            }
            var screenDimensions = getScreenDimensionsForBubble(width, height, screenHight);

            conduit.abstractionlayer.commons.messages.sendSysReq("getToolbarDirection", "searchProtectorManager", "", function (response) {
                alignMode = JSON.parse(response).dialogsDirection.toLowerCase();

                var appData = {
                    data: spData,
                    toolbarName: toolbarName,
                    alignMode: alignMode
                };

                var applicationDirName = conduit.coreLibs.config.getApplicationDirName();
                //set url for popup.
                var applicationPath = conduit.abstractionlayer.commons.environment.getApplicationPath().result + applicationDirName + "/al/sp/spbd/main.html#appData=" + encodeURI(JSON.stringify(appData));
                if (spData && (spData.homepage || spData.search)) {
                    popup.open(screenDimensions.top, screenDimensions.left, width, height, applicationPath, null, false, false, false, true, { hScroll: false, vScroll: false, isInnerTransparent: true, isDialog: true }, function (info) {
                        bubblePopupId = info.result;
                        isBubblePopupOpened = true;

                    });
                }
            });

        });

    }

    function openSearchProtectorSettingsDialog() {
        var width = 410;
        var height = 360;
        var screenDimensions = getScreenDimensions(width, height);

        conduit.abstractionlayer.commons.messages.sendSysReq("getToolbarDirection", "searchProtectorManager", "", function (response) {
            alignMode = JSON.parse(response).dialogsDirection.toLowerCase();

            //set data to pass as query string
            var appData = {
                data: spData,
                toolbarName: toolbarName,
                domainName: getDomain(true),
                alignMode: alignMode
            };

            var applicationDirName = conduit.coreLibs.config.getApplicationDirName();
            //set url for popup.
            var applicationPath = conduit.abstractionlayer.commons.environment.getApplicationPath().result + applicationDirName + "/al/sp/spsd/main.html#appData=" + encodeURI(JSON.stringify(appData));
            popup.open(screenDimensions.top, screenDimensions.left, width, height, applicationPath, null, true, false, false, true, { hScroll: false, vScroll: false, isInnerTransparent: true, isDialog: true }, function (data) {
                settingsPopupId = data.result;
                isSettingsPopupOpened = true;

            });
        });
    }

    function closeSearchProtectorBubbleDialog() {
        popup.close(bubblePopupId, function () {
            isBubblePopupOpened = false;
        });
    }


    function closeSearchProtectorSettingsDialog() {
        popup.close(settingsPopupId, function () {
            isSettingsPopupOpened = false;
        });
    }

    function isSearchProtectorSupported() {
        return (conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type == "Chrome" ||
                conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type == "Safari");
    }

    function updateHomePageSleepMode(sleepMode) {
        //if the sleep mode was updated, change it and save the data
        if (sleepMode != searchProtectorData.homepageInSleepMode) {
            searchProtectorData.homepageInSleepMode = sleepMode;
            repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
        }
    }

    return {
        init: init,
        enableHomePageProtector: enableHomePageProtector,
        updateHomePageSleepMode: updateHomePageSleepMode,
        enableSearchProviderProtector: enableSearchProviderProtector
    };
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.applicationLayer.searchProtectorManager,
    dependencies: ['toolbarSettings', 'applicationLayer.appCore.appManager.model'],
    onLoad: conduit.applicationLayer.searchProtectorManager.init
});

