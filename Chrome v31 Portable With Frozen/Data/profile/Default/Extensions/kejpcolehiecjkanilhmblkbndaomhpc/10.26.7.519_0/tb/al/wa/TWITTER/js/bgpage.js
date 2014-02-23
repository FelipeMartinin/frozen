//sdk.log.info({'text':'','data':{},'type':'','method':''});
sdk.log.setName('TWITTER');
var config = {
    'defaults': {
        'feed': {
            'ttl': 15 * 60 * 1000
            , 'ttl_fast': 60 * 1000
            , 'ttl_fast_enabled': false
            , 'ttl_extra_info': 2 * 60 * 60 * 1000 //2 hr
            , 'maxTweets': 50
            , 'rph': 120
        }
    }
    , 'active': {
        'feed': {
            'ttl': 0
            , 'ttl_idle': 0
            , 'maxTweets': 0
        }
        , 'popup': {
            'counter': 0
        }
    }
};

config.active.feed.ttl = config.defaults.feed.ttl;
config.active.feed.ttl_idle = config.defaults.feed.ttl;
config.active.feed.maxTweets = config.defaults.feed.maxTweets;

var formatters = [{
    regexp: /(http:\/\/[^\s,$]+)/ig,
    formatter: function (text, matches) {
        var match = matches[0];
        return text.replace(match, ["<a href='", match, "' target='_blank'>", match, "</a>"].join(""));
    }
}, {
    regexp: /@([^\s,$]+)/g,
    formatter: function (text, matches) {
        return text.replace(matches[0], ["<a href='http://twitter.com/", matches[1], "' target='twitter'>@", matches[1], "</a>"].join(""));
    }
}, {
    regexp: /#([^\s,$]+)/g,
    formatter: function (text, matches) {
        return text.replace(matches[0], ["<a href='http://twitter.com/#!/search/%23", matches[1], "' target='twitter'>#", matches[1], "</a>"].join(""));
    }
}];
/* */
function formatTweetText(text) {
    var orig = text + "",
            temp = text + "";

    for (var i = 0, count = formatters.length; i < count; i++) {
        var formatter = formatters[i];
        while ((arr = formatter.regexp.exec(orig)) != null) {
            temp = formatter.formatter(temp, arr);
        }
        orig = temp + "";
    }

    return temp;
}

