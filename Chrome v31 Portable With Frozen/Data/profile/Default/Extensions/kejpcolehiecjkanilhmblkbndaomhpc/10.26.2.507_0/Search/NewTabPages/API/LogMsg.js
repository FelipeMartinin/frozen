var logMsgObj = function () {

    var logMsgUrl = "http://log.usage.search.conduit.com/Logmsg/{0}/{1}/{2}/{3}?ctid={4}&args={5}";
    var version;
    var finishedInit = false;

    var consts = {
        resourceTimeout: 3000,
        serviceName: "LogMsg",
        consoleLog: "logMsg_" + "consoleLog",
        protocolVersion: "1"
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    function setLogMsgUrl() {
        var service = conduit.newtab.serviceMap.getServiceByName(consts.serviceName, consts.protocolVersion);
        if (service != null) {

            logMsgUrl = service.url;
            obj.onChanged.fireEvent();
            return true;
        }
        return false;
    }

    function CallLogMsg(severity, title, msg) {

        var app = 'ChromeNewTab',
            args = {};

        args["sspv"] = conduit.newtab.toolbar.sspv();
        args["userId"] = conduit.newtab.toolbar.userID();
        args["um"] = conduit.newtab.toolbar.umId();
        args["version"] = conduit.newtab.embeddedConfig.get("version");

        var url = logMsgUrl.formatStr(app, severity, encodeURIComponent(title), encodeURIComponent(msg), conduit.newtab.getCtid(), JSON.stringify(args));
        var response = getResource(url, consts.resourceTimeout, true);
    }

    function CallLogMsgEmergency(severity, title, msg) {

        var app = 'ChromeNewTab';
        var url = logMsgUrl.replace("{0}", app).replace("{1}", severity).replace("{2}", encodeURIComponent(title)).replace("{3}", encodeURIComponent(msg)).replace("{4}", "").replace("{5}", "");
        var img = new Image();
        img.src = url;
    }

    function init() {
        try {
            version = conduit.newtab.embeddedConfig.get("version");
            conduit.newtab.initConsoleLog(consts.consoleLog);
            consoleLog("init");

            conduit.newtab.serviceMap.onChanged.addListener(setLogMsgUrl);
            return setLogMsgUrl();
        } catch (e) {
            exceptionHandler(e, getLineInfo());
            return false;
        }
    }

    var obj = {
        init: init,
        CallLogMsg: CallLogMsg,
        onChanged: new eventHandlerObj('conduit.newtab.logMsg.onChanged'),
        CallLogMsgEmergency: CallLogMsgEmergency
    };

    return obj;
};           //end of usage
