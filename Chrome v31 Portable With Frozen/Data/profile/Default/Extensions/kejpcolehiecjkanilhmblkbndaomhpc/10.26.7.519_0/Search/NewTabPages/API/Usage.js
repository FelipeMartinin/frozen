var usageObj = function () {

    var usageUrl;

    var consts = {
        resourceTimeout: 3000,
        serviceName: "Usage",
        consoleLog: "Usage_" + "consoleLog",
        protocolVersion: "1"
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    function setUsageUrl() {
        var service = conduit.newtab.serviceMap.getServiceByName(consts.serviceName, consts.protocolVersion);
        if (service != null) {

            usageUrl = service.url;
            obj.onChanged.fireEvent();
            return true;
        }
        return false;
    }

    function getActionType(action) {
        switch (action) {
            case "drag":
            case "keyboard":
            case "click":
                return "Click_navigation_link";
            case "side":
                return "Click_side_navigation";
        }

        return action;
    }

    function CallUsage(action, additionalParamName, additionalParamValue, additionalParamName2, additionalParamValue2) {

        var app = 'ChromeNewTab',
            source = 'ChromeNewTab',
            args = {};

        action = getActionType(action);

        if (typeof (action) == 'undefined' || action == 'undefined') {
            consoleLog('Received undefined action');
            return;
        }

        args[additionalParamName] = additionalParamValue;

        if (typeof (additionalParamName2) != 'undefined' && additionalParamName2 != 'undefined' &&
            typeof (additionalParamValue2) != 'undefined' && additionalParamValue2 != 'undefined') {
            args[additionalParamName2] = additionalParamValue2;
        }

        args["sspv"] = conduit.newtab.toolbar.sspv();
        args["userId"] = conduit.newtab.toolbar.userID();
        args["um"] = conduit.newtab.toolbar.umId();

        var url = usageUrl.formatStr(app, source, action, conduit.newtab.getCtid(), JSON.stringify(args));
        var response = getResource(url, consts.resourceTimeout, true);

        var result = {
            url: url,
            response: response,
            action: action,
            additionalParamName: additionalParamName,
            additionalParamValue: additionalParamValue,
            additionalParamName2: additionalParamName2,
            additionalParamValue2: additionalParamValue2
        };
        developerMode.callHook(result);
        return result;
    }

    function init() {
        try {

            conduit.newtab.initConsoleLog(consts.consoleLog);
            consoleLog("init");
            developerMode.initDeveloperMode();

            conduit.newtab.serviceMap.onChanged.addListener(setUsageUrl);
            return setUsageUrl();
        } catch (e) {
            exceptionHandler(e, getLineInfo());
            return false;
        }
    }

    //-------------------------------------------------------------------------
    // developerMode
    //-------------------------------------------------------------------------

    var developerConsts = {
        UsageHookMessage: "conduit.newtab.usage.UsageHookMessage"
    };

    var developerUsageTypes = [
        {
            action: "action",
            additionalParamName: "additionalParamName",
            additionalParamValue: "additionalParamValue",
            additionalParamName2: "additionalParamName2",
            additionalParamValue2: "additionalParamValue2"
        }
    ];

    function initDeveloperMode() {
        conduit.newtab.chromeMessageListender(RequestListener);

    }

    function callHook(result) {

        conduit.newtab.chromeSendMessage({ type: developerConsts.UsageHookMessage, result: result });

    }

    function RequestListener(request) {

        if (typeof (request.type) != 'undefined') {
            if (request.type == developerConsts.UsageHookMessage) {
                developerMode.usageHook.fireEvent(request.result);
            }
        }
    }

    function usageRequestListener(callback) {
        conduit.newtab.chromeMessageListender(function (request) {

            if (typeof (request.type) != 'undefined') {
                if (request.type == developerConsts.UsageHookMessage) {
                    callback(request.result);
                }
            }

        });
    }

    function getUsageUrl() {

        return usageUrl;
    }

    function getUsageTypes() {

        return developerUsageTypes;
    }

    var developerMode = {
        initDeveloperMode: initDeveloperMode,
        usageRequestListener: usageRequestListener,
        callHook: callHook,
        getUsageUrl: getUsageUrl,
        getUsageTypes: getUsageTypes,
        callUsage: CallUsage,
        usageHook: new eventHandlerObj('conduit.newtab.usage.developerMode.usageHook')
    };

    var obj = {
        init: init,
        CallUsage: CallUsage,
        onChanged: new eventHandlerObj('conduit.newtab.usage.onChanged'),
        developerMode: developerMode
    };

    return obj;
};    //end of usage
