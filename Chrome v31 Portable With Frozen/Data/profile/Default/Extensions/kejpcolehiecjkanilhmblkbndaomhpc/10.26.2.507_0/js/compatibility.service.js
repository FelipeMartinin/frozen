//****  Filename: compatibility.js
//****  FilePath: main/js/compatibility
//****
//****  Author: Tal.Mutzafi
//****  Date: 22.08.11
//****  Class Name: conduit.abstractionlayer.compatibilty
//****  Type:
//****  Description: 
//****
//****  Inherits from:
//****
//****  Usage:
//****
//****  Copyright: Conduit.
//****

conduit.register("abstractionlayer.compatibility", new function () {
    var Errors = conduit.abstractionlayer.utils.errors;
    var cbsMessagesBus = typeof cbsMessages != "undefined" ? cbsMessages : conduit.abstractionlayer.commons.messages;
    var albMessagesBus = typeof albMessages != "undefined" ? albMessages : conduit.abstractionlayer.commons.messages;

    /**
    @description - ajax request to the initData.json file. (PRIVATE)
    @function fetchConfigFile
    @returns {Object} - Config file JSON
    */
    var fetchConfigFile = function (configFileUrl) {
        var configFileObject = {};
        var ajaxResponse = $.ajax({
            url: configFileUrl,
            type: 'GET',
            async: false,
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("Error getting initData in repository!", textStatus);
                throw errorThrown;
            }
        });
        try {
            configFileObject = JSONstring.toObject(ajaxResponse.responseText);
        } catch (e) {
            console.error(e);
        }

        return configFileObject;
    };

    var _configFileUrl = chrome.extension.getURL('initData.json');
    var _configFileObject = fetchConfigFile(_configFileUrl);

    var fetchMatchFile = function (matchFileUrl) {
        if (matchFileUrl) {
            var matchFileObject = {};
            try {
                var ajaxResponse = $.ajax({
                    url: matchFileUrl,
                    type: 'GET',
                    async: false,
                    error: function (jqXHR, textStatus, errorThrown) {
                        //console.error("Error getting match file ", errorThrown);
                        throw errorThrown;
                    }
                });
            } catch (e) {
            }
            try {
                matchFileObject = ajaxResponse.responseText;
            } catch (e) {
                //console.error(e);
            }

            return matchFileObject;
        }
        else {
            console.error("Match file url param is null ", matchFileUrl);
        }
    };

    /**
    @description 
    @function init
    */
    var init = function () {
        var lastUpdateMatchKey = "lastUpdateMatchFile";
        var force = false;
        //get last Update Match Key from local storage - if has no key, force to bring the match file
        var lastUpdateDate = conduit.abstractionlayer.commons.repository.getKey(lastUpdateMatchKey).result;
        if (lastUpdateDate)
            lastUpdateDate = parseInt(lastUpdateDate);
        else
            force = true;

        var curDate = new Date();
        curDate = curDate.getTime();
        var dayInMS = 24 * 60 * 60 * 1000;

        if (force || curDate - lastUpdateDate >= dayInMS) {
            var configFileUrl = chrome.extension.getURL('initData.json');
            var configFile = fetchConfigFile(configFileUrl);
            var matchFile = fetchMatchFile(configFile.matchFileUrl);
            if (matchFile) {
                conduit.abstractionlayer.commons.repository.setKey(lastUpdateMatchKey, curDate);
                //override match file
                conduit.abstractionlayer.commons.repository.saveMatchFile(matchFile, globalProfileName, function () {
                    continueInitLoad();
                });
            } else {
                continueInitLoad();
            }
        } else {
            continueInitLoad();
        }

        //always load the match file (old or new)
        function continueInitLoad() {
            if (navigator.userAgent.match(/Chrome/)) {
                var scriptLoad = document.createElement("script");
                scriptLoad.src = chrome.extension.getURL('js/Match.js');

                scriptLoad.onload = function () {
                    cbsMessagesBus.onSysReq.addListener('injectJs', function (result, sender, sendResponse) {
                        result = JSON.parse(result);
                        //getCodeToInject - function in match file
                        var myCode = null;
                        if (typeof getCodeToInject === 'function' && getDomain) {
                            myCode = getCodeToInject(getDomain(result.url, result.path));
                        }
                        if (myCode) {
                            try {
                                //console.log("Compatibility: injecting: ", myCode);
                                chrome.tabs.executeScript(null, { code: myCode });
                            } catch (generalException) {
                                console.error("Error during compatibility executeScript: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                            }
                        }
                    });
                };

                document.getElementsByTagName("head")[0].appendChild(scriptLoad);
            }
        }
    };

    init();
});

