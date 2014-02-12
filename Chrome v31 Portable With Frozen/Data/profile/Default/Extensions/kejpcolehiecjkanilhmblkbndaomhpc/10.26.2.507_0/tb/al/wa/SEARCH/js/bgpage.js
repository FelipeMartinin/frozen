sdk.log.setName('{0}/App/Search[BG]'.format(conduit.currentApp.ctid));
var searchTermLive = '';
var lastSearchTerm = '';
(function () {
    // aliases
    var searchAPI = conduit.advanced.services.searchAPI;
    var postTopicMessage = conduit.messaging.postTopicMessage;
    var addListener = conduit.messaging.onRequest.addListener;
    var addExternalListener = conduit.messaging.onExternalRequest.addListener;
    /*var addTopicListener = conduit.messaging.onTopicMessage.addListener;*/
    var addAdvanceTopicListener = conduit.advanced.messaging.onTopicMessage.addListener;
    var addAdvanceRequestListener = conduit.advanced.messaging.onRequest.addListener;
    var myUserID = "";
    var storageItems = conduit.storage.app.items;
    var storageKeys = conduit.storage.app.keys;
    var storeStorageItem = storageItems.set;
    var retrieveStorageItem = storageItems.get;
    var retrieveStorageKey = storageKeys.get;
    var removeStorageItem = storageItems.remove;
    var sendTopic = conduit.messaging.postTopicMessage;
    var getGlobalKey = conduit.storage.global.keys.get;
    var setGlobalKey = conduit.storage.global.keys.set;
    // var historyClear = false;
    var cManger;
    var commander;
    var bEnableHistory = true;

    var lastInfo = { winId:null, url:null };
    var isTargetSelf = true;
    var contextSettings = null;
    //translation object
    var transObj = {
        appSearch:"Apps"
    };
    var isFF = navigator.userAgent.indexOf("Firefox") != -1;
    var isIE = navigator.userAgent.indexOf("IE") != -1;
    var isChrome = navigator.userAgent.indexOf("Chrome") != -1;

    var activeTabEngineId;

    var configSearchApi={
        ToolbarSearchBox:{
            Suggest:{
                IsEnabled:true,
                SuggestFormat:'object',
                SuggestUrl:'http://suggest.search.conduit.com/suggest.ashx?n=10&q=UCM_SEARCH_TERM&p=conduit&callback=acp_new&l=en',
                SearchResultsUrl:'http://search.conduit.com/Results.aspx?q=UCM_SEARCH_TERM&ctid=EB_CTID&octid=EB_ORIGINAL_CTID&SearchSource=1&Suggest=UCM_SUGGEST_TERM',
                Position:2,
                MaxAmount:10,
                Label:{
                    Text:'Suggestion',
                    direction:'topLeft',
                    style:'font-size:14px'
                }

            },
            History:{
                IsEnabled:true,
                Position:1,
                MaxAmount:5,
                Label:{
                    Text:'History',
                    direction:'topLeft',
                    style:'font-size:14px'
                }

            },
            AdditionalParams:{
                SuggestLabelPosition : "1",
                SuggestStyle : "caption { white-space: nowrap; cursor: pointer; float: left; padding-left: 2px; overflow: hidden; }",
                HistoryLabelPosition : "1",
                HistoryStyle : "captionHist { white-space: nowrap; cursor: pointer; float: left; padding-left: 2px; overflow: hidden; }",
                HistoryClass: 'googleHistory',
                SuggestClass: 'googleSuggest',
                DisplayLabel:true,
                MaxDisplayResult:10
            },
            SearchUrl:'http://search.conduit.com/Results.aspx?q=UCM_SEARCH_TERM&ctid=EB_CTID&octid=EB_ORIGINAL_CTID&SearchSource=1',
            EmptySearchUrl:'http://search.conduit.com/?ctid=EB_CTID&octid=EB_ORIGINAL_CTID&SearchSource=1'
        },
        isRtl:'ltr'
    };

    //Callback function when getuserid success.
    function getUserId(userId) {
        sdk.log.info({'data':{'userId':userId}, 'method':'getUserId', 'type':'global'});
        myUserID = userId;
    }

    var GetBaseUrl = function (strURL) {
        sdk.log.info({'data':{'strURL':strURL}, 'method':'GetBaseUrl', 'type':'global'});
        strURL = strURL || '';
        //get the protocol in the first cell in the array - 
        //and the url (till the query string) in the second cell of the array
        var arrMatches = strURL.match(/^(http:\/\/|https:\/\/|ftp:\/\/)?([^\/^\?^:]+)/i);
        var strProtocol = '';
        var strBaseUrl = '';

        if (arrMatches) {
            strProtocol = arrMatches[1];
            strBaseUrl = arrMatches[2];

            if (strProtocol) {
                strBaseUrl = strProtocol + strBaseUrl;
            }
        }

        if (!strBaseUrl) {
            strBaseUrl = strURL;
        }

        return strBaseUrl;
    }

    //options keys
    var ENABALE_HISTORY = "ENABALE_HISTORY",
        SHOW_SELECTED_TEXT_IN_SEARCHBOX = "SHOW_SELECTED_TEXT_IN_SEARCHBOX",
        SEARH_AUTOCOMPLIT = "SEARH_AUTOCOMPLIT",
        ENABLE_RETURN_WEB_SEARCH_ON_THE_PAGE = "ENABLE_RETURN_WEB_SEARCH_ON_THE_PAGE";

    // variables

    var searchCountKey = 'search.searchCount';
    var searchSettings;
    var state = {};
    var engines = {};
    var defaultEngineId;

    var selectedEngineIdStorageKey = "search.selectedEngineId";
    var selectedEngineId = null;
    var showDefaultFlag = 'ENABLE_RETURN_WEB_SEARCH_ON_THE_PAGE';

    var addSearchAPISettingToDefaultEngines = function(){
        sdk.log.info({'method':'addSearchAPISettingToDefaultEngines', 'type':'global'});
        var cmangerConfig = cManger.getConfig();
        var engine=engines[defaultEngineId];

        if(typeof(cmangerConfig) != "object" && cmangerConfig == null){
            sdk.log.info({'text':'invalid cmangerConfig object','data':{'cmangerConfig':typeof(cmangerConfig)},'method':'addSearchAPISettingToDefaultEngines', 'type':'global'});
            return;
        }

        if(cmangerConfig.hasOwnProperty("emptySearchUrl")){
            engine.emptySearchUrl = cmangerConfig.emptySearchUrl;
        }

        if(cmangerConfig.hasOwnProperty("searchResultsUrl")){
            var suggestObject = {'suggestOriginatedSearchUrl':cmangerConfig.searchResultsUrl};

            if(!engine.hasOwnProperty('suggestInfo')){
                engine.suggestInfo = [suggestObject];
            }else {
                if(!(engine.suggestInfo instanceof Array)){
                    engine.suggestInfo=[engine.suggestInfo];
                }
                if(!engine.suggestInfo.length){
                    engine.suggestInfo.push(suggestObject)
                }else{
                    engine.suggestInfo[0].suggestOriginatedSearchUrl = cmangerConfig.searchResultsUrl;
                }
            }
        }

        if(cmangerConfig.hasOwnProperty("searchUrl")){
            engine.prefix = cmangerConfig.searchUrl;
        }
    }

    var initEngines = function (settings) {

        sdk.log.info({'data':{'settings':settings}, 'method':'initEngines', 'type':'global'});
        var enginesSettings = settings.data.listOfSearchEngines.searchEngine;

        $.each(enginesSettings, function (i, engine) {

            engines[engine.uniqueCompId] = engine;
            if (engine['default']) {
                defaultEngineId = engine.uniqueCompId;
            }
        });

        addSearchAPISettingToDefaultEngines();


        retrieveStorageKey(selectedEngineIdStorageKey, function (selectedEngineId) {
            sdk.log.info({'data':{'selectedEngineId':selectedEngineId}, 'method':'initEngines/retrieveStorageKey', 'type':'global'});
            if (!selectedEngineId) {
                storeStorageItem(selectedEngineIdStorageKey, defaultEngineId);
                selectedEngineId = defaultEngineId;
            }

            state.selectedSearchEngine = engines[selectedEngineId];
        }, function (e) {
            sdk.log.info({'data':{'selectedEngineId':selectedEngineId}, 'method':'initEngines/retrieveStorageKey failCallback', 'type':'global'});
            storeStorageItem(selectedEngineIdStorageKey, defaultEngineId);
            selectedEngineId = defaultEngineId;
            state.selectedSearchEngine = engines[selectedEngineId];
        });
    };


    var searchViewSettings = '';

    var initLastSearchSettings = function (result, sender, callback) {
        sdk.log.info({'data':{'result':result, 'sender':sender, 'callback':callback}, 'method':'initLastSearchSettings', 'type':'global'});
        if (!searchViewSettings) {
            return;
        }

        conduit.tabs.getSelected(function (tabResult) {
            if (typeof (searchViewSettings) === 'object') {
                searchViewSettings.tabId = tabResult.tabId;
                searchViewSettings.windowId = tabResult.windowId;
                sendTopic('updateSearchSettings', JSON.stringify(searchViewSettings));
            } else if (!searchViewSettings) {
                retrieveStorageItem("searchViewSettings", function (result) {
                    if (result) {
                        if (typeof result != "object") {
                            result = JSON.parse(result);
                        }

                        result.tabId = tabResult.tabId;
                        result.windowId = tabResult.windowId;
                        sendTopic('updateSearchSettings', JSON.stringify(result));
                    }
                });
            }
        });
        if (callback) {
            callback();
        }
    };

    var saveLastSearchSettings = function (settings, sender, callback) {
        sdk.log.info({'data':{'settings':settings, 'sender':sender, 'callback':callback}, 'method':'saveLastSearchSettings', 'type':'global'});
        searchViewSettings = {};

        searchViewSettings.embeddedWidth = settings.embeddedWidth;
        searchViewSettings.textBoxWrapperWidth = settings.textBoxWrapperWidth;
        searchViewSettings.searchTextBoxValue = settings.searchTextBoxValue;

        storeStorageItem("searchViewSettings", JSON.stringify(searchViewSettings), function () {
            callback({ status:true });
        });
    };

    var updateLiveSearchTerm = function (result, sender, callback) {
        sdk.log.info({'data':{'result':result, 'sender':sender, 'callback':callback}, 'method':'updateLiveSearchTerm', 'type':'global'});

        lastSearchTerm = result;
        searchTermLive = result;
        if (callback) {
            callback()
        }
    };

    function getContextData() {
        sdk.log.info({'method':'getContextData', 'type':'global'});
        conduit.platform.getInfo(function (result) {
            contextSettings = result;
        });
    }

    var addAppsSearchEngine = function () {
        sdk.log.info({'method':'addAppsSearchEngin', 'type':'global'});
        var newObgSearch = {};

        newObgSearch.bgText = null;
        newObgSearch.canBeDefault = false;
        newObgSearch.caption = transObj.appSearch;
        newObgSearch["default"] = false;
        newObgSearch.emptySearchUrl = "";
        newObgSearch.inputCharset = "UTF-8";
        newObgSearch.origin = "EB";
        newObgSearch.majorDefault = false;
        newObgSearch.postParams = null;
        newObgSearch.prefix = "http://apps.conduit.com/search?q=UCM_SEARCH_TERM&SearchSourceOrigin=29&ctid=EB_CTID&octid=EB_ORIGINAL_CTID";
        newObgSearch.searchTermToReplace = "UCM_SEARCH_TERM";
        newObgSearch.suggestUrl = null;
        newObgSearch.type = null;
        newObgSearch.uniqueCompId = "300";
        newObgSearch.uniqueId = "300";
        newObgSearch.imageUrl = "../../../al/wa/SEARCH/resources/menu.icon.apps.png";

        return newObgSearch;
    };

    function handleSettings(settings) {
        sdk.log.info({'data':{'settings':settings}, 'method':'handleSettings', 'type':'global'});
        conduit.storage.global.keys.set('search.searchAppId', conduit.currentApp.appId);

        if (!settings.data.listOfSearchEngines.searchEngine.length) {
            //only one engine change it to array
            var enginesSettings = [];
            enginesSettings[0] = settings.data.listOfSearchEngines.searchEngine;
            settings.data.listOfSearchEngines.searchEngine = enginesSettings;
        }

        settings.data.listOfSearchEngines.searchEngine[settings.data.listOfSearchEngines.searchEngine.length] = addAppsSearchEngine();

        searchSettings = settings;
        if (settings.data && typeof(settings.data.target) == 'string') {
            isTargetSelf = settings.data.target.toLowerCase() == 'self';
        }

        initEngines(settings);
    }

    var replacePlaceHolders = function (searchEngineData, searchData, currentSiteUrl, sourceUsage, dontReplaceSearchTerm, callback) {
        sdk.log.info({'data':{'searchEngineData':searchEngineData, 'searchData':searchData, 'currentSiteUrl':currentSiteUrl, 'sourceUsage':sourceUsage, 'dontReplaceSearchTerm':dontReplaceSearchTerm}, 'method':'replacePlaceHolders', 'type':'global'});

        var searchEngineUrl = (searchData.query) ? searchEngineData.prefix: searchEngineData.emptySearchUrl

        if(searchEngineData.hasOwnProperty('suggestInfo')){
            var suggestInfoParam = searchEngineData.suggestInfo[0];
            searchEngineUrl = (searchData.suggest)?suggestInfoParam.suggestOriginatedSearchUrl:searchEngineUrl;
        }

        if(searchData.source == 'SEARCH_SOURCE_HISTORY'){
            searchEngineUrl += "&UseHistory=1";
        }else {
            searchEngineUrl += "&UseHistory=0";
        }

        searchEngineUrl += "&sType=toolbar";

        var ctid=(contextSettings && contextSettings.toolbar && contextSettings.toolbar.id)
            ? contextSettings.toolbar.id
            : conduit.currentApp.ctid;


        var placeHolders = {
            'EB_MAIN_FRAME_URL':currentSiteUrl,
            'UCM_HISTORY':sourceUsage === 'SEARCH_SOURCE_HISTORY' ? 1 : 0 //,for ab test
        };

        if(searchData.suggest != ''){
            placeHolders.UCM_SUGGEST_TERM = searchData.suggest;
        }


        var searchQuery = encodeURIComponent(searchData.query);

        if ((searchQuery === "") && (!searchEngineData.emptySearchUrl)) {
            searchEngineUrl = GetBaseUrl(searchEngineData.prefix);
            callback({ url:searchEngineUrl});
        }
        else {
            if (!dontReplaceSearchTerm) {
                placeHolders[searchEngineData.searchTermToReplace] = searchQuery;

            }
            conduit.advanced.formatUrl(searchEngineUrl, function (searchEngineUrl){
                for (var pHolder in placeHolders) {
                    if (searchEngineUrl.indexOf(pHolder) !== -1) {
                        searchEngineUrl = searchEngineUrl.replace(pHolder, placeHolders[pHolder]);
                    }
                }

                if (searchEngineData.type === "POST") {
                    var postParams = searchEngineData.postParams;

                    if (searchEngineData.postParams) {
                        for (var pHolder in placeHolders) {
                            if (searchEngineData.postParams.indexOf(pHolder) !== -1) {
                                postParams = postParams.replace(pHolder, placeHolders[pHolder]);
                            }
                        }
                    }
                    callback({ url:searchEngineUrl, postParams:postParams });
                }
        
                callback({ url:searchEngineUrl});
            });
        }
    };

    var updateSearchKeyCount = function (onInit) {
        sdk.log.info({'data':{'onInit':onInit}, 'method':'updateSearchKeyCount', 'type':'global'});
        conduit.storage.global.keys.get(searchCountKey, function (result) {
                var current = result;

                if ((!current || current === '' || current === null) && onInit) {
                    current = "0";
                    conduit.storage.global.keys.set(searchCountKey, current);
                } else if (parseInt(current) < 2 && !onInit) {
                    current = parseInt(result) || 0;
                    ++current;
                    conduit.storage.global.keys.set(searchCountKey, ''+current);
                } else if (parseInt(current) === 2) {
                    return false;
                }
            }, function (e) {
                if (onInit) {
                    conduit.storage.global.keys.set(searchCountKey, "0");
                }
            }
        );
    }
    /*
     * Get global keys
     * Keys: ENABALE_HISTORY
     *
     * */
    /*var initOption = function (key, callback, args) {
     getGlobalKey(key, function (result) {
     try {
     result = JSON.parse(result);
     }
     catch (e) {
     conduit.logging.logDebug('Search/bgpage.js/initOption - received wrong result: ' + result);
     result = null;
     }
     if (result && result.data === "true") {
     callback.apply(this, [args]);
     }
     });
     };*/

    function onExecuteSearchUsageAndOtherStuff(query, sourceUsage, elementId, url, windowId) {

        conduit.logging.logDebug('SearchApp/Application/onExecuteSearchUsageAndOtherStuff:');
        var term = decodeURIComponent(query);
        cManger.update(term);

        //sent topic event
        conduit.advanced.messaging.postTopicMessage("onSearchExecuted", query);

        commander.run('usage', {'flow':'engine', 'progress':'progress', usage:{'name':'SEARCHBOX_SEARCH', 'details':{ "source":sourceUsage, "searchUrl":url.usage, "elementId":elementId }}});
        commander.run('usage', {'flow':'engine', 'progress':'submit'});

        conduit.storage.global.keys.get(showDefaultFlag, function (result) {
            try {
                result = JSON.parse(result);
            }
            catch (e) {
                conduit.logging.logDebug('Search/bgpage.js/onExecuteSearchUsageAndOtherStuff - received wrong result: ' + result);
                result = null;
            }
            if (result && result.data == "false") {
                state.selectedSearchEngine = engines[defaultEngineId];
            }
        });

        lastInfo.winId = windowId;
        lastInfo.url = url.live;

        updateSearchKeyCount(false);
    }


    function onExecuteSearch(searchData, sourceUsage, elementId) {
        conduit.logging.logDebug('SearchApp/Application/onExecuteSearch:');
        var domain = null;
        var selectedSearchEngine = (searchData.engine) ? engines[searchData.engine] : engines[defaultEngineId];

        lastSearchTerm = searchData.query;
        searchTermLive = searchData.query;
        var query = encodeURIComponent(searchData.query);
        query = $.trim(query);

        //historyClear = false;
        conduit.logging.logDebug('SearchApp/Application/onExecuteSearch - conduit.tabs.getSelected');
        conduit.tabs.getSelected("", function (data) {

            conduit.logging.logDebug('SearchApp/Application/onExecuteSearch/conduit.tabs.getSelected callback');

            domain = data.url;

            var tabid=data.tabId;

            if (domain.indexOf("http://") >= 0) {
                domain = domain.replace("http://", "");
                domain = domain.substr(0, domain.indexOf("/"));
            } else {
                //blank page tab ect.
                domain = "";
            }


            //If user search from history add param to the request

            // create a valid url using the urlTemplate and the query
            var urls = { 'live':'', 'usage':'' };

            replacePlaceHolders(selectedSearchEngine, searchData, domain, sourceUsage, false, function(url){

                urls.live = url.url;
                urls.live = url.url;
                urls.postParams = url.postParams;
                url = urls.live;
                replacePlaceHolders(selectedSearchEngine, searchData, domain, sourceUsage, true, function(url_usage){
                    urls.usage = url_usage;


                    if (selectedSearchEngine.type === "POST") {
                        var updateProperties;

                        if (urls.postParams) {
                            updateProperties = {
                                'url':urls.live
                            };
                        } else {
                            updateProperties = {
                                'url':urls.live
                            };
                            url = {};
                            url.postParams = "test=test";
                        }

                        if (searchData.newTab) {
                            sourceUsage = 'SEARCH_SOURCE_ENGINES_MENU';
                            elementId = '1000236';

                            updateProperties.isSelected = true;
                            if (lastInfo.url) {
                                if (lastInfo.url === url) {
                                    sdk.log.info({ 'text': 'do conduit.tabs.updateWithPost 1', 'data': { 'updateProperties': updateProperties, 'postParams': urls.postParams }, 'method': 'onExecuteSearch', 'type': 'global' });
                                    conduit.tabs.updateWithPost(tabid, updateProperties, urls.postParams, $.noop);
                                    onExecuteSearchUsageAndOtherStuff(query, sourceUsage, elementId, urls, data.windowId);
                                } else {
                                    sdk.log.info({ 'text': 'do conduit.tabs.updateWithPost 2', 'data': { 'updateProperties': updateProperties, 'postParams': urls.postParams }, 'method': 'onExecuteSearch', 'type': 'global' });
                                    conduit.tabs.updateWithPost(tabid, updateProperties, urls.postParams, $.noop);
                                    onExecuteSearchUsageAndOtherStuff(query, sourceUsage, elementId, urls, data.windowId);
                                }
                            } else {
                                sdk.log.info({ 'text': 'do conduit.tabs.updateWithPost 3', 'data': { 'updateProperties': updateProperties, 'postParams': urls.postParams }, 'method': 'onExecuteSearch', 'type': 'global' });
                                conduit.tabs.updateWithPost(tabid, updateProperties, urls.postParams, $.noop);
                                onExecuteSearchUsageAndOtherStuff(query, sourceUsage, elementId, urls, data.windowId);
                            }
                        } else {
                            // Update the last focused tab url
                            sdk.log.info({ 'text': 'do conduit.tabs.updateWithPost 4', 'data': { 'updateProperties': updateProperties, 'postParams': urls.postParams }, 'method': 'onExecuteSearch', 'type': 'global' });
                            conduit.tabs.updateWithPost(tabid, updateProperties, urls.postParams, $.noop);
                            onExecuteSearchUsageAndOtherStuff(query, sourceUsage, elementId, urls, data.windowId);
                        }
                    } else {
                        // execute the search in the selected tab in the last focused window
                        var updateProperties = {
                            'url':url
                        };

                        if (searchData.newTab) {
                            sourceUsage = 'SEARCH_SOURCE_ENGINES_MENU';
                            elementId = '1000236';

                            updateProperties.isSelected = true;
                            if (lastInfo.url) {
                                if (lastInfo.url && lastInfo.url !== null && lastInfo.url === url) {
                                    sdk.log.info({ 'text': 'do conduit.tabs.update 1', 'data': { 'updateProperties': updateProperties }, 'method': 'onExecuteSearch', 'type': 'global' });
                                    conduit.tabs.update(tabid, updateProperties, $.noop);
                                    onExecuteSearchUsageAndOtherStuff(query, sourceUsage, elementId, urls, data.windowId);
                                } else {
                                    sdk.log.info({ 'text': 'do conduit.tabs.create 1', 'data': { 'updateProperties': updateProperties }, 'method': 'onExecuteSearch', 'type': 'global' });
                                    conduit.tabs.create(updateProperties, $.noop);
                                    onExecuteSearchUsageAndOtherStuff(query, sourceUsage, elementId, urls, data.windowId);
                                }
                            } else {
                                sdk.log.info({ 'text': 'do conduit.tabs.create 2', 'data': { 'updateProperties': updateProperties }, 'method': 'onExecuteSearch', 'type': 'global' });
                                conduit.tabs.create(updateProperties, $.noop);
                                onExecuteSearchUsageAndOtherStuff(query, sourceUsage, elementId, urls, data.windowId);
                            }
                        } else {
                            sdk.log.info({ 'text': 'do conduit.tabs.update 2', 'data': { 'updateProperties': updateProperties }, 'method': 'onExecuteSearch', 'type': 'global' });
                            // Update the last focused tab url
                            conduit.tabs.update(tabid, updateProperties, $.noop);
                            onExecuteSearchUsageAndOtherStuff(query, sourceUsage, elementId, urls, data.windowId);
                        }
                    }
                });
            });
        });
    }

    function getShowDefaultFlag(engineSelectedData, result) {
        sdk.log.info({'data':{'engineSelectedData':engineSelectedData, 'result':result}, 'method':'getShowDefaultFlag', 'type':'global'});
        var ed = {};
        try {
            result = JSON.parse(result);
        }
        catch (e) {
            conduit.logging.logDebug('Search/bgpage.js/getShowDefaultFlag - received wrong result: ' + result);
        }

        state.selectedSearchEngine = engines[engineSelectedData.data.engineId];
        state.selectedSearchEngine.engineId=engineSelectedData.data.engineId;

        if (result.data === "true") {
            sdk.log.info({ 'text': 'postTopicMessage', 'data': { 'engineSelectedData_data': engineSelectedData.data }, 'method': 'getShowDefaultFlag', 'type': 'global' });
            sendTopic('engineSelected', JSON.stringify(engineSelectedData.data));
        } else {
            engines[defaultEngineId].viewId = engineSelectedData.data.viewId;
            sdk.log.info({ 'text': 'postTopicMessage', 'data': { 'engine_data': engines[defaultEngineId] }, 'method': 'getShowDefaultFlag', 'type': 'global' });
            sendTopic('engineSelected', JSON.stringify(engines[defaultEngineId]));
        }

        var executeSearchData = {
            'query':searchTermLive,
            'engine':state.selectedSearchEngine.engineId,
            'viewId':'',
            'newTab':!isTargetSelf,
            'sourceUsage':'SEARCH_SOURCE_ENGINES_MENU'
        };

        if (searchTermLive != '') {
            usage_flow['engine'] = {'progress':'finish'};
            onExecuteSearch(executeSearchData, executeSearchData.sourceUsage, '1000009');
        } else {
            commander.run('usage', {'flow':'engine', 'progress':'progress', usage:{'name':'SEARCHBOX_CHANGE_ENGINE'}});
            commander.run('usage', {'flow':'engine', 'progress':'submit'});
        }

    }


    function onEngineSelected(engineSelectedData) {
        sdk.log.info({'data':{'engineSelectedData':engineSelectedData}, 'method':'onEngineSelected', 'type':'global'});
        conduit.storage.global.keys.get(showDefaultFlag, function (result) {
            getShowDefaultFlag(engineSelectedData, result);
        }, function (e) {
            getShowDefaultFlag(engineSelectedData, '');
        });
    }

    var onClearHistory = function (result, sender, callback) {
        sdk.log.info({'data':{'result':result, 'sender':sender, 'callback':callback}, 'method':'onClearHistory', 'type':'global'});
        try {
            result = JSON.parse(result);
        }
        catch (e) {
            conduit.logging.logDebug('Search/bgpage.js/onClearHistory - received wrong result: ' + result);
        }

        if ((typeof(result) != "object") && ( result == null)) {
            sdk.log.info({'text':'invalid result type', 'data':{'result':result}, 'method':'onClearHistory', 'type':'global'});
            return;
        }

        if (!result.hasOwnProperty('term')) {
            sdk.log.info({'text':'term no exist in result obj', 'data':{'result':result}, 'method':'onClearHistory', 'type':'global'});
            return;
        }

        //sendTopic("clearHistory", "");
        cManger.removeAll();

        lastSearchTerm = result.term;
        searchTermLive = result.term;
        sendTopic('setEmbededTextBoxValue', result.term);
        commander.run('usage', {'flow':'history', 'progress':'progress', usage:{'name':'SEARCHBOX_CLEAR_HISTORY'}});
        commander.run('usage', {'flow':'history', 'progress':'submit'});
    };

    var onInfoItemSelected = function (data) {
        sdk.log.info({'data':{'data':data}, 'method':'onInfoItemSelected', 'type':'global'});

        try {
            data = JSON.parse(data);
        }
        catch (e) {
            conduit.logging.logDebug('Search/bgpage.js/listenerControllerFromEmmbedded - received wrong data: ' + data);
        }

        if ((typeof(data) != "object") && ( data == null)) {
            sdk.log.info({'text':'invalid data type', 'data':{'data':data}, 'method':'onInfoItemSelected', 'type':'global'});
            return;
        }

        if (data.hasOwnProperty('term')) {
            sendTopic('setEmbededTextBoxValue', data.term); //call to view.js
            cManger.update(data.term);
        }

        var executeSearchData = {
            'query':data.term, 'viewId':data.viewId, 'engine':data.engine, 'newTab':!isTargetSelf
        };

        if(data.hasOwnProperty('suggestTerm')){
            executeSearchData.suggest = data.suggestTerm;
        }

        if(data.hasOwnProperty('source')){
            executeSearchData.source = data.source;
        }

        onExecuteSearch(executeSearchData, data.source, '1000009');
        commander.run('usage', {'flow':'history', 'progress':'clear'});
    }

    var onInfoItemRemoved = function (data, sender, callback) {
        sdk.log.info({'data':{'data':data, 'sender':sender, 'callback':callback}, 'method':'onInfoItemRemoved', 'type':'global'});
        cManger.remove(data.term);

        callback('');
    };

    var onSearchGetTerm = function (data, sender, callback) {
        sdk.log.info({'data':{'data':data, 'sender':sender, 'callback':callback}, 'method':'onSearchGetTerm', 'type':'global'});
        if (!searchTermLive || typeof (searchTermLive) === 'undefined') {
            searchTermLive = "";
        }

        callback(searchTermLive);
    }

    var getLastSearchSettings = function (result, sender, callback) {
        sdk.log.info({'data':{'result':result, 'sender':sender, 'callback':callback}, 'method':'getLastSearchSettings', 'type':'global'});
        conduit.tabs.getSelected(function (tabResult) {
            if (typeof (searchViewSettings) === 'object') {
                /*if (historyClear === true) {
                 searchViewSettings.searchTextBoxValue = '';
                 }*/
                callback(searchViewSettings);
            } else if (!searchViewSettings) {
                retrieveStorageItem("searchViewSettings", function (result) {
                    if (result) {
                        if (typeof result == "object") {
                            /*if (historyClear === true) {
                             result.searchTextBoxValue = '';
                             }*/
                            callback(result);
                        } else {
                            result = JSON.parse(result);
                            /*if (historyClear === true) {
                             result.searchTextBoxValue = '';
                             }*/
                            callback(result);
                        }
                    }

                    var data = {};
                    data.tabId = tabResult.tabId;
                    /*if (historyClear === true) {
                     data.searchTextBoxValue = '';
                     } else {*/
                    data.searchTextBoxValue = searchTermLive;
                    //}
                    callback(data);
                }, function (e) {
                    var data = {};
                    data.tabId = tabResult.tabId;
                    /*if (historyClear === true) {
                     data.searchTextBoxValue = '';
                     } else {*/
                    data.searchTextBoxValue = searchTermLive;
                    //}
                    callback(data);
                });
            }
        });
    };

    var getLastSearchValue = function (result, sender, callback) {
        sdk.log.info({'data':{'result':result, 'sender':sender, 'callback':callback}, 'method':'getLastSearchValue', 'type':'global'});
        var response = null;

        if (lastSearchTerm !== null && lastSearchTerm.length > 0) {
            response = { textBoxValue:lastSearchTerm };
        } else {
            response = { textBoxValue:'' };
        }

        callback(response);
    }

    var getSelectedEngine = function (result, sender, callback) {
        sdk.log.info({'data':{'result':result, 'sender':sender, 'callback':callback}, 'method':'getSelectedEngine', 'type':'global'});
        var responseEngineId = null;

        if (state && state.selectedSearchEngine) {
            responseEngineId = state.selectedSearchEngine.uniqueCompId;
        } else {
            responseEngineId = defaultEngineId;
        }

        if (!responseEngineId) {
            retrieveStorageItem(selectedEngineIdStorageKey, function (selectedEngineId) {
                callback({ engineId:selectedEngineId });
            }, function (e) {
                callback({ engineId:'' });
            });
        } else {
            callback({ engineId:responseEngineId });
        }
    }

    var menus = {};
    var onMenuOpen = function (menuId, sender, callback) {
        sdk.log.info({'data':{'menuId':menuId, 'sender':sender, 'callback':callback}, 'method':'onMenuOpen', 'type':'global'});
        if (!menus['menu' + menuId]) {
            menus['menu' + menuId] = true;
            conduit.app.menu.onCommand.addListener(menuId, onEngineSelected);
        }
        if (callback) {
            callback()
        }
    }

    var usage_flow = {};

    var onUsage = function (data, sender, callback) {
        sdk.log.info({'data':{'data':data, 'sender':sender, 'callback':callback}, 'method':'onUsage', 'type':'global'});
        var flow = data.flow;
        var progress = data.progress;
        if (progress != 'submit') {
            usage_flow[flow] = data;
        } else if (progress == 'clear') {
            delete usage_flow[flow];
        } else if (usage_flow[flow]
            && usage_flow[flow].usage
            && usage_flow[flow].usage.name) {

            conduit.logging.usage.log(usage_flow[flow].usage.name, usage_flow[flow].usage.details);
            delete usage_flow[flow];
        }

        callback({'result':true, 'text':'', 'data':{}});
        return true;
    };

    function Commander() {
        var pool = {};
        var add = function (name, f) {
            sdk.log.info({'data':{'name':name, 'f':typeof f}, 'method':'add', 'type':'Commander'});
            if (typeof f != 'function') {
                return false;
            }
            pool['cmd_' + name] = f;
        }
        var del = function (name) {
            sdk.log.info({'data':{'name':name}, 'method':'Commander/del', 'type':'global'});
            delete pool['cmd_' + name];
        }
        var run = function (name, data, sender, callback) {
            sdk.log.info({'data':{'name':name, 'data':data, 'sender':sender, 'callback': typeof callback}, 'method':'run', 'type':'Commander'});

            var runCallback=function(data){
                sdk.log.info({'data':{'name':name, 'data':data},'method':'run / callback', 'type':'Commander'});
                callback && callback(JSON.stringify(data));
            }

            pool['cmd_' + name] && pool['cmd_' + name](data, sender, runCallback);
        }
        var hasCommand = function (name) {
            sdk.log.info({'data':{'name':name}, 'method':'hasCommand', 'type':'Commander'});
            return !!pool['cmd_' + name];

        }

        var handler = function (command, sender, callback) {
            sdk.log.info({'data':{'command':command, 'sender':sender, 'callback':typeof callback}, 'method':'handler', 'type':'Commander'});
            var finish = function (data) {
                callback && callback(JSON.stringify(data));
            };

            if (typeof command == 'string') {
                try {
                    command = JSON.parse(command);
                }
                catch (e) {
                    conduit.logging.logDebug('Search/bgpage.js/Commander/handler - received wrong command: ' + command);
                    command = null;
                }
            }
            if (!command) {
                finish({'result':false, 'text':'command must be a stringified object', 'data':{'command':command}});
            }

            if (hasCommand(command.name)) {
                try {
                    run(command.name, command.data, sender, callback)
                } catch (ex) {
                    finish({'result':false, 'text':'command cause to Exception', 'data':{'command':command, 'exception':ex}});
                }
            } else {
                finish({'result':false, 'text':'command not supported', 'data':{'command':command}});
            }
        };

        return{
            "onCommand":function (command, sender, callback) {
                handler(command, sender, callback);
            }, "add":function (name, f) {
                return add(name, f);
            }, "del":function (name) {
                del(name);
            }, "run":function (name, data, sender, callback) {
                run(name, data, sender, callback);
            }
        };
    }

    var listenerControllerFromEmmbedded = function (data, sender, callback) {
        sdk.log.info({'data':{'arguments':arguments}, 'method':'listenerControllerFromEmmbedded', 'type':'global'});
        if (!data) {
            return;
        }

        // wrapping the callback with function that stringify the parameter if he is an object
        function cb(param) {
            if (typeof (param) === 'object') {
                param = JSON.stringify(param);
            }
            callback(param);
        }

        try {
            data = JSON.parse(data);
        }
        catch (e) {
            conduit.logging.logDebug('Search/bgpage.js/listenerControllerFromEmmbedded - received wrong data: ' + data);
        }
        switch (data.logicalSender) {
            case "getLastSearchSettings":
                getLastSearchSettings(data.result, sender, cb);
                break;
            case "executeSearch":
                onExecuteSearch(data.result, data.result.sourceUsage, '1000009');
                if (callback) {
                    callback()
                }
                break;
            case "initLastSearchSettings":
                initLastSearchSettings(data.result, sender, cb);
                break;
            case "updateLiveSearchTerm":
                updateLiveSearchTerm(data.result, sender, cb);
                break;
            case "onUpdateSearchSettings":
                saveLastSearchSettings(data.result, sender, cb);
                break;
            case "getSelectedEngine":
                getSelectedEngine(data.reslut, sender, cb);
                break;
            case "getLastSearchValue":
                getLastSearchValue(data.reslut, sender, cb);
                break;

            case "onMenuOpen":
                onMenuOpen(data.result, sender, cb);
                break
        }
    }

    function initApiEvents() {
        sdk.log.info({'method':'initApiEvents', 'type':'global'});
        retrieveStorageItem("searchViewSettings", function (result) {
            if (result) {
                removeStorageItem("searchViewSettings");
            }
        });
        getGlobalKey(ENABLE_RETURN_WEB_SEARCH_ON_THE_PAGE, function (result) {

            if (typeof result == "object") {
                return;
            }
            if (!result) {
                setGlobalKey(ENABLE_RETURN_WEB_SEARCH_ON_THE_PAGE, '{"dataType":"string","data":"true"}');
            }
        }, function (e) {
            setGlobalKey(ENABLE_RETURN_WEB_SEARCH_ON_THE_PAGE, '{"dataType":"string","data":"true"}');
        });
        getGlobalKey(ENABALE_HISTORY, function (result) {

            sdk.log.info({'data':{'result':result}, 'method':'ENABALE_HISTORY', 'type':'getGlobalKey'});
            try {
                result = JSON.parse(result);
            }
            catch (e) {
                conduit.logging.logDebug('Search/bgpage.js/initApiEvents - received wrong result: ' + result);
            }

            if ((typeof(result) != "object") && ( result == null)) {
                return;
            }

            if (!result.hasOwnProperty('data')) {
                return;
            }

            bEnableHistory = result.data;

        }, function (e) {
            sdk.log.warning({'text':'Failed to retrieve global key', 'data':{'ENABALE_HISTORY':ENABALE_HISTORY, 'error':e}, 'method':'initApiEvents/getGlobalKey', 'type':'global'});
        });

        addAdvanceTopicListener('update_search_options', function () {
            sdk.log.info({'method':'update_search_options', 'type':'update_search_options'});

            getGlobalKey(ENABALE_HISTORY, function (result) {
                sdk.log.info({'data':{'result':result}, 'method':'getGlobalKey', 'type':'update_search_options'});

                var data = {
                    history:{
                        enable:false
                    }
                };

                if (typeof(result) != "object" && result == null) {
                    sdk.log.info({'text':'invalid result obj', data:{'result':result}, 'method':'getGlobalKey', 'type':'update_search_options'});
                    return;
                }
                if (typeof(result) == "string") {
                    try {
                        result = JSON.parse(result);
                    } catch (ex) {
                        sdk.log.info({data:{'ex':ex}, 'method':'getGlobalKey', 'type':'update_search_options'});
                        return sdk.data.getDataset();
                    }
                }

                if (result && result.data) {

                    data.history.enable= result.data;
                }

                cManger.setProviderConfig(data);
            });
        });


        addListener("command", commander.onCommand);
        addListener("actionFromEmbdded", listenerControllerFromEmmbedded);
        addExternalListener("clearHistory", function(){
            var item = {"term":""}
            onClearHistory(item);
        });
        addListener("content-manager:content", function (data, sender, callback) {
            var q = data;

            cManger.select(q, function(data){callback(JSON.stringify(data))});
        });

        addAdvanceTopicListener('conduit-toolbar-view-layout-change', function (event_data) {
            var width=undefined;
            event_data = JSON.parseSafe(event_data, undefined);
            if(event_data && event_data.data && event_data.data.width){
                width = event_data.data.width;
            }
            function hasWidth(user_settings){
                return (user_settings
                    && user_settings.ui
                    && user_settings.ui.splitter
                    && user_settings.ui.splitter.width);
            }

            conduit.storage.app.items.get('search.user-settings',function(settings){
                settings = JSON.parseSafe(settings, undefined);
                if (!hasWidth(settings)){
                    conduit.storage.app.items.get('search.ft-settings',function(settings){
                        settings = JSON.parseSafe(settings,undefined);
                        if(!hasWidth(settings)){
                            handleSplitterChange(width, 0);
                            return;
                        }
                        handleSplitterChange(width, settings.ui.splitter.width);
                    },function(err){
                        handleSplitterChange(width, 0);
                    });
                    return;
                }
                handleSplitterChange(width, settings.ui.splitter.width);
            },function(err){
                conduit.storage.app.items.get('search.ft-settings',function(settings){
                    settings = JSON.parseSafe(settings,undefined);
                    if(hasWidth(settings)){
                        handleSplitterChange(width, 0);
                        return;
                    }
                    handleSplitterChange(width, settings.ui.splitter.width);
                },function(err){
                    handleSplitterChange(width, 0);
                });
            });

        });

        addAdvanceRequestListener("searchGetTerm",onSearchGetTerm);
        commander.add('usage', onUsage);
        commander.add('infoItemRemoved', onInfoItemRemoved);
        commander.add('infoItemSelected', onInfoItemSelected);
        commander.add('history-clear-all', onClearHistory);
        commander.add('searchGetTerm', onSearchGetTerm);
        commander.add('view-ready', onViewReady);


    }
    function handleSplitterChange(current,previous){
        var settings={ui:{splitter:{width:0}}};
        var additionalUsageInfo = {
            sourceCompType: 'toolbar.splitters-search.mouseup',
            gadgetType: "SPLITTER",
            usageType: 'sendToolbarUsage'
            , "widthOld": previous
            , "widthNew": current

        };
        conduit.logging.usage.log('SEARCHBOX_RESIZE_BOX', additionalUsageInfo);
        settings.ui.splitter.width=current;
        conduit.storage.app.items.set('search.user-settings', JSON.stringify(settings));
    }

    var setSearchSetting = function(data){
        sdk.log.info({'data':{'data':data},'method':'setSearchSetting', 'type':'global'});
        if(data.errorMessage){
            sdk.log.info({'text':'getting invalid data','data':{'data':data},'method':'setSearchSetting', 'type':'global'});
            return false;
        }

        function isEmpty(obj) {
            for(var prop in obj) {
                if(obj.hasOwnProperty(prop))
                    return false;
            }
            return true;
        }


        if(data ==  undefined || typeof(data) != "object" || data == null || isEmpty(data)){
            data = configSearchApi;
        }

        config={
            suggest:{
                enable:data.ToolbarSearchBox.Suggest.IsEnabled,
                provider:(data.ToolbarSearchBox.Suggest.SuggestUrl.toString() != '')?data.ToolbarSearchBox.Suggest.SuggestFormat:"Object",
                url:(data.ToolbarSearchBox.Suggest.SuggestUrl.toString() != '')?data.ToolbarSearchBox.Suggest.SuggestUrl:'http://suggest.search.conduit.com/suggest.ashx?n=10&q=UCM_SEARCH_TERM&p=conduit&callback=acp_new&l=en&c=IL',
                amount:data.ToolbarSearchBox.Suggest.MaxAmount,
                position:data.ToolbarSearchBox.Suggest.Position,
                view:{
                    label:{
                        text:data.ToolbarSearchBox.Suggest.Label.Text,
                        direction:data.ToolbarSearchBox.AdditionalParams.SuggestLabelPosition,
                        style:data.ToolbarSearchBox.AdditionalParams.SuggestStyle,
                        //class:(data.ProviderId == 1)?'googleSuggest':'providerSuggest'
                        class:data.ToolbarSearchBox.AdditionalParams.SuggestClass
                    }
                }
            },
            history:{
                enable:(bEnableHistory.toString() == 'true')?data.ToolbarSearchBox.History.IsEnabled:bEnableHistory,
                amount:data.ToolbarSearchBox.History.MaxAmount,
                position:data.ToolbarSearchBox.History.Position,
                view:{
                    label:{
                        text:data.ToolbarSearchBox.History.Label.Text,
                        direction:data.ToolbarSearchBox.AdditionalParams.HistoryLabelPosition,
                        style:data.ToolbarSearchBox.AdditionalParams.HistoryStyle,
                        //class:(data.ProviderId == 1)?'googleHistory':'providerHistory'
                        class:data.ToolbarSearchBox.AdditionalParams.HistoryClass
                    }
                }
            },
            additionalParams:{
                displayLabel:data.ToolbarSearchBox.AdditionalParams.DisplayLabel,
                //separator:(data.ProviderId == 1)?true:false
                maxDisplayResult:data.ToolbarSearchBox.AdditionalParams.MaxDisplayResult
            },
            dir:data.isRtl ?'rtl':'ltr',
            searchResultsUrl:data.ToolbarSearchBox.Suggest.SearchResultsUrl,
            searchUrl:data.ToolbarSearchBox.SearchUrl,
            emptySearchUrl:data.ToolbarSearchBox.EmptySearchUrl

        };

        cManger.setProviderConfig(config);

        conduit.app.getSettingsData(handleSettings);
    }

    function init() {
        sdk.log.info({'method':'init', 'type':'global'});

        commander = Commander();

        cManger = new ContentManager({"store":{'load':conduit.storage.app.items.get,
            'save':conduit.storage.app.items.set}});

        searchAPI.onChange.addListener(setSearchSetting);
        searchAPI.getData(setSearchSetting);

        fetchDictionary(function (data) {
            transObj.appSearch = data.CTLP_STR_ID_MYSTUFF_SEARCH_ENGINE_CAPTION;
        });

        updateSearchKeyCount(true);

        getContextData();

        initApiEvents();

        conduit.advanced.messaging.postTopicMessage("onSearchTextChanged", ""); //call to view.js

        conduit.advanced.getUserId(getUserId, function (err) { });

        sendReady();
    }

    var sendReady = function(){
        sdk.log.info({'method':'sendReady', 'type':'global'});
        postTopicMessage('onAppReady', '');
    };

    var onViewReady = function (result, sender, callback) {
        sdk.log.info({'method':'onViewReady', 'type':'global'});
        sendReady();
    };


    var handShakeState = false;

    $(document).ready(function () {
        sdk.log.info({'method':'(document).ready', 'type':'global'});
        init();
    });
})();
