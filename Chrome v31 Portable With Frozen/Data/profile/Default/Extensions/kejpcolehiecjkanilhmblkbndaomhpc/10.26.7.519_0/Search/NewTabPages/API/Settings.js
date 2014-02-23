var settingsObj = function () {


    var SettingsServiceUrl, settingsData;
    var calculatedRefreshInterval, refreshInterval, refreshTimer;
    var initFinished = false;

    var consts = {
        resourceTimeout: 3000,
        serviceName: "Settings",
        consoleLog: "Settings_" + "consoleLog",
        settingsData: "Settings_" + "settingsData", //stores the JSON data
        lastTimeRun: "Settings_" + "LastTimeRun", //specifies the last time we checked for updates
        manualRefreshInterval: "Settings_" + "manualRefreshInterval", // The key overwrites the refresh interval for the service map itself,used for QA purposes
        protocolVersion: "1"
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    function overwriteRefreshInterval() {

        // Overwrite manually refresh interval.
        var manualRefreshInterval = ls(consts.manualRefreshInterval);
        if (typeof (manualRefreshInterval) != 'undefined' &&
         manualRefreshInterval != null) {
            calculatedRefreshInterval = manualRefreshInterval * 1000;
        }

    }


    function init() {
        try {
            conduit.newtab.initConsoleLog(consts.consoleLog);
            consoleLog("init");
            var success = false;
            settingsData = ls(consts.settingsData);
            conduit.newtab.serviceMap.onChanged.addListener(serviceMapChanged);
            var service = conduit.newtab.serviceMap.getServiceByName(consts.serviceName, consts.protocolVersion);
            if (service != null) {

                SettingsServiceUrl = service.url;
                calculatedRefreshInterval = service.reload_interval_sec * 1000;
                refreshInterval = service.reload_interval_sec;
                overwriteRefreshInterval();

                success = refresh(false);
                initFinished = true;

            }
            return success;
        }
        catch (e) {
            exceptionHandler(e, getLineInfo());
            return false;
        }
    }

    function refreshService() {
        if (refreshTimer != null) {
            window.clearTimeout(refreshTimer);
            refreshTimer = null;
        }
        refresh(false);
    }

    function loadSettingsData(data) {

        var jsonData;

        if (typeof (data) === "object")
            data = JSON.stringify(data);

        try {
            jsonData = JSON.parse(data);
        } catch (e) {
            exceptionHandler(e, getLineInfo());
            jsonData = null;
        }

        if (jsonData != null) {
            settingsData = jsonData;
            ls(consts.settingsData, settingsData);

        }

        return (jsonData != null);
    }

    //gets the JSON file from the service
    function getSettingsData() {

        var data = getResource(SettingsServiceUrl, consts.resourceTimeout, false);

        return loadSettingsData(data);
    }

    function refresh(force) {
        var lastTimeRun = ls(consts.lastTimeRun);
        var now = new Date().getTime();
        var res = true;
        consoleLog('refresh');

        var lsIsInvalid = ls(consts.settingsData) == null ||
                             ls(consts.lastTimeRun) == null;

        if (force || lsIsInvalid || now > (lastTimeRun + calculatedRefreshInterval)) {


            res = getSettingsData();
            if (res) {
                obj.onChanged.fireEvent();
            }
            // Save last update time
            lastTimeRun = ls(consts.lastTimeRun, now);
        }

        if (refreshTimer == null) {
            var nextTimeRun = calculatedRefreshInterval - (lastTimeRun > now - calculatedRefreshInterval ? now - lastTimeRun : 0);
            refreshTimer = window.setTimeout(refreshService, nextTimeRun);
            consoleLog(consts.serviceName + 'Timer nextTimeRun = ' + nextTimeRun);
        }

        return res;
    }

    ;

    function clearCache() {
        ls(consts.settingsData, null, true);
        ls(consts.lastTimeRun, null, true);
    }

    function serviceMapChanged() {

        var service = conduit.newtab.serviceMap.getServiceByName(consts.serviceName, consts.protocolVersion);

        if (service != null) {

            var SettingsServiceUrlOld = SettingsServiceUrl;
            var refreshIntervalOld = refreshInterval;

            SettingsServiceUrl = service.url;
            refreshInterval = service.reload_interval_sec;
            calculatedRefreshInterval = service.reload_interval_sec * 1000;

            overwriteRefreshInterval();
            if (SettingsServiceUrl != SettingsServiceUrlOld || refreshInterval != refreshIntervalOld) {
                refreshService();
            }
        }

    }

    function getSettingsKey(itemName) {

        if (typeof (itemName) !== "string")
            return null;

        for (var i = 0; i < settingsData.length; ++i) {
            if (settingsData[i].Name == itemName) {
                return settingsData[i].Value;
            }
        }


        return null;
    }

    //-------------------------------------------------------------------------
    // developerMode
    //-------------------------------------------------------------------------

    function setManualRefreshInterval(value) {

        if (value != 0) {
            ls(consts.manualRefreshInterval, value);
        }
        else {
            ls(consts.manualRefreshInterval, null, true);
        }
        calculatedRefreshInterval = refreshInterval * 1000;
        overwriteRefreshInterval();
    }

    function getManualRefreshInterval() {

        return ls(consts.manualRefreshInterval) || 0;

    }


    function getSettings() {

        return settingsData;

    }

    function forceRefresh() {

        refresh(true);

    }

    function getSettingsServiceURL() {

        return SettingsServiceUrl;
    }

    function getRefreshInterval() {

        return refreshInterval;

    }

    var developerMode = {
        getManualRefreshInterval: getManualRefreshInterval,
        setManualRefreshInterval: setManualRefreshInterval,
        forceRefresh: forceRefresh,
        getSettingsServiceURL: getSettingsServiceURL,
        getRefreshInterval: getRefreshInterval,
        getSettings: getSettings
    };

    var obj = {
        init: init,
        getSettingsKey: getSettingsKey,
        onChanged: new eventHandlerObj('conduit.newtab.settings.onChanged'),
        developerMode: developerMode
    };

    return obj;

};           //end of setting
