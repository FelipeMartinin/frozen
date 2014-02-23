//
// Copyright © Conduit Ltd. All rights reserved.
// This software is subject to the Conduit license (http://hosting.conduit.com/EULA/).
//
// This code and information are provided 'AS IS' without warranties of any kind, either expressed or implied, including, without limitation, // to the implied warranties of merchantability and/or fitness for a particular purpose.
//
//

﻿conduit.register("backstage.serviceLayer.commons", (function () {
    var xml2jsonOptions = {
        rename: function (xmlTagName) {
            return conduit.utils.string.toCamelCase(xmlTagName.replace(/__$/, ""), "_");
        },
        parser: function (value) {
            if (typeof (value) === "string") {
                switch (value.toLowerCase()) {
                    case "true":
                        return true;
                    case "false":
                        return false;
                    default:
                        return value;
                }
            }

            return value;
        }
    },
    logger = conduit.coreLibs.logger,
    absCommons = conduit.abstractionlayer.commons,
    invokeQueue = [],
    ctid = absCommons.context.getCTID().result,
    applicationLayerFolder = conduit.coreLibs.aliasesManager.constants.APP_PATH_NAME_ALIAS + conduit.coreLibs.aliasesManager.constants.APP_DIR_NAME_ALIAS + "/al/",
    resourcesBasePath = absCommons.environment.getResourcesBasePathURI().result,
    toolbarBornServerTime, toolbarCurrentServerTime,
    Consts = { PRICE_GONG_GUID: "1ec55dac-8dca-406b-9697-5d68893c1c0c", PRICE_GONG_ID: "price-gong" };
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
    var isFF = /Firefox/i.test(browserInfo.type);
    var isIE = /IE/i.test(browserInfo.type);
    var isChrome = /Chrome/i.test(browserInfo.type);
    var searchProtectorUpgraded = false;

    function onChangeViewStateHandler(state, sendUsage) {
        var actionType;
        switch (state) {
            case "shown":
                actionType = "SHOW_TOOLBAR";
                // update supported services to work in hidden url
                switchServicesMode();
                invokeQueuedServices();
                takeOverSearchAddressUrl();
                enableApps();
                conduit.triggerEvent("onStartProtectorsManually");
                break;
            case "hidden":
                actionType = "HIDE_TOOLBAR_DLG_HIDE";
                if (conduit.backstage.serviceLayer.login && conduit.backstage.serviceLayer.login.isLoginInitialized()) {
                    switchServicesMode();
                }
                else {
                    conduit.subscribe("onLoginInitialized", function () {
                        switchServicesMode();
                    });
                }
                disableApps();
                break;
            case "cancel":
                actionType = "HIDE_TOOLBAR_DLG_CANCEL";
                break;
            case "enabled":
                actionType = "ENABLE_TOOLBAR_DLG_ENABLE";
                absCommons.repository.removeKey(ctid + ".toolbarDisabled");
                break;
            case "disabled":
                actionType = "HIDE_TOOLBAR_DLG_DISABLE";
                absCommons.repository.setKey(ctid + ".toolbarDisabled", 'true');
                break;
        }
        if (actionType && sendUsage != false) {
            var usage = conduit.backstage.serviceLayer.usage;
            if (usage && usage.sendToolbarUsage) {
                usage.sendToolbarUsage({ 'actionType': actionType });
            }
        }
    }

    // if toolbar was hidden and now visible
    conduit.abstractionlayer.backstage.browser.onChangeViewState.addEventListener(function (state, sendUsage) {
        //handling toolbar show/hide usages.
        onChangeViewStateHandler(state, sendUsage);
    });


    if (conduit.abstractionlayer.backstage.browser.disableToolbar && conduit.abstractionlayer.backstage.browser.disableToolbar.addEventListener) {
        conduit.abstractionlayer.backstage.browser.disableToolbar.addEventListener(function () {
            // toolbar disabled.
            // send usage.
            var usage = conduit.backstage.serviceLayer.usage;
            var oUsage = { actionType: "HIDE_TOOLBAR_DLG_DISABLE" };
            if (usage && usage.sendToolbarUsage) {
                usage.sendToolbarUsage(oUsage);
            }
            absCommons.repository.setKey(ctid + ".toolbarDisabled", 'true');

        });
    }

    // change url and interval accroding to hidden/shown state.
    function switchServicesMode() {
        try {
            if (conduit.backstage.serviceLayer.config && conduit.backstage.serviceLayer.config.toolbarSettings) {
                conduit.backstage.serviceLayer.config.toolbarSettings.switchMode();
            }
            if (conduit.backstage.serviceLayer.login) {
                conduit.backstage.serviceLayer.login.switchMode();
            }
        }
        catch (e) {
            // TODO add error log here
        }
    }

    // send message to the dialog.model to take over the search address url.
    function takeOverSearchAddressUrl() {
        conduit.triggerEvent("takeOverSearchAddressUrl", {});
    }

    function disableApps() {
        conduit.triggerEvent("disableApps", {});
    }

    function enableApps() {
        conduit.triggerEvent("enableApps", {});
    }

    function invokeQueuedServices() {
        for (var i = invokeQueue.length - 1; i >= 0; i--) {
            var params = invokeQueue[i];
            conduit.abstractionlayer.commons.http.httpRequest(params.url, params.serviceDataMethod, params.data, params.headers, "", "", null, params.cb)
            invokeQueue.pop();
        }
    }


    // Since this object is meant to be common to the whole service layer, I'm using it to add the service layer's listener.
    // In the future, we might like to do a more general listener for the whole system:


    absCommons.messages.onSysReq.addListener("serviceLayer", function (data, sender, callback) {

        if (!callback) {
            callback = function () { };
        }
        if (data) {
            try {
                data = JSON.parse(data);
                if (data instanceof Array) {
                    var callbackResponseArray = [];
                    for (var i = 0; i < data.length; i++) {
                        var serviceRequest = data[i];
                        var serviceReturnValue = runServiceApi(serviceRequest);
                        serviceReturnValue = (typeof (serviceReturnValue) === "undefined" || serviceReturnValue == null) ? '' : serviceReturnValue;
                        serviceRequest.returnValue = serviceReturnValue;
                        callbackResponseArray.push(serviceRequest);
                    }
                    callback(JSON.stringify(callbackResponseArray));
                }
                else {
                    var serviceReturnValue = runServiceApi(data);

                    if (typeof (serviceReturnValue) === "undefined" || serviceReturnValue == null) {
                        callback('');
                    }
                    else {
                        callback(typeof (serviceReturnValue) === "string" ? serviceReturnValue : JSON.stringify(serviceReturnValue));
                    }
                }
            }
            catch (e) {
                var message = "Failed to invoke method: " + data.method + " on service: " + data.service + " from sender: " + sender;
                logger.logError(message, { className: "serviceLayer.commons", functionName: "serviceLayer Listener" }, { code: logger.GeneralCodes.SERVICE_METHOD_INVOCATION_ERROR, error: e });
            }
        }


    });

    function runServiceApi(serviceRequest) {
        var serviceReturnValue = null;
        if (serviceRequest && serviceRequest.service && serviceRequest.method) {
            var service = ~["toolbarSettings", "manifest"].indexOf(serviceRequest.service)
                        ? conduit.backstage.serviceLayer.config[serviceRequest.service]
                        : conduit.backstage.serviceLayer[serviceRequest.service],
                        serviceReturnValue = service[serviceRequest.method](serviceRequest.data);
        }
        return serviceReturnValue;
    }

    function processAppData(appRawData) {
        try {
            var appData = $.extend({}, appRawData);
            // This is the right place to put it, after you extend data :)
            if (appRawData.appType === "CHAT") {
                $.extend(appData, appData.data.button);
                delete appData.data.button;
                appData.displayIcon = appData.buttonIconUrl;
                appData.displayText = appData.defaultButtonText;
                appData.data.data = { type: "POP_HTML", popHtml: { url: appData.data.defaultRoom.info.url} };
            }
            else if (appRawData.appType === "BUTTON" && appRawData.data.data && appRawData.data.data.type === "APPLICATION") {
                appData.appType = "APPLICATION_BUTTON";
            }
            if (appData.appType === "BROWSER_COMPONENT" && appData.data) {
                if (appData.data.appGuid == "1ec55dac-8dca-406b-9697-5d68893c1c0c") {
                    // this is the actual price gong app settings
                    appData.appType = "PRICE_GONG";
                    delete appData.data.url;
                    delete appData.data.htmlCompName;
                }

                var fixedHeigth;
                if (window.chrome || navigator.userAgent.indexOf("Firefox") != -1 || window.safari) {
                    fixedHeigth = (window.chrome || window.safari) ? 26 : 28 // for BC backward compitibility
                }
                else {
                    fixedHeigth = appData.data && appData.data.height;
                }
                if (appData.data) {
                    appData.data.originalHeight = appData.data.height;
                    appData.data.height = fixedHeigth;
                }
                if (appData.viewData && appData.viewData.embedded && appData.viewData.embedded.size) {
                    appData.viewData.embedded.size.originalHeight = appData.viewData.embedded.size.height;
                    appData.viewData.embedded.size.height = fixedHeigth;
                }
            }
            return appData;
        }
        catch (error) {
            absCommons.logging.logError({ errorMessage: "Error parsing app data.", errorObject: error });
        }
    }



    function fixParserError(strXml) {
        strXml = strXml.replace(/&apos;/g, "'");
        strXml = strXml.replace(/&amp;/g, "&");
        strXml = strXml.replace(/&/g, "&amp;");
        strXml = strXml.replace(/'/g, "&apos;");

        strXml = strXml.replace(/<!\[CDATA\[/g, "");
        strXml = strXml.replace(/\]\]>/g, "");


        return strXml;
    }

    function appXml2Json(appXmlData) {
        try {
            var $xml = $(appXmlData),
				appData, appType;

            if ($xml.length) {

                appType = $xml[0].tagName ? $xml[0].tagName : ($xml[0].firstChild.tagName ? $xml[0].firstChild.tagName : null);
                if (appType == null) {
                    appType = $xml[0].childNodes[1] ? $xml[0].childNodes[1].tagName : "";
                }

                appData = {
                    appType: appType,
                    appId: $xml.find("UNIQUE_COMP_ID:first").remove().text(),
                    displayText: $xml.find("DISPLAY_TEXT:first").remove().text(),
                    displayIcon: $xml.find("DISPLAY_ICON:first").remove().text(),
                    data: {
                        button: {
                            buttonIconUrl: $xml.find("BUTTON_ICON_URL:first").remove().text(),
                            buttonTooltip: $xml.find("BUTTON_TOOLTIP:first").remove().text(),
                            defaultButtonText: $xml.find("DEFAULT_BUTTON_TEXT:first").remove().text()
                        },
                        text: $xml.find("TEXT:first").remove().text() // workaround or external webapps place holder. otherwise it is parsed as an array
                    }
                };

                if ($xml.find("managed:first").length == 1) {
                    // we found managed node
                    var managed = {
                        managerId: $xml.find("managerId:first").remove().text(),
                        visible: $xml.find("visible:first").remove().text(),
                        blockEvents: $xml.find("blockEvents:first").remove().text()
                    };
                    appData.managed = managed;
                }

                // Dynamic menu:
                if (appData.appType === "DYNAMIC_MENU") {
                    appData.data.menu = parseMenu($xml.find("MENU:first").remove());
                }


                // Remove unneeded elements before the auto-conversion:
                $("LAST_UPDATE_TIME", appXmlData).remove();
                $("PERMISSIONS", appXmlData).remove();
                $("USER_ATTRIBUTES", appXmlData).remove();

                // I've modified xml2json plugin to accept a renaming function for properties:
                $.extend(true, appData, { data: $.xml2json($xml[0], false, xml2jsonOptions) });

                // This is the right place to put it, after you extend data :)
                if (appData.appType === "CHAT") {
                    $.extend(appData, appData.data.button);
                    delete appData.data.button;
                    appData.displayIcon = appData.buttonIconUrl;
                    appData.displayText = appData.defaultButtonText;
                    appData.data.data = { type: "POP_HTML", popHtml: { url: appData.data.defaultRoom.info.url} };

                }
                return appData;
            }
            else
                return;
        }
        catch (error) {
            absCommons.logging.logError({ errorMessage: "Error parsing app data.", errorObject: error });
        }
    }

    function parseMenu($menuXmlNode) {
        var items = [];


        $menuXmlNode.first().children("MENU_ITEM, SEPARATOR, MENU").each(function (i, node) {
            var nodeData;
            if (node.nodeName === "MENU") {
                nodeData = parseMenu($(node));
            } else {
                nodeData = appXml2Json(node)
            }
            items.push(nodeData);
            $(node).remove();
        });

        var iconUrl = $menuXmlNode.first().children("ICON_URL").remove().text();
        var caption = $menuXmlNode.first().children("CAPTION").text() || $menuXmlNode.first().children("CAPTION__").text() || $menuXmlNode.text();
        var object = { data: { items: items, iconUrl: iconUrl, caption: caption} };
        var result = appXml2Json($menuXmlNode[0]);

        return $.extend(true, {}, result, object);

    }

    function getXmlElement(name, value) {
        var xmlArr = ["<", name, ">"];

        xmlArr.push(encodeURIComponent(value));

        xmlArr.push(["</", name, ">"].join(""));
        return xmlArr.join("");
    }

    function json2Xml(elementName, obj) {
        var xmlArr = [];
        if (elementName) {
            xmlArr = [["<", elementName, ">"].join("")];
        }

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

        if (elementName) {
            xmlArr.push(["</", elementName, ">"].join(""));
        }
        return xmlArr.join("");
    }

    function getIconFromSettings(appData) {
        if (appData.data && appData.data.appView && appData.data.appView.images && appData.data.appView.images.size24px) {
            return appData.data.appView.images.size24px;
        }

        if (appData.appType == "MAIN_MENU" && appData.data && appData.data.path) {
            return appData.data.path;
        }

        if (appData.appType == "MULTI_RSS") {
            if (appData.data && appData.data.appGuid) {
                return ""; // we will take the icon from the metadata service.
            }
            // only for component
            return appData.button && appData.button.iconNormalUrl ? appData.button.iconNormalUrl : "";
        }

        if (appData.viewData && appData.viewData.icon) {
            return appData.viewData.icon;
        }
        if (appData.data && appData.data.buttonIconUrl) {
            return appData.data.buttonIconUrl;
        }
        if (appData.data && appData.data.buttonIcon) {
            return appData.data.buttonIcon;
        }
        if (appData.button && appData.button.buttonIconUrl) {
            return appData.button.buttonIconUrl;
        }
        if (appData.data && appData.data.button && appData.data.button.buttonIconUrl) {
            return appData.data.button.buttonIconUrl;
        }
        return "";
    }

    function getTextFromSettings(appData) {
        if (appData.appType == "WEATHER" || appData.appType == "TWITTER") {
            return "";
        }

        if (appData.viewData && appData.viewData.text) {
            return appData.viewData.text;
        }
        if (appData.data) {
            if (appData.data.caption) {
                return appData.data.caption;
            }
            if (appData.data.buttonText) {
                return appData.data.buttonText;
            }
            if (appData.data.defaultButtonText) {// for buttons
                return appData.data.defaultButtonText;
            }
        }
        if (appData.button && appData.button.defaultButtonText) {
            return appData.button.defaultButtonText;
        }

        return "";
    }

    function getTooltipFromSettings(appData) {
        if (appData.viewData && appData.viewData.tooltip) {
            return appData.viewData.tooltip;
        }
        if (appData.button && appData.button.buttonTooltip) {
            return appData.button.buttonTooltip;
        }
        if (appData.data) {
            if (appData.data.buttonTooltip) {
                return appData.data.buttonTooltip;
            }
            if (appData.data.tooltip) {//MAIN_MENU
                return appData.data.tooltip;
            }
        }
        return "";
    }

    function setViewData(appData) {

        appData.viewData = {
            icon: getIconFromSettings(appData),
            /* viewType: appData.pages && appData.pages.embedded ? "embedded" :
            ~["MAIN_MENU", "DYNAMIC_MENU", "XML_MENU", "EXTERNAL_COMPONENT"].indexOf(appData.appType)
            ? "menu" : "button",*/
            allowScroll: appData.allowScroll !== false,
            text: getTextFromSettings(appData), //TODO check why we cannot see tooltip of link_buttonItem apps
            tooltip: getTooltipFromSettings(appData)
        }

        if (appData.pages && appData.pages.embedded) {
            appData.viewData.viewType = "embedded";
        }
        else if (~["MAIN_MENU", "DYNAMIC_MENU", "XML_MENU", "EXTERNAL_COMPONENT"].indexOf(appData.appType)) {
            appData.viewData.viewType = "menu";
        }
        else if (appData.appType == "WEBAPP") {
            appData.viewData.viewType = "webapp";
        }
        else {
            appData.viewData.viewType = "button";
        }

        if (appData.appType == "WEBAPP" && appData.pages && !appData.pages.embedded) {
            appData.viewData.viewType = "button";
        }


        if (appData.appType === "SEPERATORITEM") // (spelling mistake in XML, what to do...)
            appData.viewData.viewType = "separator";

        // Webapp:
        if (appData.pages) {
            var webappPath;
            if (appData.appType == "WEBAPP") {
                webappPath = [resourcesBasePath, "\\webapps\\", appData.webappGuid + "_" + appData.version, "\\"].join("");
            }
            else {
                webappPath = [applicationLayerFolder, "wa/", appData.alias || appData.appType, "/"].join("");
            }

            if (appData.pages.embedded) {
                var url = webappPath + appData.pages.embedded;
                appData.viewData.embedded = $.extend({ url: url }, appData.embeddedSettings);
                if (appData.embeddedSettings)
                    delete appData.embeddedSettings;
            }

            if (appData.pages.popup) {
                var url = webappPath + appData.pages.popup;
                appData.popupData = $.extend({ url: url }, appData.popupSettings);
                if (appData.viewData.viewType === "button")
                    appData.viewData.method = "popup";
            }
        }


        if (appData.appType === "BROWSER_COMPONENT" && appData.data.url) {
            appData.viewData.viewType = "embedded";
            appData.viewData.embedded = {
                url: appData.data.url,
                size: { width: appData.data.width, height: appData.data.height, originalHeight: appData.data.originalHeight }
            };
        }
        if (appData.appType === "BUTTON" && appData.data.data && appData.data.data.type === "POP_HTML" && appData.data.data.popHtml) {
            appData.popupData = $.extend(appData.data.data.popHtml, {
                url: appData.data.data.popHtml.url,
                showFrame: true,
                allowScrollInFrame: { vScroll: false, hScroll: false }
            });
            if (appData.viewData.viewType === "button")
                appData.viewData.method = "popup";
        }

        //Chat code
        if (appData.appType === "CHAT") {
            appData.appType = "BUTTON";
            appData.appId = "CHAT";
            appData.popupData = $.extend(appData.data.data.popHtml, { url: appData.data.data.popHtml.url, showFrame: true, width: "550", height: "400" });
            if (appData.viewData.viewType === "button") {
                appData.viewData.method = "popup";
                appData.viewData.text = "";
            }
        }

        if (appData.viewData.viewType === "button" && !appData.viewData.method) {
            appData.viewData.method = "link";
            appData.linkData = { url: "", target: "TAB" };
            if (appData.data) {
                appData.linkData.url = appData.data.link || appData.data.buttonLink;
                appData.linkData.target = appData.data.target || "TAB";
            }
        }

        if (appData.viewData.viewType === "menu") {
            var hasButtonLink = !!(appData.button && appData.button.data);
            var hasLink = !(!appData.data.link && (!appData.data.data || !appData.data.data.link));
            if (!hasLink && !hasButtonLink) {
                appData.viewData.hasLink = false;
            } else {

                if (!hasButtonLink && appData.data.data) {
                    appData.linkData = {
                        url: appData.data.data.link.url || appData.data.buttonLink,
                        target: appData.data.data.link.target || "TAB"
                    };
                }
                else if (hasButtonLink) {
                    appData.linkData = {
                        url: appData.button.data.link.url,
                        target: appData.button.data.link.target || "TAB"
                    };
                }
                appData.viewData.hasLink = true;
            }
        }

        if (appData.appType === "LABEL")
            appData.viewData.viewType = "label";

        if (appData.appType === "EXTERNAL_COMPONENT") {

            appData.displayIcon = null;
            appData.displayText = null;
            appData.viewData.icon = null;
            appData.viewData.text = null;
            appData.viewData.isExternalComponent = true;
        }

        if (appData.appType === "RSS_FEED_ITEM") {

            if (!appData.displayIcon) {
                appData.displayIcon = appData.data && appData.data.iconNormalUrl ? appData.data.iconNormalUrl : null;
            }
            if (!appData.displayText) {
                appData.displayText = appData.data && appData.data.title ? appData.data.title : null;
            }
            if (!appData.viewData.icon) {
                appData.viewData.icon = appData.data && appData.data.iconNormalUrl ? appData.data.iconNormalUrl : appData.displayIcon; // TODO delete fallback when fixed in server
            }
            if (!appData.viewData.text) {
                appData.viewData.text = appData.data && appData.data.title ? appData.data.title : null;
            }
        }

        return appData;
    }



    function getToolbarBornServerTime() {
        if (!toolbarBornServerTime) {
            toolbarBornServerTime = absCommons.repository.getKey(ctid + ".toolbarBornServerTime");

            if (toolbarBornServerTime && !toolbarBornServerTime.status)
                toolbarBornServerTime = toolbarBornServerTime.result;
            else {
                toolbarBornServerTime = "";
            }
        }
        return toolbarBornServerTime;
    }

    function getToolbarCurrentServerTime() {
        if (!toolbarCurrentServerTime) {
            toolbarCurrentServerTime = absCommons.repository.getKey(ctid + ".toolbarCurrentServerTime");

            if (toolbarCurrentServerTime && !toolbarCurrentServerTime.status)
                toolbarCurrentServerTime = toolbarCurrentServerTime.result;
            else {
                toolbarCurrentServerTime = (new Date()).format("d-mm-yyyy");
                absCommons.repository.setKey(ctid + ".toolbarCurrentServerTime", toolbarCurrentServerTime);
            }
        }
        return toolbarCurrentServerTime;
    }

    //get toolbar age in days for usage
    function getToolbarAgeInDays() {
        var stringToTimestamp = function (strServerDate) {
            if (!strServerDate) return null;
            var arrDate = strServerDate.split("-");
            if (arrDate.length != 3) return null;

            var oDate = new Date();
            oDate.setDate(arrDate[0]);
            oDate.setMonth(parseInt(arrDate[1]) - 1);
            oDate.setFullYear(arrDate[2]);
            var iTimestamp = Date.parse(oDate.toDateString());
            return isNaN(iTimestamp) ? null : iTimestamp;
        };

        var strCreatedDate = getToolbarBornServerTime();
        var createdDate = stringToTimestamp(strCreatedDate);
        if (!createdDate) return -1;

        var strCurrentDate = getToolbarCurrentServerTime();
        var currentDate = stringToTimestamp(strCurrentDate);
        if (!currentDate) return -1;

        var milliseconds = currentDate - createdDate;
        var days = parseInt(milliseconds / (1000 * 60 * 60 * 24));

        return (isNaN(days)) ? -1 : days;
    }


    function addToInvokeQueue(httpRequestData) {
        invokeQueue.push(httpRequestData);
    }

    function getToolbarSettingsFeatureProtector() {
        var generalData;
        var featureProtectorSection;
        var featureProtector;
        try {
            generalData = conduit.backstage.serviceLayer.config.toolbarSettings.getGeneralData();
            featureProtectorSection = generalData && generalData.featureProtector ? generalData.featureProtector : null;
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
        }
        catch (e) {
            return;
        }
        return featureProtector;
    }
    // false means that we already have a parameter with this value from toolbar settings.
    // true means this parameter only exists in the login
    function compareFeatureProtectorValue(settingsFeatureProtector, parameterName, loginValue) {
        if (settingsFeatureProtector && settingsFeatureProtector[parameterName] && settingsFeatureProtector[parameterName] != loginValue) {
            return false;
        }
        return true;
    }

    function getFeatureProtectorParameterValue(name, fromLogin, searchProtectorData, featureProtector, settingsFeatureProtector) {
        var value = searchProtectorData[name];

        //featureProtector.dialogDelaySec && (!fromLogin || compareFeatureProtectorValue(settingsFeatureProtector, "dialogDelaySec", featureProtector.dialogDelaySec)) ? featureProtector.dialogDelaySec : searchProtectorData.dialogDelaySec;
        if (featureProtector[name]) {
            if (!fromLogin || compareFeatureProtectorValue(settingsFeatureProtector, name, featureProtector[name])) {
                value = featureProtector[name];
            }
        }

        return value;
    }
    // false means that the feature protector for the given type is disabled
    // true means that the feature protector for the given type is enabled
    function isToolbarSettingsFeatureProtectorEnabled(settingsFeatureProtector, type) {
        if (settingsFeatureProtector && settingsFeatureProtector[type] && settingsFeatureProtector[type].enabled == false) {
            return false;
        }
        return true;
    }
    function updateSearchProtector(featureProtectorSection, initializeSearchProtector, fromLogin, forceInit) {

        try {
            if (!isChrome && (!searchProtectorUpgraded || forceInit)) {
                var getUpgradeStatusResult = conduit.abstractionlayer.backstage.system.getUpgradeStatus();
                if (getUpgradeStatusResult && !getUpgradeStatusResult.status && getUpgradeStatusResult.result) {
                    // after upgrade
                    searchProtectorData = null;
                    searchProtectorUpgraded = true;
                    initializeSearchProtector = true;
                    if (!fromLogin) {
                        conduit.coreLibs.repository.removeLocalData("searchProtectorData", true);
                    }
                }
            }
            //this should only happen at the first login.

            conduit.coreLibs.repository.getLocalData("searchProtectorData", function (res) {

                var searchProtectorData = res;
                var browserVersion = browserInfo.version.match(/^(\d+)/)[1];
                var featureProtector = {};

                var homePageProtectorEnabled = true;
                var browserSearchProtectorEnabled = true;

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

                if (!searchProtectorData) {
                    searchProtectorData = { browserSearch: { enabled: true }, homepage: { enabled: true} };
                    if (fromLogin) {
                        // this should not happen. the searchProtectorData must be ready in the first time dialog before first login;
                        searchProtectorData.homepageUrlFromSettings = absCommons.repository.getKey('Smartbar.ConduitHomepagesList');
                        searchProtectorData.searchAddressUrlFromSettings = absCommons.repository.getKey('Smartbar.ConduitSearchUrlList');
                        searchProtectorData.searchAddressUrlFromSettings = absCommons.repository.getKey('Smartbar.ConduitSearchEngineList');
                    }
                }
                var settingsFeatureProtector = fromLogin ? getToolbarSettingsFeatureProtector() : null;

                searchProtectorData.dialogDelaySec = getFeatureProtectorParameterValue("dialogDelaySec", fromLogin, searchProtectorData, featureProtector, settingsFeatureProtector);  // wait time between protectors
                searchProtectorData.aggressiveTakeoverWindowSec = getFeatureProtectorParameterValue("aggressiveTakeoverWindowSec", fromLogin, searchProtectorData, featureProtector, settingsFeatureProtector);
                searchProtectorData.preventDialogDisplayTime = getFeatureProtectorParameterValue("preventDialogDisplayTime", fromLogin, searchProtectorData, featureProtector, settingsFeatureProtector); // wait interval between protector dialog
                // if showDialogPolicy was changed by user from the toolbar options, do not override it.
                conduit.coreLibs.repository.getLocalData("searchProtector.showDialogPolicy", function (res) {
                    var showDialogPolicy = res;
                    if (!(showDialogPolicy && showDialogPolicy.data)) {
                        searchProtectorData.showDialogPolicy = getFeatureProtectorParameterValue("showDialogPolicy", fromLogin, searchProtectorData, featureProtector, settingsFeatureProtector); // everytime or periodically    
                    }

                    // check if we failed to protect the search. if so, do not enable the protector anymore.
                    if (searchProtectorData.browserSearch.protectionFailed) {
                        browserSearchProtectorEnabled = false;
                    }
                    // check if we failed to protect the homepage. if so, do not enable the protector anymore.
                    if (searchProtectorData.homepage.protectionFailed) {
                        homePageProtectorEnabled = false;
                    }

                    // if we get an enabled == false from settings or login, we disable the protector
                    // if we get true from login, make sure we did not get false from the settings.
                    // once the protector is disabled, we cannot enable it again, cause we do not know what caused it to be disabled (user,competitor, settings,login)
                    if (browserSearchProtectorEnabled && featureProtector.browserSearch) {
                        if (featureProtector.browserSearch.enabled == false || searchProtectorData.browserSearch.enabled == false) {
                            browserSearchProtectorEnabled = false;
                        }
                        else {
                            browserSearchProtectorEnabled = fromLogin ? isToolbarSettingsFeatureProtectorEnabled(settingsFeatureProtector, "browserSearch") : true;
                        }

                        searchProtectorData.browserSearch.maxProtectionCount = getFeatureProtectorParameterValue("maxProtectionCount", fromLogin, searchProtectorData.browserSearch, featureProtector.browserSearch, settingsFeatureProtector && settingsFeatureProtector.browserSearch);
                    }

                    // if we get an enabled == false from settings or login, we disable the protector
                    // if we get true from login, make sure we did not get false from the settings.
                    // once the protector is disabled, we cannot enable it again, cause we do not know what caused it to be disabled (user,competitor, settings,login)
                    if (homePageProtectorEnabled && featureProtector.homepage) {
                        if (featureProtector.homepage.enabled == false || searchProtectorData.homepage.enabled == false) {
                            homePageProtectorEnabled = false;
                        }
                        else {
                            homePageProtectorEnabled = fromLogin ? isToolbarSettingsFeatureProtectorEnabled(settingsFeatureProtector, "homepage") : true;
                        }
                        searchProtectorData.homepage.maxProtectionCount = getFeatureProtectorParameterValue("maxProtectionCount", fromLogin, searchProtectorData.homepage, featureProtector.homepage, settingsFeatureProtector && settingsFeatureProtector.homepage);
                    }



                    if (browserSearchProtectorEnabled == false || searchProtectorData.searchProviderSelectedByUser == false) {
                        // only if the current browserSearchProtector is enabled and the login response decided to disable it, we will disable it
                        searchProtectorData.browserSearch.enabled = false;
                        // do not start the protector;
                    }

                    if (homePageProtectorEnabled == false || searchProtectorData.homepageSelectedByUser == false) {
                        // only if the current browserSearchProtector is enabled and the login response decided to disable it, we will disable it
                        searchProtectorData.homepage.enabled = false;
                        // do not start the protector;
                    }

                    if (fromLogin) {
                        if (initializeSearchProtector || (!searchProtectorUpgraded && !searchProtectorData.initialized)) {
                            searchProtectorData.initialized = true;
                            initializeSearchProtector = true;
                        }
                    }


                    if (initializeSearchProtector) {
                        conduit.coreLibs.repository.setLocalData("searchProtectorData", searchProtectorData, true, function () { });
                        if (fromLogin) {
                            conduit.triggerEvent("onSearchProtectorInit", searchProtectorData);
                        }
                    }
                    else {
                        conduit.triggerEvent("onSearchProtectorDataUpdate", searchProtectorData);
                    }
                });
            });


        }
        catch (e) {
            logger.logError("Failed to updateSearchProtector", { className: "commons", functionName: "updateSearchProtector" }, { error: e });
        }
    }

    function convertJsonString2Boolean(data) {
        if (!data) {
            return data;
        }
        if (typeof data == "string") {
            if (/false/i.test(data)) {
                return false;
            }
            else if (/true/i.test(data)) {
                return true;
            }
            else {
                return data;
            }
        }


        /* using inArray to overcome chrome instanceof Array issue*/
        var newObj = (data instanceof Array || (Array.isArray && Array.isArray(data))) ? [] : {};
        for (i in data) {
            newObj[i] = convertJsonString2Boolean(data[i]);
        }
        return newObj;

    }



    return {
        xml2jsonOptions: xml2jsonOptions,
        convertJsonString2Boolean: convertJsonString2Boolean,
        appXml2Json: appXml2Json,
        fixParserError: fixParserError,
        getToolbarBornServerTime: getToolbarBornServerTime,
        getToolbarCurrentServerTime: getToolbarCurrentServerTime,
        getToolbarAgeInDays: getToolbarAgeInDays,
        // Maps an app XML to json:
        processAppData: processAppData,
        json2Xml: json2Xml,
        setViewData: setViewData,
        addToInvokeQueue: addToInvokeQueue,
        updateSearchProtector: updateSearchProtector,
        switchServicesMode: switchServicesMode
    };
})());
conduit.register("backstage.serviceLayer.serviceInvoker", function (callback) {
    //each service will be mapped in this object,
    //key -> service's url, value -> serviceData.
    var requests = {},
	logger = conduit.coreLibs.logger,
	undefined;


    // Starts a service.
    // serviceData: { 
    //      url: The URL of the service to get,
    //      [callback]: (function) A function to call when data is received from the service.
    //      [nextUpdate=0]: (number) The amount, in milliseconds, to wait before running the service for the first time.
    //      [runNow=true]: (boolean) Set this to false if the service should run only after the interval, not when it's added.
    //      [manualInvoke=false]: (boolean) If set to true, the service doesn't run in set intervals, but only manually.
    //      [onInitInvoke]: (function) An optional function to call just before invoking the service.
    //      [onCompleteInvoke]: (function) An optional function to call after successfully invoking the service.
    //      [dataType]: (string) the type of the data return in the http request. passed as Content-Type to the http request header.
    //      [headers]: (array) http requests headers in an array. for example - [{ name: "Content-Type", value: "xml"}]
    //      [extraData]: (json) extra parameter that will be passed to the callback function.
    //      [cbFail]: (function) A function to call when error occurred while sending or receiving data.
    //      [errorInterval]: (number) The amount, in milliseconds, to wait before running the service after it failed.
    //	    [retryIterations]: (number) The number of iterations of invoking the service in case of an error. 
    //      [ignoreSetRawData] (boolean) Avoid setting the raw data of a service. The service can handle it itself. [optional]
    //      [enabledInHidden] (boolean) invoke the service even in hidden mode
    this.addService = function (serviceData) {
        if (requests[serviceData.url]) {
            clearInterval(requests[serviceData.url].intervalId);
        }

        if (serviceData.interval !== undefined && (isNaN(serviceData.interval) || typeof (serviceData.interval) !== "number" || serviceData.interval <= 0)) {
            throw new TypeError("serviceInvoker.addService error - invalid value for serviceData.interval, expected a positive number.");
        }

        if (serviceData.onInitInvoke)
            serviceData.onInitInvoke.call(serviceData);

        //attach public methods to the service object.
        serviceData.invoke = function (data, runNow, extraData) {

            var headers = serviceData.dataType ? { headers: [{ name: "Content-Type", value: serviceData.dataType}]} : "";
            var url = conduit.coreLibs.aliasesManager.replaceAliases(serviceData.url);

            if (serviceData.headers instanceof Array) {
                if (headers) {
                    for (var i = 0; i < serviceData.headers.length; i++) {
                        var newHeader = serviceData.headers[i];
                        headers.headers.push(newHeader);
                    }
                }
                else {
                    headers = { 'headers': serviceData.headers };
                }
            }

            headers = headers ? JSON.stringify(headers) : headers;

            function proceed() {
                if (data && serviceData.method !== "POST") {
                    var urlParams = [];
                    for (param in data) {
                        urlParams.push(param + "=" + data[param]);
                    }
                    if (urlParams.length)
                        url += (~url.indexOf("?") ? "&" : "?") + urlParams.join("&");

                    data = JSON.stringify(data);
                }

                function validateResponse(data, serviceData) {
                    var message;
                    var errorObject;

                    if (!data) {
                        message = "Missing data in Http response for service: " + serviceData.name + ", with url: " + serviceData.url;
                        errorObject = { 'serviceData': serviceData, 'description': message, 'status': logger.getCodeByServiceName(serviceData.name), 'name': serviceData.name, 'url': serviceData.url };
                        invokeError(errorObject);
                        return false;
                    }

                    if (data.status) {
                        message = "Http error message: " + data.description + ", Error status: " + data.status + " for service: " + serviceData.name + ", with url: " + serviceData.url;
                        errorObject = { 'serviceData': serviceData, 'description': message, 'status': logger.getCodeByServiceName(serviceData.name), 'name': serviceData.name, 'url': serviceData.url };
                        invokeError(errorObject);
                        return false;
                    }

                    // check error codes, we failed if we get 4xx or 5xx
                    if (/^4/.test(data.result.responseCode) || /^5/.test(data.result.responseCode)) {
                        var dataFromServer = "";
                        if (data.result.responseData) {
                            dataFromServer = conduit.coreLibs.logger.getStringValuePrefix(data.result.responseData);
                        }
                        message = "Error Http response code: " + data.result.responseCode + " for service: " + serviceData.name + ", with url: " + serviceData.url + ". The first characters of the response data: " + dataFromServer;
                        errorObject = { 'serviceData': serviceData, 'description': message, 'status': logger.getCodeByServiceName(serviceData.name), 'name': serviceData.name, 'url': serviceData.url, 'responseData': data.result.responseData };
                        invokeError(errorObject);
                        return false;
                    }


                    return true;
                }


                function doHttpRequest() {
                    var httpResponseHandler = function (data) {

                        if (validateResponse(data, serviceData)) {

                            var result = data.result;
                            var interval = serviceData.interval;
                            var url = conduit.coreLibs.aliasesManager.replaceAliases(serviceData.url);
                            var returnValue = { data: result.responseData, url: url, extraData: extraData };

                            invokeCallback(serviceData, returnValue, interval, extraData);
                        }
                    }

                    if (conduit.abstractionlayer.backstage.browser.isHidden().result && !serviceData.enabledInHidden) {
                        conduit.backstage.serviceLayer.commons.addToInvokeQueue({ url: url, serviceDataMethod: serviceData.method || "GET", data: data || "", headers: headers, cb: httpResponseHandler });
                        return;
                    }


                    if (serviceData.method === "POST" && data === undefined) {
                        // do not invoke the request of we have post with no data!
                        setServiceTimout(serviceData.interval);
                        return;
                    }

                    conduit.abstractionlayer.commons.http.httpRequest(url, serviceData.method || "GET", data || "", headers, "", "", null, httpResponseHandler);
                }

                if (runNow !== false)
                    doHttpRequest();
                else
                    serviceData.timeoutId = setTimeout(doHttpRequest, serviceData.interval);
            }

            if (!data) {
                if (serviceData.getData) {
                    if (!serviceData.getAsyncData) {
                        data = serviceData.getData();
                        proceed();
                    }
                    else {
                        serviceData.getData(function (returnedData) {
                            data = returnedData;
                            return proceed();
                        });
                    }
                }
                else {
                    data = serviceData.data;
                    proceed();
                }
            }
            else
                proceed();
        };


        function invokeError(errorObject) {
            var serviceData = errorObject.serviceData,
                description = errorObject.description,
                status = errorObject.status,
                extraData = errorObject.extraData,
                responseData = errorObject.responseData,
                error = errorObject.error,
                name = errorObject.name,
                url = errorObject.url;

            logger.logError(description, { className: "ServiceInvoker", functionName: "invokeError" }, { code: status, error: error, reportToServer: true, name: name, url: url });

            var interval = serviceData.interval;
            conduit.backstage.serviceLayer.serviceDataManager.getData(serviceData.name,function(data){
                if (!data) {
                    // only if there is no cached data for this service we will start an error mode.
                    //Decide how to treat errors according to the policy. Used for creating the interval after error.
                    interval = calculateErrorInterval(serviceData);
                }
                var responseData = responseData ? responseData : "";
                var extraData = extraData ? extraData : "";
                var returnValue = { responseData: responseData, url: serviceData.url, extraData: extraData, description: description, status: status };
                invokeCallback(serviceData, returnValue, interval, extraData);
           });
       }
        /*
        If retryIterations and errorInterval is specified, we will return the error interval until the number of iterations is over.
        */
        function calculateErrorInterval(serviceData) {
            var interval = serviceData.interval;
            if (serviceData.errorInterval) {
                if (serviceData.retryIterations !== undefined) {
                    if (serviceData.errorIteration === undefined) {
                        serviceData.errorIteration = 1;
                        return serviceData.errorInterval;
                    }
                    serviceData.errorIteration = serviceData.errorIteration && (serviceData.errorIteration < serviceData.retryIterations) ? serviceData.errorIteration + 1 : undefined;
                    if (serviceData.errorIteration) {
                        interval = serviceData.errorInterval;
                    }
                }
            }
            return interval;
        }

        function invokeCallback(serviceData, returnValue, interval, extraData) {
            var callback = serviceData.callback || callback;

            if (serviceData.onCompleteInvoke)
                serviceData.onCompleteInvoke.call(serviceData);

            var callbackReturnValue = callback.call(serviceData, returnValue);
            if (callbackReturnValue) {
                if (callbackReturnValue.serviceUpdateFailed) {
                    var errorData = callbackReturnValue.errorData;
                    var errorObject = { 'serviceData': serviceData, 'description': errorData.description, 'status': errorData.status, 'name': serviceData.name, 'url': serviceData.url, 'extraData': extraData, 'error': errorData.error };
                    invokeError(errorObject);
                    return;
                }
                if (callbackReturnValue.stopService) {
                    logger.logDebug('stopping service: ' + serviceData.name, { className: "serviceInvoker", functionName: "invokeCallback" });
                    return; //In case service callback returns a flag to stop the service, don't set new timeout
                }
            }

            setServiceTimout(interval);
        }

        function setServiceTimout(interval) {
            // The service can be invoked once, if the manualInvoke parameter is true:
            if (!serviceData.manualInvoke) {
                if (serviceData.timeoutId) {
                    clearTimeout(serviceData.timeoutId);
                    serviceData.timeoutId = null;
                }
                //this enables us to know if this is the service first load or update
                if (!serviceData.extraData) {
                    serviceData.extraData = {};
                }
                serviceData.extraData.update = true;
                serviceData.timeoutId = setTimeout(function () { serviceData.invoke(null, true, serviceData.extraData); }, interval);

            }
        }

        //attach public methods to the service object.
        serviceData.stop = function () {
            if (serviceData.timeoutId) {
                clearTimeout(serviceData.timeoutId);
                serviceData.timeoutId = null;
            }
        }
        serviceData.start = function (runNow, extraData) {
            if (serviceData.manualInvoke) {
                serviceData.manualInvoke = false;
            }
            if (!extraData) {
                extraData = {};
            }
            $.extend(true, extraData, serviceData.extraData); //add the service extra data to the extra data input
            serviceData.invoke(null, runNow, extraData);
        }
        serviceData.init = function () {

            if (!serviceData.manualInvoke)
                serviceData.timeoutId = setTimeout(function () { serviceData.invoke(null, true, serviceData.extraData); }, serviceData.nextUpdate || (serviceData.runNow !== false ? 0 : serviceData.interval));
        };

        requests[serviceData.url] = serviceData;

        return serviceData;
    };
    this.invokeService = function (serviceUrl) {
        var currentServiceData = requests[serviceUrl];
        if (currentServiceData) {
            currentServiceData.invoke(null, true, currentServiceData.extraData);
        }

    };
    this.stopService = function (serviceUrl) {
        if (requests[serviceUrl]) {
            requests[serviceUrl].stop();
        }
    };
    this.startService = function (serviceUrl) {
        if (requests[serviceUrl]) {
            requests[serviceUrl].start();
        }
    };
});

// Manages data for services (duhh)
// Uses the repository to load from cache data used by services and save data returned from services
// to enable caching of services data.
conduit.register("backstage.serviceLayer.serviceDataManager", (function () {
    var serviceInvoker = new conduit.backstage.serviceLayer.serviceInvoker(),
    serviceInvokeGraceTime = 1, // Grace time of 2 min 
    ctid = conduit.abstractionlayer.commons.context.getCTID().result,
    toolbarVersion = conduit.abstractionlayer.commons.environment.getEngineVersion().result,
	logger = conduit.coreLibs.logger;

    function getRepositoryKeyName(serviceName, isRawData, isOldName) {
        if (isOldName) {
            // for previous SB versions that do not contain raw data and toolbar version in the file name 
            // and we still nee to get their old data. (like user apps)
            return ctid + ".serviceLayer_services_" + serviceName;
        }
        return ctid + "_" + (isRawData ? "RAW" : toolbarVersion) + ".serviceLayer_services_" + serviceName;
    }

    function getLastUpdateKeyName(serviceData) {
        var serviceName = serviceData.name + (serviceData.interval_name || "");
        if (serviceData.versionDepended) {
            serviceName += "_" + toolbarVersion;
        }
        return ctid + ".serviceLayer_services_" + serviceName + "_lastUpdate";
    }

    function writeServiceData(serviceData, data, saveLastUpdate, rawData) {
        if (saveLastUpdate) {
            data.lastUpdate = (new Date()).valueOf();
            data.lastUpdateSuccess = true;
        }

        try {

            var serviceName = serviceData.cachedServiceName ? serviceData.cachedServiceName : serviceData.name;
            conduit.coreLibs.repository.setData(getRepositoryKeyName(serviceName), data, function () { });
            if (!serviceData.ignoreSetRawData && rawData) {
                conduit.coreLibs.repository.setData(getRepositoryKeyName(serviceName, true), rawData, function () { });
            }
            var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
            if (/Chrome/i.test(browserInfo.type)) {
                var isHostConnected = conduit.abstractionlayer.backstage.nmWrapper.getHostState();
                if (isHostConnected != "stateConnected") {
                    var dataType = typeof (data);
                    localStorage.setItem(getRepositoryKeyName(serviceName), escape(JSON.stringify({ dataType: dataType, data: data })));
                    dataType = typeof (rawData);
                    localStorage.setItem(getRepositoryKeyName(serviceName, true), escape(JSON.stringify({ dataType: dataType, data: rawData })));
                }
            }
        }
        catch (error) {
            logger.logError("Error adding service: " + serviceName, { className: "serviceDataManager", functionName: "writeServiceData" }, { error: error, code: logger.StorageCodes.FAILED_SET_TO_STORAGE });
        }
    }


    // serviceData: { 
    //      [name]: (string) The cache file name to write.
    //      [cachedServiceName]: (string) If defined the service will write to this file name regardless of the name property.
    //      [url]: (string) The URL of the service to get,
    //      [callback]: (function) A function to call when data is received from the service.
    //      [interval]: (number) The amount, in milliseconds, to wait before running the service for the first time.
    //      [runNow]: (boolean) Set this to false if the service should run only after the interval, not when it's added.
    //      [manualInvoke=false]: (boolean) If set to true, the service doesn't run in set intervals, but only manually.
    //      [onInitInvoke]: (function) An optional function to call just before invoking the service.
    //      [onCompleteInvoke]: (function) An optional function to call after successfully invoking the service.
    //      [dataType]: (string) the type of the data return in the http request. passed as Content-Type to the http request header.
    //      [headers]: (array) http requests headers in an array. for example - [{ name: "Content-Type", value: "xml"}]
    //      [extraData]: (json) extra parameter that will be passed to the callback function
    //      [cbFail]: (function) A function to call when error occurred while sending or receiving data.
    //      [errorInterval]: (number) The amount, in milliseconds, to wait before running the service after it failed.
    //	    [retryIterations]: (number) The number of iterations of invoking the service in case of an error.
    //      [ignoreSetRawData] (boolean) Avoid setting the raw data of a service. The service can handle it itself. [optional]
    //      [enabledInHidden] (boolean) invoke the service even in hidden mode
    function addService(serviceData, addServiceCllback) {
        var serviceFileName = getRepositoryKeyName(serviceData.name);
        var serviceFileNameRaw = getRepositoryKeyName(serviceData.name, true);
        conduit.abstractionlayer.commons.repository.getFiles(false, [serviceFileName, serviceFileNameRaw], function (resultObj) {
            var fileObj = {};
            if (resultObj && resultObj.status == 0) {
                try {
                    fileObj = JSON.parse(resultObj.result);
                } catch (e) {
                    console.error("error in Parsing ::: serviceDataManager -> add service -> getFile Method");
                }
            }

            var originalCallback = serviceData.callback;
            var originalCBFail = serviceData.cbFail;
            var repositoryData = conduit.coreLibs.repository.handleDataFromGetFiles(fileObj[serviceFileName]);
            var rawRepositoryData = serviceData.ignoreGetRawData ? false : conduit.coreLibs.repository.handleDataFromGetFiles(fileObj[serviceFileNameRaw]);
            var lastUpdateData = conduit.abstractionlayer.commons.repository.getKey(getLastUpdateKeyName(serviceData));
            var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
            if (/Chrome/i.test(browserInfo.type)) {
                var isHostConnected = conduit.abstractionlayer.backstage.nmWrapper.getHostState();
                if (isHostConnected != "stateConnected") {
                    repositoryData = conduit.coreLibs.repository.handleDataFromGetFiles(localStorage.getItem(serviceFileName));
                    rawRepositoryData = conduit.coreLibs.repository.handleDataFromGetFiles(localStorage.getItem(serviceFileNameRaw));
                }
            }
            serviceData.callback = function (returnValue) {
                try {
                    if (returnValue.data) {
                        if (originalCallback) {
                            var processedData = { data: originalCallback.call(this, returnValue.data, false, returnValue.extraData) };
                            if (processedData && processedData.data && (processedData.data.serviceUpdateFailed || processedData.data.stopService)) {
                                // we failed to update the service. we will not save any info to the cache file and we will invoke the error mode.
                                return processedData.data;
                            }
                            writeServiceData(serviceData, processedData, true, returnValue.data);
                        }
                    }
                    else {
                        if (originalCBFail) {
                            originalCBFail.call(this, returnValue);
                        }
                    }
                }
                catch (error) {
                    var description = "Error calling service callback. Service name: " + serviceData.name;
                    return { serviceUpdateFailed: true, errorData: { description: description, status: logger.getCodeByServiceName(serviceData.name), error: error} }
                }
            }

            serviceData.onCompleteInvoke = function () {
                conduit.abstractionlayer.commons.repository.setKey(getLastUpdateKeyName(serviceData), (new Date()).valueOf().toString());
            };

            try {

                //we just pass the serviceData object to the serviceInvoker
                //which add some methods to the serviceData object. 
                var service = serviceInvoker.addService(serviceData);

                service.updateData = function (data) {
                    writeServiceData(serviceData, { data: data });
                }

                if (((repositoryData && repositoryData.data) || serviceData.isWithCache) && lastUpdateData && lastUpdateData.result && lastUpdateData.status === 0) {

                    var now = new Date();

                    if (originalCallback && repositoryData && repositoryData.data && !(serviceData.extraData && serviceData.extraData.update)) {
                        // If there's data in the repository, run the callback with the preprocessed data:
                        originalCallback.call(service, repositoryData.data, true, serviceData.extraData);
                    }

                    // Then set the service's next update for when it's due, or the grace time, if the update time is overdue:				                
                    serviceData.nextUpdate = calculateNextUpdateTime(serviceData, lastUpdateData);
                }
                else if (rawRepositoryData) {
                    var processedData;
                    if (originalCallback) {
                        if (!serviceData.extraData) {
                            serviceData.extraData = {};
                        }
                        serviceData.extraData.isRawData = true;
                        processedData = { data: originalCallback.call(service, rawRepositoryData, false, serviceData.extraData) };
                    }
                    if (processedData && processedData.data && processedData.data.serviceUpdateFailed) {
                        // we failed to update the service. we will not save any info to the cache file and we will invoke the error mode.
                        return processedData.data;
                    }
                    writeServiceData(serviceData, processedData, true);
                    serviceData.nextUpdate = calculateNextUpdateTime(serviceData, lastUpdateData);
                }
                else // if no data found in the repository, run the service immediately:
                    serviceData.nextUpdate = 0;

                service.init();
            }
            catch (error) {
                logger.logError("Failed to add service: " + serviceData.name, { className: "serviceDataManager", functionName: "addService" }, { code: logger.getCodeByServiceName(serviceData.name), error: error });
            }
            if (addServiceCllback) {
                addServiceCllback(service);
            }
        });

    }

    function calculateNextUpdateTime(serviceData, lastUpdateData) {
        var now = new Date();

        if (serviceData.interval === undefined) {
            return serviceInvokeGraceTime;
        }
        if (!isPositiveNumber(serviceData.interval)) {
            throw new TypeError("serviceInvoker.addService error - invalid value for serviceData.interval, expected a positive number.");
        }

        var lastUpdateTime = 0;
        if (lastUpdateData && lastUpdateData.result && isPositiveNumber(Number(lastUpdateData.result))) {
            lastUpdateTime = Number(lastUpdateData.result);
        }

        return Math.max(serviceInvokeGraceTime, serviceData.interval - (now.valueOf() - lastUpdateTime));
    }

    function isPositiveNumber(number) {
        if (isNaN(number) || typeof (number) !== "number" || number <= 0) {
            return false;
        }
        return true;
    }

    //update the service with the new data and run it.
    function update(service, data, runNow, extraData) {
        $.extend(true, service, data);
        service.stop();
        if (typeof (runNow) !== 'undefined') {
            service.start(runNow, extraData);
        }
        else {
            service.start(null, extraData);
        }

    }

    conduit.subscribe("serviceDataManager.requests", function (data) {
        try {
            if (data && data.method) {
                switch (data.method) {
                    case "addService":
                        if (data.serviceData) {
                            addService(data.serviceData);
                            if (data.callback) {
                                data.callback({ result: true, status: 0, description: "" });
                            }
                        }
                        break;
                }
            }
        }
        catch (e) {
            if (data && data.callback) {
                data.callback({ result: "", status: 100, description: "Failed to invoke serviceDataManager.requests method " + e.message });
            }
        }
    });

    return {
        addService: addService,
        invokeService: serviceInvoker.invokeService,
        getData: function (serviceName, callback) {
            conduit.coreLibs.repository.getData(getRepositoryKeyName(serviceName), function (rawData) {
                if (callback) {
                    callback(rawData ? rawData.data : undefined);
                }
            });

        },
        update: update,
        getRepositoryKeyName: getRepositoryKeyName,
        stopService: function (serviceUrl) {
            serviceInvoker.stopService(serviceUrl);
        },
        removeLastUpdateKey: function (serviceData) {
            conduit.abstractionlayer.commons.repository.removeKey(getLastUpdateKeyName(serviceData));
        },
        removeService: function (serviceName) {
            conduit.abstractionlayer.commons.repository.removeData(getRepositoryKeyName(serviceName), function () { });
            conduit.abstractionlayer.commons.repository.removeData(getRepositoryKeyName(serviceName, true), function () { });
        }
    };
})());
﻿conduit.register("backstage.serviceLayer.login", (function () {
    var self = this;
    var serviceName = "login";
    var downloadRefData;
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
    var toolbarName = conduit.abstractionlayer.commons.context.getToolbarName().result;
    var toolbarVersion = conduit.abstractionlayer.commons.environment.getEngineVersion().result;
    var absRepository = conduit.abstractionlayer.commons.repository;
    var isFirstLogin;
    var loginCount;
    var downloadCookieName = "DownloadRef";
    var readCookies = conduit.abstractionlayer.backstage.browserData.readCookies;
    var writeCookie = conduit.abstractionlayer.backstage.browserData.writeCookie;
    var xml2jsonOptions = conduit.backstage.serviceLayer.commons.xml2jsonOptions;
    var serviceLayer = conduit.backstage.serviceLayer;
    var loginData;
    var messages = conduit.abstractionlayer.commons.messages;
    var business = conduit.abstractionlayer.backstage.business;
    var toolbarGrouping = conduit.backstage.serviceLayer.toolbarGrouping;
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
    var isFF = /Firefox/i.test(browserInfo.type);
    var isIE = /IE/i.test(browserInfo.type);
    var isChrome = /Chrome/i.test(browserInfo.type);
    var logger = conduit.coreLibs.logger;
    var clone = conduit.utils.general.clone;
    var activeCTIDKey = absRepository.getKey(ctid + ".activeCTID").result;
    var activeCTID = activeCTIDKey ? activeCTIDKey : ctid; //if active CT ID exist in repository, use it otherwise, use the original CTID
    var activeCTNameKey = absRepository.getKey(ctid + ".activeCTName").result;
    var activeCTName = activeCTNameKey ? activeCTNameKey : toolbarName;
    var branchingTestGroupKey = absRepository.getKey(ctid + ".branchingTestGroup").result;
    var branchingTestGroup = branchingTestGroupKey ? branchingTestGroupKey : "";
    var pluginReady = false;
    var time;
    var loginInitialized = false;
    var InstallationTypes =
        {
            UnknownIntegration: "UnknownIntegration",
            UnknownInstallation: "Unknown",
            DirectDownload: "DirectDownload"
        };
    var installationType = InstallationTypes.UnknownInstallation;
    var workingAppsWhenHidden;


    function checkIsFirstLogin(callback) {
        try {
                absRepository.hasData(ctid + ".serviceLayer_services_" + serviceName,function(resObj){
                    var hasLoginData = resObj.result;
                    if (hasLoginData && !/false/i.test(hasLoginData)) {
                        // this is for SB backward compatibility. if we have login data, this is obviously not the first login.
                        setIsFirstLoginInvoked();
                        callback(false);
			            return;
                    }
                    conduit.coreLibs.repository.getLocalData("serviceLayer_service_login_isFirstLoginInvoked",function(response){
	                    if (response) {
	                        // the first login was invoked
	                        callback(false);
				            return;
	                    }
	                    callback(true);
                });
            });
        }
        catch (e) {
            callback(true)
        }
    }

    function setIsFirstLoginInvoked() {
        conduit.coreLibs.repository.setLocalData("serviceLayer_service_login_isFirstLoginInvoked", true,function(){});
    }

    function getLoginCount(callback) {
        var count = 1;
        conduit.coreLibs.repository.getLocalData("serviceLayer_service_login_loginCount",function(loginCountValue){
            if (loginCountValue && loginCountValue.data) {
                loginCountValue = parseInt(loginCountValue.data);
                if (loginCountValue > 0) {
                    count = loginCountValue;
                }
            }
            callback(count);
        });
    }

    function incrementLoginCount() {
         var loginCount;
         getLoginCount(function(res){
             loginCount=res+1;
            if (loginCount < 5) {
                conduit.coreLibs.repository.setLocalData("serviceLayer_service_login_loginCount", loginCount);
            }
        });
    }

    function handleFeatureProtectorData(forceInit) {
        try {
            //this should only happen at the first login.
           conduit.coreLibs.repository.getLocalData("searchProtectorData",function(searchProtectorData){
                var initializeSearchProtector = isFirstLogin;

                if (!isChrome && !isFirstLogin && !searchProtectorData) {
                    // this is not the first login and the searchProtectorData was not initialized, 
                    // we will report it and initialize it as fallback.
                    var message = "Search Protector was not initialized after first login";
                    logger.logError(message, { className: "login", functionName: "handleFeatureProtectorData" }, { code: logger.GeneralCodes.SP_WAS_NOT_INITIALIZED, reportToServer: true, name: serviceName });
                    initializeSearchProtector = true;
                }

                var featureProtectorSection = loginData && loginData.featureProtector ? loginData.featureProtector : null;
                serviceLayer.commons.updateSearchProtector(featureProtectorSection, initializeSearchProtector, true, forceInit);
            });
        }
        catch (e) {
            logger.logError("Failed to handleFeatureProtectorData", { className: "login", functionName: "handleFeatureProtectorData" }, { error: e, name: serviceName });
        }
    }

    function createSearchProtectorXMLData(loginXml,callback) {
        try {
            if (isFF || isIE) {
                var returnValue = absRepository.getKey(ctid + ".SendProtectorDataViaLogin");
                // If the property is not defined or true, we will send the data
                var missingKey = returnValue.status ? true : false;
                var sendProtectorDataViaLogin = (!returnValue.status && returnValue.result) ? true : false;
                if (missingKey || sendProtectorDataViaLogin) {
                   conduit.coreLibs.repository.getLocalData("searchProtectorData",function(searchProtectorData){
                    if (searchProtectorData) {
                        var homePageProtectorEnabled = true;
                        var browserSearchProtectorEnabled = true;

                        browserSearchProtectorEnabled = searchProtectorData.browserSearch && (searchProtectorData.browserSearch.enabled !== undefined) ? searchProtectorData.browserSearch.enabled : true;

                        homePageProtectorEnabled = searchProtectorData.homepage && (searchProtectorData.homepage.enabled !== undefined) ? searchProtectorData.homepage.enabled : true;

                        // check if the current homepage is equal to the settings homepage
                        var homepageCurrent = false; // Do we still own the homepage.
                        var homepage;

                        var value = business.featureProtector.getHomePage();
                        if (value && value.result) {
                            homepage = value.result.homepage;
                        }

                        // Fix for SB to SB uprade from versions older then 10.8.xxx
                        if (searchProtectorData.homaepageUrlFromSettings) {
                            searchProtectorData.homepageUrlFromSettings = searchProtectorData.homaepageUrlFromSettings;
                            delete searchProtectorData.homaepageUrlFromSettings;
                        }

                        if (searchProtectorData.homepageUrlFromSettings == homepage) {
                            homepageCurrent = true;
                        }

                        // check if the current search address is equal to the settings search address
                        var searchCurrent = false; // Do we still own the search provider. either address bar or search box.                
                        var searchEngine;
                        /*
                        var searchAddressUrl;
                        var value = conduit.abstractionlayer.backstage.business.featureProtector.getSearchAddressUrl();
                        if (value && value.result) {
                        searchAddressUrl = value.result.url;
                        }
                        */

                        // check if the current search engine is equal to the settings search engine
                        var value = business.featureProtector.getSearchProviderEngine();
                        if (value && value.result) {
                            searchEngine = value.result.engine;
                        }

                        if (searchProtectorData.searchEngineFromSettings == searchEngine) {
                            searchCurrent = true;
                        }


                        var homepageSelectedByUser = searchProtectorData.homepageSelectedByUser ? true : false; // User 'checked' the homepage checkbox in the first time dialog.                
                        var homepageProtectCount = searchProtectorData.homepageProtectCount; // How many times the search protector popped-up for homepage events. refers only to the first bubble dialog.
                        var homepageProtectChoise = searchProtectorData.homepageProtectChoise; // Last popup selection. Can be null if the protector never popped
                        var homepageChangedManually = searchProtectorData.homepageChangedManually; // Will be true if the HP has changed manually by the user. Default false.

                        var searchProviderSelectedByUser = searchProtectorData.searchProviderSelectedByUser ? true : false; // User 'checked' the search provider checkbox in the first time dialog.                
                        var searchProtectCount = searchProtectorData.searchProtectCount; // How many times the search protector popped-up for search events. refers only to the first bubble dialog.
                        var searchProtectChoise = searchProtectorData.searchProtectChoise; // Last popup selection. Can be null if the protector never popped
                        var searchChangedManually = searchProtectorData.searchChangedManually; // Will be true if the search provider has changed manually by the user. Default false.

                       var additionalTags = {
                            "protectorDataHPInstall": homepageSelectedByUser.toString(),
                            "protectorDataHPCurrent": homepageCurrent.toString(),
                            "protectorDataHPProtectCount": String(homepageProtectCount),
                            "protectorDataHPProtectChoice": String(homepageProtectChoise),
                            "protectorDataHPChangedManually": String(homepageChangedManually), 
                            "protectorDataDSInstall": searchProviderSelectedByUser.toString(),
                            "protectorDataDSCurrent": searchCurrent.toString(),
                            "protectorDataDSProtectCount": String(searchProtectCount),
                            "protectorDataDSProtectChoice": String(searchProtectChoise),
                            "protectorDataDSChangedManually": String(searchChangedManually), 
                        };

                        loginXml = $.extend(true, {}, loginXml, additionalTags);
                        if(callback){
                           callback(loginXml);
                        }

                    }
                    });
                }else{
                  if(callback){
                      callback(loginXml);
                  }
               }
            }else{
                  if(callback){
                      callback(loginXml);
                  }
          }
        }
        catch (e) {
            logger.logError("Failed to createSearchProtectorXMLData", { className: "login", functionName: "createSearchProtectorXMLData" }, { code: logger.GeneralCodes.LOGIN_POST_XML_FAILURE, reportToServer: true, error: e, name: serviceName });
        }

    }

    function notifyReady() {
        conduit.triggerEvent("onReady", { name: "login" });
        conduit.triggerEvent("onLoginChange", loginData);
        conduit.abstractionlayer.commons.messages.postTopicMsg(
		            "systemRequest.loginReady",
		            "conduit.backstage.serviceLayer.login",
		            "");
    }

    function loadData(data, isPreProcessed) {
        try {       
         var newLoginData;   
         try{  
             newLoginData = isPreProcessed ? data : conduit.backstage.serviceLayer.commons.convertJsonString2Boolean(JSON.parse(data)).ebxml.ebmsg;            
            }
            catch(e)
            {
                if(!newLoginData){ //support upgrade scenarios
                    newLoginData = isPreProcessed ? data : $.xml2json(data.replace("\ufeff", ""), false, xml2jsonOptions).ebmsg;
                    if (!isPreProcessed) {
                        // we must parse the xml to get the correct list of trusted domains.
                        // it is corrupted after using the xml2json on the xml.
                        var data = serviceLayer.commons.fixParserError(data).replace("\ufeff", "");
                        var xmlDoc = $.parseXML(data);
                        var trustedDomainsElement = $(xmlDoc).find("TRUSTED_DOMAINS:first");

                        var trustedDomainsArr = trustedDomainsElement ? trustedDomainsElement.children() : null;

                        if (trustedDomainsArr && trustedDomainsArr.length > 0) {

                            var trustedDomains = [];
                            var domain;

                            var len = trustedDomainsArr.length;
                            for (var i = 0; i < len; i++) {
                                domain = $(trustedDomainsArr[i]).text();
                                trustedDomains.push(domain);
                            }
                            newLoginData.tbApi.trustedDomains.domain = trustedDomains;
                        }
                    }
                }
            }
            //verify first that the new login data is valid and only after it replace it
            if (newLoginData) {
                loginData = newLoginData;
            }
            else {
                return loginData; //if the data is invalid keep the old login data and exit from the function
            }

            updateActiveCTID();
            loginData = JSON.parse(conduit.coreLibs.aliasesManager.replaceAliases(JSON.stringify(loginData)));

            if (!isPreProcessed) {                              
                setServerTime();

                if (absRepository.getKey(ctid + ".toolbarLoginClientTime").status) { //Add client toolbar login time. if the key doest exist add it with current date time
                    absRepository.setKey(ctid + ".toolbarLoginClientTime", new Date());
                }
            }


            handleFeatureProtectorData();
            isFirstLogin = false;
            setIsFirstLoginInvoked();
            incrementLoginCount();
            createSearchCookie(!isPreProcessed);
            createCookieForMP();
            sendAppsDetectionUrlPattern();
            handleHiddenConfigurations();
            notifyReady();
            return loginData;
        }
        catch (e) {
            var dataFromServer = conduit.coreLibs.logger.getStringValuePrefix(data);
            return { serviceUpdateFailed: true, errorData: { description: "Login service error in callback. The first characters of the received data: " + dataFromServer, status: logger.getCodeByServiceName(serviceName), error: e} }
        }
    }

    function updateActiveCTID() {
        var newActiveCTID;
        var replaceActiveCTManuallyKey = conduit.abstractionlayer.commons.repository.getKey(ctid + ".replaceActiveCTManually");
        if (!replaceActiveCTManuallyKey.status && /true/i.test(replaceActiveCTManuallyKey.result)) //if the key exist and equal to true the active CT ID was replaced via WEBAPP API
            return;


        if (false && isChrome && loginData.toolbarBranching && loginData.toolbarBranching.activeCtId) { //use active Ct id in Chrome only - turn off this feature in 10.14.40
            newActiveCTID = loginData.toolbarBranching.activeCtId;
            activeCTName = loginData.toolbarBranching.activeCtName;
            branchingTestGroup = loginData.toolbarBranching.testGroup;
        }
        else {
            newActiveCTID = ctid;
            activeCTName = toolbarName;
            branchingTestGroup = "";
        }
        if (newActiveCTID !== activeCTID) {
            //update the alias manager with the updated active CT ID
            conduit.coreLibs.aliasesManager.setAlias(conduit.coreLibs.aliasesManager.constants.TOOLBAR_ID, newActiveCTID);
            conduit.coreLibs.aliasesManager.setAlias(conduit.coreLibs.aliasesManager.constants.TOOLBAR_NAME, activeCTName);


            //update the repository key with the new value
            absRepository.setKey(ctid + ".activeCTID", newActiveCTID);
            absRepository.setKey(ctid + ".activeCTName", activeCTName);
            absRepository.setKey(ctid + ".branchingTestGroup", branchingTestGroup);
            conduit.abstractionlayer.commons.environment.setActiveCTIDChange(); //notify toolbar APIs that active CT was changed
            activeCTID = newActiveCTID;
        }
    }

    function handleHiddenConfigurations() {
        try {
            var fixPageNotFoundErrorInHidden = "true";
            var searchInNewTabEnabledInHidden = "true";
            var addressBarTakeOverEnabledInHidden = "true";
            var searchProtectorEnabledInHidden = true;

            if (loginData && loginData.generalConfig && loginData.generalConfig.config) {
                var generalConfig = loginData.generalConfig.config;
                var configItem;
                for (var i = 0; i < generalConfig.length; i++) {
                    configItem = generalConfig[i];
                    switch (configItem.name) {
                        case "notFoundHiddenEnabled":
                            fixPageNotFoundErrorInHidden = (configItem.value == false) ? "false" : "true";
                            break;
                        case "searchInNewTabHiddenEnabled":
                            searchInNewTabEnabledInHidden = (configItem.value == false) ? "false" : "true";
                            break;
                        case "urlBarHiddenEnabled":
                            addressBarTakeOverEnabledInHidden = (configItem.value == false) ? "false" : "true";
                            break;
                        case "SPHiddenEnabled":
                            searchProtectorEnabledInHidden = (configItem.value == false) ? false : true;
                            break;
                        case "WorkingAppsWhenHiddenList":
                            if (configItem.value) {
                                try {
                                    workingAppsWhenHidden = JSON.parse(configItem.value);
                                }
                                catch (e) {
                                    logger.logError("Failed to parse workingAppsWhenHiddenList parameter", { className: "login", functionName: "handleHiddenConfigurations" }, { error: e, name: serviceName });
                                }
                            }
                            break;
                    }
                }
            }
            conduit.abstractionlayer.commons.repository.setKey(ctid + ".fixPageNotFoundErrorInHidden", fixPageNotFoundErrorInHidden);
            conduit.abstractionlayer.commons.repository.setKey(ctid + ".searchInNewTabEnabledInHidden", searchInNewTabEnabledInHidden);
            conduit.abstractionlayer.commons.repository.setKey(ctid + ".addressBarTakeOverEnabledInHidden", addressBarTakeOverEnabledInHidden);

           conduit.coreLibs.repository.getLocalData("searchProtectorData",function(searchProtectorData){
                if (searchProtectorData && searchProtectorData.searchProtectorEnabledInHidden != searchProtectorEnabledInHidden) {
                    searchProtectorData.searchProtectorEnabledInHidden = searchProtectorEnabledInHidden;
                    conduit.coreLibs.repository.setLocalData("searchProtectorData", searchProtectorData, true,function(){});
                    conduit.abstractionlayer.commons.messages.sendSysReq("applicationLayer.searchProtectorManager.enableInHidden", "dialog.model", searchProtectorEnabledInHidden.toString(), function () { });
                }
            });
        }
        catch (e) {
            // ignore error. log it!
        }

    }


    function setServerTime() {
        if (loginData.serverTime) {
            if (isFirstLogin) {
                absRepository.setKey(ctid + ".toolbarBornServerTime", loginData.serverTime);
                absRepository.setRegKeyAsync(ctid + ".toolbarBornServerTime", loginData.serverTime);
                absRepository.setKey(ctid + ".toolbarCurrentServerTime", loginData.serverTime);
            } else {
                absRepository.setKey(ctid + ".toolbarCurrentServerTime", loginData.serverTime);
            }
        }
    }

    function sendAppsDetectionUrlPattern() {
        var generalConfig = loginData.generalConfig.config;
        var configItem;
        for (var i = 0; i < generalConfig.length; i++) {
            configItem = generalConfig[i];
            if (configItem.name && configItem.name == "AppsDetectionUrlPattern")
                messages.sendSysReq("onSetDownloadPattern", "services.login", JSON.stringify({ urlPattern: configItem.value }), function () { });
        }
    }

    function createCookieForMP() {
        var cookieName = getActiveCTID() + "_Apps",
             cookieValue = toolbarVersion,
             cookieExpirationDateInHours = 24,
             domains = ["apps.conduit.com", "conduitapps.com"];

        for (var i = 0; i < domains.length; i++) {
            writeCookie(cookieName,
                    "http://" + domains[i],
                    cookieExpirationDateInHours,
                    cookieValue,
                    function (result) { });
        }

    }

    function setSearchProtectorCookieData(cookie, searchProtectorInfo,callback) {
        if (!searchProtectorInfo) {
           var searchProtectorData;
            // get the searchProtectorInfo from the searchProtectorData file if exists. used for upgrade from IE oldbar.
             conduit.coreLibs.repository.getLocalData("searchProtectorData",function(res){
                searchProtectorData=res;
                if (searchProtectorData && searchProtectorData.cookieData) {
                    searchProtectorInfo = searchProtectorData.cookieData;
                    continueSPSetCookieFlow();
                }
                else {
                    if (callback)
                       callback(cookie);
                }
            });
        }else{
          continueSPSetCookieFlow();
        }
      

          function continueSPSetCookieFlow (){
            var searchData = searchProtectorInfo.search;
            var homepageData = searchProtectorInfo.homepage;


            if (searchData) {
                var isProtectorValue = searchData.isIgnore ? "Ignore" : "";
                isProtectorValue += searchData.isProtect ? "Yes" : "No";
                if (/DefaultSearchProtector/.test(cookie)) {
                    cookie = cookie.replace(/DefaultSearchProtector=([^&]*)/, "DefaultSearchProtector=" + isProtectorValue);
                }
                else {
                    cookie += "&DefaultSearchProtector=" + isProtectorValue;
                }
            }
            if (homepageData) {
                var isProtectorValue = homepageData.isIgnore ? "Ignore" : "";
                isProtectorValue += homepageData.isProtect ? "Yes" : "No";
                if (/HomePageProtector/.test(cookie)) {
                    cookie = cookie.replace(/HomePageProtector=([^&]*)/, "HomePageProtector=" + isProtectorValue);
                }
                else {
                    cookie += "&HomePageProtector=" + isProtectorValue;
                }
            }
            if(callback){
             callbak(cookie);
	    }
       }
   }

    function updateSearchCookie(searchProtectorInfo) {
        createSearchCookie(true, searchProtectorInfo)
    }

    // Creates a cookie at search.conduit.com with the toolbar info. for search stats.
    // The cookie is created on every browser open if it doesn't exist. forceUpdate flag is true when the toolbar version is updated
    // so the new toolbar version is saved in the cookie.
    function createSearchCookie(forceUpdate, searchProtectorInfo) {
        try {
            var toolbarBornServerTime = serviceLayer.commons.getToolbarBornServerTime(),
            toolbarLastLoginDate = loginData.serverTime,
            defaultSearchUrl = serviceLayer.config.toolbarSettings.getSettingsDataByRef().generalData.defaultSearchUrl || "", //TODO what is there is no default?
            cookieName = "tbInfo_" + getActiveCTID(),
            cookieValue,

            // TODO: In chrome the cookies must be asynchronous and a context-store should be used.
            // (- e.g.,  var storeId = "0"; - Always set a default store in order to make sure that a different storeId is not used across different windows).
            cookieHandle = conduit.abstractionlayer.backstage.browserData;
            var validHostnameRegex = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
            var cookieDomain = "http://" + defaultSearchUrl.match(validHostnameRegex)[1].toString();

            cookieHandle.readCookies(cookieName, cookieDomain, function (cookie) {

                if (!cookie || !cookie.result || forceUpdate) {// if there is no cookie or the interval is over, or it is a force update
                    if (toolbarBornServerTime && toolbarLastLoginDate) {
                        var cookieExpirationDateInHours = 365 * 24; // One year from today, in hours

                        function deleteCookie (){
                           cookieHandle.deleteCookie(cookieName,cookieDomain,function(){
                                var writeResult = cookieHandle.writeCookie(
                                    cookieName,
                                    cookieDomain,
                                    cookieExpirationDateInHours,
                                    cookieValue,
                                    function (result) {

                                    });
                            });
                        }

                        if (cookie && cookie.result) {
                            // if there is a cookie, update it, do not create it from scratch.
                            cookieValue = cookie.result;
                            cookieValue = cookieValue.replace(/ToolbarCreationDate=([^&]*)/, "ToolbarCreationDate=" + toolbarBornServerTime);
                            cookieValue = cookieValue.replace(/ToolbarVersion=([^&]*)/, "ToolbarVersion=" + toolbarVersion);
                            cookieValue = cookieValue.replace(/ToolbarLastLogin=([^&]*)/, "ToolbarLastLogin=" + toolbarLastLoginDate);
                            cookieValue = setSearchProtectorCookieData(cookieValue, searchProtectorInfo,function(res){
                               cookieValue = res;
                               deleteCookie ()
                            });
                             
                        }
                        else {
                            cookieValue = [
                                        "ToolbarCreationDate=", toolbarBornServerTime,
                                        "&ToolbarVersion=", toolbarVersion,
                                        "&ToolbarLastLogin=", toolbarLastLoginDate  //";domain=search.conduit.com"
                                    ].join("");
                           setSearchProtectorCookieData(cookieValue, searchProtectorInfo,function(res){
                                cookieValue = res;
                                deleteCookie ()
                            });
                        }




                    }
                }
            });

        }
        catch (e) {
            // we cannot afford to fail in the login due to cookies problem.
            //TODO add log/error handling here
        }

    };

    /*
    get the number of searches from the serach webApp. 
    0 – user never searched           
    1 – user searched once
    2 – user searched more than once
    */
    function calculateSearchCount(callback) {
        var searchCount = 0;
        try {
          conduit.coreLibs.repository.getLocalData("search.searchCount",function(serachCountValue){
                if (serachCountValue && serachCountValue != null) {
                    if (typeof (serachCountValue) == "string") {
                        serachCountValue = parseInt(serachCountValue);
                    }
                    if (serachCountValue >= 0 && serachCountValue < 3) {
                        searchCount = serachCountValue;
                    }
                }
                callback(searchCount);
            });
        }
        catch (e) {
            logger.logError("Failed to calculateSearchCount", { className: "login", functionName: "calculateSearchCount" }, { code: logger.GeneralCodes.LOGIN_POST_XML_FAILURE, reportToServer: true, error: e, name: serviceName });
        }
       
    }

    /*
    get the number of toolbar and toolbar component actions from the usage service. 
    0 – no actions, 
    1- single action, 
    2- more then 1 
    */
    function getToolbarUsageCount(callback) {
        var toolbarUsageCount = 0;
        var toolbarUsageCountValue;
        try {
            conduit.coreLibs.repository.getLocalData("serviceLayer_service_usage_toolbarUsageCount",function(response){
                if (response && response.data) {
                    toolbarUsageCountValue = response.data;
                    if (typeof (toolbarUsageCountValue) == "string") {
                        toolbarUsageCountValue = parseInt(toolbarUsageCountValue);
                    }

                    if (toolbarUsageCountValue >= 0 && toolbarUsageCountValue < 3) {
                        toolbarUsageCount = toolbarUsageCountValue;
                    }
                }
                  callback(toolbarUsageCount)
            
             });
        }
        catch (e) {
            logger.logError("Failed to getToolbarUsageCount", { className: "login", functionName: "getToolbarUsageCount" }, { code: logger.GeneralCodes.LOGIN_POST_XML_FAILURE, reportToServer: true, error: e, name: serviceName });
        }

    }


    function handleDownloadRefCookieContent(baseData, loginXml, cookieData, callback) {
        try {
            var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
            var installType = absRepository.getKey(ctid + ".installType");

            //client logic for installation type.
            if (!installType || installType.status) {
                //no installation type with download cookie => direct download
                if (cookieData) {
                    installationType = InstallationTypes.DirectDownload;
                }
                //no installation type without download cookie => unknown
                else {

                    installationType = InstallationTypes.UnknownInstallation;
                }
            }
            //unknown integration with download cookie => direct download
            else if (installType && (installType.result == InstallationTypes.UnknownIntegration && cookieData)) {
                installationType = InstallationTypes.DirectDownload;
            }
            //known integration without cookie
            else {
                installationType = installType.result;
            }

            // Get data from keys, if exist override existing data

            var installId = absRepository.getKey(ctid + ".installId").result || "";
            var downloadDate = absRepository.getKey(ctid + ".downloadDate").result || "";
            absRepository.setKey(ctid + ".installType", installationType);
            if (cookieData) {
                cookieData = cookieData.replace(/([^\{]*)/, "");
                cookieData = JSON.parse(cookieData);
            }

            var additionalTags = {
                "DownloadRef": (cookieData ? serviceLayer.commons.json2Xml("", cookieData) : ""),
                "DownloadDate": downloadDate,
                "InstallationId": installId,
                "InstallationType": installationType
            };

            loginXml = $.extend(true, {}, loginXml, additionalTags);

            var data = "RequestString=" + encodeURIComponent(JSON.stringify(loginXml));
            callback(data);
        }
        catch (e) {
            logger.logError("Failed to handle download ref cookie data", { className: "login", functionName: "handleDownloadRefCookieContent" }, { code: logger.GeneralCodes.LOGIN_DOWNLOAD_REF_COOKIE_FAILURE, reportToServer: true, error: e, name: serviceName });
            var data = "RequestString=" + encodeURIComponent(JSON.stringify(loginXml));
            callback(data);
        }
    }

    function createDownloadRefTags(baseData, loginXml, callback) {
        var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
        var readCookieUrl = absRepository.getKey(ctid + ".webServerUrl").result;
        if (readCookieUrl) {
            readCookieUrl = readCookieUrl.replace(/\/$/, "");
        }
        else {
            name = toolbarName.replace(/[\s\_]/g, ""); // remove _ and spaces. for example, in chrome toolbar name can be Try_Me and the cookie name is tryme
            readCookieUrl = 'http://' + name + ".ourtoolbar.com";
        }
        try {
            conduit.coreLibs.repository.getLocalData("downloadRefCookieData",function(downloadRefCookieData){
                if (downloadRefCookieData && downloadRefCookieData.data) {
                    handleDownloadRefCookieContent(baseData, loginXml, downloadRefCookieData.data, callback);
                }
                else {
                    readCookies(downloadCookieName, readCookieUrl, function (data) {
                        var cookie = undefined;
                        if (data && data.result) {
                            cookie = data.result;
                            //do the magic
                            if (cookie){
                                conduit.coreLibs.repository.setLocalData("downloadRefCookieData", cookie,false, function(){
                                   handleDownloadRefCookieContent(baseData, loginXml, cookie, callback);
                                });
                            }else{
                                 handleDownloadRefCookieContent(baseData, loginXml, cookie, callback);
                            }
                        }
                        else {
                            // try again with ctid for IE and Chrome
                            readCookies(downloadCookieName, 'http://' + getActiveCTID().toLowerCase() + ".ourtoolbar.com", function (data) {
                                var cookie = undefined;
                                if (data && data.result) {
                                    cookie = data.result;
                                }
                                //do the magic
                                if (cookie){
                                    conduit.coreLibs.repository.setLocalData("downloadRefCookieData", cookie, false,function(){
                                       handleDownloadRefCookieContent(baseData, loginXml, cookie, callback);
                                });
                                }else{
                                      handleDownloadRefCookieContent(baseData, loginXml, cookie, callback);
                                }
                            });
                        }
                    });
                } // end else
            });
        }
        
        catch (e) {
            logger.logError("Failed to createDownloadRefTags", { className: "login", functionName: "createDownloadRefTags" }, { code: logger.GeneralCodes.LOGIN_POST_XML_FAILURE, reportToServer: true, error: e, name: serviceName });
            var data = "RequestString=" + encodeURIComponent(JSON.stringify(loginXml));
            callback(data);
        }
    }

    function getUMValue(callback) {        
        conduit.abstractionlayer.commons.storage.getTripleKey(ctid + ".searchUserMode",function(response){
           var umValue = "";
           try{
               if(!response.status){
           var trippleKeySearchUserMode = response.result;
                    if(trippleKeySearchUserMode){
                        umValue = trippleKeySearchUserMode.registry || trippleKeySearchUserMode.file ||  trippleKeySearchUserMode.local || "";
                    }
               }
           }
           catch(e){ }
           if (callback){      
             callback(umValue);
           }
        });

    }

    function isUpgradeFlow(){
        if(isFF){
            var installationStatus = conduit.abstractionlayer.backstage.system.getInstallationStatus().result;
            if(installationStatus.upgrade){
                return true;
            }
        }
        else if(isChrome)
        {
            var versionFromInstaller = conduit.abstractionlayer.commons.repository.getKey(ctid + ".versionFromInstaller").result;
            var prevToolbarVersion = conduit.abstractionlayer.commons.repository.getKey("NewTab.prevToolbarVersion").result;
            var wasUpgradeDoneKey = conduit.abstractionlayer.commons.repository.getKey("NewTab.isUpgraded" + ctid);
             var wasUpgradeDone = !wasUpgradeDoneKey.status ? /true/i.test(wasUpgradeDoneKey.result) : false;
            if(wasUpgradeDone && prevToolbarVersion != toolbarVersion && versionFromInstaller == toolbarVersion){
                return true;
            }
        }
        return false;
    }  
    
    function getPreviousVersion(){
        if(isChrome)
        {
            var prevToolbarVersionKey = conduit.abstractionlayer.commons.repository.getKey("NewTab.prevToolbarVersion");
            var wasUpgradeDoneKey = conduit.abstractionlayer.commons.repository.getKey("NewTab.isUpgraded" + ctid);
            var wasUpgradeDone = !wasUpgradeDoneKey.status ? /true/i.test(wasUpgradeDoneKey.result) : false;
            if(!prevToolbarVersionKey.status && (prevToolbarVersionKey.result != toolbarVersion) && wasUpgradeDone){
                return prevToolbarVersionKey.result;
            }           
        }
        else if(isFF){
             var installationStatus = conduit.abstractionlayer.backstage.system.getInstallationStatus().result;
             if(installationStatus.lastVersion != toolbarVersion){
                return installationStatus.lastVersion;
             }            
        }
        return "";

    }      

    function getLoginXml(callback) {
        try {
            calculateSearchCount(function(searchCount){
               getToolbarUsageCount(function(toolbarUsageCount){
                conduit.abstractionlayer.commons.environment.getProfileData(function(profileDataObj){
                var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
                var activeCTID = getActiveCTID();
                var branchingTestGroup = getBranchingTestGroup();
                var profileData = profileDataObj.result || {};
                var machineId = "";
                var getMacineIdObj = conduit.abstractionlayer.commons.context.getMachineId();
                if (getMacineIdObj.status == 0 ) {
                    var idObj = '';
                    try{//check if we got the machine ID result as json object due to plug in bug
                        idObj = JSON.parse(getMacineIdObj.result);   
                    }                
                    catch(e){
                        //machine ID is valid use it
                        machineId = "SB_" + getMacineIdObj.result;
                    }
                    if(idObj){ //if machine ID is object send usage error
                        var usage = conduit.backstage.serviceLayer.usage;
                        var oUsage = { actionType: "MACHINE_ID_ERR_MSG", errorDescription: "machine ID in bad format: " + getMacineIdObj.result};                    
                        var isFirstTime = absRepository.getKey(ctid + ".missingMachineIdSent");
                        if (isFirstTime && isFirstTime.status) {
                            oUsage.isFirstTry = true;
                            absRepository.setKey(ctid + ".missingMachineIdSent", "true");
                        }
                        if (usage && usage.sendToolbarUsage) {
                            usage.sendToolbarUsage(oUsage);
                        }
                    }               
                } else {
                    var usage = conduit.backstage.serviceLayer.usage;
                    var oUsage = { actionType: "MACHINE_ID_ERR_MSG", errorDescription: getMacineIdObj.description};
                    if(getMacineIdObj.status == 0){ //typeof getMacineIdObj.result isn't string
                        oUsage.errorDescription = "machine ID in bad format: " + getMacineIdObj.result;
                    }
                    var isFirstTime = absRepository.getKey(ctid + ".missingMachineIdSent");
                    if (isFirstTime && isFirstTime.status) {
                        oUsage.isFirstTry = true;
                        absRepository.setKey(ctid + ".missingMachineIdSent", "true");
                    }
                    if (usage && usage.sendToolbarUsage) {
                        usage.sendToolbarUsage(oUsage);
                    }
                }                      
                
                if (isFirstLogin) {
                    // save the prefs to the FF pref.js file
                    absRepository.saveAllKeys();
                }

                var checkSearchAssetsOwnership = (function(){var firstLogin = isFirstLogin; return function(){            
                    try{
                        if(!isFF){
                            return;
                        }
                        var isHomepageOwnedByConduit = business.featureProtector.isHomepageOwnedByConduit(business.featureProtector.getHomePage().result.homepage);
                        var isConduitSearchEngine = business.featureProtector.isConduitSearchEngine(business.featureProtector.getSearchProviderEngine().result.selectedEngine);
                        var isAddressUrlOwnedByConduit = business.featureProtector.isAddressUrlOwnedByConduit(business.featureProtector.getSearchAddressUrl().result.url);
                        var usageData = { 
                            actionType: "ASSET_STATUS", 
                            "isHomepageConduit": isHomepageOwnedByConduit, 
                            "isSearchConduit": isConduitSearchEngine, 
                            "isAddressUrlConduit": isAddressUrlOwnedByConduit, 
                            "isFirstLogin": firstLogin
                            };
                        if(!isHomepageOwnedByConduit){
                            usageData.intruderHomepageDomain = business.featureProtector.getHomePage().result.homepage;
                        }
                        if(!isConduitSearchEngine){
                            usageData.intruderSearchDomain = business.featureProtector.getSearchProviderEngine().result.engine;
                        }
                        if(!isAddressUrlOwnedByConduit){
                            usageData.intruderAddressUrlDomain = business.featureProtector.getSearchAddressUrl().result.url;
                        }
          
                        var usage = conduit.backstage.serviceLayer.usage;      
                        if (usage && usage.sendToolbarUsage) {
                            usage.sendToolbarUsage(usageData);
                        }  
                    }
                    catch(e){                    
                        logger.logError("Failed to send assets status ", { className: "login", functionName: "checkSearchAssetsOwnership" }, { error: e, name: serviceName });
                    }  
                }}());
                setTimeout(checkSearchAssetsOwnership, 2000); //send the usage only after 2 sec since we are waiting to search take overs to be done 
                
                conduit.abstractionlayer.commons.environment.getGlobalUserId(function (guidObj) {
                    getUMValue(function(umRes){ 
                       conduit.abstractionlayer.commons.context.getUserID(function(userIdObj){  
                            conduit.abstractionlayer.commons.context.getFullUserID(function(fullUserIDObj){ 
                                absRepository.getInstallationKey("installationKeys", function (installationKeysObj) {   
                                    var OSInfo = conduit.abstractionlayer.commons.environment.getOSInfo().result;                              
                                    var baseData = {
                                        "CTID": ctid,
                                        "ActingCTID": activeCTID,
                                        "TestGroup": branchingTestGroup,
                                        "ToolbarVersion": toolbarVersion,
                                        "Platform": /firefox/i.test(browserInfo.type) ? browserInfo.type.toUpperCase() : browserInfo.type,
                                        "BrowserVersion": browserInfo.version,
                                        "BrowserLocale": browserInfo.locale,
                                        "ClientOperatingSystem": OSInfo.type + " " + OSInfo.version,
                                        "ClientOperatingSystemLocale": OSInfo.locale,
                                        "ValidationDataSearchType": searchCount,
                                        "ValidationDataToolbarType": toolbarUsageCount,
                                        "ValidationDataIsUsageLoggingEnabled": "TRUE",
                                        "UserId": userIdObj.result,		        
                                        "GlobalUserID": guidObj.result,
                                        "MachineUserID": machineId,
                                        "InstallationKeys": installationKeysObj.result || "",
                                        "ExtraData": {
                                            "Browser_Bit_Type": browserInfo.bitType,
                                            "IsHidden": conduit.abstractionlayer.backstage.browser.isHidden().result.toString(),
                                            "Os_Sp": OSInfo.servicePack, // Service Pack 1 - from registry
                                            "Os_Bit_Type": OSInfo.bitType, // 64Bit/32Bit or WOW64/Win64 - can be taken from user agent
                                            "Os_Edition": OSInfo.edition, // Professional/Home - from registry. does not work for XP (even for IE C++ code)
                                            "User_Mode": umRes,
                                            "Browser_Update_Version": browserInfo.version, //TODO: ask Ayala if needed
                                            "Inst_Session_Id": conduit.abstractionlayer.commons.repository.getKey(ctid + ".installSessionId").result || "-1",
                                            "Active_Profile": profileData.activeProfile || "Unknown",
                                            "Signed_In": String(!!profileData.signedIn),
                                            "CH_Adjusted": String(!conduit.abstractionlayer.commons.repository.getKey("extensionapproved").status), //send true if the key exist and false otherwise
                                            "Full_User_Id": fullUserIDObj.result,
                                            "Installer_Version": conduit.abstractionlayer.commons.repository.getKey(ctid + ".installerVersion").result,
                                            "IsFirst": isFirstLogin, //should be Boolean
                                            "Is_Upgrade":String(isUpgradeFlow()),
                                            "Previous_Version": getPreviousVersion(),
                                            "nmHostState":getHostState() || "",
                                            "googleCompliantMode": /chrome/i.test(browserInfo.type) ? conduit.abstractionlayer.commons.repository.getKey(ctid + ".googleCompliantMode").result : "",
                                            "defaultCREgoogleCompliantMode": /chrome/i.test(browserInfo.type) ? conduit.abstractionlayer.commons.repository.getKey(ctid + ".defaultCREgoogleCompliantMode").result : ""
                                        }
                                    };
                                addAdditionalLoginData(callback, baseData, searchCount);
                            });
                        });
                    });
                 });
                 });
              });
              });
           });
        }
        catch (e) {            
            // save the prefs to the FF pref.js file
            logger.logError("Failed to call getLoginXml", { className: "login", functionName: "getLoginXml" }, { code: logger.GeneralCodes.LOGIN_POST_XML_FAILURE, reportToServer: true, error: e, name: serviceName });
        }
    }
    function getHostState() {
        try{
            if(isChrome){
                return conduit.abstractionlayer.backstage.nmWrapper.getHostState();
            }
            else{
                return "";
            }
        }
        catch(e){}
        return "";
    }
  


    function addAdditionalLoginData(callback, baseData, searchCount) {
        var loginXml = $.extend(true, {}, baseData, {

            "ClientTimestamp": (new Date()).format("mm-dd-yyyy HH:MM:ss"),
            "ValidationDataSearchType": searchCount,
           
        });

        //PROTECTOR_DATA        
        createSearchProtectorXMLData(loginXml,function(res){
            loginXml=res;
            if (loginCount < 4) {
                // async call 
                createDownloadRefTags(baseData, loginXml, callback);
            }
            else {
                conduit.coreLibs.repository.removeLocalData("downloadRefCookieData");
                //Add the cookie parameters with empty values
                 var additionalTags = {
                    "DownloadRef":  "",
                    "DownloadDate": "",
                    "InstallationId": "",
                    "InstallationType": ""
                };

                loginXml = $.extend(true, {}, loginXml, additionalTags);
                var data = "RequestString=" + encodeURIComponent(JSON.stringify(loginXml));
                callback(data);
            }
        });
    }

    function cbFailLogin(returnValue) {
        //TODO what to do incase of a failure.

    }

    function init() {
        try {
          checkIsFirstLogin(function(firstLogin){
               isFirstLogin=firstLogin;
               getLoginCount(function(numOfLogin){
                    loginCount=numOfLogin;
                    var serviceNameInMap = "ToolbarLoginJson";
                    var isHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;
                    if (isHidden) {
                        serviceNameInMap = "ToolbarHiddenLoginJson";
                    }
                    serviceData = serviceLayer.serviceMap.getItemByName(serviceNameInMap);

                    if (serviceData.reload_interval_sec === undefined || (serviceData.reload_interval_sec !== undefined && (isNaN(serviceData.reload_interval_sec) || typeof (serviceData.reload_interval_sec) !== "number" || serviceData.reload_interval_sec <= 0))) {
                        var message = "Invalid value for serviceData.reload_interval_sec, expected a positive number.";
                        logger.logError(message, { className: "login", functionName: "init" }, { code: logger.getCodeByServiceName(serviceName), name: serviceName });
                        serviceData.reload_interval_sec = 14400; // default value
                    }

                    // we should set manualInvoke so the only the firstTimeDialog should invoke the login at the first time.
                    // we should check if this is the first login by looking at the login chach file. 
                    //if for some reason the first login failed, we must have a fallback - we will check if the firstTimeDialog was opened, if so, we will not use manualInvoke.        

                    var response = conduit.abstractionlayer.commons.repository.getKey(ctid + '.firstTimeDialogOpened');
                    var firstTimeDialogOpened = false;
                    if (response && !response.status) {
                        firstTimeDialogOpened = true;
                    }

                    var manual = isFirstLogin && !firstTimeDialogOpened;           
                    serviceLayer.serviceDataManager.addService({
                        name: serviceName,
                        url: serviceData.url,
                        interval: serviceData.reload_interval_sec * 1000,
                        callback: loadData,
                        dataType: "application/x-www-form-urlencoded",
                        method: "POST",
                        getData: getLoginXml,
                        getAsyncData: true,
                        manualInvoke: manual,
                        versionDepended: true,
                        cbFail: cbFailLogin,
                        errorInterval: 1 * 60 * 1000,
                        retryIterations: 3,
                        enabledInHidden: isHidden
                    },function(returnedService){
                    service=returnedService;

                    conduit.triggerEvent('onLoginInitialized');
					loginInitialized = true;
	               /*This code is added to trigger the hidden login when hide was done from uninstaller*/
                   var keyName= ctid + '.sendHiddenLoginAfterHideFromUninstaller';
	               conduit.abstractionlayer.commons.repository.getRegKeyAsync(keyName,function(hideDoneByUninstaller){
                   if (hideDoneByUninstaller.status == 0 && hideDoneByUninstaller.result == "true") {
		                 conduit.abstractionlayer.commons.repository.removeKeyAsync(keyName,function(){
                         conduit.abstractionlayer.commons.repository.removeKeyAsync("toolbarShow", function () { });
		                     service.invoke();
                             continueFlow();
                         });
                    }else{
                       continueFlow();
                    }
                    function continueFlow() {
                    if (serviceLayer.login.init)
                        delete serviceLayer.login.init;
                       
                       }
                   });
                });
            });
        });
        }
        catch (e) {
            logger.logError("Failed to init login", { className: "login", functionName: "init" }, { code: logger.GeneralCodes.LOGIN_INIT_FAILURE, reportToServer: true, error: e, name: serviceName });
        }
    }

    function switchMode() {

        var serviceNameInMap = "ToolbarLoginJson";
        var isHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;
        if (isHidden) {
            serviceNameInMap = "ToolbarHiddenLoginJson";
        }
        data = serviceLayer.serviceMap.getItemByName(serviceNameInMap);
        //TODO handle case where interval is invalid like in init
        if (data && data.url) {            
            serviceLayer.serviceDataManager.update(service, { url: data.url, interval: data.reload_interval_sec * 1000, enabledInHidden: isHidden });
        }
        else {
            //TODO add error here
        }
    }

    function getActiveCTID() {
        return activeCTID;
    }

    function getBranchingTestGroup() {
        return branchingTestGroup;
    }

     function waitForPlugin() {        
        var isPluginAvailable = conduit.abstractionlayer.commons.context.isPluginAvailable();        
        if (isPluginAvailable || ((new Date()) - time > 10000)) {
            //start the login service
            serviceLayer.installUsage.start("ToolbarInstall");
            service.start(true);
        }
        else {
            setTimeout(waitForPlugin, 1000);
        }
    }

    //toolbar settings are part of update flow that might cause by manual refresh, interval update, service map update
    conduit.subscribe("onSettingsReady", function (data) {
        if (data.serviceMapChange) { //service map was changed            
            var serviceNameInMap = "ToolbarLoginJson";
            var isHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;
            if (isHidden) {
                serviceNameInMap = "ToolbarHiddenLoginJson";
            }
            var currentServiceData = serviceLayer.serviceMap.getItemByName(serviceNameInMap);
            if (currentServiceData.url !== serviceData.url || currentServiceData.reload_interval_sec !== serviceData.reload_interval_sec) {
                //login data was changed run update on the service
                serviceDataManager.update(service, { url: currentServiceData.url, interval: data.reload_interval_sec * 1000 }, data.forceUpdate);
            }
        }
    });

	function startManualLogin(){
		try {
			if (isFirstLogin) {
				time = new Date();
				waitForPlugin();                    
			}
		}
		catch (e) {
			logger.logError("Failed to start first login", { className: "login", functionName: "start" }, { code: logger.GeneralCodes.FIRST_LOGIN_START_FAILURE, reportToServer: true, error: e, name: serviceName });
		}
	}

    return {
        init: init,
        handleFeatureProtectorData: handleFeatureProtectorData,
        getMyStuffData: function () {
            var result = null;

            if (loginData) {
                result = loginData.myStuff
            }
            return clone(result);
        },
        getLoginData: function () {
            return loginData;
        },
        getSocialDomains: function () {
            var generalConfig = loginData.generalConfig.config;
            var configItem;
            for (var i = 0; i < generalConfig.length; i++) {
                configItem = generalConfig[i];
                if (configItem.name && configItem.name == "SocialDomains")
                    return configItem.value.split(";");
            }
            return [];
        },
        getTrustedDomains: function () {
            var trustedDomains = loginData.tbApi && loginData.tbApi.trustedDomains && loginData.tbApi.trustedDomains.domain ? loginData.tbApi.trustedDomains.domain : null;
            return clone(trustedDomains);
        },
        getAppsDetectionUrlPattern: function () {

            //case the service is not ready yet. 
            if (!loginData) return null;

            var generalConfig = loginData.generalConfig.config;
            var configItem;
            for (var i = 0; i < generalConfig.length; i++) {
                configItem = generalConfig[i];
                if (configItem.name && configItem.name == "AppsDetectionUrlPattern")
                    return clone(configItem.value);
            }
            return null;
        },
        getRefreshBackstageParams: function () {

            //case the service is not ready yet. 
            if (!loginData) return null;

            var generalConfig = loginData.generalConfig.config;
            var configItem;
            for (var i = 0; i < generalConfig.length; i++) {
                configItem = generalConfig[i];
                if (configItem.name && configItem.name == "RefreshBackstageParams")
                    return clone(configItem.value);
            }
            return null;
        },
        getChromeInterval: function () {
            //case the service is not ready yet. 
            if (!loginData) return null;

            var generalConfig = loginData.generalConfig.config;
            var configItem;
            for (var i = 0; i < generalConfig.length; i++) {
                configItem = generalConfig[i];
                if (configItem.name && configItem.name == "ChInterval")
                    return clone(configItem.value);
            }
            return null;
        },
        updateSearchCookie: updateSearchCookie,
        start: function () {
            if(loginInitialized){
			    startManualLogin();
			}
			else{				
				conduit.subscribe("onLoginInitialized", function () {
					startManualLogin();
				});
			}			
        },
        getActiveCTID: getActiveCTID,
        getActiveCTName: function () {
            return activeCTName;
        },
        getActiveCTData: function () {
            return { activeCTID: activeCTID, activeCTName: activeCTName };
        },
        switchMode: switchMode,
        getWorkingAppsWhenHidden: function () {
            var apps = {};
            var wrapper = { apps: apps, guidArray: workingAppsWhenHidden };
            if (workingAppsWhenHidden) {

                for (var i in workingAppsWhenHidden) {
                    var appGuid = workingAppsWhenHidden[i];
                    // find the app in settings and user apps
                    var settingsApp = conduit.backstage.serviceLayer.config.toolbarSettings.findAppByGuid(appGuid);
                    if (settingsApp) {
                        apps[appGuid] = settingsApp;
                        foundApps = true;
                    }
                    var userApp = conduit.backstage.serviceLayer.userApps.findAppByGuid(appGuid);
                    if (userApp) {
                        apps[appGuid] = userApp;
                        foundApps = true;
                    }
                }
            }
            return wrapper;
        },
        isLoginInitialized: function(){
            return loginInitialized;
        }
        }//return
    
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.login,
    dependencies: ["serviceMap", "toolbarSettings","aliasesManager"],
    onLoad: conduit.backstage.serviceLayer.login.init
});

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (elt /*, from*/) {
        var len = this.length;
        var from = Number(arguments[1]) || 0;
        from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
        if (from < 0)
            from += len;
        for (; from < len; from++) {
            if (from in this &&
          this[from] === elt)
                return from;
        }
        return -1;
    };
}

conduit.register("backstage.serviceLayer.serviceMap", (function () {
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
    //var serviceMapUrl = "http://localhost/settings/serviceMap.json"; // *** just for testing
    var serviceMapUrl = "http://servicemap.conduit-services.com/toolbar?ownerId=" + ctid;
    var serviceMapData;
    var serviceMapService;
    var serviceName = "serviceMap";
    var logger = conduit.coreLibs.logger;
    var repository = conduit.coreLibs.repository;
    var activeCTIDKey = conduit.abstractionlayer.commons.repository.getKey(ctid + ".activeCTID").result;
    var activeCTID = activeCTIDKey ? activeCTIDKey : ctid; //if active CT ID exist in repository, use it otherwise, use the original CTID	

    var Constants = { activeCTIDKey: "serviceLayer_service_toolbarGrouping_activeCTID", groupingInvokedKey: "serviceLayer_service_toolbarGrouping_invoked", activeToolbarName: "serviceLayer_service_toolbarGrouping_activeToolbarName", activeDownloadUrl: "serviceLayer_service_toolbarGrouping_activeDownloadUrl" };


    function replaceActiveCTID(newActiveCTID) {
        activeCTID = newActiveCTID;
        conduit.triggerEvent('onServiceMapChange', {forceUpdate: true}); //force update only in case of replacing acctive CT ID
    }

    /*
    An error calback in case we failed to get the service data
    returnValue - { responseData: responseData, url: serviceData.url, extraData: extraData, description: description, status: status }
    
    */
    function cbFailServiceMap(returnValue) {
        //TODO what to do incase of a failure.

        // we need to check if we have cached service data for the service map and settings services.
        // if not we need to hide the toolbar and wait for the next error interval
        /*
        var cachedServiceMapData = conduit.backstage.serviceLayer.serviceDataManager.getData(serviceName);
        var cachedSettingsData = conduit.backstage.serviceLayer.serviceDataManager.getData("toolbarSettings");
        if (!cachedServiceMapData && !cachedSettingsData) {
        // hide the toolbar
        conduit.abstractionlayer.backstage.browser.showToolbar(false);

        }
        */
    }

    // Gets the JSON object received from the service and loads the services data into the serviceMapData object.
    // On the first time, triggers the event onServiceMapInit
    // On any subsequent updates, triggers onServiceMapUpdate
    function loadServiceMapData(data, isPreProcessed) {
        try {
            if (!data) {
                return { serviceUpdateFailed: true, errorData: { description: "ServiceMap service, no data in callback.", status: logger.getCodeByServiceName(serviceName)} }
            }

            serviceMapService = this;

            var onInit = typeof (serviceMapData) === "undefined" ?
			function () {
			    if (!isPreProcessed) {
			        var now = new Date(),
						repositoryData = {
						    lastUpdate: now.valueOf(),
						    lastUpdateSuccess: true,
						    data: serviceMapData
						}
			        // data manager saves this
			        //repository.setData(ctid + ".serviceLayer_services_" + serviceName, repositoryData);
			    }
			    //preformance log
			    if (onInit) {
			        conduit.coreLibs.logger.performanceLog({
			            from: "Service Map",
			            action: "Service Map start loading: ",
			            time: +new Date(),
			            isWithState: ""
			        });
			    }

			    // happens only once when the toolbar loads.
			    conduit.triggerEvent("onReady", { name: serviceName });

			    serviceMapService.stop();
			    if (serviceMapData.interval === undefined || (serviceMapData.interval !== undefined && (isNaN(serviceMapData.interval) || typeof (serviceMapData.interval) !== "number" || serviceMapData.interval <= 0))) {
			        var message = "Invalid value for serviceMapData.interval:" + serviceMapData.interval + " , expected a positive number.";
			        logger.logError(message, { className: "serviceMap", functionName: "loadServiceMapData" }, { code: logger.getCodeByServiceName(serviceName) , name: serviceName});
			        serviceMapData.interval = 86400; // default value 
			    }
			    serviceMapService.interval = serviceMapData.interval * 1000;
			    serviceMapService.start(false);

			} : undefined;

            if (isPreProcessed) {
                // got the data from the cache
                serviceMapData = data;
                conduit.triggerEvent('onServiceMapChange');
                if (onInit) {
                    onInit();
                }
            }
            else {
                if (typeof (data) === "object") {
                    data = JSON.stringify(data);
                }
                data = $.parseJSON(data);

                if (data.result)
                    data = data.result;

                serviceMapData = { services: {}, interval: data.reload_interval_sec };
                if (!data.services) {
                    var dataFromServer = conduit.coreLibs.logger.getStringValuePrefix(data);
                    return { serviceUpdateFailed: true, errorData: { description: "ServiceMap service, error in callback. ServiceMap data does not contain services. The first characters of the received data: " + dataFromServer, status: logger.getCodeByServiceName(serviceName)} }
                }
                for (var i = 0, serviceCount = data.services.length; i < serviceCount; i++) {
                    var serviceData = data.services[i];
                    serviceMapData.services[serviceData.name] = serviceData;
                }


                //TODO: not in use, should add toolbar grouping support (Liron / Ofir).
                /*
                // if serviceMap data contains EB_TOOLBAR_ID , replace it with the active ctid
                // so the correct active CTID will be replaced in case of grouping.						
                var value = repository.getLocalData(Constants.groupingInvokedKey);
                if (value && value.data) {
                value = repository.getLocalData(Constants.activeCTIDKey);
                if (value && value.data) {
                replaceActiveCTID(value.data);
                }
                }*/

                if (onInit)
                    onInit();
                else {
                    //TODO: not in use, should add toolbar grouping support (Liron / Ofir).
                    /*
                    // happens when the interval was finished and the service was invoked again.
                    // check if we support toolbar grouping
                    var value = repository.getLocalData(Constants.activeCTIDKey);
                    if (value && value.data) {
                    replaceActiveCTID(value.data);
                    }*/

                    conduit.triggerEvent('onServiceMapChange');
                }

            }

            /*
            //TODO check if WE hide the toolbar or the user
            if (conduit.abstractionlayer.backstage.browser.isHidden()) {
            conduit.abstractionlayer.backstage.browser.showToolbar(true);
            }
            */

            //preformance log
            if (onInit) {
                conduit.coreLibs.logger.performanceLog({
                    from: "Service Map",
                    action: "Service Map loaded: ",
                    time: +new Date(),
                    isWithState: ""
                });
            }
            return serviceMapData;
        }
        catch (e) {
            var dataFromServer = conduit.coreLibs.logger.getStringValuePrefix(data);
            return { serviceUpdateFailed: true, errorData: { description: "ServiceMap service, error in callback. The first characters of the received data: " + dataFromServer, status: logger.getCodeByServiceName(serviceName), error: e} }
        }
    }
    conduit.backstage.serviceLayer.serviceDataManager.addService({
        name: serviceName,
        url: serviceMapUrl,
        interval: 10000000,
        callback: loadServiceMapData,
        cbFail: cbFailServiceMap,
        errorInterval: 10 * 60 * 1000,
        retryIterations: 2,
        runNow: true,
        enabledInHidden: true
    });

    conduit.subscribe("onLoginChange", function () {
        var newActiveCTID = conduit.backstage.serviceLayer.login.getActiveCTID();
        if (activeCTID != newActiveCTID) {
            replaceActiveCTID(newActiveCTID);
        }
    });

    return {
        getItemByName: function (itemName) {
            if (typeof (itemName) !== "string")
                return null;

            return (serviceMapData && serviceMapData.services) ? serviceMapData.services[itemName] : undefined;
        },
        getItemsByName: function (itemNames) {
            var items = {},
                    itemsCount = itemNames ? itemNames.length : 0;

            for (var i = 0; i < itemsCount; i++) {
                var item = this.getItemByName(itemNames[i]);
                if (item)
                    items[item.name] = item;
            }

            return items;
        },
        replaceActiveCTID: replaceActiveCTID,
        Constants: Constants
    };
})());

conduit.register("backstage.serviceLayer.toolbarGrouping", (function () {
    var serviceName = "toolbarGrouping",
        service,
        serviceData,
		activeCTID,
		activeToolbarName,
		activeDownloadUrl,
        ctid = conduit.abstractionlayer.commons.context.getCTID().result,
        osInfo = conduit.abstractionlayer.commons.environment.getOSInfo().result,
		toolbarName = conduit.abstractionlayer.commons.context.getToolbarName().result,
		downloadUrl = conduit.abstractionlayer.commons.context.getDownloadUrl().result,
        repository = conduit.coreLibs.repository,
		Constants = conduit.backstage.serviceLayer.serviceMap.Constants;


    function notifyReady() {
        conduit.triggerEvent("onToolbarGroupingChanged", getActiveCTID());
    }

    function loadToolbarGrouping(data, isPreProcessed) {
        activeCTID = ctid;
        activeToolbarName = toolbarName;
        activeDownloadUrl = downloadUrl;

        var xml = $.parseXML(data);
        var xmlObj = $(xml);
        var ctidByLocale = xmlObj.find('CTID_BY_LOCALE').text();
        if (ctidByLocale) {
            activeCTID = ctidByLocale;
            var childArr = xmlObj.find('COMMUNITIES').children();
            if (childArr)
                childArr.each(function (i, node) {
                    var id = $(node).find('CTID').text();
                    if (id && id.toLowerCase() == activeCTID.toLowerCase()) {
                        var name = $(node).find('NAME').text();
                        if (name) {
                            activeToolbarName = name;
                        }
                        var url = $(node).find('INSTALLATION_URL').text();
                        if (url) {
                            activeDownloadUrl = activeDownloadUrl.replace(activeDownloadUrl.match(/(?:http:\/\/([^.]+))/i)[1], url);
                        }
                    }
                });

        }
        // we found the community with the same os locale.
        // we will take its ctid and it will be used as the active ctid of the toolbar. 
        //It will be used in the toolbar settings service and in any other service url.						        

        repository.setLocalData(Constants.groupingInvokedKey, "true", function () { });
        repository.setLocalData(Constants.activeCTIDKey, activeCTID, function () { });
        repository.setLocalData(Constants.activeToolbarName, activeToolbarName, function () { });
        repository.setLocalData(Constants.activeDownloadUrl, activeDownloadUrl, function () { });

        conduit.triggerEvent("onReady", { name: serviceName });
        notifyReady();

        return data;
    }

    function init() {

        //  ******  This service is currently not supported. we will set the default values. *******
        // unmark this when this service is active again.

        activeCTID = ctid;
        activeToolbarName = toolbarName;
        activeDownloadUrl = downloadUrl;

        repository.setLocalData(Constants.groupingInvokedKey, "true",function () { });
        repository.setLocalData(Constants.activeCTIDKey, activeCTID, function () { });
        repository.setLocalData(Constants.activeToolbarName, activeToolbarName, function () { });
        repository.setLocalData(Constants.activeDownloadUrl, activeDownloadUrl, function () { });

        conduit.triggerEvent("onReady", { name: serviceName });

        //*************************************************************************************************

        /*

        var value = repository.getLocalData(Constants.groupingInvokedKey);
        if (value && value.data == "true") {
        var value = repository.getLocalData(Constants.activeCTIDKey);
        activeCTID = value.data;
        value = repository.getLocalData(Constants.activeToolbarName);
        activeToolbarName = value.data;
        value = repository.getLocalData(Constants.activeDownloadUrl);
        activeDownloadUrl = value.data;
        // we already invoked the toolbar grouping service.
        // we do not need to add this service again.

        conduit.triggerEvent("onReady", { name: serviceName });
        notifyReady();
        return;
        }

        serviceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("ToolbarGrouping");
        //http: //grouping.services.conduit.com/GroupingRequest.ctp?type=GetGroup&ctid=EB_ORIGINAL_CTID&lut=0&locale=EB_OS_LOCALE
        serviceData.url = serviceData.url.replace(/EB_OS_LOCALE/g, osInfo.locale);

        service = conduit.backstage.serviceLayer.serviceDataManager.addService({
        name: serviceName,
        url: serviceData.url,
        callback: loadToolbarGrouping,
        manualInvoke: true
        });
        service.invoke();

        */

        if (conduit.backstage.serviceLayer.toolbarGrouping.init)
            delete conduit.backstage.serviceLayer.toolbarGrouping.init;
    }


    function invokeService() {
        service.invoke();
    }

    function getActiveCTID() {
        return activeCTID;
    }

    function getActiveToolbarName() {
        return activeToolbarName;
    }

    function getActiveDownloadUrl() {
        return activeDownloadUrl;
    }

    function getActiveData() {
        return JSON.stringify({ activeCTID: activeCTID, activeToolbarName: activeToolbarName, activeDownloadUrl: activeDownloadUrl });
    }

    // If there's a new URL or interval for the service, update the service:
    conduit.subscribe("onServiceMapChange", function () {
        var currentServiceData = conduit.backstage.serviceLayer.serviceMap.getItemByName(serviceName);

        if (currentServiceData.url !== serviceData.url || currentServiceData.reload_interval_sec !== serviceData.reload_interval_sec) {
            conduit.backstage.serviceLayer.serviceDataManager.update(service, { url: currentServiceData.url, interval: currentServiceData.reload_interval_sec * 1000 }, true);
        }
    });

    return {
        getActiveCTID: getActiveCTID,
        getActiveToolbarName: getActiveToolbarName,
        getActiveDownloadUrl: getActiveDownloadUrl,
        getActiveData: getActiveData,
        init: init
    }

})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.toolbarGrouping,
    dependencies: ["serviceMap"],
    onLoad: conduit.backstage.serviceLayer.toolbarGrouping.init
});

conduit.register("backstage.serviceLayer.webAppSettings", (function () {


    var serviceName = "webAppSettings";
    var serviceData;
    var absCommons = conduit.abstractionlayer.commons;
	var absRepository = conduit.abstractionlayer.commons.repository;
	var ctid = absCommons.context.getCTID().result;
	var stagedWebappsKeyName = ctid + '.stagedWebapps';
    var webAppInfoKeyName = ctid + '.webAppInfo';
    var webappsMap = new HashMap();
    var logger = conduit.coreLibs.logger;        
    var resourcesBasePath = ''; // TODO move to a sync way absCommons.environment.getResourcesBasePath().result;
    var repositoryPath = ''; // TODO move to a sync way (absCommons.environment.getRepositoryPath && absCommons.environment.getRepositoryPath() && absCommons.environment.getRepositoryPath().result) ? (absCommons.environment.getRepositoryPath().result).replace('file:///', "").replace(/[/\\]+/g, "\\") : "";
    var webappsDirectoryName = "\\webapps";
    var repositoryWebAppFilesPath = repositoryPath + webappsDirectoryName;        
    var webAppDirectory = resourcesBasePath + webappsDirectoryName;
    var serviceDataManager = conduit.backstage.serviceLayer.serviceDataManager;		


    function notifyReady() {
        conduit.abstractionlayer.commons.messages.postTopicMsg(
		"systemRequest.webAppSettingsReady",
		"conduit.backstage.serviceLayer.webAppSettings");
    }


    function loadWebAppSettings(data, isPreProcessed) {
       if (!isPreProcessed){		
            data = JSON.parse(data);
			
			var appGuid = data.WebAppID;

            var webAppData = webappsMap.GetByID(appGuid);
            //TODO what if we failed to get webAppData?
			var appId = webAppData.appId;
			var refresh = webAppData.refresh;
			if (refresh){
				webAppData.refresh = false;
				webappsMap.Replace(appGuid, webAppData);				
			}
			
            downloadWebApp(appGuid, appId, data, refresh);	
        }

        conduit.triggerEvent("onReady", { name: serviceName });
       // notifyReady();

        return data;
       }

    function init(initData) {
    
        initData = initData || {};

        serviceData = initData.serviceData || conduit.backstage.serviceLayer.serviceMap.getItemByName("WebAppSettings");
        
        //TODO delete old versions of webapps
        if (serviceData) {
            //list of webapps as appGuids
            var webApps = conduit.backstage.serviceLayer.config.toolbarSettings.getWebApps();
			var userWebApps = conduit.backstage.serviceLayer.userApps.getWebApps();
			initWebAppSettings(webApps, "toolbarSettings");
			initWebAppSettings(userWebApps, "userApps");
        }


        if (conduit.backstage.serviceLayer.webAppSettings.init)
            delete conduit.backstage.serviceLayer.webAppSettings.init;
    
    }
	
	function initWebAppSettings(webApps, settingsType, refresh){
		var appData,
			isPlaceHolder = false;            
		for (index in webApps) {
			appData = webApps[index];			
			if (!appData.pages){
				//if settings are for placeholder
				isPlaceHolder = true;
			}

			if (!appData.isDeveloperApp){
				// only if this is a webapp with all the information and not from the settings.
				invokeWebAppService(appData.webappGuid, appData.appId, serviceData, refresh, settingsType, isPlaceHolder);
			}
		}	
	}

    function invokeWebAppService(appGuid, appId, serviceData, refresh, settingsType, isPlaceHolder, intervalSettingsChange, publisherServiceData){
        refresh = (refresh != undefined) ? refresh : false;

		var webAppData = webappsMap.GetByID(appGuid);

		if (webAppData){
            webAppData.intervalSettingsChange = intervalSettingsChange;
			if (webAppData.service){
				// if settings are for placeholder or, user clicked refresh
                var originalUrl = webAppData.service.url;
				if (refresh){
					webAppData.refresh = true;
					webappsMap.Replace(appGuid, webAppData);
                    if (publisherServiceData){
                        webAppData.service.url = publisherServiceData.url.replace('WEB_APP_GUID', appGuid).replace('WEB_APP_PURPOSE', "AutoUpdate").replace('WEB_APP_VERSION', getWebAppVersion(appGuid));
                    }	
					webAppData.service.invoke();
                    webAppData.service.url = originalUrl;
                    					
				}

			}	
		}
		else{
			refresh = refresh || isPlaceHolder;
			addService(appGuid, appId, serviceData, refresh, settingsType, intervalSettingsChange, publisherServiceData);
		}			          
    }
	
	function addService (appGuid, appId, serviceData, refresh, settingsType, intervalSettingsChange, publisherServiceData){
        var service;
        var webAppVersion = getWebAppVersion(appGuid);
        var webAppPurpose = "NewDownload";
        if (webAppVersion){
            webAppPurpose = "AutoUpdate";
        }
        else{
            webAppPurpose = "NewDownload";
            webAppVersion = "";
        }

        var serviceUrl = serviceData.url.replace('WEB_APP_GUID', appGuid).replace('WEB_APP_PURPOSE', webAppPurpose).replace('WEB_APP_VERSION', webAppVersion);
        var currentServiceName = serviceName + "." + appGuid;

		webappsMap.Replace(appGuid, {appId: appId, settingsType: settingsType, refresh: refresh, intervalSettingsChange: intervalSettingsChange});
		
        conduit.backstage.serviceLayer.serviceDataManager.addService({
            name: currentServiceName,
            url: serviceUrl,
            interval: serviceData.reload_interval_sec * 1000,
            callback: loadWebAppSettings
        },function(returnedService){
            service= returnedService;
            var webAppData = webappsMap.GetByID(appGuid);
            webAppData.service = service;
		    webappsMap.Replace(appGuid, webAppData);

            if (refresh){
                if (publisherServiceData){
                    service.url = publisherServiceData.url.replace('WEB_APP_GUID', appGuid).replace('WEB_APP_PURPOSE', webAppPurpose).replace('WEB_APP_VERSION', webAppVersion);
                }
                service.invoke();
            }		
	      });
          }
    /* TODO: rethink what todo on service map update
    //toolabr settings are part of update flow that might cause by manual refresh, interval update, service map update
    conduit.subscribe("onSettingsReady", function (data) {
        if (data.serviceMapChange ) { //only if service map was changed            
            var currentServiceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("WebAppSettings");
            if (currentServiceData.url !== serviceData.url || currentServiceData.reload_interval_sec !== serviceData.reload_interval_sec ) {                    
                //WebAppSettings data was changed run update on the service
                serviceDataManager.update(service, { url: currentServiceData.url, interval: currentServiceData.reload_interval_sec * 1000 }, data.forceUpdate);
            }
        }
    });  
    */        
   
    function invokeService() {
        //TODO: implement
    }


	
	function handleWebApp(appGuid, appId, refresh, settingsType, intervalSettingsChange, publisherSettings) {		
		// get service url from serviceMap for webappSettings. use it and get the download URL.
		//use the download URL to download the zip file
        var publisherServiceData;
        var serviceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("WebAppSettings");
        if (publisherSettings){
            publisherServiceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("WebAppSettingsNC");
        }
        if(serviceData){
		    invokeWebAppService(appGuid, appId, serviceData, refresh, settingsType, false, intervalSettingsChange, publisherServiceData);
        }												
	}

	function handleSettingsWebApp(appGuid, appId, refresh, settingsType, intervalSettingsChange, publisherSettings) {		
		handleWebApp(appGuid, appId, refresh, "toolbarSettings", intervalSettingsChange, publisherSettings);													
	}
	
	function handleUserApp(appGuid, appId, refresh, intervalSettingsChange){
		handleWebApp(appGuid, appId, refresh, "userApps", intervalSettingsChange);
	}

    function getWebAppVersion(appGuid){
        
        var value = absRepository.getKey(webAppInfoKeyName);	
        if (value && value.result && !value.status) {
            var webAppInfo =  JSON.parse(value.result);            
            if (webAppInfo.webApps && webAppInfo.webApps[appGuid]){
                return webAppInfo.webApps[appGuid].version
            }
            //{webApps: {12345: {version : 1.0}} }
        }	

        return null;      
    }

    function checkIfToolbarVersionUpdated (){
        var toolbarVersionUpdated = false;
        var webAppInfo = {};
        var toolbarVersion = conduit.abstractionlayer.commons.environment.getEngineVersion().result;

        var value = absRepository.getKey(webAppInfoKeyName);	
        if (value && value.result && !value.status) {
            webAppInfo =  JSON.parse(value.result);            
            if (!webAppInfo.toolbarVersion || webAppInfo.toolbarVersion != toolbarVersion){
                toolbarVersionUpdated = true;
                webAppInfo.toolbarVersion = toolbarVersion;
                absRepository.setKey(webAppInfoKeyName, JSON.stringify(webAppInfo));
            }
        }
        else{
            webAppInfo.toolbarVersion = toolbarVersion;
            absRepository.setKey(webAppInfoKeyName, JSON.stringify(webAppInfo));
        }
        return toolbarVersionUpdated;
    }

    function clearWebAppInfo(appGuid){
        var value = absRepository.getKey(webAppInfoKeyName);	
        if (value && value.result && !value.status) {
            var webAppInfo =  JSON.parse(value.result);            
            if (webAppInfo.webApps && webAppInfo.webApps[appGuid]){
                delete webAppInfo.webApps[appGuid];
                absRepository.setKey(webAppInfoKeyName, JSON.stringify(webAppInfo));
            }
            //{12345: {version : 1.0}, }
        } 
    }

    function updateWebAppInfo(appGuid, serviceUrl, serviceName){
        var value = absRepository.getKey(webAppInfoKeyName);	
        if (value && value.result && !value.status) {
            var webAppInfo =  JSON.parse(value.result);            
            if (webAppInfo.webApps && webAppInfo.webApps[appGuid]){
                webAppInfo.webApps[appGuid].serviceUrl = serviceUrl;
                webAppInfo.webApps[appGuid].serviceName = serviceName;
                absRepository.setKey(webAppInfoKeyName, JSON.stringify(webAppInfo));
            }
            //{12345: {version : 1.0, serviceUrl: http://blabla}, }
        }         
    }
    
    //TODO use this function in all relevant places
    function getWebAppInfo(){
        var value = absRepository.getKey(webAppInfoKeyName);	
        if (value && value.result && !value.status) {
            var webAppInfo =  JSON.parse(value.result);            
            return webAppInfo;
        }
        return null;
    }
	
	function downloadWebApp(appGuid, appId, returnData, refresh){
        var installedVersion = getWebAppVersion(appGuid);
        installedVersion = installedVersion ? installedVersion : "";		
		var downloadUrl = returnData.DownloadUrl;
        var fileName = appGuid + ".zip";
		var webappVersion = returnData.DisplayVersion;
        var webAppRelativePath = webappsDirectoryName + "\\" + appGuid + "_" + webappVersion;    
        var webAppFullPath = webAppDirectory + "\\" + appGuid + "_" + webappVersion;        
        var currentWebAppFullPath = webAppDirectory + "\\" + appGuid + "_" + installedVersion;

		// before downloading the zip we will check if the version of the webapp is different from the current version (if exists).
		// if it is the same version, we will not download.
		
		if (installedVersion){
            
            // AUTO UPDATE check : check if the toolbar was auto updated.
          checkAndHandleAutoUpdate(downloadUrl, currentWebAppFullPath, webAppFullPath, webAppRelativePath, fileName, appGuid, appId, returnData,function(res){
                // this is an indication for auto update. 
                if (res){
                   return;    
                }    

            if(installedVersion != webappVersion) {		
			    //There is an installed webapp with an older version
			    // download the zip only if the new webApp has a different version. download it to staged folder
                var staged = refresh === true ? false : true; 
                downloadAndExtract(downloadUrl, webAppFullPath, webAppRelativePath, fileName, appGuid, appId, staged, returnData)												
			}
			else{
				// just update settings and reload the app
                if (refresh){
				    extractWebApp(appGuid, appId, webAppRelativePath, webAppFullPath, false, returnData);
                }
			}
            });			
        }
		else{
			// this is a new webApp            
            downloadAndExtract(downloadUrl, webAppFullPath, webAppRelativePath, fileName, appGuid, appId, false, returnData)			
		}  							
	}

    function checkAndHandleAutoUpdate(downloadUrl, currentWebAppFullPath, webAppFullPath, webAppRelativePath, fileName, appGuid, appId, data,callback){
        var autoUpdateOccured = false;

        // Chrome AUTO UPDATE check : check if the toolbar was auto updated.
        // we will check if the specific webapp folder and files exists. 
        // only in Chrome, the webapps folder is in the extension and it will be lost when toolbar is updated.
        // this will not happen in other platforms since the webapps folder is in the repository. but it is still a good way
        // to check if the webapps folder is curropted for some reason.
		 absCommons.files.isDirectoryExists(currentWebAppFullPath,function(response){
            var isDirectoryExists =response.result;
            absCommons.files.isFileExists(currentWebAppFullPath + "\\manifest.json",function(res){
                var isManifestFileExists = res.result;
		        if (!isDirectoryExists || !isManifestFileExists) {//TODO how to check the files? maybe manifest.json! 
                     autoUpdateOccured = true;           
                    // this is an indication for auto update. we need to extract the zip from the repository if exists.
                      absCommons.files.isFileExists(repositoryWebAppFilesPath + "\\" + appGuid + ".zip",function(resp){
                             var isZipFileExists = resp.result;
                            if (isZipFileExists){
                                // extract the old zip
                                extractFile( webAppFullPath, webAppRelativePath, fileName, appGuid, appId, false, data);
                            }
                            else{
                                // no webapp folder and no zip. we need to download and extract.
                                downloadAndExtract(downloadUrl, webAppFullPath, webAppRelativePath, fileName, appGuid, appId, false, data);
                            }
                            if (callback){
                              callback(autoUpdateOccured);
                            }
                        });
		 
                     }else{
                       if (callback){
                          callback(autoUpdateOccured);
                        }
                     }

                        
                 
             });
         });          
    }

    function downloadAndExtract(downloadUrl, webAppFullPath, webAppRelativePath, fileName, appGuid, appId, staged, data){
            //clearWebAppInfo(appGuid);
            createRepositoryWebAppsDirectory();
            conduit.abstractionlayer.commons.http.httpDownloadFile(downloadUrl, webappsDirectoryName, fileName, 0, function(response){           
                if (response && !response.status){
                    extractFile( webAppFullPath, webAppRelativePath, fileName, appGuid, appId, staged, data);
                }
                else{
                    var description = "we failed to download the external webapp zip file with url: " + downloadUrl + " for webapp with appId: " + appId + ". we will remove the place holder ONLY from the view and wait for the next attempt."
                    logger.logError(description, { className: "webAppSettings", functionName: "downloadAndExtract" }, { code: logger.getCodeByServiceName(serviceName), name: serviceName});
                    removeAppFromView(appId);                  
                }
            });    
    }

    function extractFile( webAppFullPath, webAppRelativePath, fileName, appGuid, appId, staged, data){
        
        createWebAppDirectory(webAppFullPath, webAppRelativePath);
		conduit.abstractionlayer.backstage.compression.extract(repositoryWebAppFilesPath, fileName,  webAppRelativePath, true, function(response){
			//TODO when do I delete the zip
            if (response && !response.status){
                extractWebApp(appGuid, appId, webAppRelativePath, webAppFullPath, staged, data);		
            }
			else{
				// we failed to extract the file. lets remove the place holder ONLY and wait for the next attempt.			
                var description = "we failed to extract the external webapp zip file: " + fileName + " for webapp with appId: " + appId + ". we will remove the place holder ONLY from the view and wait for the next attempt."
                logger.logError(description, { className: "webAppSettings", functionName: "extractFile" }, { code: logger.getCodeByServiceName(serviceName)});
                removeAppFromView(appId);   
			}
			        
		});	
    }

    function removeAppFromView(appId){
		//remove place holder from view.
		var appData = {appId: appId};
		conduit.abstractionlayer.commons.messages.postTopicMsg("applicationLayer.appManager.view", "applicationLayer.appManager.model",
			JSON.stringify({ method: "removePlaceHolder", data: appData }));    
    }
	
	function createWebAppDirectory(webAppFullPath, webAppRelativePath){
		absCommons.files.isDirectoryExists(webAppFullPath,function(response){
            var isDirectoryExists = response.result;
		    if (isDirectoryExists) {
                absCommons.appFiles.removeApp(webAppRelativePath);			
		    }	
            absCommons.files.createDirectory(webAppFullPath,function(){});
        });	
	}


		
	function createRepositoryWebAppsDirectory(){
        var toolbarVersionUpdated = checkIfToolbarVersionUpdated();
		 absCommons.files.isDirectoryExists(repositoryWebAppFilesPath,function(response){
         var isDirectoryExists =response.result;
		if (!isDirectoryExists) {
            absCommons.files.createDirectory(repositoryWebAppFilesPath,function(){
                absCommons.appFiles.deployBrowserAppApi(webappsDirectoryName);
                return;
            });
		}
        // check if the browserAppApi file exists
        // when toolbar version was updated, we must override the browserAppApi.js
          absCommons.files.isFileExists(webAppDirectory + "\\browserAppApi.js",function(resp){
          var isBrowserAppApiFileExists = resp.result; 
		  if (!isBrowserAppApiFileExists || toolbarVersionUpdated) {
             absCommons.appFiles.deployBrowserAppApi(webappsDirectoryName);		
	     	} 
          });
        });             
	}
	
	function loadManifestData(webAppRelativePath){
		var manifestResult = conduit.abstractionlayer.commons.appFiles.readWebappFile(webAppRelativePath + '\\manifest.json');
		if (manifestResult && !manifestResult.status){
			var manifestData = manifestResult.result;
			// got the manifest as string.
            try{
                var manifest = JSON.parse(manifestData);
			    return manifest;            
            }
            catch(exception){
                result = {result: false, description: "The 'manifest.json' file is not in legal JSON format: "+ exception.message, status: 745};
				return result;
            }
		}
	}
	
	/* desc: add view related properties to manifest like icon , scroll and etc... 
        @manifestData - manifest object(mandatory)
        @prop.appGuid - application guid (mandatory)
        @prop.appId - application id (mandatory)
        @prop.appType - application type (default='WEBAPP')
        @prop.isDeveloperApp - (default=false)
        @prop.webAppFullPath - full path to webapp folder
        @return - 'false' on missing mandatory , other case 'true'
    */
    function addViewSettings(manifestData,prop){
        if(!manifestData || !prop ||  !prop.webappGuid || !prop.appId){
            return false;
        }
        
        manifestData.appType = prop.appType || 'WEBAPP';
		if (manifestData.pages && manifestData.pages.background){
			manifestData.pages.bgpage = manifestData.pages.background;
            delete manifestData.pages.background;
		}
		manifestData.webappGuid = prop.webappGuid;
		manifestData.appId = prop.appId;
		manifestData.allowScroll = manifestData.popupSettings && (manifestData.popupSettings.allowScroll !== undefined) ? manifestData.popupSettings.allowScroll : true;
		manifestData.displayIcon = getWebAppDisplayIcon(manifestData, prop.webAppRelativePath);
        manifestData.viewData = {icon: manifestData.displayIcon};
		manifestData.displayText = manifestData.icon && manifestData.icon.text ? manifestData.icon.text : null;
        manifestData.viewData.text = manifestData.displayText;
        manifestData.viewData.tooltip = manifestData.icon && manifestData.icon.tooltip ? manifestData.icon.tooltip : null;
        manifestData.isDeveloperApp=!!prop.isDeveloperApp;
        delete manifestData.icon;

        if (prop.data){
            manifestData.data = {};
            if (prop.data.apiPermissions){
                manifestData.data.apiPermissions = prop.data.apiPermissions;
            }
            if (prop.data.ExtraParams){
                if (prop.data.ExtraParams.apiPermissions){
                    manifestData.data.apiPermissions = prop.data.ExtraParams.apiPermissions;
                }
                if (prop.data.ExtraParams.isUntrusted !== undefined){
                    manifestData.data.isUntrusted = prop.data.ExtraParams.isUntrusted;
                }
            }            
        }
        return true;
    }//method

    function getWebAppDisplayIcon(manifestData, webAppRelativePath){
        var displayIcon = manifestData.icon && manifestData.icon.image ? manifestData.icon.image : null;
        if (displayIcon){
             if (!/^http/i.test(displayIcon)) {
                // relative path, no url
                displayIcon = absCommons.environment.getResourcesBasePathURI().result + webAppRelativePath +  "\\" + displayIcon;				
             }
        }
        return displayIcon;
    }

	function extractWebApp(appGuid, appId, webAppRelativePath, webAppFullPath, staged, data){		
		
		// load the manifest file.
		var manifestData = loadManifestData(webAppRelativePath);
		if (manifestData && !manifestData.status){
            addViewSettings(manifestData,{'webappGuid':appGuid,'appId':appId, 'webAppRelativePath' : webAppRelativePath, 'data': data});

			//TODO(consider): deleting unwanted elements from the manifest.		
		}
		else{
			//we failed to load manifest file.
            var description = "we failed to load manifest file for webapp with appId: " + appId + ". we will remove the place holder ONLY from the view and wait for the next attempt."
            logger.logError(description, { className: "webAppSettings", functionName: "extractWebApp" }, { code: logger.getCodeByServiceName(serviceName), name: serviceName});
            removeAppFromView(appId);            
			return;
		}		
		var webAppData = webappsMap.GetByID(appGuid);
        if (webAppData.intervalSettingsChange){
            staged = true;
        }
		var response = {manifestData: manifestData, staged: staged};

		if (staged){
			// create a list and set it in the repository
			//ofir
			absRepository.setKey(stagedWebappsKeyName, "true");								
		}
		
		var versionUpdated = updateWebAppInfoVersion(appGuid, manifestData);
		response.versionUpdated = versionUpdated;
		
		if (webAppData.settingsType == "userApps"){
			//conduit.backstage.serviceLayer.userApps.addWebappToSettings(response);
            response.manifestData.isUserWebApp = true;
			setTimeout(function (){conduit.backstage.serviceLayer.userApps.addWebappToSettings(response); }, 2000);//TODO fix this
		}
		else{
			setTimeout(function (){conduit.backstage.serviceLayer.config.toolbarSettings.addWebappToSettings(response); }, 2000);//TODO fix this
			//conduit.backstage.serviceLayer.config.toolbarSettings.addWebappToSettings(response);
		}

        //add url to webappinfo, for stoping the service when this app is removed.
        var webAppData = webappsMap.GetByID(appGuid);
        if (webAppData && webAppData.service){
           updateWebAppInfo(appGuid, webAppData.service.url, webAppData.service.name); 
        }
        
        webappsMap.Remove(appGuid);
	}

    function updateWebAppInfoVersion(appGuid, manifestData){
		var versionUpdated = false;
        var setKey = true;
		var webAppInfo = {webApps: {}};
        var value = absRepository.getKey(webAppInfoKeyName);	
        if (value && value.result && !value.status) {
            var webAppInfo =  JSON.parse(value.result);
            if (webAppInfo.webApps){
                if (webAppInfo.webApps[appGuid]){
				    if (webAppInfo.webApps[appGuid].version !== manifestData.version){
					    versionUpdated = true; // we got a new version
				    }
                    else{
                        setKey = false;
                    }
                    webAppInfo.webApps[appGuid].version = manifestData.version;
                }
                else{
                    webAppInfo.webApps[appGuid] = {version : manifestData.version};
                }                
                //{12345: {version : 1.0}, }            
            }
            else{
                webAppInfo.webApps = {};
                webAppInfo.webApps[appGuid] = {version : manifestData.version};
            }         
        }
        else{       
            webAppInfo.webApps[appGuid] = {version : manifestData.version};
        }
		
        if (setKey){
            absRepository.setKey(webAppInfoKeyName, JSON.stringify(webAppInfo));
        }

		return versionUpdated;        	    
    }
    
    
	function clearStagedWebapps(){		
        conduit.coreLibs.config.clearStagedWebapps();
	}
	
	function isStagedWebappsAvailable(){
        return conduit.coreLibs.config.isStagedWebappsAvailable();
	}

    function removeService(appGuid){
		var webAppInfo = getWebAppInfo();

		if (webAppInfo.webApps && webAppInfo.webApps[appGuid]){
            var serviceUrl = webAppInfo.webApps[appGuid].serviceUrl;
            var serviceName = webAppInfo.webApps[appGuid].serviceName;
            
            serviceDataManager.stopService(serviceUrl);
            serviceDataManager.removeService(serviceName);
            //TODO remove the service data file from the repository.
            serviceDataManager.removeLastUpdateKey({interval_name: appGuid, name: serviceName});   
            clearWebAppInfo(appGuid);
        }     
    }



    return {
        init: init,
        refresh: invokeService,//TODO ?
        handleSettingsWebApp: handleSettingsWebApp,
		handleUserApp: handleUserApp,
		isStagedWebappsAvailable: isStagedWebappsAvailable,
		clearStagedWebapps: clearStagedWebapps,
        loadManifestData:loadManifestData,
        addViewSettings:addViewSettings,
        removeService: removeService
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.webAppSettings,
    dependencies: ["serviceMap", "toolbarSettings"],
    onLoad: conduit.backstage.serviceLayer.webAppSettings.init
});
﻿conduit.register("backstage.serviceLayer.config.toolbarSettings", (function () {
    var settingsData;
    var dataToRepository;
    var serviceName = "toolbarSettings";
    var service;
    var serviceData;
    var forceRefreshService;
    var serviceLayer = conduit.backstage.serviceLayer;
    var serviceDataManager = serviceLayer.serviceDataManager;
    var xml2jsonOptions = serviceLayer.commons.xml2jsonOptions;
    var setViewData = serviceLayer.commons.setViewData;
    var locale;
    var webappSettings = serviceLayer.webAppSettings;
    var logger = conduit.coreLibs.logger;
    var clone = conduit.utils.general.clone;
    var messaging = conduit.abstractionlayer.commons.messages;
    var addListener = messaging.onSysReq.addListener;
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
    var isFF = /Firefox/i.test(browserInfo.type);
    var isIE = /IE/i.test(browserInfo.type);
    var isChrome = /Chrome/i.test(browserInfo.type);
    var isSafari = /Safari/i.test(browserInfo.type);
    var isDebug = false;

    function isDisabled(appdata) {
        var blockedGuids = ['31600d5c-4a58-45d5-90f3-044e74c32fd4', '568427a5-62f1-47b1-990c-01f3ba9815be'];

        if (~blockedGuids.indexOf(appdata.data && appdata.data.appGuid)) {
            return true;
        }
        if (appdata.appType == "DYNAMIC_MENU") {
            if (appdata.appId == "8785018277646100624") {
                return true;
            }
            if (appdata.appId == "7158365664156641424") {
                return true;
            }
            if (appdata.displayText == "MS Office Shortcuts") {
                return true;
            }
        }
        return false;
    }

    //in some rare cases an app can come with a command property
    //so we check it against a list, if doesnt exist we remove the app.	
    function isHasCommandAndValidate(appData) {
        var result;
        if (appData.data && appData.data.data && appData.data.data.command) {
            //check if valid command
            var command = appData.data.data.command.type;
            result = conduit.coreLibs.commands.isCommandSupported(command);
        }
        else {
            result = true;
        }
        return result;
    }

    /*
    An error calback in case we failed to get the service data
    returnValue - { responseData: responseData, url: serviceData.url, extraData: extraData, description: description, status: status }
    */
    function cbFailSettings(returnValue) {
        //TODO what to do incase of a failure.
        // we need to check if we have cached service data for the settings service.
        // if not we need to hide the toolbar and wait for the next error interval

        /*
        var cachedServiceData = conduit.backstage.serviceLayer.serviceDataManager.getData(serviceName);
        if (!cachedServiceData) {
        // hide the toolbar
        conduit.abstractionlayer.backstage.browser.showToolbar(false);
        }
        */
    }



    function loadSettingsData(xmlData, isPreProcessed, extraObj) {

        var isInit = typeof (settingsData) === "undefined";
        var isManualRefresh = extraObj && extraObj.isManualRefresh ? true : false;
        var isServiceMapChanged = extraObj && extraObj.serviceMapChanged ? true : false;
        var intervalSettingsChange = true; // indicates that settings service interval was finished.

        dataToRepository = null;


        function getAppFileUrl(appData, context, url) {
            var info = {
                appId: appData.appId,
                isUserApp: !!appData.isUserApp,
                context: context
            };

            return [url, "#appData=", encodeURIComponent(JSON.stringify(info))].join("");
        }

        if (isInit || isManualRefresh || isPreProcessed) {
            intervalSettingsChange = false;
        }

        if (isPreProcessed) {
            dataToRepository = xmlData;
        }
        else {

            try {

                var isPerformanceMode = conduit.coreLibs.config.isPerformanceMode();
                locale = xmlData.match(/\"locale\":\"([\w-]+)\"/)[1];
                conduit.coreLibs.aliasesManager.setAlias(conduit.coreLibs.aliasesManager.constants.EB_LOCALE, locale);
                var aliasesManager = conduit.coreLibs.aliasesManager;
                dataToRepository = JSON.parse(aliasesManager.replaceAliases(xmlData, null, null, [aliasesManager.constants.UM_ID, aliasesManager.constants.SB_CUI]).replace("\ufeff", "")).data;


                //set and fix some design issues.
                if (dataToRepository.design) {
                    var design = dataToRepository.design;
                    if (design.alignMode === "SYSTEM") {
                        design.alignMode = conduit.abstractionlayer.commons.environment.getBrowserInfo().direction || "LTR";
                    }
                    if (design.fontSize) {
                        //add pt suffix for font size without a type.
                        var size = design.fontSize;
                        if (!isNaN(size)) {
                            // is a number
                            design.fontSize += 'pt';
                        }
                    }
                    if (design.textDecoration) {
                        //fix bug from xml.
                        if (design.textDecoration === 'underlined') {
                            design.textDecoration = 'underline';
                        }
                    }
                }

                dataToRepository.generalData.locale = locale;
                // Apps:
                // First, merge LogoIcon and the first dynamic menu into main menu:

                var logoIcon = dataToRepository.apps[0],
					dynamicMenu = dataToRepository.apps[1],
					getAppData = conduit.backstage.serviceLayer.commons.processAppData,
					manifests = conduit.backstage.serviceLayer.config.manifest.getManifests(),
					blackList = ["FACEBOOK_COMP", "PRIVACY_COMPONENT", "APP_COMPONENT", "PLUGIN_APP", "WEBAPP"];

                if (isPerformanceMode) {
                    blackList.push("SEARCH"); // remove the search
                }

                dataToRepository.apps.splice(0, 2);
                var mainMenuData = setViewData($.extend(true, getAppData(dynamicMenu), getAppData(logoIcon), { appType: "MAIN_MENU" }, manifests["MAIN_MENU"]));
                if (mainMenuData &&
                    mainMenuData.data &&
                    mainMenuData.data.menu &&
                    mainMenuData.data.menu.data) {
                    conduit.coreLibs.logger.logDebug('2: Is mainMenuData items array? ' + (mainMenuData.data.menu.data.items instanceof Array), { className: "toolbarSettings", functionName: "loadSettingsData" });
                }

                mainMenuData.linkData = { url: mainMenuData.data.link, target: "SELF" };

                if (!isPerformanceMode) {
                    dataToRepository.apps.splice(0, 0, mainMenuData); // show the main menu when not in performance mode.
                }

                function isPersonalApp(appData, replacePersonalApp) {
                    if (appData.data && appData.data.personalComponentInfo) {
                        // currently only facebook
                        for (var i = 0, count = dataToRepository.personalApps.length; i < count; i++) {
                            var personalAppData = dataToRepository.personalApps[i];
                            if (personalAppData.data && personalAppData.data.personalComponentInfo && personalAppData.data.personalComponentInfo.type == appData.data.personalComponentInfo.type) {
                                personalAppData.isAlsoPublisherApp = true;
                                if (replacePersonalApp) {
                                    // we do not allow to have more than one app with the same type. we will override the personal app
                                    dataToRepository.personalApps[i] = appData;
                                    dataToRepository.personalApps[i].isAlsoPublisherApp = true;
                                }
                                return true;
                            }
                        }
                    }

                    for (var i = 0, count = dataToRepository.personalApps.length; i < count; i++) {
                        var personalAppData = dataToRepository.personalApps[i];
                        if (personalAppData.appType !== "BROWSER_COMPONENT" && personalAppData.appType === appData.appType) {
                            personalAppData.isAlsoPublisherApp = true;
                            if (replacePersonalApp) {
                                // we do not allow to have more than one app with the same type. we will override the personal app
                                dataToRepository.personalApps[i] = appData;
                                dataToRepository.personalApps[i].isAlsoPublisherApp = true;
                            }
                            return true;
                        }
                    }

                    return false;
                }


                if (isPerformanceMode) {
                    var manifest;
                    for (var i = 0, count = dataToRepository.apps.length; i < count; i++) {
                        var currentApp = dataToRepository.apps[i];
                        if (currentApp.appType == "TWITTER") {
                            var numberOfApps = currentApp.button.buttonTooltip;
                            if (numberOfApps && !isNaN(numberOfApps)) {
                                try {
                                    numberOfApps = parseInt(numberOfApps);
                                    for (var j = 0; j < numberOfApps; j++) {
                                        var newApp = $.extend({}, currentApp);
                                        newApp.appId = String(j);
                                        newApp.data.publicId = String(j);
                                        dataToRepository.apps.push(newApp);
                                    }
                                }
                                catch (e) {
                                }
                            }
                            manifest = manifests[currentApp.appType];
                            manifest.pages.bgpage = "bgpage_stub.html";
                            manifest.pages.embedded = "embedded_stub.html";
                            delete manifest.pages.popup;
                            manifest.embeddedSettings = { size: { width: 25} };
                            manifests[currentApp.appType] = manifest;
                        }
                        else if (currentApp.appType == "APPLICATION_BUTTON" || (currentApp.appType == "BUTTON" && currentApp.data && currentApp.data.data && currentApp.data.data.type == "APPLICATION")) {
                            manifest = manifests["APPLICATION_BUTTON"];
                            manifest.pages.bgpage = "bgpage_stub.html";
                            manifest.pages.embedded = "embedded_stub.html";
                            manifest.embeddedSettings = { size: { width: 25} };
                            manifests[currentApp.appType] = manifest;
                        }
                        else if (currentApp.appType == "MULTI_RSS") {
                            manifest = manifests[currentApp.appType];
                            manifest.pages.bgpage = "bgpage_stub.html";
                            manifest.pages.embedded = "embedded_stub.html";
                            delete manifest.pages.popup;
                            manifest.embeddedSettings = { size: { width: 25} };
                            manifests[currentApp.appType] = manifest;
                        }
                    }
                }

                var len = dataToRepository.apps.length;
                for (var i = 0; i < len; i++) {
                    var currentApp = dataToRepository.apps[i];

                    //apps that dont pass this test will be removed from the toolbar.
                    if (blackList.indexOf(currentApp.appType) < 0 && !isDisabled(currentApp) && isHasCommandAndValidate(currentApp)) {

                        if (currentApp.appType == "WEBAPP") {
                            addWebApp(currentApp, manifests, i, isManualRefresh, intervalSettingsChange, extraObj && extraObj.publisherSettings);
                            continue;
                        }

                        // if we get old price-gong that came from settings, we cahnge to our price-gong.                        
                        if (currentApp.data && (currentApp.data.appGuid === "1ec55dac-8dca-406b-9697-5d68893c1c0c"/* PG */ || currentApp.data.appGuid === "6ca16c0a-9443-4192-b595-c593d5bb051e"/* avanQuest global shopping app*/)) {
                            var oPriceGong = conduit.backstage.serviceLayer.optimizer.getPriceGongAppData();
                            currentApp = oPriceGong;
                        }

                        //we need to use the optimizer to decide if the app is pg or cb,                        
                        if (currentApp.data && currentApp.data.appGuid === "40d79af3-dd82-4256-902c-0d3d39ad5543" && false) {//disable optimizer

                            //send the data to the optimizer to make the http request.
                            conduit.backstage.serviceLayer.optimizer.init(currentApp, i, manifests);

                            //get data for simple place holder.
                            var placeHolder = conduit.backstage.serviceLayer.optimizer.gneratePlaceHolderObj(currentApp);

                            //override this app data with the place holder.	
                            dataToRepository.apps[i] = placeHolder;
                        }

                        else {
                            // Merge manifest data with settings data:
                            var appData = getAppData(currentApp);
                            if (isPersonalApp(appData, true))
                                appData.isPersonalApp = true;

                            appData = setViewData($.extend(true, appData, manifests[appData.appType]));
                            dataToRepository.apps[i] = appData;

                            if (appData.appType === "SEARCH") {
                                dataToRepository.generalData.defaultSearchUrl = appData.data.searchHookUrl;

                                var enlargeBoxResponse = conduit.abstractionlayer.commons.repository.getKey(ctid + ".enlargeSearchBox");

                                function setEnlargeBoxState(enabled) {
                                    if (enabled) {
                                        appData.viewData.embedded.size.width = appData.data.enlargeBox.width;
                                        appData.data.enlargeBox.enabled = true;
                                    } else {
                                        appData.data.enlargeBox = { enabled: false };
                                    }
                                }
                                if (appData.data.enlargeBox || !enlargeBoxResponse.status) {
                                    if (appData.data.enlargeBox) {
                                        var isFirstinstallation = !conduit.abstractionlayer.commons.repository.hasKey(ctid + ".firstTimeDialogOpened").result;
                                        var enlargeSearchBoxNewUserEnabled = isFirstinstallation && appData.data.enlargeBox.enabled.newUser;
                                        var enlargeSearchBoxExistingUserEnabled = !isFirstinstallation && appData.data.enlargeBox.enabled.existingUser;

                                        if (enlargeSearchBoxNewUserEnabled || enlargeSearchBoxExistingUserEnabled) {
                                            setEnlargeBoxState(true);
                                            conduit.abstractionlayer.commons.repository.setKey((ctid + ".enlargeSearchBox"), JSON.stringify(appData.data.enlargeBox));
                                        } else {
                                            setEnlargeBoxState(false);
                                        }
                                    } else {
                                        var enlargeBoxObj = JSON.parse(enlargeBoxResponse.result);

                                        appData.data.enlargeBox = {
                                            width: enlargeBoxObj.width,
                                            minWidth: enlargeBoxObj.minWidth,
                                            maxWidth: enlargeBoxObj.maxWidth
                                        };
                                        setEnlargeBoxState(true);
                                    }
                                } else {
                                    setEnlargeBoxState(false);
                                }
                            }
                        }
                    }
                    else {
                        //remove blacklist app from settings.
                        dataToRepository.apps.splice(i, 1);

                        //update length and index.
                        len--;
                        i--;
                    }
                }


                for (var i = dataToRepository.personalApps.length - 1; i >= 0; i--) {
                    var currentApp = dataToRepository.personalApps[i];
                    if (~blackList.indexOf(currentApp.appType))
                        dataToRepository.personalApps.splice(i, 1);
                    else {
                        var appData = getAppData(currentApp);
                        appData.isPersonalApp = true;
                        dataToRepository.personalApps[i] = setViewData($.extend(true, appData, manifests[appData.appType]));
                    }
                }

                // Standalone apps (which don't originate from the settings service):                
                var standaloneApps = conduit.backstage.serviceLayer.config.manifest.getStandaloneAppsData();

                for (standaloneAppType in standaloneApps) {
                    if (standaloneApps.hasOwnProperty(standaloneAppType)) {
                        var appData = $.extend({}, standaloneApps[standaloneAppType]);
                        appData.appType = standaloneAppType;
                        if (!appData.debug || isDebug) {
                            dataToRepository.apps.push(appData.renderView !== false ? setViewData(appData) : appData);
                        }
                    }
                }

                /*read permission to show toolbar from toolbar api and call abs method that save it as key*/
                var allowShowingHiddenToolbar = dataToRepository.generalData.allowShowingHiddenToolbar;
                if (typeof allowShowingHiddenToolbar != "undefined") {
                    conduit.abstractionlayer.backstage.browser.setShowPermission(allowShowingHiddenToolbar);
                }

            } // end try
            catch (e) {
                var dataFromServer = conduit.coreLibs.logger.getStringValuePrefix(xmlData);
                var description = "ToolbarSettings service error in callback. The first characters of the received xmlData: " + dataFromServer;
                try {
                    //check if we can parse the xmlData and add the result to the error description.
                    var parsed = JSON.parse(xmlData.replace("\ufeff", ""));
                }
                catch (e) {
                    description = 'Failed to parse settings. ' + description;
                }
                return { serviceUpdateFailed: true, errorData: { description: description, status: logger.getCodeByServiceName(serviceName), error: e} }
            }
        } // end else
        if (!intervalSettingsChange) {
            settingsData = dataToRepository;
            if (!isInit) {
                conduit.triggerEvent("onSettingsReady", { "serviceMapChange": isServiceMapChanged, internalUpdate: true, "settingsData": settingsData, forceUpdate: isServiceMapChanged }); //force update only if it was triggered by service map change
            }
        }
        if (intervalSettingsChange || isServiceMapChanged) {
            if (JSON.stringify(dataToRepository).length != JSON.stringify(settingsData).length || JSON.stringify(dataToRepository) != JSON.stringify(settingsData)) {
                conduit.coreLibs.repository.setLocalData("newSettings", true, false,function () { });
            }
        }
        if (isManualRefresh) {
            conduit.triggerEvent("serviceLayer.onSettings", null /* no data needed */);
            conduit.backstage.serviceLayer.userApps.refreshAllApps();
        }

        handleSettingsFeatureProtectorData(dataToRepository);

        if (isInit) {

            addListener("serviceLayer.settings.getSettingsData", function (data, sender, callback) {
                callback(JSON.stringify(settingsData));
            });

            conduit.triggerEvent("onReady", { name: serviceName });
            conduit.abstractionlayer.commons.messages.sendSysReq(
            "systemRequest.serviceLayerReady",
            "conduit.backstage.serviceLayer.config.toolbarSettings",
            "",
            function () { });
        }
        else {
            conduit.triggerEvent("onSettingsReady", { "serviceMapChange": isServiceMapChanged, internalUpdate: true, "settingsData": settingsData, forceUpdate: isServiceMapChanged });
        }

        /*
        //TODO check if WE hide the toolbar or the user
        if (conduit.abstractionlayer.backstage.browser.isHidden()) {
        conduit.abstractionlayer.backstage.browser.showToolbar(true);
        }
        */


        //preformance log
        if (isInit) {
            conduit.coreLibs.logger.performanceLog({
                from: "Toolbar Settings",
                action: "Toolbar Settings loaded: ",
                time: +new Date(),
                isWithState: ""
            });
        }
        return dataToRepository;
    }
    //for images caching
    function updateModel(data) {
        dataToRepository = data;
        service.updateData(dataToRepository);
        conduit.triggerEvent("onImagesCacheReady", "");
    }

    function saveAndReplaceImagesInSettingsObj() {
        conduit.coreLibs.imageCaching.saveAndReplaceImagesInSettingsObj(dataToRepository, updateModel)
    }

    function addWebApp(currentApp, manifests, index, isManualRefresh, intervalSettingsChange, publisherSettings) {

        // we will not set view data by default to this app if it is a place holder for a 'background page only' app.
        var isSetViewData = (!currentApp.pages && currentApp.data && currentApp.data.pageType == "Background") ? false : true;

        //if the get new settings because the user clicked refresh toolbar,
        //we dont want this code to run.
        if (!isManualRefresh) {

            //comparing new webapp settings, with old settings from cache.
            //get cached settings.
            serviceDataManager.getData(serviceName, function (cachedSettings) {  //TODO do not call this each time

                if (cachedSettings) {

                    //get all WEBAPP type.
                    var arrWebApps = getWebApps(cachedSettings);

                    var len = arrWebApps.length;
                    for (var i = 0; i < len; i++) {
                        var currWebApp = arrWebApps[i];

                        //found a match.
                        if (currentApp.data.webappGuid == currWebApp.webappGuid) {

                            //override new webapp settings with old settings from cache.
                            currentApp = currWebApp;

                            //no need for setviewData()
                            isSetViewData = false;
                            break;
                        }
                    }
                    continueAddWebAppFlow();
                } else {
                    continueAddWebAppFlow();
                }
            });
        } else {
            continueAddWebAppFlow();
        }

        function continueAddWebAppFlow() {
            if (isSetViewData) {
                appData = setViewData($.extend(true, currentApp, manifests[currentApp.appType]));
            }
            else {
                appData = currentApp;
            }

            appData.webappGuid = currentApp.data.webappGuid;
            // for the place holder we need icon (mandatory), text and tooltip (both optional)
            appData.icon = currentApp.data.icon;
            appData.text = currentApp.data.text;
            appData.tooltip = currentApp.data.tooltip;

            dataToRepository.apps[index] = appData;

            //download
            // get service url from serviceMap for webappSettings. use it and get the download URL.
            //use the download URL to download the zip file
            webappSettings.handleSettingsWebApp(appData.webappGuid, appData.appId, isManualRefresh, "toolbarSettings", intervalSettingsChange, publisherSettings);
        }
    }

    function init() {
        var serviceNameInMap = "ToolbarSettingsForSB";
        var isHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;
        if (isHidden) {
            serviceNameInMap = "ToolbarHiddenSettingsForSB";
        }
        serviceData = conduit.backstage.serviceLayer.serviceMap.getItemByName(serviceNameInMap);

        if (serviceData && serviceData.url) {
            // This is for ToolbarSettingsForSB and ToolbarSettingsPublisherForSB. it will return the most updated url of the settings
            serviceData.url = serviceData.url.replace('EB_PROTOCOL_VERSION', 2);
        }


        //serviceData.url = "http://localhost/settings/toolbarSettings.json"; // *** just for testing

        if (serviceData.reload_interval_sec === undefined || (serviceData.reload_interval_sec !== undefined && (isNaN(serviceData.reload_interval_sec) || typeof (serviceData.reload_interval_sec) !== "number" || serviceData.reload_interval_sec <= 0))) {
            var message = "Invalid value for serviceData.reload_interval_sec, expected a positive number.";
            logger.logError(message, { className: "toolbarSettings", functionName: "init" }, { code: logger.getCodeByServiceName(serviceName), name: serviceName });
            serviceData.reload_interval_sec = 7200; // default value
        }

        conduit.coreLibs.config.isDebug(function (isDebugRes) {

            isDebug = isDebugRes;
            // Start the service:
            serviceDataManager.addService({
                name: serviceName,
                url: serviceData.url,
                interval: serviceData.reload_interval_sec * 1000,
                callback: loadSettingsData,
                cbFail: cbFailSettings,
                errorInterval: 1 * 60 * 1000,
                retryIterations: 1,
                enabledInHidden: isHidden
            }, function (returnedService) {
                service = returnedService
                delete conduit.backstage.serviceLayer.config.toolbarSettings.init;

                addListener("serviceLayer.settings.refresh", function (force, sender, callback) {
                    invokeService(force === "true");
                    callback('');
                });
            });
        });
    }

    function refersh(force) {
        invokeService(force === "true");
    }

    function invokeService(force) {
        if (force) {
            if (typeof (forceRefreshServiceData) === "undefined") {
                var forceRefreshServiceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("ToolbarSettingsPublisherForSB");
                if (forceRefreshServiceData && forceRefreshServiceData.url) {
                    // This is for ToolbarSettingsForSB and ToolbarSettingsPublisherForSB. it will return the most updated url of the settings
                    forceRefreshServiceData.url = forceRefreshServiceData.url.replace('EB_PROTOCOL_VERSION', 2);
                }
                forceRefreshService = serviceDataManager.addService({
                    name: "ToolbarSettingsPublisherForSB",
                    cachedServiceName: serviceName,
                    url: forceRefreshServiceData.url,
                    callback: loadSettingsData,
                    manualInvoke: true
                }, function () {
                    invokeforceRefreshService();
                    continueInvokeServiceFlow();
                });
            } else {
                invokeforceRefreshService();
                continueInvokeServiceFlow();
            }



        }
        else {
            //the refresh command came from main menu..
            if (service) {
                service.headers = [{ name: "If-None-Match", value: "0"}];
                service.invoke(null, true, { isManualRefresh: true });
                service.headers = "";
            } else {
                logger.logError("Error invoking service: " + serviceName, { className: "toolbarSettings", functionName: "invokeService" }, { code: logger.getCodeByServiceName(serviceName), name: serviceName });
            }
            continueInvokeServiceFlow();
        }

        function invokeforceRefreshService() {
            forceRefreshService.invoke(null, true, { isManualRefresh: true, publisherSettings: true });
        }

        function continueInvokeServiceFlow() {
            if (conduit.backstage.serviceLayer.appsMetadata) {
                conduit.backstage.serviceLayer.appsMetadata.refresh();
            }
        }
    }

    function addWebappToSettings(response) {

        var webappData = response.manifestData;
        var staged = response.staged;
        var isPlaceHolder = true;
        webappData.renderView = false;

        var index = getAppIndex(webappData.appId);
        if (index > -1) {

            // view data will be set only for embedded or popup pages
            if (webappData.pages) {

                if (webappData.pages.embedded || webappData.pages.popup) {
                    setViewData(webappData);
                    webappData.renderView = true;
                    isPlaceHolder = false;
                }
                else {
                    delete webappData.viewData;
                }
            }

            if (!staged) {

                if (response.versionUpdated || isPlaceHolder) {
                    removeAndAddwebappToSettings(webappData, staged, index);
                }
                else {
                    addWebappToModelAndSettings(webappData, staged, index);
                }
            }
            else {
                var clonedSettingsData = $.extend({}, settingsData);

                clonedSettingsData.apps[index] = webappData;

                service.updateData(clonedSettingsData);
            }
        }
    }

    function removeAndAddwebappToSettings(webappData, staged, index) {
        webappData.renderView = false;
        //remove the current place holder
        var appOptions = {};
        appOptions[webappData.appId] = {
            disabled: true,
            isToRemove: true,
            appGuid: webappData.appGuid,
            appId: webappData.appId
        };

        var repositoryObj = { apps: appOptions, addPersonalApps: false };

        var obj = {
            method: "update",
            data: repositoryObj
        };
        conduit.abstractionlayer.commons.messages.sendSysReq("handleOptions", "options", JSON.stringify(obj), function (response) {

            if (response) {
                response = JSON.parse(response);
                if (response.result == false) {
                    var error = { "result": false, "status": 800, "description": 'Unexpected error, failed to remove app' };
                    throw new Error(error);
                }
                addWebappToModelAndSettings(webappData, staged, index);
            }
        });
    }

    function addWebappToModelAndSettings(webappData, staged, index) {
        if (index > -1) {

            settingsData.apps[index] = webappData;

            //TODO rename the logical name from serviceLayer.userApps to something else								
            service.updateData(settingsData);
            conduit.abstractionlayer.commons.messages.postTopicMsg(
			"serviceLayer.onUserAppsChange",
			"serviceLayer.userApps",
			JSON.stringify({ addedAppData: webappData }));
        }
    }

    function getAppIndex(appId) {
        for (var i = 0, count = settingsData.apps.length; i < count; i++) {
            var appData = settingsData.apps[i];
            if (appData.appId == appId) {
                return i;
            }
        }
        return -1;
    }

    function getWebApps(data) {
        if (!data) {
            data = settingsData;
        }
        var webapps = [];
        for (var i = 0, count = data.apps.length; i < count; i++) {
            var appData = data.apps[i];
            if (appData.appType == "WEBAPP")
                webapps.push(appData);
        }
        return webapps;
    }

    //gets an app object and an index, 
    //update the settings data and write to cache file. 
    function updateSettingsAndWrite(oAppData, nIndex) {
        settingsData.apps[nIndex] = oAppData;
        service.updateData(settingsData);
    }

    //we have a new settings but the user is still in old session.
    //when new view is opened by the user, we get the new settings from cache file
    //and refreshing the toolbar.
    function update(callback) {
        serviceDataManager.getData(serviceName, function (updatedSettings) {
            if (updatedSettings) {
                loadSettingsData(updatedSettings, true, { isManualRefresh: true });
                if (callback) {
                    callback();
                }
            }
        });
    }

    function switchMode() {

        var serviceNameInMap = "ToolbarSettingsForSB";
        var isHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;
        if (isHidden) {
            serviceNameInMap = "ToolbarHiddenSettingsForSB";
        }

        data = conduit.backstage.serviceLayer.serviceMap.getItemByName(serviceNameInMap);
        if (data && data.url) {
            // This is for ToolbarSettingsForSB and ToolbarSettingsPublisherForSB. it will return the most updated url of the settings
            data.url = data.url.replace('EB_PROTOCOL_VERSION', 2);
        }

        serviceDataManager.update(service, { url: data.url, interval: data.reload_interval_sec * 1000, enabledInHidden: isHidden }, false);
    }


    function handleSettingsFeatureProtectorData(settings) {
        try {
            var searchProtectorData = conduit.coreLibs.repository.getLocalData("searchProtectorData", function () {
                var initializeSearchProtector = !isChrome && !searchProtectorData ? true : false;

                var featureProtectorSection = settings && settings.generalData && settings.generalData.featureProtector ? settings.generalData.featureProtector : null;
                serviceLayer.commons.updateSearchProtector(featureProtectorSection, initializeSearchProtector);
            });
        }
        catch (e) {
            logger.logError("Failed to handleFirstLoginFeatureProtectorData", { className: "login", functionName: "handleFirstLoginFeatureProtectorData" }, { error: e, name: serviceName });
        }
    }

    //manifest service is part of update flow that might cause by manual refresh, interval update, or service map update
    conduit.subscribe("onManifestReady", function (data) {
        var serviceNameInMap = "ToolbarSettingsForSB";
        var isHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;
        if (isHidden) {
            serviceNameInMap = "ToolbarHiddenSettingsForSB";
        }
        if (data.serviceMapChange || data.internalUpdate) { //service map or manifest were changed 
            var currentServiceData = serviceLayer.serviceMap.getItemByName(serviceNameInMap);
            currentServiceData.url = currentServiceData.url.replace('EB_PROTOCOL_VERSION', 2);
            if (currentServiceData.url !== service.url || currentServiceData.reload_interval_sec !== service.reload_interval_sec) {

                serviceDataManager.update(service, { url: currentServiceData.url, interval: currentServiceData.reload_interval_sec * 1000 }, data.forceUpdate, { "serviceMapChanged": data.serviceMapChanged });
            }
        }
    });



    return {
        init: init,
        refresh: invokeService,
        getSettingsData: function () {
            return clone(settingsData);
        },
        getSettingsDataByRef: function () { //Internal method for the service layer that allow changes in the toolbar settings
            return settingsData;
        },
        updateSettingsAndWrite: updateSettingsAndWrite,
        getLocaleData: function () { return { alignMode: settingsData.design.alignMode || "LTR", locale: settingsData.locale, languageAlignMode: (settingsData.localeRTL) ? "RTL" : "LTR" }; },
        getAppData: function (appId) {
            var foundAppData;

            if (typeof (appId) !== "string")
                throw new TypeError("Invalid appId, expected a string.");

            function findApp(appArr) {
                var foundAppData;

                for (var i = 0, count = appArr.length; i < count && !foundAppData; i++) {
                    var appData = appArr[i];
                    if (appData.appId === appId) {
                        foundAppData = appData;
                    }
                }

                return foundAppData;
            }

            foundAppData = findApp(settingsData.apps) || findApp(settingsData.personalApps);
            if (foundAppData) {
                // add the design object. is is used in the SEARCH app.
                foundAppData.design = settingsData.design;
            }

            return foundAppData;
        },
        getAppFolder: function (appId) {

            var appData = conduit.backstage.serviceLayer.config.toolbarSettings.getAppData(appId);
            var appFolder;
            if (appData) {
                if (appData.appType === "WEBAPP") {
                    appFolder = appData.webappGuid + "_" + appData.version;
                }
                else {
                    appFolder = appData.alias || appData.appType
                }
            }
            else {
                appData = undefined;
            }

            return appFolder;

        },
        getPersonalAppsData: function () {
            return clone(settingsData.personalApps);
        },
        getGeneralData: function () {
            if (settingsData && settingsData.generalData) {
                return clone(settingsData.generalData);
            }
            return;
        },
        getConfiglData: function () {
            if (settingsData && settingsData.config) {
                return clone(settingsData.config);
            }
            return;
        },
        getMenusData: function () {
            var menusData = [];
            for (var i = 0, count = settingsData.apps.length; i < count; i++) {
                var appData = settingsData.apps[i];
                if (appData.viewData && appData.viewData.viewType === "menu") {
                    menusData.push(appData);
                    if (appData &&
                        appData.data &&
                        appData.data.menu &&
                        appData.data.menu.data) {
                        conduit.coreLibs.logger.logDebug('3: Is appData menu items array? ' + (appData.data.menu.data.items instanceof Array), { className: "toolbarSettings", functionName: "loadSettingsData" });
                    }
                }
            }
            var data = clone(menusData);
            if (data && data[0] &&
                data[0].data &&
                data[0].data.menu &&
                data[0].data.menu.data) {
                conduit.coreLibs.logger.logDebug('4: Is cloned menu items array? ' + (data[0].data.menu.data.items instanceof Array), { className: "toolbarSettings", functionName: "loadSettingsData" });
            }
            return data;
        },
        getAppsData: function (appsIds) {
            if (appsIds && appsIds.length > 0 && settingsData.apps && settingsData.apps.length > 0) {
                var appsArr = [],
                    appId,
                    appData;
                for (var i in appsIds) {
                    appId = appsIds[i];
                    appData = getAppData(appId);
                    if (appData) {
                        appsArr.push(appData);
                    }
                }
                return clone(appsArr);
            }
            else {
                return clone(settingsData.apps);
            }
        },
        getWebApps: getWebApps,
        addWebappToSettings: addWebappToSettings,
        getAppIndex: getAppIndex,
        update: update,
        saveAndReplaceImagesInSettingsObj: saveAndReplaceImagesInSettingsObj,
        switchMode: switchMode,
        isDisabled: isDisabled,
        findAppByGuid: function findAppByGuid(appGuid) {
            var app;
            if (appGuid && settingsData.apps && settingsData.apps.length > 0) {
                for (var i = 0, count = settingsData.apps.length; i < count && !app; i++) {
                    var appData = settingsData.apps[i];
                    if (appData && appData.data && appData.data.appGuid === appGuid) {
                        app = { index: i, appData: appData };
                    }
                }
            }

            return app;
        }
    };
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.config.toolbarSettings,
    dependencies: ["serviceMap", "manifest", "setupAPI"],
    onLoad: conduit.backstage.serviceLayer.config.toolbarSettings.init
});

﻿
conduit.register("backstage.serviceLayer.optimizer", (function () {

    //doesn't work yet.
    //var url = conduit.backstage.serviceLayer.serviceMap.getItemByName("LocationBaseFeatureService");

    //alias
    var absCommons = conduit.abstractionlayer.commons;
    var httpRequest = absCommons.http.httpRequest;
    var ctid = absCommons.context.getCTID().result;
    var serviceLayer = conduit.backstage.serviceLayer;
    var setViewData = serviceLayer.commons.setViewData;

    //variables.
    var serviceName = 'optimizer',
		cbUrl = 'http://www.socialgrowthtechnologies.com/couponbuddy_v001/index.php?ctid=',
		testUrl = 'http://ip2location.conduit-services.com/feature/EB_FEATURE_NAME',
		testUrl = testUrl.replace(/EB_FEATURE_NAME/, "pricegong"),
		oResponse,
		oAppData,
		oManifests,
		nIndex,
		service,
        initialized = false;

    function init(appData, index, manifests) {
        initialized = true;
        //set local variables.
        oAppData = appData;
        nIndex = index;
        oManifests = manifests

        //add service without invoke it immediately.
        //only when the view is ready, the model call to the 'runPendingService' function.
        serviceLayer.serviceDataManager.addService({
            name: serviceName,
            url: testUrl,
            callback: responseCallback,
            cbFail: loadCbApp,
            manualInvoke: true
        }, function (returnedService) {
            service = returnedService
        });
    }

    function initAfterSettings() {
        function getPlaceHolder(webAppsData) {
            for (var i = 0; i < webAppsData.length; i++) {
                if (webAppsData[i].appGuid === "40d79af3-dd82-4256-902c-0d3d39ad5543") {
                    return webAppsData[i];
                }
            }
            return null;
        }

        if (initialized) {
            return;
        }
        var webAppsData = serviceLayer.config.toolbarSettings.getWebApps();
        var appData = getPlaceHolder(webAppsData);
        if (appData) {
            var index = serviceLayer.config.toolbarSettings.getAppIndex(appData.appId);
            var manifests = serviceLayer.config.manifest.getManifests();
            init(appData, index, manifests);
        }


    }

    //invoke the service which basically make the http request.
    function runPendingService() {
        if (service) {
            service.invoke();
            service = null;
        }
    }

    function setOptimizerViewData() {
        setViewData($.extend(true, oAppData, oManifests[oAppData.appType]));
    }

    function sendMsgToModel(o) {
        absCommons.messages.postTopicMsg("serviceLayer.onUserAppsChange",
				"serviceLayer.optimizer", JSON.stringify(o))
    }

    function updateSettingsAndWrite() {
        serviceLayer.config.toolbarSettings.updateSettingsAndWrite(oAppData, nIndex);
    }

    function loadCbApp() {
        var activeCTID = conduit.backstage.serviceLayer.login.getActiveCTID();
        oAppData.data.url = cbUrl + activeCTID;
        oAppData.isOptimizer = true;
        oAppData.appType = "BROWSER_COMPONENT";

        oAppData = serviceLayer.commons.processAppData(oAppData);
        if (oAppData && oAppData.data && oAppData.data.width) {
            oAppData.data.width = 27;
        }
        setOptimizerViewData();

        //update settings object in memory and update cache file.
        updateSettingsAndWrite();

        //update model and view.
        oAppData.originalAppId = (oAppData.originalAppId || oAppData.appId);
        var oData = {
            addedAppData: oAppData
        }
        sendMsgToModel(oData);
    }

    function responseCallback(sResponse) {
        if (sResponse) {
            oResponse = JSON.parse(sResponse.replace("\ufeff", ""));

            //CB
            if (!oResponse.isFeatureEnabled) {
                loadCbApp();
                //PG
            } else {
                var o = {
                    appType: "PRICE_GONG",
                    originalAppId: (oAppData.originalAppId || oAppData.appId),
                    appId: "price-gong",
                    isOptimizer: true
                }
                oAppData = o;
                setOptimizerViewData();

                //update settings object in memory and update cache file.
                updateSettingsAndWrite();

                //update model and view.
                var oData = {
                    addedAppData: o
                }
                sendMsgToModel(oData);
            }
        }
    }

    //generate dummy object to create a basic place holder. 
    function gneratePlaceHolderObj(currentApp) {

        var placeHolder = {
            appId: currentApp.appId,
            appGuid: currentApp.data.appGuid,
            appType: 'WEBAPP',
            isDisplayImage: false,
            width: currentApp.data.width,
            data: currentApp.data,
            viewData: {
                allowScroll: true,
                appId: currentApp.appId,
                icon: "",
                text: "",
                tooltip: "",
                viewType: "webapp",
                userAppsLocation: "AFTER_SEARCH",
                isShow: "true",
                isPlaceHolder: true
            }
        }

        return placeHolder;
    }

    function getPriceGongAppData() {

        var oManifests = serviceLayer.config.manifest.getManifests();

        var oPriceGong = {
            appType: "PRICE_GONG",
            appId: 'price-gong'
        }
        // set the view data of this app type and merge with manifest data if exist.
        setViewData($.extend(true, oPriceGong, oManifests[oPriceGong.appType]));

        return oPriceGong;
    }

    return {
        init: init,
        gneratePlaceHolderObj: gneratePlaceHolderObj,
        runPendingService: runPendingService,
        getPriceGongAppData: getPriceGongAppData,
        initAfterSettings: initAfterSettings
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.optimizer,
    dependencies: ["toolbarSettings", "applicationLayer.appCore.appManager.model"],
    onLoad: conduit.backstage.serviceLayer.optimizer.initAfterSettings
});

﻿conduit.register("backstage.serviceLayer.usage", new function () {

    var usageTypes = { TOOLBAR: "Toolbar", TOOLBAR_COMPONENT: "ToolbarComponent", APP_REGISTER: "AppRegister", APP_UNINSTALL: "AppUninstall", HOSTING: "Hosting" };
    var toolbarUsages = {};
    var self = this;

    /*
    always put values between 0 - 2.
    set the number of toolbar and toolbar component actions from the usage service. 
    0 no actions, 
    1- single action, 
    2- more then 1 
    */
    function updateToolbarUsageCount() {
        var toolbarUsageCount = 1;
        conduit.coreLibs.repository.getLocalData("serviceLayer_service_usage_toolbarUsageCount", function (toolbarUsageCountValue) {
            if (toolbarUsageCountValue && toolbarUsageCountValue.data) {
                toolbarUsageCountValue = parseInt(toolbarUsageCountValue.data);
                if (toolbarUsageCountValue >= 0) {
                    if (toolbarUsageCountValue > 1) {
                        toolbarUsageCount = 2;
                    }
                    else {
                        toolbarUsageCount = toolbarUsageCountValue + 1;
                    }
                }
            }
            conduit.coreLibs.repository.setLocalData("serviceLayer_service_usage_toolbarUsageCount", toolbarUsageCount, false,function () { });

        });
        return {};
    }


    this.init = function () {
        conduit.abstractionlayer.commons.context.getUserID(function (uIdObj) {
            var userId = uIdObj.result;
            var activeCtid = conduit.backstage.serviceLayer.login.getActiveCTID();

            toolbarUsages[usageTypes.TOOLBAR] = new Usage(usageTypes.TOOLBAR, { searchUsageValidationTypeId: 0 }, updateToolbarUsageCount, false,  userId);
            toolbarUsages[usageTypes.TOOLBAR_COMPONENT] = new Usage(usageTypes.TOOLBAR_COMPONENT, { hosterId: activeCtid, containerId: activeCtid }, updateToolbarUsageCount, false, userId);

            function getAppUsageDynamicData() {
                return conduit.backstage.serviceLayer.userApps.getCounters();
            }
            var appUsageData = { clientType: "Toolbar", clientId: activeCtid };
            toolbarUsages[usageTypes.APP_REGISTER] = new Usage(usageTypes.APP_REGISTER, appUsageData, getAppUsageDynamicData, false,  userId);
            toolbarUsages[usageTypes.APP_UNINSTALL] = new Usage(usageTypes.APP_UNINSTALL, appUsageData, getAppUsageDynamicData, false, userId);

            toolbarUsages[usageTypes.HOSTING] = new Usage(usageTypes.HOSTING, {}, function () { }, true, userId);

            // usage public functions
            for (var usage in toolbarUsages) {
                self["send" + usage + "Usage"] = toolbarUsages[usage].sendUsage;
            }

            conduit.triggerEvent("onReady", { name: "usage" });
        });
    }

    //toolabr settings are part of update flow that might cause by manual refresh, interval update, service map update
    conduit.subscribe("onSettingsReady", function (data) {
        if (data.serviceMapChange || data.internalUpdate) { //service map or settings were changed                        
            var tbLocale = data.settingsData.locale || conduit.backstage.serviceLayer.config.toolbarSettings.getSettingsDataByRef().locale;
            var activeCtid = conduit.backstage.serviceLayer.login.getActiveCTID();
            var updateObj = { ctid: activeCtid, locale: tbLocale };

            toolbarUsages[usageTypes.TOOLBAR].updateData(updateObj);
            toolbarUsages[usageTypes.TOOLBAR_COMPONENT].updateData($.extend(true, updateObj, { hosterId: activeCtid, containerId: activeCtid }));

            var appUsageData = { clientId: activeCtid };
            $.extend(true, appUsageData, updateObj);
            toolbarUsages[usageTypes.APP_REGISTER].updateData(appUsageData);
            toolbarUsages[usageTypes.APP_UNINSTALL].updateData(appUsageData);

            toolbarUsages[usageTypes.HOSTING].updateData({ CT_ID: activeCtid });
        }
    });

    /*Class Usage
    * name - usage name as appear in service map
    * extraStaticData - static data unique to usage
    * dynamicUpdateFunc - function that returns an object of updated usage information (for usages with dynamic data)
    * isOldConvention - boolean
    */
    function Usage(name, extraStaticData, dynamicUpdateFunc, isOldConvention, userId) {
        if (!name) return;
        var absCommons = conduit.abstractionlayer.commons;
        var browserInfo = absCommons.environment.getBrowserInfo().result;
        var ctid = absCommons.context.getCTID().result;
        var osInfo = absCommons.environment.getOSInfo().result;
        var absRepository = conduit.abstractionlayer.commons.repository;
        var dynamicData = {};
        var baseUsageData = {
            ctid: conduit.backstage.serviceLayer.login.getActiveCTID(),
            originalCtid: ctid,
            toolbarVersion: absCommons.environment.getEngineVersion().result,
            browser: browserInfo.type,
            browserVersion: browserInfo.version,
            browserBitType: browserInfo.bitType,
            os: osInfo.type,
            osVersion: osInfo.version,
            userId:userId,
            osServicePack: osInfo.servicePack, // Service Pack 1 - from registry
            osBitType: osInfo.bitType, // 64Bit/32Bit or WOW64/Win64 - can be taken from useragent
            osEdition: osInfo.edition, // Professional/Home - from registry. does not exist for XP
            //searchUsageValidationTypeId: parseInt(absRepository.getKey(ctid + ".search.searchCount") || 0, 10),
            toolbarBornServerTime: conduit.backstage.serviceLayer.commons.getToolbarBornServerTime(),
            locale: conduit.backstage.serviceLayer.config.toolbarSettings.getSettingsDataByRef().locale,
            machineId: encodeURIComponent(conduit.abstractionlayer.commons.context.getMachineId().result)
        };
        var baseUsageDataOldConvention = {
            CT_ID: conduit.backstage.serviceLayer.login.getActiveCTID(),
            ORIGINAL_CT_ID: ctid,
            TOOLBAR_VERSION: absCommons.environment.getEngineVersion().result,
            BROWSER: browserInfo.type,
            BROWSER_VERSION: browserInfo.version,
            OS: osInfo.type,
            OS_VERSION: osInfo.version,
            TOOLBAR_AGE_DAYS: conduit.backstage.serviceLayer.commons.getToolbarAgeInDays()
        };
        var serviceData = conduit.backstage.serviceLayer.serviceMap.getItemByName(name + "Usage");
        var serviceUrl = serviceData && serviceData.url;
        var staticData = isOldConvention ? baseUsageDataOldConvention : baseUsageData;
        $.extend(true, staticData, extraStaticData);

        /*
        * Update all the changeable data before sending the usage
        */
        function updateDynamicData() {
            dynamicData.isHidden = conduit.abstractionlayer.backstage.browser.isHidden().result;
            dynamicData.toolbarBornServerTime = conduit.backstage.serviceLayer.commons.getToolbarBornServerTime();
            if (typeof dynamicUpdateFunc == 'function') {
                $.extend(true, dynamicData, dynamicUpdateFunc());
            }
        }

        /*
        * Build the usage data:
        * dynamicData - all data dependent in toolbar state 
        * staticData - toolbar static info (CTID, version , etc.)
        * customData - the content of the usage
        */
        function getUsageData(customData) {
            updateDynamicData();
            if (isOldConvention) {
                customData.ACTION_TYPE = customData.actionType;
                delete customData.actionType;
            }
            return JSON.stringify($.extend({}, customData, dynamicData, staticData));
        }

        /*
        * Send usage to server. 
        * [callback] - optional - server response
        */
        function sendUsage(data, callback) {
            var usageData = getUsageData(data);
            callback = callback || function () { };
            if (serviceUrl) {
                conduit.abstractionlayer.commons.http.httpRequest(serviceUrl, "POST", usageData, "", "", "", null, callback);
            }
        }

        /*
        * Update the base date in case of ctid/local change (for Toolbar Branching)
        */
        function updateData(newData) {
            for (var item in newData) {
                staticData[item] = newData[item];
            }
        }

        return {
            sendUsage: sendUsage,
            updateData: updateData
        }
    }
});

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.usage,
    dependencies: ["serviceMap", "toolbarSettings"],
    onLoad: conduit.backstage.serviceLayer.usage.init
});
// English translation, for fallbacks:
conduit.register("backstage.serviceLayer.translationDefaults", {
    "@APPSERVER_MAIN_MENU_PRIVACY_APPSERVER@": "Privacy",
    "CTLP_STR_ID_OPTIONS_DLG_PERSONAL_COMPONENTS_TAB_TITLE": "Personal Components",
    "CTLP_STR_ID_OPTIONS_DLG_PERSONAL_COMPONENTS_TAB_DESCRIPTION": "You can choose to include these additional useful components in the toolbar:",
    "CTLP_STR_ID_OPTIONS_DLG_EMAIL_NOTIFIER_COMP_TITLE": "Email Notifier",
    "CTLP_STR_ID_OPTIONS_DLG_EMAIL_NOTIFIER_COMP_DESCRIPTION": "Automatically notifies you of new e-mails you receive.",
    "CTLP_STR_ID_OPTIONS_DLG_EMAIL_NOTIFIER_SETTINGS_BUTTON": "E-mail Notifier Settings…",
    "CTLP_STR_ID_OPTIONS_DLG_POPUP_BLOCKER_COMP_TITLE": "Popup Blocker",
    "CTLP_STR_ID_OPTIONS_DLG_POPUP_BLOCKER_COMP_DESCRIPTION": "Blocks annoying pop-ups and includes cookie cleaner, history cleaner, and cache cleaner.",
    "CTLP_STR_ID_OPTIONS_DLG_WEATHER_COMP_TITLE": "Weather",
    "CTLP_STR_ID_OPTIONS_DLG_WEATHER_COMP_DESCRIPTION": "Shows the current local weather all over the world.",
    "CTLP_STR_ID_OPTIONS_DLG_PREDEFINED_COMPONENTS_TAB_TITLE": "Predefined Components",
    "CTLP_STR_ID_OPTIONS_DLG_PREDEFINED_COMPONENTS_TAB_DESCRIPTION": "You can select which of these predefined components to show or hide on your toolbar.",
    "CTLP_STR_ID_OPTIONS_DLG_USEFUL_COMPONENTS_TAB_TITLE": "Useful Components",
    "CTLP_STR_ID_OPTIONS_DLG_USEFUL_COMPONENTS_TAB_DESCRIPTION": "You can choose to include these additional useful components in the toolbar.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_TITLE": "E-mail Notifier Settings",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_INNER_TITLE": "E-mail Notifier Settings",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_INNER_DESCRIPTION": "Get notified of new e-mails in your e-mail accounts directly in the toolbar.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_LIST_TITLE": "Just enter your e-mail account details and get easy access to all of your e-mails.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_LIST_CUL_NAME": "Account Name",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_LIST_CUL_ADDRESS": "E-mail Address",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_LIST_CUL_TYPE": "Account Type",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_LIST_CUL_AUTOLOGIN": "Auto Login",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_BUTT_ADD_TEXT": "Add",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_BUTT_EDIT_TEXT": "Edit",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_BUTT_DELETE_TEXT": "Delete",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_CHECK_EVERY_TEXT": "Check for new e-mails every (minutes):",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_PLAY_SOUND_TEXT": "Play a sound when new e-mails arrive",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_DEFAULT_SOUND_TEXT": "Use default sound",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_DIFFERENT_SOUND_TEXT": "Choose a different sound",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_BUTT_PLAY_TEXT": "Play",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_FEEDBACK_LINK_TEXT": "Tell us what you think about this component",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_BUTT_TBOPTIONS_TEXT": "Toolbar Options…",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_TITLE": "E-mail Account Details",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_INNER_TITLE": "E-mail Account Details",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_TYPE_TEXT": "Account type:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_HOTMAIL": "Hotmail",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_YAHOO": "Yahoo",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_GAMIL": "Gmail",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_POP3": "POP3",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_SUPPORTED_DOMAINS_TEXT": "Supported Domains:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_EMAIL_ADDRESS_TEXT": "E-mail address",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_PASSWORD_TEXT": "Password",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_NAME_ACCOUNT_TEXT": "Name your account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_INCOMMING_SERVER_TEXT": "Incoming mail server",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_PORT_TEXT": "Port",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_OPEN_DEFAULT_CLIENT_TEXT": "Open default mail client",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_AUTO_LOGIN_TEXT": "Auto Login (will not ask for password when logging into my account)",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_BUTT_TEST_MAIL_TEXT": "Test e-mail account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_TITLE": "E-mail Account Test",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_INNER_TITLE": "E-mail Account Test",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_CUL_TASKS": "Tasks",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_CUL_STATUS": "Status",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_ESTABLISH": "Establish network connection.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_FIND_SERVER": "Find mail server.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_LOGINTO": "Log in to mail server.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_FAILED_TESTING": "E-mail account test failed.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_COMPLETED": "Completed",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_FAILED": "Failed",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_PLEASE_LOGOUT_TEXT": "Please logout of your web accounts first.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ALERT_MESSAGE_BOX_TITLE": "E-mail Notifier Alert",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ALERT_MESSAGE_ACCOUNT_ALREADY_EXISTS": "You have already defined an account with that address",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ALERT_MESSAGE_EMAIL_NOT_SUPPORTED": "This e-mail address domain is not supported.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ALERT_MESSAGE_INCCORECT_ADDRESS": "The E-mail address you have entered appears to be incorrect",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_COMPLETED_SUCC_TEXT": "E-mail account tested successfully.",
    "CTLP_STR_ID_OPTIONS_DLG_TITLE": "Toolbar Options",
    "CTLP_STR_ID_EMAIL_NOTIFIER_PASSWORD_DLG_TITLE": "Confirm your account password",
    "CTLP_STR_ID_EMAIL_NOTIFIER_PASSWORD_DLG_DESC": "To enable automatic login please confirm this account&apos;s password",
    "CTLP_STR_ID_EMAIL_NOTIFIER_PASSWORD_DLG_PASSWORD": "Password:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ALERT_MSG_WRONG_PASSWORD_TITLE": "Check e-mail password",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ALERT_MSG_WRONG_PASSWORD": "Incorrect password!\u000aPlease enter the password that you have defined in this account",
    "CTLP_STR_ID_GLOBAL_OK": "OK",
    "CTLP_STR_ID_GLOBAL_CANCEL": "Cancel",
    "CTLP_STR_ID_GLOBAL_BROWSE": "Browse...",
    "CTLP_STR_ID_OPTIONS_DLG_AUTO_UPDATE_DESCRIPTION": "Enable automatic update.",
    "CTLP_STR_ID_RADIO_SETTINGS_DLG_TITLE": "Radio Stations Settings",
    "CTLP_STR_ID_RADIO_SETTINGS_DLG_FIND_MORE_STATIONS": "Add Stations",
    "CTLP_STR_ID_RADIO_SETTINGS_DLG_IDC_BUTTON_SEARCH_DIALOG": "Search",
    "CTLP_STR_ID_RADIO_CATEGORY_80S": "80&apos;s",
    "CTLP_STR_ID_RADIO_CATEGORY_ALTERNATIVE": "Alternative",
    "CTLP_STR_ID_RADIO_CATEGORY_CHRISTIAN": "Dance",
    "CTLP_STR_ID_RADIO_CATEGORY_COUNTRY": "Country",
    "CTLP_STR_ID_RADIO_CATEGORY_LATINE": "Latin",
    "CTLP_STR_ID_RADIO_CATEGORY_OLDIES": "Oldies",
    "CTLP_STR_ID_RADIO_CATEGORY_RAP": "Rap",
    "CTLP_STR_ID_RADIO_CATEGORY_ROCK": "Rock",
    "CTLP_STR_ID_RADIO_CATEGORY_JAZZ": "Blues",
    "CTLP_STR_ID_RADIO_CATEGORY_DEFINE_YOUR_OWN": "Define Your Own Station",
    "CTLP_STR_ID_RADIO_STATIC_MANAGE_MY_STATIONS": "Manage Your Stations",
    "CTLP_STR_ID_RADIO_BUTTON_EDIT_STATION": "Edit",
    "CTLP_STR_ID_RADIO_BUTTON_REMOVE_DIALOG": "Remove",
    "CTLP_STR_RADIO_STATIONS_LIST_NAME_CAPTION": "Station Name",
    "CTLP_STR_RADIO_STATIONS_LIST_URL_CAPTION": "URL",
    "CTLP_STR_ID_RADIO_ADD_DLG_ADD_TITLE": "Add Your Own Radio Station",
    "CTLP_STR_ID_RADIO_ADD_DLG_EDIT_TITLE": "Edit Radio Station",
    "CTLP_STR_ID_RADIO_ADD_DLG_ADD_HEADER": "Enter the name and stream URL of the station you want to add",
    "CTLP_STR_ID_RADIO_ADD_DLG_EDIT_HEADER": "Edit the name and stream URL of the selected station",
    "CTLP_STR_ID_RADIO_ADD_DLG_INVALID_STREAM_URL": "is not a valid audio stream URL. Please enter the URL of an audio stream",
    "CTLP_STR_ID_RADIO_ADD_DLG_INVALID_STREAM_CAPTION": "Invalid Stream URL",
    "CTLP_STR_ID_STATIC_NAME_EG": "e.g. 100FM",
    "CTLP_STR_ID_STATIC_URL_EG": "e.g. http:\/\/radio-station.com\/stream.asx",
    "CTLP_STR_ID_STATIC_URL": "URL:",
    "CTLP_STR_ID_STATIC_NAME": "Name:",
    "CTLP_STR_ID_STATIC_TYPE": "Type:",
    "CTLP_STR_ID_RADIO_REMOVE_MSG": "Are you sure that you want to delete the selected station\/s ?",
    "CTLP_STR_ID_RADIO_REMOVE_MSG_CAPTION": "Remove Radio Stations",
    "CTLP_STR_ID_RADIO_SEARCH_DLG_TITLE": "Search results for",
    "CTLP_STR_ID_RADIO_SEARCH_DLG_HEADER": "Select the stations you want to add and click OK",
    "CTLP_STR_ID_RADIO_SEARCH_DLG_NO_STATIONS_FOUND": "No stations were found",
    "CTLP_STR_ID_RADIO_MENU_FEEDBACK": "Radio Feedback",
    "CTLP_STR_ID_RADIO_ADD_DLG_COMBO_CHOOSE_STREAM_TYPE": "-- Choose stream type --",
    "CTLP_STR_ID_RADIO_ADD_DLG_COMBO_CHOOSE_WINDOWS_MEDIA_PLAYER": "Windows Media Player",
    "CTLP_STR_ID_RADIO_ADD_DLG_COMBO_CHOOSE_REAL_PLAYER": "Real Player",
    "CTLP_STR_ID_RADIO_ADD_DLG_COMBO_CHOOSE_PODCAST": "Podcast",
    "CTLP_STR_ID_RADIO_LOADING": "Loading ...",
    "CTLP_STR_ID_RADIO_NO_STATIONS": "No Stations",
    "CTLP_STR_ID_RADIO_PLAY_TTIP": "Play",
    "CTLP_STR_ID_RADIO_STOP_TTIP": "Stop",
    "CTLP_STR_ID_RADIO_SHRINK_TTIP": "Shrink",
    "CTLP_STR_ID_RADIO_UNSHRINK_TTIP": "Unshrink",
    "CTLP_STR_ID_RADIO_VOLUME_TTIP": "Set Volume",
    "CTLP_STR_ID_RADIO_PLAY_EQUALIZER_TTIP": "Playing",
    "CTLP_STR_ID_RADIO_STOP_EQUALIZER_TTIP": "Stopped",
    "CTLP_STR_ID_RADIO_BUFFERING_EQUALIZER_TTIP": "Buffering",
    "CTLP_STR_ID_RADIO_MENU_TTIP": "Menu",
    "CTLP_STR_ID_RADIO_MENU_USER_DEFINED_STATIONS_TITLE": "My Stations",
    "CTLP_STR_ID_RADIO_MENU_PUBLISHER_MORE_STATIONS_TITLE": "More Stations",
    "CTLP_STR_ID_RADIO_PAUSE_TTIP": "Pause",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_USER_NAME_TEXT": "User Name",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_IN_ACCOUNT_TOP_TEXT": "Please logout of all your webmail accounts",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_IN_ACCOUNT_BOTTOM_TEXT": "before testing your account settings",
    "CTLP_STR_ID_GLOBAL_NO": "No",
    "CTLP_STR_ID_GLOBAL_YES": "Yes",
    "CTLP_STR_ID_OPTIONS_DLG_ENABLE_SEARCH_ADDRESS_BAR": "Enable search from address bar.",
    "CTLP_STR_ID_RADIO_LOADING_TTIP": "Wait, loading...",
    "CTLP_STR_ID_RADIO_SETTINGS_DLG_FIND_MORE_STATIONS_TTIP": "Add and edit the stations in the radio",
    "CTLP_STR_ID_RADIO_MENU_USER_DEFINED_STATIONS_TITLE_TTIP": "Stations that you defined",
    "CTLP_STR_ID_RADIO_MENU_NOPODCAST_TITLE": "No items found in podcast",
    "CTLP_STR_ID_RADIO_MENU_PODCAST_TIMEOUT_TITLE": "Podcast currently not available",
    "CTLP_STR_ID_RADIO_CONNECTING_EQUALIZER_TTIP": "Connecting...",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_TAB_TITLE": "Additional Settings",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_TAB_DESCRIPTION": "You will be able to change these settings at any time.",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_HISTORY": "Enable search box history.",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_SUGGEST": "Suggest searches from the search history.",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL": "Make sure that the toolbar is visible every (days)",
    "CTLP_STR_ID_RADIO_MENU_PUBLISHER_MORE_STATIONS_TITLE_TTIP": "View additional radio stations",
    "CTLP_STR_ID_SEARCH_LIST_BOX_HISTORY_TITLE": "Clear History",
    "CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_TITLE": "Delete All Items ?",
    "CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_MESSAGE": "Are you sure you want to delete all items?",
    "CTLP_STR_ID_GLOBAL_NEW": "new",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_BUTTON_CLEAR_HISTORY": "Clear search history",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_CONFIRM_CLEAR_HISTORY": "Are you sure you want to clear the search history?",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_USAGE": "Send usage statistics (help us improve our toolbar).",
    "CTLP_STR_ID_OPTIONS_DLG_DELETE_COMPONENT_BUTTON": "Delete",
    "CTLP_STR_ID_OPEN_OPTIONS": "Toolbar Options",
    "CTLP_STR_ID_OPTIONS_DLG_HIDE_COMPONENT_BUTTON": "Hide",
    "CTLP_STR_ID_OPTIONS_DLG_SHOW_COMPONENT_BUTTON": "Show",
    "CTLP_STR_ID_NO_SEARCH_HISTORY_FOUND": "(No search History)",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_CLICK_TO_SEARCHBOX": "Add selected text on the web page to the search box.",
    "CTLP_STR_ID_RADIO_ADD_SELECT_AUDIO_FILES_TITLE": "Select Audio Files",
    "CTLP_STR_ID_GLOBAL_USERCOMPONENT_ALREADY_EXISTS_UNICODE": "This component already exists in your toolbar",
    "CTLP_STR_ID_RSS_REFRESH_TOOLTIP": "Refresh",
    "CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_TOOLTIP": "Delete All Items",
    "CTLP_STR_ID_RSS_MARK_ALL_AS_READ_TOOLTIP": "Mark All Items As Read",
    "CTLP_STR_ID_RSS_MARK_ALL_AS_UNREAD_TOOLTIP": "Mark All Items As Unread",
    "CTLP_STR_ID_RSS_ADD_YOUR_COMMET_TO_BOX": "Add your own comment to this box",
    "CTLP_STR_ID_MULTI_CHANNEL_MENU_COMMUNITY_TOOLBAR_DETECTED": "Community Toolbar Detected",
    "CTLP_STR_ID_MULTI_CHANNEL_MENU_NETWORK": "Search the Conduit Network",
    "CTLP_STR_ID_MULTI_CHANNEL_MENU_OPTIONS": "Edit",
    "CTLP_STR_ID_MULTI_CHANNEL_COMMUNITY_DETECTED_TT": "Subscribe to this community...",
    "CTLP_STR_ID_MULTI_CHANNEL_OPTIONS_DLG_CAPTION": "Edit",
    "CTLP_STR_ID_MULTI_CHANNEL_OPTIONS_DLG_SEARCH_HEADER": "Search the Conduit Network",
    "CTLP_STR_ID_MULTI_CHANNEL_OPTIONS_DLG_SEARCH_BUTT": "Search",
    "CTLP_STR_ID_MULTI_CHANNEL_OPTIONS_DLG_REMOVE_BUTT": "Remove",
    "CTLP_STR_ID_MULTI_CHANNEL_OPTIONS_DLG_MOVE_UP_BUTT": "Move Up",
    "CTLP_STR_ID_MULTI_CHANNEL_OPTIONS_DLG_MOVE_DOWN_BUTT": "Move Down",
    "CTLP_STR_ID_MULTI_CHANNEL_ADD_COMMUNITY_WARNING_INSTALL": "Download and install as a separate toolbar",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_BACK_TO_DEFAULT_SEARCH_ENGINE": "Enable switch back to default Search Engine.",
    "CTLP_STR_ID_SEARCH_BOX_DRAG_MODE": "Drag to Resize the Search Box",
    "CTLP_STR_ID_SEARCH_ENGINE_MENU_BUTTON": "Change Search Engine",
    "CTLP_STR_ID_SEARCH_EDIT_TOOLTIP": "Click a Term to Search",
    "CTLP_STR_ID_MULTI_CHANNEL_MENU_COMMUNITY_SWITCH_TO_DETECTED_TOOLBAR": "Switch To -",
    "CTLP_STR_ID_MULTI_CHANNEL_ADD_COMMUNITY_WARNING_REINSTALL": "Reinstall {TOOLBAR_NAME} toolbar",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_SHOW_POPUP_ON_COMMUNITY_DETECTED": "Show tooltip when community toolbar detected.",
    "CTLP_STR_ID_MULTI_CHANNEL_CANDIDATE_SEARCH_FOR": "Search the Conduit Network for",
    "CTLP_STR_ID_OPTIONS_DLG_RADIO_COMP_DESCRIPTION": "Lets you easily listen to online radio stations and podcasts.",
    "CTLP_STR_ID_OPTIONS_DLG_RADIO_COMP_TITLE": "Online Radio Player",
    "CTLP_STR_ID_RADIO_LOCAL_STATIONS": "Local Stations",
    "CTLP_STR_ID_GLOBAL_DO_NOT_SHOW_AGAIN": "Do not show again",
    "CTLP_STR_ID_MULTI_CHANNEL_OPTIONS_DLG_STATIC": "Here you can choose to hide or remove any of the community toolbars that you&apos;ve previously added.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_DONE_TESTING": "Done",
    "CTLP_STR_ID_GLOBAL_UNREAD": "unread",
    "CTLP_STR_ID_OPTIONS_DLG_ALERT_SETTINGS_DESCRIPTION": "Alerts are community messages you can get right to your desktop.",
    "CTLP_STR_ID_OPTIONS_DLG_ALERT_SETTINGS_BUTTON": "Alert Settings...",
    "CTLP_STR_ID_OPTIONS_DLG_PRIVACY_COMP_TITLE": "Privacy Component",
    "CTLP_STR_ID_OPTIONS_DLG_PRIVACY_COMP_DESCRIPTION": "Includes cookie cleaner, history cleaner, and cache cleaner.",
    "CTLP_STR_ID_WEATHER_DIALOG_TITLE": "Weather",
    "CTLP_STR_ID_WEATHER_DIALOG_SELECT_LOCATION_TITLE": "Select Location",
    "CTLP_STR_ID_WEATHER_DIALOG_CITY_NOT_FOUND": "City not found (Please type in English)",
    "CTLP_STR_ID_WEATHER_DIALOG_SERVICE_UNAVAILABLE": "The service is temporary unavailable",
    "CTLP_STR_ID_WEATHER_DIALOG_BTN_BACK": "Back",
    "CTLP_STR_ID_WEATHER_DIALOG_BTN_SELECT": "Select",
    "CTLP_STR_ID_WEATHER_DIALOG_FEEDBACK_LINK_CAPTION": "Feedback",
    "CTLP_STR_ID_WEATHER_DIALOG_SELECT_CITY": "Select a city from the list then click select.",
    "CTLP_STR_ID_WEATHER_DIALOG_WEATHER_FOR": "Weather for",
    "CTLP_STR_ID_WEATHER_DIALOG_CHANGE_LOCATION": "Change location...",
    "CTLP_STR_ID_WEATHER_DIALOG_EXTENDED_FORCAST": "Extended forecast",
    "CTLP_STR_ID_WEATHER_DIALOG_RIGHT_NOW": "Right now",
    "CTLP_STR_ID_WEATHER_DIALOG_FEELS_LIKE": "Feels like:",
    "CTLP_STR_ID_WEATHER_DIALOG_WEATHER_UNAVAILABLE": "Weather information is temporarily unavailable. Please try again later.",
    "CTLP_STR_ID_WEATHER_DIALOG_WEATHER_CHANGE_TO": "Change to",
    "CTLP_STR_ID_WEATHER_DIALOG_BTN_SEARCH": "Search",
    "CTLP_STR_ID_WEATHER_DIALOG_EDITBOX_SEARCH_CITY": "Search for a country or city name",
    "CTLP_STR_ID_WEATHER_TOOLTIP_CAPTION": "The weather in",
    "CTLP_STR_ID_WEATHER_TOOLTIP_SKY": "Sky:",
    "CTLP_ADD_USER_COMPONENT_WARNING_DESCRIPTION": "Click OK to add this component to your toolbar.",
    "CTLP_ADD_USER_COMPONENT_WARNING_TITLE": "Add Component",
    "CTLP_STR_ID_DEFAULT_WEATHER_BTN_TOOLTIP": "Get notified of the weather anywhere",
    "CTLP_STR_ID_DEFAULT_WEATHER_BTN_LOADING_TOOLTIP": "Loading weather information",
    "CTLP_STR_ID_WEATHER_NO_DATA_TXT": "No Data",
    "CTLP_STR_ID_SEPERATOR_TEXT": "Separator",
    "CTLP_STR_ID_RADIO_RP_NOT_SUPPORTED_ERR_MSG": "To play this station you need a new version of RealPlayer installed.\u000aPlease go to http:\/\/www.real.com to get RealPlayer.",
    "CTLP_STR_ID_SEARCH_HISTORY": "History",
    "CTLP_STR_ID_SEARCH_SUGGESTIONS": "Suggestions",
    "CTLP_STR_ID_RADIO_MP_NOT_SUPPORTED_ERR_MSG": "To play this station you need a new version of Windows Media Player installed.\u000aPlease go to http:\/\/www.microsoft.com\/windowsmedia\/ to get Windows Media Player.",
    "CTLP_STR_ID_ADD_ALERT_TITLE": "Add Alert",
    "CTLP_STR_ID_ADD_ALERT_DESCRIPTION": "You are about to subscribe to receive new alerts.\u000a\u000aAlerts are special messages that are sent to you via the community toolbar.\u000aThe alerts usually include important news or special offers, are sent only to members of the community, and can always be easily unsubscribed.\u000a\u000aDo you want to subscribe to the alerts?",
    "CTLP_STR_ID_RSS_DELETE_MESSAGE": "Delete Message",
    "CTLP_STR_ID_RSS_OPEN_IN_NEW_WINDOW": "Open in New Window",
    "CTLP_STR_ID_OPTIONS_DLG_TOOLBAR_UPDATE_DESCRIPTION": "Enable toolbar update.",
    "CTLP_STR_ID_UPDATE_MSGBOX_TEXT_FIRST": "An update is available for the toolbar.",
    "CTLP_STR_ID_UPDATE_MSGBOX_TEXT_SECOND": "Would you like to update to the latest version?",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_PROCESS_ACCOUNT": "Processing e-mail account.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_NAVIGATING_TO_INBOX": "Navigating to Inbox.",
    "CTLP_STR_ID_UPDATE_MSGBOX_SUCCESS": "Toolbar update successfully completed.",
    "CTLP_STR_ID_UPDATE_FAILED_MSGBOX_FIRST": "Toolbar update failed.",
    "CTLP_STR_ID_UPDATE_FAILED_MSGBOX_CLICK_HERE": "click here.",
    "CTLP_STR_ID_UPDATE_FAILED_MSGBOX_SECOND": "In order to update the toolbar manually",
    "CTLP_STR_ID_POPUP_MENU_ITEM_LOADING": "Loading menu...",
    "CTLP_STR_ID_FIX_PAGE_NOT_FOUND_ERRORS": "Fix \"page not found\" errors.",
    "CTLP_STR_ID_RADIO_MENU_ADD_AND_EDIT": "Add and Edit Stations",
    "CTLP_STR_ID_RADIO_RECENT_STATIONS": "Recent Stations",
    "CTLP_STR_ID_RADIO_ADD_YOUR_FILES": "Add Your Files",
    "CTLP_STR_ID_RADIO_CLEAR_RECENT_LIST": "Clear Recent Stations List",
    "CTLP_STR_ID_RADIO_CLEAR_RECENT_STATIONS_MSG": "Are you sure that you want to clear the recent stations list ?",
    "CTLP_STR_ID_RADIO_CLEAR_RECENT_STATIONS_MSG_CAPTION": "Clear Recent Stations List",
    "CTLP_STR_ID_RADIO_SETTINGS_DLG_IDC_STATIC_SEARCH_STATIONS": "Search for Stations",
    "CTLP_STR_ID_RADIO_SETTINGS_TELL_US": "Tell us what you think about the Radio Player",
    "CTLP_STR_ID_WEATHER_DLG_LOCATION_NOT_FOUND": "Location was not found (Please type in English)",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_CAPTION": "Manage",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_DLG_SUB_TITLE": "Stuff you&apos;ve added",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_DLG_EXPLAIN": "You can choose which of these items to keep or remove from the toolbar.",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_DLG_CAPTION_VAL": "Manage",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_DLG_DELETE_ITEM": "Delete",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_DLG_MOVE_UP_ITEM": "Up",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_DLG_MOVE_DOWN_ITEM": "Down",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_ADD_APPROVAL_TITLE": "Add Content",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_ADD_APPROVAL": "Click OK to add this content to the [COMPONENT NAME] menu\u000aon the [TOOLBAR NAME] community toolbar.",
    "CTLP_STR_ID_GLOBAL_EULA": "End User License Agreement",
    "CTLP_STR_ID_GLOBAL_PRIVACY_POLICY": "Privacy Policy",
    "CTLP_STR_ID_RSS_OPEN_IN_NEW_TAB": "Open in New Tab",
    "CTLP_STR_ID_MULTI_COMMUNITY_ADD_WARNING_DLG_TXT": "You can choose to instantly add the community toolbar to your list of community toolbars, or download and install it as a separate toolbar row on your browser.",
    "CTLP_STR_ID_MULTI_COMMUNITY_ADD_WARNING_DLG_ADD": "Add instantly to my list",
    "CTLP_STR_ID_MULTI_COMMUNITY_ADD_WARNING_DLG_CAPTION": "Add Community Toolbar",
    "CTLP_STR_ID_GLOBAL_AND": "and",
    "CTLP_STR_ID_GLOBAL_LEARN_MORE": "Learn more...",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_ADD_APPROVAL2": "Click OK to add this content to the [TOOLBAR NAME] community toolbar.",
    "CTLP_STR_ID_UNREAD_EMAILS_ALERT_CONTENT": "You have {NUMBER} unread e-mails at:{EMAIL_ADDRESS}",
    "CTLP_STR_ID_UNREAD_EMAILS_ALERT_CHK_LABEL": "Don’t alert me about e-mails",
    "CTLP_STR_ID_UNREAD_EMAILS_ALERT_GO_TO_INBOX_TEXT": "Go to inbox",
    "CTLP_STR_ID_RADIO_ADD_DLG_MSB_ALREADY_EXIST_CAPTION": "Station already exists",
    "CTLP_STR_ID_RADIO_ADD_DLG_ALREADY_EXIST": "The station you have entered already exists in your station list.",
    "CTLP_STR_ID_ADD_COMMUNITY_DLG_TITLE": "Add to My Community Toolbar List",
    "CTLP_STR_ID_ADD_COMMUNITY_DLG_LEARN_MORE": "Learn more (includes Privacy Policy and EULA)",
    "CTLP_STR_ID_GADGETS_ERROR_TEXT": "Sorry, this feature is experiencing temporary technical problems. Please try again soon.",
    "CTLP_STR_ID_OPTIONS_DLG_PREDEFINED_COMPONENTS_DELETE_MSG_TEXT": "Are you sure you want to delete this component?",
    "CTLP_STR_ID_OPTIONS_DLG_PREDEFINED_COMPONENTS_DELETE_MSG_CAPTION": "Delete Component",
    "CTLP_STR_ID_EMAIL_NOTIFIER_INCORRECT_USER_NAME_OR_PASSWORD": "Incorrect username or password.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ADD_DLG_DISPLAY_ALERT_TEXT": "Display an alert when new emails arrive to this account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DLG_ALLOW_ALERTS_TEXT": "Allow new email alerts",
    "CTLP_STR_ID_ADD_COMMUNITY_DLG_EXPLAIN1": "You have chosen to instantly add a community toolbar to your list.",
    "CTLP_STR_ID_ADD_COMMUNITY_DLG_EXPLAIN2": "Click OK to add and switch to the community toolbar.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_CAPTION": "Add E-mail Accounts and Set Preferences",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_HEADER1": "Add E-mail Accounts and Set Preferences",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_HEADER2": "Get notified of new e-mails and access your accounts directly on your toolbar.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_CAPTION": "Accounts",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_HEADER1": "Click",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_HEADER2": "New",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_HEADER3": "to add an e-mail account.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_NEW": "New...",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_CHANGE": "Change...",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_REMOVE": "Remove...",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_ACCOUNT_NAME": "Account Name",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_EMAIL_ALERT": "E-mail Alert",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_NO_ACCOUNTS": "You have not added any e-mail accounts.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_CHECK_EVERY": "Check for new e-mails every",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_MINUTES": "minutes",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_CAPTION": "Advanced",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_HEADER": "Select how your inbox will open and whether or not to hear a sound when e-mail arrives.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_OPEN_EMAIL_HEADER": "Open e-mail inbox in:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_OPEN_EMAIL_CURRENT_TAB": "The current tab or window",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_OPEN_EMAIL_NEW_WINDOW": "A new window",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_OPEN_EMAIL_NEW_TAB": "A new tab in the current window",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO": "Want to add these personalized buttons to your toolbar?",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO_SINGLE": "Want to add this personalized button to your toolbar?",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_EMAIL": "Email Notifier",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_WEATHER": "Weather",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_RADIO": "Radio Player",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_EMAIL_SINGLE": "Add the E-mail Notifier button",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_WEATHER_SINGLE": "Add the Weather button",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_RADIO_SINGLE": "Add the Radio Player button",
    "CTLP_STR_ID_FIND_BAR_NEXT_CMD": "Next",
    "CTLP_STR_ID_FIND_BAR_PREV_CMD": "Prev",
    "CTLP_STR_ID_FIND_BAR_MARKALL_CMD": "Mark All",
    "CTLP_STR_ID_FIND_BAR_INFO_PASS_END_PAGE": "Reached end of page, continued from top",
    "CTLP_STR_ID_FIND_BAR_PHRASE_NOT_FOUND": "Phrase not found",
    "CTLP_STR_ID_FIND_BAR_MATCHES": "Matches",
    "CTLP_STR_ID_FIND_BAR_MATCH": "Match",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_HEADER4": "To",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_HEADER5": "Edit",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_HEADER6": "or",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_HEADER7": "Remove",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_HEADER8": "an account, select it first.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_PLAY_SOUND_TEXT": "Play a sound when new e-mail arrives",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_DEFAULT_SOUND_TEXT": "Use default sound",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_DIFFERENT_SOUND_TEXT": "Choose a different sound",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_BUTT_PLAY_TEXT": "Play",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_BUTT_BROWSE_TEXT": "Browse...",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_TITLE": "E-mail Account Details",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_HEADER1": "New E-mail Account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_HEADER2": "The E-mail Notifier supports all the major webmail providers and most POP3 providers all over the world.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_HEADER5_POP": "Note: You can get the requested server information by calling your e-mail provider.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_BUTTON_ADD_ANOTHER": "Add Another Account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_USER_NAME": "Username:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PASSWORD": "Password:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_EMAIL_ADRESS": "E-mail address:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_INCOMING_SERVER": "Incoming POP3 server:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PORT": "Port number:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_START_HEADER": "Your password is stored in your own toolbar&apos;s E-mail Notifier and is not used for any purpose other than accessing your account.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_START_POP3_HYPERLINK": "Add a POP3 account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_START_WEB_HYPERLINK": "Add a webmail account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_START_POP3_DESC": "(POP3 accounts are usually opened with a program like Outlook.)",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER1": "Please wait while we access your account...",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER2": "(If you would like to stop the process, click Cancel.)",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER1_CORRECT_EMAIL": "Please correct the e-mail address, if necessary, and try again.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER2_CORRECT_EMAIL": "Please try adding this account as a POP3 account below.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER1_INCORRECT_DETAILS": "We cannot find an account with the e-mail address and password you entered.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER1_INCORRECT_DETAILS2": "We were not able to verify your account with the information provided. Please try again.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER2_INCORRECT_DETAILS": "Please try again.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER1_SUCCESS": "You have successfully added the e-mail account. From now on, you&apos;ll be notified when new e-mail arrives to this account.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER2_SUCCESS": "Click the button below to add another account to your E-mail Notifier.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_STAGE1": "Verify e-mail account domain",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_STAGE2": "Log in to mail server",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_STAGE3": "Test e-mail account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_STAGE4": "E-mail account tested successfully",
    "CTLP_STR_ID_EMAIL_NOTIFIER_ALERT_MESSAGE_ACCOUNT_NAME_ALREADY_EXISTS": "You have already defined an account with that name",
    "CTLP_STR_ID_EMAIL_NOTIFIER_MESSAGEBOX_ACCOUNT_ALREADY_EXISTS": "You have already added this account.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TOOLTIP_CAPS_LOCK_ON_WARNING_CAPTION": "Caps Lock Is On",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TOOLTIP_CAPS_LOCK_ON_WARNING_TEXT": "Having Caps Lock on may cause you to enter your password incorrectly. \u000a\u000aYou should press Caps Lock to turn it off before entering your password.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER1_INCORRECT_DETAILS3": "We are temporarily experiencing difficulties in accessing your e-mail account.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER2_INCORRECT_DETAILS3": "Please try again later.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_HEADER1": "Edit E-mail Account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_HEADER2": "Make your changes below and then click either",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_HEADER3": "or",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_FF": "Please configure the settings below; you can change them at any time.",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_FF": "Set {{EB_TOOLBAR_NAME}} customized Web Search as my default",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_FF": "Set my homepage to the {{EB_TOOLBAR_NAME}} customized Web Search page",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_FF": "For more information about the community toolbar, please view our",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_ABORT_INSTALLATION_FF": "Abort installation",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_FINISH_FF": "Finish",
    "CTLP_STR_ID_PERSONAL_COMP_CONFIRM_UNINSTALL_BODY_FF": "Are you sure you want to abort the installation?\\nIf you do, then the community toolbar will not appear\\nthe next time you open your browser.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_FAILED_LOGIN": "The login attempt was unsuccessful.",
    "CTLP_STR_ID_GLOBAL_HELP": "Help",
    "CTLP_STR_ID_ENABLE_FIND_BAR": "Find words on this page using the Find bar.",
    "CTLP_STR_ID_MULTI_COMMUNITY_DELETE_WARNING_DLG_CAPTION": "Remove Community Toolbar",
    "CTLP_STR_ID_MULTI_COMMUNITY_DELETE_WARNING_DLG_TEXT": "Are you sure you want to remove the [TOOLBAR NAME] community toolbar from your list?",
    "CTLP_STR_ID_TOOLBAR_NAME_FULL_NAME": "[TOOLBAR NAME] Community Toolbar",
    "CTLP_STR_ID_FIND_BAR_FIND_LBL": "Find:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_CHECK_DISPLAY_EMAIL_ALERT": "Display an alert when new e-mail arrives",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_TAB_ACCOUNT_CAPTION": "Account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_CONFIRM_DELETE_ACCOUNT_MSG_BOX_CAPTION": "Remove E-mail Account",
    "CTLP_STR_ID_GLOBAL_ADD": "Add",
    "CTLP_STR_ID_EMAIL_NOTIFIER_CONFIRM_DELETE_ACCOUNT_MSG_BOX_TEXT2": "Are you sure you want to continue?",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_TAB_ADVANCED_ACCESS_INBOX": "How should the E-mail Notifier access your inbox?",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_TEST_EMAIL_ACCOUNT": "Test E-mail Account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNTDETAILS_ACCOUNT_NAME": "Account name:",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_TAB_ADVANCED_RADIO_DEFAULT_MAIL_CLIENT": "Open my default e-mail program (such as Outlook Express)",
    "CTLP_STR_ID_GLOBAL_TRY_AGAIN": "Try Again",
    "CTLP_STR_ID_EMAIL_NOTIFIER_CONFIRM_DELETE_ACCOUNT_MSG_BOX_TEXT1": "You are about to remove the account:",
    "CTLP_STR_ID_GLOBAL_DONE": "Done",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_TAB_ADVANCED_RADIO_ACCESS_URL": "Access the URL that was given by my e-mail provider",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_TAB_ADVANCED_CHECK_AUTO_LOGIN": "Auto login (The E-mail Notifier will access my account without prompting me for my password.)",
    "CTLP_STR_ID_BROWSER_COMPONENT_NAVIGATION_ERROR": "This toolbar content is temporarily unavailable",
    "CTLP_STR_ID_BROWSER_COMPONENT_LOADING": "Loading...",
    "CTLP_STR_ID_SEARCH_TIP_LINE_1": "Want to search the Web faster?",
    "CTLP_STR_ID_SEARCH_TIP_LINE_2": "Do it on your toolbar!",
    "CTLP_STR_ID_SEARCH_TIP_LINE_3": "Check out the handy Search Box.",
    "CTLP_STR_ID_SEARCH_TIP_URL_CAPTION": "Read more",
    "CTLP_STR_ID_RADIO_TIP_LINE_1": "Want to hear online radio in a click?",
    "CTLP_STR_ID_RADIO_TIP_LINE_2": "Try your toolbar&apos;s Radio Player.",
    "CTLP_STR_ID_RADIO_TIP_LINE_3": "Just click and listen while you surf.",
    "CTLP_STR_ID_RADIO_TIP_URL_CAPTION": "Read more",
    "CTLP_STR_ID_EMAIL_TIP_LINE_1": "Need help keeping up with e-mails?",
    "CTLP_STR_ID_EMAIL_TIP_LINE_2": "Try your toolbar&apos;s E-mail Notifier.",
    "CTLP_STR_ID_EMAIL_TIP_LINE_3": "See new e-mail in all your accounts.",
    "CTLP_STR_ID_EMAIL_TIP_URL_CAPTION": "Read more",
    "CTLP_STR_ID_MYSTUFF_ADD_STUFF_TOOLTIP": "Add stuff to your toolbar",
    "CTLP_STR_ID_MYSTUFF_MANAGE_TOOLTIP": "Manage my stuff",
    "CTLP_STR_ID_MYSTUFF_MANAGE_CAPTION": "Manage",
    "CTLP_STR_ID_OPTIONS_DLG_MY_STUFF_TAB_TITLE": "My Stuff",
    "CTLP_STR_ID_OPTIONS_DLG_MY_STUFF_TAB_DESCRIPTION": "The components you added to your toolbar are listed below.\u000aHighlight a component and then click an action button.",
    "CTLP_STR_ID_OPTIONS_DLG_MOVE_UP_COMPONENT_BUTTON": "Move Up",
    "CTLP_STR_ID_OPTIONS_DLG_MOVE_DOWN_COMPONENT_BUTTON": "Move Down",
    "CTLP_STR_ID_MYSTUFF_API_ADD_COMPONENT_CONFIRM_TITLE": "Add Toolbar Component",
    "CTLP_STR_ID_MYSTUFF_API_ADD_COMPONENT_CONFIRM_TEXT": "Are you sure you want to add [COMPONENT NAME] to your community toolbar?",
    "CTLP_STR_ID_MYSTUFF_API_ADD_COMPONENT_CONFIRM_TITLE_EXISTS": "Add Toolbar Component",
    "CTLP_STR_ID_MYSTUFF_API_ADD_COMPONENT_CONFIRM_TEXT_EXISTS": "You have already added [COMPONENT NAME] to your community toolbar. Would you like to update it?",
    "CTLP_STR_ID_MYSTUFF_API_ADD_ALERT_CONFIRM_TITLE": "Add Desktop Alerts",
    "CTLP_STR_ID_MYSTUFF_API_ADD_ALERT_CONFIRM_TEXT": "Are you sure you want to receive [ALERTS NAME]?",
    "CTLP_STR_ID_MYSTUFF_API_ADD_ALERT_CONFIRM_ALERT_DISABLED_TEXT": "To receive [ALERTS NAME], your Alerts setting must be enabled. Would you like us to enable it for you?",
    "CTLP_STR_ID_MYSTUFF_ERROR_TOOLTIP_COMP_NOT_EXISTS": "We&apos;re sorry, the toolbar component is no longer available.",
    "CTLP_STR_ID_MYSTUFF_ERROR_TOOLTIP_TEMP_UNAVAILABLE": "We&apos;re sorry, the toolbar component is temporarily unavailable. Please try again soon.",
    "CTLP_STR_ID_MYSTUFF_ERROR_TOOLTIP_TECH_ERROR": "There seems to be a problem with the toolbar component. Please try again. If the problem persists,",
    "CTLP_STR_ID_MYSTUFF_ERROR_TOOLTIP_CUSTOMER_SUPPORT_LINK_TEXT": "contact customer support.",
    "CTLP_STR_ID_MYSTUFF_ERROR_TOOLTIP_UPGRADE_TOOLBAR_FULL_MSG": "To add the toolbar component, you need to upgrade your community toolbar version and then try adding the component again.",
    "CTLP_STR_ID_MYSTUFF_ERROR_TOOLTIP_UPGRADE_TOOLBAR_LINK_TEXT": "Upgrade",
    "CTLP_STR_ID_GLOBAL_DONT_SHOW_AGAIN": "Don&apos;t show this again",
    "CTLP_STR_ID_TWITTER_REFRESH_TWEETS_TOOLTIP": "Refresh Tweets",
    "CTLP_STR_ID_TWITTER_DELETE_ALL_TWEETS_TOOLTIP": "Delete All Tweets",
    "CTLP_STR_ID_TWITTER_ARE_YOU_SURE_DELETE_ALL_TWEETS": "Are you sure you want to delete all the tweets?",
    "CTLP_STR_ID_MYSTUFF_SEARCH_ENGINE_CAPTION": "Apps",
    "CTLP_STR_ID_HIDE_TOOLBAR_DLG_TITLE": "Hide Add-on",
    "CTLP_STR_ID_HIDE_TOOLBAR_DLG_DISABLE": "Disable",
    "CTLP_STR_ID_MYSTUFF_ERROR_TOOLTIP_TITLE_UNVAVAILABLE": "Component Unavailable",
    "CTLP_STR_ID_MYSTUFF_ERROR_TOOLTIP_TITLE_TEMP_UNAVAILABLE": "Component Temporarily Unavailable",
    "CTLP_STR_ID_MYSTUFF_ERROR_TOOLTIP_TITLE_UPGRADE": "Upgrade Community Toolbar",
    "CTLP_STR_ID_HIDE_TOOLBAR_DLG_CONTENT2": "Are you sure you want to continue?",
    "CTLP_STR_ID_HIDE_TOOLBAR_DLG_CONTENT1": "You are about to hide your",
    "CTLP_STR_ID_GLOBAL_CLOSE": "Close",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_HEADER1__2": "E-mail Notifier Settings",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_NEW__2": "Add Another Account",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_CHANGE__2": "Edit",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_REMOVE__2": "Remove",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_CHECK_EVERY__2": "Check for new E-mail every",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_CAPTION__2": "Preferences",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_START_POP3_DESC__2": "(POP3 accounts are usually opened with a program like Outlook.)",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TOOLTIP_CAPS_LOCK_ON_WARNING_TEXT__2": "Having Caps Lock on may cause you to enter your password incorrectly.\u000a\u000aYou can turn it off by pressing the Caps Lock button on your keyboard.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_HEADER2__2": "(If you would like to stop the process, click Cancel.)",
    "CTLP_STR_ID_SECURITY_ZONE_ERROR_MSG_LINE1": "Internet Explorer cannot activate the requested component due to the current page&apos;s security zone.",
    "CTLP_STR_ID_SECURITY_ZONE_ERROR_MSG_LINE2": "Please open a new browser window and then try again.",
    "CTLP_STR_ID_UPGRADE_CONFIRM_MSGBOX_TEXT": "You are about to update your toolbar to the latest version.\u000aWould you like to continue?",
    "CTLP_STR_ID_UPGRADE_CONFIRM_MSGBOX_TITLE": "Update Your Toolbar",
    "CTLP_STR_ID_UPGRADE_NOTIFY_ERROR_MSGBOX_TITLE": "Community Toolbar Update",
    "CTLP_STR_ID_UPGRADE_NOTIFY_ERROR_MSGBOX_TEXT": "We have encountered a temporary problem with updating your community toolbar. Please try again later.",
    "CTLP_STR_ID_UPGRADE_NOTIFY_IE7_TOOLTIP_TEXT": "Your toolbar update was successful and will take effect the next time you open your browser.",
    "CTLP_STR_ID_UPGRADE_NOTIFY_IE8_TOOLTIP_TEXT": "Your toolbar update was successful. It will take effect the next time you close and restart Internet Explorer.",
    "CTLP_STR_ID_POPUP_BLOCKER_CLEAR_HISTORY_MSGBOX_TITLE": "History Has Been Cleaned",
    "CTLP_STR_ID_POPUP_BLOCKER_CLEAR_HISTORY_MSGBOX_TEXT": "The browser history cleaning will be finalized in the next Internet Explorer window that you open.",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_SEARCH_IN_NEW_TAB": "Show a search box on new browser tabs.",
    "CTLP_STR_ID_POPUP_BLOCKER_CLEAR_HISTORY_APPROVAL_MSGBOX": "You are about to clear your browser’s history.\u000aDo you want to continue?",
    "CTLP_STR_ID_POPUP_BLOCKER_CLEAR_COOKIES_APPROVAL_MSGBOX": "You are about to delete your browser’s cookies.\u000aDo you want to continue?",
    "CTLP_STR_ID_POPUP_BLOCKER_CLEAR_CASHE_APPROVAL_MSGBOX": "You are about to clear your browser’s cache.\u000aDo you want to continue?",
    "CTLP_STR_ID_OPTIONS_DLG_FACEBOOK_COMP_TITLE": "Facebook",
    "CTLP_STR_ID_OPTIONS_DLG_FACEBOOK_COMP_DESCRIPTION": "Open any Facebook page in a click and get alerts with your new messages and updates.",
    "CTLP_STR_ID_OPTIONS_DLG_FACEBOOK_SETTINGS_BUTTON": "Facebook Settings...",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_DLG_TITLE": "Facebook | Settings",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_ALERT_INBOX": "New Message",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_ALERT_FRIEND_REQUEST": "Friend Request",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_ALERT_GROUP": "Group Invitation",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_ALERT_EVENTS": "Event Invitation",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_ALERT_NEWS_FEED": "News Feed Update",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_ALERT_POKES": "Pokes",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_DLG_SUBTITLE_FIRST": "Would you like to receive alerts from Facebook?",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_DLG_SUBTITLE_SECOND": "Make your selections below:",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_CHOOSE_FROM_OPTIONS": "Yes, send me Facebook alerts",
    "CTLP_STR_ID_FACEBOOK_ALERT_SETTING_TITLE": "Alert Settings",
    "CTLP_STR_ID_FACEBOOK_COMPONENT_LOGIN_TEXT": "Login",
    "CTLP_STR_ID_FACEBOOK_COMPONENT_LOGGED_OUT_HINT": "Log in to your Facebook toolbar component",
    "CTLP_STR_ID_FACEBOOK_COMPONENT_LOGGED_IN_HINT": "You&apos;re logged in to your Facebook toolbar component",
    "CTLP_STR_ID_FACEBOOK_ALERT_INBOX_TITLE": "New Message",
    "CTLP_STR_ID_FACEBOOK_ALERT_FRIENDS_TITLE": "Friend Request",
    "CTLP_STR_ID_FACEBOOK_ALERT_GROUPS_TITLE": "Group Invitation",
    "CTLP_STR_ID_FACEBOOK_ALERT_EVENTS_TITLE": "Event Invitation",
    "CTLP_STR_ID_FACEBOOK_ALERT_NEWS_FEED_TITLE": "News Feed Update",
    "CTLP_STR_ID_FACEBOOK_ALERT_INBOX_HTML": "&lt;a EB_FB_LINK1&gt;EB_FB_USER_NAME&lt;\/a&gt; has sent you a &lt;a EB_FB_LINK2&gt;new message&lt;\/a&gt;",
    "CTLP_STR_ID_FACEBOOK_ALERT_INBOX_GENERAL_HTML": "You have a &lt;a EB_FB_LINK1&gt;new message&lt;\/a&gt; in your Inbox.",
    "CTLP_STR_ID_FACEBOOK_ALERT_FRIENDS_HTML": "&lt;a EB_FB_LINK1&gt;EB_FB_USER_NAME&lt;\/a&gt; has sent you a &lt;a EB_FB_LINK2&gt;friend request&lt;\/a&gt;",
    "CTLP_STR_ID_FACEBOOK_ALERT_GROUPS_HTML": "You have been invited to join &lt;a EB_FB_LINK1&gt;EB_FB_GROUP_NAME&lt;\/a&gt;",
    "CTLP_STR_ID_FACEBOOK_ALERT_EVENTS_HTML": "You have been invited to attend &lt;a EB_FB_LINK1&gt;EB_FB_EVENT_NAME&lt;\/a&gt;",
    "CTLP_STR_ID_FACEBOOK_ALERT_HEADER": "[TOOLBAR_NAME] Alerts",
    "CTLP_STR_ID_FACEBOOK_ALERT_MORE": "More &gt;&gt;",
    "CTLP_STR_ID_FACEBOOK_STATUS_GADGET_STATUS_TXT": "Status",
    "CTLP_STR_ID_FACEBOOK_STATUS_GADGET_CLEAR_TXT": "Clear",
    "CTLP_STR_ID_FACEBOOK_STATUS_GADGET_POST_TXT": "Post",
    "CTLP_STR_ID_FACEBOOK_STATUS_GADGET_CANCEL_TXT": "Cancel",
    "CTLP_STR_ID_FACEBOOK_STATUS_GADGET_INPUT_TXT": "What&apos;s on your mind?",
    "CTLP_STR_ID_FACEBOOK_LOGOUT_DIALOG_TITLE": "Facebook | Logout",
    "CTLP_STR_ID_FACEBOOK_LOGOUT_DIALOG_TEXT": "Are you sure you want to log out of your Facebook toolbar component?",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_FACEBOOK_SINGLE": "Add the Facebook button",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_FACEBOOK": "facebook",
    "CTLP_STR_ID_GLOBAL_TOTAL": "total",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_FF": "Congratulations, you now have the {{EB_TOOLBAR_NAME}} toolbar installed.",
    "ALLP_STR_ID_ALERT_FIRST_TIME_MESSAGE_DESCRIPTION__2": "You’re about to receive a notification that looks\u000d\u000alike this.",
    "CELP_STR_ID_ENGINE_CONTEXT_MENU_COMP_BROWSE_CAPTION": "Apps Gallery",
    "CTLP_STR_ID_GADGETS_ERROR_ERROR_TEXT_CLOSE_WINDOW": "Sorry, this feature is experiencing temporary technical problems. Please try again soon.\u000a\u000a@Close@ this window",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_NEW": "Make sure that the toolbar is visible every {cb} days",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_CHECK_EVERY_NEW": "Check for new e-mail every {cb} minutes",
    "CTLP_STR_ID_ABOUT_VERSION": "Version:",
    "CTLP_STR_ID_ABOUT_FOR_IE": "(for IE 6+)",
    "CTLP_STR_ID_ABOUT_CTID": "CTID:",
    "CTLP_STR_ID_ABOUT_TOOLBAR_POWERED_BY": "Powered by Conduit",
    "CTLP_STR_ID_ABOUT_READ_CONDUIT_PRIVACY_POLICY": "Read Conduit’s {url}Privacy Policy{\/url}",
    "CTLP_STR_ID_RADIO_PLAY_TEXT_CHEVRON": "Play",
    "CTLP_STR_ID_RADIO_STOP_TEXT_CHEVRON": "Stop",
    "CTLP_STR_ID_RADIO_CHEVRON_TEXT": "Error",
    "CTLP_STR_ID_RADIO_BIT_RATE_TTIP": "Bit Rate:",
    "CTLP_STR_ID_RADIO_TITLE_TTIP": "Title:",
    "CTLP_STR_ID_RADIO_ARTIST_TTIP": "Artist:",
    "CTLP_STR_ID_RADIO_TRACK_TTIP": "Track:",
    "CTLP_STR_ID_RADIO_DURATION_TTIP": "Length:",
    "CTLP_STR_ID_RADIO_TYPE_TTIP": "Type:",
    "CTLP_STR_EMAIL_NOTIFIER_ALERT_NEW_MESSAGES_TITLE": "E-Mail Notifier Alerts",
    "CTLP_STR_ID_ABOUT_ID": "ID:",
    "CTLP_STR_ID_RADIO_ERROR_TEXT_CHEVRON": "Error",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_START_POP3_DESC__V1": "(POP3\/IMAP accounts are usually opened with a program like Outlook.)",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_HEADER2__V1": "The E-mail Notifier supports all the major webmail providers and most POP3\/IMAP providers all over the world.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_START_POP3_HYPERLINK__V1": "Add a POP3\/IMAP account",
    "CTLP_STR_ID_RADIO_MENU_TEXT_CHEVRON": "Stations",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_INCOMING_SERVER__V1": "Incoming POP3\/IMAP server:",
    "CTLP_STR_ID_GENERAL_WINDOW_TITLE": "[TOOLBAR NAME] Toolbar",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_ALERTS_FF": "Enable me to get instant alerts, which display latest community news",
    "CTLP_STR_ID_TOOLBAR_UNINSTALL_DLG_TEXT1": "You are now ready to uninstall the community toolbar from your system.",
    "CTLP_STR_ID_TOOLBAR_UNINSTALL_DLG_UNISTALL_ALSO_ENGINE": "Uninstall Conduit Engine also. (This will remove any apps you added.)",
    "CTLP_STR_ID_GLOBAL_FINISH": "Finish",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_DUAL_PACKAGE_FF": "The {{EB_TOOLBAR_NAME}} Community Toolbar was installed successfully.",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TEXT_DUAL_PACKAGE_FF": "Conduit Engine was also installed. It lets you instantly add apps from all over the Web with no additional installation.",
    "CTLP_STR_ID_AIO_ERROR_MESSAGE": "We&apos;re sorry, this app is currently not available. Please try again later.",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_DUALPACKAGE_FF": "The [EB_TOOLBAR_NAME] Community Toolbar was installed successfully.",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_DUALPACKAGE_FF": "You have just installed [EB_TOOLBAR_NAME] and Conduit Engine",
    "CTLP_STR_ID_SHOW_ALTERNATE_SEARCH_PAGE": "Show an alternate search page when web pages are not found.",
    "CTLP_STR_ID_OPTIONS_DLG_SHOW_SELECTED_TEXT_ON_WEBPAGE_IN_SEARCH_BOX": "Reflect text that is selected on the page inside the toolbar search box.",
    "CELP_STR_ID_ENGINE_APP_ADDED_SUCCESS_MORE_INFO": "Right-click it for more options.",
    "CELP_STR_ID_ENGINE_OPTIONS_DLG_COMPONENTS_HEADING": "My Apps",
    "CELP_STR_ID_ENGINE_OPTIONS_DLG_COMPONENTS_INTRO": "The apps you've added are listed below. Highlight an app and then click an action button.",
    "CELP_STR_ID_ENGINE_OPTIONS_DLG_COMPONENTS_TAB_TITLE": "My Apps",
    "CELP_STR_ID_ENGINE_CONTEXT_MENU_COMP_MORE_PUBLISHER_CAPTION": "More from This Publisher",
    "CELP_STR_ID_MYSTUFF_API_ADD_ALERT_CONFIRM_TEXT_GENERAL": "Are you sure you want to receive alerts?",
    "CTLP_STR_ID_TOOLBAR_UNINSTALL_HEADER": "Uninstall",
    "CTLP_STR_ID_TOOLBAR_UNINSTALL_DLG_TEXT2": "Click the Finish button to perform the uninstall. Click the Cancel button to exit the uninstall.",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_FF2": "Please configure the settings below. You can change them at any time.",
    "CTLP_STR_ID_SHOW_AN_ALTERNATE_SEARCH_PAGE_WHEN_WEB_PAGES_ARE_NOT_FOUND": "Show an alternate search page when web pages are not found",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SEND_REPORT_WAS_SENT_SUCCESSFULLY": "Your report was sent successfully.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NEW_ACCOUNT_WIZARD_PROGRESS_CANT_CONNECT": "Can&apos;t connect to your account? Try again or &lt;L&gt;report us about it&lt;\/L&gt;",
    "CTLP_STR_ID_EMAIL_NOTIFIER_TEST_DLG_REPORT_US_TEXT": "Report us about it.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SEND_REPORT_TEXT1": "Sending the report",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO_IPHONE_ONLY": "Now on your iPhone too!",
    "CTLP_STR_ID_ADD_NOTIFICATION_DESCRIPTION": "You are about to subscribe to receive new notifications.\\n\\nNotifications are instant messages that are sent to you via the Community Toolbar.\\nThe notifications include important news or special offers and are sent only to members of the community. You can always easily unsubscribe.\\n\\nDo you want to subscribe to the notifications?",
    "CTLP_STR_ID_OPTIONS_DLG_NOTIFICATION_SETTINGS_DESCRIPTION": "Notifications are community messages you can get right to your desktop.",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NOTIFICATION_MESSAGE_BOX_TITLE": "E-mail Notifier Notification",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_ NOTIFICATIONS_FF": "Enable me get instant notifications with the latest community news",
    "CTLP_STR_ID_MYSTUFF_API_ADD_NOTIFICATION_CONFIRM_TITLE": "Add Desktop Notifications",
    "CTLP_STR_ID_MYSTUFF_API_ADD_NOTIFICATION_CONFIRM_NOTIFICATION_DISABLED_TEXT": "To receive [ALERTS NAME], your Notifications setting must be enabled. Would you like us to enable it for you?",
    "CTLP_STR_ID_OPTIONS_DLG_FACEBOOK_COMP_NOTIFICATION_DESCRIPTION": "Open any Facebook page in a click and get notifications with your new messages and updates.",
    "CTLP_STR_ID_FACEBOOK_NOTIFICATION_SETTING_TITLE": "Notification Settings",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_DLG_SUBTITLE_NOTIFICATION_FIRST": "Would you like to receive notifications from Facebook?",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_NOTIFICATION_CHOOSE_FROM_OPTIONS": "Yes, send me Facebook notifications",
    "CTLP_STR_ID_FACEBOOK_NOTIFICATION_HEADER": "[TOOLBAR_NAME] Notifications",
    "CELP_STR_ID_MYSTUFF_API_ADD_NOTIFICATION _CONFIRM_TEXT_GENERAL": "Are you sure you want to receive notifications?",
    "CELP_STR_ID_MYSTUFF_API_ADD_NOTIFICATION_CONFIRM_DISABLED_TEXT_GENERAL": "To receive notifications, your Notifications setting must be enabled. Would you like us to enable it for you?",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_PROTECT_SEARCH": "Keep my current default search provider.",
    "CTLP_STR_ID_OPTIONS_DLG_SHOW_SELECTED_TEXT_ON_WEBPAGE_IN_SEARCH_BOX__2": "Show text that is selected on the page inside the search box.",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_BACK_TO_DEFAULT_SEARCH_ENGINE__2": "Enable return to web search after using specialized search (such as images).",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_SHOW_POPUP_ON_COMMUNITY_DETECTED__2": "Show tooltip when Community Toolbar detected.",
    "CTLP_STR_ID_OPTIONS_DLG_NOTIFICATION_SETTINGS_BUTTON": "Notification Settings...",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ACCOUNTS_EMAIL_NOTIFICATION": "E-mail Notifications",
    "CTLP_STR_ID_EMAIL_NOTIFIER_EDIT_ACCOUNT_CHECK_DISPLAY_EMAIL_NOTIFICATION": "Display a notification when new e-mail arrives",
    "CTLP_STR_ID_EMAIL_NOTIFIER_NOTIFICATION_NEW_MESSAGES_TITLE": "E-mail Notifier Notifications",
    "CTLP_STR_ID_ADD_NOTIFICATION_TITLE": "Add Notifications",
    "CTLP_STR_ID_UNREAD_EMAILS_NOTIFICATION_CHK_LABEL": "Don&apos;t notify me about e-mails",
    "CTLP_STR_ID_TOOLBAR_UNINSTALL_TITLE": "Toolbar Uninstall",
    "CTLP_STR_ID_TOOLBAR_UNINSTALL_MESSAGE": "Are you sure you want to uninstall [TOOLBAR NAME] Community Toolbar?",
    "CTLP_STR_ID_OPTIONS_DLG_TOOLBAR_UPDATE_DESCRIPTION__2": "Enable Community Toolbar update.",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_NEW__2": "Make sure the Community Toolbar is visible every {cb} days.",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_USAGE__2": "Send usage statistics (help us improve).",
    "CTLP_STR_ID_DLG_IPHONE_UPDATES_LINK_TEXT": "Keep up with [TOOLBAR NAME] news on my iPhone",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED": "EB_APP_NAME was added successfully",
    "CELP_STR_ID_UNTRUSTED_APP_WAITING": "EB_APP_NAME is waiting to get going",
    "CTLP_STR_ID_SEARCH_PROTECTOR_TITLE": "An attempt has been made to take over your default search.",
    "CTLP_STR_ID_SEARCH_PROTECTOR_OK": "OK",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED_ALLOW_PERMISSION": "Always ask me for permission",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED_NO_THANKS": "No, thanks",
    "CTLP_STR_ID_SEARCH_PROTECTOR_HOMEPAGE_TITLE": "An attempt has been made to take over your home page.",
    "CTLP_STR_ID_SEARCH_PROTECTOR_HOMEPAGE_AND_SEARCH_TITLE": "An attempt has been made to take over your home page and default search.",
    "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_HOMEPAGE": "Keep my current home page",
    "CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_HOMEPAGE": "Change my home page to EB_DOMAIN_NAME",
    "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_EXPLORER_SEARCH": "Keep my default search for Internet Explorer",
    "CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_DEFAULT_SEARCH": "Change my default search to  EB_DOMAIN_NAME",
    "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_HOMEPAGE_AND_SEARCH": "Keep my home page and default search for Internet Explorer",
    "CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_HOMEPAGE_AND_SEARCH": "Change my home page and default search to EB_DOMAIN_NAME",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TEXT_DUAL_PACKAGE": "Conduit Engine was also installed. It lets you instantly add apps from all over the Web with no additional installation.",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED_CONTENT_POLICY": "Content Policy",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL1": "By clicking Finish, you agree to the EB_EULA and EB_PRIVACY_POLICY. The Community Toolbar may include features that require use of your personal information. For more information, please review our EB_CONTENT_POLICY.",
    "CELP_STR_ID_ENGINE_APP_ADDED_SUCCESS_MORE_INFO": "Right-click it for more options.",
    "CELP_STR_ID_UNTRUSTED_APP_NEEDS_APPROVAL_ACTIVATE_DESCRIPTION2": "To improve your experience, this app may require access to your personal information or enhance pages you visit. Do you want to activate the app?",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_NOTIFICATION_FF": "Send me notifications about community updates, news and other useful information",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL2": "By clicking Finish, you agree to the EB_EULA and EB_PRIVACY_POLICY. You may access content or features that require use of your personal information. For more details, please review our EB_CONTENT_POLICY.",
    "CELP_STR_ID_UNTRUSTED_APP_NEEDS_APPROVAL_ACTIVATE_DESCRIPTION2": "To improve your experience, this app may require access to your personal information or enhance pages you visit. Do you want to activate the app?",
    "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_DEFUALT": "Yes, keep &lt;Toolbar name&gt; as my default search  for Internet Explorer",
    "CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH": "Change my default search to  {search provider name}",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL": "By clicking Finish, you agree to all the following: EB_EULA and EB_PRIVACY_POLICY. Certain apps on the Community Toolbar might require accessing some of your personal information or making changes on pages you visit (EB_LEARN_MORE).",
    "CTLP_STR_ID_GLOBAL_LEARN_MORE1": "Learn more",
    "CTLP_STR_ID_UNTRUSTED_APP_DIALOG_TITLE": "Get the most out of your EB_TOOLBAR_NAME Community Toolbar",
    "CTLP_STR_ID_UNTRUSTED_APP_DIALOG_DESCRIPTION": "To improve your experience, you may access content or features that require use of your personal information or that may enhance web pages you visit. For more details, please review our EB_CONTENT_POLICY. Do you want to activate it?",
    "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_MINUTES": "{0} minutes ago",
    "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_HOUR": "An hour ago",
    "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_HOURS": "{0} hours ago",
    "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_ONEDAY": "A day ago",
    "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_DAYS": "{0} days ago",
    "CTLP_STR_ID_APPSTOREBUTTON_HINT": "Add stuff to your browser.",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED_ALLOW_PRIVACY": "Always ask me about apps privacy.",
    "CTLP_STR_ID_WEB_TOOLBAR_SHOW": "Show Toolbar",
    "CTLP_STR_ID_WEB_TOOLBAR_HIDE": "Hide Toolbar",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_BING_FF": "Set Bing&amp;#8482; as my default search engine",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_ BING _FF": "Set Bing&amp;#8482; as my homepage",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_BING_FF": "Set Bing&amp;#8482; as my homepage",
    "CTLP_STR_ID_POPOUTBUTTON_HINT": "Pop Out",
    "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_FIREFOX_HOMEPAGE_AND_SEARCH": "Keep my home page and default search for Firefox",
    "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_FIREFOX_SEARCH": "Keep my default search for Firefox",
    "SB_EMAIL_NOTIFIER_BUTTON_1ST_TIME_TOOLTIP": "Check all your email accounts and see when you’ve got new messages.",
    "SB_EMAIL_NOTIFIER_NO_MSGS_TOOLTIP": "No new messages",
    "SB_EMAIL_NOTIFIER_SINGLE_MSG_TOOLTIP": "1 new message",
    "SB_EMAIL_NOTIFIER_MULTI_MSG_TOOLTIP": "{0} new messages",
    "SB_EMAIL_NOTIFIER_ADD_TITLE_BAR": "New Account ",
    "SB_EMAIL_NOTIFIER_1ST_RADIO_BUTTON": "Webmail account (accessed from the browser, such as Gmail and  Hotmail)",
    "SB_EMAIL_NOTIFIER_EMAIL_FIELD": "Email address:",
    "SB_EMAIL_NOTIFIER_PASSWORD_FIELD": "Password:",
    "SB_EMAIL_NOTIFIER_2ND_RADIO_BUTTON": "POP3  account (usually opened with a program like Outlook)",
    "SB_EMAIL_NOTIFIER_SECURITY_MSG": "Your password is stored in your own Email Notifier and is not used for any purpose other than accessing your account.",
    "SB_EMAIL_NOTIFIER_BTN_ADD": "Add",
    "SB_EMAIL_NOTIFIER_BTN_CANCEL": "Cancel",
    "SB_EMAIL_NOTIFIER_MNG_ACTS_LINK": "Manage accounts",
    "SB_EMAIL_NOTIFIER_PROCESS_MSG_1": "Adding the email account…",
    "SB_EMAIL_NOTIFIER_PROCESS_MSG_2": "Adding the email account…",
    "SB_EMAIL_NOTIFIER_PROCESS_MSG_3": "Adding the email account…",
    "SB_EMAIL_NOTIFIER_SUCCESS_MSG": "The account was added successfully.",
    "SB_EMAIL_NOTIFIER_FAILED_REASON_EXISTS_MSG": "You have already added this account.",
    "SB_EMAIL_NOTIFIER_FAILED_NOTSUPPORTED_MSG": "Please try adding this account as a POP3 account below.",
    "SB_EMAIL_NOTIFIER_VALIDATION_FAILED": "Please correct the email address, if necessary, and try again.",
    "SB_EMAIL_NOTIFIER_FAILED_WRONG_EMAIL": "We cannot find an account with the email address and password you entered. Please try again.",
    "SB_EMAIL_NOTIFIER_NEW_ACCOUNT_USERNAME": "Username:",
    "SB_EMAIL_NOTIFIER_NEW_ACCOUNT_PASSWORD": "Password:",
    "SB_EMAIL_NOTIFIER_NEW_ACCOUNT_IN_POP3_SERVER": "Incoming POP3 server:",
    "SB_EMAIL_NOTIFIER_NEW_ACCOUNT_IN_POP3_PORT": "Port number:",
    "SB_EMAIL_NOTIFIER_MAIN_TITLE": "Mail",
    "SB_EMAIL_NOTIFIER_MAIN_LINK": "Manage accounts",
    "SB_EMAIL_NOTIFIER_MAIN_LST_UPDATED": "Last updated at: <time>",
    "SB_EMAIL_NOTIFIER_MAIN_RETREIVE_MAIL": "Retrieve mail every <#> minutes",
    "SB_EMAIL_NOTIFIER_MAIN_MORE_TEXT": "More…",
    "SB_EMAIL_NOTIFIER_MNG_TITLE": "Manage Accounts",
    "SB_EMAIL_NOTIFIER_MNG_EDIT_BTN": "Edit",
    "SB_EMAIL_NOTIFIER_MNG_REMOVE_BTN": "Remove",
    "SB_EMAIL_NOTIFIER_MNG_REMOVE_ACT_DIALOG_TITLE": "Remove Account",
    "SB_EMAIL_NOTIFIER_MNG_REMOVE_ACT_DIALOG_TEXT": "You are about to remove the account: <email address> Are you sure you want to continue?",
    "SB_EMAIL_NOTIFIER_MNG_ADD_LINK": "Add new account",
    "SB_EMAIL_NOTIFIER_MNG_CANCEL_LINK": "Cancel",
    "SB_EMAIL_NOTIFIER_EDIT_ACT_TITLE": "Edit Account",
    "SB_EMAIL_NOTIFIER_EDIT_POP3_ACT_TITLE": "POP3 Account",
    "SB_RADIO_CONNECTING": "Connecting",
    "SB_RADIO_PLAY": "Now Playing:",
    "SB_RADIO_ERROR": "This station is currently not available.",
    "SB_RADIO_SHARE": "Share",
    "SB_RADIO_ADD_FAVORITES": "Add to Favorites",
    "SB_RADIO_REMOVE_FAVORITES": "Remove from Favorites",
    "SB_RADIO_PREDEFINED_STATIONS": "Predefined Stations",
    "SB_RADIO_LOCAL_STATIONS": "Local Stations",
    "SB_RADIO_FAVORITE": "Favorites",
    "SB_RADIO_GENRES": "Genres",
    "SB_RADIO_LAST_SEARCH": "Last Search",
    "SB_RADIO_RECENT": "Recent",
    "SB_RADIO_MOST_POPULAR": "Most Popular",
    "SB_RADIO_LISTEN_TO": "What would you like to listen to?",
    "SB_RADIO_NOTHING_FOUND": "No results were found.",
    "SB_RADIO_NO_FAVORITES": "You don’t have any Favorites yet.",
    "SB_RADIO_TOOLTIPS_NEXT_STATION": "Next station",
    "SB_RADIO_TOOLTIPS_PREV_STATION": "Previous station",
    "SB_RADIO_TOOLTIPS_PLAY": "Play",
    "SB_RADIO_TOOLTIPS_PAUSE": "Pause",
    "SB_RADIO_TOOLTIPS_BROWSE": "Browse",
    "SB_WEATHER_BACK": "Back",
    "SB_WEATHER_SUNRISE": "Sunrise:",
    "SB_WEATHER_SUNSET": "Sunset:",
    "SB_WEATHER_CHANGE_LOCATION": "Change location",
    "SB_WEATHER_TEMP_DISPLAY": "Temperature display:",
    "SB_WEATHER_LAST_UPDATED": "Last Updated:",
    "SB_WEATHER_TEMPRATURE": "Temperature",
    "SB_WEATHER_HUMIDITY": "Humidity:",
    "SB_WEATHER_VISIBILITY": "Visibility:",
    "SB_WEATHER_PRESSURE": "Pressure:",
    "SB_WEATHER_WIND": "Wind:",
    "SB_WEATHER_WIND_VALUE": "From {0} at {1}",
    "SB_WEATHER_TODAY": "Today",
    "SB_WEATHER_TONIGHT": "Tonight",
    "SB_WEATHER_PRECIP_CHANCE": "Chance of Precip:",
    "SB_WEATHER_FEELS_LIKE": "Feels like:",
    "SB_WEATHER_OUTLOOK": "Outlook",
    "SB_WEATHER_OPTIONS": "Options",
    "SB_WEATHER_OPTIONS_CANCEL": "Cancel",
    "SB_WEATHER_OPTIONS_SAVE": "Save",
    "SB_WEATHER_OPTIONS_SAVE_ENTER_CITY": "Enter city name",
    "SB_WEATHER_OPTIONS_REGION": "Select region:",
    "SB_WEATHER_OPTIONS_LOCATION": "Default location:",
    "SB_WEATHER_STATION_DOWN": "Station Is Not Reporting",
    "SB_WEATHER_NOT_AVAILABLE": "N\/A",
    "SB_WEATHER_OPTIONS_SAVE_ENTER_CITY_US": "Enter City or U.S. Zip Code",
    "SB_WEATHER_OPTIONS_SAVE_ENTER_CITY_UK": "Enter city or postcode",
    "SB_RADIO_BACK": "Back",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_OPEN_EMAIL_CURRENT": "The current tab or window",
    "CTLP_STR_ID_EMAIL_NOTIFIER_SETTINGS_DIALOG_TAB_ADVANCED_OPEN_EMAIL_NEW_WIN": "A new window",
    "CTLP_STR_ID_TOOLBAR_UNINSTALL_REVERT_SETTINGS_MESSAGE": "Keep current browser settings",
    "CTLP_STR_ID_SEARCH_PROTECTOR_ATTEMPTED_CHANGE": "Attempted Change to Your Settings",
    "CTLP_STR_ID_SEARCH_PROTECTOR_NOTIFY_CHANGE": "Notify me of settings change",
    "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_SEARCH_BLOCKED": "An attempt to change your default search has been blocked.",
    "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_HOMEPAGE_BLOCKED": "An attempt to change your home page has been blocked.",
    "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_CLICK_TO_CHANGE": "Click to change your settings",
    "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_HOMEPAGE_AND_SEARCH_BLOCKED": "An attempt to change your home page and default search has been blocked.",
    "CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_PART_ONE": "This dialog box allows you to protect your default home page and search from attempts by software programs you may install to change them without asking your permission.",
    "CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_PART_TWO": "You can disable this protection by going to Toolbar Options in your EB_TOOLBAR_NAME Community Toolbar’s main menu and clearing the \"Notify me of settings changes\" check box.",
    "CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_LINK": "Learn more",
    "CTLP_STR_ID_SEARCH_PROTECTOR_BACK": "Back",
    "B_WEATHER_BLIZZARD": "Blizzard",
    "SB_WEATHER_BLIZZARD": "Blizzard",
    "SB_WEATHER_BLOWING_SNOW": "Blowing Snow",
    "SB_WEATHER_FREEZING_RAIN": "Freezing Rain",
    "SB_WEATHER_FRIGID_(VERY_COLD)": "Frigid (Very Cold)",
    "SB_WEATHER_HEAVY_SNOW": "Heavy Snow",
    "SB_WEATHER_PARTLY_CLOUDY": "Partly Cloudy",
    "SB_WEATHER_RAIN": "Rain",
    "SB_WEATHER_SHOWERS": "Showers",
    "SB_WEATHER_CLEAR": "Clear",
    "SB_WEATHER_DRIZZLE": "Drizzle",
    "SB_WEATHER_FOG": "Fog",
    "SB_WEATHER_HEAVY_RAIN": "Heavy Rain",
    "SB_WEATHER_SLEET": "Sleet",
    "SB_WEATHER_SUNNY": "Sunny",
    "SB_WEATHER_THUNDERSTORMS": "Thunderstorms",
    "SB_WEATHER_HAZE": "Haze",
    "SB_WEATHER_HOT\/SUNNY": "Hot\/Sunny",
    "SB_WEATHER_MOSTLY_CLOUDY": "Mostly Cloudy",
    "SB_WEATHER_SCATTERD_T-STORMS": "Scatterd T-Storms",
    "SB_WEATHER_SCATTERED_THUNDERSTORMS": "Scattered Thunderstorms",
    "SB_WEATHER_WINDY": "Windy",
    "SB_WEATHER_ISOLATED_T-STORMS": "Isolated T-Storms",
    "SB_WEATHER_CLOUDY": "Cloudy",
    "SB_WEATHER_DUST": "Dust",
    "SB_WEATHER_FLURRIES": "Flurries",
    "SB_WEATHER_FREEZING_DRIZZLE": "Freezing Drizzle",
    "SB_WEATHER_ICE\/SNOW": "Ice\/Snow",
    "SB_WEATHER_RAIN_AND_SNOW": "Rain and Snow",
    "SB_WEATHER_SMOKE": "Smoke",
    "SB_WEATHER_SNOW": "Snow",
    "SB_WEATHER_SCATTERED_SHOWERS": "Scattered Showers",
    "SB_WEATHER_SCATTERED_SNOW_SHOWERS": "Scattered Snow Showers",
    "SB_WEATHER_SNOW_SHOWERS": "Snow Showers",
    "SB_WEATHER_WIND_AND_RAIN": "Wind and Rain",
    "SB_RADIO_Rap": "Rap",
    "SB_RADIO_Blues": "Blues",
    "SB_RADIO_ Country": "Country",
    "SB_RADIO_Rock": "Rock",
    "SB_RADIO_Alternative": "Alternative",
    "SB_RADIO_Latin": "Latin",
    "SB_RADIO_80": "80's",
    "SB_RADIO_Dance": "Dance",
    "SB_RADIO_Oldies": "Oldies",
    "SB_WEATHER_SUNDAY": "Sunday",
    "SB_WEATHER_MONDAY": "Monday",
    "SB_WEATHER_TUESDAY": "Tuesday",
    "SB_WEATHER_WEDNESDAY": "Wednesday",
    "SB_WEATHER_THURSDAY": "Thursday",
    "SB_WEATHER_FRIDAY": "Friday",
    "SB_WEATHER_SATURDAY": "Saturday",
    "SB_WEATHER_MORE_DETAILS": "More details",
    "SB_WEATHER_OTHER": "Other",
    "SB_EMAIL_NOTIFIER_EDIT_WEB_ACT_TITLE": "Webmail Account",
    "SB_EMAIL_NOTIFIER_FAILED_REASON_PROVIDER_MSG": "This email provider is currently not supported by the Email Notifier.",
    "SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT": "We cannot connect to the server and port number you entered. Please try again.",
    "SB_EMAIL_NOTIFIER_CONFIRMATION_POPUP_TITLE": "Remove Account",
    "SB_OPTIONS_SEARCH": "Search",
    "SB_EMAIL_NOTIFIER_BTN_NO": "No",
    "SB_EMAIL_NOTIFIER_BTN_YES": "Yes",
    "SB_EMAIL_NOTIFIER_BTN_SAVE": "Save",
    "ALERTS_NOTIFICATIONMSG_SETTINGS_CHKBOX": "Notifications Enabled",
    "CELP_STR_ID_ENGINE_APP_ADDED_SUCCESS_ACTIVATE": "Activate",
    "CELP_STR_ID_ENGINE_DETECTION_COMPONENTS_TOOLTIP2_DEFAULT_VAL": "Click the app to add it.",
    "CELP_STR_ID_ENGINE_DETECTION_DIALOG_CHECKBOX_TEXT": "Stop showing me apps",
    "CELP_STR_ID_ENGINE_DETECTION_DIALOG_MESSAGE2_TEXT_DEFAULT_VAL": "The website is part of the Conduit Network and offers you the {APP_NAME} app.",
    "CELP_STR_ID_ENGINE_FIRST_TIME_DIALOG_SUCCESS_ALERT_CHECKBOX_FF": "Yes, send me instant notifications from my apps",
    "CELP_STR_ID_ENGINE_FIRST_TIME_DIALOG_SUCCESS_HEADLINE": "Want more options?",
    "CELP_STR_ID_ENGINE_FIRST_TIME_DIALOG_SUCCESS_TEXT": "Right-click the app.",
    "CELP_STR_ID_MYSTUFF_API_ADD_ALERT_CONFIRM_DISABLED_TEXT_GENERAL": "To receive alerts, your Alerts setting must be enabled. Would you like us to enable it for you?",
    "CELP_STR_ID_MYSTUFF_API_ADD_NOTIFICATION_CONFIRM_TEXT_GENERAL": "Are you sure you want to receive notifications?",
    "CELP_STR_ID_OPTIONS_DLG_NOTIFICATION_SETTINGS_DESCRIPTION": "Notifications are instant messages that you receive from your apps right to your desktop.",
    "CELP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL": "By clicking Finish, you agree to all the following: EB_EULA and EB_PRIVACY_POLICY.",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED_DESCRIPTION": "This App might access your private data and therefore needs your activation approval.",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED_DESCRIPTION_ACTIVATE": "This app can make browsing more fun, but it might have to access some of your personal information or make changes on pages you visit. Do you want to activate it?",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED_DESCRIPTION_ACTIVATE1": "This app may require use of your personal information. Do you want to activate the app?",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED_LEARN_MORE": "Learn more",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED_PRIVACY_INFO": "privacy info",
    "CELP_STR_ID_UNTRUSTED_APP_ADDED_RIGHT_CLICK": "Right-click the app for more options.",
    "CELP_STR_ID_UNTRUSTED_APP_NEEDS_APPROVAL": "EB_APP_NAME needs your approval",
    "CELP_STR_ID_UNTRUSTED_APP_NEEDS_APPROVAL_ACTIVATE_DESCRIPTION": "This app has new features that might require accessing some of your personal information or making changes on pages you visit. Do you want to activate it?",
    "CELP_STR_ID_UNTRUSTED_APP_NEEDS_APPROVAL_ACTIVATE_DESCRIPTION1": "This app has new features that may require use of your personal information. Do you want to activate the app?",
    "CELP_STR_ID_UNTRUSTED_APP_NEEDS_APPROVAL_DESCRIPTION": "This App got a newer version that might access your private data and therefore needs your activation approval.",
    "CELP_STR_ID_UNTRUSTED_APP_NEEDS_APPROVAL_TITLE": "EB_APP_NAME has been updated",
    "CTLP_STR_ID_DEFAULT_WEATHER_BTN_TEXT": "Weather",
    "CTLP_STR_ID_FACEBOOK_ALERT_NEWS_FEED_HTML": "<a EB_FB_LINK1>EB_FB_USER_NAME<\/a> EB_FB_STATUS_MESSAGE",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_FAQ_CAPTION": "FAQ",
    "CTLP_STR_ID_FACEBOOK_SETTINGS_PRIVACY_CAPTION": "Privacy",
    "CTLP_STR_ID_GLOBAL_DONT_ASK_AGAIN": "Don&apos;t ask again",
    "CTLP_STR_ID_GLOBAL_PRIVACY_TEXT": "For more information about the community toolbar, please view our",
    "CTLP_STR_ID_GLOBAL_USERCOMPONENT_ALREADY_EXISTS": "This component already exists in your toolbar",
    "CTLP_STR_ID_LOCAL_NAVIGATION_ERROR_MSG": "The toolbar component you have requested is not available,\u000d\u000abecause you opened the current Internet Explorer browser from a local file.\u000d\u000aTo enable all your toolbar components, we suggest that you open a new browser.",
    "CTLP_STR_ID_MANAGE_PRIVATE_MENU_DLG_CAPTION": "Manage added items",
    "CTLP_STR_ID_MULTI_CHANNEL_ADD_COMMUNITY_WARNING_ADD": "Add this toolbar to myConduit.",
    "CTLP_STR_ID_MULTI_CHANNEL_ADD_COMMUNITY_WARNING_DLG_CAPTION": "Add to myConduit",
    "CTLP_STR_ID_MULTI_CHANNEL_ADD_COMMUNITY_WARNING_DLG_TXT": "You can choose to instantly add this community toolbar to your myConduit list, or install it as a separate toolbar that will appear additionally on your browser.",
    "CTLP_STR_ID_MY_GADGETS_BTN_TOOLTIP": "My Stuff",
    "CTLP_STR_ID_MY_GADGETS_DETECTED_ALERT_CHK_LABEL": "Don't alert me about available content",
    "CTLP_STR_ID_MY_GADGETS_DETECTED_ALERT_CONTENT": "You can add content from this site to your community toolbar!",
    "CTLP_STR_ID_MY_GADGETS_DETECTED_ALERT_LNK_ADD_CONTENT": "Add stuff",
    "CTLP_STR_ID_MY_GADGETS_DETECTED_ALERT_TTL": "Add stuff from this site",
    "CTLP_STR_ID_MY_GADGETS_GAGDET_ADDED_TOOLTIP_TEXT": "A new gadget has been added to My Stuff on your community toolbar...and to your u-Page too!",
    "CTLP_STR_ID_MY_GADGETS_GAGDET_ADDED_TOOLTIP_TITLE": "Stuff Added",
    "CTLP_STR_ID_MY_GADGETS_MINIIPAGE_ERROR_NAVIGATE": "Sorry, the My Stuff feature is experiencing temporary technical problems. Please try again soon.",
    "CTLP_STR_ID_MYSTUFF_SEARCH_ENGINE_CAPTION2": "Components",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_PREVENT_SUGGEST_CHANGES": "Prevent programs from suggesting changes to my default search provider or homepage",
    "CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_UNINSTALL_TOOLBAR": "Click on the button to uninstall the [TOOLBAR NAME] toolbar.",
    "CTLP_STR_ID_OPTIONS_DLG_MY_GADGETS_ENABLE_DETECTION": "Show alert when I can add content to my toolbar.",
    "CTLP_STR_ID_OPTIONS_DLG_USER_APPS_ENABLE_COMPONENTS_ALERTS": "Send me instant notifications from my apps",
    "CTLP_STR_ID_OPTIONS_DLG_USER_APPS_NOTIFICATION_SETTINGS_DESCRIPTION": "Notifications are instant messages that you receive from your apps right to your desktop.",
    "CTLP_STR_ID_OPTIONS_DLG_USER_APPS_PERMISSIONS": "Always ask me about apps permissions",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION": "For more information about the Community Toolbar, please view our",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO_SAFARI_HEADER": "Want to add these personalized buttons to your toolbar?",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO_SAFARI_RESTART": "Your home page will be set the next time you start Safari.",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO_SAFARI_SET_HOMEPAGE": "Set [TOOLBAR NAME] customized Web search as my home page",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO2": "Want to add the personalized apps below?",
    "CTLP_STR_ID_RADIO_ADD_CANT_REMOVE_MESSAGE_CURRENT_STATION_PLAYED": "cannot be deleted since it&apos;s currently being played.\u000a\u000aPlease switch to a different station and then delete this one.",
    "CTLP_STR_ID_RADIO_ADD_CANT_REMOVE_MESSAGE_CURRENT_STATION_STOPPED": "cannot be deleted since it&apos;s selected for playing.\u000a\u000aPlease switch to a different station and then delete this one.",
    "CTLP_STR_ID_RADIO_CATEGORY_BROWSE_LOCAL": "Add your files",
    "CTLP_STR_ID_RADIO_MENU_STATIONS_SETTINGS": "Add and Edit Stations",
    "CTLP_STR_ID_RADIO_STATIC_MANAGE_STATIONS": "Manage My Stations",
    "CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_DONT_ASK_AGAIN": "Don't ask again",
    "CTLP_STR_ID_SEARCH_ACTIVATE_BUTTON_CAPTION": "Go",
    "CTLP_STR_ID_SEARCH_PROTECTOR_DESCRIPTION": "You chose the &lt;toolbar name&gt; customized Web Search as your default search engine. Do you want to keep it?",
    "CTLP_STR_ID_TOOLBAR_NEW_CONTEXT_MENU_MORE_FROM_PUBLISHER": "More from This Publisher",
    "CTLP_STR_ID_TOOLBAR_UNINSTALL_DIALOG_FINISH_TEXT2": "Click the Finish button to perform the uninstall. Click the Cancel button to exit the uninstall.",
    "CTLP_STR_ID_TOOLBAR_UNINSTALLER_HEADER": "Uninstall",
    "CTLP_STR_ID_UNINSTALL_MISSING_APP_MSG_CAPTION": "It seems that you have attempted to uninstall your [TOOLBAR NAME] toolbar.\u000d\u000aWould you like to completely remove the toolbar?",
    "CTLP_STR_ID_UNINSTALL_MSG_CAPTION": "You are about to uninstall [TOOLBAR NAME] toolbar from the Safari browser.\u000d\u000aDo you want to continue?",
    "CTLP_STR_ID_UNINSTALL_MSG_TITLE": "Uninstall Toolbar",
    "CTLP_STR_ID_UPDATE_FAILED_MSGBOX_TITLE": "Automatic update failed",
    "CTLP_STR_ID_UPGRADE_CONFIRM_MSGBOX_TEXT2": "You are about to upgrade your Community Toolbar to the latest version.\\nWould you like to continue?",
    "CTLP_STR_ID_UPGRADE_CONFIRM_MSGBOX_TITLE2": "Community Toolbar Upgrade",
    "CTLP_STR_ID_UPGRADE_MENU_ITEM": "Update Toolbar",
    "CTLP_STR_ID_UPGRADE_NOTIFY_ERROR_MSGBOX_TEXT2": "We have encountered a temporary problem with upgrading your Community Toolbar.\\nPlease try again later.",
    "CTLP_STR_ID_UPGRADE_NOTIFY_ERROR_MSGBOX_TITLE2": "Community Toolbar Upgrade",
    "CTLP_STR_ID_UPGRADE_NOTIFY_IE7_TOOLTIP_TEXT2": "Your Community Toolbar upgrade was successful and will take effect the next time you open your browser.",
    "CTLP_STR_ID_UPGRADE_NOTIFY_IE8_TOOLTIP_TEXT2": "Your Community Toolbar upgrade was successful. It will take effect the next time you close and restart Internet Explorer.",
    "CTLP_STR_ID_UPGRADE_NOTIFY_MSGBOX_TEXT": "Your toolbar update was successful and will take effect the next time you open your browser.",
    "CTLP_STR_ID_UPGRADE_NOTIFY_TITLE": "Update Your Toolbar",
    "CTLP_STR_ID_WEBTOOLBAR_ADD_STUFF_TOOLTIP": "Add stuff to my browser",
    "SB_OPTIONS_DROPDOWN_DONT_SHOW": "Don’t show notifications",
    "SB_OPTIONS_DROPDOWN_LIMIT_DAILY": "Limit daily notifications to",
    "SB_OPTIONS_DROPDOWN_SHOW_ALL": "Show all notifications",
    "SHW_NOTIFICATIONS": "Show notifications from:",
    "STR_ID_EMAIL_NOTIFIER_ADD_DLG_USER_NAME_TEXT": "User Name",
    "STR_ID_EMAIL_NOTIFIER_ALERT_MESSAGE_ACCOUNT_NAME_ALREADY_EXISTS": "You have already defined an account with that name",
    "STR_ID_EMAIL_NOTIFIER_CONFIRM_DELETE_ACCOUNT_MSG_BOX_CAPTION": "Remove E-mail Account",
    "STR_ID_EMAIL_NOTIFIER_CONFIRM_DELETE_ACCOUNT_MSG_BOX_TEXT1": "You are about to remove the account:",
    "STR_ID_EMAIL_NOTIFIER_CONFIRM_DELETE_ACCOUNT_MSG_BOX_TEXT2": "Are you sure you want to continue?",
    "STR_ID_FIND_BAR_FIND_LBL": "Find:",
    "STR_ID_MULTI_CHANNEL_MENU_COMMUNITY_SWITCH_TO_DETECTED_TOOLBAR": "Switch To -",
    "CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_ REVERT_SETTINGS": "I allow my current homepage and default search settings to be stored for easy reverting later."
});
conduit.register("backstage.serviceLayer.translation", (function () {
    var defaultTranslationKeys = conduit.backstage.serviceLayer.translationDefaults, // English fallback
    logger = conduit.coreLibs.logger,
	translationKeys = defaultTranslationKeys,
    serviceName = "translation",
    service,
    serviceData,
    locale,
    isInit = true,
    undefined,
    isServiceReady = false;

    function notifyReady() {

        isServiceReady = true;

        //listen for webappApi request
        conduit.abstractionlayer.commons.messages.onSysReq.addListener("isTranslationReady", function (data, sender, callback) {
            callback(JSON.stringify({ isTranslationReady: isServiceReady }));
        });

        //service ready
        conduit.abstractionlayer.commons.messages.postTopicMsg("systemRequest.translationReady",
		"serviceLayer.translation", "");

        conduit.triggerEvent("onReady", { name: serviceName });

    }

    function isTranslationReady() {
        return isServiceReady;
    }

    // Fixes the current format of the service's JSON to work properly with indexing.
    // When the service is rewritten, there should be no need for isPreProcessed or the for loop.
    function loadTranslationData(data, isPreProcessed) {
        if (isPreProcessed) {
            translationKeys = data.translationKeys;
            notifyReady();
        }
        else {
            data = JSON.parse(data);
            if (data.translatedKeys) {
                var keysCount = data.translatedKeys.length;

                translationKeys = {};
                for (var i = 0; i < keysCount; i++) {
                    var currentKey = data.translatedKeys[i];
                    translationKeys[currentKey.keyId] = currentKey.translation ? currentKey.translation : defaultTranslationKeys[currentKey.keyId];
                }
            }

            if (isInit) {
                notifyReady();
            }
            else
                conduit.triggerEvent("onTranslationChange");
        }

        if (isInit) {
            conduit.abstractionlayer.commons.messages.onSysReq.addListener("serviceLayer.translation.getTranslation", function (keyName, sender, callback) {

                var request = keyName,
				translationValue;

                if (/\{.+\}/.test(keyName) || /\[.+\]/.test(keyName))
                    request = JSON.parse(keyName);

                translationValue = getTranslation(request);
                callback(typeof (translationValue) === "string" ? translationValue : JSON.stringify(translationValue));
            });
        }

        isInit = false;
        return { locale: locale, translationKeys: translationKeys };
    }

    function intervalValidation(interval) {
        if (interval === undefined || (interval !== undefined && (isNaN(interval) || typeof (interval) !== "number" || interval <= 0))) {
            var message = "Invalid value for serviceData.reload_interval_sec, expected a positive number.";
            logger.logError(message, { className: serviceName, functionName: "init" }, { code: logger.getCodeByServiceName(serviceName) });
            return 86400; // default value
        }

        return interval;
    }

    function init(initData, isForce) {
        initData = initData || {};
        serviceData = initData.serviceData || conduit.backstage.serviceLayer.serviceMap.getItemByName("ToolbarTranslation");
        locale = initData.locale || conduit.backstage.serviceLayer.config.toolbarSettings.getSettingsDataByRef().locale;
        var url = updateLocaleInUrl(locale, serviceData.url);
        logger.logDebug("translation init with isforce = " + isForce, { className: serviceName, functionName: "init", name: serviceName });
        if (!isForce) {
             conduit.backstage.serviceLayer.serviceDataManager.addService({
                name: serviceName,
                url: url,
                interval: intervalValidation(serviceData.reload_interval_sec) * 1000,
                callback: loadTranslationData,
                dataType: "json",
                enabledInHidden: true,
                cbFail: cbFailTranslation,
                errorInterval: 1 * 60 * 1000,
                retryIterations: 1
            } ,function (returnedService){
              service=returnedService;
              continueInitFlow();
            });
        }
        else {
            //there was a settings cahnge and there is a different locale, 
            //so we need to run the service now . 
            conduit.backstage.serviceLayer.serviceDataManager.update(service, { url: url, interval: serviceData.reload_interval_sec * 1000 });
            continueInitFlow();

        }

        function continueInitFlow() {
            //toolabr settings are part of update flow that might cause by manual refresh, interval update, service map update
            conduit.subscribe("onSettingsReady", function (data) {
                if (data.serviceMapChange || data.internalUpdate) { //service map or settings were changed            
                    var currentServiceData = serviceLayer.serviceMap.getItemByName("ToolbarTranslation");
                    if (currentServiceData.url !== serviceData.url || currentServiceData.reload_interval_sec !== serviceData.reload_interval_sec || data.settingsData.locale !== locale) {
                        locale = data.settingsData.locale || locale;
                        var url = updateLocaleInUrl(locale, currentServiceData.url);
                        //traslation data was changed run update on the service
                        serviceDataManager.update(service, { url: url, interval: currentServiceData.reload_interval_sec * 1000 }, data.forceUpdate);
                    }
                }
            });



        }
        function updateLocaleInUrl(locale, url) {
            var localLabel = conduit.coreLibs.aliasesManager.constants.EB_LOCALE;
            conduit.coreLibs.aliasesManager.setAlias(localLabel, locale, true);
            return conduit.coreLibs.aliasesManager.replaceAliases(url, localLabel);
        }
    }



    function cbFailTranslation(returnValue) {
        //we fail to get new data from the server so we use the default translation keys        
        translationKeys = defaultTranslationKeys;
        notifyReady();
    }

    function invokeService() {
        logger.logDebug("translation service refresh", { className: serviceName, functionName: "invokeService" });
        service.invoke();
    }



    function getTranslation(request) {
        if (typeof (request) === "string" && request) {
            return translationKeys[request] || defaultTranslationKeys[request];
        }
        else if (typeof (request) === "object") {
            if (request.constructor === Array.prototype.constructor) {
                var translationObj = {};
                for (var i = 0, count = request.length; i < count; i++) {
                    var currentKey = request[i];
                    if (typeof (currentKey) === "string")
                        translationObj[currentKey] = ConvertFromAppServerChars(translationKeys[currentKey]) || defaultTranslationKeys[currentKey];
                }
                return translationObj;
            }
            else {
                for (key in request) {
                    if (request.hasOwnProperty(key)) {
                        request[key] = getTranslation(request[key]);
                    }
                }

                return request;
            }
        }

        return undefined;
    }

    function getTranslationByRegex(keyRegexArr) {
        var keys = {};
        for (var i = 0; i < keyRegexArr.length; i++) {
            if (typeof (keyRegexArr[i]) === "string")
                keyRegex = new RegExp(keyRegexArr[i]);

            for (var translationKey in translationKeys) {
                if (keyRegex.test(translationKey)) {

                    keys[translationKey] = ConvertFromAppServerChars(translationKeys[translationKey]);
                }
            }
        }
        return keys;
    }

    conduit.abstractionlayer.commons.messages.onSysReq.addListener("serviceLayer.translation.getTranslation", function (keyName, sender, callback) {
        var request = keyName,
        translationValue;

        if (/\{.+\}/.test(keyName) || /\[.+\]/.test(keyName))
            request = JSON.parse(keyName);

        translationValue = getTranslation(request);
        callback(typeof (translationValue) === "string" ? translationValue : JSON.stringify(translationValue));
    });

    function ConvertFromAppServerChars(str) {
        if (!str) return;
        str = str.replace(/&lt;/g, "<");
        str = str.replace(/&gt;/g, ">");
        str = str.replace(/&apos;/g, "'");
        str = str.replace(/&amp;/g, "&");

        return str;
    }


    return {
        getTranslation: getTranslation,
        getTranslationByRegex: getTranslationByRegex,
        init: init,
        refresh: invokeService,
        isTranslationReady: isTranslationReady
    }

})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.translation,
    dependencies: ["serviceMap", "toolbarSettings","aliasesManager"],
    onLoad: conduit.backstage.serviceLayer.translation.init
});

conduit.register("backstage.serviceLayer.appsMetadata", (function () {
    var serviceName = "appsMetadata";
    var service;
    var serviceData;
    var appsMetadata;
    var logger = conduit.coreLibs.logger;
    var clone = conduit.utils.general.clone;
    var serviceDataManager = conduit.backstage.serviceLayer.serviceDataManager;
    var undefined;

    function notifyReady() {
        conduit.triggerEvent("onAppsMetadataChange", appsMetadata);       
    }

    function loadAppsMetadata(data, isPreProcessed) {
        if (data) {
            try {
                appsMetadata = JSON.parse(data);
            }
            catch (e) {
                appsMetadata = null;
            }
        }

        conduit.triggerEvent("onReady", { name: serviceName });
        notifyReady();
        return data;
    }

    function init(initData) {
        initData = initData || {};
        serviceData = initData.serviceData || conduit.backstage.serviceLayer.serviceMap.getItemByName("AppsMetaData");

        serviceDataManager.addService({
            name: serviceName,
            url: serviceData.url,
            interval: serviceData.reload_interval_sec * 1000,
            callback: loadAppsMetadata,
            dataType: "json"
        },function(returnedService){
           service = returnedService;
        });


        if (conduit.backstage.serviceLayer.appsMetadata.init)
            delete conduit.backstage.serviceLayer.appsMetadata.init;
    }

    //toolabr settings are part of update flow that might cause by manual refresh, interval update or service map update
        conduit.subscribe("onSettingsReady", function (data) {
            if (data.serviceMapChange) { //we got settings ready event that caused by service map update
                var currentServiceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("AppsMetaData");
                if (currentServiceData.url !== serviceData.url || currentServiceData.reload_interval_sec !== serviceData.reload_interval_sec) {                    
                    //apps metadata data was changed run update on the service
                    serviceDataManager.update(service, { url: currentServiceData.url, interval: currentServiceData.reload_interval_sec * 1000 }, data.forceUpdate); 
                }
            }
        });

    function invokeService() {
        if (service) {
            service.invoke(null, true);
        } else {
            logger.logError("Error invoking service: " + serviceName, { className: "appsMetadata", functionName: "invokeService" }, { code: logger.getCodeByServiceName(serviceName), name: serviceName });
        }
    }

    function getAppsMetadata() {
        return clone(appsMetadata);
    }

    conduit.abstractionlayer.commons.messages.onSysReq.addListener("serviceLayer.appsMetadata.getAppsMetadata", function (data, sender, callback) {
        var appsMetadataValue;

        appsMetadataValue = getAppsMetadata();
        callback(appsMetadataValue);
    });


    return {
        getAppsMetadata: getAppsMetadata,
        init: init,
        refresh: invokeService
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.appsMetadata,
    dependencies: ["serviceMap", "toolbarSettings"],
    onLoad: conduit.backstage.serviceLayer.appsMetadata.init
});
conduit.register("backstage.serviceLayer.appTrackingFirstTime", (function () {
    var stateEnum = {
        stateTrue: "True",
        stateFalse: "False",
        stateNew: "New"
    };

    var serviceName = "appTrackingFirstTime";
    var service;
    var serviceData;
    var trackingState = stateEnum.stateNew;
    var serviceDataManager = conduit.backstage.serviceLayer.serviceDataManager;
    var undefined;

    function loadTrackingState(data, isPreProcessed) {

        var stateChanged = false;
        if (trackingState != data) {
            trackingState = data;
            stateChanged = true;

            if (!isPreProcessed) {

                if (/EB_APPTRACKING_CURRENT_STATE$/.test(this.url)) {
                    //first time init
                    conduit.coreLibs.aliasesManager.setAlias(conduit.coreLibs.aliasesManager.constants.APPTRACKING_CURRENT_STATE, trackingState);
                    this.url = conduit.coreLibs.aliasesManager.replaceAliases(this.url);
                } else if (trackingState) {
                    this.url = this.url.replace(/current=(.*)/, "current=" + trackingState);
                }
            }

        }
        conduit.triggerEvent("onReady", { name: serviceName });
        conduit.triggerEvent("onAppTrackingFirstTimeReady", {});


        return data;
    }

    function init(initData) {

        initData = initData || {};

        serviceData = initData.serviceData || conduit.backstage.serviceLayer.serviceMap.getItemByName("AppTrackingFirstTime");


        if (/EB_APPTRACKING_CURRENT_STATE$/.test(serviceData.url)) {
            //first time init
            conduit.coreLibs.aliasesManager.setAlias(conduit.coreLibs.aliasesManager.constants.APPTRACKING_CURRENT_STATE, trackingState);
            serviceData.url = conduit.coreLibs.aliasesManager.replaceAliases(serviceData.url);
        } else if (trackingState) {
            serviceData.url = serviceData.url.replace(/current=(.*)/, "current=" + trackingState);
        }

        serviceDataManager.addService({
            name: serviceName,
            url: serviceData.url,
            interval: serviceData.reload_interval_sec * 1000,
            callback: loadTrackingState,
            dataType: "json"
        }, function (returnedService) {
            service = returnedService;
        });

        if (conduit.backstage.serviceLayer.appTrackingFirstTime.init)
            delete conduit.backstage.serviceLayer.appTrackingFirstTime.init;
    }

    //toolabr settings are part of update flow that might cause by manual refresh, interval update, service map update
    conduit.subscribe("onSettingsReady", function (data) {
        if (data.serviceMapChange) { //only if service map was changed            
            var currentServiceData = serviceLayer.serviceMap.getItemByName("AppTrackingFirstTime");
            if (currentServiceData.url !== serviceData.url || currentServiceData.reload_interval_sec !== serviceData.reload_interval_sec) {
                //AppTrackingFirstTime data was changed run update on the service
                serviceDataManager.update(service, { url: currentServiceData.url, interval: currentServiceData.reload_interval_sec * 1000 }, data.forceUpdate);
            }
        }
    });


    function invokeService() {
        service.invoke();
    }

    function getTrackingState() {
        return trackingState;
    }

    conduit.abstractionlayer.commons.messages.onSysReq.addListener("serviceLayer.appTrackingFirstTime.getTrackingState", function (data, sender, callback) {
        var trackingStateValue;

        trackingStateValue = getTrackingState();
        callback(trackingStateValue);
    });

    conduit.abstractionlayer.commons.messages.onSysReq.addListener("serviceLayer.appTrackingFirstTime.getFirstTimeTrackingInfo", function (data, sender, callback) {

        var appTrackingUsageServiceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("AppTrackingUsage");
        var reload_interval_sec = appTrackingUsageServiceData.reload_interval_sec * 1000;
        var appTrackingData = JSON.stringify({ interval: reload_interval_sec, state: trackingState, isStateChanged: true });

        callback(appTrackingData);
    });



    return {
        getTrackingState: getTrackingState,
        init: init,
        refresh: invokeService
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.appTrackingFirstTime,
    dependencies: ["serviceMap", "toolbarSettings","aliasesManager"],
    onLoad: conduit.backstage.serviceLayer.appTrackingFirstTime.init
});
﻿conduit.register("backstage.serviceLayer.appTracking", (function () {
    var serviceName = "appTracking",
        service,
        serviceData,
        absCommons = conduit.abstractionlayer.commons,
        activeCTID = conduit.backstage.serviceLayer.login.getActiveCTID(),
        ctid = absCommons.context.getCTID().result,
        browserInfo = absCommons.environment.getBrowserInfo().result,
        osInfo = absCommons.environment.getOSInfo().result,
        messages = absCommons.messages,
        isActivate = false,
        isServiceAdded = false,
		isStoped = false,
		isInit = false;


    function initListener() {
        messages.onSysReq.addListener("serviceLayer.appTracking.invoke", function (dataStr) {
            invoke();
        });

        messages.sendSysReq("applicationLayer.appManager.model.isReady", "serviceLayer.appTracking", "", function () {
            invoke();
        });


    }

    function invoke() {
        if (isInit) return;
        invokeService();
        isInit = true
    }


    function init(initData) {
        initData = initData || {};
        serviceData = initData.serviceData || conduit.backstage.serviceLayer.serviceMap.getItemByName("AppTrackingUsage");


        initListener();

        if (conduit.backstage.serviceLayer.appTracking.init)
            delete conduit.backstage.serviceLayer.appTracking.init;
    }

    function buildToolbarData(callback) {

        messages.sendSysReq("applicationLayer.appManager.model.getAppTrackingAppsData", "serviceLayer.appTracking", "", function (data) {
            var appData = JSON.parse(data);
            appData = appData.status ? [] : appData.data.apps;
            absCommons.environment.getGlobalUserId(function (guidObj) {
                absCommons.context.getUserID(function (userIdObj) {

                    var toolbarData = {
                        ctid: activeCTID,
                        originalCtid: ctid,
                        toolbarVersion: absCommons.environment.getEngineVersion().result,
                        browser: browserInfo.type,
                        browserVersion: browserInfo.version,
                        os: osInfo.type,
                        osVersion: osInfo.version,
                        toolbarBornServerTime: conduit.backstage.serviceLayer.commons.getToolbarBornServerTime(),
                        locale: conduit.backstage.serviceLayer.config.toolbarSettings.getSettingsDataByRef().locale,
                        userId: userIdObj.result,
                        globalUserId: guidObj.result,
                        targetVersion: absCommons.environment.getEngineVersion().result,
                        targetType: "toolbar",
                        apps: appData
                    };
                    callback(JSON.stringify(toolbarData));
                });
            });
        });

    }

    function invokeService() {

        isActivate = conduit.backstage.serviceLayer.appTrackingFirstTime.getTrackingState() == "True" ? true : false;
        if (isActivate) {
            if (!isServiceAdded) {

                isServiceAdded = true;
                isStoped = false;
                conduit.backstage.serviceLayer.serviceDataManager.addService({
                    name: serviceName,
                    url: serviceData.url,
                    interval: serviceData.reload_interval_sec * 1000,
                    getAsyncData: true,
                    method: "POST",
                    getData: buildToolbarData,
                    isWithCache: true
                }, function (returnedService) {
                    service = returnedService
                    conduit.subscribe("onAppTrackingFirstTimeReady", function () {
                        invokeService();
                    });
                });
            }
            else {
                if (isStoped) {
                    isStoped = false;
                    if (service) {
                        service.start();
                    }
                }
            }
        }
        else {

            isStoped = true;
            if (service) {
                service.stop();
            }
        }
    }




    return {
        init: init,
        invoke: invoke
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.appTracking,
    dependencies: ["serviceMap", "toolbarSettings", "appTrackingFirstTime","aliasesManager"],
    onLoad: conduit.backstage.serviceLayer.appTracking.init
});
﻿conduit.register("backstage.serviceLayer.contextMenu", (function () {
    var toolbarContextMenu;
    var gottenAppsContextMenu;
    var otherAppsContextMenu;
    var toolbarContextMenuService;
    var gottenAppsContextMenuService;
    var otherAppsContextMenuService;
    var toolbarContextMenuData;
    var gottenAppsContextMenuData;
    var otherAppsContextMenuData;
    var locale;
    var aliasesManager = conduit.coreLibs.aliasesManager;
    var isSafari = /Safari/i.test(conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type);
    var serviceLayer = conduit.backstage.serviceLayer;
    var serviceDataManager = serviceLayer.serviceDataManager;
    var clone = conduit.utils.general.clone;

    function notifyReady(type) {
        conduit.abstractionlayer.commons.messages.postTopicMsg(
		"systemRequest.contextMenuReady." + type,
		"conduit.backstage.serviceLayer.contextMenu." + type,
		JSON.stringify(getData(type)));
    }

    // remove the "show/hide" items and the "more" sub menu. also remove the like menu items form safari
    function removeMenuItems(appData) {
        var showHideMenuItemsArray = ["51000005", "51200007", "51300005"];
        var safariLikeMenuItemsArray = ["51300003", "51200005", "51000003"];

        var menuItems = appData.data.menu.data.items;
        var newItems = [];
        var appId, appType;
        for (var i = 0; i < menuItems.length; i++) {
            appId = menuItems[i].appId;
            appType = menuItems[i].appType;
            if (showHideMenuItemsArray.indexOf(appId) > -1 || (isSafari && safariLikeMenuItemsArray.indexOf(appId) > -1) || appType == "MENU") {
                continue;
            } else {
                newItems.push(menuItems[i]);
            }
        }
        appData.data.menu.data.items = newItems;
    }

    function loadToolbarContextMenu(data, isPreProcessed) {
        if (!isPreProcessed) {
            //TODO consider using - conduit.backstage.serviceLayer.commons.fixParserError(xmlData).replace("\ufeff", "");			
            data = aliasesManager.replaceAliases(data);
            data = aliasesManager.replaceAliases(data, null, aliasesManager.constants.TYPE_MODES.DYNAMIC_CONTEXT_MENU);
            var xmlDoc = $.parseXML(data);
            data = serviceLayer.commons.appXml2Json(xmlDoc);
            // remove Show/Hide menu item
            removeMenuItems(data);
        }
        toolbarContextMenu = data;
        conduit.triggerEvent("onReady", { name: 'toolbarContextMenu' });
        notifyReady('toolbarContextMenu');
        return data;
    }

    function initToolbarContextMenu(initData) {
        initData = initData || {};
        locale = initData.locale || serviceLayer.config.toolbarSettings.getSettingsDataByRef().locale;
        //  toolbarContextMenu
        toolbarContextMenuData = initData.toolbarContextMenuData || serviceLayer.serviceMap.getItemByName("ToolbarContextMenu");
        toolbarContextMenuData.url = toolbarContextMenuData.url.replace("EB_LOCALE", locale);

        serviceDataManager.addService({
            name: 'toolbarContextMenu',
            url: toolbarContextMenuData.url,
            interval: toolbarContextMenuData.reload_interval_sec * 1000,
            callback: loadToolbarContextMenu,
            dataType: "xml"
        }, function (returnedData) {
            toolbarContextMenuService = returnedData;
        });
    }

    function loadGottenAppsContextMenu(data, isPreProcessed) {
        if (!isPreProcessed) {
            data = aliasesManager.replaceAliases(data);
            data = aliasesManager.replaceAliases(data, null, aliasesManager.constants.TYPE_MODES.DYNAMIC_CONTEXT_MENU);
            var xmlDoc = $.parseXML(data);
            data = serviceLayer.commons.appXml2Json(xmlDoc);
            // remove Show/Hide menu item
            removeMenuItems(data);
        }
        gottenAppsContextMenu = data;
        conduit.triggerEvent("onReady", { name: 'gottenAppsContextMenu' });
        notifyReady('gottenAppsContextMenu');
        return data;
    }

    function initGottenAppsContextMenu(initData) {
        initData = initData || {};
        locale = initData.locale || serviceLayer.config.toolbarSettings.getSettingsDataByRef().locale;
        //  gottenAppsContextMenu
        gottenAppsContextMenuData = initData.gottenAppsContextMenuData || serviceLayer.serviceMap.getItemByName("GottenAppsContextMenu");
        gottenAppsContextMenuData.url = gottenAppsContextMenuData.url.replace("EB_LOCALE", locale);

        serviceDataManager.addService({
            name: 'gottenAppsContextMenu',
            url: gottenAppsContextMenuData.url,
            interval: gottenAppsContextMenuData.reload_interval_sec * 1000,
            callback: loadGottenAppsContextMenu,
            dataType: "xml"
        }, function (returnedService) {
            gottenAppsContextMenuService = returnedService;
        });

    }

    function loadOtherAppsContextMenu(data, isPreProcessed) {
        if (!isPreProcessed) {
            data = aliasesManager.replaceAliases(data);
            data = aliasesManager.replaceAliases(data, null, aliasesManager.constants.TYPE_MODES.DYNAMIC_CONTEXT_MENU);
            var xmlDoc = $.parseXML(data);
            data = serviceLayer.commons.appXml2Json(xmlDoc);
            // remove Show/Hide menu item
            removeMenuItems(data);
        }
        otherAppsContextMenu = data;
        conduit.triggerEvent("onReady", { name: 'otherAppsContextMenu' });
        notifyReady('otherAppsContextMenu');
        return data;
    }

    /*
    * document other apps
    */
    function initOtherAppsContextMenu(initData) {
        initData = initData || {};
        locale = initData.locale || serviceLayer.config.toolbarSettings.getSettingsDataByRef().locale;
        //  otherAppsContextMenu
        otherAppsContextMenuData = initData.otherAppsContextMenuData || serviceLayer.serviceMap.getItemByName("OtherAppsContextMenu");
        otherAppsContextMenuData.url = otherAppsContextMenuData.url.replace("EB_LOCALE", locale);

        serviceDataManager.addService({
            name: 'otherAppsContextMenu',
            url: otherAppsContextMenuData.url,
            interval: otherAppsContextMenuData.reload_interval_sec * 1000,
            callback: loadOtherAppsContextMenu,
            dataType: "xml"
        }, function (returnedService) {
            otherAppsContextMenuService = returnedService;
        });

    }

    function init(initData) {
        initData = initData || {};
        locale = initData.locale || serviceLayer.config.toolbarSettings.getSettingsDataByRef().locale;
        initToolbarContextMenu({ locale: initData.locale });
        initGottenAppsContextMenu({ locale: initData.locale });
        initOtherAppsContextMenu({ locale: initData.locale });

        if (serviceLayer.contextMenu.init)
            delete serviceLayer.contextMenu.init;
    }


    //toolabr settings are part of update flow that might cause by manual refresh, interval update, service map update
    conduit.subscribe("onSettingsReady", function (data) {
        if (data.serviceMapChange || data.internalUpdate) { //service map or settings were changed  
            locale = data.settingsData.locale || locale;
            var currentServiceData = serviceLayer.serviceMap.getItemByName("ToolbarContextMenu");

            if (currentServiceData.url !== toolbarContextMenuData.url || currentServiceData.reload_interval_sec !== toolbarContextMenuData.reload_interval_sec || data.settingsData.locale !== locale) {
                var url = updateLocaleInUrl(locale, currentServiceData.url);
                serviceDataManager.update(toolbarContextMenuService, { url: url, interval: currentServiceData.reload_interval_sec * 1000 }, data.forceUpdate);
            }

            var currentServiceData = serviceLayer.serviceMap.getItemByName("GottenAppsContextMenu");

            if (currentServiceData.url !== gottenAppsContextMenuData.url || currentServiceData.reload_interval_sec !== gottenAppsContextMenuData.reload_interval_sec || data.settingsData.locale !== locale) {
                var url = updateLocaleInUrl(locale, currentServiceData.url);
                serviceDataManager.update(gottenAppsContextMenuService, { url: url, interval: currentServiceData.reload_interval_sec * 1000 }, data.forceUpdate);
            }

            var currentServiceData = serviceLayer.serviceMap.getItemByName("OtherAppsContextMenu");

            if (currentServiceData.url !== otherAppsContextMenuData.url || currentServiceData.reload_interval_sec !== otherAppsContextMenuData.reload_interval_sec || data.settingsData.locale !== locale) {
                var url = updateLocaleInUrl(locale, currentServiceData.url);
                serviceDataManager.update(otherAppsContextMenuData, { url: url, interval: currentServiceData.reload_interval_sec * 1000 }, data.forceUpdate);
            }
        }
    });

    function invokeService() {
        toolbarContextMenuService.invoke();
        gottenAppsContextMenuService.invoke();
        otherAppsContextMenuService.invoke();
    }

    function getData(type) {
        if (type == 'toolbarContextMenu') {
            return toolbarContextMenu;
        } else if (type == 'gottenAppsContextMenu') {
            return gottenAppsContextMenu;
        } else {
            return otherAppsContextMenu;
        }
    }

    function getContextMenus() {
        return clone({
            toolbarContextMenu: getData('toolbarContextMenu'),
            gottenAppsContextMenu: getData('gottenAppsContextMenu'),
            otherAppsContextMenu: getData('otherAppsContextMenu')
        });
    }

    conduit.abstractionlayer.commons.messages.onSysReq.addListener("serviceLayer.contextMenu.getContextMenus", function (data, sender, callback) {
        callback(JSON.stringify(getContextMenus()));
    });


    return {
        getContextMenus: getContextMenus,
        init: init,
        refresh: invokeService
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.contextMenu,
    dependencies: ["serviceMap", "toolbarSettings", "aliasesManager"],
    onLoad: conduit.backstage.serviceLayer.contextMenu.init
});
﻿conduit.register("backstage.serviceLayer.userApps", (function ($, undefined) {
    var appsData = [];
    var logger = conduit.coreLibs.logger;
    var clone = conduit.utils.general.clone;
    var service;
    var serviceData;
    var socialDomains = [];
    var appsGuidList = [];
    var serviceName = "userApps";
    var isInit = false;
    var serviceDataParameter;
    var addedCounter = 0;
    var addedCounterRepositoryKey = "serviceLayer_userApps_added";
    var removedCounter = 0;
    var removedCounterRepositoryKey = "serviceLayer_userApps_removed";
    var repository = conduit.coreLibs.repository;
    var absCommons = conduit.abstractionlayer.commons;
    var absRepository = conduit.abstractionlayer.commons.repository;
    var oUserAppsGuids = {};
    var studio_callbacks = new Array();
    var serviceDataManager = conduit.backstage.serviceLayer.serviceDataManager;
    var userAppServices = [];

    function addAppData(appXml, isPreProcessed, extraData) {
        try {
            if (isPreProcessed) {
                appsData = appXml.apps;
            }
            else {
                if (extraData && extraData.isRawData) {
                    var processedData;
                    //The appXml is a json with a map of xmls. this will happen when the user apps settings file is missing.
                    // usually when upgrading to newer toolbar version.
                    for (var guid in appXml) {
                        processedData = addUserAppXml(appXml[guid], false, true);
                    }
                    extraData.isRawData = false;
                    return processedData;
                }
                else {
                    // simple raw app xml                    
                    return addUserAppXml(appXml, true, false, extraData && extraData.update);
                }
            }

        } catch (error) {
            absCommons.logging.logError({ errorMessage: "Error adding app data.", errorObject: error });
        }
    }


    function setRawDataXML(appGuid, appXml) {
        // set the raw xml as a map of app's xml with guid as keys.
        var appsMap = {};
        appsMap[appGuid] = appXml;
        var fileName = serviceDataManager.getRepositoryKeyName(serviceName, true);
        conduit.coreLibs.repository.getData(fileName, function (rawRepositoryData) {
            if (rawRepositoryData) {
                rawRepositoryData[appGuid] = appXml;
                appsMap = rawRepositoryData;
            }
            conduit.coreLibs.repository.setData(fileName, appsMap, function () { });
            if (service) {
                service.onCompleteInvoke(); // this will set the lastUpdate time of the service.
            }
        });
    }

    function removeAppFromRawData(appGuid) {
        var fileName = serviceDataManager.getRepositoryKeyName(serviceName, true);
        conduit.coreLibs.repository.getData(fileName, function (rawRepositoryData) {
            if (rawRepositoryData && rawRepositoryData[appGuid]) {
                delete rawRepositoryData[appGuid];
                conduit.coreLibs.repository.setData(fileName, rawRepositoryData, function () { });
            }
        });
    }

    function addUserAppXml(appXml, shouldSetRawDataXml, isRawData, appUpdate) {
        appXml = appXml.replaceReservedKeywords();
        // Fix for jQuery bug (it removes "</SOURCE>" for some reason):
        appXml = appXml.replace(/<source>/ig, "<srctemp>").replace(/<\/source>/ig, "</srctemp>");
        var xmlData = conduit.backstage.serviceLayer.commons.fixParserError(appXml);
        var xmlDoc = $.parseXML(xmlData);


        var deleted = ($(xmlDoc).find("FLAGS").text() == "DELETED");
        var appGuid = $(xmlDoc).find("COMPONENT_INSTANCE_GUID").remove().text(); // marketplace guid
        var appClientGuid = conduit.abstractionlayer.backstage.guid.generate().result;
        var xmlNode = $(xmlDoc).find("COMPONENT_XML:first").children(":first");
        var appData = conduit.backstage.serviceLayer.commons.appXml2Json(xmlNode);
        if (deleted) {
            removeAppFromModelAndRepository({ appGuid: appGuid });
            return;
        }
        if (!appData) {
            // we failed to get the user app.
            logger.logError('Failed to get the user app with Guid : ' + appGuid + '. XML: ' + appXml, { className: "userApps", functionName: "addUserAppXml", name: serviceName });
            return;
        }
        // Fix for jQuery bug (same as above):
        if (appData.data) {
            if (appData.data.data && appData.data.data.srctemp) {
                appData.data.data.source = appData.data.data.srctemp;
                delete appData.data.data.srctemp;
            }
            if (appData.data.managed) {
                // fixed managed parameter location when converted from raw xml data.
                appData.managed = appData.data.managed;
                delete appData.data.managed;
            }
        }

        if (shouldSetRawDataXml) {
            setRawDataXML(appGuid, appXml);
        }

        return handleAppSettings(appData, appGuid, appClientGuid, isRawData, appUpdate);
    }

    function handleAppSettings(appData, appGuid, appClientGuid, isRawData, appUpdate) {
        if (appData.appType == "WEBAPP") {
            appData = addWebApp(appData, appGuid, appData.data.webappGuid);
            appData.isUserWebApp = true;
        }
        else {
            appData.isUserApp = true;
            appData.appGuid = appGuid;
            conduit.backstage.serviceLayer.commons.setViewData(appData);
        }
        if (appData.appType === "BROWSER_COMPONENT" && appData.data) {
            var fixedHeigth;
            if (window.chrome || navigator.userAgent.indexOf("Firefox") != -1 || window.safari) {
                fixedHeigth = (window.chrome || window.safari) ? 26 : 28 // for BC backward compitibility
            }
            else {
                fixedHeigth = appData.data && appData.data.height;
            }
            if (appData.data) {
                appData.data.originalHeight = appData.data.height;
                appData.data.height = fixedHeigth;
            }
            if (appData.viewData && appData.viewData.embedded && appData.viewData.embedded.size) {
                appData.viewData.embedded.size.originalHeight = appData.viewData.embedded.size.height;
                appData.viewData.embedded.size.height = fixedHeigth;
            }
        }
        // price-gong.
        if (appData && appData.appGuid === "1ec55dac-8dca-406b-9697-5d68893c1c0c") {
            var oPriceGong = conduit.backstage.serviceLayer.optimizer.getPriceGongAppData();
            var originalAppGuid = appData.appGuid;

            oPriceGong.managed = appData.managed;
            appData = oPriceGong;
            appData.isUserApp = true;
            appData.appGuid = originalAppGuid;
            appData.viewData.hasBgpage = true;
            appData.viewData.managed = appData.managed;
            appData.viewData.bIsNotAutoPopup = appData.managed ? true : false; // do not simulate click event when this is added to the view
        }

        // in case of first installation & we have imported
        // oldbar userapps we should find a flag in this object.
        // in this case we add additional flag for the view 
        // to not open the new app's popup automatically. 
        if (oUserAppsGuids[appData.appGuid]) {
            if (appData.viewData) {
                appData.viewData.bIsNotAutoPopup = true;
                oUserAppsGuids[appData.appGuid] = null;
            }
            //Do not override the app options. they were set by the upgrade process in abs layer.
        }
        else if (!isRawData && !appUpdate) { // if we are parsing raw data file, we should not override the appOptions data.
            setAppOptions(appData.appId);
        }
        if (appUpdate) {
            replaceAppData(appData);
            // TODO consider  - do not override the repository file. do the same for raw data and for other services like toolbar settings
        }
        else {
            appData.appClientGuid = appClientGuid;
            appsData.push(appData);
            logger.logDebug('Added app: ' + appData.appId + ' to appsData object: ' + JSON.stringify(appsData), { className: "userApps", functionName: "handleAppSettings" });

            repository.setData(addedCounterRepositoryKey, String(++addedCounter), function () { });

            //TODO if this app was added from 'addUserAppByJson' externally (studio), do not show a place holder in the view.
            absCommons.messages.postTopicMsg(
                "serviceLayer.onUserAppsChange",
                "serviceLayer.userApps",
                JSON.stringify({ addedAppData: appData }));

            if (!appData.isDeveloperApp && !isRawData && !appData.managed) {
                // Send usage and clean usage data:
                conduit.backstage.serviceLayer.usage.sendAppRegisterUsage($.extend({
                    removedAppsCount: removedCounter,
                    addedAppsCount: addedCounter
                },
                    { marketplaceComponentGuid: appData.appGuid,
                        componentClientInstanceGuid: appData.appClientGuid
                    }
                ),
		            function (data) {
		                try {
		                    if (JSON.parse(data.result.responseData).Response) {
		                        absCommons.messages.postTopicMsg("serviceLayer.userApps.onAppRegisterUsageReceived", "serviceLayer.userApps", JSON.stringify({ "data": data.result.responseData, "appId": appData.appId, "appGuid": appData.appGuid }));
		                    }
		                } catch (e) {
		                    conduit.coreLibs.logger.logError('Failed to sendAppRegisterUsage', { className: "userApps.js", functionName: "sendAppRegisterUsage" }, { code: conduit.coreLibs.logger.GeneralCodes.GENERAL_ERROR, error: e, name: serviceName });
		                }
		            });
            }

            // send cookies
            appsGuidList.push(appGuid);
            createSocialDomainsCookies();
        }

        return { apps: appsData };
    }
    function replaceAppData(appData) {
        for (var i = 0; i < appsData.length; i++) {
            if (appsData[i].appGuid == appData.appGuid) {
                appData.appClientGuid = appsData[i].appClientGuid;
                if (!isSameAppData(appsData[i], appData)) {
                    appsData[i] = appData;
                    updateModel(appData); // we must update the model and view in this session so that the state file will also be updated.
                    return true;
                }
            }
        }
    }
    function updateModel(appData) {
        if (appData.appType == "WEBAPP") {
            return;
        }
        appData.update = true;
        absCommons.messages.postTopicMsg("serviceLayer.onUserAppsChange", "serviceLayer.userApps", JSON.stringify({ addedAppData: appData }));
    }
    function isSameAppData(oldData, newData) {
        if (oldData.appType == "WEBAPP") {
            if (oldData.icon == newData.icon &&
                oldData.tooltip == newData.tooltip &&
                oldData.text == newData.text /*TODO: maybe verify webappGuid*/) {
                return true;
            } else {
                return false;
            }
        }
        else if (JSON.stringify(oldData) == JSON.stringify(newData)) {
            return true;
        }

        return false;
    }

    function addWebApp(currentAppData, appGuid, webappGuid) {

        //this should create a place holder.
        var appData = {
            appGuid: appGuid,
            webappGuid: webappGuid,
            appId: currentAppData.appId,
            appType: currentAppData.appType,
            icon: currentAppData.data && currentAppData.data.icon,
            text: currentAppData.data && currentAppData.data.text,
            tooltip: currentAppData.data && currentAppData.data.tooltip,
            viewData: {
                viewType: "webapp",
                appId: currentAppData.appId,
                isShow: "true",
                isPlaceHolder: true,
                userAppsLocation: "AFTER_SEARCH"
            }
        }
        //TODO check currentAppData.pageType == background and do not add the viewData. this will not show the place holder for bg page only apps.
        if (!currentAppData.pages && currentAppData.data && currentAppData.data.pageType == "Background") {
            delete appData.viewData;
        }

        conduit.backstage.serviceLayer.webAppSettings.handleUserApp(appData.webappGuid, appData.appId, false);
        return appData;

    }

    //TODO: do we still need this?
    function createSocialDomainsCookies() {
        var cookies = conduit.abstractionlayer.backstage.browserData;
        var ctid = absCommons.context.getCTID().result;

        absCommons.environment.getGlobalUserId(function (guidObj) {
            absCommons.context.getUserID(function (userIdObj) {
                if (!socialDomains || !socialDomains.length) return;

                for (var i = 0; i < socialDomains.length; i++) {
                    var cookieName = "InstalledSource_" + conduit.backstage.serviceLayer.login.getActiveCTID(),
			       cookieExpirationDateInHours = 365 * 24, // One year from today, in hours
                   cookieValue = JSON.stringify({
                       "globalUserId": guidObj.result,
                       "sourceUserId": userIdObj.result,
                       "sourceId": ctid,
                       "appsList": appsGuidList
                   });
                    var cookieDomain = "http://" + socialDomains[i];
                    var writeResult = cookies.writeCookie(
                        cookieName,
                        cookieDomain,
                        cookieExpirationDateInHours,
                        cookieValue,
                        function (result) { });
                }
            });
        });
    }

    function findApp(appId) {
        var app;

        for (var i = 0, count = appsData.length; i < count && !app; i++) {
            var appData = appsData[i];
            if (appData.appId === appId) {
                app = { index: i, appData: appData };
            }
        }

        return app;
    }

    function findAppByGuid(appGuid) {
        var app;

        for (var i = 0, count = appsData.length; i < count && !app; i++) {
            var appData = appsData[i];
            if (appData.appGuid === appGuid) {
                app = { index: i, appData: appData };
            }
        }

        return app;
    }

    function createAppsGuidList(appsData) {
        var ans = [];
        for (var i = 0; i < appsData.length; i++) {
            ans.push(appsData[i].appGuid);
        }
        return ans;
    }


    function addWebappToSettings(response) {

        var webappData = response.manifestData;
        var staged = response.staged;
        var isPlaceHolder = true;
        webappData.renderView = false;

        var index = 0;
        if (!webappData.isDeveloperApp) {
            index = getAppIndex(webappData.appId);
        }

        if (index > -1) {
            // first installation of webapp from market place                             
            var appClientGuid = conduit.abstractionlayer.backstage.guid.generate().result;
            webappData.appClientGuid = appClientGuid;

            if (appsData[index] && !webappData.isDeveloperApp) {
                webappData.appGuid = appsData[index].appGuid; // marketplace guid
            }

            // view data will be set only for embedded or popup pages
            if (webappData.pages) {

                if (webappData.pages.embedded || webappData.pages.popup) {
                    conduit.backstage.serviceLayer.commons.setViewData(webappData);
                    webappData.renderView = true;
                    isPlaceHolder = false;
                }
                else {
                    delete webappData.viewData;
                }
            }

            if (!staged) {
                if (!webappData.isDeveloperApp && (response.versionUpdated || isPlaceHolder)) {
                    removeAndAddwebappToSettings(webappData, staged, index);
                }
                else {
                    addWebappToModelAndSettings(webappData, staged, index);
                }
            }
            else {
                var clonedAppsData = $.extend({}, appsData);
                clonedAppsData[index] = webappData;
                service.updateData({ apps: clonedAppsData });
            }
        }
    }

    function removeAndAddwebappToSettings(webappData, staged, index) {
        webappData.renderView = false;
        //remove the current place holder
        var appOptions = {};
        appOptions[webappData.appId] = {
            disabled: true,
            isToRemove: true,
            removeService: false,
            appGuid: webappData.appGuid,
            appId: webappData.appId
        };

        var repositoryObj = { apps: appOptions, addPersonalApps: false };

        var obj = {
            method: "update",
            data: repositoryObj
        };
        absCommons.messages.sendSysReq("handleOptions", "options", JSON.stringify(obj), function (response) {

            if (response) {
                response = JSON.parse(response);
                if (response.result == false) {
                    var error = { "result": false, "status": 800, "description": 'Unexpected error, failed to remove app' };
                    throw new Error(error);
                }
                addWebappToModelAndSettings(webappData, staged, index);
            }
        });
    }

    function addWebappToModelAndSettings(webappData, staged, index) {

        if (index > -1) {
            // first installation of webapp from market place                             
            var appClientGuid = conduit.abstractionlayer.backstage.guid.generate().result;
            webappData.appClientGuid = appClientGuid; //TODO do only once

            if (webappData.isDeveloperApp) {
                appsData.splice(0, 0, webappData);
            }
            else {
                appsData[index] = webappData;
            }
            service.updateData({ apps: appsData });

            absCommons.messages.postTopicMsg(
            "serviceLayer.onUserAppsChange",
            "serviceLayer.userApps",
            JSON.stringify({ addedAppData: webappData }));
        }
    }


    function getAppIndex(appId) {
        for (var i = 0, count = appsData.length; i < count; i++) {
            var appData = appsData[i];
            if (appData.appId == appId) {
                return i;
            }
        }
        return -1;
    }

    function getWebApps(data, isDeveloperApps) {
        if (!data) {
            data = appsData;
        }
        var webapps = [];
        for (var i = 0, count = appsData.length; i < count; i++) {
            var appData = appsData[i];
            if (appData.appType == "WEBAPP") {
                if (isDeveloperApps) {
                    if (appData.isDeveloperApp) {
                        webapps.push(appData);
                    }
                }
                else {
                    webapps.push(appData);
                }
            }
        }
        return webapps;
    }

    /* Code Block: Studio */
    /* desc: prepare fallback object and execute a studio callback
    */
    function fallbackDeveloperApp(data, callback) {

        if (data instanceof Error) {
            data = { "description": 'Unexpected error:' + data.message, "status": 800 }
        }
        if (callback) {
            if (data.errors) {
                data.errorData = data.errors;
                data.description = 'The validation process for the app failed';
                data.status = 750;
                delete data.errors;
            }

            callback(JSON.stringify(data));
        }
    } //method

    /*desc: validate a callback existence and data object
    @callback (mandatory)
    @data - (mandatory) must be instance of object
    @param - (optionally) array of properties to test in data object
    */
    function validateParams(callback, data, params) {
        if (!params) { params = []; }
        var isValid = { result: true, description: 'Invalid parameters', status: 100, errorData: [] };
        if (typeof callback != 'function') {
            isValid.result = false;
            isValid.errors.push({ "errorMessage": 'Missing cbSuccess callback parameter', "errorCode": 801 });
        }
        if (typeof (data) != 'object') {
            isValid.result = false;
            isValid.errors.push({ "errorCode": 800, "errorMessage": 'Unexpected error: <data> is missing or not an object' });
        }
        for (var key in params) {
            if (!key || typeof (data[params[key]]) != 'undefined') {
                continue;
            }
            isValid.result = false;
            isValid.errors.push({ "errorCode": 100, "errorMessage": 'Invalid or missing argument <' + params[key] + '>' });
        }
        return isValid;
    } //method

    //add listener to get event then app ready on view
    absCommons.messages.onTopicMsg.addListener("serviceLayer.onUserAppsChange", function (data) {
        if (typeof (data) == 'string') { data = JSON.parse(data); }
        if (!data || !data.addedAppData || !data.addedAppData.appGuid) { return; }

        st_app_callback = studio_callbacks[data.addedAppData.appGuid];
        delete studio_callbacks[data.addedAppData.appGuid];
        if (st_app_callback) {
            var studioAppInfo = createStudioAppInfo(data.addedAppData.appId);
            st_app_callback(JSON.stringify(studioAppInfo));
        }
    });


    function createRepositoryWebAppsDirectory(repositoryWebAppFilesPath) {
        absCommons.files.isDirectoryExists(repositoryWebAppFilesPath, function (res) {
            var isDirectoryExists = res.result;
            if (!isDirectoryExists) {
                absCommons.files.createDirectory(repositoryWebAppFilesPath, function (response) {
                    continueFlow();
                });
            } else {
                continueFlow();
            }
            // check if the browserAppApi file exists
            function continueFlow() {
                absCommons.files.isFileExists(repositoryWebAppFilesPath + "\\browserAppApi.js", function (resp) {
                    var isBrowserAppApiFileExists = resp;
                    if (!isBrowserAppApiFileExists) {
                        absCommons.appFiles.deployBrowserAppApi(repositoryWebAppFilesPath);
                        //TODO also do it in autoupdate.		
                    }
                });

            }
        });
    }


    /* desc: Deploy developer application in toolbar 
    @data.appGuid -(mandatory) 
    @data.appId - (default=appGuid)
    @data.srcPath -(mandatory) app src files folder 		
    @callback -(mandatory) function to call when deploy is done or failed 		
    @previousAppData -(optional) only in redeploy flow.
    */
    function deployDeveloperApp(data, validate, callback, previousAppData) {
        try {
            /*precondition block*/
            if (typeof (data) == 'string') { data = JSON.parse(data); }
            var valid = validateParams(callback, data, ['appGuid', 'srcPath']);
            if (!valid.result) { fallbackDeveloperApp(valid, callback); return; }
            data.appId = data.appId || data.appGuid;
            /*eob*/

            var resourcesBasePath = ''; // TODO move to a sync way absCommons.environment.getResourcesBasePath().result;
            var repositoryPath = ''; // TODO move to a sync way(absCommons.environment.getRepositoryPath && absCommons.environment.getRepositoryPath() && absCommons.environment.getRepositoryPath().result) ? (absCommons.environment.getRepositoryPath().result).replace('file:///', "").replace(/[/\\]+/g, "\\") : "";
            var webappsDirectoryName = "\\webapps";
            var webAppDirectory = resourcesBasePath + webappsDirectoryName;
            var app_full_path = webAppDirectory + "\\" + data.appGuid + "_1.0";

            createRepositoryWebAppsDirectory(webAppDirectory);
            absCommons.files.isDirectoryExists(app_full_path, function (ops) {
                if (!ops.result) {
                    absCommons.files.createDirectory(app_full_path, function (ops) {
                        if (!ops.result) {
                            fallbackDeveloperApp(ops, callback);
                            return;
                        }
                        continueDeploymentFlow();
                    });
                } else {
                    continueDeploymentFlow;
                }
                function continueDeploymentFlow() {
                    var app_path = 'webapps\\' + data.appGuid + "_1.0";
                    ops = absCommons.appFiles.deployApp(data.srcPath, app_path, true);
                    if (!ops.result) {
                        fallbackDeveloperApp(ops, callback);
                        removeWebAppFolder(data.appGuid, "1.0");
                        return;
                    }
                    //add callback to callback hash
                    studio_callbacks[data.appGuid] = callback;

                    var manifestData = conduit.backstage.serviceLayer.webAppSettings.loadManifestData(app_path);
                    if (manifestData && manifestData.status) {
                        removeWebAppFolder(data.appGuid, "1.0");
                        return fallbackDeveloperApp(manifestData, callback);
                    }

                    var permissionsData = {
                        apiPermissions: {
                            crossDomainAjax: true,
                            getMainFrameTitle: true,
                            getMainFrameUrl: true,
                            getSearchTerm: true,
                            instantAlert: true,
                            jsInjection: true,
                            sslGranted: true
                        }
                    };

                    var extendedManifest = $.extend({}, manifestData);
                    conduit.backstage.serviceLayer.webAppSettings.addViewSettings(extendedManifest, { 'webappGuid': data.appGuid, 'appId': data.appId, 'isDeveloperApp': true, 'webAppFullPath': app_full_path, 'data': permissionsData, 'webAppRelativePath': "\\" + app_path });
                    extendedManifest.developerAppVersion = extendedManifest.version;
                    extendedManifest.version = "1.0";
                    extendedManifest.appGuid = data.appGuid;
                    extendedManifest.localPath = data.srcPath;

                    var file_list = absCommons.appFiles.getWebAppFiles(app_path, true);
                    if (file_list && file_list.result) {
                        var appFileList = file_list.result;
                        for (var i = 0; i < appFileList.length; i++) {
                            appFileList[i] = appFileList[i].replace(app_full_path, "");
                        }
                        file_list.result = appFileList;
                    }


                    var serviceData = conduit.backstage.serviceLayer.serviceMap.getItemByName('WebAppValidation');
                    if (!serviceData) {
                        fallbackDeveloperApp({ "result": false, "description": 'No service data', "status": 800 }, callback);
                        return;
                    }

                    if (validate) {
                        serviceDataManager.addService({
                            "name": 'WebAppValidation',
                            "url": serviceData.url,
                            "callback": function (service_data, isPreProcessed) {
                                if (typeof (service_data) == 'string') { service_data = JSON.parse(service_data); }
                                if (!service_data.result) {
                                    fallbackDeveloperApp(service_data, callback);
                                    // remove folder;						
                                    removeWebAppFolder(data.appGuid, "1.0");
                                    return;
                                }

                                if (previousAppData) {
                                    // we are in reload flow. we need to remove the previous app and add the reloaded app.
                                    removeDeveloperApp(previousAppData, function () {
                                        removeWebAppFolder(data.appGuid, "1.0");
                                        deployDeveloperApp({ "appGuid": previousAppData.appGuid, "appId": previousAppData.appId, "srcPath": data.srcPath }, false, callback); // ofir					
                                    });
                                }
                                else {
                                    //add app to model and view                    
                                    addWebappToSettings({ "manifestData": extendedManifest, "staged": false });
                                }
                            },
                            "dataType": 'application/x-www-form-urlencoded',
                            "method": 'POST',
                            "getData": function (getData_callback) {//prepare data to validation service					
                                var post_data = JSON.stringify({ "manifest": JSON.stringify(manifestData), "directoryStructure": file_list.result });
                                getData_callback(post_data);
                            },
                            "getAsyncData": true,
                            "manualInvoke": true,
                            "ignoreSetRawData": true,
                            "ignoreGetRawData": true
                        }, function (service) {
                            service.invoke();
                        });
                    }
                    else {
                        addWebappToSettings({ "manifestData": extendedManifest, "staged": false });
                    }
                }
            });
        } catch (ex) {
            fallbackDeveloperApp(ex, callback);
            removeWebAppFolder(data.appGuid, "1.0");
        }
    } //method


    function loadDeveloperApp(data, callback) {
        try {
            /*precondition block*/
            if (typeof (data) == 'string') { data = JSON.parse(data); }
            var valid = validateParams(callback, data, ['from_path']);
            if (!valid.result) { fallbackDeveloperApp(valid); return; }
            /*eob*/

            var appGuid = conduit.abstractionlayer.backstage.guid.generate().result;
            deployDeveloperApp({ "appGuid": appGuid, "appId": appGuid, "srcPath": data.from_path }, true, callback);
        } catch (ex) {
            fallbackDeveloperApp(ex, callback);
        }
    } //method


    function enableDeveloperApp(data, callback) {
        try {
            /*precondition block*/
            if (typeof (data) == 'string') { data = JSON.parse(data); }
            var valid = validateParams(callback, data, ['appId']);
            if (!valid.result) { fallbackDeveloperApp(valid, callback); return; }
            /*eob*/


            var appData = findApp(data.appId);
            if (!appData) {
                return fallbackDeveloperApp({ "result": false, "description": 'The specified appId <' + data.appId + '> does not exist', "status": 802 }, callback);
            }
            // check if the app is already enabled/disabled
            var disable = false;
            if (data.disable !== undefined) {
                disable = data.disable;
            }
            var state = disable ? 'disabled' : 'enabled';

            var appOptions = conduit.coreLibs.config.getAppOptions();
            var options = appOptions[data.appId];

            if (options && options.disabled === disable) {
                //the app is already enabled/disabled
                return fallbackDeveloperApp({ "result": false, "description": 'The specified appId is already ' + state, "status": 803 }, callback);
            }

            var repositoryObj = setAppOptions(data.appId, data.disable);
            var obj = {
                method: "update",
                data: repositoryObj
            };
            absCommons.messages.sendSysReq("handleOptions", "options", JSON.stringify(obj), function (response) {
                callback(JSON.stringify({ result: true }));
            });
        } catch (ex) {
            fallbackDeveloperApp(ex, callback);
        }
    }


    function setAppOptions(appId, disable) {
        var appOptions = conduit.coreLibs.config.getAppOptions() || {};
        appOptions[appId] = {};
        if (disable) {
            appOptions[appId] = { disabled: true };
        }
        else {
            appOptions[appId] = { disabled: false, render: true };
        }
        logger.logDebug('Setting app options from user app service: ' + JSON.stringify(appOptions), { className: "userApps", functionName: "setAppOptions" });
        conduit.coreLibs.config.setAppOptions(appOptions);
        var repositoryObj = { apps: appOptions, addPersonalApps: false };

        return repositoryObj;
    }

    function disableDeveloperApp(data, callback) {
        try {
            /*precondition block*/
            if (typeof (data) == 'string') { data = JSON.parse(data); }
            var valid = validateParams(callback, data);
            if (!valid.result) { fallbackDeveloperApp(valid, callback); return; }
            /*eob*/
            data.disable = true;
            enableDeveloperApp(data, callback)
        } catch (ex) {
            fallbackDeveloperApp(ex, callback);
        }
    }


    function reloadDeveloperApp(data, callback) {
        try {
            /*precondition block*/
            if (typeof (data) == 'string') { data = JSON.parse(data); }
            var valid = validateParams(callback, data, ['appId']);
            if (!valid.result) { fallbackDeveloperApp(valid, callback); return; }
            /*eob*/


            var app = findApp(data.appId); //app is object with @index and @appData
            if (!app || !app.appData) {
                fallbackDeveloperApp({ "result": false, "status": 802, "description": 'The specified appId does not exist' }, callback);
                return;
            }

            // first we need to validate the new app. only if it is valid, we will replace it.
            var appGuid = conduit.abstractionlayer.backstage.guid.generate().result;
            deployDeveloperApp({ "appGuid": appGuid, "appId": app.appData.appId, "srcPath": app.appData.localPath }, true, callback, app.appData);

        } catch (ex) {
            fallbackDeveloperApp(ex, callback);
        }
    } //method


    function removeDeveloperApp(data, callback) {
        try {
            /*precondition block*/
            if (typeof (data) == 'string') { data = JSON.parse(data); }
            var valid = validateParams(callback, data, ['appId']);
            if (!valid.result) { fallbackDeveloperApp(valid, callback); return; }
            /*eob*/

            var appId = data.appId;
            var app = findApp(appId);
            if (!app || !app.appData) {
                fallbackDeveloperApp({ "result": false, "status": 802, "description": 'The specified appId <' + appId + '> does not exist' }, callback);
                return;
            }


            var appData = app.appData;
            var appOptions = conduit.coreLibs.config.getAppOptions() || {};
            appOptions[appId] = {};

            appOptions[appId] = {
                disabled: true,
                isToRemove: true,
                appGuid: appData.appGuid,
                appId: appId,
                appClientGuid: appData.appClientGuid
            };

            conduit.coreLibs.config.setAppOptions(appOptions);
            var singleAppOptions = {};
            singleAppOptions[appId] = appOptions[appId];
            var repositoryObj = { apps: singleAppOptions, addPersonalApps: false };

            var obj = {
                method: "update",
                data: repositoryObj
            };
            absCommons.messages.sendSysReq("handleOptions", "options", JSON.stringify(obj), function (response) {

                if (response) {
                    response = JSON.parse(response);
                    if (response.result == false) {
                        var error = { "result": false, "status": 800, "description": 'Unexpected error, failed to remove app' };
                        callback(JSON.stringify(error));
                        return;
                    }
                }

                var webAppDirectory = "\\webapps\\" + appData.appGuid + "_1.0";
                absCommons.appFiles.removeApp(webAppDirectory);

                callback(JSON.stringify({ result: true }));
            });
        } catch (ex) {
            fallbackDeveloperApp(ex, callback);
        }
    }

    function removeWebAppFolder(appGuid, version) {
        var webAppDirectory = "\\webapps\\" + appGuid + "_" + version;
        absCommons.appFiles.removeApp(webAppDirectory);
    }

    function getListDeveloperApp(data, callback) {
        try {
            var studioAppInfoArr = [];
            var developerAppsArr = getWebApps(null, true);

            for (var i in developerAppsArr) {
                app = developerAppsArr[i];
                var studioAppInfo = createStudioAppInfo(app.appId);
                studioAppInfoArr.push(studioAppInfo);
            }
            callback(JSON.stringify(studioAppInfoArr));

        }
        catch (ex) {
            fallbackDeveloperApp(ex, callback);
        }
    }

    function createStudioAppInfo(appId, enabled) {
        var studioAppInfo = {};
        var app = findApp(appId);
        if (app && app.appData) {
            var appData = app.appData;
            var name = appData.name;
            var desc = appData.description;
            var path = appData.localPath;
            var icon = appData.viewData && appData.viewData.icon ? appData.viewData.icon : "";
            var version = appData.developerAppVersion ? appData.developerAppVersion : appData.version;

            var appOptions = conduit.coreLibs.config.getAppOptions();
            var options = appOptions[appData.appId];

            var isEnabled;
            if (enabled !== undefined) {
                isEnabled = enabled;
            }
            else {
                isEnabled = options && options.disabled === true ? false : true;
            }



            studioAppInfo = { appId: appId, name: name, description: desc, path: path, icon: icon, isEnabled: isEnabled, version: version };
            return studioAppInfo;
        }

        return studioAppInfo;

    }

    absCommons.messages.onSysReq.addListener('serviceLayer.userApps.studio', function (prop, sender, callback) {
        try {
            prop = JSON.parse(prop);
            var method = prop.method;
            switch (prop.method) {
                case 'load': 
                    {
                        method = loadDeveloperApp;
                    } break;
                case 'reload': 
                    {
                        method = reloadDeveloperApp;
                    } break;
                case 'enable': 
                    {
                        method = enableDeveloperApp;
                    } break;
                case 'disable': 
                    {
                        method = disableDeveloperApp;
                    } break;
                case 'remove': 
                    {
                        method = removeDeveloperApp;
                    } break;
                case 'getList': 
                    {
                        method = getListDeveloperApp;
                    } break;
                default: //TODO(finish): fallback
            } //switch
            method(prop.data, callback);
        } catch (ex) {
            fallbackDeveloperApp(ex, callback);
        }
    });

    function removeFromAppsList(list, appGuid) {
        var removeIndex = -1;
        for (var i = 0; i < list.length; i++) {
            /* we expect two kinds of lists one is ["guid1","guid2"] 2nd is ["{appGuid:"guid1"}"]*/
            currAppGuid = list[i].appGuid || list[i];
            if (currAppGuid == appGuid) {
                removeIndex = i;

            }
        }
        if (removeIndex != -1) {
            list.splice(removeIndex, 1);
        }
    }

    function addApp(appData) {
        var isAppDisabled = false;
        if (conduit.backstage.serviceLayer.config && conduit.backstage.serviceLayer.config.toolbarSettings) {
            isAppDisabled = conduit.backstage.serviceLayer.config.toolbarSettings.isDisabled({
                data: { appGuid: appData.compInstanceId }
            });
        }

        if (~appsGuidList.indexOf(appData.compInstanceId) || isAppDisabled)
            return;

        var serviceUrl = conduit.backstage.serviceLayer.serviceMap.getItemByName("AppsSettings").url;

        addAppService(serviceUrl.replace("EB_COMP_ID", appData.id), appData.id);
        //service.invoke(data);
    }

    // at the moment this function handle a group of guids
    // that were imported after updating from oldbar to smartbar.
    function addCollection(aUserAppsGuids, openLastPopup) {
        var sCurrGuid, oAppData;
        var arrApps = [];
        // call the addApp function for each guid in the array.
        for (var i = 0; i < aUserAppsGuids.length; i++) {
            sCurrGuid = aUserAppsGuids[i];

            oAppData = {
                id: sCurrGuid,
                compInstanceId: sCurrGuid,
                compName: ""
            };
            // we fill this object for later use in the flow
            // after the guid is processed and return with app data
            // it finds itself in this object and add to itself a flag
            // to not be opened automatically in the view
            // If we wish to open the last popup we will not give the flag
            if (!(i == aUserAppsGuids.length - 1 && openLastPopup)) {
                oUserAppsGuids[sCurrGuid] = true;
            }
            arrApps.push(oAppData);
        }
        addAppFromCollection(arrApps);
    }

    function addAppFromCollection(arrApps) {
        // since adding an app is an asynchronic action and we want to keep the order of the apps as requested,
        // we will delay each app.
        if (arrApps && arrApps.length > 0) {
            var app = arrApps.shift();
            addApp(app);
            setTimeout(function () {
                addAppFromCollection(arrApps)
            }, 200);
        }
    }

    /* studio EOB */
    /**
    @function
    @description: after smartbar installation we check if we have
    any user apps guids from the old toolbar. if so, we process the guids
    and add the new apps to smartbar as well.
    */
    function getOldbarUserApps() {
        // get key.
        absRepository.getExternalKey(absCommons.context.getCTID().result + ".MARKET_PLACE_APPS_COMMUNITY_TOOLBAR", function (oIsOldbarUserAppsExist) {
            // on success.
            if (!oIsOldbarUserAppsExist.status) {
                // get the array of guids.
                var aGuids = oIsOldbarUserAppsExist.result;
                try {
                    if (typeof aGuids == 'string') {
                        aGuids = JSON.parse(aGuids);
                    }

                    // check is valid array.
                    if (aGuids instanceof Array && aGuids.length > 0) {
                        aGuids = aGuids.reverse(); // The guid list in oldbar is reversed
                        addCollection(aGuids);
                    }
                    // delete key. this is a one time action, only after installation.
                    absRepository.removeExternalKey(absCommons.context.getCTID().result + ".MARKET_PLACE_APPS_COMMUNITY_TOOLBAR", function () { });
                }
                catch (e) {
                    conduit.coreLibs.logger.logError('Failed to read old-bar user apps', { className: "userApps.js", functionName: "getOldbarUserApps" }, { code: conduit.coreLibs.logger.GeneralCodes.GENERAL_ERROR, error: e, name: serviceName });
                }

            }
            else {
                // if we have no raw data file, we need to create it.
                checkAndCreateRawDataXML();
            }
        });
    }

    // if we have no raw data file, we need to create it and the new userApp service file.
    function checkAndCreateRawDataXML() {
        var getRepositoryKeyName = serviceDataManager.getRepositoryKeyName;
        var serviceFileName = getRepositoryKeyName(serviceName);
        var serviceFileNameRaw = getRepositoryKeyName(serviceName, true);
        var serviceFileNameRawOld = getRepositoryKeyName(serviceName, false, true)
        conduit.abstractionlayer.commons.repository.getFiles(false, [serviceFileName, serviceFileNameRaw, serviceFileNameRawOld], function (resultObj) {
            var fileObj = {};
            if (resultObj && resultObj.status == 0) {
                try {
                    fileObj = JSON.parse(resultObj.result);
                } catch (e) {
                    console.error("error in Parsing ::: UserApps -> checkAndCreateRawDataXML -> getFile Method");
                }
            }
            var repositoryData = conduit.coreLibs.repository.handleDataFromGetFiles(fileObj[serviceFileName]);
            var rawRepositoryData = conduit.coreLibs.repository.handleDataFromGetFiles(fileObj[serviceFileNameRaw]);

            if (!rawRepositoryData && !repositoryData) {
                //handle case were repository data and raw data is missing but the service contains important data (like userApps)
                //it should find the previous file (without version) and load it.
                repositoryData = conduit.coreLibs.repository.handleDataFromGetFiles(fileObj[serviceFileNameRawOld]);
                if (repositoryData && repositoryData.data) {
                    // old version data
                    var guidList = createAppsGuidList(repositoryData.data.apps);
                    // check is valid array.
                    if (guidList instanceof Array && guidList.length > 0) {
                        addCollection(guidList);
                    }
                }
            }
        });
    }

    function removeAppFromModelAndRepository(appToRemove) {
        try {
            var appObject;
            if (typeof (appToRemove.appId) !== 'undefined') {
                //get the app data by appId
                appObject = findApp(appToRemove.appId);
            }
            else if (typeof (appToRemove.appGuid) !== 'undefined') {
                appObject = findAppByGuid(appToRemove.appGuid);
            }
            if (!appObject) {
                // we cannot find the app!
                return { result: false, status: 111, description: 'We cannot remove the app, it does not exist' };
            }

            var appData = appObject.appData;
            var appOptions = conduit.coreLibs.config.getAppOptions() || {};
            appOptions[appData.appId] = {};

            appOptions[appData.appId] = {
                disabled: true,
                isToRemove: true,
                appGuid: appData.appGuid,
                appId: appData.appId,
                appClientGuid: appData.appClientGuid
            };

            conduit.coreLibs.config.setAppOptions(appOptions);

            var singleAppOptions = {};
            singleAppOptions[appData.appId] = appOptions[appData.appId];
            var repositoryObj = { apps: singleAppOptions, addPersonalApps: false };

            var obj = {
                method: "update",
                data: repositoryObj
            };
            absCommons.messages.sendSysReq("handleOptions", "options", JSON.stringify(obj), function (response) { });
            return appData.appId;

        } catch (ex) {
            return { "result": false, "status": 800, "description": 'Unexpected error, failed to remove app. ' + ex.message };
        }
    }

    function initUserApps() {
        var serviceUrl = serviceData.url;
        var localAppsArray = conduit.utils.general.clone(appsData);

        for (var i = 0; i < localAppsArray.length; i++) {
            addAppService(serviceUrl.replace("EB_COMP_ID", localAppsArray[i].appGuid), localAppsArray[i].appGuid, true);
        }
    }

    function addAppService(url, appGuid, update) {
        var serviceInterval = serviceData.reload_interval_sec;
        if (serviceInterval === undefined || (serviceInterval !== undefined && (isNaN(serviceInterval) || typeof (serviceInterval) !== "number" || serviceInterval <= 0))) {
            serviceInterval = 86400; // default value
        }
        serviceDataManager.addService({
            name: serviceName,
            url: url,
            interval: serviceInterval * 1000 * 60,
            interval_name: appGuid,
            callback: addAppData,
            ignoreSetRawData: true,
            ignoreGetRawData: true,
            extraData: { update: update }
        }, function (returnedService) {
            userAppServices.push({
                appGuid: appGuid,
                service: returnedService
            });

        });
    }

    function refreshAllApps() {
        for (var i = 0; i < userAppServices.length; i++) {
            userAppServices[i].service.invoke(null, true, { isManualRefresh: true, update: true });
        }
    }

    //manifest service is part of update flow that might cause by manual refresh, interval update, or service map update
    conduit.subscribe("onManifestReady", function (data) {
        if (data.serviceMapChange || data.internalUpdate) { //service map or manifest were changed   
            var currentServiceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("AppsSettings");
            if (currentServiceData.url !== serviceData.url || currentServiceData.reload_interval_sec !== serviceData.reload_interval_sec) {
                conduit.backstage.serviceLayer.serviceDataManager.update(service, { url: currentServiceData.url, interval: currentServiceData.reload_interval_sec * 1000 }, false);
            }
        }
    });


    return {
        init: function () {
            serviceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("AppsSettings"),
                serviceUrl = serviceData.url.split("?"),
                urlQuery = serviceUrl[1].split("=");

            serviceDataParameter = urlQuery.length > 1 && urlQuery[1] === "EB_COMP_ID"
                ? urlQuery[0] : "ComponentId";

            serviceDataManager.addService({
                name: serviceName,
                url: serviceUrl[0],
                manualInvoke: true,
                callback: addAppData,
                ignoreSetRawData: true
            }, function (Returnedservice) {
                service = Returnedservice;

                appsGuidList = createAppsGuidList(appsData);
                if (!isInit) {
                    conduit.triggerEvent("onReady", { name: serviceName });
                    isInit = true;
                }

                conduit.abstractionlayer.commons.repository.getFiles(false, [addedCounterRepositoryKey, removedCounterRepositoryKey], function (resultObj) {
                    var fileObj = {};
                    if (resultObj && resultObj.status == 0) {
                        try {
                            fileObj = JSON.parse(resultObj.result);
                        } catch (e) {
                            console.error("error in Parsing ::: UserApps -> init -> getFile Method");
                        }
                    }
                    addedCounter = conduit.coreLibs.repository.handleDataFromGetFiles(fileObj[addedCounterRepositoryKey]) || 0;
                    removedCounter = conduit.coreLibs.repository.handleDataFromGetFiles(fileObj[removedCounterRepositoryKey]) || 0;


                    initUserApps();

                    conduit.subscribe("onLoginChange", function () {
                        socialDomains = conduit.backstage.serviceLayer.login.getSocialDomains();
                        createSocialDomainsCookies();
                    });


                    conduit.triggerEvent("onInitSubscriber", {
                        subscriber: conduit.backstage.serviceLayer.userApps,
                        dependencies: ["applicationLayer.appCore.appManager.model"],
                        onLoad: conduit.backstage.serviceLayer.userApps.getOldbarUserApps
                    });

                    delete conduit.backstage.serviceLayer.userApps.init;
                });
            });
        },
        addCollection: addCollection,
        getOldbarUserApps: getOldbarUserApps,
        addApp: addApp,
        addUserAppByJson: function (appData, isExternal) {
            if (!appData) {
                return { result: false, status: 111, description: 'We cannot add the app, missing parameter appData' };
            }
            var appGuid = appData.appGuid ? appData.appGuid : appData.data && appData.data.appGuid ? appData.data.appGuid : null;
            if (!appGuid) {
                return { result: false, status: 111, description: 'We cannot add the app, missing parameter appGuid' };
            }
            var webappGuid = appData.data && appData.data.webappGuid ? appData.data.webappGuid : null;

            if (findApp(appData.appId) || appsGuidList.indexOf(appGuid) > -1 || (webappGuid && appsGuidList.indexOf(webappGuid) > -1)) {
                // the app already exists. TODO handle error
                return { result: false, status: 111, description: 'We cannot add the app, it is already exists' };
            }

            if (isExternal) {
                var externalAppData = {
                    id: appGuid,
                    compInstanceId: appGuid,
                    compName: ""
                };
                addApp(externalAppData);
                return;
            }

            var appClientGuid = conduit.abstractionlayer.backstage.guid.generate().result;
            var appId = appData.appId;
            var userAppSettings = handleAppSettings(appData, appGuid, appClientGuid);
            if (userAppSettings) {

                // update raw data, create app xml from the json
                var appXml = { "COMPONENT_INSTANCE_GUID": appGuid, "COMPONENT_XML": {} };
                if (!appId) {
                    var apps = userAppSettings.apps;
                    for (var i in apps) {
                        if (apps[i].appGuid == appGuid) {
                            appId = apps[i].appId;
                            break;
                        }
                    }
                }
                var appType = appData.appType ? appData.appType : "BROWSER_COMPONENT";
                appXml.COMPONENT_XML[appType] = { "UNIQUE_COMP_ID": appId };
                if (!appData.managed) {
                    service.updateData(userAppSettings);
                    appXml = conduit.backstage.serviceLayer.commons.json2Xml("USERS_LOG_REQUEST", appXml);
                    setRawDataXML(appGuid, appXml);
                }

            }

            return '';
        },

        /**
        @function
        @description: gets an array of apps to remove.
        */
        removeApp: function (appsToRemoveArr) {

            for (var i = 0; i < appsToRemoveArr.length; i++) {
                var app = appsToRemoveArr[i];
                var appData;
                if (typeof (app.appId) !== 'undefined') {
                    //get the app data by appId
                    appData = findApp(app.appId);
                }
                else if (typeof (app.appGuid) !== 'undefined') {
                    appData = findAppByGuid(app.appGuid);
                }
                else {
                    // we cannot find the app!
                    return { result: false, status: 111, description: 'We cannot remove the app, it does not exist' };
                }
                var appProps;
                if (appData) {
                    appProps = appData.appData;
                    //remove app from object.
                    appsData.splice(appData.index, 1);

                    //update the counter repository file TODO: consider deleting this counter
                    repository.setData(removedCounterRepositoryKey, ++removedCounter, function () { });

                    if (!(appProps && (appProps.isDeveloperApp || appProps.managed))) {
                        //send usage
                        conduit.backstage.serviceLayer.usage.sendAppUninstallUsage($.extend(
							    { removedAppsCount: removedCounter, addedAppsCount: addedCounter }, { marketplaceComponentGuid: appProps.appGuid, componentClientInstanceGuid: appProps.appClientGuid }
						    )
					    );
                    }

                    if (appProps.isUserWebApp && app.removeService != false) {
                        // only if we did not explicitly requested not to remove the service.
                        // in case we want to replace a placeholder of a webapp or a new version is installed, we do not need to remove the service. 
                        // this will delete the webappInfo pref with all the relevant details about the app.
                        conduit.backstage.serviceLayer.webAppSettings.removeService(appProps.webappGuid);
                    }

                }
                var guid = app.appGuid || appProps.appGuid;
                if (guid) {
                    removeFromAppsList(appsGuidList, guid);
                    removeFromAppsList(userAppServices, guid);
                    // also remove the app from the raw data file
                    removeAppFromRawData(guid);
                    //TODO: stop webbapp settings service for external webapps
                    serviceDataManager.stopService(serviceData.url.replace("EB_COMP_ID", guid));
                    serviceDataManager.removeLastUpdateKey({ interval_name: guid, name: serviceName });
                }
            }

            createSocialDomainsCookies();

            //update userapp cache file.
            service.updateData({ apps: appsData });


            //update options cache file.
            var appOptions = conduit.coreLibs.config.getAppOptions();
            for (var appId in appOptions) {
                if (appOptions[appId].isToRemove) {
                    delete appOptions[appId];
                }
            }
            conduit.coreLibs.config.setAppOptions(appOptions);

            return;
        },

        getAppsData: function (appsIds) {
            if (appsIds && appsIds.length > 0 && appsData && appsData.length > 0) {
                var appsArr = [],
                    appId,
                    appData;
                for (var i in appsIds) {
                    appId = appsIds[i];
                    appData = findApp(appId);
                    if (appData) {
                        appsArr.push(appData);
                    }
                }
                return appsArr;
            }
            else {
                return appsData;
            }

        },
        getCounters: function () {
            return { counterComponentsRemoved: removedCounter, counterComponentsAdded: addedCounter };
        },
        isUserApp: function (appId) {
            //TODO what about UserWebApps?
            return !!findApp(appId);
        },
        addWebappToSettings: addWebappToSettings,
        getWebApps: getWebApps,
        removeAppFromModelAndRepository: removeAppFromModelAndRepository,
        findAppByGuid: findAppByGuid,
        refreshAllApps: refreshAllApps
    };
})(jQuery));

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.userApps,
    dependencies: ["serviceMap", "manifest"],
    onLoad: conduit.backstage.serviceLayer.userApps.init
});
﻿conduit.register("backstage.serviceLayer.config.manifest", (function (undefined) {
    var manifestData,
        standaloneAppsData,
        featuresManifestData = {},
        serviceName = "manifest",
        service;

    /**
    @function
    @description: iterate over the manifestData object and looks for elements with the property
    of 'modules' which means feature. when finding we put each script url in the 
    arrModules object and finally put the object as value in the src property.
    */
    function getAllFeaturesUrls() {
        var arrModules = {};

        for (var app in manifestData) {
            if (manifestData[app].module) {
                arrModules[app] = manifestData[app].module;
            }
        }
        featuresManifestData.src = arrModules;
    }

    function loadManifestData(data, isPreprocessed) {
        var isInit = manifestData === undefined;
        //manifestData = data;

        manifestData = {
            "SEARCH_IN_NEW_TAB": {
                module: 'searchInNewTab.js',
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: false
                    }
                }
            },
            "404": {
                module: '404.js',
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: false
                    }
                }
            },
            "APPLICATION_BUTTON": {
                pages: {
                    bgpage: "bgpage.html"
                }
            },
            "DYNAMIC_MENU": {
                pages: {
                    popup: "popup.html"
                },
                popupSettings: { size: { width: 262, height: 300} },
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: false
                    }
                }
            },
            "EMAIL_NOTIFIER": {
                pages: {
                    bgpage: "bgpage.html",
                    popup: "popup.html"
                },
                popupSettings: {
                    size: {
                        width: 550,
                        height: 320
                    },
                    showFrame: true,
                    isShowMininmizedIcon: false,
                    withUsage: false
                }
            },
            "HIGHLIGHTER": {
                pages: {
                    bgpage: "bgpage.html",
                    embedded: "embedded.html",
                    popup: "popup.html"
                },
                popupSettings: { size: { width: 567, height: 338 }, showFrame: false },
                embeddedSettings: { size: { width: 30, height: 34} },
                allowScroll: false,
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: true
                    }
                }
            },
            "MAIN_MENU": {
                pages: {
                    popup: "popup.html"
                },
                popupSettings: { size: { width: 262, height: 235} },
                allowScroll: false,
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: true
                    }
                }
            },
            "MULTI_RSS": {
                pages: {
                    popup: "popup.html",
                    bgpage: "bgpage.html"
                },
                popupSettings: { size: { width: 613, height: 445 }, showFrame: true, isShowMininmizedIcon: false },
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: true
                    }
                }
            },
            "RADIO_PLAYER": {
                pages: {
                    embedded: "embedded.html",
                    bgpage: "bgpage.html",
                    popup: "popup.html"
                },
                popupSettings: { size: { width: 613, height: 445} },
                embeddedSettings: { size: { width: 73, height: 34} }
            },
            "RSS_FEED_ITEM": {
                alias: "MULTI_RSS",
                pages: {
                    popup: "popup.html",
                    bgpage: "bgpage.html"
                },
                popupSettings: { size: { width: 393, height: 445 }, showFrame: true, isShowMininmizedIcon: false },
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: true
                    }
                }
            },
            "SEARCH": {
                pages: {
                    embedded: "embedded.html",
                    bgpage: "bgpage.html"
                },
                embeddedSettings: { size: { width: 215, height: 34} },
                allowScroll: false,
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: true
                    }
                }
            },
            "TWITTER": {
                pages: {
                    bgpage: "bgpage.html",
                    popup: "popup.html"
                },
                popupSettings: { size: { width: 456, height: 420 }, showFrame: true, isShowMininmizedIcon: false },
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: true
                    }
                }
            },
            "WEATHER": {
                pages: {
                    bgpage: "bgpage.html",
                    popup: "popup.html"
                },
                popupSettings: {
                    size: {
                        width: 296,
                        height: 292
                    },
                    showFrame: true,
                    isShowMininmizedIcon: false,
                    withUsage: false
                }
            },
            "PRICE_GONG": {
                displayIcon: "../wa/PRICE_GONG/images/icon.png",
                pages: {
                    bgpage: "bgpage.html"
                },
                popupSettings: {
                    size: {
                        width: 296,
                        height: 292
                    },
                    showFrame: true,
                    isShowMininmizedIcon: false
                },
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: false
                    },
                    buttonIconUrl: "wa/PRICE_GONG/images/icon.png"
                },
                baseAppType: "PRICE_GONG"
            }
        };

        standaloneAppsData = {
            "NOTIFICATION": {
                appId: "NOTIFICATION_ID",
                pages: { bgpage: "bgpage.html" },
                renderView: false,
                dontShowInOptions: true,
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: true
                    }
                }
            },
            "TESTER_POPUP": {
                appId: "TESTER_POPUP_ID",
                debug: true,
                displayIcon: "http://storage.conduit.com/bankimages/iconsGallery/24/5541818981211231875.png",
                displayText: "Test WA",
                pages: {
                    bgpage: "bgpage.html",
                    popup: "popup.html"
                },
                popupSettings: { size: { width: 700, height: 700 }, showFrame: false },
                data: {
                    buttonIconUrl: "http://storage.conduit.com/bankimages/iconsGallery/24/5541818981211231875.png",
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: true
                    }
                }
            },
            "TESTER_EMBEDDED": {
                appId: "TESTER_EMBED_POPUP_ID",
                debug: true,
                displayIcon: "http://storage.conduit.com/bankimages/iconsGallery/24/5541818981211231875.png",
                pages: {
                    bgpage: "bgpage.html",
                    embedded: "embedded.html"
                },
                embeddedSettings: { size: { width: 25} },
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: true
                    }
                }
            },
            "TESTER_BCAPI": {
                appId: "TESTER_EMBED_POPUP_BCAPI_ID",
                debug: true,
                displayIcon: "http://storage.conduit.com/bankimages/iconsGallery/24/4893084600226060960.png",
                pages: {
                    embedded: "initEmbedded.html"
                },
                embeddedSettings: { size: { width: 28} },
                data: {
                    apiPermissions: {
                        crossDomainAjax: true,
                        getMainFrameTitle: true,
                        getMainFrameUrl: true,
                        getSearchTerm: true,
                        instantAlert: true,
                        jsInjection: true,
                        sslGranted: true
                    }
                }
            }
        };

        if (isInit) {
            getAllFeaturesUrls();
            conduit.triggerEvent("onReady", { name: serviceName });
        }
    }

    conduit.subscribe("onServiceMapChange", function (data) {        
        //local service, no update required just trigger ready for the next services in the chain
        conduit.triggerEvent("onManifestReady", { serviceMapChange: true, forceUpdate: data.forceUpdate });
    });

    function init() {
        /* Remove commenting when service is live and delete the 
        hardcoded data from loadManifestData (manifestData = {...})!!
        Also delete loadManifestData() from this function!

        var serviceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("Manifest");

        // Start the service:
        service = conduit.backstage.serviceLayer.serviceDataManager.addService({
        name: serviceName,
        url: serviceData.url,
        interval: serviceData.reload_interval_sec * 1000,
        callback: loadManifestData
        });

        */

        loadManifestData();

        delete conduit.backstage.serviceLayer.config.manifest.init;
    }

    return {
        init: init,
        getAppTypeManifest: function (appType) {
            return manifestData[appType];
        },
        getManifests: function () {
            return manifestData;
        },
        getFeaturesManifestData: function () {
            return featuresManifestData;
        },
        getStandaloneAppsData: function () {
            return standaloneAppsData;
        }
    };
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.config.manifest,
    dependencies: ["serviceMap"],
    onLoad: conduit.backstage.serviceLayer.config.manifest.init
});

﻿conduit.register("backstage.serviceLayer.uninstall", (function () {

    function sendToolbarUninstallUsage(isToSaveToFile) {
        var context = conduit.abstractionlayer.commons.context,
			repository = conduit.abstractionlayer.commons.repository,
			serviceUrl = conduit.backstage.serviceLayer.serviceMap.getItemByName("ToolbarUninstall").url,
            environment = conduit.abstractionlayer.commons.environment,
            login = conduit.backstage.serviceLayer.login,
            browserInfo = environment.getBrowserInfo().result,
            osInfo = environment.getOSInfo().result,
            ctid = context.getCTID().result,
            activeCTID = login.getActiveCTID();
        context.getUserID(function (userIdObj) {
            var uninstallData = {
                "USERS_UNINSTALL_REQUEST": {
                    "TOOLBAR_INFO": {
                        "TOOLBAR_VERSION": environment.getEngineVersion().result,
                        "CTID": ctid,
                        "PLATFORM": browserInfo.type,
                        "BROWSER_VERSION": browserInfo.version,
                        "OPERATING_SYSTEM": osInfo.type + " " + osInfo.version,
                        "ACTING_CTID": activeCTID
                    },
                    "UID": userIdObj.result
                }
            }
            var xml = "RequestString=" + setXml(uninstallData);

            function setXml(data) {
                var xmlNode = [];
                for (var pName in data) {
                    xmlNode.push("<" + pName + ">");
                    var pValue = data[pName];

                    xmlNode.push(typeof (pValue) === "object" ? setXml(pValue) : encodeURI(pValue));
                    xmlNode.push("</" + pName + ">");
                }
                return xmlNode.join("");
            }
            if (isToSaveToFile) {
                var result = repository.hasData("uninstallData").result;
                if (!result || /false/i.test(result)) {
                    repository.setData("uninstallData", xml);
                    repository.setData("uninstallUrl", serviceUrl);
                }
            }
            else {
                conduit.abstractionlayer.commons.http.httpRequest(
                    serviceUrl,
                    "POST",
                    xml,
				    "{\"headers\":[{\"name\":\"Content-Type\",\"value\":\"application/x-www-form-urlencoded\"}]}",
                    "", "", null,
                    function () { }
                );
            }
        });

    }

    function init() {
        sendToolbarUninstallUsage(true);
    };

    return {
        init: init,
        sendToolbarUninstallUsage: sendToolbarUninstallUsage
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.uninstall,
    dependencies: ["serviceMap", "toolbarSettings"],
    onLoad: conduit.backstage.serviceLayer.uninstall.init
});
﻿conduit.register("backstage.serviceLayer.searchAPI", (function () {
    var searchAPI;
    var searchAPIService;
    var searchAPIData;
    var undefined;
    var serviceDataManager = conduit.backstage.serviceLayer.serviceDataManager;
    var logger = conduit.coreLibs.logger;
    var serviceName = 'searchAPI';
    var clone = conduit.utils.general.clone;
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;

    function notifyReady() {
        var messageData = "";
        if (searchAPI) {
            messageData = JSON.stringify(searchAPI);
        }
        conduit.abstractionlayer.commons.messages.postTopicMsg(
			"systemRequest.searchAPIReady",
			"conduit.backstage.serviceLayer.searchAPI",
			messageData);
    }


    function loadSearchAPI(data, isPreProcessed) {
        if (!isPreProcessed) {
            try {
                data = conduit.coreLibs.aliasesManager.replaceAliases(data);
                var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
                if (/Chrome/i.test(browserInfo.type)) {
                    localStorage.setItem("searchAPIServiceData", data);
                }
                data = JSON.parse(data);
            } catch (e) {
                logger.logError("Failed to parse searchAPI data", { className: "searchAPI", functionName: "loadSearchAPI" }, { error: e, name: serviceName });
            }
        }

        searchAPI = data;
        conduit.triggerEvent("onReady", { name: serviceName });
        notifyReady();
        return searchAPI;
    }

    function getServiceNameInSM() {
        var countryCode = conduit.abstractionlayer.commons.repository.getKey(ctid + ".countryCode").result;

        if (countryCode) {
            return "SearchApiByCountry";
        }
        else {
            return "SearchSettings";
        }
    }

    function initSearchAPI(initData) {
        initData = initData || {};

        searchAPIData = initData.searchAPIData || conduit.backstage.serviceLayer.serviceMap.getItemByName(getServiceNameInSM());

        serviceDataManager.addService({
            name: 'searchAPI',
            url: searchAPIData.url,
            interval: searchAPIData.reload_interval_sec * 1000,
            callback: loadSearchAPI,
            dataType: "json",
            enabledInHidden: true
        }, function (returnedService) {
            searchAPIService = returnedService;
        });
    }

    function init(initData) {
        initData = initData || {};
        initSearchAPI();

        if (conduit.backstage.serviceLayer.searchAPI.init)
            delete conduit.backstage.serviceLayer.searchAPI.init;
    }


    // If there's a new URL or interval for the service, re-initialize contextMenu:
    conduit.subscribe("onServiceMapChange", function () {
        var currentServiceData = conduit.backstage.serviceLayer.serviceMap.getItemByName(getServiceNameInSM());

        if (currentServiceData.url !== searchAPIService.url || searchAPIData.reload_interval_sec !== searchAPIService.reload_interval_sec) {
            serviceDataManager.update(searchAPIService, { url: currentServiceData.url, interval: currentServiceData.reload_interval_sec * 1000 }, true);
        }
    });



    function invokeService() {
        searchAPIService.invoke();
    }


    function getSearchAPI() {
        return clone(searchAPI);
    }

    conduit.abstractionlayer.commons.messages.onSysReq.addListener("serviceLayer.searchAPI.getSearchAPI", function (data, sender, callback) {
        callback(JSON.stringify(searchAPI));
    });


    return {
        getSearchAPI: getSearchAPI,
        init: init,
        refresh: invokeService
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.searchAPI,
    dependencies: ["serviceMap", "setupAPI","aliasesManager"],
    onLoad: conduit.backstage.serviceLayer.searchAPI.init
});
﻿conduit.register("backstage.serviceLayer.setupAPI", (function () {
    var setupAPI;
    var setupAPIService;
    var setupAPIData;
    var DEFAULT_INTERVAL = 1209600;
    var serviceDataManager = conduit.backstage.serviceLayer.serviceDataManager;
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
    var absRepository = conduit.abstractionlayer.commons.repository;
    var absStorage = conduit.abstractionlayer.commons.storage;
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
    var isFF = (browserInfo.type == "Firefox");

    function notifyReady() {
        conduit.abstractionlayer.commons.messages.postTopicMsg(
		"systemRequest.setupAPIReady",
		"conduit.backstage.serviceLayer.setupAPI",
		"");
    }


    function loadSetupAPI(data, isPreProcessed) {
        var um;
        if (!isPreProcessed) {
            try {
                data = JSON.parse(data);
                var XPIInstallation = !!absRepository.getKey(ctid + ".installType").status; //No install type mean its XPI installation
                if (XPIInstallation && data._MAM_ENABLED_) {
                    absRepository.setKey(ctid + ".mam_gk_installer_preapproved.enc", data._MAM_ENABLED_, true);
                }
                um = data._UM_ ? data._UM_ : 99;
                absStorage.setTripleKey(ctid + ".searchUserMode", um); //update the repository  
                absStorage.setTripleKey(ctid + ".searchUninstallUserMode", um); //update the repository                
            } catch (e) { }
        }
        um = data._UM_ ? data._UM_ : 99;
        setupAPI = data;
        conduit.coreLibs.aliasesManager.setAlias(conduit.coreLibs.aliasesManager.constants.UM_ID, um); //update alias manager
        conduit.coreLibs.aliasesManager.setAlias(conduit.coreLibs.aliasesManager.constants.UM_UNINSTALL_ID, um); //update alias manager
        conduit.triggerEvent("onReady", { name: 'setupAPI' });
        notifyReady();
        return data;
    }

    function getServiceName() {
        var countryCode = conduit.abstractionlayer.commons.repository.getKey(ctid + ".countryCode").result;
        if (countryCode) {
            return "ToolbarSetupAPIByCountry";
        }
        else {
            return "ToolbarSetupAPI";
        }
    }

    function initSetupAPI(initData) {
        initData = initData || {};

        serviceName = getServiceName();

        setupAPIData = initData.setupAPIData || conduit.backstage.serviceLayer.serviceMap.getItemByName(serviceName);

        serviceDataManager.addService({
            name: 'setupAPI',
            url: setupAPIData.url,
            interval: (setupAPIData.reload_interval_sec || DEFAULT_INTERVAL) * 1000,
            callback: loadSetupAPI,
            dataType: "json",
            enabledInHidden: true,
            cbFail: cbFailSetup
        }, function (returnedService) {
            setupAPIService = returnedService;
        });
    }

    function cbFailSetup(returnValue) {
        absStorage.getTripleKey(ctid + ".searchUserMode", function (response) {
            var umKey = response.result;
            if (!umKey.file && !umKey.registry && !umKey.local) { //if the key doesn't exist create it with fallback 99
                var um = 99;
                absStorage.setTripleKey(ctid + ".searchUserMode", um);
                conduit.coreLibs.aliasesManager.setAlias(conduit.coreLibs.aliasesManager.constants.UM_ID, um); //update alias manager
            }
            conduit.triggerEvent("onReady", { name: 'setupAPI' });
        });
    }

    function init(initData) {
        initData = initData || {};

        if (conduit.backstage.serviceLayer.setupAPI.init) {
            delete conduit.backstage.serviceLayer.setupAPI.init;
        }
        var installationStatus = conduit.abstractionlayer.backstage.system.getInstallationStatus().result;
        var shouldInvoke = false;

        if (installationStatus && !installationStatus.installer && (installationStatus.firstInstall || installationStatus.upgrade)) { //if this is firstInstall or upgrade and done via XPI (and not installer)
            shouldInvoke = true;
        }
        if (isFF && shouldInvoke) { //invoke the service only in case this is XPI installation and it's first installation or upgrade
            initSetupAPI();
        }
        else { //in other cases trigger "on ready" event for handling other services dependency
            conduit.triggerEvent("onReady", { name: 'setupAPI' });
        }
    }


    // If there's a new URL or interval for the service, re-initialize contextMenu:
    conduit.subscribe("onServiceMapChange", function () {
        serviceName = getServiceName();
        var currentServiceData = conduit.backstage.serviceLayer.serviceMap.getItemByName(serviceName);

        if (currentServiceData.url !== setupAPIService.url || setupAPIData.reload_interval_sec !== setupAPIService.reload_interval_sec) {
            serviceDataManager.update(setupAPIService, { url: currentServiceData.url, interval: currentServiceData.reload_interval_sec * 1000 }, true);
        }
    });

    function invokeService() {
        setupAPIService.invoke();
    }


    function getSetupAPI() {
        return setupAPI;
    }

    conduit.abstractionlayer.commons.messages.onSysReq.addListener("serviceLayer.setupAPI.getSetupAPI", function (data, sender, callback) {
        callback(getSetupAPI());
    });


    return {
        getSetupAPI: getSetupAPI,
        init: init,
        refresh: invokeService
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.setupAPI,
    dependencies: ["serviceMap"],
    onLoad: conduit.backstage.serviceLayer.setupAPI.init
});
﻿conduit.register("backstage.serviceLayer.installUsage", (function () {
    var install;
    var installService = {};
    var installData;
    var serviceDataManager = conduit.backstage.serviceLayer.serviceDataManager;
    var commons = conduit.abstractionlayer.commons;
    var ctid = commons.context.getCTID().result;
    var absStorage = commons.storage;
    var usageTypes = { ToolbarInstall: ctid + ".installUsage", ToolbarInstallEarly: ctid + ".installUsageEarly" };
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
    var isFF = /Firefox/i.test(browserInfo.type);
    var usageData;
    var enabled;

    function loadInstall(data, isPreProcessed, extraData) {
        if (!isPreProcessed) {
            try {
                data = JSON.parse(data);
                if (data && data.Registered) { //If usage was written in DB
                    var keyName = usageTypes["ToolbarInstallEarly"]; //default is ToolbarInstallEarly
                    if (extraData && extraData.actionType) {
                        keyName = usageTypes[extraData.actionType];
                    }
                    var result = absStorage.setTripleKey(keyName, data.BornServerTime).result;
                    if (result.file || result.registry || result.local) {
                        install = data;
                        return { stopService: true };
                    }
                }
            }
            catch (e) {
            }
        }
        return data;
    }

    function initInstall(initData) {
        initData = initData || {};

        installData = initData.installData || conduit.backstage.serviceLayer.serviceMap.getItemByName("ToolbarInstallationUsage");

        var browserInfo = commons.environment.getBrowserInfo().result;
        var osInfo = commons.environment.getOSInfo().result;
        commons.context.getUserID(function (userIdObj) {
            commons.context.getFullUserID(function (fullUserIDObj) { 
            usageData = {
                userId: userIdObj.result,
                fullUserID: fullUserIDObj.result,
                ctid: ctid,
                browserVersion: browserInfo.version,
                platform: browserInfo.type,
                clientVersion: commons.environment.getEngineVersion().result,
                machineId: "SB_" + commons.context.getMachineId().result,
                clientTimestamp: new Date(),
                OS: osInfo.type,
                OsVersion: osInfo.version,
                installSessionId: commons.repository.getKey(ctid + ".installSessionId").result || "-1",
                installerVersion: commons.repository.getKey(ctid + ".installerVersion").result,
                isHidden: conduit.abstractionlayer.backstage.browser.isHidden().result
            };
            if (isFF) {
                var xpeMode = commons.repository.getKey(ctid + ".xpeMode").result || ""
                usageData.xpeMode = xpeMode;
            }


            start("ToolbarInstallEarly");
        });
    });
    }

    function init(initData) {
        var versionFromInstaller = commons.repository.getKey(ctid + ".versionFromInstaller");
        if (!versionFromInstaller.status) {
            //If the version is higher then first version with install usage. Meaning it's a new install (XPE) of version 10.14.370 or higher
            enabled = conduit.utils.compareVersions(versionFromInstaller.result, "10.14.370.0", "min");
            if (enabled) {
                initData = initData || {};
                initInstall();
            }
        } else {
            enabled = false;
        }

        if (conduit.backstage.serviceLayer.installUsage.init) {
            delete conduit.backstage.serviceLayer.installUsage.init;
        }
    }

    function start(actionType) {
        if (!enabled) {
            return;
        }
        var keyName = usageTypes["ToolbarInstallEarly"];
        if (actionType) {
            keyName = usageTypes[actionType];
        }
        absStorage.getTripleKey(keyName, function (response) {
            var installKeys = response.result;
            if (!installKeys.file && !installKeys.registry && !installKeys.local) {
                var requestData = $.extend({ actionType: actionType }, usageData);
                serviceDataManager.addService({
                    name: 'installUsage_' + actionType,
                    url: installData.url,
                    interval: installData.reload_interval_sec * 1000,
                    callback: loadInstall,
                    method: 'POST',
                    data: JSON.stringify(requestData),
                    extraData: { actionType: actionType },
                    dataType: "application/json",
                    enabledInHidden: true
                }, function (returnedService) {
                    installService[actionType] = returnedService;
                });
            }
        });
    }

    return {
        init: init,
        start: start
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.installUsage,
    dependencies: ["serviceMap"],
    onLoad: conduit.backstage.serviceLayer.installUsage.init
});
﻿conduit.register("backstage.serviceLayer.menu", (function () {
    var serviceName = "menu",
        menusData = {};

    function loadData(xmlData, isPreProcessed) {
        var menuData;

        if (isPreProcessed) {
            menuData = menusData[this.name] = xmlData;
        }
        else {
            xmlData = xmlData.replaceReservedKeywords();

            var xmlData = conduit.backstage.serviceLayer.commons.fixParserError(xmlData).replace("\ufeff", "");
            var xmlDoc = $.parseXML(xmlData);
            menuData = menusData[this.name] = conduit.backstage.serviceLayer.commons.appXml2Json(xmlDoc);
            menuData.appId = this.context;
        }

        var appData = conduit.backstage.serviceLayer.config.toolbarSettings.getAppData(menuData.appId);
        if (menuData.data.button) {
            appData.displayIcon = menuData.data.button.buttonIconUrl;
            appData.displayText = menuData.data.button.defaultButtonText;
            appData.button = menuData.data.button;
        }

        conduit.abstractionlayer.commons.messages.postTopicMsg(
            "serviceLayer.menu.onMenuData",
            "serviceLayer.menu",
            JSON.stringify(menuData)
        );
        return menuData;
    }

    function loadMenu(menuData) {
        var keyHash = "menu_" + conduit.abstractionlayer.backstage.encryption.hash(menuData.url).result;

        conduit.backstage.serviceLayer.serviceDataManager.addService({
            name: keyHash,
            url: menuData.url,
            interval: menuData.interval * 1000 * 60,
            callback: loadData,
            context: menuData.appId
        },function(returnedService){});
    }

    return {
        loadMenu: loadMenu
    };
})());
﻿conduit.register("backstage.serviceLayer.clientErrorLog", (function () {
    var serviceName = "clientErrorLog",
        service,
        serviceData,
        errorItemsArray = [],
        absCommons = conduit.abstractionlayer.commons,
        serviceLayer = conduit.backstage.serviceLayer,
        ctid = absCommons.context.getCTID().result,
        messages = absCommons.messages,
		toolbarVersion = absCommons.environment.getEngineVersion().result,
		browserInfo = absCommons.environment.getBrowserInfo().result,
		OSInfo = absCommons.environment.getOSInfo().result,
        absRepository = absCommons.repository,
        clientErrorId


    function init(initData) {
        absCommons.context.getUserID(function (response) {
            clientErrorId = response.result;
            initData = initData || {};
            serviceData = initData.serviceData || serviceLayer.serviceMap.getItemByName("ClientLog");
            if (!serviceData) {
                // this can happen only if the serviceMap service failed.
                serviceData = { url: "http://clientlog.conduit-services.com/log/putlog" };
            }

            serviceLayer.serviceDataManager.addService({
                name: serviceName,
                url: serviceData.url,
                callback: loadErrorLogData,
                dataType: "application/json",
                method: "POST",
                getData: buildErrorLogData,
                manualInvoke: true
            }, function (returnedService) {
                service = returnedService;
            });
        });

    }

    function loadErrorLogData(data, isPreProcessed, extraObj) {

        return data;
    }

    function buildErrorLogData() {
        if (errorItem) {
            var formattedLogItem = formatLogItem(errorItem);
            errorItem = null;
            return formattedLogItem;
        }

        return;
    }

    function addError(error) {
        if (error) {
            if (typeof (error.code) !== 'undefined' && error.code == 180) {
                // we failed to invoke the clientErrorLog service, we will not try again in this session.
                return;
            }
            errorItem = error;
            if (!service) {
                init();
            }
            isServiceEnabled(function (serviceIsEnabled) {
                if (serviceIsEnabled) {
                    service.updateData({ error: errorItem });
                    service.invoke();
                }
            });
        }
    }

    function isServiceEnabled(callback) {
        var serviceEnabled = true;
        // if there is loginData, we need to check the clientLogService enable flag, otherwise, we will invoke only once and wait for the loginData.
        if (serviceLayer.login && serviceLayer.login.getLoginData()) {
            var loginData = serviceLayer.login.getLoginData();
            if (loginData) {
                serviceEnabled = false;
                if (loginData.clientLogService && loginData.clientLogService.enabled === true) {
                    serviceEnabled = true;
                }
            }
            callback(serviceEnabled);
        }
        else {
            // there is no login data.
            var cachedData = serviceLayer.serviceDataManager.getData(serviceName, function (data) {
                if (cachedData) {
                    // we already invoked this service, so we will not invoke it until there is login data.
                    serviceEnabled = false;
                }
                callback(serviceEnabled);
                // else -  this service was not invoked. we will invoke it once and wait for the loginData.
            });
        }
    }

    function formatLogItem(logItem) {

        var errorData = "";
        var errorMessage = "";
        var errorName = logItem.name ? logItem.name : "";
        var errorUrl = logItem.url ? conduit.coreLibs.aliasesManager.replaceAliases(logItem.url) : "";
        if (logItem.error && (logItem.error.message || logItem.error.stack)) {
            errorData = logItem.error.message + "\n stack: " + logItem.error.stack;
        }

        if (logItem.message) {
            errorMessage = logItem.message;
        }


        var activeCTID = (serviceLayer.login && serviceLayer.login.getActiveCTID()) ? serviceLayer.login.getActiveCTID() : ctid;
        var clientLog = {};
        clientLog.logData = {
            // static
            clientType: "Toolbar", // for future use. 
            clientVersion: toolbarVersion || "",
            clientCreationDate: conduit.backstage.serviceLayer.commons.getToolbarBornServerTime() || "",
            ctid: activeCTID || "",
            originalCtid: ctid || "",
            browser: browserInfo.type || "",
            browserVersion: browserInfo.version || "",
            browserBitType: browserInfo.bitType || "",
            browserLocale: browserInfo.locale || "",
            osType: OSInfo.type || "",
            osVersion: OSInfo.version || "",
            osLocale: OSInfo.locale || "",
            osServicePack: OSInfo.servicePack || "", // Service Pack 1 - from registry
            osBitType: OSInfo.bitType || "", // 64Bit/32Bit or WOW64/Win64 - can be taken from user agent
            osEdition: OSInfo.edition || "", // Professional/Home - from registry. does not exist for XP
            timestamp: (new Date()).format("mm-dd-yyyy HH:MM:ss"),
            userId: clientErrorId || "",
            machineId: conduit.coreLibs.config.getMachineId() || "",
            hidden: conduit.abstractionlayer.backstage.browser.isHidden().result || "",
            installId: absRepository.getKey(ctid + ".installId").result || "",
            installType: absRepository.getKey(ctid + ".installType").result || "",
            // dynamic
            level: logItem.level, //DEBUG->INFO->WARN->ERROR->FATAL
            code: logItem.code || "",
            message: errorMessage || "",
            description: errorData || "",
            name: errorName,
            url: errorUrl
        };

        return JSON.stringify(clientLog);
    }

    // If there's a new URL or interval for the service, re-initialize the service:
    conduit.subscribe("onServiceMapChange", function () {
        var currentServiceData = serviceLayer.serviceMap.getItemByName("ClientLog");
        if (currentServiceData.url !== serviceData.url || currentServiceData.reload_interval_sec !== serviceData.reload_interval_sec) {
            serviceLayer.serviceDataManager.update(service, { url: currentServiceData.url, interval: currentServiceData.reload_interval_sec * 1000 }, false);
        }
    });


    return {
        init: init,
        addError: addError
    }

})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.clientErrorLog,
    dependencies: ["serviceMap","aliasesManager"],
    onLoad: conduit.backstage.serviceLayer.clientErrorLog.init
});



﻿conduit.register("backstage.serviceLayer.configuration", (function () {
    var configuration;
    var configurationService;
    var configurationData;
    var DEFAULT_INTERVAL = 1209600;
    var serviceDataManager = conduit.backstage.serviceLayer.serviceDataManager;
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
    var absStorage = conduit.abstractionlayer.commons.storage;
    var countryCode;

    function notifyReady() {
        conduit.triggerEvent("onReady", { name: 'configuration' });
        conduit.abstractionlayer.commons.messages.postTopicMsg(
		"systemRequest.configurationReady",
		"conduit.backstage.serviceLayer.configuration",
		"");
    }


    function loadConfiguration(data, isPreProcessed) {
        if (!isPreProcessed) {
            try {
                data = JSON.parse(data);
            } catch (e) { }
        }
        configuration = data;
        countryCode = configuration && configuration.Location && configuration.Location.CountryCode;
        conduit.coreLibs.aliasesManager.setAlias(conduit.coreLibs.aliasesManager.constants.EB_COUNTRY_CODE, countryCode);
        conduit.abstractionlayer.commons.repository.setKey(ctid + ".countryCode", countryCode);
        notifyReady();
        return data;
    }

    function init(initData) {
        configurationData = conduit.backstage.serviceLayer.serviceMap.getItemByName("Configuration");

        serviceDataManager.addService({
            name: configurationData.name,
            url: configurationData.url,
            interval: (configurationData.reload_interval_sec || DEFAULT_INTERVAL) * 1000,
            callback: loadConfiguration,
            dataType: "json",
            enabledInHidden: true
        }, function (returnedData) {
            configurationService = returnedData;
        });

        if (conduit.backstage.serviceLayer.configuration.init) {
            delete conduit.backstage.serviceLayer.configuration.init;
        }

    }

    function getCountryCode() {
        return countryCode;
    }

    // If there's a new URL or interval for the service, re-initialize Configuration:
    conduit.subscribe("onServiceMapChange", function () {
        var currentServiceData = conduit.backstage.serviceLayer.serviceMap.getItemByName("Configuration");

        if (currentServiceData.url !== configurationService.url || currentServiceData.reload_interval_sec !== configurationService.reload_interval_sec) {
            serviceDataManager.update(configurationService, { url: currentServiceData.url, interval: currentServiceData.reload_interval_sec * 1000 }, true);
        }
    });




    return {
        init: init,
        getCountryCode: getCountryCode
    }
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.backstage.serviceLayer.configuration,
    dependencies: ["serviceMap"],
    onLoad: conduit.backstage.serviceLayer.configuration.init
});