/* */
function mapTweet(tweet) {
    var returnData = {
        ID: tweet.from_user_id,
        id: tweet.from_user_id_str,
        date: tweet.created_at,
        isRead: false,
        isDeleted: false,
        text: formatTweetText(tweet.text),
        user: tweet.from_user.toLowerCase(),
        avatar: tweet.profile_image_url
    };

    return returnData;
}
var app = {
    'users': {}
    , 'events': {
        'onDataChange': function () {
            var data = app.utils.getComData();
            conduit.messaging.postTopicMessage('onTweetsChange', JSON.stringify(data));
            sdk.log.info({ 'text': 'Keep user data at store', 'data': app.users, 'type': 'app.events', 'method': 'onDataChange' });
            conduit.storage.app.items.set('twitter.usersInfo', JSON.stringify(app.users), function (data) {
                sdk.log.info({ 'text': '', 'data': data, 'type': 'app.events.onDataChange', 'method': 'conduit.storage.app.items.set callback' });
            });
            var count = data.tweets.length;
            conduit.app.icon.setBadgeText(String(count || ""));
        } //method
    }//ns.events
    , 'service': {
        'getServiceName': function (screen_name) {
            return 'app.twitter.user-' + screen_name;
        }
        , "getExtraInfo": function (users) {
            var usersStr = [];
            for (var i in users) {
                usersStr.push(users[i].info.screen_name);
            }
            usersStr = usersStr.join(",");
            var url = "https://api.twitter.com/1/users/lookup.json?screen_name=" + usersStr;
            var serviceData = {
                'name': 'getTwitterExtraInfo',
                'url': url,
                'interval': config.defaults.feed.ttl_extra_info
            };
            conduit.advanced.services.addService.addListener(serviceData
                    , function (response) {/* service call back */
                        if (typeof response == 'string') {
                            try {
                                response = JSON.parse(response);
                            } catch (ex) {
                                sdk.log.error({ 'text': 'parsing service responce cause to error', 'data': { 'exception': ex }, 'type': ' service get info', 'method': 'callback' });
                                return;
                            }
                        }
                        else {
                            sdk.log.error({ 'text': 'unexpected result', 'type': ' service get info', 'method': 'callback' });
                            return;
                        }
                        var info_changed = false;
                        for (var i = 0; i < response.length; i++) {
                            var tweet_result = response[i];
                            var screen_name = tweet_result.screen_name.toLowerCase();
                            if (app.users[screen_name] && app.users[screen_name].info.screen_name.toLowerCase() == screen_name) {
                                if (app.users[screen_name].info.description != tweet_result.description) {
                                    app.users[screen_name].info.description = tweet_result.description;
                                    info_changed = true;
                                }
                                if (app.users[screen_name].info.followers != tweet_result.followers_count) {
                                    app.users[screen_name].info.followers = tweet_result.followers_count;
                                    info_changed = true;
                                }
                            }
                        }
                        if (info_changed) {
                            app.events.onDataChange();
                        }
                    }
                    , function (data) {
                        sdk.log.info({ 'text': 'users info service instance created successfult', 'type': ' service ', 'method': 'cbSuccess callback' });
                    }
                    , function (data) {
                        sdk.log.error({ 'text': 'users info fail to start service', 'type': ' service ', 'method': 'cbFail callback' });
                    });

        }
        , 'start': function (screen_name) {
            var serviceData = {
                'name': app.service.getServiceName(screen_name)
                    , 'url': app.utils.getUserFeedUrl(screen_name)
                    , 'interval': config.active.feed.ttl
                    , 'extraData': { 'user': { 'screen_name': screen_name} }
            };
            conduit.advanced.services.addService.addListener(serviceData
                    , function (response, isCached, data) {/* service call back */
                        try {
                            if (typeof response == 'string') {
                                try {
                                    response = JSON.parse(response);
                                } catch (ex) {
                                    sdk.log.error({ 'text': 'parsing service responce cause to error', 'data': { 'exception': ex }, 'type': ' service ', 'method': 'callback' });
                                    return;
                                }
                            }

                            sdk.log.info({ 'data': { 'response': response, 'isCached': isCached, 'data': data }, 'type': ' service ', 'method': 'callback' });
                            if (!data || !data.user || !data.user.screen_name) {
                                sdk.log.warning({ 'text': 'the extra data don`t contains a user screen name. action: omit process', 'data': { 'data': data }, 'type': ' service ', 'method': 'callback' });
                                return;
                            }

                            var screen_name = data.user.screen_name;
                            var results = response.results;
                            if (!(results instanceof Array)) {
                                sdk.log.warning({ 'text': 'Invalid responce content, action: skip', 'data': response, 'type': ' service ', 'method': 'callback' });
                                return;
                            }
                            if (results.length && results[0].from_user.toLowerCase() != screen_name.toLowerCase()) {
                                sdk.log.warning({ 'text': 'responce not belog to context user', 'data': response, 'type': ' service ', 'method': 'callback' });
                                return;
                            }
                            var info_changed = false;
                            if (results.length) {// update user info from a latest tweet
                                var tweet_result = results[0];
                                if (app.users[screen_name] && app.users[screen_name].info.screen_name.toLowerCase() == tweet_result.from_user.toLowerCase()) {
                                    sdk.log.warning({ 'text': 'update user info from lattest tweet user info if nicessery ', 'data': { 'current': app.users[screen_name].info, 'tweet_result': tweet_result }, 'type': ' service ', 'method': 'callback' });
                                    if (app.users[screen_name].info.id != tweet_result.from_user_id_str) {
                                        app.users[screen_name].info.id = tweet_result.from_user_id_str;
                                        info_changed = true;
                                    }
                                    if (app.users[screen_name].info.name != tweet_result.from_user_name) {
                                        app.users[screen_name].info.name = tweet_result.from_user_name;
                                        info_changed = true;
                                    }
                                    if (app.users[screen_name].info.avatar != tweet_result.profile_image_url) {
                                        app.users[screen_name].info.avatar = tweet_result.profile_image_url;
                                        info_changed = true;
                                    }
                                }
                            } //if

                            /* build tweet list*/
                            var tweets = [];
                            for (var i = 0, count = results.length; i < count; i++) {
                                tweets.push(mapTweet(results[i]));
                            }


                            /* set user tweets to newest*/
                            var tweets_changed = app.utils.isChanged(app.users[screen_name].tweets, tweets);
                            if (tweets_changed) {
                                sdk.log.info({ 'text': 'update user tweets', 'data': tweets, 'type': ' service ', 'method': 'callback' });
                                app.users[screen_name].tweets = tweets;
                            }
                            if (tweets_changed || info_changed) {
                                sdk.log.info({ 'text': 'user info or user tweets changed. action: post chanage event', 'data': tweets, 'type': ' service ', 'method': 'callback' });
                                app.events.onDataChange();
                            }
                        } catch (ex) {
                            sdk.log.error({ 'text': 'processing responce cause to exception', 'data': { 'exception': ex }, 'type': ' service ', 'method': 'callback' });
                        }
                    }
                    , function (data) {
                        sdk.log.info({ 'text': 'service instance created successfult', 'data': data, 'type': ' service ', 'method': 'cbSuccess callback' });
                    }
                    , function (data) {
                        sdk.log.error({ 'text': 'fail to start service', 'data': data, 'type': ' service ', 'method': 'cbFail callback' });
                    });

        } //method.start
        , 'update': function (screen_name, options) {
            sdk.log.info({ 'text': '', 'data': { 'screen_name': screen_name, 'options': options }, 'type': 'app.service', 'method': 'update' });
            var data = {
                'url': app.utils.getUserFeedUrl(screen_name)
                    , 'interval': config.active.feed.ttl
            };
            if (options && options.resetData) { //reset the service cached data
                data['data'] = '{}';
            }
            conduit.advanced.services.updateService(app.service.getServiceName(screen_name)
                    , data
                    , function (data) {
                        sdk.log.info('service[{0}] instance update successfull'.format(screen_name), data);
                    }
                    , function (data) {
                        sdk.log.error('fail to update service[{0}]'.format(screen_name));
                    });


        } //method.start
        , 'invoke': function (screen_name) {
            sdk.log.info({ 'text': '', 'data': { 'screen_name': screen_name }, 'type': 'app.service', 'method': 'invoke' });
            conduit.advanced.services.invokeService(
                        app.service.getServiceName(screen_name)
                        , function (data) {
                            sdk.log.info('service[{0}] invoke successfull'.format(screen_name), data);
                        }
                        , function (data) {
                            sdk.log.error('service[{0}] invoke fail'.format(screen_name));
                        });

        }
    }//ns.service
    , 'utils': {
        'createUserInfo': function (item) {
            return {
                'id': item.id || 0,
                'name': item.name || item.screen_name,
                'screen_name': item.screen_name,
                'description': item.description || '',
                'avatar': item.avatar || 'http://a1.twimg.com/sticky/default_profile_images/default_profile_6_normal.png',
                'location': item.location || '',
                'url': item.url || '',
                'followers': item.followers || 0
            };
        } //function
        , 'updateUserInfo': function (item, update) {
            if (!update) { return item; }
            item.id = update.id || item.id;
            item.name = update.name || item.name;
            item.description = update.description || item.description;
            item.avatar = update.avatar || item.avatar;
            item.location = update.location || item.location;
            item.url = update.url || item.url;
            item.followers = update.followers || item.followers;
            return item;
        } //method
        , 'getUserFeedUrl': function (screen_name) {
            var url = 'http://search.twitter.com/search.json?q=from:' + screen_name;
            sdk.log.info({ 'text': 'service url for user[{0}]'.format(screen_name), 'data': { 'url': url }, 'type': 'app.utils', 'method': 'getUserFeedUrl' });
            return url;
        } //method
        , 'getComData': function () {
            var data = { 'users': [], 'userTweets': [], 'tweets': [], 'lastSearch': '', 'lastUpdateCount': 0 };
            for (var k in app.users) {// no users info in store create stubs
                var info = app.users[k].info;
                if (!info) {
                    continue;
                }
                info = JSON.parse(JSON.stringify(info));
                info.screen_name = info.screen_name.toLowerCase();
                data.users.push(info);
                data.tweets = [].concat(data.tweets, app.users[k].tweets);
            } //for
            return data;
        } //method
        , 'removeTweets': function (screen_name) {
            sdk.log.info({ 'text': 'remove all tweets for user', 'data': { 'screen_name': screen_name }, 'type': 'app.utils', 'method': 'removeTweets' });
            var user = app.users[screen_name];
            if (!user) {
                sdk.log.warning({ 'text': 'no user[{0}] at users'.format(screen_name), 'data': { 'screen_name': screen_name, 'users': app.users }, 'type': 'app.utils', 'method': 'removeTweets' });
                return;
            }
            if (!user.tweets.length) {
                return;
            }
            user.filters.since_id = user.tweets[0].id;
            user.tweets = [];
            app.events.onDataChange();
            app.service.update(screen_name, { 'resetData': true });
            sdk.log.info({ 'text': 'all user tweets are removed', 'type': 'app.utils', 'method': 'removeTweets' });
        } //method
        , 'isChanged': function (tweets_a, tweets_b) {
            if (!tweets_a || !tweets_b) { return false; } //both is undefied 
            if (tweets_a && !tweets_b || !tweets_a && tweets_b) { // one of list is undefined
                return true;
            }
            if (!tweets_a.length && !tweets_b.length) { return false; } // both are empty lists

            if (tweets_a.length != tweets_b.length
                 || (tweets_a.length && tweets_b.length
                      && tweets_a[0].id != tweets_b[0].id)) {
                return true;
            }
            /*TODO: compare each tweet id and text content*/
            for (var i = 0, count = tweets_a.length; i < count; i++) {
                if (tweets_a[i].id != tweets_b[i].id) {
                    return true;
                }
            }
            return false;
        }
    }//ns.utils    
};

