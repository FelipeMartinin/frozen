
var notifications = function () {
    var log_item_type = 'notifications';

    //GLOBAL VARIABLES
    var channelsArr = [];  //array of all channels in toolbar
    var ToolbarAlertsInfoUrl;
    var alertLoginUrl;
    var VERSION;
    var TOOLBAR_NAME;
    var TOOLBAR_LOGO;

    //CONSTANS

    var minute = 60 * 1000;
    var channelsDefaultInteval = 1440;
    var feedsDefaultInterval = 5;
    var timeOut;
    var MONITOR_NOTIFICATION_QUEUE_INTERVAL = 30 * 1000;
    var firstLoad = true;
    var myGlobalUserId;
    var notificationsToShowKeyName = 'NotificationsToShow_';

    var servicemapService = new ServiceMapService();
    var repository = AlertsRepository();
    var channelServices = [];

    //Gets xml node and returns the node text content for all browsers.
    function getXmlNode(item) {
        if (typeof item != 'undefined') {
            return item.textContent || item.text || '';
        }
        return undefined;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    //                                SERVICES AND USAGE FUNCTIONS                              //
    //////////////////////////////////////////////////////////////////////////////////////////////

    //Sends login usage with the toolbar's channelId.
    function sendAlertLoginRequest() {
        sdk.log.info({ 'method': 'sendAlertLoginRequest', 'type': log_item_type });
        var alertLoginReq;
        alertLoginReq = "<ALERT_XML>";
        alertLoginReq += "<TYPE>ALERT_LOGIN</TYPE>";
        alertLoginReq += "<MESSAGE>";
        alertLoginReq += "<LUT>0</LUT>";
        alertLoginReq += "<USER_ID>" + myGlobalUserId + "</USER_ID>";
        alertLoginReq += "<USER_ALERTS_STATUS>ENABLED</USER_ALERTS_STATUS>";
        alertLoginReq += "<VERSION>" + VERSION + "</VERSION>";
        alertLoginReq += "<CHANNELS>";
        alertLoginReq += "<ID>" + channelsArr[0].channelId + "</ID>";
        alertLoginReq += "</CHANNELS>";
        alertLoginReq += "</MESSAGE>";
        alertLoginReq += "</ALERT_XML>";

        var alertLoginObj = {
            url: alertLoginUrl + "?alertLoginRequestXml=" + alertLoginReq
        };
        sdk.log.info({ 'data': alertLoginObj, 'method': 'sendAlertLoginRequest/request login', 'type': log_item_type });
        conduit.network.httpRequest(alertLoginObj, function (data) {
            sdk.log.info({ 'data': { 'data': data }, 'method': 'sendAlertLoginRequest/httpRequest', 'type': log_item_type });
            var alertLogin = {
                reload_interval_sec: servicemapService.service("Login").reload_interval_sec,
                reload_interval: servicemapService.service("Login").reload_interval_sec * 1000,
                timeStamp: +new Date()
            };

            conduit.storage.app.items.set("alert_login_service", JSON.stringify(alertLogin));

            //Send a login usage every reload_interval_sec
            setTimeout(sendAlertLoginRequest, alertLogin.reload_interval);
        }, function () {
            setTimeout(sendAlertLoginRequest, 30000);
        });
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    //                                WEBAPP LOGIC FUNCTIONS                                    //
    //////////////////////////////////////////////////////////////////////////////////////////////

    //Extracts the given feed items from the xml
    function extractFeedItems(feedId, channelId, xmlDoc) {
        sdk.log.info({ 'data': { 'feedId': feedId, 'channelId': channelId, 'xmlDoc': xmlDoc }, 'method': 'extractFeedItems', 'type': log_item_type });
        var title = getXmlNode(xmlDoc.getElementsByTagName("title")[0]),
            feedItems = xmlDoc.getElementsByTagName("item"),
            guid,
            feed,
            tmpNewItemsArray = [];

        for (var i = 0; i < feedItems.length; i++) {
            guid = getXmlNode(feedItems[i].childNodes[3]);

            feed = {
                id: feedId,
                channelId: channelId,
                title: title,
                imageurl: getXmlNode(xmlDoc.getElementsByTagName("url")[0]),
                itemNotificationUrl: getXmlNode(feedItems[i].childNodes[5]),
                guid: guid,
                version: VERSION,
                timeStamp: (new Date(getXmlNode(feedItems[i].childNodes[4]))).getTime()
            };

            var itemHandler = (function (feed, lastItem) {
                return function (data) {
                    sdk.log.info({ 'data': { 'data': data, 'feed': feed, 'lastItem': lastItem }, 'method': 'itemHandler', 'type': log_item_type });
                    data = JSON.parseSafe(data, [], function () {
                        conduit.logging.logDebug('notificationApp/notification.js/itemHandler - received wrong data: ' + data);
                    });

                    if (data.length != 0 && !data.errorCode) {  //if the notification is already in the repository
                        data = (typeof (data) === 'string') ? JSON.parse(data) : data;
                        if (!data.viewed) {  //it was not viewed yet
                            feed.timeStamp = data.timeStamp;  //Take the original timestamp
                            tmpNewItemsArray.push(feed);
                        }
                        else {  //it was viewed
                            //Do nothing - it's already in the history file
                        }
                    }
                    else {  //the notification is not in the repository - show it
                        tmpNewItemsArray.push(feed);
                    }

                    if (lastItem) {  //last item calls the function that adds all the new notificaions
                        if (tmpNewItemsArray.length > 0)
                            addNewNotification(tmpNewItemsArray);
                    }
                }
            })(feed, (i === feedItems.length - 1));  //send boolean if its the last item

            conduit.storage.global.items.get(channelId + "_" + feedId + "_" + guid, itemHandler, itemHandler);
        }
    }

    function extractFeedItems2(dataset) {
        sdk.log.info({ 'data': { 'dataset': dataset }, 'method': 'extractFeedItems2', 'type': log_item_type });
        var requestPool = {};
        var feedItems = [];
        var stringToXML=sdk.xml.document;
        function ConvertFromAppServerChars(str) {
            if (!str) return;
            str = str.replace(/&lt;/g, "<");
            str = str.replace(/&gt;/g, ">");
            str = str.replace(/&apos;/g, "'");
            return str;
        }
        var setCustomCPNotification = function (item) {
            var url = item.content.url;
            if(!url){ return; }


            var paramIndex = url.indexOf('ConduitParameters');
            if(paramIndex<0){
                return;
            }

            var XMLParametersString = ConvertFromAppServerChars(url.substring(paramIndex + 18));
            var XML_parameters = stringToXML(XMLParametersString);

            var logo = sdk.xml.innerText(XML_parameters.getElementsByTagName("Logo")[0]);
            if (logo == null && XML_parameters.getElementsByTagName("Logo").length > 0) { //logo should be empty
                logo = "";
            }

            var title = sdk.xml.innerText(XML_parameters.getElementsByTagName("NotifTitle")[0]);
            if (title == null && XML_parameters.getElementsByTagName("NotifTitle").length > 0) { //title should be empty
                title = "";
            }

            var customObject = {
                "size": {
                    "width": sdk.xml.innerText(XML_parameters.getElementsByTagName("Width")[0]),
                    "height": sdk.xml.innerText(XML_parameters.getElementsByTagName("Height")[0])
                },
                "colors": {
                    "bgColor": sdk.xml.innerText(XML_parameters.getElementsByTagName("BGColor")[0]),
                    "headerTextColor": sdk.xml.innerText(XML_parameters.getElementsByTagName("HeaderTextColor")[0])
                },
                "analytics": {
                    "GA_Code": sdk.xml.innerText(XML_parameters.getElementsByTagName("GACode")[0]),
                    "Category": sdk.xml.innerText(XML_parameters.getElementsByTagName("GACategory")[0])
                },
                //0-server, 1- PublisherProvidedLink, 2-PublisherProvidedHtml
                'htmlCreator': parseInt(sdk.xml.innerText(XML_parameters.getElementsByTagName("HtmlCreator")[0]))
            }
            item.customItemNotification = JSON.stringify(customObject);
            item.customLogo = logo;
            item.customTitle = title;

        };

        var updateProgress = function (item) {
            var key = item.channelId + "_" + item.id + "_" + item.guid;
            delete requestPool[key];
            for (var k in requestPool) {
                return;
            }
            if (!feedItems.length) {
                return;
            }
            addNewNotification(feedItems);
        };
        forEachIn(dataset, function (channel) {
            forEachIn(channel.feeds, function (feed) {
                forEachIn(feed.items, function (item) {
                    setCustomCPNotification(item);
                    var logo, title;
                    if (item.customItemNotification) {
                        if (typeof (item.customLogo) == 'string') {
                            logo = item.customLogo;
                        }
                        else {
                            logo = item.content.url;
                        }

                        if (typeof (item.customTitle) == 'string') {
                            title = item.customTitle;
                        }
                        else {
                            title = feed.title;
                        }
                    }
                    var mainUrl = item.content.url;
                    var index = item.content.url.indexOf('ConduitParameters');
                    //'?' or '&' before 'ConduitParameters'
                    if (index != -1) {
                        mainUrl = item.content.url.substring(0, index - 1);
                    }

                    var feedDataObject = {
                        'id': feed.id,
                        'channelId': channel.id,
                        'title': title,
                        'imageurl': logo,
                        'itemNotificationUrl': mainUrl,
                        'itemNotification': item.customItemNotification,
                        'guid': item.guid,
                        'version': VERSION,
                        'timeStamp': item.pubdate
                    };

                    var itemHandler = (function (feed) {
                        return function (data) {
                            sdk.log.info({ 'data': { 'data': data, 'feed': feed }, 'method': 'extractFeedItems2/itemHandler', 'type': log_item_type });
                            data = JSON.parseSafe(data, {}, function () {
                                sdk.log.warning('notificationApp/notification.js/itemHandler - received wrong data: ', data);
                            });

                            if (data.viewed) {  //it was viewed yet
                                sdk.log.info({ 'text': 'omit item: already viewed', 'data': { 'data': data }, 'method': 'extractFeedItems2/itemHandler', 'type': log_item_type });
                                updateProgress(feed);
                                return;
                            }
                            feed.timeStamp = data.timeStamp;  //Take the original timestamp
                            feedItems.push(feed);
                            updateProgress(feed);
                        }
                    })(feedDataObject);  //send boolean if its the last item
                    requestPool[channel.id + "_" + feed.id + "_" + item.guid] = true;
                    conduit.storage.global.items.get(channel.id + "_" + feed.id + "_" + item.guid
                        , itemHandler
                        , function (feed) {
                            return function (err) {
                                feedItems.push(feed);
                                updateProgress(feed);
                            };
                        } (feedDataObject));
                });
            });
        });
    }

    function updateNotificationToShow(savedData, feedsArray, callback) {
        sdk.log.info({ 'data': { 'savedData': savedData, 'feedsArray': feedsArray }, 'method': 'updateNotificationToShow', 'type': log_item_type });
        var feedUpdate = [];
        for (var i = 0; i < feedsArray.length; i++) {
            var item = feedsArray[i];
            var isnew = true;
            for (var k = 0; k < savedData.length && isnew; k++) {
                if (item.guid == savedData[k].guid) {
                    sdk.log.info({ 'text': 'item already in pool omit', 'data': { 'updateItem': item, 'storeItem': savedData[i], 'savedData': savedData, 'feedsArray': feedsArray }, 'method': 'updateNotificationToShow', 'type': log_item_type });
                    isnew = false;
                }
            }
            feedUpdate.push(item);
            if (!isnew) {
                continue;
            }
            savedData.push(item);
            sdk.log.info({ 'text': 'item added', 'data': { 'updateItem': item, 'savedData': savedData, 'feedsArray': feedsArray }, 'method': 'updateNotificationToShow', 'type': log_item_type });
        } //for

        conduit.storage.global.items.set(notificationsToShowKeyName + feedsArray[0].channelId, JSON.stringify(savedData), function () {
            notificationUIManager.putNotificationInQueue(feedUpdate);
            if (typeof callback === 'function') {
                callback(feedsArray[0]);  //Assumption - all the items in array are from the same channel - so we can send only the first one
            }
        },
          function (ex) { sdk.log.error({ 'text': 'fail to store data', 'data': { 'key': notificationsToShowKeyName + feedsArray[0].channelId, 'ex': ex, 'savedData': savedData }, 'method': 'updateNotificationToShow', 'type': log_item_type }); });
    }

    //Creates notification data file and adds reference in notificationsToShow.
    function addNewNotification(feedsArray, callback) {
        sdk.log.info({ 'data': { 'feedsArray': feedsArray }, 'method': 'addNewNotification', 'type': log_item_type });
        var fileName,
            feedObject;

        if (!feedsArray.length) {
            feedsArray = [feedsArray];
        }

        for (var i = 0; i < feedsArray.length; i++) {
            feedObject = feedsArray[i];
            fileName = feedObject.channelId + "_" + feedObject.id + "_" + feedObject.guid;

            //Extend the item object
            feedObject.fileName = feedObject.fileName || fileName;
            feedObject.itemNotification = feedObject.itemNotification || '';  //notifications from the API use this attribute, notifications from CP don't

            //Save the item data in a file
            conduit.storage.global.items.set(fileName, JSON.stringify(feedObject));
        }

        //Update the notificationsToShow key (read key, add new item, write key)
        conduit.storage.global.items.get(notificationsToShowKeyName + feedsArray[0].channelId, function (savedData) {
            if (savedData) {  //Key exists
                savedData = (typeof savedData === 'string') ? JSON.parse(savedData) : savedData;
            }
            else {
                savedData = [];
            }

            updateNotificationToShow(savedData, feedsArray, callback);
        }, function (e) {
            savedData = [];
            updateNotificationToShow(savedData, feedsArray, callback);
        });
    }
    //TODO: delete it
    //Gets an xml document and looks for fees per channel.
    //[xmldoc]:(xmldocument) list of channels and feeds list for each channel.
    //[externalcall]:(bool) give an inidication if the call was from inside the function or from external function;
    function readFeeds(xmlDoc, externalCall) {
        sdk.log.info({ 'data': { 'xmlDoc': xmlDoc, 'externalCall': externalCall }, 'method': 'readFeeds', 'type': log_item_type });

        var channelArr = xmlDoc.getElementsByTagName("CHANNEL"),
            feed,
            feedsArr = xmlDoc.getElementsByTagName("FEEDS"),
            id,
            channelId,
            url,
            feedsInterval;

        for (var i = 0; i < feedsArr.length; i++) {
            channelId = getXmlNode(channelArr[0].getElementsByTagName("ID")[0]);

            id = getXmlNode(feedsArr[i].getElementsByTagName("FEED")[i].getElementsByTagName("ID")[0]);
            url = { "url": getXmlNode(feedsArr[i].getElementsByTagName("FEED")[i].getElementsByTagName("URL")[0]) };
            feedsInterval = getXmlNode(feedsArr[i].getElementsByTagName("FEED")[i].getElementsByTagName("INTERVAL")[0]);

            if (isNaN(feedsInterval) || !feedsInterval || feedsInterval < 1) {
                feedsInterval = feedsDefaultInterval;
            }

            feedsInterval = feedsInterval * minute;

            if (!externalCall || (externalCall && !timeOut)) {
                conduit.network.httpRequest(url, function (data) {
                    sdk.log.info({ 'data': { 'data': data }, 'method': 'readFeeds/httpRequest', 'type': log_item_type });
                    if (!data) return;
                    var doc = stringToXML(data);
                    extractFeedItems(id, channelId, doc);
                    timeOut = setTimeout(function () {
                        readFeeds(xmlDoc)
                    }, feedsInterval);
                });
            }
        }
    }
    //TODO: delete it
    function doLoginRequest() {
        sdk.log.info({ 'method': 'doLoginRequest', 'type': log_item_type });
        firstLoad = false;
        //check when is the next call for login service.
        conduit.storage.app.items.get("alert_login_service", function (data) {
            data = JSON.parseSafe(data, null, function () {
                conduit.logging.logDebug('notificationApp/notification.js/doLoginRequest - received wrong data: ' + data);
            });

            var timePassed = data ? (+new Date()) - data.timeStamp : 0;
            if (!data || timePassed > data.reload_interval) {
                sendAlertLoginRequest();
            }
            else {
                setTimeout(sendAlertLoginRequest, (data.reload_interval - timePassed));
            }
        }, function (e) {
            sendAlertLoginRequest();
        });
    }
    //TODO: delete it
    function saveChannelSettings() {
        sdk.log.info({ 'method': 'saveChannelSettings', 'type': log_item_type });
        for (var i = 0; i < channelsArr.length; i++) {
            var url = ToolbarAlertsInfoUrl.split('=')[0] + '=' + channelsArr[i].channelId;
            //create http request - returns channel settings
            sdk.log.info({ 'text': 'request channel info', 'data': { 'url': url }, 'method': 'saveChannelSettings', 'type': log_item_type });
            conduit.network.httpRequest({ 'url': url, 'method': 'POST' }, function (data) {
                sdk.log.info({ 'data': { 'data': data }, 'method': 'saveChannelSettings/httpRequest', 'type': log_item_type });
                if (!data || typeof (data) != 'string') return;
                //save channels settings
                conduit.storage.global.items.set("AlertsInfoData", data);

                var doc = stringToXML(data);
                var channelInterval = (getXmlNode(doc.getElementsByTagName("INTERVAL")[0]));
                if (isNaN(channelInterval) || !channelInterval || channelInterval < 1) {
                    channelInterval = channelsDefaultInteval;
                }

                conduit.storage.global.items.set("AlertService"
                    , JSON.stringify({
                        'timeStamp': +new Date(), 'reload_interval_sec': channelInterval * 60
                    }
                    ));
                setTimeout(function () {
                    getToolbarAlertsInfo();
                }, channelInterval * minute);
                readFeeds(doc, true);
            });
        }
    }
    //TODO: delete it
    function getChannelSettings(alertServiceSettings, timePassed, alertsInfoData) {
        sdk.log.info({ 'data': { 'data': alertServiceSettings, 'timePassed': timePassed, 'alertsInfoData': alertsInfoData }, 'method': 'getChannelSettings', 'type': log_item_type });
        alertServiceSettings = JSON.parseSafe(alertServiceSettings, null, function () {
            conduit.logging.logDebug('notificationApp/notification.js/getChannelSettings - received wrong data: ' + alertServiceSettings);
        });

        if (!alertServiceSettings) {
            return;
        }

        var doc = stringToXML(alertsInfoData);
        var channelInterval = alertServiceSettings.reload_interval_sec
            ? (alertServiceSettings.reload_interval_sec * 1000 - timePassed)
            : (channelsDefaultInteval * minute);
        setTimeout(function () {
            getToolbarAlertsInfo();
        }, channelInterval);
        readFeeds(doc, true);
    }
    //TODO: delete it
    //Checks for new channels or changed channels every x time (x = interval from channel settings).
    function getToolbarAlertsInfo() {
        sdk.log.info({ 'method': 'getToolbarAlertsInfo', 'type': log_item_type });
        if (firstLoad) {
            doLoginRequest();
        }

        //check if need to go and get channels setting file, if file not exist - create file and save!
        conduit.storage.global.items.get("AlertService", function (alertServiceSettings) {
            sdk.log.info({ 'data': { 'alertServiceSettings': alertServiceSettings }, 'method': 'getToolbarAlertsInfo/storage.get[AlertService]', 'type': log_item_type });
            alertServiceSettings = JSON.parseSafe(alertServiceSettings, null, function () {
                conduit.logging.logDebug('notificationApp/notification.js/getToolbarAlertsInfo - received wrong data: ' + alertServiceSettings);
            });

            var timePassed = alertServiceSettings ? (+new Date()) - alertServiceSettings.timeStamp : 0;

            //check if need to go and get channels settings.
            if (!alertServiceSettings || timePassed > alertServiceSettings.reload_interval_sec * 1000) {
                saveChannelSettings();
            } else {
                //set time out - recursive call to function to get channel settings
                conduit.storage.global.items.get("AlertsInfoData", function (AlertsInfoData) {
                    getChannelSettings(alertServiceSettings, timePassed, AlertsInfoData);
                }, function (e) {
                    getChannelSettings(alertServiceSettings, timePassed, '');
                });
            }
        }, function (e) {
            saveChannelSettings();
        });
    }

    //Adds the channel to the channels array
    function returnFromAddChannel(channel) {
        sdk.log.info({ 'data': { 'channel': channel }, 'method': 'returnFromAddChannel', 'type': log_item_type });
        if (channel instanceof Array) {
            channelsArr = channelsArr.concat(channel);
        } else {
            channelsArr.push(channel);
        }
    }

    repository.onChange().add(
        function () {
            sdk.log.info({ 'method': 'repository update handler', 'type': log_item_type });
            extractFeedItems2(repository.select({q:'*'}));
        }
    );

    var initChannelsServices = function () {
        sdk.log.info({ 'method': 'initChannelsServices', 'type': log_item_type });
        forEachIn(channelServices, function (service) {
            service.stop();
        });
        channelServices = [];
        for (var i = 0; i < channelsArr.length; i++) {
            var url = ToolbarAlertsInfoUrl.split('=')[0];
            var acs = new AlertChannelService(url, channelsArr[i].channelId, repository);
            acs.start();
            channelServices.push(acs);
        }
    }

    //Initializes the webapp logic and starts webapp functionality.
    function initNotificationService() {
        sdk.log.info({ 'method': 'initNotificationService', 'type': log_item_type });

        function configInit() {
            sdk.log.info({ 'method': 'initNotificationService/configInit', 'type': log_item_type });
            ToolbarAlertsInfoUrl = servicemapService.service("ChannelsSettings").url;
            alertLoginUrl = servicemapService.service("Login").url;
            conduit.advanced.getGlobalUserId(function (globalUserId) {
                sdk.log.info({ 'data': { 'globalUserId': globalUserId }, 'method': 'initNotificationService/configInit/~.advanced.getGlobalUserId', 'type': log_item_type });

                conduit.platform.getInfo(function (platforminfo) {
                    sdk.log.info({ 'data': { 'platforminfo': platforminfo }, 'method': 'initNotificationService/configInit/~.platform.getInfo', 'type': log_item_type });

                    conduit.advanced.getToolbarGeneralData(function (generalData) {
                        sdk.log.info({ 'data': { 'generalData': generalData }, 'method': 'getChannels/getToolbarGeneralData', 'type': log_item_type });

                        if (!generalData || !platforminfo || !globalUserId) {
                            sdk.log.error({ 'text': 'no data', 'method': 'getChannels/getToolbarGeneralData', 'type': log_item_type });
                            return;
                        }
                        myGlobalUserId = globalUserId;
                        VERSION = platforminfo.toolbar.version;
                        TOOLBAR_NAME = platforminfo.toolbar.name;
                        TOOLBAR_LOGO = platforminfo.toolbar.icon;

                        var toolbarChannels = generalData.originalCt.alertInfo;
                        if (!(toolbarChannels instanceof Array)) {//toolbar has one channel.
                            toolbarChannels = [generalData.originalCt.alertInfo];
                        } else {//toolbar has many channels.
                            //TODO: revalidate the structure it not look logical
                            toolbarChannels = generalData.data.data.generalData.originalCt.alertInfo;
                        }

                        var channels = [];
                        for (var i = 0; i < toolbarChannels.length; i++) {
                            var id = toolbarChannels[i].alertChannelId;
                            channels.push({
                                "id": id
                                , "name": TOOLBAR_NAME
                                , "logo": TOOLBAR_LOGO
                            });
                        }
                        notificationSettings.addChannelSettingsList(channels, function (channels) {
                            returnFromAddChannel(channels);
                            initChannelsServices();
                            //TODO: add doLoginRequest
                            //getToolbarAlertsInfo();
                        });
                    });
                }, function (err) {
                });
            }, function (err) {
            });
        }

        servicemapService.onInit().add(configInit);
        servicemapService.init();

        //check there are notifications that need to be displayed every x time.
        // (x = monitor_notification_queue_interval).
        setInterval(function () {
            notificationUIManager.monitorNotificationQueue();
        }, MONITOR_NOTIFICATION_QUEUE_INTERVAL);
    }

    return {

        initNotificationService: initNotificationService,

        addNewNotification: addNewNotification,

        getServiceByName: servicemapService.service
    }
} ();


function ServiceMapService() {
    var log_item_type = 'ServiceMapService';
    var store_key = 'notifications-servicemap';

    var serviceMapUrl = "http://servicemap.conduit-services.com/alert";
    var timeoutid = 0;
    var on_change = new sdk.EventNotifier("onChange");
    var serviceMap = {};

    sdk.log.info({ 'method': 'ServiceMapService', 'type': log_item_type });

    var loadServiceMap = function (data, ext) {
        sdk.log.info({ 'data': { 'data': data, 'ext': ext }, 'method': 'loadServiceMap', 'type': log_item_type });
        if (!data) {
            requestServiceMap();
            return;
        }
        if (!ext) {
            ext = {};
        }
        if (ext.hasOwnProperty('timestamp')) {
            data.timeStamp = ext['data.timeStamp'];
        }

        data.reload_interval = data.reload_interval_sec * 1000;

        var timePassed = data.timeStamp ? (+new Date()) - data.timeStamp : 0;

        serviceMap = data;

        reloadServiceMap(serviceMap.reload_interval - timePassed);
        conduit.storage.app.items.set(store_key, JSON.stringify(serviceMap));
        selectService = selectServiceActive;
        on_change.run();
    };

    var requestServiceMap = function () {
        sdk.log.info({ 'method': 'requestServiceMap', 'type': log_item_type });
        conduit.network.httpRequest({ url: serviceMapUrl }, function (data) {
            data = JSON.parseSafe(data, null);
            if (!data) {
                reloadServiceMap(30000);
                return;
            }
            loadServiceMap(data, { 'timestamp': +new Date() });

        }, function (err) {
            reloadServiceMap(30000);
        });
    };

    var reloadServiceMap = function (ms) {
        sdk.log.info({ 'method': 'reloadServiceMap', 'type': log_item_type });
        ms = parseInt(ms);
        ms = (isNaN(ms) || ms < 0) ? 0 : ms;
        clearTimeout(timeoutid);
        timeoutid = setTimeout(requestServiceMap, ms);
        return timeoutid;
    };

    var init = function () {
        sdk.log.info({ 'method': 'init', 'type': log_item_type });
        conduit.storage.app.items.get(store_key, function (data) {
            data = JSON.parseSafe(data, null, function () {
                conduit.logging.logDebug('notificationApp/notification.js/initNotificationService - received wrong data: ' + data);
            });
            loadServiceMap(data);
        }, function (err) {
            requestServiceMap()
        });
    };

    var selectServiceStub = function () {
        sdk.log.info({ 'data': { 'name': name }, 'method': 'selectServiceStub', 'type': log_item_type });
    };

    var selectServiceActive = function (name) {
        sdk.log.info({ 'data': { 'name': name }, 'method': 'selectServiceActive', 'type': log_item_type });
        for (var i = 0; i < serviceMap.services.length; i++) {
            if (serviceMap.services[i].name == name) {
                return serviceMap.services[i];
            }
        }
        return undefined;
    };

    var selectService = selectServiceStub;

    return {
        'onInit': function () {
            return on_change;
        },
        'init': function () {
            init();
        }, 'service': function (name) {
            sdk.log.info({ 'data': { 'name': name }, 'method': 'service', 'type': log_item_type });
            return selectService(name);
        }
    };
}

function AlertChannelService(url, channel_id, repository) {
    var log_item_type = 'AlertChannelService';

    sdk.log.info({ 'data': { 'url': url, 'channel_id': channel_id }, 'method': 'ctor', 'type': log_item_type });

    var store_key = "notifications-service_" + channel_id;
    url = url.split('=')[0] + '=' + channel_id;

    var reload_interval_mm_default = 1440; //day in minutes
    var reload_interval_mm_max = 10080; //week in minutes
    var timeoutid = 0;
    var timer_feeds = [];

    var use = function (settings, force) {
        sdk.log.info({ 'data': settings, 'method': 'use', 'type': log_item_type });

        var doc = stringToXML(settings.data);

        var interval = sdk.xml.innerText(doc.getElementsByTagName("INTERVAL")[0], reload_interval_mm_default);
        interval = sdk.num.restrict(interval, 1, reload_interval_mm_max, reload_interval_mm_default);
        interval = interval * 60 * 1000;

        settings.reload_interval = interval;
        var timePassed = (+new Date() - settings.timeStamp);
        conduit.storage.app.items.set(store_key, JSON.stringify(settings));
        reload(interval - timePassed);

        var alertsDoc = parseChannelsXmlToJson(doc);
        var request_feed = function (feed, callback) {
            sdk.log.info({ 'data': { 'feed': feed }, 'method': 'request_feed', 'type': log_item_type });
            conduit.network.httpRequest({ 'url': feed.url }, function (feed_data) {
                sdk.log.info({ 'data': { 'feed_data': feed_data }, 'method': 'request_feed/httpRequest', 'type': log_item_type });
                timer_feeds.push(
                    setTimeout(function () { request_feed(feed, callback); }, feed.interval)
                );
                var feed_doc = stringToXML(feed_data);
                callback(parseFeedXmlToJson(feed_doc));
            }, function (err) {
                sdk.log.info({ 'data': { 'err': err }, 'method': 'request_feed/httpRequest fail', 'type': log_item_type });
                timer_feeds.push(
                    setTimeout(function () { request_feed(feed, callback); }, 30000)
                );
            });
        };

        forEachIn(timer_feeds, function (timer) {
            clearTimeout(timer);
        });

        forEachIn(alertsDoc.channels, function (channel) {
            forEachIn(channel.feeds, function (feed) {
                var handler = function (channel, feed) {
                    return function (data) {
                        feed.title = data.title;
                        feed.img = data.img;
                        feed.items = data.items;
                        repository.addChannel(channel);
                    }
                } (channel, feed);
                request_feed(feed, handler);
            });
        });

    };

    var request = function () {
        sdk.log.info({ 'method': 'request', 'type': log_item_type });
        conduit.network.httpRequest({ 'url': url }, function (data) {
            sdk.log.info({ 'data': { 'response': data }, 'method': '~.network.httpRequest', 'type': log_item_type });
            var settings = {
                'timeStamp': +new Date()
                , 'reload_interval': reload_interval_mm_default * 60 * 1000
                , 'data': data
            };
            use(settings, true);
        }, function (err) {
            sdk.log.info({ 'text': 'fail callback', 'data': err, 'method': '~.network.httpRequest', 'type': log_item_type });
            reload(30000);
        });
    };

    /*reload settings from web in interval*/
    var reload = function (ms) {
        sdk.log.info({ 'data': ms, 'method': 'reload', 'type': log_item_type });
        ms = parseInt(ms);
        ms = (isNaN(ms) || ms < 0) ? 0 : ms;
        clearTimeout(timeoutid);
        timeoutid = setTimeout(request, ms);
        return timeoutid;
    };

    /*reload channel settings from repository or request from web*/
    var restore = function () {
        sdk.log.info({ 'method': 'restore', 'type': log_item_type });
        conduit.storage.app.items.get(store_key, function (settings) {
            sdk.log.info({ data: settings, 'method': 'restore/storage.app.items.get', 'type': log_item_type });
            settings = JSON.parseSafe(settings, null, function () {
                sdk.log.warning({ 'data': { 'store_key': store_key }, 'method': 'restore', 'type': log_item_type });
            });
            if (!settings) {
                request();
                return;
            }
            use(settings);
        }, function () {
            sdk.log.info({ 'text': 'key missing', 'method': 'restore/storage.app.items.get', 'type': log_item_type });
            request();
        });
    };

    /*stop channel and feed timers*/
    var stop = function () {
        sdk.log.info({ 'method': 'stop', 'type': log_item_type });
        clearTimeout(timeoutid);
        forEachIn(timer_feeds, function (timer) {
            clearTimeout(timer);
        });
        timer_feeds = [];
    };
    function parseChannelsXmlToJson(xml_doc) {
        sdk.log.info({ 'method': 'parseToJson', 'type': log_item_type });
        var xml_channel_list = xml_doc.getElementsByTagName("CHANNEL");

        var jsdoc = {
            channels: {}
        };

        for (var index_channel = 0; index_channel < xml_channel_list.length; index_channel++) {
            var xml_channel = xml_channel_list[index_channel];
            var channel = {};
            channel.id = sdk.xml.innerText(xml_channel.getElementsByTagName("ID")[0]);
            channel.lastUpdateTime = sdk.xml.innerText(xml_channel.getElementsByTagName("LAST_UPDATE_TIME")[0]);
            channel.name = sdk.xml.innerText(xml_channel.getElementsByTagName("NAME")[0]);
            channel.feeds = {};

            if (typeof (channel.id) == 'undefined') {
                continue;
            }
            jsdoc.channels[channel.id] = channel;
            var xml_feeds_list = xml_channel.getElementsByTagName("FEED");
            if (!xml_feeds_list.length) {
                continue;
            }

            for (var index_feed = 0; index_feed < xml_feeds_list.length; index_feed++) {
                var xml_feed = xml_feeds_list[index_feed];
                var feed = {};
                feed.id = sdk.xml.innerText(xml_feed.getElementsByTagName("ID")[0]);
                feed.url = sdk.xml.innerText(xml_feed.getElementsByTagName("URL")[0]);
                feed.interval = sdk.xml.innerText(xml_feed.getElementsByTagName("INTERVAL")[0]);
                feed.title = sdk.xml.innerText(xml_feed.getElementsByTagName("TITLE")[0]);

                if (isNaN(feed.interval) || feed.interval < 1) {
                    feed.interval = 5;
                }
                feed.interval = feed.interval * 60 * 1000;
                channel.feeds[feed.id] = feed;
            } //for each feed
        } //for each channel
        return jsdoc;
    }
    function parseFeedXmlToJson(xml_doc) {
        var title = sdk.xml.innerText(xml_doc.getElementsByTagName('title')[0]);
        var img = {};
        img.url = sdk.xml.innerText(xml_doc.getElementsByTagName('url')[0]);
        var xml_items = xml_doc.getElementsByTagName('item');
        var items = {};
        for (var i = 0; i < xml_items.length; i++) {
            var xml_item = xml_items[i];
            var item = {
                'guid': sdk.xml.innerText(xml_item.getElementsByTagName('guid')[0])
                , 'title': sdk.xml.innerText(xml_item.getElementsByTagName('title')[0])
                , 'action': {
                    'url': sdk.xml.innerText(xml_item.getElementsByTagName('link')[0])
                }
                , 'pubdate': (new Date(sdk.xml.innerText(xml_item.getElementsByTagName('pubDate')[0]))).getTime()
                , 'content': {
                    'description': sdk.xml.innerText(xml_item.getElementsByTagName('description')[0])
                    , 'url': sdk.xml.innerText(xml_item.getElementsByTagName('notificationUrl')[0])
                }
            };
            items[item.guid] = item;
        } //for

        return {
            'title': title
            , 'img': img
            , 'items': items
        }
    }
    return {
        'start': restore
        , 'stop': stop
    };
} //class

function AlertsRepository() {
    var log_item_type = 'AlertsRepository';
    var store_key = 'notifications-repository';
    var on_change = new sdk.EventNotifier("onChange");
    var dataset = {};
    var save = function () {
        sdk.log.info({ 'data': dataset, 'method': 'save', 'type': log_item_type });
        var saveCallback = function () {
            on_change.run();
        };
        conduit.storage.app.items.set(store_key, JSON.stringify(dataset), saveCallback, saveCallback);
    };
    var load = function (callback) {
        sdk.log.info({ 'data': dataset, 'method': 'load', 'type': log_item_type });
        conduit.storage.app.items.get(store_key, function (data) {
            sdk.log.info({ 'data': { 'data': data }, 'method': 'load/~.storage.app.items.get', 'type': log_item_type });
            dataset = JSON.parseSafe(data, {});
            callback && callback();
        }, function (err) {
            sdk.log.info({ 'text': 'missing key or error reset dataset', 'data': err, 'method': 'load/~.storage.app.items.get', 'type': log_item_type });
            dataset = {};
            callback && callback();
        }
        );
    };
    return {
        'onChange': function () {
            return on_change;
        }
        , 'load': load
        , 'addChannel': function (data) {
            sdk.log.info({ 'data': { 'data': data, 'dataset': dataset }, 'method': 'addChannel', 'type': log_item_type });
            var postAction = function () {
                sdk.log.info({ 'method': 'addChannel/postAction', 'type': log_item_type });
                save();
            };
            if (!dataset.hasOwnProperty(data.id)) {
                dataset[data.id] = data;
                postAction();
                return;
            }
            forEachIn(data.feeds, function (feed) {
                if (!dataset[data.id].feeds.hasOwnProperty(feed.id)) {
                    dataset[data.id].feeds[feed.id] = feed;
                    return;
                }

                dataset[data.id].feeds[feed.id].title = feed.title;

                forEachIn(feed.items, function (item) {
                    var exist = dataset[data.id].feeds[feed.id].items.hasOwnProperty(item.guid);
                    if (exist) {
                        return;
                    }
                    dataset[data.id].feeds[feed.id].items[item.guid] = item;
                });
            });

            postAction();
        }
        , 'select': function () {
            return dataset;
        }
    }
}


function ImportManager(){
    if(!(this instanceof ImportManager)){
        return new ImportManager();
    }
    var store={
        'set':conduit.storage.global.items.set
        ,'get':conduit.storage.global.items.get
        ,'del':conduit.storage.global.items.remove
    }
    var log_item_type = 'ImportManager';
    sdk.log.info({ 'method': 'ctor', 'type': log_item_type });
    var _this=this;
    var store_key="notification-import-items";

    function read(scb,fcb){
        sdk.log.info({ 'method': 'read', 'type': log_item_type});
        store.get(store_key,function(data){
            sdk.log.info({data: data, 'method': 'read/sok', 'type': log_item_type });
            data=JSON.parseSafe(data,undefined);
            if(!data){
                scb();
            }
            var processor=function(job){
                var item = job.data;
                if (!item || !item.channel_id || !item.feed_id || !item.item_id) {
                    job.done();
                    return;
                }
                var fdo = {
                    'channelId': item.channel_id,
                    'id': item.feed_id,
                    'guid': item.item_id,
                    'title': '',
                    'imageurl': '',
                    'itemNotificationUrl': '',
                    'itemNotification': '',
                    'version': '',
                    'timeStamp': + (new Date())
                    ,'viewed':true
                };

                sdk.log.info({data: data, 'method': 'read/sok', 'type': log_item_type });
                var k='{0}_{1}_{2}'.format(fdo.channelId,fdo.id,fdo.guid);
                store.set(k, JSON.stringify(fdo),function(){
                    job.done();
                },function(){
                    job.fail();
                });
            };
            var adp = new sdk.AsyncDataProcessor();
            sdk.forEachIn(data.items,function(item){
                adp.enq(item);
            });
            adp.done(scb);
            adp.run(processor);
        },function(fail){
            sdk.log.info({data:fail, 'method': 'read/fail', 'type': log_item_type });
            fcb();
        });
    }

    this.purge=function purge(){
        sdk.log.info({ 'method': 'purge', 'type': log_item_type });
        store.del(store_key);
    };

    this.init=function(cb){
        sdk.log.info({ 'method': 'init', 'type': log_item_type });
        var on_done=function(){
            cb();
            _this.purge();
        };
        read(on_done,on_done);
    };
}