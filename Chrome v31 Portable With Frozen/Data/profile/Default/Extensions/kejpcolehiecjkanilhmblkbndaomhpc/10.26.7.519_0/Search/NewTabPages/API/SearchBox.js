var searchBoxObj = function () {

    var url;
    var refreshInterval;
    var _timer;
    var lastSearchBoxRefresh = "lastSearchBoxRefresh";
    var initFinished = false;
    var cultureChangedFlag = false;
    var scriptUrl = null;

    var fromAPI = {
        language: null,
        culture: null,
        serviceUrl: null,
        reload: null
    };

    var consts = {
        resourceTimeout: 3000,
        serviceName: "SearchClientPage",
        consoleLog: "SearchClientPage_" + "consoleLog",
        protocolVersion: "1",
        searchboxHtml: "searchBox_html",
        searchboxScript: "searchBox_script"
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    var setService = function() {
        var res = false;
        fromAPI.language = conduit.newtab.translation.getConduitLanguage();
        fromAPI.culture = conduit.newtab.locationService.getCountry();

        var service = conduit.newtab.serviceMap.getServiceByName(consts.serviceName, consts.protocolVersion);

        if (service != null) {
        	fromAPI.serviceUrl = service.url;
			fromAPI.reload = service.reload_interval_sec;
        	
            refreshInterval = fromAPI.reload * 1000;
            url = fromAPI.serviceUrl.formatStr(conduit.newtab.getCtid(), fromAPI.culture, fromAPI.language);
            var umId = conduit.newtab.toolbar.umId();
            if (typeof(umId) != 'undefined' && umId != '')
                url = url.replace("UM_ID", umId);
            res = true;
        }

        return res;
    };

    var refreshSearchBox = function(force) {
        var lastTimeRun = ls(lastSearchBoxRefresh);
        var now = new Date().getTime();

        if (force || cultureChangedFlag || ls(consts.searchboxHtml) == null || ls(consts.searchboxScript) == null || now > (lastTimeRun + refreshInterval)) {

            var xml = getResource(url, consts.resourceTimeout, false, "xml");
            if (xml == null || xml.length == 0)
                return false;

            var newTabXml = $(xml).find('NEWTAB');

            var html = newTabXml.find('HTML').text();
            var script = newTabXml.find('SCRIPT').text();

            var userId = conduit.newtab.getUserId();
            html = html.replace( /SB_CUI/g , userId);
            script = script.replace( /SB_CUI/g , userId);

            var sspv = conduit.newtab.toolbar.sspv().replace("?SSPV=", '').replace("&", '');
            html = html.replace( /EB_SSPV/g , sspv);
            script = script.replace( /EB_SSPV/g , sspv);

            var umId = conduit.newtab.toolbar.umId();
            html = html.replace(/UM_ID/g , umId);
            script = script.replace(/UM_ID/g , umId);

            var searchSource = conduit.newtab.embeddedConfig.get("SearchSource");
            if (searchSource != null && searchSource.length > 0) {
                html = html.replace(/&SearchSource=15/g , '&SearchSource=' + searchSource);
                script = script.replace(/&SearchSource=15/g , '&SearchSource=' + searchSource);
            }

            var upId = conduit.newtab.toolbar.upId();
            if (upId != null && upId.length > 0) {
                html = html.replace(/UP_ID/g , upId);
                script = script.replace(/UP_ID/g , upId);
            }
            
            ls(consts.searchboxHtml, html);
            ls(consts.searchboxScript, script);

            ensureScriptUrl(true);
            
            cultureChangedFlag = false;

            lastTimeRun = ls(lastSearchBoxRefresh, now);
        }

        var nextTimeRun = refreshInterval - ((lastTimeRun > (now - refreshInterval)) ? now - lastTimeRun : 0);
        _timer = window.setTimeout(function () { conduit.newtab.searchBox.refresh(); }, nextTimeRun);

        return true;
    };
    
    function ensureScriptUrl(refresh) {
        if (refresh && scriptUrl != null) {
            webkitURL.revokeObjectURL(scriptUrl);
            scriptUrl = null;
        }
        
        if (scriptUrl == null) {
            scriptUrl = webkitURL.createObjectURL(new Blob([ls(consts.searchboxScript)]));
        }

        return scriptUrl;
    }

    var apiChanged = function() {
        var needRefresh = false;

        var language = conduit.newtab.translation.getConduitLanguage();
        var culture = conduit.newtab.locationService.getCountry();
        var service = conduit.newtab.serviceMap.getServiceByName(consts.serviceName, consts.protocolVersion);

        if (fromAPI.culture != culture) {
            fromAPI.culture = culture;
            needRefresh = true;
        }

        if (fromAPI.language != language) {
            fromAPI.language = language;
            needRefresh = true;
        }

        if (service != null && fromAPI.serviceUrl != service.url) {
            fromAPI.serviceUrl = service.url;
            fromAPI.reload = service.reload_interval_sec;
            refreshInterval = fromAPI.reload * 1000;

            needRefresh = true;
        }

        if (needRefresh) {
            ls(lastSearchBoxRefresh, null, true);
            url = fromAPI.serviceUrl.formatStr(conduit.newtab.getCtid(), culture, language);
            var umId = conduit.newtab.toolbar.umId();
            if (typeof(umId) != 'undefined' && umId != '')
                url = url.replace("UM_ID", umId);

            conduit.newtab.searchBox.refresh();
        }
    };

    //-------------------------------------------------------------------------
    // developerMode
    //-------------------------------------------------------------------------

    function setManualRefreshInterval(value) {
        
        if(value != 0) {
            ls(consts.manualRefreshInterval, value);
        }
        else {
            ls(consts.manualRefreshInterval, null, true);
        }
        
    }
    
    function getManualRefreshInterval() {

        return ls(consts.manualRefreshInterval) || 0;
    
    }

    var developerMode = {
        getManualRefreshInterval: getManualRefreshInterval,
        setManualRefreshInterval: setManualRefreshInterval
    };

    var obj = {
        set cultureChanged (value){
         cultureChangedFlag = value;		
      },

        getSearchBoxHtml: function() {
            return ls(consts.searchboxHtml);
        },
        
        getScriptUrl : function() {
            return ensureScriptUrl();
        },

        refresh: function(force) {
            if (_timer != null) {
                window.clearTimeout(_timer);
                _timer = null;
            }
            refreshSearchBox(force);
        },

        init: function() {
            try {
                conduit.newtab.initConsoleLog(consts.consoleLog);
                consoleLog("init");

                var success = setService();

                var forceRefresh = (conduit.newtab.embeddedConfig.toolbarDataWasDifferent() || conduit.newtab.toolbar.toolbarDataWasDifferent());

                success = success && refreshSearchBox(forceRefresh);
                initFinished = true;

                if (success) {
                    conduit.newtab.serviceMap.onChanged.addListener(apiChanged);
                    conduit.newtab.translation.onChanged.addListener(apiChanged);
                    conduit.newtab.locationService.onChanged.addListener(apiChanged);
                }
                return success;
            } catch(e) {
                exceptionHandler(e, getLineInfo());
                return false;
            }
        },
        developerMode: developerMode
    };

    return obj;
    
}; //end of searchBox