function getTwitterUserInfo(users, data) {
    try {
        data = JSON.parse(data);
    }
    catch (e) {
        conduit.logging.logDebug('Twitter/bgpage.js/getTwitterUserInfo - received wrong data: ' + data);
        data = "";
    }
    for (var k in users) {// no users info in store create stubs
        var screen_name = users[k].toLowerCase();
        app.users[screen_name] = {};
        app.users[screen_name].info = app.utils.createUserInfo({ 'screen_name': screen_name });
        app.users[screen_name].tweets = [];
        app.users[screen_name].filters = {};
    } //for
    if (data) { //update users info by info cached at localstore 
        for (var k in users) {
            var screen_name = users[k].toLowerCase();
            if (!data[screen_name]) {
                continue;
            }
            app.utils.updateUserInfo(app.users[screen_name].info, data[screen_name].info);
            app.users[screen_name].tweets = data[screen_name].tweets || [];
            app.users[screen_name].filters = data[screen_name].filters || {};
        }
    } //if
    sdk.log.info({ 'text': 'app.users', 'data': app.users, 'type': 'conduit.app.getSettingsData /  conduit.storage.app.items.get ', 'method': 'callback' });

    var fixttl = function () {
        var h = 60 * 60 * 1000;
        var uc = 0;
        for (var k in app.users) {
            uc++;
        }
        if (config.defaults.feed.rph < ((h * uc) / config.active.feed.ttl)) {
            var ttl = (h * uc) / config.defaults.feed.ttl;
            sdk.log.info({ 'text': 'FIX tweets feed refresh interval to', 'data': ttl, 'type': 'conduit.app.getSettingsData', 'method': 'callback' });
            config.active.feed.ttl = ttl;
            config.active.feed.ttl_idle = config.active.feed.ttl;
        }
    };
    fixttl();


    /* start users feed services*/
    for (var k in app.users) {
        app.service.start(app.users[k].info.screen_name);
    }
    app.service.getExtraInfo(app.users);
    conduit.app.icon.setBadgeText(String(app.utils.getComData().tweets.length || ""));
}

