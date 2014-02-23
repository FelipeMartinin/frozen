var embeddedConfigObj = function () {

    var consts = {
        serviceName: "embeddedConfig",
        SearchSource: "embeddedConfig" + "_SearchSource"

    };

    var initData;
    var initFinished;
    var isToolBarIntegrated;
    var justInstalled;
    var toolbarDataWasDifferent = false;

    function wasJustInstalled() {
        if (justInstalled == true) {
            justInstalled = false;
            return true;
        }

        return false;
    }

    function fetchConfigFile(configFileUrl) {
        var configFileObject = null;
        var ajaxResponse = $.ajax({
            url: configFileUrl,
            type: 'GET',
            async: false,
            error: function (jqXHR, message, errorThrown) {
                exceptionHandler(errorThrown, getLineInfo());
            }
        });
        try {
            configFileObject = jQuery.parseJSON(ajaxResponse.responseText);
        } catch (e) {
            console.error(e);
        }

        return configFileObject;
    }

    function manifestReader() {
        // Read the manifest.json
        $.ajax({
            type: "GET",
            url: chrome.extension.getURL("manifest.json"),
            dataType: "text",
            async: false,
            success: function (manifest) {
                // Strip out comments then parse as JSON
                var lines = manifest.split("\n");
                for (var l in lines) {
                    lines[l] = lines[l].split("////")[0];
                }
                manifest = jQuery.parseJSON(lines.join("\n"));
                localStorage.extensionName = manifest.name;
                if (ls("currentManifest") == null || ls("currentManifest").version != manifest.version) {
                    justInstalled = true;
                }
                ls("currentManifest", manifest);
            },
            error: function (jqXHR, message, errorThrown) {
                exceptionHandler(errorThrown, getLineInfo());
            }
        });
    }

    function init() {
        try {

            isToolBarIntegrated = false;
            initFinished = false;
            newTabEnabled = false;

            manifestReader();

            var success;
            var configFileUrl = chrome.extension.getURL('Search/initData.json');
            initData = fetchConfigFile(configFileUrl);

            success = (initData != null);
            if (success && (ls(consts.SearchSource) == null || ls(consts.SearchSource) != initData.SearchSource)) {
                toolbarDataWasDifferent = true;
            }
            initFinished = success;
            return success;
        } catch (e) {
            exceptionHandler(e, getLineInfo());
            return false;
        }
    }

    function getConfigKey(key) {
        switch (key) {
            case "serviceMapUrl":
                return initData.serviceMapUrl;
            case "contactUsUrl":
                return initData.contactUsUrl;
            case "DevMode":
                return initData.devMode;
            case "toolBarIntegrated":
                return initData.toolBarIntegrated;
            case "CTID":
                return initData.Ctid;
            case "SSPV":
                return initData.SSPV;
            case "UMID":
                return initData.UMID;
            case "SearchSource":
                return initData.SearchSource;
            case "version":
                return initData.version;
        }


        return null;
    }

    function isInitFinished() {

        return initFinished;
    }

    //-------------------------------------------------------------------------
    // developerMode
    //-------------------------------------------------------------------------

    function setManualRefreshInterval(value) {

        // KobyM - TBD

    }

    function getManualRefreshInterval() {

        // KobyM - TBD

    }

    var developerMode = {
        getManualRefreshInterval: getManualRefreshInterval,
        setManualRefreshInterval: setManualRefreshInterval
    };


    var obj = {
        init: init,
        isInitFinished: isInitFinished,
        get: getConfigKey,
        developerMode: developerMode,
        wasJustInstalled: wasJustInstalled,
        toolbarDataWasDifferent: function () {
            return toolbarDataWasDifferent;
        }
    };

    return obj;
};
