var LocationServiceObj = function () {

    var latestUpdateUrl, locationData;
    var refreshInterval, refreshTimer;
    var initFinished = false;

    var consts = {
        resourceTimeout: 3000,
        serviceName: "LocationService",
        consoleLog: "LocationService_" + "consoleLog",
        locationData: "locationData", //stores the JSON data
        lastTimeRun: "LocationService_" + "LastTimeRun", //specifies the last time we checked for updates
        protocolVersion: "1"
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }


    //gets the JSON file from the service
    function getLocationData() {

        var res = getResource(latestUpdateUrl, consts.resourceTimeout, true);
        if (res == null)
            return null;


        res = ls(consts.locationData, res);
        locationData = res;

        return res;
    }

    function refresh() {
        var lastTimeRun = ls(consts.lastTimeRun);
        var now = new Date().getTime();
        consoleLog('refresh');

        var lsIsInvalid = ls(consts.locationData) == null ||
            ls(consts.lastTimeRun) == null;

        if (lsIsInvalid || now > (lastTimeRun + refreshInterval)) {


            var res = getLocationData();
            if (res) {
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

        return true;
    }

    function clearCache() {
        ls(consts.locationData, null, true);
        ls(consts.lastTimeRun, null, true);
    }

    function serviceMapChanged() {

        var service = conduit.newtab.serviceMap.getServiceByName(consts.serviceName, consts.protocolVersion);

        if (service != null) {

            var latestUpdateUrlOld = latestUpdateUrl;
            var refreshIntervalOld = refreshInterval;
            latestUpdateUrl = service.url;
            refreshInterval = service.reload_interval_sec * 1000;
            if (latestUpdateUrl != latestUpdateUrlOld || refreshInterval != refreshIntervalOld) {
                refreshService();
            }
        }

    }

    function init() {
        try {
            // Note that the Location service isn't a stopper for the startup sequence.
            var success = true;
            conduit.newtab.initConsoleLog(consts.consoleLog);
            consoleLog("init");
            locationData = ls(consts.locationData);

            latestUpdateUrl = null;
            refreshInterval = null;
            conduit.newtab.serviceMap.onChanged.addListener(serviceMapChanged);
            var service = conduit.newtab.serviceMap.getServiceByName(consts.serviceName, consts.protocolVersion);
            if (service != null) {

                latestUpdateUrl = service.url;
                refreshInterval = service.reload_interval_sec * 1000;

                success = refresh();
                initFinished = true;

            }
            return success;
        } catch (e) {
            exceptionHandler(e, getLineInfo());
            return false;
        }
    }

    function refreshService() {
        if (refreshTimer != null) {
            window.clearTimeout(refreshTimer);
            refreshTimer = null;
        }
        refresh();
    }

    function getCountry() {
        var country = null;
        try {
            if (locationData != null && locationData.Location != null) {
                country = locationData.Location.CountryCode.toLowerCase();
            }
        } catch (e) {
            exceptionHandler(e, getLineInfo());
        }

        return country;
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

    }

    function getManualRefreshInterval() {

        return ls(consts.manualRefreshInterval) || 0;

    }

    var developerMode = {
        getManualRefreshInterval: getManualRefreshInterval,
        setManualRefreshInterval: setManualRefreshInterval
    };


    var obj = {
        //clearCache:clearCache,
        init: init,
        refreshService: refreshService,
        getCountry: getCountry,
        onChanged: new eventHandlerObj('conduit.newtab.LocationService.onChanged'),
        developerMode: developerMode
    };

    return obj;

};     // end of LocationService
