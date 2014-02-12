
var serviceMapObj = function () {
    var ctid, serviceMapData;
    var serviceMapUrl;
    var refreshInterval, refreshTimer;
    var initFinished = false;

    var consts = {
        resourceTimeout: 3000,
        serviceName: "serviceMap",
        consoleLog: "serviceMap_" + "consoleLog",
        serviceMapData: "serviceMap_" + "Data", //stores the JSON data
        lastTimeRun: "serviceMap_" + "LastTimeRun", //specifies the last time we checked for updates
        serviceMapUrl: "serviceMapUrl", // The key to get the service map url from the embedded config
        manualRefreshInterval: "serviceMap_" + "manualRefreshInterval", // The key overwrites the refresh interval for the service map itself,used for QA purposes
        defaultRefreshInterval: 21600 // default refresh interval : 6H
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    // Gets the JSON object received from the service and loads the services data into the serviceMapData object.
    // On the first time, triggers the event onServiceMapInit
    // On any subsequent updates, triggers onServiceMapUpdate

    function loadServiceMapData(data) {

        var res = false;
        if (typeof (data) === "object")
            data = JSON.stringify(data);

        data = data.replace(/EB_TOOLBAR_ID/g, ctid).replace(/EB_ORIGINAL_CTID/g, ctid);
        var jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (e) {
            consoleLog('error in JSON.parse: ' + e);
            jsonData = null;
        }

        if (jsonData != null) {
            serviceMapData = jsonData;
            refreshInterval = jsonData.reload_interval_sec * 1000;
            overwriteRefreshInterval();
            ls(consts.serviceMapData, serviceMapData);
            res = true;
        }

        return res;
    }

    function getServiceMapData() {
        var data = getResource(serviceMapUrl, consts.resourceTimeout, false);

        return loadServiceMapData(data);
    }

    function overwriteRefreshInterval() {

        // Overwrite manually refresh interval.
        var manualRefreshInterval = ls(consts.manualRefreshInterval);
        if (typeof (manualRefreshInterval) != 'undefined' &&
            manualRefreshInterval != null) {
            refreshInterval = manualRefreshInterval * 1000;
        }

    }

    function init() {
        try {
            conduit.newtab.initConsoleLog(consts.consoleLog);
            consoleLog("init");

            serviceMapData = ls(consts.serviceMapData);
            if (typeof (serviceMapData) == 'undefined' || serviceMapData == null) {
                serviceMapData = { services: [], reload_interval_sec: consts.defaultRefreshInterval };
            } else {
                initFinished = true;
            }
            refreshInterval = serviceMapData.reload_interval_sec * 1000;
            overwriteRefreshInterval();

            ctid = conduit.newtab.toolbar.ctid();
            serviceMapUrl = conduit.newtab.embeddedConfig.get(consts.serviceMapUrl) + ctid;

            refresh(false);
            return initFinished;
        } catch (e) {
            exceptionHandler(e, getLineInfo());
            return false;
        }
    }

    function getServiceByName(itemName, protocolVersion) {
        if (typeof (itemName) !== "string")
            return null;

        for (var i = 0; i < serviceMapData.services.length; ++i) {
            if (serviceMapData.services[i].name == itemName &&
                serviceMapData.services[i].protocol_version == protocolVersion) {
                return { url: serviceMapData.services[i].url, reload_interval_sec: serviceMapData.services[i].reload_interval_sec };
            }
        }

        return null;
    }

    function refreshService() {
        if (refreshTimer != null) {
            window.clearTimeout(refreshTimer);
            refreshTimer = null;
        }
        refresh(false);
    }

    function refresh(force) {
        var lastTimeRun = ls(consts.lastTimeRun);
        var now = new Date().getTime();

        consoleLog('refresh');

        var lsIsInvalid = ls(consts.serviceMapData) == null ||
            ls(consts.lastTimeRun) == null;

        if (force || lsIsInvalid || now > (lastTimeRun + refreshInterval)) {


            var res = getServiceMapData();
            if (res) {
                if (!initFinished) {
                    initFinished = true;
                }
                obj.onChanged.fireEvent();
            }
            // Save last update time
            lastTimeRun = ls(consts.lastTimeRun, now);
        }

        if (refreshTimer == null) {
            var nextTimeRun = refreshInterval - (lastTimeRun > now - refreshInterval ? now - lastTimeRun : 0);
            refreshTimer = window.setTimeout(refreshService, nextTimeRun);
            consoleLog(consts.serviceName + 'Timer nextTimeRun = ' + nextTimeRun);
        }

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

        if (typeof (serviceMapData) == 'undefined' || serviceMapData == null) {
            refreshInterval = consts.defaultRefreshInterval * 1000;
        } else {
            refreshInterval = serviceMapData.reload_interval_sec * 1000;
        }
        overwriteRefreshInterval();

    }

    function getManualRefreshInterval() {

        return ls(consts.manualRefreshInterval) || 0;

    }

    function forceRefresh() {
        refresh(true);
    }

    function getServiceMapURL() {
        return serviceMapUrl;
    }

    function getRefreshInterval() {

        var tempServiceMapData = serviceMapData;
        if (typeof (serviceMapData) == 'undefined' || serviceMapData == null) {
            tempServiceMapData = { reload_interval_sec: consts.defaultRefreshInterval };
        }
        return tempServiceMapData.reload_interval_sec;
    }

    function getServices() {

        var tempServiceMapData = serviceMapData;
        if (typeof (serviceMapData) == 'undefined' || serviceMapData == null) {
            tempServiceMapData = { services: [] };
        }
        return tempServiceMapData.services;
    }

    var developerMode = {
        getManualRefreshInterval: getManualRefreshInterval,
        setManualRefreshInterval: setManualRefreshInterval,
        forceRefresh: forceRefresh,
        getServiceMapURL: getServiceMapURL,
        getRefreshInterval: getRefreshInterval,
        getServices: getServices
    };

    var obj = {
        init: init,
        getServiceByName: getServiceByName,
        refreshService: refreshService,
        onChanged: new eventHandlerObj('conduit.newtab.serviceMap.onchanged'),
        developerMode: developerMode
    };

    return obj;
};       //end of serviceMapObj
