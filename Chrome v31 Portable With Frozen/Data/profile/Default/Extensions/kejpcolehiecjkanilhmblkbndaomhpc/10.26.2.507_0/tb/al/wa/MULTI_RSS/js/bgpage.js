sdk.log.setName('App/RSS/BG');
var forEachIn=sdk.forEachIn;
(function ($) {
    var generalData,
        feedsData,
		feedsMap = {},
        maxFeeds = 100,
        graceTime = 1000 * 10,
        domainArrayNoTS = ['yahoo.com'],
        maxInterval = 86400000, ////one daY
        keys = ["CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_MINUTES",
            "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_HOUR",
            "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_HOURS",
            "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_ONEDAY",
            "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_DAYS",
            "CTLP_STR_ID_RSS_REFRESH_TOOLTIP",
            "CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_TOOLTIP",
            "CTLP_STR_ID_RSS_MARK_ALL_AS_READ_TOOLTIP",
            "CTLP_STR_ID_RSS_MARK_ALL_AS_UNREAD_TOOLTIP",
            "CTLP_STR_ID_RSS_ADD_YOUR_COMMET_TO_BOX",
            "CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_TITLE",
            "CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_MESSAGE"],

        xml2jsonOptions = {
            rename: function (xmlTagName) {
                return conduit.utils.string.toCamelCase(xmlTagName, "_");
            },
            parser: function (value) {
                if (typeof (value) === "string") {
                    switch (value.toLowerCase()) {
                        case "true":
                            return true;
                        case "false":
                            return false;
                        default:
                            return value;
                    }
                }

                return value;
            }
        },
		continueTimeoutIdMap = {};

    function feedsCountsInfo(feeds){
        var stat={'total':0, 'unread':0};
        forEachIn(feeds,function(feed){
            if(!feed || !feed.data || !feed.data.item || !feed.data.item.length){
                return;
            }
            stat.total+=feed.data.item.length;
            forEachIn(feed.data.item,function(item){
                !item.isRead && stat.unread++;
            });
        });
        return stat;
    }//function

    function updateToolbarBadge(){
        var stat=feedsCountsInfo(feedsData);
        conduit.app.icon.setBadgeText(String(stat.unread || ''));
    }
    function postFeedDataChangeTopic() {
        conduit.messaging.postTopicMessage('onDataChange', JSON.stringify(feedsData));
    }
    function getFeedStorageKey(feedId) {
        return "feed_" + feedId;
    }

    function persistFeedsData(settingsFeedData) {
        settingsFeedData.lastUpdate = (new Date()).valueOf();
        conduit.storage.app.items.set(getFeedStorageKey(settingsFeedData.uniqueCompId), JSON.stringify(settingsFeedData));
    }

    function processRssContent(contentStr) {
        // Leave only new lines and paragraphs:
        var processed = contentStr.replace(/<[^>]+>/g, "").replace(/&lt;(.*)&gt;/g, "");
        if (processed.length > 165)
            processed = processed.slice(0, 163) + "&hellip;";
        return processed;
    }


    function setFeedTimer(settingsFeedData, callback) {
        sdk.log.info({'data':{'settingsFeedData':settingsFeedData},'method':'setFeedTimer','type':'bgpage'});
        if (continueTimeoutIdMap[settingsFeedData.uniqueCompId]) {
            clearTimeout(continueTimeoutIdMap[settingsFeedData.uniqueCompId]); //if timeout exist ,clear it
        }

        var refresh_period=1000 * 60 * Number(settingsFeedData.interval)||1;
		if(refresh_period>maxInterval){
		 refresh_period=maxInterval;//one daY
		}
        var nextIntervalDate = new Date(settingsFeedData.lastUpdate + refresh_period);
        var iIntervalMS = Date.parse(nextIntervalDate) - Date.parse(new Date()); //calculate the time less for next interval in milisecondes.
        iIntervalMS = (iIntervalMS <= 0) ? graceTime : iIntervalMS; //if time for next interval passed the next interval will be the default interval (graceTime) 15 mitues
        sdk.log.info({'text':'set feed initial graceTime','data':{'graceTime':iIntervalMS},'method':'setFeedTimer','type':'bgpage'});
        continueTimeoutIdMap[settingsFeedData.uniqueCompId] = setTimeout(function(){
            getData(settingsFeedData, callback);
            sdk.log.info({'text':'set feed refresh interval','data':{'refresh_period':refresh_period},'method':'setFeedTimer','type':'bgpage'});
            var set_feed_interval=function (){
                sdk.log.info({'text':'refresh feed data','data':{'settingsFeedData.link':settingsFeedData.link},'method':'setFeedTimer/set_feed_interval','type':'bgpage'});
                continueTimeoutIdMap[settingsFeedData.uniqueCompId] = setInterval(function () {
                        sdk.log.info({'text':'refresh feed data','data':{'settingsFeedData.link':settingsFeedData.link},'method':'setFeedTimer/setInterval callback','type':'bgpage'});
                        getData(settingsFeedData
                            ,function (fd, items){
                                var rcrp=1000 * 60 * Number(fd.interval);
                                if(rcrp!=refresh_period){
                                    refresh_period=rcrp;
                                    sdk.log.info({'text':'feed interval is updated, re-init feed interval timer','data':{'refresh_period':refresh_period,'interval-updated':rcrp},'method':'setFeedTimer','type':'bgpage'});
                                    clearTimeout(continueTimeoutIdMap[settingsFeedData.uniqueCompId]);
                                    set_feed_interval();
                                }
                                callback && callback(fd, items);
                            }

                        );
                    }
                    , refresh_period
                );
            };
            set_feed_interval();
        },iIntervalMS);

        //return true if the interval calculated value equals the default
        return iIntervalMS === graceTime;
    }

    function xmlToJson(xml) {
        return $.xml2json(xml);
    }

    //take the item description and check if there is src attribute inside.
    function checkIsImageExists(item) {
        var isMatch = item.description ? item.description.match(/src=\"([^\"\s]+\.(?:jpg|png|gif))\"/) : null;
        return isMatch;
    }

    function addTimeStamp(url){
        for(var i = 0; i < domainArrayNoTS.length; i++) {
            if(url.indexOf(domainArrayNoTS[i] >= 0)){
                return false; 
            }
        }
        return true;
    }

    function getFeedXmlData(url, callback) {
       if(!(/safari/i.test(navigator.userAgent)) && !(/Chrome/i.test(navigator.userAgent))){
            url = url.replace(new RegExp("&amp;", 'g'), "&");
            if(addTimeStamp(url)){
                url+= ((url.indexOf('?')!=-1)?'&ts=':'?ts=') + new Date().getTime();
            }
        }
        sdk.log.info({'text':'do conduit.network.httpRequest','data':{'url':url},'method':'getFeedXmlData','type':'bgpage'});
        conduit.network.httpRequest({ url: url }, function (xml, headers, code) {
            sdk.log.info({'text':'conduit.network.httpRequest callback','data':{'url':url,'code':code, 'headers':headers,'xml':xml },'method':'getFeedXmlData','type':'bgpage'});
            if (code != 200) {
                return;
            }
            if (xml && xml.length > 1) {
                    try {
                        xml = xml.replace("\ufeff", "").replace(/&auml;/g, "A").replace(/&oacute;/g, "o").replace(/&oacute/g, "o"); //replace bom, capital a, umlaut mark, small o, acute accent.
                        if (/<rss/.test(xml)) {

                            var data = xmlToJson(xml);

                            if (data && data.channel) {
                                var channelData = data.channel;
                                if (channelData && channelData.item && channelData.item.length > maxFeeds)
                                    channelData.item = channelData.item.slice(0, maxFeeds);

                                // Format contents:
                                if (channelData) {
                                    if (channelData.item) {
                                        if (!channelData.item.length) channelData.item = [channelData.item];
                                        for (var i = 0, count = channelData.item.length; i < count; i++) {
                                            var item = channelData.item[i],
												imgMatch = item.description ? item.description.match(/src=\"([^\"\s]+\.(?:jpg|png|gif))\"/i) : null;

                                            if (imgMatch) {
                                                item.image = imgMatch[1];
                                            } else if (item.image && item.image.url) {
                                                item.image = item.image.url;
                                            }

                                            if (item.shortDescription)
                                                item.shortDescription = processRssContent(item.shortDescription);

                                            if (item.description)
                                                item.description = processRssContent(item.description);
                                        }
                                    }
                                    else {
                                        channelData.item = [];
                                    }

                                    callback(channelData);
                                }
                            }
                        }
                        //atom feeds format.
                        else if (/<feed/.test(xml)) {

                            var data = xmlToJson(xml);

                            var channelData = {
                                item: []
                            };

                            if (data && data.entry) {

                                var itemsArray = data.entry,
									len = itemsArray.length;

                                for (var i = 0; i < len; i++) {
                                    var item = itemsArray[i];

                                    //get the data and build an item object like the rss structure.
                                    //depending on the feed format different properties can be found.
                                    var newItem = {
                                        description: item.summary || item.content || '',
                                        link: item.link.href || item.link[0].href,
                                        title: item.title,
                                        pubDate: item.modified || item.updated
                                    };

                                    //set image if exists.
                                    var imgMatch = checkIsImageExists(newItem);
                                    if (imgMatch) {
                                        newItem.image = imgMatch[1];
                                    }
                                    //remove from description all html tags and make sure length is ok.
                                    newItem.description = processRssContent(newItem.description);
                                    channelData.item.push(newItem)
                                }
                            }

                            callback(channelData);
                        }
                        else if (/<rdf/.test(xml)) {
                            var data = xmlToJson(xml);
                            var channelData = {
                                item: []
                            };
                            if (data && data.item) {
                                var itemsArray = data.item,
								len = itemsArray.length;
                                for (var i = 0; i < len; i++) {
                                    var item = itemsArray[i];

                                    //get the data and build an item object like the rss structure.
                                    //depending on the feed format different properties can be found.
                                    var newItem = {
                                        description: item.description || item.fullText || '',
                                        link: item.link,
                                        title: item.title,
                                        pubDate: item.date
                                    };

                                    //set image if exists.
                                    var imgMatch = checkIsImageExists(newItem);
                                    if (imgMatch) {
                                        newItem.image = imgMatch[1];
                                    }
                                    //remove from description all html tags and make sure length is ok.
                                    newItem.description = processRssContent(newItem.description);
                                    channelData.item.push(newItem)
                                }
                            }
                            callback(channelData);
                        }
                    }
                    catch (e) {
                        // failed to parse the xml to json
                    }
                }

        });
    }

    function getData(settingsFeedData, callback) {
        getFeedXmlData(settingsFeedData.link, function (feedData) {
            if (!feedData) {
                callback && callback();
                return;
            }
            if (settingsFeedData.data) {
                if (feedData.item && feedData.item.length > 0) {
                    for (var i = feedData.item.length - 1; i >= 0; --i) {
                        var newItem = feedData.item[i]; // Add to data only new items!
                        for (var j = 0, count = settingsFeedData.data.item.length, found = false; j < count && !found; j++) {
                            var existingItem = settingsFeedData.data.item[j];
                            if ((existingItem.guid && getItemGuid(existingItem) === getItemGuid(newItem)) || (existingItem.link && existingItem.link === newItem.link) || (existingItem.title && existingItem.title === newItem.title)) {
                                found = true;
                                feedData.item.splice(i, 1);
                            }
                        }
                        // Add to data only new items that were not deleted by the user!

                        if (settingsFeedData.data.deletedItems) {
                            var deletedItems = settingsFeedData.data.deletedItems;
                            var deletedItem, found = false;
                            for (index in deletedItems) {
                                deletedItem = deletedItems[index];
                                if ((deletedItem.guid && deletedItem.guid === getItemGuid(newItem)) || (deletedItem.link && deletedItem.link === newItem.link) || (deletedItem.title && deletedItem.title === newItem.title)) {
                                    feedData.item.splice(i, 1);
                                    found = true;
                                }
                                if (found) break;
                            }
                        }
                    }
                    settingsFeedData.data.item = feedData.item.concat(settingsFeedData.data.item);
                }
            }
            else{
                settingsFeedData.data = feedData;
            }

            persistFeedsData(settingsFeedData);
            postFeedDataChangeTopic();
            updateToolbarBadge();

            //if newly received RSS contains different TTL then old TTL/interval, update the interval

            if ("ttl" in feedData && !isNaN(feedData.ttl) && feedData.ttl != settingsFeedData.interval && feedData.ttl > 0){
                settingsFeedData.interval = feedData.ttl;
            }

            if (settingsFeedData.interval == undefined) {
                settingsFeedData.interval = 15; // Grace time of 15 minutes in case there is no interval.
            }

            if (callback)
                callback(settingsFeedData, feedData.item);

        });
    }

    // Starts the process of getting new data for a feed. Receives the settings data for the feed and a callback to call with the retrieved data.
    // callback: function(feedData, newItems) - feedData is the whole data for the feed, while newItems is an array of retrieved items that were
    // added in this call.
    function updateFeed(settingsFeedData, forceRefresh, callback) {
        // Get new data if none is cached, forceRefresh has been specified or the interval is due.
        if (!settingsFeedData.data || forceRefresh) {
            getData(settingsFeedData, callback);
        }
        else if (!setFeedTimer(settingsFeedData, callback) && callback)
            callback(settingsFeedData, settingsFeedData.data.item);
    }

    conduit.messaging.onRequest.addListener("getFeeds", function (data, sender, callback) {
        callback(JSON.stringify(feedsData));
    });

    conduit.messaging.onRequest.addListener("getTranslation", function (data, sender, callback) {
        conduit.advanced.localization.getKey(keys, function (data) {
            callback(JSON.stringify(data));
        });
    });

    conduit.messaging.onRequest.addListener("getGeneralData", function (data, sender, callback) {
        callback(JSON.stringify(generalData));
    });

    conduit.messaging.onRequest.addListener("refresh", function (data, sender, callback) {
        try {
            data = JSON.parse(data);
        }
        catch (e) { 
            conduit.logging.logDebug('RssClassic/bgpage.js/addListener for "refresh" - received wrong data: ' + data);
        }
        forEachIn(feedsData, function (feedData) {
            if (feedData.uniqueCompId != data.feedId) {
                return;
            }
            updateFeedAndBadge(feedData, true, callback);
            return false;
        });
    });

    conduit.messaging.onRequest.addListener("toggleRead", function (data, sender, callback) {
        try {
            data = JSON.parse(data);
        }
        catch (e) { 
            conduit.logging.logDebug('RssClassic/bgpage.js/addListener for "toggleRead" - received wrong data: ' + data);
        }
        forEachIn(feedsData, function (feed) {
            if (feed.uniqueCompId != data.feedId) {
                return;
            }
            if (data.itemIndex != null && feed.data.item[data.itemIndex]) {
                feed.data.item[data.itemIndex].isRead = data.isRead;
            }
            else {
                forEachIn(feed.data.item, function (item) {
                    item.isRead = data.isRead;
                });
            }
            persistFeedsData(feed);
            postFeedDataChangeTopic();
            updateToolbarBadge();
            return false;
        });
    });

    function getItemGuid(item) {
        if (item.guid) {
            return typeof (item.guid) == "string" ? item.guid : item.guid.text;
        }
        return "";
    }

    conduit.messaging.onRequest.addListener("delete", function (data, sender, callback) {
        var deletedItems;
        var item;
        var guid, decreaseFromBadge = 0;
        try {
            data = JSON.parse(data);
        }
        catch (e) { 
            conduit.logging.logDebug('RssClassic/bgpage.js/addListener for "delete" - received wrong data: ' + data);
        }
        for (var i = 0, count = feedsData.length, found = false; i < count && !found; i++) {
            var feedData = feedsData[i];
            if (feedData.uniqueCompId === data.feedId) {
                found = true;
                deletedItems = feedData.data.deletedItems ? feedData.data.deletedItems : [];
                if (data.itemIndex != null) {
                    item = feedData.data.item[data.itemIndex];
                    feedData.data.item.splice(data.itemIndex, 1);
                    if (!(item.isRead && item.isRead == true)) {
                        // only if the item is not marked as read
                        decreaseFromBadge = -1;
                    }
                    else {
                        decreaseFromBadge = null;
                    }
                    guid = getItemGuid(item);
                    deletedItems.push({ guid:guid, link:item.link, title:item.title });
                }
                else {
                    for (var j = 0, itemCount = feedData.data.item.length; j < itemCount; j++) {
                        item = feedData.data.item[j];
                        if (!(item.isRead && item.isRead == true)) {
                            // only if the item is not marked as read				
                            decreaseFromBadge += -1;
                        }
                        guid = getItemGuid(item);
                        deletedItems.push({ guid:guid, link:item.link, title:item.title });
                    }
                    //clear the item array
                    feedData.data.item = [];
                }

                feedData.data.deletedItems = deletedItems;
                persistFeedsData(feedData);
                postFeedDataChangeTopic();
                updateToolbarBadge();
                callback(String(decreaseFromBadge || ''));
            }
        }
    });

    function updateFeedAndBadge(settingsFeedData, forceRefresh, callback) {
        updateFeed(settingsFeedData, forceRefresh, function (feedData, newItems) {

            newItems && updateToolbarBadge();
            callback && callback(JSON.stringify(newItems));

        }
        );
    }

    function prepareSetFeed(feedIndex) {

        if (isNaN(feedIndex)) return;

        return function (data) {
            if (typeof (data) === 'string') {
                try {
                    data = JSON.parse(data);
                }
                catch (e) {
                    conduit.logging.logDebug('RssClassic/bgpage.js/prepareSetFeed - received wrong data: ' + data); 
                    data = ""; 
                }
            }
            var settingsFeedData;
            if (data && !data.errorCode) {
                settingsFeedData = feedsData[feedIndex] = data;

                //take the TTL as new interval if exists
                if ("ttl" in settingsFeedData.data && !isNaN(settingsFeedData.data.ttl) && settingsFeedData.data.ttl > 0)
                    settingsFeedData.interval = settingsFeedData.data.ttl;
            }
            else
                settingsFeedData = feedsData[feedIndex];

            feedsMap[settingsFeedData.uniqueCompId] = feedIndex;

            updateFeedAndBadge(settingsFeedData, false);
            updateToolbarBadge();
        };
    }


    conduit.app.getSettingsData(function (settings) {

        if (!settings || typeof (settings) != "object" || !settings.data) return;

        var settingsData = settings.data;
        generalData = { appTitle:settings.displayText || "" };

        feedsData = settingsData.listOfRssFeeds ? settingsData.listOfRssFeeds.rssFeedItem : [
            { uniqueCompId:settings.appId, link:settingsData.link}
        ];

        for (var i = 0, count = feedsData.length; i < count; i++) {
            var settingsFeedData = feedsData[i];
            conduit.storage.app.items.get(getFeedStorageKey(settingsFeedData.uniqueCompId), prepareSetFeed(i), prepareSetFeed(i));
        }
    });
})(jQuery);