conduit.app.getSettingsData(function (settings) {
    sdk.log.info({ 'data': settings, 'type': 'conduit.app.getSettingsData', 'method': 'callback' });
    if (!settings || !settings.data) {
        sdk.log.error({ 'text': 'No settings app settings. STOP app execution', 'type': 'conduit.app.getSettingsData', 'method': 'callback' });
        // TODO: no settings data
        return;
    } //if

    if (settings.data.generalUserInfo && settings.data.generalUserInfo.userRssIntervalMm) {
        var refresh_interval = settings.data.generalUserInfo.userRssIntervalMm * 60 * 1000;
        if (!isNaN(refresh_interval) && refresh_interval >= 60000) {
            sdk.log.info({ 'text': 'set tweets feed refresh interval', 'data': refresh_interval, 'type': 'conduit.app.getSettingsData', 'method': 'callback' });
            config.active.feed.ttl = refresh_interval;
            config.active.feed.ttl_idle = config.active.feed.ttl;
        }
    } //eob. set tweet feed interval

    if (!settings.data.followedUsers || !settings.data.followedUsers.user) {
        sdk.log.error({ 'text': 'No twitter accounts defined at app settings. STOP app execution', 'type': 'conduit.app.getSettingsData', 'method': 'callback' });
        // TODO: no tweeter user list in settings data
        return;
    } //if
    /* build the users list*/
    var users = [];
    if (settings.data.followedUsers.user instanceof Array) {
        if (!settings.data.followedUsers.user.length) {
            sdk.log.error({ 'text': 'Twitter accounts are empty list. STOP app execution', 'type': 'conduit.app.getSettingsData', 'method': 'callback' });
            return;
        }
        for (var i = 0, count = settings.data.followedUsers.user.length; i < count; i++) {
            var screen_name = settings.data.followedUsers.user[i].screenName;
            if (!screen_name) {
                sdk.log.warning({ 'text': 'Twitter accounts are empty list. skip this user.', data: { 'user': user[i] }, 'type': 'conduit.app.getSettingsData', 'method': 'callback' });
                continue;
            }
            users.push(settings.data.followedUsers.user[i].screenName);
        }
    } else {
        var screen_name = settings.data.followedUsers.user.screenName;
        if (screen_name) {
            users.push(screen_name);
        }
    }
    if (!users.length) {
        sdk.log.error({ 'text': 'It`s not valid twitter accounts. STOP app execution', 'type': 'conduit.app.getSettingsData', 'method': 'callback' });
        return;
        // TODO: no users 
    }

    /* setting are loaded */
    /* load user info from localstore */
    conduit.storage.app.items.get("twitter.usersInfo", function (data) {
        getTwitterUserInfo(users, data);
    }, function (e) { getTwitterUserInfo(users, ''); });

});

