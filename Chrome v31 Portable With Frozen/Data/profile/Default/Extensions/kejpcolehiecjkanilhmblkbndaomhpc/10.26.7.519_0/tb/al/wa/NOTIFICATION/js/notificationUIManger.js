var notificationUIManager = function () {
    var log_item_type = 'notificationUIManager';
    //////////////////////////////////////////////////////////////////////////////////////////////
    //                                PRIVATE AREA                                              //
    //////////////////////////////////////////////////////////////////////////////////////////////

    var VERSION;
    var itemsToShowQueue = [];  //represent the notification queue
    var notificationsToShowKeyName = 'NotificationsToShow_';

    function init() {
        sdk.log.info({ 'method': 'init', 'type': log_item_type });
        conduit.platform.getInfo(function (platforminfo) {
            VERSION = platforminfo.toolbar.version;
        });
    }

    //Removes all notifications with the given channelId from queue
    function removeNotificationFromQueue(removeChannelId, removeFromRepository) {
        sdk.log.info({ 'method': 'removeNotificationFromQueue', 'type': log_item_type });

        //Removing notifications from memory queue
        var newArr = [];
        for (var i = 0; i < itemsToShowQueue.length; i++) {
            if (itemsToShowQueue[i].channelId != removeChannelId) {
                newArr.push(itemsToShowQueue[i]);
            }
        }
        itemsToShowQueue = newArr;

        //Removing notifications from repository (if the user settings doesn't allow showing notification from this channel)
        if (removeFromRepository)
            conduit.storage.global.items.remove(notificationsToShowKeyName + removeChannelId);
    }

    function callToWindowOepener(ChannelSettings) {
        sdk.log.info({ 'method': 'callToWindowOepener', 'type': log_item_type });
        if (ChannelSettings.displayedTime < ChannelSettings.timeAday) {
            ChannelSettings.displayedTime = ChannelSettings.displayedTime + 1;
            notificationSettings.updateChannel(ChannelSettings.channelId, ChannelSettings.rule, null, ChannelSettings.timeAday, ChannelSettings.displayedTime, ChannelSettings.day, null);
            return true;
        } else {
            return false;
        }
    }

    //Checks the notifications day limit per channel, returns true if not reached maximum day limit.
    function checkCallingWindowOepener(ChannelSettings) {
        sdk.log.info({ 'method': 'checkCallingWindowOepener', 'type': log_item_type });
        var CallWindowOepener,
            dayOfYear = getDayOfYear();

        if (ChannelSettings.day != dayOfYear) {
            ChannelSettings.day = dayOfYear;
            ChannelSettings.displayedTime = 0;
            notificationSettings.updateChannel(ChannelSettings.channelId, ChannelSettings.rule, null, ChannelSettings.timeAday, ChannelSettings.displayedTime, ChannelSettings.day, null);
            CallWindowOepener = callToWindowOepener(ChannelSettings);
        }
        else {
            CallWindowOepener = callToWindowOepener(ChannelSettings);
        }

        return CallWindowOepener;
    }

    //Opens the popup and show new notification and removes the notification from the queue
    function openNotificationWindow(feedItem) {
        sdk.log.info({ 'method': 'openNotificationWindow', 'type': log_item_type });
        getNotificationSizeAndPosition(feedItem, function (size, offset) {
            var popUpWidth = size.width,
                popUpHeight = size.height,
                offsetX = offset.offsetX,
                offsetY = offset.offsetY;

            var popupOptions = { isAbsolute: true, dimensions: { width: popUpWidth, height: popUpHeight }, showFrame: false, isFocused: false, closeOnExternalClick: false, openPosition: "offset(" + offsetX + "," + offsetY + ")", isLightFrame: false };
            sdk.log.info({ 'text': 'before ~.app.popup.open', 'method': 'openNotificationWindow', 'type': log_item_type });
            conduit.app.popup.open('NotificationPopup.html?itemNotification=' + notificationsToShowKeyName + feedItem.channelId, popupOptions,
                function () {
                    sdk.log.info({ 'data': arguments, 'method': 'openNotificationWindow/~.app.popup.open callback', 'type': log_item_type });
                },
                function (err) {
                    sdk.log.info({ 'data': err, 'method': 'openNotificationWindow/~.app.popup.open fallback', 'type': log_item_type });
                });

            removeNotificationFromQueue(feedItem.channelId, false);
        });
    }

    //Manages the open popups - if a popup is already open a given channel - sends a message to that popup.
    var notificationPopupManager = (function () {
        sdk.log.info({ 'method': 'notificationPopupManager', 'type': log_item_type });
        var openPopups = {};

        function showAlert(itemObj) {
            sdk.log.info({ 'method': 'notificationPopupManager/showAlert', 'type': log_item_type });
            if (openPopups[itemObj.channelId]) {  //if there is a popup open for this channel
                sdk.log.info({ 'text': 'alert popup already open send [updated] message', 'method': 'notificationPopupManager/showAlert', 'type': log_item_type });
                var data = {
                    key: notificationsToShowKeyName + itemObj.channelId
                };

                //Send a message to the opened notification popup telling it to check the repository queue
                conduit.messaging.postTopicMessage('AddAlertToChannelPopup', JSON.stringify(data));

                removeNotificationFromQueue(itemObj.channelId, false);
            }
            else {  //there is no popup open for this channel
                openPopups[itemObj.channelId] = true;
                openNotificationWindow(itemObj);
            }
        }

        function popupClosed(channelId) {
            sdk.log.info({ 'method': 'notificationPopupManager/popupClosed', 'type': log_item_type });
            delete openPopups[channelId];
        }

        return {
            showAlert: showAlert,
            popupClosed: popupClosed
        }
    })();

    //Parses the custom notification object
    var parseCustomNotification = function (objStr) {
        sdk.log.info({ 'method': 'parseCustomNotification', 'type': log_item_type });
        var customNotifObj = null;

        if (objStr.length > 1 && objStr[0] === '{') {
            try {
                customNotifObj = JSON.parse(objStr);
            }
            catch (err) { }
        }

        return customNotifObj;
    };

    //Calculates the size and offset of the notification popup
    function getNotificationSizeAndPosition(feedItem, callback) {
        sdk.log.info({ 'method': 'getNotificationSizeAndPosition', 'type': log_item_type });
        var size = {  //Default size
            width: 322,
            height: 190
        },
            itemData = feedItem.itemNotification || feedItem,
            customNotifObj = parseCustomNotification(itemData);

        if (customNotifObj) {
            switch (customNotifObj.htmlCreator) {
                case 0:
                    break;
                default:
                    size.width = (customNotifObj.size.width) ? ((+customNotifObj.size.width) + 2) : size.width;
                    size.height = (customNotifObj.size.height) ? ((+customNotifObj.size.height) + 66) : size.height;

                    //If the user set an height
                    if (customNotifObj && customNotifObj.content && customNotifObj.size.height) {
                        if (!customNotifObj.content.url) {  //sent html markup
                            size.height += 24;  //add height for bottom and top padding (so that the user's content will not be trimmed)
                            size.width += 40;
                        }
                        else {
                            size.height -= 2;
                        }
                    }
                    break;
            }
        }

        sdk.log.info({ 'text': 'get screen dimensions', 'method': 'getNotificationSizeAndPosition', 'type': log_item_type });
        conduit.platform.getScreenWidth(function (width) {
            sdk.log.info({ 'method': 'getNotificationSizeAndPosition/getScreenWidth', 'type': log_item_type });
            conduit.platform.getScreenHeight(function (height) {
                sdk.log.info({ 'method': 'getNotificationSizeAndPosition/getScreenHeight', 'type': log_item_type });
                var offset = {  //Default size
                    offsetX: 0,
                    offsetY: 0
                },
                screenW = width || screen.availWidth,
                screenH = height || screen.availHeight,
                popUpWidth = size.width,
                popUpHeight = size.height;

                offset.offsetX = screenW - popUpWidth - 20;
                offset.offsetY = screenH - popUpHeight - 12;

                callback(size, offset);
            });
        });
    }


    init();


    return {
        //////////////////////////////////////////////////////////////////////////////////////////////
        //                                QUEUE MANAGMENT FUNCTIONS                                 //
        //////////////////////////////////////////////////////////////////////////////////////////////

        //Called every [x] seconds to check if there are new notification to show.
        monitorNotificationQueue: function () {
            sdk.log.info({ 'data': { 'itemsToShowQueue': itemsToShowQueue }, 'method': 'monitorNotificationQueue', 'type': log_item_type });
            var sent = [],
                feedItem;

            //Go over the array and call checkChannelSettings only once for every channel
            for (var i = 0; i < itemsToShowQueue.length; i++) {
                feedItem = itemsToShowQueue[i];

                if (!sent[feedItem.channelId]) {
                    sent[feedItem.channelId] = true;
                    this.checkChannelSettings(feedItem);
                }
            }
        },

        //Adds the notification to the global notifications queue
        putNotificationInQueue: function (feedsArray) {
            sdk.log.info({ 'data': { 'itemsToShowQueue': itemsToShowQueue, 'feedsArray': feedsArray }, 'method': 'putNotificationInQueue', 'type': log_item_type });
            itemsToShowQueue = itemsToShowQueue.concat(feedsArray);
        },


        //////////////////////////////////////////////////////////////////////////////////////////////
        //                                SERVICES AND USAGE FUNCTIONS                              //
        //////////////////////////////////////////////////////////////////////////////////////////////

        //Returns the usages request as a string in xml format
        buildNewRequest: function (reqObj) {
            sdk.log.info({ 'method': 'buildNewRequest', 'type': log_item_type });
            var str = reqObj.fileName.split("_");
            reqObj.alertId = str[0];
            reqObj.feedId = str[1];
            reqObj.itemId = str[2];
            reqObj.version = reqObj.version || VERSION;  //If the object comes from appName.js - the version is already there

            var buildRequest = "";
            buildRequest += "<ALERT_XML>";
            buildRequest += "<TYPE>ALERT_USAGE</TYPE>";
            buildRequest += "<MESSAGE>";
            buildRequest += "<VERSION>" + reqObj.version + "</VERSION>";
            buildRequest += "<TYPE>" + reqObj.type + "</TYPE>";
            buildRequest += "<DATA>";
            buildRequest += "<ALERT_ID>" + reqObj.alertId + "</ALERT_ID>";
            buildRequest += "<FEED_ID>" + reqObj.feedId + "</FEED_ID>";
            buildRequest += "<ITEM_ID>" + reqObj.itemId + "</ITEM_ID>";
            buildRequest += "</DATA>";
            buildRequest += "</MESSAGE>";
            buildRequest += "</ALERT_XML>";

            return buildRequest;
        },

        //Sends a usage request
        sendUsage: function (reqStr) {
            sdk.log.info({ 'method': 'sendUsage', 'type': log_item_type });
            var buildRequest;
            try {
                buildRequest = notificationUIManager.buildNewRequest(reqStr);
            } catch (err) { return; }

            var usageUrl = notifications.getServiceByName("Usage").url + "?alertUsageRequestXml=" + buildRequest;
            conduit.network.httpRequest({ url: usageUrl }, function () { });
        },


        //////////////////////////////////////////////////////////////////////////////////////////////
        //                                OPEN / SHOW NOTIFICATION POPUP FUNCTIONS                  //
        //////////////////////////////////////////////////////////////////////////////////////////////

        //Checks if channel settings allow to show notifications.
        checkChannelSettings: function (feedItem) {
            sdk.log.info({ 'method': 'checkChannelSettings', 'type': log_item_type });
            notificationSettings.getChannelSettings(feedItem.channelId, function (channelSettings) {
                switch (channelSettings.rule) {
                    case "always":
                        notificationPopupManager.showAlert(feedItem);
                        break;

                    case "timeAday":
                        var CallWindowOepener = checkCallingWindowOepener(channelSettings);
                        if (CallWindowOepener) {
                            notificationPopupManager.showAlert(feedItem);
                        }
                        else {
                            removeNotificationFromQueue(feedItem.channelId, true);
                        }
                        break;

                    case "never":
                        removeNotificationFromQueue(feedItem.channelId, true);
                        return;
                        break;
                }
            });
        },

        getNotificationSizeAndPosition: getNotificationSizeAndPosition,

        notificationPopupManager: notificationPopupManager
    };
} ();