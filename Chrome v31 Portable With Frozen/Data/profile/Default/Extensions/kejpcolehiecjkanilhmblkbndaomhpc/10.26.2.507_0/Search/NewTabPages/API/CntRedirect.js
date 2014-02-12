var cntRedirectObj = function () {

    var url;
    var isCntRedirect = true;
    var initFinished = false;
    

    var consts = {
        consoleLog: "CntRedirect_" + "consoleLog"
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    var setService = function() {
        var res = true;
        
        var api = conduit.newtab.toolbar.searchAPI;
        
        if (api && api.NewTab) {
            isCntRedirect = api.NewTab.IsCNTRedirect;
            url = api.NewTab.Url;
            
            //ctid,um,sspv,cui,up
            url = conduit.newtab.formatUrl(url);
        } else {
            //we need to get url from CNTR, because we don't have API
            var cntr = conduit.newtab.settings.getSettingsKey("CNTRRedirectUrl");
            url = conduit.newtab.formatUrl(cntr);
            
            var searchSource = conduit.newtab.embeddedConfig.get("SearchSource");
            if (searchSource == null || searchSource.length == 0) {
                searchSource = 15;
            }

            url = url.replace(/SEARCH_SOURCE_ID/g , searchSource);
            
        }

        return res;
    };

    var obj = {
        get redirectUrl() {
            return url;
        },

        get isCNTRedirect() {
            var enableCNTR = conduit.newtab.settings.getSettingsKey("EnableCNTR");
            return enableCNTR == 'true' && isCntRedirect;
        },

        init: function() {
            try {
                conduit.newtab.initConsoleLog(consts.consoleLog);
                consoleLog("init");

                var success = setService();

                initFinished = true;

                if (success) {
                    conduit.newtab.toolbar.onChanged.addListener(setService);
                }
                return success;
            } catch(e) {
                exceptionHandler(e, getLineInfo());
                return false;
            }
        },
    };

    return obj;
    
}; //end of cntRedirectObj
