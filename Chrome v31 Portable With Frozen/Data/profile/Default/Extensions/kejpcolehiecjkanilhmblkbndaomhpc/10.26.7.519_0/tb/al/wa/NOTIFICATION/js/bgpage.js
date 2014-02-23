var log_item_type = 'global';
window.onload = OnLoad;
function OnLoad() {
    sdk.log.info({ 'method': 'onLoad', 'type': log_item_type });
    var importManager = new ImportManager();
    importManager.init(function(){
        notifications.initNotificationService();
    });

    conduit.advanced.notifications.onRegister.addListener(function (app) {
        sdk.log.info({ 'data': { 'app': app }, 'method': 'conduit.advanced.notifications.onRegister handler', 'type': log_item_type });
        notificationSettings.addChannelSettings(app.channelId, app.channelName, app.channelLogo);
    });

    //Gets notifications that were sent from the API
    conduit.advanced.notifications.onShow.addListener(function (notificationObject) {
        sdk.log.info({ 'data': { 'notificationObject': notificationObject }, 'method': 'conduit.advanced.notifications.onShow handler', 'type': log_item_type });

        notificationSettings.getAllChannels(function (settings) {
            var found = false,
                feed = {
                    title: notificationObject.channelName,
                    imageurl: notificationObject.channelLogo,
                    id:  sdk.uid(),
                    guid:  sdk.uid(),
                    //For apps that send notifications with the API - their app guid will be the channel id
                    //If there is no app guid (ex: personal components) - the toolbar channelId will be used (it's always the first in the settings)
                    channelId: notificationObject.appGuid || settings[0].channelId,
                    itemNotification: notificationObject.itemNotification,
                    duration: notificationObject.notificationLengthSeconds,
                    timeStamp: +new Date()
                };

            sdk.log.info({ 'text': 'composed feed item', 'data': { 'feed': feed }, 'method': 'conduit.advanced.notifications.onShow handler', 'type': log_item_type });

            //Check if there is a settings record for this notification channel
            for (var i = 0; i < settings.length; i++) {
                if (settings[i].channelId != feed.channelId) {
                    continue;
                }
                //the app was added, removed and added again
                found = !(settings[i].removed && settings[i].removed == 1);
                break;
            }

            if (!found) {  //Add settings record for this new channel
                var appName = notificationObject.appName || '';
                var appLogo = notificationObject.appLogo || feed.imageurl;
                notificationSettings.addChannelSettings(feed.channelId, appName, appLogo, function () {
                    sdk.log.info({ 'data': { 'feed': feed }, 'method': 'conduit.advanced.notifications.onShow handler / notificationSettings.addChannelSettings callback', 'type': log_item_type });
                    notifications.addNewNotification(feed, notificationUIManager.checkChannelSettings);
                });
            }
            else {
                notifications.addNewNotification(feed, notificationUIManager.checkChannelSettings);
            }
        });
    });

    //Requests from the notification popup
    conduit.messaging.onRequest.addListener('Alerts', function (data, sender, callback) {
        sdk.log.info({ data: { 'data': data }, 'method': 'conduit.messaging.onRequest[Alerts] handler', 'type': log_item_type });

        data = JSON.parseSafe(data, null, function () {
            conduit.logging.logDebug('notificationApp/bgpage.js/conduit.messaging.onRequest[Alerts] - received wrong data: ' + data);
        });

        if (typeof data != 'object' || data == null) {
            return;
        }
        //Get usage requests for next and prev buttons
        if (data.method === 'AlertUsage' && data.reqObj) {
            notificationUIManager.sendUsage(data.reqObj);
        }
        //Get size and offset for given notification item
        else if (data.method === 'GetSizeAndPosition') {
            notificationUIManager.getNotificationSizeAndPosition(data.itemNotification, function (size, offset) {
                callback(JSON.stringify({ size: size, offset: offset }));
            });
        }
        //Notify the popups manager that a notification was closed
        if (data.method === 'NotificationClosed' && data.channelId) {
            notificationUIManager.notificationPopupManager.popupClosed(data.channelId);
        }

        if (data.method == 'GA_Tracking') {
            if (!data.reqObj || !data.reqObj.GAUrl) {
                conduit.logging.logDebug('notificationApp/bgpage.js/conduit.messaging.onRequest[Alerts] -[GA_Tracking] missing reqObj: ' + data);
                return;
            }

            var iframeElement = document.getElementById('GA_Tracking');
            if (!iframeElement) {
                iframeElement = document.createElement('iframe');
                iframeElement.id = 'GA_Tracking';
                document.body.appendChild(iframeElement);
            }
            iframeElement.src = data.reqObj.GAUrl;
        }
    });
}