/* -  - */
conduit.messaging.onRequest.addListener("getTweets", function (data, sender, callback) {

    var response = app.utils.getComData();
    sdk.log.info({ 'text': 'call request callback with @response', 'data': response, 'type': 'conduit.messaging.onRequest["getTweets"]', 'method': 'callback' });
    callback(JSON.stringify(response));

});

/* -  - */
conduit.messaging.onRequest.addListener("refresh", function (data, sender, callback) {
    sdk.log.info("refesh tweets request", data);

    if (!data) {
        sdk.log.warning({ 'text': 'event has invalid data object', 'data': data, 'type': 'conduit.messaging.onRequest["refresh"]', 'method': 'event' });
        return;
    }

    if (typeof data == 'string') {
        try {
            data = JSON.parse(data);
        } catch (ex) {
            sdk.log.error({ 'text': 'can`t parse a @data object', 'data': ex, 'type': 'conduit.messaging.onRequest["refresh"]', 'method': 'callback' });
        }
    }

    var cmd = data.command;
    if (!cmd || !cmd.value) {
        sdk.log.info({ 'text': 'no command value', 'data': data, 'type': 'conduit.messaging.onRequest["refresh"]', 'method': 'callback' });
        return;
    }
    if (cmd.value == '%ALL%' || cmd.value == '%all%') {
        for (var k in app.users) {
            app.service.invoke(app.users[k].info.screen_name);
        }
    } else {
        var screen_name = cmd.value.toLowerCase();
        if (!app.users[screen_name]) {
            sdk.log.info({ 'text': 'no such user', 'data': data, 'type': 'conduit.messaging.onRequest["refresh"]', 'method': 'callback' });
            return;
        }
        app.service.invoke(screen_name);
    }
});

