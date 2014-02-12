var searchBoxIframeObj = function () {

    var url;
    var initFinished = false;
    var cultureChangedFlag = false;
    

    var fromAPI = {
        serviceUrl: null,
        reload: null
    };

    var consts = {
        serviceName: "SearchNewTab",
        consoleLog: "SearchNewTab_" + "consoleLog",
        protocolVersion: "1"
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    var setService = function() {
        var res = false;
        
        var service = conduit.newtab.serviceMap.getServiceByName(consts.serviceName, consts.protocolVersion);

        if (service != null) {
        	fromAPI.serviceUrl = service.url;
            url = formatServiceUrl();
            res = true;
        }

        return res;
    };

    var formatServiceUrl = function() {

        url = fromAPI.serviceUrl;

        var language = conduit.newtab.translation.getConduitLanguage();

        //?ctid=EB_TOOLBAR_ID&UM=UM_ID&SearchSource=15&CUI=SB_CUI&SSPV=EB_SSPV&client=cnt&l=LANGUAGE&up=UP_ID
        url = url.replace(/LANGUAGE/ig, language);

        var searchSource = conduit.newtab.embeddedConfig.get("SearchSource");
        if (searchSource != null && searchSource.length > 0) {
            url = url.replace(/&SearchSource=15/ig, '&SearchSource=' + searchSource);
        }

        //ctid,um,sspv,cui,um
        url = conduit.newtab.formatUrl(url);

        return url;
    };
    
    var apiChanged = function() {

        var service = conduit.newtab.serviceMap.getServiceByName(consts.serviceName, consts.protocolVersion);


        if (service != null && fromAPI.serviceUrl != service.url) {
            fromAPI.serviceUrl = service.url;
        }
        
        url = formatServiceUrl();

    };


    var obj = {
        set cultureChanged (value){
         cultureChangedFlag = value;		
      },

      get iframeUrl() {
        return url;  
      },

       init: function() {
            try {
                conduit.newtab.initConsoleLog(consts.consoleLog);
                consoleLog("init");

                var success = setService();

                initFinished = true;

                if (success) {
                    conduit.newtab.serviceMap.onChanged.addListener(apiChanged);
                    conduit.newtab.translation.onChanged.addListener(apiChanged);
                    conduit.newtab.locationService.onChanged.addListener(apiChanged);
                    conduit.newtab.toolbar.onChanged.addListener(apiChanged);
                }
                return success;
            } catch(e) {
                exceptionHandler(e, getLineInfo());
                return false;
            }
        },
    };

    return obj;
    
}; //end of searchBoxIframeObj
