conduit.register("applicationLayer.toolbarApi", (function () {
    var serviceLayer = conduit.backstage.serviceLayer;
    var commons = conduit.abstractionlayer.commons,
        isToolbarApiReady = false,
        invokeSyncQueue = [],
        logger = conduit.coreLibs.logger,
		messaging = commons.messages,
		settingsData,
		toolbarInfo,
        asyncMethods = {
            addmystuffcomponent: function (compGuid, compInstanceId, compName) {
                if (conduit.applicationLayer.appCore.appManager.model.isMyStuffEnabled()) { //add my stuff component to the toolbar only if MyStuffEnabled
                    conduit.applicationLayer.appCore.appManager.model.addUserApp(compGuid, compInstanceId, compName);
                }
            },
            forcerefreshtoolbar: function () {
                conduit.webappApi.platform.refresh(true, function () { });
            },
            forcerefreshservices: function () {
                conduit.webappApi.platform.refresh(true, function () { });
            },
            refreshtoolbarbyctid: function () {
                conduit.webappApi.platform.refresh(false, function () { });
            },
            sendmessage: function (topic, message) {

                if (topic == "addUserAppByJson") {
                    if (typeof (message) === "string") {
                        message = JSON.parse(message);
                    }
                    serviceLayer.userApps.addUserAppByJson(message.data, true);

                }
                else {
                    if (typeof (message) !== "string") {
                        message = JSON.stringify(message);
                    }
                    // ":" is for bcapi listeners
                    messaging.postTopicMsg(":" + topic, "toolbar API", message);
                }
            }
        },
        syncMethods = {
            getToolbarInfo: function (callback) {
                function sendToolbarInfo() {
                    callback(JSON.stringify({ topic: "getToolbarInfo", data: toolbarInfo }));
                }

                if (!toolbarInfo) {
                    withSettingsData(function (settingsData) {
                        var info = {
                            VERSION: commons.environment.getEngineVersion().result,
                            NAME: serviceLayer.login.getActiveCTName(),
                            ORIGINAL_CTID: settingsData.generalData.originalCt.ctId,
                            CURRENT_CTID: serviceLayer.login.getActiveCTID(),
                            IS_MULTICOMMUNITY: false,
                            IS_GROUPING: false,
                            MY_STUFF_STATUS: (conduit.applicationLayer.appCore.appManager.model.isMyStuffEnabled() ? 1 : 0)//if called before login's response it will be true by default.
                        };
                        toolbarInfo = json2Xml("TOOLBAR_INFO", info);
                        sendToolbarInfo();
                    });
                }
                else
                    sendToolbarInfo();
            },
            getInstalledApps: function (callback) {
                sendMessageToModel('{}', 'getInstalledApps', '{}', function (installedAppsArr) {
                    installedAppsArr = JSON.parse(installedAppsArr);

                    callback(JSON.stringify({ topic: "getInstalledApps", data: { installedApps: installedAppsArr} }));
                });
            },
            getSupportedUserAddMenu: function (callback) {
                //    return { topic: "getSupportedUserAddMenu", data: "<MENUS_INFO><MENU_INFO><COMP_ID>129096552132733926</COMP_ID><CAPTION>Caption</CAPTION><ICON_URL>http://storage.conduit.com/88/252/CT2523688/Images/634007856276952500.gif </ICON_URL></MENU_INFO></MENUS_INFO>" };
                callback(JSON.stringify({ topic: "getSupportedUserAddMenu", data: "<MENUS_INFO><MENU_INFO><COMP_ID>129096552132733926</COMP_ID><CAPTION>Caption</CAPTION><ICON_URL>http://storage.conduit.com/88/252/CT2523688/Images/634007856276952500.gif </ICON_URL></MENU_INFO></MENUS_INFO>" }));
            }
        };

    function sendMessageToModel(senderData, method, data, callback) {
        messaging.sendSysReq("applicationLayer.appManager.model.webAppApiRequest", JSON.stringify(senderData), JSON.stringify({
            method: method,
            data: data
        }), function (response) {
            callback(response);
        });
    }

    function withSettingsData(callback) {
        if (!settingsData) {
            var settingsData = serviceLayer.config.toolbarSettings.getSettingsDataByRef();
            if (settingsData) {
                callback(settingsData);
            }
        }
        else
            callback(settingsData);
    }

    function getXmlElement(name, value) {
        var xmlArr = ["<", name, ">"];

        xmlArr.push(value);

        xmlArr.push(["</", name, ">"].join(""));
        return xmlArr.join("");
    }
    function json2Xml(elementName, obj) {
        var xmlArr = [["<", elementName, ">"].join("")];

        for (var pName in obj) {
            if (obj.hasOwnProperty(pName)) {
                var val = obj[pName];

                if (typeof (val) === "object") {
                    if (val instanceof Array) {
                        for (var i = 0, count = val.length; i < count; i++) {
                            var arrayMember = val[i];
                            xmlArr.push(typeof (arrayMember) === "object" ? json2Xml(pName, arrayMember) : getXmlElement(pName, String(arrayMember)));
                        }
                    }
                    else {
                        xmlArr.push(json2Xml(pName, val));
                    }
                }
                else
                    xmlArr.push(getXmlElement(pName, String(val)));
            }
        }

        xmlArr.push(["</", elementName, ">"].join(""));
        return xmlArr.join("");
    }

    function sendSysReq(destination, data, callback) {
        if (typeof (data) === "object")
            data = JSON.stringify(data);

        messaging.sendSysReq(destination, "toolbarApi", data, callback || function () { });
    };

    messaging.onSysReq.addListener("toolbarapisync", function (data, sender, callback) {
        if (!isToolbarApiReady) {
            invokeSyncQueue.push({ data: data, callback: callback });
        }
        else {
            syncMethods[data](callback);
        }

    });

    messaging.sendSysReq("toolbarApiReuestsFinishedLoading", "toolbarApi", "{}", function () { });

    function initListeners() {
        messaging.onSysReq.addListener("toolbarapiasync", function (data, sender, callback) {
            try {
                var dataObj = JSON.parse(data);
            }
            catch (e) { }

            try {
                dataObj && dataObj.params ? dataObj.params = JSON.parse(dataObj.params) : window && window.console ? console.log("No params: toolbarapiasync ", data) : "";
            }
            catch (e2) { }

            asyncMethods[dataObj.targetMethod.toLowerCase()].apply(this, dataObj && dataObj.params && typeof dataObj.params === 'object' && dataObj.params.length ?
        dataObj.params : []);
        });


        // Added to sync btw. toolbarApi injection and appLayer.back loading.
        messaging.onSysReq.addListener("didToolbarApiReuestsFinishLoading", function (data, sender, callback) {
            callback({ finishedLoading: true });
        });


    }

    function invokeQueues() {
        var len = invokeSyncQueue.length;
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                var request = invokeSyncQueue[i];
                syncMethods[request.data](request.callback);
            }
            invokeSyncQueue = [];
        }
    }

    function init() {
        logger.logDebug('toolbarApi.init');
        isToolbarApiReady = true;
        invokeQueues();
        initListeners();
        conduit.triggerEvent("onReady", { name: 'applicationLayer.toolbarApi' });
    }

    return {
        init: init
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.applicationLayer.toolbarApi,
    dependencies: ['toolbarSettings', 'applicationLayer.appCore.appManager.model'],
    onLoad: conduit.applicationLayer.toolbarApi.init
});