/* -  - */
conduit.messaging.onRequest.addListener("RemoveAllTweets", function (data, sender, callback) {

    sdk.log.info("remove tweets request", data);

    if (!data) {
        sdk.log.warning({ 'text': 'event has invalid data object', 'data': data, 'type': 'conduit.messaging.onRequest["RemoveAllTweets"]', 'method': 'event' });
        return;
    }

    if (typeof data == 'string') {
        try {
            data = JSON.parse(data);
        } catch (ex) {
            sdk.log.error({ 'text': 'can`t parse a @data object', 'data': ex, 'type': 'conduit.messaging.onRequest["RemoveAllTweets"]', 'method': 'callback' });
        }
    }

    var cmd = data.currentSelected.toLowerCase();
    if (cmd == 'deleteall') {
        for (var k in app.users) {
            app.utils.removeTweets(app.users[k].info.screen_name);
        }
    } else {
        var screen_name = cmd;
        app.utils.removeTweets(screen_name);
    }

});

/* -  - */
conduit.messaging.onRequest.addListener("sendUsage", function (obj, sender, callback) {
    if (typeof obj == 'string') {
        try {
            obj = JSON.parse(obj);
        } catch (ex) {
            sdk.log.error({ 'text': 'Exception at REQUEST["refresh"] flow.', 'data': ex, 'type': 'conduit.messaging.onRequest["refresh"]', 'method': 'callback' });
        }
    }

    if (!obj || !obj.usage || !obj.usage.key) {
        return;
    }
    var key = obj.usage.key;
    var data = obj.usage.data || {};
    conduit.logging.usage.log(key, data);
});
conduit.messaging.onRequest.addListener("popup-opened", function (obj, sender, callback) {
    if (!config.defaults.feed.ttl_fast_enabled) {
        return;
    }
    /*add on close listener*/
    if (typeof obj == 'string') {
        try {
            obj = JSON.parse(obj);
        } catch (ex) {
            sdk.log.error({ 'text': 'Exception at REQUEST["popup-opened"] flow.', 'data': ex, 'type': 'conduit.messaging.onRequest["popup-closed"]', 'method': 'callback' });
        }
    }
    if (!obj || !obj.pid) {
        sdk.log.warning({ 'text': 'no popupid defined. can`t add popup.onClose listener', 'data': obj, 'type': 'conduit.messaging.onRequest["popup-closed"]', 'method': 'callback' });
        return;
    }
    conduit.app.popup.onClosed.addListener(obj.pid, function () {
        try {
            config.active.popup.counter--;
            if (config.active.popup.counter) {
                sdk.log.info({ 'text': 'still have opened popups', 'data': {}, 'type': 'popup-close', 'method': 'event listener' });
                return;
            }
            sdk.log.info({ 'text': 'popup closed set interval to ttl-idle ', 'type': 'popup-close', 'method': 'event listener' });
            config.active.feed.ttl = config.active.feed.ttl_idle;
            for (var k in app.users) {
                app.service.update(app.users[k].info.screen_name);
            }
        } catch (ex) {
            sdk.log.error({ 'text': 'Exception at REQUEST["popup-closed"] flow.', 'data': ex, 'type': 'conduit.messaging.onRequest["popup-closed"]', 'method': 'callback' });
        }
    });
    /* set popup counter*/
    config.active.popup.counter++;
    if (config.active.popup.counter > 1) {
        return;
    }
    /* update service interval */
    config.active.feed.ttl = config.defaults.feed.ttl_fast;
    for (var k in app.users) {
        app.service.update(app.users[k].info.screen_name);
    }
});