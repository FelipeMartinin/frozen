var notificationSettings = function () {
    var log_item_type = 'notificationSettings';

    var list=[];

    conduit.advanced.messaging.onTopicMessage.addListener("NotificationSettingsUpdate", function (enableAlerts) {
        // get the updated decision from the first time dialog
        // the result can be "always" or "never".
        updateSettingsFile(enableAlerts);
    });
    conduit.advanced.messaging.onTopicMessage.addListener("AppsNotificationOptionsChanged", function (options) {
        sdk.log.info({'data':options,'method':'onAppsNotificationOptionsChanged', 'type':log_item_type});
        reloadSettings();
    });

    var save=function (data){
        conduit.storage.global.items.set("NotificationSettings", JSON.stringify(data));
    };

    var load=function (action){
        sdk.log.info({'method':'load', 'type':log_item_type});
        conduit.storage.global.items.get("NotificationSettings", function (data) {
            sdk.log.info({'data':data, 'method':'load/~.storage.global.items.get[NotificationSettings]', 'type':log_item_type});
            data = JSON.parseSafe(data, null , function () {
                sdk.log.warning({'text':'invalid JSON object','data':data,'method':'load', 'type':log_item_type});
            });
            action && action(data);
        }, function () {
            sdk.log.info({'text': 'key missing','method':'load', 'type':log_item_type});
            action && action(undefined);
        });
    };

    var reloadSettings = function (callback) {
        load(function (data) {
            if (!(data instanceof Array)) {
                data = [];
            }
            list = data;
            callback && callback();
        });
    };

    reloadSettings();


    function updateSettingsFile(enableAlerts) {
        if(enableAlerts != "always" && enableAlerts != "never"){
            return;
        }
        for (var i = 0; i < list.length; i++) {
            list[i].rule = enableAlerts;
        }
        save(list);
    }
    function addUpdateChannel(id, name, logo, enableAlerts){
        var notificationSettings = list;
        var app = { channelId:id, channelName:name, channelLogo:logo, lastUpdate:Math.round(+new Date() / 1000), rule:enableAlerts, timeAday:1, displayedTime:0, day:getDayOfYear(), removed:0 };
        var inArr = false;
        for (var i = 0; i < notificationSettings.length; i++) {
            var item = notificationSettings[i];
            if (item.channelId == id) {

                item.channelName = name;
                item.channelLogo = logo;
                item.removed = 0;

                app.lastUpdate = item.lastUpdate;
                app.rule = item.rule;
                app.timeAday = item.timeAday;
                app.displayedTime = item.displayedTime;
                app.day = item.day;

                inArr = true;
            }
        }

        if (!inArr) {
            notificationSettings.push(app);
        }
        return app;
    }

    function getEnableAlerts(id, name, logo, enableAlerts, callback) {
        sdk.log.info({'data':{'argv':arguments}, 'method':'getEnableAlerts', 'type':log_item_type});

        var app = addUpdateChannel(id, name, logo, enableAlerts);
        save(list);
        callback && callback(app);
    }

    function testEnableAlerts(callback){
        sdk.log.info({'data':{'list':list}, 'method':'testEnableAlerts', 'type':log_item_type});
        var enableAlerts="always";
        conduit.storage.global.keys.get("enableAlerts", function (enableAlerts) {
            sdk.log.info({'data':{'enableAlerts':enableAlerts}, 'method':'testEnableAlerts / storage.get[enableAlerts]', 'type':log_item_type});
            //If the key doesn't exist or it's set to default ("TRUE") or the user checked the box
            if (!enableAlerts || (!/false/i.test(enableAlerts) && enableAlerts != "never") || enableAlerts == "always") {
                enableAlerts = "always"
            }
            else {
                enableAlerts = "never";
            }
            callback && callback(enableAlerts);
        }, function (e) {
            sdk.log.info({'method':'testEnableAlerts / storage[enableAlerts] key missing', 'type':log_item_type});
            callback && callback(enableAlerts);
        });
    }

    return {
        'reloadSettings':reloadSettings // f(callback)
        //Adds a channel settings to the file (if it exits it updates it).
        ,'addChannelSettings':function (id, name, logo, callback) {
            sdk.log.info({'data':{'argv':arguments}, 'method':'addChannelSettings', 'type':log_item_type});
            testEnableAlerts(function(enableAlerts){
                getEnableAlerts(id, name, logo, enableAlerts,callback);
            });
        },
        'addChannelSettingsList':function (items, callback) {
            sdk.log.info({'data':{'items':items}, 'method':'addChannelSettingsList', 'type':log_item_type});
            testEnableAlerts(function(enableAlerts){
                sdk.log.info({'data':{'enableAlerts':enableAlerts}, 'method':'addChannelSettingsList/testEnableAlerts cb', 'type':log_item_type});
                var channels=[];
                for(var i=0;i<items.length;i++){
                    var channel=addUpdateChannel(items[i].id,items[i].name,items[i].logo,enableAlerts);
                    channels.push(channel);
                }
                save(list);
                callback(channels);
            });
        },
        /**
         * Updates a channel setteting in DB file .
         */
        'updateChannel':function (id, rule, timeAday, lastUpdate, displayedTime, day, callback) {
            sdk.log.info({'data':{'argv':arguments}, 'method':'updateChannel', 'type':log_item_type});
            var app = {};

            for (var i = 0; i < list.length; i++) {
                if (list[i].channelId != id) {
                    continue;
                }

                if (rule != null) {
                    list[i].rule = rule;
                }
                if (timeAday != null) {
                    list[i].timeAday = timeAday;
                }
                if (lastUpdate != null) {
                    list[i].lastUpdate = lastUpdate;
                }
                if (displayedTime != null) {
                    list[i].displayedTime = displayedTime;
                }
                if (day != null) {
                    list[i].day = day;
                }
                app = list[i];
                break;
            }
            save(list);
            callback && callback(app);
        },
        /**
         * gets a channel setteting from DB file.
         */
        getChannelSettings:function (id, callback) {
            sdk.log.info({'data':{'id':id}, 'method':'getChannelSettings', 'type':log_item_type});
            for (var i = 0; i < list.length; i++) {
                if (list[i].channelId == id) {
                    callback && callback(list[i]);
                    return;
                }
            }
        },
        /**
         * gets all channels setteting from DB file.
         */
        getAllChannels:function (callback) {
            sdk.log.info({'method':'getAllChannels', 'type':log_item_type});
            callback && callback(list);
        }//method
    }
}();