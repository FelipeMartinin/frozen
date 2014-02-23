var developerModeObj = function () {

    var consts = {
        serviceName: "developerMode",
        consoleLog: "developerMode_" + "consoleLog",
        developerModeSettings: "developerModeSettings"
    };

    var developerModeSettings;
    var DevMode;

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    function init() {
        try {

            conduit.newtab.initConsoleLog(consts.consoleLog);
            consoleLog("init");

            // Retrieve the state from the embedded config.
            DevMode = false;
            if ((typeof (conduit.newtab.embeddedConfig) != 'undefined') &&
                  conduit.newtab.embeddedConfig.isInitFinished()) {
                DevMode = conduit.newtab.embeddedConfig.get("DevMode");
            }

            ls(consts.developerModeSettings) || ls(consts.developerModeSettings, null);
            developerModeSettings = ls(consts.developerModeSettings);

            return true;
        } catch (e) {
            exceptionHandler(e, getLineInfo());
            return false;
        }
    }

    function registerConsoleLog() {

    }

    function loadIntoNewTab(NewTabDocument) {
        ///////// OPTIONS //////////////

        var newScript = NewTabDocument.createElement("script");
        newScript.setAttribute("src", "../../DeveloperMode/js/developer_mode_page.js");
        NewTabDocument.getElementById('head').appendChild(newScript);

        //        // If Fauxbar's hash value says to open display the Options page, and the user isn't reindexing the database, let's initialize and show the options!
        //        // And I decided to show the Options page inline with the normal Fauxbar page, because a lot of the options alter the Fauxbar on the fly, so wanted to have both visible at once,
        //        // rather than making a whole new options page by itself.
        //        if (getHashVar("options") == 1 && localStorage.indexComplete == 1) {
        //        }

        //////// END OPTIONS ////////

    }

    var obj = {
        init: init,
        registerConsoleLog: registerConsoleLog,
        loadIntoNewTab: loadIntoNewTab
    };
    return obj;
};
