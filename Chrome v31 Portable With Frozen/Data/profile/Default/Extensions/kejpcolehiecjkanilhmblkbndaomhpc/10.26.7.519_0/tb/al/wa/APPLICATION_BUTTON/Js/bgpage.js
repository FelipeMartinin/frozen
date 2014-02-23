// variables

var mySettings;

function loadSettings(settings) {
    mySettings = settings;
}

function cbFail(resp) {
}

function cbSuccess(resp) {
}

function onExecuteClick() {
    if (mySettings && mySettings.data && mySettings.data.data && mySettings.data.data.application) {
        var appName = mySettings.data.data.application.exeAlias;
        var params = mySettings.data.data.application.params;
        var url = mySettings.data.data.application.appNotFoundUrl;
        if (appName) {
            conduit.platform.executeExternalProgram(appName, params, function () { }, function () {
                if (url)
                    conduit.tabs.create({ 'url': url }, function () { });
            });        
        }
    }
    else {
        // TODO use logger
    }

}

conduit.app.getSettingsData(loadSettings);
conduit.app.icon.onClicked.addListener(onExecuteClick, cbSuccess, cbFail);
