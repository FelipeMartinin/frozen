var recentlyClosedObj = function () {


    var consts = {
        serviceName: "recentlyClosed",
        consoleLog: "recentlyClosed_" + "consoleLog",
        recentlyClosedSettings: "recentlyClosedSettings",
        openTabs: "openTabs",
        MaxRecentlyClosed: 15,
        recentlyClosedPrefix: "recentlyClosedPrefix-"
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    var recentlyClosedSettings = [], MaxRecentlyClosed;
    var tabs = null;

    function getRecentlyClosed() {

        if (recentlyClosedSettings === null) {
            recentlyClosedSettings = [];
        }

        var recentlyClosedSettingsClone = [];
        for (var i = 0; i < recentlyClosedSettings.length; ++i) {
            recentlyClosedSettingsClone.push(
                {
                    id: consts.recentlyClosedPrefix + recentlyClosedSettings[i].id,
                    type: recentlyClosedSettings[i].type,
                    title: recentlyClosedSettings[i].title,
                    url: recentlyClosedSettings[i].url,
                    urls: recentlyClosedSettings[i].urls
                });
        }

        return recentlyClosedSettingsClone;

    }

    function openRecentlyClosed(idWithPrefix) {

        var id = parseInt(idWithPrefix.split(consts.recentlyClosedPrefix, 2)[1]);
        var recentlyClosed = recentlyClosedSettings.filter(function (current) {
            return current.id === id;
        })[0];
        if (recentlyClosed) {


            recentlyClosedSettings.splice(recentlyClosedSettings.indexOf(recentlyClosed), 1);

            ls(consts.recentlyClosedSettings, recentlyClosedSettings);
            obj.onChanged.fireEvent();

            //chrome.tabs.update({ url: recentlyClosed.url });
        }
    }

    function onRemoved(tabId) {

        var tab = tabs.filter(function (tab) { return tab.id === tabId })[0];

        if (recentlyClosedSettings === null) {
            recentlyClosedSettings = [];
        }

        if (!tab || tab.incognito === true
            || (tab.url).indexOf("chrome://") !== -1
                || (tab.url).indexOf("chrome-extension://") !== -1
                    || (tab.url).indexOf("chrome-internal://") !== -1
                        || (tab.url).indexOf("chrome-devtools://") !== -1) {
            return;
        }

        var tabTitle = (tab.title === "") ? tab.url : tab.title;

        var NewId = 0;
        for (var i = 0; i < recentlyClosedSettings.length; ++i) {
            var currentId = parseInt(recentlyClosedSettings[i].id);
            if (currentId > NewId) {
                NewId = currentId;
            }
        }

        ++NewId;

        // KobyM - type is currently fixed to "tab", "window" is still an open issue.
        recentlyClosedSettings.unshift({ id: NewId, type: "tab", title: tabTitle, url: tab.url, urls: [] });

        while (recentlyClosedSettings.length > MaxRecentlyClosed) {
            recentlyClosedSettings.pop();
        }

        ls(consts.recentlyClosedSettings, recentlyClosedSettings);
        obj.onChanged.fireEvent();
        getAllTabs();
    }

    function getAllTabs() {
        chrome.tabs.query({}, function (TabsData) {

            tabs = TabsData;
            ls(consts.openTabs, tabs);

        });
    }

    function settingsOnChanged() {

        var refreshNeeded = false;

        MaxRecentlyClosed = conduit.newtab.settings.getSettingsKey("MaxRecentlyClosed");
        if (MaxRecentlyClosed == null) {
            MaxRecentlyClosed = consts.MaxRecentlyClosed;
        }

        if (recentlyClosedSettings.length > MaxRecentlyClosed) {
            refreshNeeded = true;
        }

        if (refreshNeeded) {

            // Remove excessive recently closed files, if the new MaxRecentlyClosed is smaller.
            while (recentlyClosedSettings.length > consts.MaxRecentlyClosed) {
                recentlyClosedSettings.pop();
            }

            ls(consts.recentlyClosedSettings, recentlyClosedSettings);
            obj.onChanged.fireEvent();
            getAllTabs();

        }

    }

    function init() {
        try {
            conduit.newtab.initConsoleLog(consts.consoleLog);
            consoleLog("init");

            recentlyClosedSettings = ls(consts.recentlyClosedSettings);
            if (recentlyClosedSettings === null) {
                recentlyClosedSettings = [];
                ls(consts.recentlyClosedSettings, recentlyClosedSettings);
            }

            chrome.tabs.onRemoved.addListener(onRemoved);
            chrome.tabs.onMoved.addListener(getAllTabs);
            chrome.tabs.onCreated.addListener(getAllTabs);
            chrome.tabs.onUpdated.addListener(getAllTabs);
            chrome.tabs.onHighlighted.addListener(getAllTabs);
            conduit.newtab.settings.onChanged.addListener(settingsOnChanged);
            settingsOnChanged();
            getAllTabs();

            return true;
        } catch (e) {
            exceptionHandler(e, getLineInfo());
            return false;
        }
    }

    //-------------------------------------------------------------------------
    // developerMode
    //-------------------------------------------------------------------------

    function getRecentlyClosedDeveloper() {

        var tempRecentlyClosedSettings = recentlyClosedSettings;
        if (recentlyClosedSettings === null) {
            tempRecentlyClosedSettings = [];
        }

        return tempRecentlyClosedSettings;
    }

    function clearRecentlyClosed() {

        recentlyClosedSettings = [];
        ls(consts.recentlyClosedSettings, recentlyClosedSettings);
        obj.onChanged.fireEvent();

    }

    function getRecentlyClosedCount() {
        return MaxRecentlyClosed;
    }

    var developerMode = {
        getRecentlyClosed: getRecentlyClosedDeveloper,
        clearRecentlyClosed: clearRecentlyClosed,
        getRecentlyClosedCount: getRecentlyClosedCount
    };

    var obj = {
        init: init,
        getRecentlyClosed: getRecentlyClosed,
        openRecentlyClosed: openRecentlyClosed,
        onChanged: new eventHandlerObj('conduit.newtab.recentlyClosed.onchanged'),
        developerMode: developerMode

    };

    return obj;

};           //end of recentlyclosed
